/**
 * zditm-live.js — Wspólny klient ZDiTM Szczecin (REAL-TIME)
 *
 * ZDiTM API wysyła nagłówek `Access-Control-Allow-Origin: *`, więc można
 * je wołać BEZPOŚREDNIO z przeglądarki — bez proxy, działa też na localhost.
 *
 * Endpointy:
 *   GET /api/v1/stops              → lista przystanków
 *   GET /api/v1/displays/{number}  → tablica odjazdów (real-time)
 *   GET /api/v1/vehicles           → pozycje GPS wszystkich pojazdów
 *
 * Moduł cache'uje dane przystanków (zmieniają się rzadko) i udostępnia
 * jedno źródło prawdy dla live.js i map-vehicles.js.
 */
'use strict';

const ZDiTM = (() => {
  const BASE = 'https://www.zditm.szczecin.pl/api/v1';

  // Przystanki w okolicy Łuczniczej (potwierdzone w API: 15111, 15112)
  // "Tarczowa" nie istnieje w ZDiTM — najbliższe to Łucznicza + sąsiednie.
  const NEARBY_STOP_NUMBERS = ['15111', '15112'];
  const NEARBY_STOP_NAMES = ['Łucznicza'];

  // Tramwaje w Szczecinie: linie 1-12. Wszystko inne = autobus.
  function vehicleTypeFromLine(line) {
    const n = parseInt(line, 10);
    return (Number.isFinite(n) && n >= 1 && n <= 12) ? 'tram' : 'bus';
  }

  // Kolory linii (tramwaje czerwone, nocne ciemne, dzienne niebieskie)
  function lineColor(line, type) {
    if (type === 'tram') return '#e74c3c';
    if (/^N/i.test(String(line))) return '#2c3e50';
    return '#2980b9';
  }

  // ---- fetch z timeout + retry ----
  async function fetchJSON(url, { timeout = 9000, retries = 2 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), timeout);
      try {
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(id);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        clearTimeout(id);
        lastErr = e;
        if (attempt < retries) await new Promise(r => setTimeout(r, 700 * (attempt + 1)));
      }
    }
    throw lastErr;
  }

  // ---- cache przystanków ----
  let stopsCache = null;
  let stopsCacheTime = 0;
  const STOPS_TTL = 24 * 60 * 60 * 1000; // 24h

  async function getStops() {
    const now = Date.now();
    if (stopsCache && (now - stopsCacheTime) < STOPS_TTL) return stopsCache;

    // Spróbuj z IndexedDB (offline)
    if (window.OfflineStore) {
      const cached = await OfflineStore.get('zditm_stops');
      if (cached) { stopsCache = cached; stopsCacheTime = now; return cached; }
    }

    const data = await fetchJSON(`${BASE}/stops`);
    stopsCache = data.data || [];
    stopsCacheTime = now;
    if (window.OfflineStore) OfflineStore.set('zditm_stops', stopsCache, STOPS_TTL);
    return stopsCache;
  }

  // ---- ODJAZDY (real-time) ----
  // Zwraca: [{ line, type, dest, stop, minsLeft, realtime, color, time }]
  async function getDepartures(stopNumbers = NEARBY_STOP_NUMBERS) {
    const all = [];

    await Promise.all(stopNumbers.map(async (num) => {
      try {
        const data = await fetchJSON(`${BASE}/displays/${num}`, { timeout: 8000, retries: 1 });
        const stopName = data.stop_name || '';
        (data.departures || []).forEach(dep => {
          const minsLeft = computeMins(dep);
          if (minsLeft == null) return;
          const line = String(dep.line_number || '');
          const type = vehicleTypeFromLine(line);
          all.push({
            line,
            type,
            dest: dep.direction || 'Nieznany kierunek',
            stop: stopName,
            minsLeft,
            realtime: dep.time_real != null,
            color: lineColor(line, type),
            time: clockFromMins(minsLeft)
          });
        });
      } catch (e) {
        console.warn(`ZDiTM departures ${num} failed:`, e.message);
      }
    }));

    all.sort((a, b) => a.minsLeft - b.minsLeft);

    // Cache dla trybu offline
    if (all.length && window.OfflineStore) {
      OfflineStore.set('zditm_departures', all, 5 * 60 * 1000);
    }

    return all;
  }

  function computeMins(dep) {
    // time_real = minuty do odjazdu (real-time z GPS)
    if (typeof dep.time_real === 'number') return Math.max(0, dep.time_real);
    // time_scheduled = "HH:MM" rozkładowe
    if (dep.time_scheduled) {
      const [h, m] = String(dep.time_scheduled).split(':').map(Number);
      if (Number.isFinite(h) && Number.isFinite(m)) {
        const now = new Date();
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        let mins = Math.round((d - now) / 60000);
        if (mins < -120) mins += 24 * 60; // po północy
        return Math.max(0, mins);
      }
    }
    return null;
  }

  function clockFromMins(mins) {
    const t = new Date(Date.now() + mins * 60000);
    return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }

  // ---- POJAZDY (GPS real-time) ----
  // Zwraca: [{ id, line, type, lineType, direction, nextStop, previousStop,
  //            lat, lon, bearing, velocity, punctuality, model, lowFloor, stuck }]
  async function getVehicles() {
    const data = await fetchJSON(`${BASE}/vehicles`, { timeout: 9000, retries: 1 });
    const vehicles = (data.data || []).map(v => ({
      id: v.vehicle_id,
      line: String(v.line_number || ''),
      type: v.vehicle_type === 'tram' ? 'tram' : 'bus',
      lineType: v.line_type || 'day',
      direction: v.direction || '',
      nextStop: v.next_stop || '',
      previousStop: v.previous_stop || '',
      lat: v.latitude,
      lon: v.longitude,
      bearing: v.bearing,
      velocity: v.velocity || 0,
      punctuality: v.punctuality || 0,
      model: v.vehicle_model || '',
      lowFloor: !!v.vehicle_low_floor,
      stuck: !!v.stuck,
      operator: v.vehicle_operator || ''
    })).filter(v => v.lat && v.lon);

    if (vehicles.length && window.OfflineStore) {
      OfflineStore.set('zditm_vehicles', vehicles, 60 * 1000);
    }

    return vehicles;
  }

  // Pojazdy w pobliżu punktu (promień w metrach)
  function filterNearby(vehicles, lat, lon, radiusM = 1200) {
    return vehicles.filter(v => {
      const d = haversine(lat, lon, v.lat, v.lon);
      return d <= radiusM;
    });
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return {
    BASE,
    NEARBY_STOP_NUMBERS,
    NEARBY_STOP_NAMES,
    getStops,
    getDepartures,
    getVehicles,
    filterNearby,
    vehicleTypeFromLine,
    lineColor,
  };
})();

window.ZDiTM = ZDiTM;
