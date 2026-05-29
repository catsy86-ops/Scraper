/**
 * Map UX Improvements Module (Leaflet Edition)
 * - Interactive legend with visibility controls
 * - Zoom level indicator
 * - Smart POI distance sorting
 */

'use strict';

const MAP_IMPROVEMENTS = {
  legendExpanded: true,
  hiddenCategories: new Set()
};

// ===== INTERACTIVE LEGEND =====
function initInteractiveLegend() {
  const mapLegend = document.getElementById('mapLegend');
  if (!mapLegend) return;

  // Make legend items clickable to toggle visibility
  mapLegend.querySelectorAll('.legend-item').forEach(item => {
    const dot = item.querySelector('.legend-dot');
    if (!dot) return;
    const category = Array.from(dot.classList).find(c => c !== 'legend-dot');
    if (!category) return;

    item.style.cursor = 'pointer';
    item.style.userSelect = 'none';
    item.title = `Kliknij aby ukryć ${category}`;

    item.addEventListener('click', () => {
      toggleCategoryVisibility(category, item);
    });
  });
}

function toggleCategoryVisibility(category, legendItem) {
  const map = window.state && window.state.map;
  if (!map) return;

  if (MAP_IMPROVEMENTS.hiddenCategories.has(category)) {
    MAP_IMPROVEMENTS.hiddenCategories.delete(category);
    // Show markers of this category
    window.state.markers.forEach(marker => {
      if (marker.placeData && marker.placeData.cat === category) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      }
    });
    if (legendItem) {
      legendItem.style.opacity = '1';
      legendItem.title = `Kliknij aby ukryć ${category}`;
    }
    showToast(`👁️ ${category.toUpperCase()} — widoczne`);
  } else {
    MAP_IMPROVEMENTS.hiddenCategories.add(category);
    // Hide markers of this category
    window.state.markers.forEach(marker => {
      if (marker.placeData && marker.placeData.cat === category) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
    });
    if (legendItem) {
      legendItem.style.opacity = '0.4';
      legendItem.title = `Kliknij aby pokazać ${category}`;
    }
    showToast(`👁️ ${category.toUpperCase()} — ukryte`);
  }
}

// ===== ZOOM LEVEL INDICATOR =====
function initZoomIndicator() {
  const map = window.state && window.state.map;
  if (!map) return;

  const indicator = document.createElement('div');
  indicator.id = 'zoomIndicator';
  indicator.style.cssText = `
    position: absolute;
    bottom: 100px;
    right: 12px;
    background: rgba(15,15,26,0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    color: #ccc;
    z-index: 1000;
    font-weight: 600;
    cursor: pointer;
  `;

  const mapContainer = document.getElementById('map');
  if (mapContainer) mapContainer.appendChild(indicator);

  function updateZoom() {
    const zoom = map.getZoom();
    const zoomLevel = Math.round(zoom * 10) / 10;
    const level = zoom < 14 ? '🔍 Oddalone' : zoom < 15.5 ? '📍 Ogólne' : zoom < 17 ? '🎯 Szczegóły' : '🔎 Blisko';
    indicator.innerHTML = `<div style="color:#6c63ff;margin-bottom:2px;">🔍 ${zoomLevel}</div><div>${level}</div>`;
  }

  map.on('zoomend', updateZoom);
  updateZoom();

  indicator.addEventListener('click', () => {
    map.setView([53.4025, 14.5520], 15, { animate: true });
    showToast('🎯 Powrót do centrum');
  });
}

// ===== SMART POI DISTANCE SORTING =====
function initDistanceSorting() {
  const placesSection = document.getElementById('section-places');
  if (!placesSection) return;

  const sortBtn = document.createElement('button');
  sortBtn.id = 'sortByDistanceBtn';
  sortBtn.textContent = '📍 Sortuj wg odległości';
  sortBtn.style.cssText = `
    background: var(--accent, #6c63ff);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 12px;
  `;

  const filterTabs = placesSection.querySelector('.filter-tabs');
  if (filterTabs) {
    filterTabs.parentNode.insertBefore(sortBtn, filterTabs.nextSibling);
  }

  sortBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('📍 Geolokalizacja niedostępna');
      return;
    }
    showToast('🔄 Pobieranie lokalizacji...');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const sorted = [...APP_DATA.places].sort((a, b) => {
          const dA = calcDist(userLat, userLng, a.coords[1], a.coords[0]);
          const dB = calcDist(userLat, userLng, b.coords[1], b.coords[0]);
          return dA - dB;
        });
        showToast(`📍 Posortowano po odległości (${sorted.length} miejsc)`);
      },
      () => showToast('❌ Brak dostępu do lokalizacji')
    );
  });
}

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ===== INITIALIZE ALL IMPROVEMENTS =====
function initMapImprovements() {
  const checkMap = setInterval(() => {
    if (window.state && window.state.map) {
      clearInterval(checkMap);
      setTimeout(() => {
        initInteractiveLegend();
        initZoomIndicator();
        initDistanceSorting();
      }, 500);
    }
  }, 200);
}

// Auto-init when document is ready
document.addEventListener('DOMContentLoaded', () => {
  const waitForApp = setInterval(() => {
    if (window.state && document.getElementById('app') && !document.getElementById('app').classList.contains('hidden')) {
      clearInterval(waitForApp);
      initMapImprovements();
    }
  }, 500);
});

// Export
window.mapImprovements = {
  initMapImprovements,
  toggleCategoryVisibility
};
