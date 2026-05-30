/* ===== LIVE DATA MODULE — Szczecin Guide =====
 * APIs używane (wszystkie bezpłatne, bez klucza):
 *  - Open-Meteo (pogoda + prognoza + jakość powietrza + wschód/zachód słońca)
 *  - Nominatim (geocoding)
 *  - Symulacja ZDiTM (rozkład jazdy — brak publicznego GTFS-RT API)
 * ============================================= */
'use strict';

// Szczecin — ul. Łucznicza
const LAT = 53.4025;
const LON = 14.5520;

// ===== WMO WEATHER CODES =====
const WMO = {
  0:  { icon: '☀️',  desc: 'Bezchmurnie' },
  1:  { icon: '🌤️', desc: 'Przeważnie słonecznie' },
  2:  { icon: '⛅',  desc: 'Częściowe zachmurzenie' },
  3:  { icon: '☁️',  desc: 'Pochmurno' },
  45: { icon: '🌫️', desc: 'Mgła' },
  48: { icon: '🌫️', desc: 'Szron' },
  51: { icon: '🌦️', desc: 'Lekka mżawka' },
  53: { icon: '🌦️', desc: 'Mżawka' },
  55: { icon: '🌧️', desc: 'Intensywna mżawka' },
  61: { icon: '🌧️', desc: 'Lekki deszcz' },
  63: { icon: '🌧️', desc: 'Deszcz' },
  65: { icon: '🌧️', desc: 'Intensywny deszcz' },
  71: { icon: '🌨️', desc: 'Lekki śnieg' },
  73: { icon: '❄️',  desc: 'Śnieg' },
  75: { icon: '❄️',  desc: 'Intensywny śnieg' },
  80: { icon: '🌦️', desc: 'Przelotne opady' },
  81: { icon: '🌧️', desc: 'Deszcz przelotny' },
  82: { icon: '⛈️',  desc: 'Gwałtowne opady' },
  95: { icon: '⛈️',  desc: 'Burza' },
  96: { icon: '⛈️',  desc: 'Burza z gradem' },
  99: { icon: '⛈️',  desc: 'Silna burza z gradem' },
};

const DAYS_PL = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
const MONTHS_PL = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
const MONTHS_SHORT = ['STY','LUT','MAR','KWI','MAJ','CZE','LIP','SIE','WRZ','PAŹ','LIS','GRU'];

// ===== STATE =====
const live = {
  weather: null,
  aqi: null,
  forecast: null,
  sun: null,
  lastWeatherFetch: 0,
  lastAqiFetch: 0,
  tickerItems: [],
  clockInterval: null,
  weatherInterval: null,
  aqiInterval: null,
  transportInterval: null,
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Wait for app to be visible
  const waitForApp = setInterval(() => {
    if (!document.getElementById('app').classList.contains('hidden')) {
      clearInterval(waitForApp);
      initLive();
    }
  }, 300);
});

function initLive() {
  startClock();
  fetchWeather();
  fetchAqi();
  generateTransportDepartures();
  buildTicker();

  // Auto-refresh intervals
  live.weatherInterval = setInterval(fetchWeather, 10 * 60 * 1000);   // 10 min
  live.aqiInterval     = setInterval(fetchAqi, 15 * 60 * 1000);       // 15 min
  live.transportInterval = setInterval(generateTransportDepartures, 60 * 1000); // 1 min

  // Live transport panel
  document.getElementById('liveTransportBtn').addEventListener('click', () => {
    const panel = document.getElementById('liveTransportPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) generateTransportDepartures();
  });
  document.getElementById('ltpClose').addEventListener('click', () => {
    document.getElementById('liveTransportPanel').classList.add('hidden');
  });
  document.getElementById('ltpRefresh').addEventListener('click', generateTransportDepartures);

  // Live section refresh buttons
  document.getElementById('refreshWeather').addEventListener('click', () => {
    live.lastWeatherFetch = 0;
    fetchWeather();
  });
  document.getElementById('refreshAqi').addEventListener('click', () => {
    live.lastAqiFetch = 0;
    fetchAqi();
  });
  document.getElementById('refreshTransport').addEventListener('click', generateTransportDepartures);
}

// ===== CLOCK =====
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clockTime').textContent = `${h}:${m}:${s}`;

    const day = now.getDate();
    const month = MONTHS_PL[now.getMonth()];
    const year = now.getFullYear();
    const dayName = DAYS_PL[now.getDay()];
    document.getElementById('clockDate').textContent = `${dayName}, ${day} ${month} ${year}`;
  }
  tick();
  live.clockInterval = setInterval(tick, 1000);
}

