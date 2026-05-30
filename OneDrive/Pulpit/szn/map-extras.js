/**
 * map-extras.js — Dodatkowe funkcje mapy
 * #2  Filtr pojazdów po linii
 * #5  Radar opadów (RainViewer — animowany)
 * #4  Izochrony "dokąd dojdę pieszo" (5/10/15 min)
 * #10 Porównanie warstw (swipe satelita vs mapa)
 */
'use strict';

// ============================================================
// #2 — FILTR POJAZDÓW PO LINII
// ============================================================

function buildLineFilterChips() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('lineFilterChips')) return;

  // Linie kursujące przez Niebuszewo/Łuczniczą (prawdziwe z ZDiTM)
  const lines = ['89', '69', '53', '67', '75', '79'];

  const bar = document.createElement('div');
  bar.id = 'lineFilterChips';
  bar.className = 'line-filter-chips hidden';
  bar.innerHTML = `
    <button class="lfc-chip active" data-line="">Wszystkie</button>
    ${lines.map(l => `<button class="lfc-chip" data-line="${l}">${l}</button>`).join('')}
  `;
  mapEl.appendChild(bar);

  bar.querySelectorAll('.lfc-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      bar.querySelectorAll('.lfc-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      if (window.mapVehicles) window.mapVehicles.setLineFilter(chip.dataset.line || null);
    });
  });
}

// Show line filter chips only when vehicles layer is on
function syncLineFilterVisibility() {
  const bar = document.getElementById('lineFilterChips');
  if (!bar) return;
  const on = window.mapVehicles?.isEnabled?.();
  bar.classList.toggle('hidden', !on);
}

// ============================================================
// #5 — RADAR OPADÓW (RainViewer)
// ============================================================

const RAIN = {
  layer: null,
  frames: [],
  host: '',
  animIndex: 0,
  animInterval: null,
  enabled: false
};

async function toggleRainRadar() {
  const map = window.state?.map;
  if (!map) return;

  if (RAIN.enabled) {
    if (RAIN.layer) map.removeLayer(RAIN.layer);
    clearInterval(RAIN.animInterval);
    RAIN.layer = null;
    RAIN.animInterval = null;
    RAIN.enabled = false;
    removeRainControls();
    showToast('🌧️ Radar opadów wyłączony');
    updateExtrasButtons();
    return;
  }

  showToast('🌧️ Ładowanie radaru opadów...');
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    const data = await res.json();
    RAIN.host = data.host;
    // Combine past + nowcast for animation
    RAIN.frames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])];
    if (!RAIN.frames.length) { showToast('⚠️ Brak danych radaru'); return; }

    RAIN.enabled = true;
    RAIN.animIndex = RAIN.frames.length - 1;
    showRainFrame(RAIN.animIndex);
    buildRainControls();
    updateExtrasButtons();

    // Auto-animate
    startRainAnimation();
    showToast('🌧️ Radar opadów włączony — animacja na żywo');
  } catch (err) {
    console.warn('Rain radar failed:', err.message);
    showToast('⚠️ Nie udało się załadować radaru');
  }
}

function showRainFrame(index) {
  const map = window.state?.map;
  if (!map || !RAIN.frames[index]) return;
  const frame = RAIN.frames[index];
  const url = `${RAIN.host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

  if (RAIN.layer) map.removeLayer(RAIN.layer);
  RAIN.layer = L.tileLayer(url, { opacity: 0.6, zIndex: 350 }).addTo(map);

  // Update time label
  const label = document.getElementById('rainTimeLabel');
  if (label) {
    const dt = new Date(frame.time * 1000);
    const isFuture = frame.time * 1000 > Date.now();
    label.textContent = `${isFuture ? '🔮 Prognoza' : '🕐'} ${dt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
  }
  // Update progress
  const prog = document.getElementById('rainProgress');
  if (prog) prog.style.width = `${(index / (RAIN.frames.length - 1)) * 100}%`;
}

