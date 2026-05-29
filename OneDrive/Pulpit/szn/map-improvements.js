/**
 * Map UX Improvements Module
 * - Smart POI search with distance sorting
 * - Interactive legend with visibility controls
 * - Zoom level indicator
 * - Enhanced loading states
 * - Better map lighting based on time of day
 */

'use strict';

const MAP_IMPROVEMENTS = {
  legendExpanded: true,
  hiddenCategories: new Set(),
  lastZoomLevel: 0,
  mapLoading: false
};

// ===== INTERACTIVE LEGEND =====
function initInteractiveLegend() {
  const mapLegend = document.getElementById('mapLegend');
  if (!mapLegend) return;

  // Enhanced legend header
  const h4 = mapLegend.querySelector('h4');
  if (h4) {
    const legendTitle = h4.textContent;
    h4.innerHTML = `
      <span>${legendTitle}</span>
      <button class="legend-toggle-btn" id="legendToggleBtn" title="Rozwiń/Zwiń legendę">
        ⇅
      </button>
    `;

    document.getElementById('legendToggleBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLegendExpanded();
    });
  }

  // Make legend items clickable to toggle visibility
  mapLegend.querySelectorAll('.legend-item').forEach(item => {
    const dot = item.querySelector('.legend-dot');
    const category = dot ? Array.from(dot.classList).find(c => c !== 'legend-dot') : null;
    
    if (category) {
      item.style.cursor = 'pointer';
      item.style.userSelect = 'none';
      item.addEventListener('click', () => toggleCategoryVisibility(category));
      
      // Show it's clickable
      item.title = `Kliknij aby ${MAP_IMPROVEMENTS.hiddenCategories.has(category) ? 'pokazać' : 'ukryć'} ${category}`;
    }
  });

  showToast('💡 Kliknij na legendę aby pokazać/ukryć kategorie');
}

function toggleCategoryVisibility(category) {
  const map = window.state.map;
  if (!map) return;

  if (MAP_IMPROVEMENTS.hiddenCategories.has(category)) {
    MAP_IMPROVEMENTS.hiddenCategories.delete(category);
    filterMarkers('all'); // Re-apply current filter
    showToast(`👁️ ${category.toUpperCase()} — widoczne`);
  } else {
    MAP_IMPROVEMENTS.hiddenCategories.add(category);
    // Hide markers in this category
    state.markers.forEach(marker => {
      const el = marker.getElement();
      const markerCat = el.getAttribute('data-cat');
      if (markerCat === category) {
        el.style.display = 'none';
      }
    });
    showToast(`👁️ ${category.toUpperCase()} — ukryte`);
  }

  // Update legend item appearance
  document.querySelectorAll('.legend-item').forEach(item => {
    const dot = item.querySelector('.legend-dot');
    const cat = dot ? Array.from(dot.classList).find(c => c !== 'legend-dot') : null;
    if (cat === category) {
      if (MAP_IMPROVEMENTS.hiddenCategories.has(category)) {
        item.classList.add('hidden-cat');
        item.title = `Kliknij aby pokazać ${category}`;
      } else {
        item.classList.remove('hidden-cat');
        item.title = `Kliknij aby ukryć ${category}`;
      }
    }
  });
}

function toggleLegendExpanded() {
  const mapLegend = document.getElementById('mapLegend');
  if (!mapLegend) return;

  MAP_IMPROVEMENTS.legendExpanded = !MAP_IMPROVEMENTS.legendExpanded;
  const items = mapLegend.querySelectorAll('.legend-item');
  
  items.forEach(item => {
    item.style.display = MAP_IMPROVEMENTS.legendExpanded ? 'flex' : 'none';
  });

  const btn = document.getElementById('legendToggleBtn');
  if (btn) {
    btn.textContent = MAP_IMPROVEMENTS.legendExpanded ? '⇅' : '⇄';
  }
}

// ===== ZOOM LEVEL INDICATOR =====
function initZoomIndicator() {
  const map = window.state.map;
  if (!map) return;

  // Create indicator element
  const indicator = document.createElement('div');
  indicator.id = 'zoomIndicator';
  indicator.style.cssText = `
    position: absolute;
    bottom: 100px;
    right: 12px;
    background: rgba(15,15,26,0.9);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text2);
    z-index: 10;
    font-weight: 600;
    transition: all 0.3s ease;
    cursor: pointer;
  `;

  const mapContainer = map.getContainer();
  mapContainer.appendChild(indicator);

  function updateZoom() {
    const zoom = map.getZoom();
    const zoomLevel = Math.round(zoom * 10) / 10;
    const level = zoom < 14 ? '🔍 Oddalone' : zoom < 15.5 ? '📍 Ogólne' : zoom < 17 ? '🎯 Szczegóły' : '🔎 Blisko';
    
    indicator.innerHTML = `
      <div style="color: var(--accent); margin-bottom: 4px;">🔍 ${zoomLevel}</div>
      <div>${level}</div>
    `;
  }

  map.on('zoom', updateZoom);
  updateZoom();

  // Click to reset zoom
  indicator.addEventListener('click', () => {
    map.flyTo({
      center: APP_DATA.center,
      zoom: 15.5,
      pitch: 60,
      bearing: -20,
      duration: 1000
    });
    showToast('🎯 Powrót do centrum');
  });
}

// ===== BETTER LIGHTING BASED ON TIME OF DAY =====
function initAdaptiveLighting() {
  const map = window.state.map;
  if (!map || map.getStyle().name !== 'Standard') return;

  function updateLighting() {
    const hour = new Date().getHours();
    let preset = 'dusk'; // Default

    if (hour >= 6 && hour < 12) {
      preset = 'day';
    } else if (hour >= 12 && hour < 18) {
      preset = 'day';
    } else if (hour >= 18 && hour < 21) {
      preset = 'dusk';
    } else {
      preset = 'night';
    }

    try {
      map.setConfigProperty('basemap', 'lightPreset', preset);
    } catch (e) {
      // Ignore if not available
    }
  }

  updateLighting();
  setInterval(updateLighting, 5 * 60 * 1000); // Update every 5 min
}

