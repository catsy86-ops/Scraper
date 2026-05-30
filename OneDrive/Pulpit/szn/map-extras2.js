/**
 * map-extras2.js — Kolejne funkcje mapy
 * #8 Cinematyczny przelot nad dzielnicą
 * #9 Pomiar powierzchni (wielokąt)
 * #7 Heatmapa gęstości POI (prawdziwa)
 * #3 Pseudo-3D budynki (OSM building footprints)
 */
'use strict';

// ============================================================
// #8 — CINEMATYCZNY PRZELOT NAD DZIELNICĄ
// ============================================================

const TOUR = {
  active: false,
  index: 0,
  timeout: null,
  popup: null
};

function startCinematicTour() {
  const map = window.state?.map;
  if (!map || !APP_DATA?.places) return;

  if (TOUR.active) { stopTour(); return; }

  // Pick highlights — featured + popular places + parks
  const highlights = APP_DATA.places.filter(p => p.featured || p.popular);
  const tourStops = highlights.length >= 5 ? highlights : APP_DATA.places.slice(0, 8);

  if (!tourStops.length) return;

  TOUR.active = true;
  TOUR.index = 0;
  TOUR.stops = tourStops;

  buildTourOverlay();
  showToast('🎬 Cinematyczny przelot rozpoczęty');
  tourStep();
}

function tourStep() {
  const map = window.state?.map;
  if (!map || !TOUR.active) return;

  if (TOUR.index >= TOUR.stops.length) {
    // End — return to overview
    map.flyTo([53.4530, 14.5520], 15, { animate: true, duration: 2 });
    setTimeout(stopTour, 2200);
    return;
  }

  const place = TOUR.stops[TOUR.index];
  const total = TOUR.stops.length;

  // Fly to place with dramatic zoom
  map.flyTo([place.coords[1], place.coords[0]], 17.5, { animate: true, duration: 2.2 });

  // Update overlay
  const overlay = document.getElementById('tourOverlay');
  if (overlay) {
    overlay.innerHTML = `
      <div class="tour-progress-dots">
        ${TOUR.stops.map((_, i) => `<span class="tpd ${i === TOUR.index ? 'active' : i < TOUR.index ? 'done' : ''}"></span>`).join('')}
      </div>
      <div class="tour-card">
        <div class="tour-emoji">${place.emoji}</div>
        <div class="tour-info">
          <div class="tour-counter">${TOUR.index + 1} / ${total}</div>
          <div class="tour-name">${place.name}</div>
          <div class="tour-addr">📍 ${place.addr}</div>
        </div>
      </div>
      <div class="tour-controls">
        <button onclick="window.mapExtras2.tourPrev()" ${TOUR.index === 0 ? 'disabled' : ''}>◀</button>
        <button onclick="window.mapExtras2.tourPause()" id="tourPauseBtn">⏸ Pauza</button>
        <button onclick="window.mapExtras2.tourNext()">▶</button>
        <button onclick="window.mapExtras2.tourStop()" class="tour-close">✕</button>
      </div>
    `;
  }

  // Open marker popup
  if (window.state?.markers) {
    const marker = window.state.markers.find(m => m.placeData?.id === place.id);
    if (marker) setTimeout(() => marker.openPopup(), 2200);
  }

  // Auto-advance
  clearTimeout(TOUR.timeout);
  TOUR.timeout = setTimeout(() => {
    TOUR.index++;
    tourStep();
  }, 4500);
}