function startRainAnimation() {
  clearInterval(RAIN.animInterval);
  RAIN.animInterval = setInterval(() => {
    RAIN.animIndex = (RAIN.animIndex + 1) % RAIN.frames.length;
    showRainFrame(RAIN.animIndex);
  }, 700);
}

function buildRainControls() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('rainControls')) return;
  const ctrl = document.createElement('div');
  ctrl.id = 'rainControls';
  ctrl.className = 'rain-controls';
  ctrl.innerHTML = `
    <div class="rain-time" id="rainTimeLabel">🕐 --:--</div>
    <div class="rain-track"><div class="rain-progress" id="rainProgress"></div></div>
    <div class="rain-legend">
      <span style="color:#a0d3ff">●</span> słabe
      <span style="color:#4d94ff">●</span> umiarkowane
      <span style="color:#ff4d4d">●</span> silne
    </div>
  `;
  mapEl.appendChild(ctrl);
}

function removeRainControls() {
  document.getElementById('rainControls')?.remove();
}

// ============================================================
// #4 — IZOCHRONY "DOKĄD DOJDĘ PIESZO"
// ============================================================

const ISO = {
  layers: [],
  enabled: false
};

async function toggleIsochrones() {
  const map = window.state?.map;
  if (!map) return;

  if (ISO.enabled) {
    ISO.layers.forEach(l => map.removeLayer(l));
    ISO.layers = [];
    ISO.enabled = false;
    updateExtrasButtons();
    showToast('🚶 Izochrony wyłączone');
    return;
  }

  // Get center point (user location or map center)
  let center;
  if (navigator.geolocation) {
    showToast('🚶 Pobieranie lokalizacji dla izochron...');
    navigator.geolocation.getCurrentPosition(
      pos => drawIsochrones(pos.coords.latitude, pos.coords.longitude),
      () => { const c = map.getCenter(); drawIsochrones(c.lat, c.lng); },
      { timeout: 6000 }
    );
  } else {
    const c = map.getCenter();
    drawIsochrones(c.lat, c.lng);
  }
}

function drawIsochrones(lat, lon) {
  const map = window.state?.map;
  if (!map) return;

  // Walking speed ~5 km/h → approximate radius for 5/10/15 min
  // 5min=417m, 10min=833m, 15min=1250m (straight-line approximation)
  const rings = [
    { min: 15, radius: 1100, color: '#43e97b', label: '15 min' },
    { min: 10, radius: 750,  color: '#ffd93d', label: '10 min' },
    { min: 5,  radius: 400,  color: '#ff6584', label: '5 min'  }
  ];

  ISO.layers.forEach(l => map.removeLayer(l));
  ISO.layers = [];

  rings.forEach(ring => {
    const circle = L.circle([lat, lon], {
      radius: ring.radius,
      color: ring.color,
      weight: 2,
      opacity: 0.7,
      fillColor: ring.color,
      fillOpacity: 0.08,
      dashArray: '5, 5'
    }).addTo(map);
    circle.bindTooltip(`🚶 ${ring.label} pieszo`, { permanent: false, direction: 'top' });
    ISO.layers.push(circle);
  });

  // Center marker
  const centerM = L.marker([lat, lon], {
    icon: L.divIcon({ html: '<div class="iso-center">🚶</div>', iconSize: [32,32], iconAnchor: [16,16], className: '' })
  }).addTo(map);
  ISO.layers.push(centerM);

  map.setView([lat, lon], 15, { animate: true });
  ISO.enabled = true;
  updateExtrasButtons();
  showToast('🚶 Izochrony: dokąd dojdziesz w 5/10/15 min');
}

// ============================================================
// #10 — PORÓWNANIE WARSTW (SWIPE)
// ============================================================

const SWIPE = {
  enabled: false,
  satLayer: null,
  clipValue: 50,
  handle: null
};

