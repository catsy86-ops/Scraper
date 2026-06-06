/**
 * Vercel Serverless Function — ZDiTM Szczecin API Proxy
 * Real-time departures (virtual board) for trams & buses.
 *
 * Endpoint: /api/zditm-departures?stops=Łucznicza,Tarczowa
 *
 * ZDiTM API (HTTPS):
 *   - Stops:      https://www.zditm.szczecin.pl/api/v1/stops
 *   - Departures: https://www.zditm.szczecin.pl/api/v1/displays/{stop_number}
 */

const API_BASE = 'https://www.zditm.szczecin.pl/api/v1';

// fetch with timeout via AbortController + retry logic
async function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SzczecinGuide/1.0 (+https://szn-theta.vercel.app)',
        'Accept': 'application/json',
      },
    });
  } finally {
    clearTimeout(id);
  }
}

// Retry wrapper — tries up to `retries` times with exponential backoff
async function fetchWithRetry(url, { timeout = 10000, retries = 2, backoff = 1000 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeout);
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
    }
  }
  throw lastError;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=20');

  try {
    const { stops } = req.query;
    const stopList = stops
      ? (Array.isArray(stops) ? stops : String(stops).split(','))
      : ['Łucznicza', 'Tarczowa'];

    // 1) Fetch all stops to resolve names → stop numbers (with retry)
    let allStops = [];
    try {
      const stopsRes = await fetchWithRetry(`${API_BASE}/stops`, { timeout: 10000, retries: 2 });
      const stopsData = await stopsRes.json();
      allStops = stopsData.data || [];
    } catch (e) {
      console.warn('Stops fetch failed after retries:', e.message);
    }

    if (!allStops.length) {
      return res.status(200).json({
        source: 'simulated',
        message: 'ZDiTM stops API unavailable',
        departures: generateSimulatedDepartures(),
      });
    }

    // 2) Match stops by name (case-insensitive, partial)
    const matchingStops = allStops.filter(s =>
      stopList.some(name => s.name?.toLowerCase().includes(name.trim().toLowerCase()))
    );

    if (!matchingStops.length) {
      return res.status(200).json({
        source: 'simulated',
        message: 'No matching stops in ZDiTM database',
        departures: generateSimulatedDepartures(),
      });
    }

    // 3) Fetch departures for up to 4 matching stops
    const allDepartures = [];
    await Promise.all(
      matchingStops.slice(0, 4).map(async stop => {
        try {
          const depRes = await fetchWithRetry(`${API_BASE}/displays/${stop.number}`, { timeout: 10000, retries: 1 });
          if (!depRes.ok) return;
          const depData = await depRes.json();
          (depData.departures || []).slice(0, 6).forEach(dep => {
            const minsLeft = computeMins(dep);
            if (minsLeft == null) return;
            allDepartures.push({
              line: String(dep.line_number || ''),
              type: guessType(dep.line_number),
              dest: dep.direction || 'Nieznany kierunek',
              stop: stop.name,
              minsLeft,
              realtime: dep.time_real != null,
            });
          });
        } catch (e) {
          console.warn(`Departures fetch failed for ${stop.number}:`, e.message);
        }
      })
    );

    if (allDepartures.length) {
      allDepartures.sort((a, b) => a.minsLeft - b.minsLeft);
      return res.status(200).json({
        source: 'zditm-real',
        timestamp: new Date().toISOString(),
        departures: allDepartures.slice(0, 20),
      });
    }

    return res.status(200).json({
      source: 'simulated',
      message: 'No real-time departures available',
      departures: generateSimulatedDepartures(),
    });

  } catch (err) {
    console.error('Proxy error:', err);
    // Always 200 + simulated so the app never breaks
    return res.status(200).json({
      source: 'simulated',
      error: err.message,
      departures: generateSimulatedDepartures(),
    });
  }
}

// Convert ZDiTM departure to minutes-from-now
function computeMins(dep) {
  if (typeof dep.time_real === 'number') return Math.max(0, dep.time_real);
  if (dep.time_scheduled) {
    // "HH:MM" → minutes from now (same day)
    const [h, m] = String(dep.time_scheduled).split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const now = new Date();
      const dep2 = new Date(now);
      dep2.setHours(h, m, 0, 0);
      let mins = Math.round((dep2 - now) / 60000);
      if (mins < -60) mins += 24 * 60; // wrap past midnight
      return Math.max(0, mins);
    }
  }
  return null;
}

// Tram lines in Szczecin are 1–12; everything else treated as bus
function guessType(lineNumber) {
  const n = parseInt(lineNumber, 10);
  return (Number.isFinite(n) && n >= 1 && n <= 12) ? 'tram' : 'bus';
}

/**
 * Realistic simulated departures fallback — uses REAL lines (89, 69 → Kołłątaja)
 */
function generateSimulatedDepartures() {
  const LINES = [
    { num: '89', type: 'bus', dest: 'Kołłątaja' },
    { num: '69', type: 'bus', dest: 'Kołłątaja' },
  ];
  const STOPS = ['Łucznicza'];
  const departures = [];

  LINES.forEach(line => {
    let baseMins = 1 + Math.floor(Math.random() * 6);
    for (let i = 0; i < 4; i++) {
      departures.push({
        line: line.num,
        type: line.type,
        dest: line.dest,
        stop: STOPS[0],
        minsLeft: baseMins,
        realtime: false,
      });
      baseMins += 10;
    }
  });

  departures.sort((a, b) => a.minsLeft - b.minsLeft);
  return departures.slice(0, 20);
}
