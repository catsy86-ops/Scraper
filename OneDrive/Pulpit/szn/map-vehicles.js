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
  // ZDiTM API wysyła CORS `*` — wołamy bezpośrednio (działa też na localhost).
  if (window.ZDiTM) {
    try {
      const all = await ZDiTM.getVehicles();
      // Filtruj do okolicy Łuczniczej (promień 1.5 km) dla wydajności i sensu
      const nearby = ZDiTM.filterNearby(all, 53.4540, 14.5477, 1500);
      VEHICLES.lastData = nearby;
      renderVehicles(nearby, all.length);
      return;
    } catch (err) {
      console.warn('Vehicles fetch failed:', err.message);
      // Spróbuj cache (offline)
      if (window.OfflineStore) {
        const cached = await OfflineStore.getStale('zditm_vehicles');
        if (cached && cached.length) {
          const nearby = ZDiTM.filterNearby(cached, 53.4540, 14.5477, 1500);
          VEHICLES.lastData = nearby;
          renderVehicles(nearby, cached.length);
          return;
        }
      }
    }
  }
  // Brak danych — nie pokazuj nic (lepsze niż fałszywe pozycje)
  renderVehicles([], 0);
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
  if (el) {
    if (count === 0) {
      el.textContent = '0 w pobliżu';
    } else {
      el.textContent = VEHICLES.lineFilter ? `${count} (linia ${VEHICLES.lineFilter})` : count;
    }
  }
  // Pokaż łączną liczbę w mieście jako tooltip
  const badge = document.getElementById('vehicleBadge');
  if (badge && totalCity) badge.title = `${totalCity} pojazdów w całym Szczecinie`;
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
