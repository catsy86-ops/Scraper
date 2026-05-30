/**
 * map-vehicles.js — Pojazdy ZDiTM na żywo na mapie
 * Prawdziwe pozycje GPS autobusów i tramwajów
 * Aktualizacja co 15 sekund, markery obracają się zgodnie z kierunkiem
 */
'use strict';

const VEHICLES = {
  layer: null,
  markers: {},          // vehicle_id → marker
  enabled: false,
  interval: null,
  lineFilter: null,     // filtr po numerze linii (null = wszystkie)
  lastData: []
};

const VEH_REFRESH_MS = 15000;

// ===== FETCH & RENDER =====
async function fetchVehicles() {
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  if (isLocal) {
    // Na localhost API serverless nie działa — pokaż przykładowe dane
    renderVehicles(getSampleVehicles());
    return;
  }

  try {
    const res = await fetch('/api/zditm-vehicles');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    VEHICLES.lastData = data.vehicles || [];
    renderVehicles(VEHICLES.lastData, data.totalCity);
  } catch (err) {
    console.warn('Vehicles fetch failed:', err.message);
  }
}

function getSampleVehicles() {
  // Realistyczne przykładowe pojazdy dla localhost
  return [
    { id: 1, line: '89', type: 'bus', direction: 'Kołłątaja', nextStop: 'Łucznicza', lat: 53.4540, lon: 14.5480, bearing: 90, velocity: 32, punctuality: 0, model: 'Solaris Urbino 12', lowFloor: true },
    { id: 2, line: '69', type: 'bus', direction: 'Rugiańska', nextStop: 'Przyjaciół Żołnierza', lat: 53.4548, lon: 14.5530, bearing: 180, velocity: 28, punctuality: -1, model: 'MAN NL283', lowFloor: true },
    { id: 3, line: '75', type: 'bus', direction: 'Plac Rodła', nextStop: 'Bandurskiego', lat: 53.4535, lon: 14.5620, bearing: 270, velocity: 0, punctuality: 2, model: 'Solaris Urbino 18', lowFloor: true },
  ];
}

function renderVehicles(vehicles, totalCity) {
  const map = window.state?.map;
  if (!map || !VEHICLES.layer) return;

  // Apply line filter
  let filtered = vehicles;
  if (VEHICLES.lineFilter) {
    filtered = vehicles.filter(v => v.line === VEHICLES.lineFilter);
  }

  const seenIds = new Set();

  filtered.forEach(v => {
    seenIds.add(v.id);
    const existing = VEHICLES.markers[v.id];

    if (existing) {
      // Smooth move existing marker
      animateMarkerTo(existing, [v.lat, v.lon]);
      existing.setIcon(createVehicleIcon(v));
      existing.vehicleData = v;
      existing.getPopup()?.setContent(vehiclePopup(v));
    } else {
      // New marker
      const marker = L.marker([v.lat, v.lon], {
        icon: createVehicleIcon(v),
        zIndexOffset: 500
      });
      marker.vehicleData = v;
      marker.bindPopup(vehiclePopup(v), { className: 'vehicle-popup-wrap', maxWidth: 240 });
      marker.addTo(VEHICLES.layer);
      VEHICLES.markers[v.id] = marker;
    }
  });

  // Remove vehicles that disappeared
  Object.keys(VEHICLES.markers).forEach(id => {
    if (!seenIds.has(parseInt(id)) && !seenIds.has(id)) {
      VEHICLES.layer.removeLayer(VEHICLES.markers[id]);
      delete VEHICLES.markers[id];
    }
  });

  // Update counter badge
  updateVehicleBadge(filtered.length, totalCity);
}