// ===== WEATHER API (Open-Meteo — bezpłatne, bez klucza) =====
async function fetchWeather() {
  const now = Date.now();
  if (now - live.lastWeatherFetch < 5 * 60 * 1000) return; // cache 5 min
  live.lastWeatherFetch = now;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,` +
      `weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,` +
      `precipitation_sum,uv_index_max` +
      `&timezone=Europe%2FWarsaw&forecast_days=7`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();

    live.weather = data.current;
    live.forecast = data.daily;
    live.sun = { sunrise: data.daily.sunrise[0], sunset: data.daily.sunset[0] };

    renderWeatherWidget(data.current);
    renderWeatherFull(data.current);
    renderForecast(data.daily);
    renderSunTimes(data.daily.sunrise[0], data.daily.sunset[0]);
    updateTicker();

  } catch (err) {
    console.warn('Weather fetch failed:', err);
    renderWeatherError();
  }
}

function renderWeatherWidget(c) {
  const wmo = WMO[c.weather_code] || { icon: '🌡️', desc: 'Nieznane' };
  const windDir = getWindDir(c.wind_direction_10m);

  document.getElementById('weatherLoading').classList.add('hidden');
  document.getElementById('weatherData').classList.remove('hidden');
  document.getElementById('wIcon').textContent = c.is_day ? wmo.icon : '🌙';
  document.getElementById('wTemp').textContent = `${Math.round(c.temperature_2m)}°C`;
  document.getElementById('wFeels').textContent = `odczuwalna ${Math.round(c.apparent_temperature)}°C`;
  document.getElementById('wDesc').textContent = wmo.desc;
  document.getElementById('wWind').textContent = `💨 ${Math.round(c.wind_speed_10m)} km/h ${windDir}`;
  document.getElementById('wHumidity').textContent = `💧 ${c.relative_humidity_2m}%`;
  document.getElementById('wPressure').textContent = `🌡️ ${Math.round(c.surface_pressure)} hPa`;
  document.getElementById('wUV').textContent = `☀️ UV ${c.uv_index}`;

  const now = new Date();
  document.getElementById('wUpdated').textContent =
    `Aktualizacja: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function renderWeatherFull(c) {
  const wmo = WMO[c.weather_code] || { icon: '🌡️', desc: 'Nieznane' };
  const windDir = getWindDir(c.wind_direction_10m);
  const el = document.getElementById('liveWeatherFull');
  if (!el) return;

  el.innerHTML = `
    <div class="weather-main-row">
      <div class="weather-main-icon">${c.is_day ? wmo.icon : '🌙'}</div>
      <div>
        <div class="weather-main-temp">${Math.round(c.temperature_2m)}°C</div>
        <div class="weather-main-desc">${wmo.desc}</div>
        <div class="weather-main-loc">📍 Szczecin — ul. Łucznicza</div>
      </div>
    </div>
    <div class="weather-full-grid">
      <div class="wf-cell">
        <span class="wf-cell-icon">🌡️</span>
        <span class="wf-cell-val">${Math.round(c.apparent_temperature)}°C</span>
        <span class="wf-cell-label">Odczuwalna</span>
      </div>
      <div class="wf-cell">
        <span class="wf-cell-icon">💧</span>
        <span class="wf-cell-val">${c.relative_humidity_2m}%</span>
        <span class="wf-cell-label">Wilgotność</span>
      </div>
      <div class="wf-cell">
        <span class="wf-cell-icon">💨</span>
        <span class="wf-cell-val">${Math.round(c.wind_speed_10m)} km/h</span>
        <span class="wf-cell-label">Wiatr ${windDir}</span>
      </div>
      <div class="wf-cell">
        <span class="wf-cell-icon">🌡️</span>
        <span class="wf-cell-val">${Math.round(c.surface_pressure)} hPa</span>
        <span class="wf-cell-label">Ciśnienie</span>
      </div>
      <div class="wf-cell">
        <span class="wf-cell-icon">☀️</span>
        <span class="wf-cell-val">${c.uv_index}</span>
        <span class="wf-cell-label">Indeks UV</span>
      </div>
      <div class="wf-cell">
        <span class="wf-cell-icon">🌧️</span>
        <span class="wf-cell-val">${c.precipitation} mm</span>
        <span class="wf-cell-label">Opady</span>
      </div>
    </div>
  `;
}

function renderWeatherError() {
  const el = document.getElementById('liveWeatherFull');
  if (el) el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text2)">⚠️ Nie można pobrać danych pogodowych</div>`;
}

// ===== FORECAST =====
function renderForecast(daily) {
  const el = document.getElementById('liveForecast');
  if (!el) return;

  const maxTemp = Math.max(...daily.temperature_2m_max);
  const minTemp = Math.min(...daily.temperature_2m_min);
  const range = maxTemp - minTemp || 1;

  el.innerHTML = daily.weather_code.map((code, i) => {
    const wmo = WMO[code] || { icon: '🌡️' };
    const date = new Date(daily.time[i]);
    const dayName = i === 0 ? 'Dziś' : i === 1 ? 'Jutro' : DAYS_PL[date.getDay()];
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);
    const barW = Math.round(((max - minTemp) / range) * 100);

    return `
      <div class="forecast-row">
        <span class="forecast-day">${dayName}</span>
        <span class="forecast-icon">${wmo.icon}</span>
        <div class="forecast-bar"><div class="forecast-bar-fill" style="width:${barW}%"></div></div>
        <div class="forecast-temps">
          <span class="forecast-max">${max}°</span>
          <span class="forecast-min">${min}°</span>
        </div>
      </div>
    `;
  }).join('');
}