function buildTourOverlay() {
  const mapEl = document.getElementById('map');
  if (!mapEl || document.getElementById('tourOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'tourOverlay';
  overlay.className = 'tour-overlay';
  mapEl.appendChild(overlay);
}

function stopTour() {
  TOUR.active = false;
  clearTimeout(TOUR.timeout);
  document.getElementById('tourOverlay')?.remove();
  showToast('🎬 Przelot zakończony');
}

window.mapExtras2 = window.mapExtras2 || {};
window.mapExtras2.tourPrev = () => { if (TOUR.index > 0) { TOUR.index--; tourStep(); } };
window.mapExtras2.tourNext = () => { TOUR.index++; tourStep(); };
window.mapExtras2.tourStop = stopTour;
window.mapExtras2.tourPause = function() {
  const btn = document.getElementById('tourPauseBtn');
  if (TOUR.timeout) {
    clearTimeout(TOUR.timeout);
    TOUR.timeout = null;
    if (btn) btn.textContent = '▶ Wznów';
  } else {
    if (btn) btn.textContent = '⏸ Pauza';
    TOUR.timeout = setTimeout(() => { TOUR.index++; tourStep(); }, 4500);
  }
};

// ============================================================
// #9 — POMIAR POWIERZCHNI (WIELOKĄT)
// ============================================================

const AREA = {
  active: false,
  points: [],
  layers: [],
  polygon: null
};

function toggleAreaMeasure() {
  const map = window.state?.map;
  if (!map) return;

  if (AREA.active) {
    clearArea();
    map.off('click', onAreaClick);
    AREA.active = false;
    document.getElementById('areaHint')?.remove();
    showToast('📐 Pomiar powierzchni wyłączony');
    return;
  }

  AREA.active = true;
  AREA.points = [];
  showToast('📐 Klikaj rogi obszaru. Min. 3 punkty.');

  // Hint bar
  const hint = document.createElement('div');
  hint.id = 'areaHint';
  hint.className = 'area-hint';
  hint.innerHTML = `<span>📐 Klikaj rogi obszaru</span><button onclick="window.mapExtras2.finishArea()">✓ Zakończ</button><button onclick="window.mapExtras2.toggleArea()">✕</button>`;
  document.getElementById('map')?.appendChild(hint);

  map.on('click', onAreaClick);
}

function onAreaClick(e) {
  const map = window.state.map;
  AREA.points.push([e.latlng.lat, e.latlng.lng]);

  const dot = L.circleMarker(e.latlng, { radius: 5, color: '#ff9900', fillColor: '#ff9900', fillOpacity: 1 }).addTo(map);
  AREA.layers.push(dot);

  if (AREA.polygon) map.removeLayer(AREA.polygon);
  if (AREA.points.length >= 2) {
    AREA.polygon = L.polygon(AREA.points, {
      color: '#ff9900', weight: 2, fillColor: '#ff9900', fillOpacity: 0.15, dashArray: '5,5'
    }).addTo(map);

    if (AREA.points.length >= 3) {
      const area = calcPolygonArea(AREA.points);
      AREA.polygon.bindTooltip(formatArea(area), { permanent: true, direction: 'center', className: 'area-tooltip' }).openTooltip();
    }
  }
}

function calcPolygonArea(points) {
  // Shoelace formula on lat/lng → m² (approximate for small areas)
  const R = 6378137; // Earth radius m
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [lat1, lng1] = points[i];
    const [lat2, lng2] = points[(i + 1) % n];
    area += (lng2 - lng1) * Math.PI / 180 *
      (2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180));
  }
  area = Math.abs(area * R * R / 2);
  return area;
}

function formatArea(m2) {
  if (m2 < 10000) return `📐 ${Math.round(m2)} m²`;
  return `📐 ${(m2 / 10000).toFixed(2)} ha (${(m2/1000000).toFixed(3)} km²)`;
}

window.mapExtras2.finishArea = function() {
  if (AREA.points.length < 3) { showToast('⚠️ Potrzeba min. 3 punktów'); return; }
  const area = calcPolygonArea(AREA.points);
  showToast(`📐 Powierzchnia: ${formatArea(area).replace('📐 ','')}`);
};

window.mapExtras2.toggleArea = toggleAreaMeasure;

function clearArea() {
  const map = window.state?.map;
  AREA.layers.forEach(l => map?.removeLayer(l));
  if (AREA.polygon) map?.removeLayer(AREA.polygon);
  AREA.layers = [];
  AREA.points = [];
  AREA.polygon = null;
}

// ============================================================
// #7 — HEATMAPA GĘSTOŚCI POI
// ============================================================

const POIHEAT = { layer: null, enabled: false };

function togglePoiHeatmap() {
  const map = window.state?.map;
  if (!map || !APP_DATA?.places) return;

  if (POIHEAT.enabled) {
    if (POIHEAT.layer) map.removeLayer(POIHEAT.layer);
    POIHEAT.layer = null;
    POIHEAT.enabled = false;
    updateExtras2Buttons();
    showToast('🔥 Heatmapa POI wyłączona');
    return;
  }

  const group = L.layerGroup();

  // For each place, draw a soft radial circle. Overlapping = hotter.
  APP_DATA.places.forEach(p => {
    L.circle([p.coords[1], p.coords[0]], {
      radius: 120,
      stroke: false,
      fillColor: '#ff6584',
      fillOpacity: 0.18,
      interactive: false
    }).addTo(group);
    L.circle([p.coords[1], p.coords[0]], {
      radius: 60,
      stroke: false,
      fillColor: '#ffd93d',
      fillOpacity: 0.22,
      interactive: false
    }).addTo(group);
  });

  group.addTo(map);
  POIHEAT.layer = group;
  POIHEAT.enabled = true;
  updateExtras2Buttons();
  showToast('🔥 Heatmapa gęstości miejsc — gorące = więcej POI');
}

// ============================================================
// #3 — PSEUDO-3D BUDYNKI (OSM footprints)
// ============================================================

const BUILDINGS = { layer: null, enabled: false, loading: false };