function toggleSwipe() {
  const map = window.state?.map;
  if (!map) return;

  if (SWIPE.enabled) {
    if (SWIPE.satLayer) map.removeLayer(SWIPE.satLayer);
    SWIPE.satLayer = null;
    document.getElementById('swipeHandle')?.remove();
    SWIPE.enabled = false;
    updateExtrasButtons();
    showToast('🔀 Porównanie warstw wyłączone');
    return;
  }

  // Add satellite layer on top, clipped
  SWIPE.satLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18, zIndex: 300
  }).addTo(map);

  buildSwipeHandle();
  SWIPE.enabled = true;
  applySwipeClip();
  updateExtrasButtons();
  showToast('🔀 Przeciągnij suwak — lewo: mapa, prawo: satelita');
}

function buildSwipeHandle() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('swipeHandle')) return;

  const handle = document.createElement('div');
  handle.id = 'swipeHandle';
  handle.className = 'swipe-handle';
  handle.style.left = SWIPE.clipValue + '%';
  handle.innerHTML = `<div class="sh-line"></div><div class="sh-grip">⇄</div><div class="sh-labels"><span class="sh-l">🗺️</span><span class="sh-r">🛰️</span></div>`;
  mapEl.appendChild(handle);

  let dragging = false;
  const onMove = clientX => {
    const rect = mapEl.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(5, Math.min(95, pct));
    SWIPE.clipValue = pct;
    handle.style.left = pct + '%';
    applySwipeClip();
  };

  handle.addEventListener('mousedown', () => dragging = true);
  handle.addEventListener('touchstart', () => dragging = true, { passive: true });
  document.addEventListener('mousemove', e => { if (dragging) onMove(e.clientX); });
  document.addEventListener('touchmove', e => { if (dragging && e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
  document.addEventListener('mouseup', () => dragging = false);
  document.addEventListener('touchend', () => dragging = false);
}

function applySwipeClip() {
  if (!SWIPE.satLayer) return;
  const container = SWIPE.satLayer.getContainer?.();
  if (container) {
    container.style.clipPath = `inset(0 0 0 ${SWIPE.clipValue}%)`;
  }
}

// Re-apply clip on map move/zoom
function initSwipeReclip() {
  const map = window.state?.map;
  if (!map) return;
  map.on('move zoom moveend zoomend', () => { if (SWIPE.enabled) applySwipeClip(); });
}

// ============================================================
// EXTRAS PANEL (buttons for #5, #4, #10)
// ============================================================

function buildExtrasPanel() {
  const panel = document.getElementById('layerPanel');
  if (!panel || document.getElementById('btnExtraRain')) return;

  const extras = document.createElement('div');
  extras.innerHTML = `
    <button class="lp-btn" id="btnExtraRain" onclick="window.mapExtras.toggleRain()">🌧️ Radar opadów</button>
    <button class="lp-btn" id="btnExtraIso" onclick="window.mapExtras.toggleIso()">🚶 Izochrony</button>
    <button class="lp-btn" id="btnExtraSwipe" onclick="window.mapExtras.toggleSwipe()">🔀 Satelita vs Mapa</button>
  `;
  while (extras.firstChild) panel.appendChild(extras.firstChild);
}

function updateExtrasButtons() {
  document.getElementById('btnExtraRain')?.classList.toggle('active', RAIN.enabled);
  document.getElementById('btnExtraIso')?.classList.toggle('active', ISO.enabled);
  document.getElementById('btnExtraSwipe')?.classList.toggle('active', SWIPE.enabled);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const wait = setInterval(() => {
    if (window.state?.map && document.getElementById('layerPanel')) {
      clearInterval(wait);
      buildLineFilterChips();
      buildExtrasPanel();
      initSwipeReclip();
      // Sync line filter chips visibility with vehicles layer
      setInterval(syncLineFilterVisibility, 1000);
    }
  }, 400);
});

window.mapExtras = {
  toggleRain: toggleRainRadar,
  toggleIso: toggleIsochrones,
  toggleSwipe: toggleSwipe,
  setLineFilter: (l) => window.mapVehicles?.setLineFilter(l)
};
