/**
 * Advanced Map Enhancements Module (Leaflet Edition)
 * Heatmaps, clustering, routing, measurements, export
 */

'use strict';

const MAP_ENHANCEMENTS = {
  heatmapEnabled: false,
  heatmapLayer: null,
  clusteringEnabled: false,
  clusterGroup: null,
  routingLine: null,
  measurementMode: false,
  measurementPoints: [],
  measurementLayers: [],
  geofenceLayers: []
};

// ===== HEATMAP: Simulated activity heatmap using circle markers =====
function toggleActivityHeatmap() {
  const map = window.state && window.state.map;
  if (!map) return;

  if (MAP_ENHANCEMENTS.heatmapEnabled && MAP_ENHANCEMENTS.heatmapLayer) {
    map.removeLayer(MAP_ENHANCEMENTS.heatmapLayer);
    MAP_ENHANCEMENTS.heatmapEnabled = false;
    MAP_ENHANCEMENTS.heatmapLayer = null;
    showToast('🔥 Heatmapa wyłączona');
    return;
  }

  const activityPoints = [
    // Park Kadziaka — spacery i jogging
    { lat: 53.4510, lng: 14.5437, weight: 0.9 },
    { lat: 53.4508, lng: 14.5440, weight: 0.85 },
    { lat: 53.4505, lng: 14.5435, weight: 0.8 },
    // Boisko sportowe
    { lat: 53.4520, lng: 14.5510, weight: 0.95 },
    { lat: 53.4522, lng: 14.5512, weight: 0.9 },
    // Przyjaciół Żołnierza — centrum handlowe
    { lat: 53.4548, lng: 14.5519, weight: 0.88 },
    { lat: 53.4546, lng: 14.5521, weight: 0.85 },
    // Szkoły
    { lat: 53.4501, lng: 14.5552, weight: 0.75 },
    { lat: 53.4503, lng: 14.5554, weight: 0.7 },
    // Bandurskiego — sklepy
    { lat: 53.4537, lng: 14.5636, weight: 0.7 },
    { lat: 53.4535, lng: 14.5634, weight: 0.65 }
  ];

  const heatGroup = L.layerGroup();
  activityPoints.forEach(point => {
    const radius = point.weight * 80;
    const opacity = point.weight * 0.4;
    L.circle([point.lat, point.lng], {
      radius: radius,
      color: 'transparent',
      fillColor: `hsl(${(1 - point.weight) * 240}, 100%, 50%)`,
      fillOpacity: opacity,
      interactive: false
    }).addTo(heatGroup);
  });

  heatGroup.addTo(map);
  MAP_ENHANCEMENTS.heatmapLayer = heatGroup;
  MAP_ENHANCEMENTS.heatmapEnabled = true;
  showToast('🔥 Mapa ciepła aktywności włączona');
}

// ===== CLUSTERING: Real marker clustering via Leaflet.markercluster =====
function enableMarkerClustering() {
  const map = window.state && window.state.map;
  if (!map) return;

  // Toggle off
  if (MAP_ENHANCEMENTS.clusteringEnabled && MAP_ENHANCEMENTS.clusterGroup) {
    map.removeLayer(MAP_ENHANCEMENTS.clusterGroup);
    MAP_ENHANCEMENTS.clusterGroup = null;
    MAP_ENHANCEMENTS.clusteringEnabled = false;
    // Re-add individual markers
    window.state.markers.forEach(m => {
      if (!map.hasLayer(m)) m.addTo(map);
    });
    showToast('📍 Grupowanie wyłączone');
    return;
  }

  if (typeof L.markerClusterGroup !== 'function') {
    // Fallback: just fit bounds to all markers
    const bounds = L.latLngBounds(window.state.markers.map(m => m.getLatLng()));
    map.fitBounds(bounds, { padding: [40, 40] });
    showToast('📍 Widok wszystkich markerów');
    return;
  }

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    iconCreateFunction: c => {
      const count = c.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-bubble">${count}</div>`,
        className: 'cluster-icon',
        iconSize: [40, 40]
      });
    }
  });

  // Move markers into cluster
  window.state.markers.forEach(m => {
    if (map.hasLayer(m)) map.removeLayer(m);
    cluster.addLayer(m);
  });
  map.addLayer(cluster);

  MAP_ENHANCEMENTS.clusterGroup = cluster;
  MAP_ENHANCEMENTS.clusteringEnabled = true;
  showToast('📍 Grupowanie markerów włączone');
}

// ===== ROUTING: Draw line between two POI =====
function enableRouting(startPlaceId, endPlaceId) {
  const map = window.state && window.state.map;
  if (!map) return;

  const startPlace = APP_DATA.places.find(p => p.id === startPlaceId);
  const endPlace = APP_DATA.places.find(p => p.id === endPlaceId);

  if (!startPlace || !endPlace) {
    showToast('⚠️ Wybierz początek i koniec trasy');
    return;
  }

  // Remove previous route
  if (MAP_ENHANCEMENTS.routingLine) {
    map.removeLayer(MAP_ENHANCEMENTS.routingLine);
  }

  const start = [startPlace.coords[1], startPlace.coords[0]];
  const end = [endPlace.coords[1], endPlace.coords[0]];

  MAP_ENHANCEMENTS.routingLine = L.polyline([start, end], {
    color: '#ff6584',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 6'
  }).addTo(map);

  // Fit bounds
  map.fitBounds(L.latLngBounds([start, end]), { padding: [60, 60] });

  // Calculate distance
  const distance = calculateDistance(start[0], start[1], end[0], end[1]);
  showToast(`📍 Trasa: ${distance.toFixed(2)}km (spacer ~${Math.round(distance * 12)} min)`);
}