// ===== SMART POI DISTANCE SORTING =====
function initDistanceSorting() {
  // Add distance sorting to places panel
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  // Create sort button
  const sortBtn = document.createElement('button');
  sortBtn.id = 'sortByDistanceBtn';
  sortBtn.textContent = '📍 Sortuj wg odległości';
  sortBtn.style.cssText = `
    background: var(--accent);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 12px;
    margin-top: 12px;
    transition: all 0.2s ease;
  `;
  sortBtn.addEventListener('mouseover', () => sortBtn.style.opacity = '0.9');
  sortBtn.addEventListener('mouseout', () => sortBtn.style.opacity = '1');

  const placesSection = document.getElementById('section-places');
  if (placesSection) {
    const filterTabs = placesSection.querySelector('.filter-tabs');
    if (filterTabs) {
      filterTabs.parentNode.insertBefore(sortBtn, filterTabs.nextSibling);
    }
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

        // Sort places by distance
        const sortedPlaces = [...APP_DATA.places].sort((a, b) => {
          const distA = calculateDistance(userLat, userLng, a.coords[1], a.coords[0]);
          const distB = calculateDistance(userLat, userLng, b.coords[1], b.coords[0]);
          return distA - distB;
        });

        // Render sorted places with distances
        const grid = document.getElementById('placesGrid');
        grid.innerHTML = sortedPlaces.map((p, i) => {
          const dist = calculateDistance(userLat, userLng, p.coords[1], p.coords[0]);
          const CAT_BG = {
            sport: 'rgba(255,107,107,0.15)',
            food: 'rgba(255,217,61,0.15)',
            shop: 'rgba(107,203,119,0.15)',
            park: 'rgba(78,205,196,0.15)',
            service: 'rgba(162,155,254,0.15)',
            edu: 'rgba(253,121,168,0.15)'
          };
          const CAT_COLORS = {
            sport: '#ff6b6b', food: '#ffd93d', shop: '#6bcb77',
            park: '#4ecdc4', service: '#a29bfe', edu: '#fd79a8'
          };
          return `
            <div class="place-card" onclick="openPlaceModal(${p.id})">
              <div class="place-card-header" style="background:${CAT_BG[p.cat]}">
                <span style="font-size:52px">${p.emoji}</span>
                <span class="place-card-badge badge-${p.cat}">${p.cat}</span>
                <span style="position:absolute;top:8px;right:8px;background:${CAT_COLORS[p.cat]};color:white;padding:2px 8px;border-radius:50px;font-size:11px;font-weight:600">
                  ${(dist * 1000).toFixed(0)}m
                </span>
              </div>
              <div class="place-card-body">
                <div class="place-card-name">${p.name}</div>
                <div class="place-card-addr">📍 ${p.addr}</div>
                <div class="place-card-desc">${p.desc.substring(0, 90)}...</div>
              </div>
              <div class="place-card-footer">
                <span class="place-card-hours">⏰ ${p.hours}</span>
                <button class="place-card-btn" onclick="event.stopPropagation(); flyToPlace(${p.id})">
                  🗺️ Na mapie
                </button>
              </div>
            </div>
          `;
        }).join('');

        showToast(`📍 Posortowano po odległości (${sortedPlaces.length} miejsc)`);
      },
      () => {
        showToast('❌ Brak dostępu do lokalizacji');
      }
    );
  });
}

// ===== HELPER: CALCULATE DISTANCE =====
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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

// ===== ENHANCED MAP LOADING STATE =====
function showMapLoading() {
  if (MAP_IMPROVEMENTS.mapLoading) return;
  MAP_IMPROVEMENTS.mapLoading = true;

  const loader = document.createElement('div');
  loader.id = 'mapLoader';
  loader.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15,15,26,0.95);
    backdrop-filter: blur(10px);
    padding: 24px;
    border-radius: 12px;
    z-index: 1000;
    text-align: center;
  `;
  loader.innerHTML = `
    <div style="font-size: 32px; margin-bottom: 12px;">🗺️</div>
    <div style="color: var(--text); margin-bottom: 12px; font-weight: 600;">Ładowanie mapy...</div>
    <div class="w-spinner" style="margin: auto;"></div>
  `;

  document.getElementById('map').appendChild(loader);
}

function hideMapLoading() {
  const loader = document.getElementById('mapLoader');
  if (loader) {
    loader.style.transition = 'opacity 0.3s ease';
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }
  MAP_IMPROVEMENTS.mapLoading = false;
}

// ===== INITIALIZE ALL IMPROVEMENTS =====
function initMapImprovements() {
  // Wait for map to be ready
  const checkMap = setInterval(() => {
    if (window.state && window.state.map) {
      clearInterval(checkMap);
      
      setTimeout(() => {
        initInteractiveLegend();
        initZoomIndicator();
        initAdaptiveLighting();
        initDistanceSorting();
      }, 500);
    }
  }, 100);
}

// Auto-init when document is ready
document.addEventListener('DOMContentLoaded', () => {
  const waitForApp = setInterval(() => {
    if (window.state && !document.getElementById('app').classList.contains('hidden')) {
      clearInterval(waitForApp);
      initMapImprovements();
    }
  }, 500);
});

// Export for manual use
window.mapImprovements = {
  initMapImprovements,
  toggleCategoryVisibility,
  hideMapLoading,
  showMapLoading
};