// ===== SUN TIMES =====
function renderSunTimes(sunriseISO, sunsetISO) {
  const el = document.getElementById('liveSunTimes');
  if (!el) return;

  const rise = new Date(sunriseISO);
  const set  = new Date(sunsetISO);
  const riseStr = `${String(rise.getHours()).padStart(2,'0')}:${String(rise.getMinutes()).padStart(2,'0')}`;
  const setStr  = `${String(set.getHours()).padStart(2,'0')}:${String(set.getMinutes()).padStart(2,'0')}`;

  const diffMs = set - rise;
  const diffH  = Math.floor(diffMs / 3600000);
  const diffM  = Math.floor((diffMs % 3600000) / 60000);

  el.innerHTML = `
    <div class="sun-cell">
      <div class="sun-cell-icon">🌅</div>
      <div class="sun-cell-time">${riseStr}</div>
      <div class="sun-cell-label">Wschód słońca</div>
    </div>
    <div class="sun-cell">
      <div class="sun-cell-icon">🌇</div>
      <div class="sun-cell-time">${setStr}</div>
      <div class="sun-cell-label">Zachód słońca</div>
    </div>
    <div class="sun-daylight">
      ☀️ Długość dnia: <strong>${diffH}h ${diffM}min</strong>
    </div>
  `;
}

// ===== AIR QUALITY API (Open-Meteo) =====
async function fetchAqi() {
  const now = Date.now();
  if (now - live.lastAqiFetch < 10 * 60 * 1000) return;
  live.lastAqiFetch = now;

  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}` +
      `&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone` +
      `&timezone=Europe%2FWarsaw`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('AQI API error');
    const data = await res.json();
    live.aqi = data.current;

    renderAqiWidget(data.current);
    renderAqiFull(data.current);
    updateTicker();

  } catch (err) {
    console.warn('AQI fetch failed:', err);
    renderAqiError();
  }
}

function getAqiInfo(aqi) {
  if (aqi <= 20)  return { label: 'Bardzo dobra', color: '#00e400', bg: 'rgba(0,228,0,0.15)', advice: 'Idealne warunki do aktywności na zewnątrz.' };
  if (aqi <= 40)  return { label: 'Dobra',         color: '#92d050', bg: 'rgba(146,208,80,0.15)', advice: 'Dobra jakość powietrza. Można wychodzić na zewnątrz.' };
  if (aqi <= 60)  return { label: 'Umiarkowana',   color: '#ffff00', bg: 'rgba(255,255,0,0.15)', advice: 'Osoby wrażliwe powinny ograniczyć aktywność na zewnątrz.' };
  if (aqi <= 80)  return { label: 'Zła',            color: '#ff7e00', bg: 'rgba(255,126,0,0.15)', advice: 'Ogranicz aktywność na zewnątrz. Noś maskę.' };
  if (aqi <= 100) return { label: 'Bardzo zła',    color: '#ff0000', bg: 'rgba(255,0,0,0.15)', advice: 'Unikaj wychodzenia na zewnątrz.' };
  return { label: 'Niebezpieczna', color: '#8f3f97', bg: 'rgba(143,63,151,0.15)', advice: 'Pozostań w domu. Zamknij okna.' };
}

function renderAqiWidget(c) {
  const info = getAqiInfo(c.european_aqi);
  const pct  = Math.min((c.european_aqi / 100) * 100, 100);

  document.getElementById('aqiValue').textContent = c.european_aqi;
  document.getElementById('aqiValue').style.color = info.color;
  document.getElementById('aqiDesc').textContent = info.label;
  document.getElementById('aqiFill').style.width = `${pct}%`;
  document.getElementById('aqiFill').style.background = info.color;
  document.getElementById('aqiWidget').classList.remove('hidden');
}

function renderAqiFull(c) {
  const el = document.getElementById('liveAqiFull');
  if (!el) return;
  const info = getAqiInfo(c.european_aqi);

  el.innerHTML = `
    <div class="aqi-main" style="background:${info.bg}">
      <div class="aqi-circle" style="color:${info.color}">
        <span>${c.european_aqi}</span>
        <span style="font-size:10px;font-weight:400">AQI</span>
      </div>
      <div class="aqi-main-info">
        <h4 style="color:${info.color}">${info.label}</h4>
        <p>${info.advice}</p>
      </div>
    </div>
    <div class="aqi-full-grid">
      <div class="aqi-cell">
        <div class="aqi-cell-val">${c.pm2_5?.toFixed(1) ?? '--'}</div>
        <div class="aqi-cell-label">PM2.5 μg/m³</div>
      </div>
      <div class="aqi-cell">
        <div class="aqi-cell-val">${c.pm10?.toFixed(1) ?? '--'}</div>
        <div class="aqi-cell-label">PM10 μg/m³</div>
      </div>
      <div class="aqi-cell">
        <div class="aqi-cell-val">${c.ozone?.toFixed(0) ?? '--'}</div>
        <div class="aqi-cell-label">Ozon μg/m³</div>
      </div>
      <div class="aqi-cell">
        <div class="aqi-cell-val">${c.nitrogen_dioxide?.toFixed(1) ?? '--'}</div>
        <div class="aqi-cell-label">NO₂ μg/m³</div>
      </div>
      <div class="aqi-cell">
        <div class="aqi-cell-val">${c.carbon_monoxide?.toFixed(0) ?? '--'}</div>
        <div class="aqi-cell-label">CO μg/m³</div>
      </div>
      <div class="aqi-cell">
        <div class="aqi-cell-val" style="font-size:14px">🇪🇺</div>
        <div class="aqi-cell-label">Europejski AQI</div>
      </div>
    </div>
  `;
}

function renderAqiError() {
  const el = document.getElementById('liveAqiFull');
  if (el) el.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text2)">⚠️ Nie można pobrać danych o jakości powietrza</div>`;
}

