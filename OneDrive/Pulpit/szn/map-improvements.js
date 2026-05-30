/**
 * Map UX Improvements — Leaflet Edition
 * - Interactive legend with POI counts
 * - Animated zoom indicator
 * - Animated route drawing
 * - Mini overview map
 */
'use strict';

const MAP_IMPROVEMENTS = {
  legendExpanded: true,
  hiddenCategories: new Set(),
  routeAnimInterval: null
};

// ===== INTERACTIVE LEGEND =====
function initInteractiveLegend() {
  const mapLegend = document.getElementById('mapLegend');
  if (!mapLegend) return;

  mapLegend.querySelectorAll('.legend-item').forEach(item => {
    const dot = item.querySelector('.legend-dot');
    if (!dot) return;
    const category = Array.from(dot.classList).find(c => c !== 'legend-dot');
    if (!category) return;
    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.title = `Kliknij aby ukryć ${category}`;
    item.addEventListener('click', () => toggleCategoryVisibility(category, item));
  });
}

function toggleCategoryVisibility(category, legendItem) {
  const map = window.state?.map;
  if (!map) return;

  if (MAP_IMPROVEMENTS.hiddenCategories.has(category)) {
    MAP_IMPROVEMENTS.hiddenCategories.delete(category);
    window.state.markers.forEach(m => {
      if (m.placeData?.cat === category && !map.hasLayer(m)) m.addTo(map);
    });
    if (legendItem) { legendItem.style.opacity = '1'; legendItem.title = `Kliknij aby ukryć ${category}`; }
    showToast(`👁️ ${category.toUpperCase()} — widoczne`);
  } else {
    MAP_IMPROVEMENTS.hiddenCategories.add(category);
    window.state.markers.forEach(m => {
      if (m.placeData?.cat === category && map.hasLayer(m)) map.removeLayer(m);
    });
    if (legendItem) { legendItem.style.opacity = '0.35'; legendItem.title = `Kliknij aby pokazać ${category}`; }
    showToast(`👁️ ${category.toUpperCase()} — ukryte`);
  }
}

// ===== ZOOM INDICATOR =====
function initZoomIndicator() {
  const map = window.state?.map;
  if (!map) return;

  const indicator = document.createElement('div');
  indicator.id = 'zoomIndicator';
  indicator.className = 'zoom-indicator';
  document.getElementById('map')?.appendChild(indicator);

  const zoomNames = [
    [0,  12,   '🌍 Kontynent'],
    [12, 13.5, '🏙️ Miasto'],
    [13.5,15,  '🏘️ Dzielnica'],
    [15, 16.5, '🏠 Osiedle'],
    [16.5,18,  '🔎 Ulica'],
    [18, 22,   '📍 Budynek']
  ];

  function update() {
    const z = map.getZoom();
    const entry = zoomNames.find(([min, max]) => z >= min && z < max) || zoomNames[zoomNames.length - 1];
    indicator.innerHTML = `
      <div class="zi-zoom">${z.toFixed(1)}</div>
      <div class="zi-label">${entry[2]}</div>`;
  }

  map.on('zoomend', update);
  update();

  indicator.addEventListener('click', () => {
    map.setView([53.4025, 14.5520], 15, { animate: true });
    showToast('🎯 Powrót do centrum');
  });
}

// ===== ANIMATED ROUTE DRAWING =====
// Called from showRouteOnMap — draws route with animation
function animateRoute(routeId) {
  const map = window.state?.map;
  if (!map || !APP_DATA?.routes) return;

  const route = APP_DATA.routes.find(r => r.id === routeId);
  if (!route) return;

  // Clear previous animation
  if (MAP_IMPROVEMENTS.routeAnimInterval) {
    clearInterval(MAP_IMPROVEMENTS.routeAnimInterval);
    MAP_IMPROVEMENTS.routeAnimInterval = null;
  }

  // Remove old animated line
  if (MAP_IMPROVEMENTS.animatedLine) {
    map.removeLayer(MAP_IMPROVEMENTS.animatedLine);
  }

  const coords = route.coords.map(c => [c[1], c[0]]);
  let drawn = [];
  let i = 0;

  MAP_IMPROVEMENTS.animatedLine = L.polyline([], {
    color: route.color,
    weight: 6,
    opacity: 0.9,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // Animate drawing point by point
  MAP_IMPROVEMENTS.routeAnimInterval = setInterval(() => {
    if (i >= coords.length) {
      clearInterval(MAP_IMPROVEMENTS.routeAnimInterval);
      MAP_IMPROVEMENTS.routeAnimInterval = null;
      // Add start/end markers
      addRouteEndpoints(route, coords);
      return;
    }
    drawn.push(coords[i]);
    MAP_IMPROVEMENTS.animatedLine.setLatLngs(drawn);
    i++;
  }, 60);
}

function addRouteEndpoints(route, coords) {
  const map = window.state?.map;
  if (!map) return;

  const startIcon = L.divIcon({
    html: `<div class="route-endpoint start" style="background:${route.color}">▶</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], className: ''
  });
  const endIcon = L.divIcon({
    html: `<div class="route-endpoint end" style="background:${route.color}">🏁</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14], className: ''
  });

  const startM = L.marker(coords[0], { icon: startIcon }).addTo(map);
  const endM = L.marker(coords[coords.length - 1], { icon: endIcon }).addTo(map);
  startM.bindPopup(`<b>Start:</b> ${route.stops?.[0]?.name || 'Start'}`);
  endM.bindPopup(`<b>Meta:</b> ${route.stops?.[route.stops.length - 1]?.name || 'Meta'}`);

  // Store for cleanup
  if (!MAP_IMPROVEMENTS.routeMarkers) MAP_IMPROVEMENTS.routeMarkers = [];
  MAP_IMPROVEMENTS.routeMarkers.forEach(m => map.removeLayer(m));
  MAP_IMPROVEMENTS.routeMarkers = [startM, endM];
}

// ===== INITIALIZE =====
function initMapImprovements() {
  const checkMap = setInterval(() => {
    if (window.state?.map) {
      clearInterval(checkMap);
      setTimeout(() => {
        initInteractiveLegend();
        initZoomIndicator();
      }, 500);
    }
  }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
  const wait = setInterval(() => {
    if (window.state && !document.getElementById('app')?.classList.contains('hidden')) {
      clearInterval(wait);
      initMapImprovements();
    }
  }, 500);
});

window.mapImprovements = {
  initMapImprovements,
  toggleCategoryVisibility,
  animateRoute
};