function createVehicleIcon(v) {
  const isTram = v.type === 'tram';
  const isNight = v.lineType === 'night';
  const color = isTram ? '#e74c3c' : isNight ? '#2c3e50' : '#3498db';
  const emoji = isTram ? '🚃' : '🚌';
  const rot = (v.bearing != null) ? v.bearing : 0;
  const moving = v.velocity > 0;

  // Punctuality dot
  const punctColor = v.punctuality > 2 ? '#ff6584' : v.punctuality < -1 ? '#ffd93d' : '#43e97b';

  return L.divIcon({
    html: `
      <div class="vehicle-marker ${moving ? 'moving' : 'stopped'}" style="--vcolor:${color}">
        <div class="vm-bubble" style="background:${color}">
          <span class="vm-line">${v.line}</span>
        </div>
        ${v.bearing != null ? `<div class="vm-arrow" style="transform:rotate(${rot}deg);border-bottom-color:${color}"></div>` : ''}
        <div class="vm-punct" style="background:${punctColor}"></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    className: 'vehicle-icon-wrap'
  });
}

function vehiclePopup(v) {
  const isTram = v.type === 'tram';
  const punctLabel = v.punctuality > 0 ? `+${v.punctuality} min (opóźnienie)` :
                     v.punctuality < 0 ? `${v.punctuality} min (przed czasem)` : 'Punktualnie';
  const punctColor = v.punctuality > 2 ? '#ff6584' : v.punctuality < -1 ? '#ffd93d' : '#43e97b';

  return `
    <div class="vehicle-popup">
      <div class="vp-head" style="background:${isTram ? '#e74c3c' : '#3498db'}">
        <span class="vp-icon">${isTram ? '🚃' : '🚌'}</span>
        <span class="vp-line">${v.line}</span>
        <span class="vp-type">${isTram ? 'Tramwaj' : 'Autobus'}</span>
      </div>
      <div class="vp-body">
        <div class="vp-direction">➜ ${v.direction || 'Nieznany kierunek'}</div>
        ${v.nextStop ? `<div class="vp-stop">🚏 Następny: <strong>${v.nextStop}</strong></div>` : ''}
        <div class="vp-stats">
          <div class="vp-stat"><span>${Math.round(v.velocity)}</span><small>km/h</small></div>
          <div class="vp-stat" style="color:${punctColor}"><span>${v.punctuality > 0 ? '+' : ''}${v.punctuality}</span><small>min</small></div>
          <div class="vp-stat"><span>${v.lowFloor ? '♿' : '—'}</span><small>${v.lowFloor ? 'niska podłoga' : 'wysoka'}</small></div>
        </div>
        <div class="vp-punct" style="color:${punctColor}">● ${punctLabel}</div>
        ${v.model ? `<div class="vp-model">${v.model}</div>` : ''}
      </div>
    </div>
  `;
}

// Smooth marker animation
function animateMarkerTo(marker, newLatLng) {
  const start = marker.getLatLng();
  const end = L.latLng(newLatLng);
  const duration = 1000;
  const startTime = performance.now();

  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const lat = start.lat + (end.lat - start.lat) * t;
    const lng = start.lng + (end.lng - start.lng) * t;
    marker.setLatLng([lat, lng]);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== TOGGLE =====
function toggleVehicles() {
  const map = window.state?.map;
  if (!map) return;

  if (VEHICLES.enabled) {
    // Turn off
    if (VEHICLES.layer) map.removeLayer(VEHICLES.layer);
    VEHICLES.layer = null;
    VEHICLES.markers = {};
    clearInterval(VEHICLES.interval);
    VEHICLES.interval = null;
    VEHICLES.enabled = false;
    removeVehicleBadge();
    showToast('🚌 Pojazdy na żywo wyłączone');
  } else {
    // Turn on
    VEHICLES.layer = L.layerGroup().addTo(map);
    VEHICLES.enabled = true;
    showToast('🚌 Ładowanie pojazdów ZDiTM na żywo...');
    fetchVehicles();
    VEHICLES.interval = setInterval(fetchVehicles, VEH_REFRESH_MS);
    buildVehicleBadge();
  }
  updateLayerButtons2();
}

// ===== LINE FILTER =====
function setVehicleLineFilter(line) {
  VEHICLES.lineFilter = line || null;
  renderVehicles(VEHICLES.lastData);
  showToast(line ? `🚌 Pokazuję tylko linię ${line}` : '🚌 Pokazuję wszystkie pojazdy');
}

// ===== COUNTER BADGE =====
function buildVehicleBadge() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('vehicleBadge')) return;
  const badge = document.createElement('div');
  badge.id = 'vehicleBadge';
  badge.className = 'vehicle-badge';
  badge.innerHTML = `<span class="vb-dot"></span> <span id="vbCount">0</span> pojazdów na żywo`;
  mapEl.appendChild(badge);
}

function updateVehicleBadge(count, totalCity) {
  const el = document.getElementById('vbCount');
  if (el) el.textContent = VEHICLES.lineFilter ? `${count} (linia ${VEHICLES.lineFilter})` : count;
}

function removeVehicleBadge() {
  document.getElementById('vehicleBadge')?.remove();
}

function updateLayerButtons2() {
  const btn = document.getElementById('btnLayerVehicles');
  if (btn) btn.classList.toggle('active', VEHICLES.enabled);
}

// ===== ADD BUTTON TO LAYER PANEL =====
function addVehicleButton() {
  const panel = document.getElementById('layerPanel');
  if (!panel || document.getElementById('btnLayerVehicles')) return;
  const btn = document.createElement('button');
  btn.className = 'lp-btn';
  btn.id = 'btnLayerVehicles';
  btn.innerHTML = '🚌 Pojazdy LIVE';
  btn.addEventListener('click', toggleVehicles);
  // Insert as first button
  panel.insertBefore(btn, panel.querySelector('.lp-btn'));
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  const wait = setInterval(() => {
    if (window.state?.map && document.getElementById('layerPanel')) {
      clearInterval(wait);
      addVehicleButton();
      // Auto-enable vehicles after 1.5s for the wow effect
      setTimeout(() => { if (!VEHICLES.enabled) toggleVehicles(); }, 1500);
    }
  }, 400);
});

window.mapVehicles = {
  toggle: toggleVehicles,
  setLineFilter: setVehicleLineFilter,
  refresh: fetchVehicles,
  isEnabled: () => VEHICLES.enabled
};