// ===== TRANSPORT DEPARTURES (ZDiTM Szczecin — real-time via Vercel proxy) =====
// Fetches real odjazdy from ZDiTM API via /api/zditm-departures serverless function
// Falls back to simulated data if API is unavailable

const LINE_COLORS = {
  '3': '#e74c3c', '7': '#c0392b', '12': '#e74c3c',
  '51': '#2980b9', '64': '#3498db', '78': '#2980b9', '103': '#1abc9c',
  'N1': '#2c3e50'
};

const STOPS = [
  'Łucznicza',
  'Tarczowa',
  'Osiedle Łucznicza',
];

async function generateTransportDepartures() {
  // On localhost the Vercel serverless function isn't running — skip the API
  // call to avoid a 404 and go straight to realistic simulated data.
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (isLocal) {
    const departures = generateSimulatedTransportDepartures();
    renderTransportPanel(departures);
    renderTransportFull(departures, false);
    return;
  }

  try {
    // Try to fetch real data from our Vercel proxy API
    const response = await fetch('/api/zditm-departures?stops=Łucznicza,Tarczowa', {
      method: 'GET',
      timeout: 8000,
    });
    
    if (!response.ok) throw new Error('API fetch failed');
    
    const data = await response.json();
    const departures = (data.departures || []).map(d => {
      // Build a clock time (HH:MM) from minsLeft for display
      let clock = '--:--';
      if (typeof d.minsLeft === 'number') {
        const t = new Date(Date.now() + d.minsLeft * 60000);
        clock = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
      } else if (d.time) {
        clock = new Date(d.time).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      }
      return {
        ...d,
        minsLeft: typeof d.minsLeft === 'number' ? d.minsLeft : 0,
        color: LINE_COLORS[d.line] || '#95a5a6',
        time: clock,
      };
    });

    // If we got real data, mark it
    if (data.source === 'zditm-real') {
      console.log('✓ ZDiTM real-time data loaded', departures.length, 'departures');
    } else {
      console.log('⚠ Using simulated transport data (API unavailable)');
    }

    renderTransportPanel(departures);
    renderTransportFull(departures, data.source === 'zditm-real');

  } catch (err) {
    console.warn('Transport fetch error:', err.message);
    // Fallback to simulated
    const departures = generateSimulatedTransportDepartures();
    renderTransportPanel(departures);
    renderTransportFull(departures, false);
  }
}

function generateSimulatedTransportDepartures() {
  const LINES = [
    { num: '3',   type: 'tram', dest: 'Centrum' },
    { num: '7',   type: 'tram', dest: 'Dworzec Główny' },
    { num: '12',  type: 'tram', dest: 'Plac Rodła' },
    { num: '51',  type: 'bus',  dest: 'Centrum' },
    { num: '64',  type: 'bus',  dest: 'Dworzec Niebuszewo' },
    { num: '78',  type: 'bus',  dest: 'Centrum' },
    { num: '103', type: 'bus',  dest: 'Osiedle Zawadzkiego' },
  ];

  const departures = [];
  
  LINES.forEach(line => {
    const count = 2 + Math.floor(Math.random() * 2);
    let baseMin = 1 + Math.floor(Math.random() * 8);

    for (let i = 0; i < count; i++) {
      const depTime = new Date(Date.now() + baseMin * 60000);
      departures.push({
        line: line.num,
        type: line.type,
        color: LINE_COLORS[line.num] || '#95a5a6',
        dest: line.dest,
        stop: STOPS[Math.floor(Math.random() * STOPS.length)],
        minsLeft: baseMin,
        time: `${String(depTime.getHours()).padStart(2,'0')}:${String(depTime.getMinutes()).padStart(2,'0')}`,
      });
      baseMin += 3 + Math.floor(Math.random() * 10);
    }
  });

  departures.sort((a, b) => a.minsLeft - b.minsLeft);
  return departures;
}