async function toggle3DBuildings() {
  const map = window.state?.map;
  if (!map) return;

  if (BUILDINGS.enabled) {
    if (BUILDINGS.layer) map.removeLayer(BUILDINGS.layer);
    BUILDINGS.layer = null;
    BUILDINGS.enabled = false;
    updateExtras2Buttons();
    showToast('🏢 Budynki 3D wyłączone');
    return;
  }

  if (BUILDINGS.loading) return;
  BUILDINGS.loading = true;
  showToast('🏢 Ładowanie budynków 3D...');

  try {
    // Fetch building footprints from Overpass for Niebuszewo
    const bbox = '53.448,14.543,14.462,14.571'; // will fix below
    const query = `[out:json][timeout:25];(way["building"](53.448,14.543,53.462,14.571););out geom;`;
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);

    let data = null;
    // Try our own proxy first (avoids CORS/blocking), then direct
    try {
      const res = await fetch('/api/buildings');
      if (res.ok) data = await res.json();
    } catch {}

    if (!data || !data.elements) {
      BUILDINGS.loading = false;
      showToast('🏢 Budynki 3D — używam uproszczonej wizualizacji');
      drawSimplifiedBuildings();
      return;
    }

    drawBuildings(data.elements);
  } catch (err) {
    BUILDINGS.loading = false;
    drawSimplifiedBuildings();
  }
}

function drawBuildings(elements) {
  const map = window.state?.map;
  if (!map) return;
  const group = L.layerGroup();

  elements.forEach(el => {
    if (!el.geometry) return;
    const coords = el.geometry.map(g => [g.lat, g.lon]);
    if (coords.length < 3) return;

    const levels = parseInt(el.tags?.['building:levels']) || 3;
    const shade = Math.min(0.15 + levels * 0.05, 0.5);

    // Shadow (offset = pseudo-3D)
    const offset = levels * 0.00003;
    const shadowCoords = coords.map(c => [c[0] - offset, c[1] + offset]);
    L.polygon(shadowCoords, { stroke: false, fillColor: '#000', fillOpacity: 0.2, interactive: false }).addTo(group);

    // Building top
    L.polygon(coords, {
      color: '#6c63ff', weight: 1, fillColor: '#8c7ae6', fillOpacity: shade, interactive: false
    }).addTo(group);
  });

  group.addTo(map);
  BUILDINGS.layer = group;
  BUILDINGS.enabled = true;
  BUILDINGS.loading = false;
  updateExtras2Buttons();
  showToast(`🏢 Budynki 3D włączone (${elements.length})`);
}

function drawSimplifiedBuildings() {
  // Fallback: draw stylized blocks around known places
  const map = window.state?.map;
  if (!map || !APP_DATA?.places) return;
  const group = L.layerGroup();

  APP_DATA.places.forEach(p => {
    const lat = p.coords[1], lon = p.coords[0];
    const s = 0.0004;
    const block = [[lat-s,lon-s],[lat+s,lon-s],[lat+s,lon+s],[lat-s,lon+s]];
    const offset = 0.0001;
    const shadow = block.map(c => [c[0]-offset, c[1]+offset]);
    L.polygon(shadow, { stroke: false, fillColor: '#000', fillOpacity: 0.18, interactive: false }).addTo(group);
    L.polygon(block, { color: '#6c63ff', weight: 1, fillColor: '#8c7ae6', fillOpacity: 0.3, interactive: false }).addTo(group);
  });

  group.addTo(map);
  BUILDINGS.layer = group;
  BUILDINGS.enabled = true;
  BUILDINGS.loading = false;
  updateExtras2Buttons();
}

// ============================================================
// PANEL BUTTONS
// ============================================================

function buildExtras2Panel() {
  const panel = document.getElementById('layerPanel');
  if (!panel || document.getElementById('btnTour')) return;

  const div = document.createElement('div');
  div.innerHTML = `
    <button class="lp-btn" id="btnPoiHeat" onclick="window.mapExtras2.togglePoiHeat()">🔥 Heatmapa POI</button>
    <button class="lp-btn" id="btn3D" onclick="window.mapExtras2.toggle3D()">🏢 Budynki 3D</button>
    <button class="lp-btn" id="btnArea" onclick="window.mapExtras2.toggleArea()">📐 Pomiar pola</button>
    <button class="lp-btn lp-btn-tour" id="btnTour" onclick="window.mapExtras2.startTour()">🎬 Przelot</button>
  `;
  while (div.firstChild) panel.appendChild(div.firstChild);
}

function updateExtras2Buttons() {
  document.getElementById('btnPoiHeat')?.classList.toggle('active', POIHEAT.enabled);
  document.getElementById('btn3D')?.classList.toggle('active', BUILDINGS.enabled);
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const wait = setInterval(() => {
    if (window.state?.map && document.getElementById('layerPanel')) {
      clearInterval(wait);
      buildExtras2Panel();
    }
  }, 400);
});

window.mapExtras2.startTour = startCinematicTour;
window.mapExtras2.togglePoiHeat = togglePoiHeatmap;
window.mapExtras2.toggle3D = toggle3DBuildings;