// ===== MEASUREMENT: Click-to-measure distances =====
function enableMeasurementMode() {
  const map = window.state && window.state.map;
  if (!map) return;

  MAP_ENHANCEMENTS.measurementMode = !MAP_ENHANCEMENTS.measurementMode;

  if (!MAP_ENHANCEMENTS.measurementMode) {
    // Clear measurement layers
    MAP_ENHANCEMENTS.measurementLayers.forEach(layer => map.removeLayer(layer));
    MAP_ENHANCEMENTS.measurementLayers = [];
    MAP_ENHANCEMENTS.measurementPoints = [];
    map.off('click', onMeasurementClick);
    showToast('📏 Pomiar wyłączony');
    return;
  }

  MAP_ENHANCEMENTS.measurementPoints = [];
  MAP_ENHANCEMENTS.measurementLayers.forEach(layer => map.removeLayer(layer));
  MAP_ENHANCEMENTS.measurementLayers = [];
  showToast('📏 Kliknij na mapę aby zmierzyć odległość');
  map.on('click', onMeasurementClick);
}

function onMeasurementClick(e) {
  const map = window.state.map;
  MAP_ENHANCEMENTS.measurementPoints.push(e.latlng);

  // Add point marker
  const pointMarker = L.circleMarker(e.latlng, {
    radius: 6, color: '#ff9900', fillColor: '#ff9900', fillOpacity: 0.9
  }).addTo(map);
  MAP_ENHANCEMENTS.measurementLayers.push(pointMarker);

  if (MAP_ENHANCEMENTS.measurementPoints.length > 1) {
    const pts = MAP_ENHANCEMENTS.measurementPoints;
    // Draw line
    const line = L.polyline(pts, {
      color: '#ff9900', weight: 3, opacity: 0.8, dashArray: '6, 4'
    }).addTo(map);
    // Remove old line if exists
    if (MAP_ENHANCEMENTS.measurementLayers.length > pts.length) {
      const oldLine = MAP_ENHANCEMENTS.measurementLayers.find(l => l instanceof L.Polyline);
      if (oldLine) map.removeLayer(oldLine);
    }
    MAP_ENHANCEMENTS.measurementLayers.push(line);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      totalDistance += calculateDistance(pts[i].lat, pts[i].lng, pts[i+1].lat, pts[i+1].lng);
    }
    showToast(`📏 Odległość: ${totalDistance.toFixed(2)}km`);
  }
}

// ===== EXPORT: Download map as image =====
function exportMapAsImage() {
  const map = window.state && window.state.map;
  if (!map) return;

  // Leaflet doesn't have a built-in canvas export like Mapbox
  // Use html2canvas-like approach or just screenshot instruction
  showToast('📥 Użyj Print Screen lub narzędzia przeglądarki (Ctrl+Shift+S) aby zapisać mapę');
}

// ===== GEOFENCING: Interest zones =====
function addGeofences() {
  const map = window.state && window.state.map;
  if (!map) return;

  // Remove existing geofences
  MAP_ENHANCEMENTS.geofenceLayers.forEach(layer => map.removeLayer(layer));
  MAP_ENHANCEMENTS.geofenceLayers = [];

  const zones = [
    { name: 'Strefa Sportowa', center: [53.4520, 14.5510], radius: 200, color: '#ff6b6b' },
    { name: 'Strefa Handlowa', center: [53.4548, 14.5519], radius: 200, color: '#ffd93d' },
    { name: 'Strefa Zielona (Parki)', center: [53.4510, 14.5437], radius: 250, color: '#4ecdc4' }
  ];

  zones.forEach(zone => {
    const circle = L.circle(zone.center, {
      radius: zone.radius,
      color: zone.color,
      weight: 2,
      opacity: 0.6,
      fillColor: zone.color,
      fillOpacity: 0.1,
      dashArray: '6, 4'
    }).addTo(map);
    circle.bindTooltip(zone.name, { permanent: false, direction: 'center' });
    MAP_ENHANCEMENTS.geofenceLayers.push(circle);
  });

  showToast('🎯 Strefy zainteresowania dodane');
}

// ===== DISTANCE CALCULATION =====
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ===== EXPORT API =====
window.mapEnhancements = {
  toggleHeatmap: toggleActivityHeatmap,
  enableClustering: enableMarkerClustering,
  routing: enableRouting,
  measurement: enableMeasurementMode,
  export: exportMapAsImage,
  geofences: addGeofences,
  getClusterGroup: () => MAP_ENHANCEMENTS.clusterGroup,
  isClustering: () => MAP_ENHANCEMENTS.clusteringEnabled
};