function renderTransportPanel(deps) {
  const body = document.getElementById('ltpBody');
  if (!body) return;

  body.innerHTML = deps.slice(0, 12).map(d => `
    <div class="departure-row">
      <div class="dep-line" style="background:${d.color}">${d.line}</div>
      <div class="dep-info">
        <div class="dep-dest">${d.dest}</div>
        <div class="dep-stop">🚏 ${d.stop}</div>
      </div>
      <div class="dep-time ${d.minsLeft <= 2 ? 'soon' : ''}">
        ${d.minsLeft <= 0 ? 'Teraz' : d.minsLeft <= 1 ? '1 min' : `${d.minsLeft} min`}
        <div style="font-size:10px;color:var(--text3);font-weight:400">${d.time}</div>
      </div>
    </div>
  `).join('');

  const now = new Date();
  const upd = document.getElementById('ltpUpdated');
  if (upd) upd.textContent = `Aktualizacja: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}

function renderTransportFull(deps, isRealtime = false) {
  const el = document.getElementById('liveTransportFull');
  if (!el) return;

  const now = new Date();
  const dataLabel = isRealtime ? '🟢 Dane ZDiTM (live)' : '🟡 Dane symulowane';
  
  el.innerHTML = `
    <div style="padding:10px 16px;font-size:12px;color:var(--text2);border-bottom:1px solid var(--border)">
      Odjazdy z przystanków: <strong>Łucznicza, Tarczowa, Osiedle Łucznicza</strong>
      · ${dataLabel}
      · Stan na: <strong>${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}</strong>
    </div>
    ${deps.slice(0, 15).map(d => `
      <div class="departure-row" style="padding:10px 16px">
        <div class="dep-line" style="background:${d.color}">${d.line}</div>
        <div class="dep-info">
          <div class="dep-dest">${d.dest}</div>
          <div class="dep-stop">🚏 ${d.stop}</div>
        </div>
        <div class="dep-time ${d.minsLeft <= 2 ? 'soon' : ''}">
          ${d.minsLeft <= 0 ? '🚌 Teraz' : d.minsLeft <= 1 ? '~1 min' : `${d.minsLeft} min`}
          <div style="font-size:11px;color:var(--text3);font-weight:400">${d.time}</div>
        </div>
      </div>
    `).join('')}
    <div style="padding:10px 16px;font-size:11px;color:var(--text3);text-align:center;border-top:1px solid var(--border)">
      ${isRealtime ? '✓ Dane pobrane z API ZDiTM Szczecin' : 'ℹ️ Dane symulowane — ZDiTM API niedostępne z przeglądarki'}
    </div>
  `;
}

// ===== LIVE TICKER =====
function buildTicker() {
  updateTicker();
  // Rebuild ticker every 5 min
  setInterval(updateTicker, 5 * 60 * 1000);
}

function updateTicker() {
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const items = [];

  // Weather item
  if (live.weather) {
    const wmo = WMO[live.weather.weather_code] || { icon: '🌡️', desc: '' };
    items.push(`${wmo.icon} <strong>Pogoda Szczecin:</strong> ${Math.round(live.weather.temperature_2m)}°C · ${wmo.desc} · Wiatr ${Math.round(live.weather.wind_speed_10m)} km/h`);
  } else {
    items.push(`🌡️ <strong>Pogoda:</strong> Pobieranie danych...`);
  }

  // AQI item
  if (live.aqi) {
    const info = getAqiInfo(live.aqi.european_aqi);
    items.push(`🌬️ <strong>Jakość powietrza:</strong> AQI ${live.aqi.european_aqi} — ${info.label}`);
  }

  // Sun item
  if (live.sun) {
    const rise = new Date(live.sun.sunrise);
    const set  = new Date(live.sun.sunset);
    const rStr = `${String(rise.getHours()).padStart(2,'0')}:${String(rise.getMinutes()).padStart(2,'0')}`;
    const sStr = `${String(set.getHours()).padStart(2,'0')}:${String(set.getMinutes()).padStart(2,'0')}`;
    items.push(`🌅 <strong>Wschód słońca:</strong> ${rStr} · <strong>Zachód:</strong> ${sStr}`);
  }

  // Static local items
  items.push(`📍 <strong>Łucznicza & Tarczowa, Szczecin</strong> · Przewodnik interaktywny`);
  items.push(`🏹 <strong>Dziś w dzielnicy:</strong> Boisko otwarte · Plac zabaw czynny · Sklepy otwarte`);
  items.push(`🚌 <strong>Transport:</strong> Tramwaje 3, 7, 12 · Autobusy 51, 64, 78, 103`);
  items.push(`⏰ <strong>Aktualny czas:</strong> ${timeStr} · Strefa: Europa/Warszawa`);

  // IMGW — Odra water level
  if (live.imgw && live.imgw.hydro) {
    items.push(`🌊 <strong>Odra Szczecin:</strong> Stan wody ${live.imgw.hydro.waterLevel} cm · Temp. wody ${live.imgw.hydro.waterTemp != null ? live.imgw.hydro.waterTemp + '°C' : '--'}`);
  }

  // GIOŚ — official Polish AQI
  if (live.gios && live.gios.category && live.gios.source === 'gios') {
    items.push(`🏭 <strong>GIOŚ Jakość powietrza:</strong> ${live.gios.category} (indeks ${live.gios.indexValue != null ? live.gios.indexValue : '--'})`);
  }

  // Moon phase
  try {
    const moon = getMoonPhase();
    items.push(`${moon.emoji} <strong>Księżyc:</strong> ${moon.name} · Oświetlenie ${moon.illumination}%`);
  } catch (e) { /* ignore */ }

  // Duplicate for seamless loop
  const allItems = [...items, ...items];
  const track = document.getElementById('tickerTrack');
  if (track) {
    track.innerHTML = allItems.map(i => `<span class="ticker-item">${i}</span>`).join('');
  }
}

// ===== HELPERS =====
function getWindDir(deg) {
  if (deg === undefined || deg === null) return '';
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ===== LIVE SECTION NAVIGATION HOOK =====
// Trigger data refresh when user opens the Live section
const _origNavigateTo = window.navigateTo;
if (typeof navigateTo === 'function') {
  const origNav = navigateTo;
  window.navigateTo = function(section) {
    origNav(section);
    if (section === 'live') {
      // Refresh all live data when section is opened
      if (!live.weather) fetchWeather();
      if (!live.aqi) fetchAqi();
      generateTransportDepartures();
    }
  };
}

// Also hook into the nav items directly
document.addEventListener('click', e => {
  const navItem = e.target.closest('[data-section="live"]');
  if (navItem) {
    setTimeout(() => {
      if (!live.weather) fetchWeather();
      if (!live.aqi) fetchAqi();
      generateTransportDepartures();
    }, 100);
  }
});


// ============================================================
// ===== NOWE ŹRÓDŁA REAL-TIME DATA ===========================
// ============================================================

// ===== 1. IMGW — Dane meteorologiczne + hydrologiczne =====
async function fetchImgw() {
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const url = isLocal
    ? null  // skip on localhost
    : '/api/imgw-szczecin';

  if (!url) {
    renderImgwWidget(null);
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('IMGW API error');
    const data = await res.json();
    live.imgw = data;
    renderImgwWidget(data);
    updateTicker();
  } catch (err) {
    console.warn('IMGW fetch failed:', err.message);
    renderImgwWidget(null);
  }
}

function renderImgwWidget(data) {
  const el = document.getElementById('liveImgwCard');
  if (!el) return;

  if (!data || !data.synop) {
    el.innerHTML = `
      <div class="live-card-header">
        <span class="live-card-icon">🌊</span>
        <div><h3>IMGW — Dane lokalne</h3>
        <span class="live-tag"><span class="live-dot"></span> Instytut Meteorologiczny</span></div>
      </div>
      <div style="padding:16px;color:var(--text2);font-size:13px">⚠️ Dane IMGW niedostępne</div>`;
    return;
  }

  const s = data.synop;
  const h = data.hydro;
  const windDirStr = getWindDir(s.windDir);
  const waterLevelStatus = h ? getWaterLevelStatus(h.waterLevel) : null;

  el.innerHTML = `
    <div class="live-card-header">
      <span class="live-card-icon">🌊</span>
      <div>
        <h3>IMGW — Dane lokalne Szczecin</h3>
        <span class="live-tag"><span class="live-dot"></span> Instytut Meteorologiczny i Gosp. Wodnej</span>
      </div>
      <button class="live-refresh-btn" onclick="fetchImgw()">🔄</button>
    </div>
    <div class="imgw-grid">
      <div class="imgw-section">
        <div class="imgw-section-title">🌡️ Meteorologia (stacja Szczecin)</div>
        <div class="imgw-cells">
          <div class="imgw-cell">
            <span class="imgw-val">${s.temp}°C</span>
            <span class="imgw-label">Temperatura</span>
          </div>
          <div class="imgw-cell">
            <span class="imgw-val">${s.windSpeed} km/h</span>
            <span class="imgw-label">Wiatr ${windDirStr}</span>
          </div>
          <div class="imgw-cell">
            <span class="imgw-val">${s.humidity}%</span>
            <span class="imgw-label">Wilgotność</span>
          </div>
          <div class="imgw-cell">
            <span class="imgw-val">${s.pressure} hPa</span>
            <span class="imgw-label">Ciśnienie</span>
          </div>
          <div class="imgw-cell">
            <span class="imgw-val">${s.precipitation} mm</span>
            <span class="imgw-label">Opady (suma)</span>
          </div>
        </div>
        <div class="imgw-updated">Pomiar: ${s.measuredAt}</div>
      </div>
      ${h ? `
      <div class="imgw-section">
        <div class="imgw-section-title">🌊 Hydrologia — Odra (${h.station})</div>
        <div class="imgw-cells">
          <div class="imgw-cell ${waterLevelStatus?.cls}">
            <span class="imgw-val">${h.waterLevel} cm</span>
            <span class="imgw-label">Stan wody</span>
          </div>
          ${h.waterTemp != null ? `
          <div class="imgw-cell">
            <span class="imgw-val">${h.waterTemp}°C</span>
            <span class="imgw-label">Temp. wody</span>
          </div>` : ''}
          <div class="imgw-cell">
            <span class="imgw-val" style="color:${waterLevelStatus?.color}">${waterLevelStatus?.label}</span>
            <span class="imgw-label">Status</span>
          </div>
        </div>
        <div class="imgw-updated">Pomiar: ${h.measuredAt}</div>
      </div>` : ''}
    </div>`;
}

function getWaterLevelStatus(level) {
  // Odra Szczecin: alarm ~600cm, ostrzeżenie ~550cm, normalny ~400-520cm
  if (level >= 600) return { label: '🚨 Alarm', color: '#ff0000', cls: 'water-alarm' };
  if (level >= 550) return { label: '⚠️ Ostrzeżenie', color: '#ff7e00', cls: 'water-warn' };
  if (level >= 480) return { label: '📈 Podwyższony', color: '#ffd93d', cls: 'water-high' };
  if (level >= 300) return { label: '✅ Normalny', color: '#43e97b', cls: 'water-ok' };
  return { label: '📉 Niski', color: '#a29bfe', cls: 'water-low' };
}

// ===== 2. GIOŚ — Oficjalna jakość powietrza =====
async function fetchGios() {
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const url = isLocal ? null : '/api/gios-szczecin';

  if (!url) {
    renderGiosWidget(null);
    return;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('GIOŚ API error');
    const data = await res.json();
    live.gios = data;
    renderGiosWidget(data);
    updateTicker();
  } catch (err) {
    console.warn('GIOŚ fetch failed:', err.message);
    renderGiosWidget(null);
  }
}

function renderGiosWidget(data) {
  const el = document.getElementById('liveGiosCard');
  if (!el) return;

  if (!data || data.source === 'error' || !data.category) {
    el.innerHTML = `
      <div class="live-card-header">
        <span class="live-card-icon">🏭</span>
        <div><h3>GIOŚ — Jakość powietrza</h3>
        <span class="live-tag">Oficjalne dane polskie</span></div>
      </div>
      <div style="padding:16px;color:var(--text2);font-size:13px">⚠️ Dane GIOŚ niedostępne</div>`;
    return;
  }

  const pollutantLabels = { PM10: 'PM10', 'PM2.5': 'PM2.5', NO2: 'NO₂', SO2: 'SO₂', O3: 'O₃' };
  const measurementsHtml = Object.entries(data.measurements || {}).map(([k, v]) => `
    <div class="gios-cell">
      <span class="gios-val">${v != null ? parseFloat(v).toFixed(1) : '--'}</span>
      <span class="gios-label">${pollutantLabels[k] || k} μg/m³</span>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="live-card-header">
      <span class="live-card-icon">🏭</span>
      <div>
        <h3>GIOŚ — Jakość powietrza Szczecin</h3>
        <span class="live-tag"><span class="live-dot"></span> ${data.stationName}</span>
      </div>
      <button class="live-refresh-btn" onclick="fetchGios()">🔄</button>
    </div>
    <div class="gios-main" style="background:${data.categoryColor}22;border-left:4px solid ${data.categoryColor}">
      <div class="gios-index" style="color:${data.categoryColor}">${data.indexValue ?? '–'}</div>
      <div class="gios-info">
        <div class="gios-category" style="color:${data.categoryColor}">${data.category}</div>
        <div class="gios-advice">${data.advice}</div>
      </div>
    </div>
    ${measurementsHtml ? `<div class="gios-cells">${measurementsHtml}</div>` : ''}
    <div class="imgw-updated">Obliczono: ${data.calculatedAt || '–'} · Źródło: GIOŚ</div>`;
}

// ===== 3. FAZA KSIĘŻYCA (obliczana matematycznie) =====
function getMoonPhase() {
  const now = new Date();
  // Known new moon: 2000-01-06
  const knownNewMoon = new Date('2000-01-06T18:14:00Z');
  const synodicMonth = 29.53058867; // days
  const diffDays = (now - knownNewMoon) / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const pct = Math.round((phase / synodicMonth) * 100);

  const phases = [
    { name: 'Nów',               emoji: '🌑', min: 0,   max: 1.85  },
    { name: 'Przybywający sierp', emoji: '🌒', min: 1.85, max: 7.38 },
    { name: 'Pierwsza kwadra',   emoji: '🌓', min: 7.38, max: 9.22  },
    { name: 'Przybywający garb', emoji: '🌔', min: 9.22, max: 14.77 },
    { name: 'Pełnia',            emoji: '🌕', min: 14.77, max: 16.61 },
    { name: 'Ubywający garb',    emoji: '🌖', min: 16.61, max: 22.15 },
    { name: 'Ostatnia kwadra',   emoji: '🌗', min: 22.15, max: 24.0  },
    { name: 'Ubywający sierp',   emoji: '🌘', min: 24.0,  max: 29.53 }
  ];

  const current = phases.find(p => phase >= p.min && phase < p.max) || phases[0];

  // Days to next full moon and new moon
  const daysToFull = phase < 14.77
    ? Math.round(14.77 - phase)
    : Math.round(synodicMonth - phase + 14.77);
  const daysToNew = phase > 0.5
    ? Math.round(synodicMonth - phase)
    : Math.round(-phase + synodicMonth);

  return {
    phase,
    pct,
    name: current.name,
    emoji: current.emoji,
    daysToFull,
    daysToNew,
    illumination: Math.round(Math.abs(Math.cos((phase / synodicMonth) * 2 * Math.PI)) * 100)
  };
}

function renderMoonWidget() {
  const el = document.getElementById('liveMoonCard');
  if (!el) return;

  const moon = getMoonPhase();

  el.innerHTML = `
    <div class="live-card-header">
      <span class="live-card-icon">${moon.emoji}</span>
      <div>
        <h3>Faza Księżyca</h3>
        <span class="live-tag">Obliczana astronomicznie</span>
      </div>
    </div>
    <div class="moon-main">
      <div class="moon-emoji">${moon.emoji}</div>
      <div class="moon-info">
        <div class="moon-name">${moon.name}</div>
        <div class="moon-illumination">Oświetlenie: <strong>${moon.illumination}%</strong></div>
        <div class="moon-days">
          🌕 Pełnia za <strong>${moon.daysToFull} dni</strong> ·
          🌑 Nów za <strong>${moon.daysToNew} dni</strong>
        </div>
      </div>
    </div>
    <div class="moon-bar-wrap">
      <div class="moon-bar-track">
        <div class="moon-bar-fill" style="width:${moon.pct}%"></div>
      </div>
      <div class="moon-bar-labels">
        <span>🌑 Nów</span>
        <span>🌓 I kwadra</span>
        <span>🌕 Pełnia</span>
        <span>🌗 III kwadra</span>
        <span>🌑 Nów</span>
      </div>
    </div>`;
}

// ===== INIT — dodaj nowe źródła do initLive =====
const _origInitLive = window._initLiveExtended;
document.addEventListener('DOMContentLoaded', () => {
  const waitForApp = setInterval(() => {
    if (!document.getElementById('app').classList.contains('hidden')) {
      clearInterval(waitForApp);
      // Render moon immediately (no API needed)
      renderMoonWidget();
      // Fetch IMGW and GIOŚ
      fetchImgw();
      fetchGios();
      // Refresh every 10 minutes
      setInterval(fetchImgw, 10 * 60 * 1000);
      setInterval(fetchGios, 15 * 60 * 1000);
    }
  }, 500);
});

// NOTE: ticker extension is handled inside the original updateTicker() below.
// Do NOT redefine updateTicker here — it causes infinite recursion via hoisting.


// ============================================================
// ===== PROGNOZA DLA AKTYWNOŚCI ==============================
// ============================================================

function renderActivityForecast() {
  const el = document.getElementById('liveActivityForecast');
  if (!el) return;

  const weather = live.weather;
  if (!weather) {
    el.innerHTML = '<div class="live-skeleton"></div>';
    return;
  }

  const temp = Math.round(weather.temperature_2m);
  const wind = Math.round(weather.wind_speed_10m);
  const rain = weather.precipitation || 0;
  const uv   = weather.uv_index || 0;
  const code = weather.weather_code || 0;

  // Score activities based on weather
  const activities = [
    {
      name: 'Jogging / Bieganie',
      emoji: '🏃',
      ideal: temp >= 8 && temp <= 22 && wind < 30 && rain < 1,
      good:  temp >= 5 && temp <= 26 && wind < 40 && rain < 3,
      tip: temp > 26 ? 'Zbyt gorąco — biegnij rano lub wieczorem' :
           temp < 5  ? 'Ubierz się ciepło' :
           rain > 1  ? 'Mokra nawierzchnia — uważaj' :
           wind > 30 ? 'Silny wiatr — trudniejszy bieg' : 'Idealne warunki!'
    },
    {
      name: 'Spacer w parku',
      emoji: '🚶',
      ideal: temp >= 5 && rain < 5 && code < 80,
      good:  temp >= 0 && rain < 10,
      tip: rain > 5 ? 'Weź parasol' : temp < 0 ? 'Ubierz się ciepło' : 'Miły spacer!'
    },
    {
      name: 'Rower',
      emoji: '🚴',
      ideal: temp >= 10 && temp <= 28 && wind < 25 && rain < 1,
      good:  temp >= 5 && wind < 35 && rain < 3,
      tip: wind > 25 ? 'Silny wiatr — trudniejsza jazda' :
           rain > 1  ? 'Mokra droga — jedź ostrożnie' : 'Dobry dzień na rower!'
    },
    {
      name: 'Siłownia plenerowa',
      emoji: '💪',
      ideal: temp >= 8 && temp <= 30 && rain < 1,
      good:  temp >= 3 && rain < 5,
      tip: rain > 1 ? 'Mokry sprzęt — uważaj' : temp < 3 ? 'Bardzo zimno' : 'Ćwicz na świeżym powietrzu!'
    },
    {
      name: 'Piknik w parku',
      emoji: '🧺',
      ideal: temp >= 18 && temp <= 28 && rain < 0.5 && wind < 20 && code < 3,
      good:  temp >= 15 && rain < 2 && code < 60,
      tip: rain > 0.5 ? 'Możliwy deszcz — weź koc' :
           temp < 15  ? 'Trochę chłodno na piknik' : 'Idealny dzień na piknik!'
    },
    {
      name: 'Basen / Kąpiel',
      emoji: '🏊',
      ideal: temp >= 25 && uv >= 3 && rain < 1,
      good:  temp >= 22 && rain < 3,
      tip: temp < 22 ? 'Za chłodno na kąpiel' : 'Dobry dzień na basen!'
    }
  ];

  const getScore = a => a.ideal ? 3 : a.good ? 2 : 1;
  const getLabel = a => a.ideal ? '✅ Idealne' : a.good ? '🟡 Dobre' : '❌ Niezalecane';
  const getColor = a => a.ideal ? '#43e97b' : a.good ? '#ffd93d' : '#ff6584';

  activities.sort((a, b) => getScore(b) - getScore(a));

  el.innerHTML = `
    <div class="af-header">
      <div class="af-temp">${temp}°C</div>
      <div class="af-desc">Prognoza aktywności na dziś</div>
    </div>
    <div class="af-grid">
      ${activities.map(a => `
        <div class="af-item">
          <div class="af-emoji">${a.emoji}</div>
          <div class="af-body">
            <div class="af-name">${a.name}</div>
            <div class="af-tip">${a.tip}</div>
          </div>
          <div class="af-badge" style="background:${getColor(a)}22;color:${getColor(a)}">${getLabel(a)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// Hook into weather fetch
const _origRenderWeatherFull = renderWeatherFull;
function renderWeatherFull(c) {
  _origRenderWeatherFull(c);
  setTimeout(renderActivityForecast, 100);
}
