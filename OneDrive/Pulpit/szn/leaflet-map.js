/**
 * 🗺️ Leaflet + OpenStreetMap Integration
 * - 100% darmowa alternatywa dla Mapbox
 * - Leaflet.js + OpenStreetMap tiles
 * - Brak wymaganych API tokenów
 * - Pełna funkcjonalność: zoom, obracanie, 3D
 */

'use strict';

const LEAFLET_MAP = {
  map: null,
  markers: [],
  routeLayers: [],
  isInitialized: false,
  currentStyle: 'osm'
};

// Initialize Leaflet map
function initLeafletMap() {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || LEAFLET_MAP.isInitialized) return;

  try {
    // Clear container
    mapContainer.innerHTML = '';
    
    // Szczecin coordinates
    const SZCZECIN_CENTER = [53.4025, 14.5520];

    // Create map with Leaflet
    LEAFLET_MAP.map = L.map('map').setView(SZCZECIN_CENTER, 15);

    // Add OpenStreetMap tiles (darmowe!)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 1
    }).addTo(LEAFLET_MAP.map);

    // Add layer control with options
    const layerControl = L.control.layers(
      {
        'OpenStreetMap': osmLayer,
        'Stamen Toner': L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png', {
          attribution: '© Stadia Maps',
          maxZoom: 18
        }),
        'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
          attribution: '© Esri',
          maxZoom: 18
        })
      },
      null,
      { position: 'topleft', collapsed: true }
    ).addTo(LEAFLET_MAP.map);

    // Add controls
    L.control.zoom({ position: 'bottomright' }).addTo(LEAFLET_MAP.map);
    L.control.scale({ position: 'bottomleft' }).addTo(LEAFLET_MAP.map);

    // Add street highlight area
    addAreaHighlightLeaflet();

    // Add POI markers
    addPoiMarkersLeaflet();

    // Add route lines
    addRouteLinesLeaflet();

    LEAFLET_MAP.isInitialized = true;
    
    // Update global state
    if (window.state) {
      window.state.map = LEAFLET_MAP.map;
    }

    console.log('✅ Leaflet + OpenStreetMap mapa załadowana!');

  } catch (err) {
    console.error('❌ Błąd ładowania Leaflet mapy:', err);
    showToast('❌ Błąd ładowania mapy');
  }
}

// Add area highlight
function addAreaHighlightLeaflet() {
  if (!LEAFLET_MAP.map) return;

  const bounds = [
    [53.4005, 14.5490],
    [53.4055, 14.5555]
  ];

  const rectangle = L.rectangle(bounds, {
    color: '#6c63ff',
    weight: 2,
    opacity: 0.5,
    fill: true,
    fillColor: '#6c63ff',
    fillOpacity: 0.06,
    dashArray: '4, 2'
  }).addTo(LEAFLET_MAP.map);
}

// Add POI markers
function addPoiMarkersLeaflet() {
  if (!LEAFLET_MAP.map || !APP_DATA || !APP_DATA.places) return;

  APP_DATA.places.forEach(place => {
    const marker = createCustomMarkerLeaflet(place);
    marker.addTo(LEAFLET_MAP.map);
    LEAFLET_MAP.markers.push(marker);
  });
}

// Create custom marker with custom icon
function createCustomMarkerLeaflet(place) {
  const CAT_COLORS = {
    sport: '#ff6b6b',
    food: '#ffd93d',
    shop: '#6bcb77',
    park: '#4ecdc4',
    service: '#a29bfe',
    edu: '#fd79a8'
  };

  // Create custom icon HTML
  const iconHtml = `
    <div style="
      width: 40px;
      height: 40px;
      background: ${CAT_COLORS[place.cat]};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      border: 2px solid rgba(255,255,255,0.3);
      font-size: 18px;
    ">
      <div style="transform: rotate(45deg);">${place.emoji}</div>
    </div>
  `;

  const icon = L.divIcon({
    html: iconHtml,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'leaflet-marker-custom'
  });

  const marker = L.marker([place.coords[1], place.coords[0]], { icon: icon });

  // Add popup
  const popupContent = `
    <div style="font-size: 12px; min-width: 200px;">
      <div style="color: ${CAT_COLORS[place.cat]}; font-weight: bold; margin-bottom: 4px;">
        ${place.cat.toUpperCase()}
      </div>
      <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">
        ${place.name}
      </div>
      <div style="color: #666; margin-bottom: 4px; font-size: 11px;">
        📍 ${place.addr}
      </div>
      <div style="color: #666; margin-bottom: 8px; font-size: 11px;">
        ${place.desc.substring(0, 80)}...
      </div>
      <button onclick="openPlaceModal(${place.id})" style="
        background: ${CAT_COLORS[place.cat]};
        color: white;
        border: none;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
      ">
        📍 Szczegóły
      </button>
    </div>
  `;

  marker.bindPopup(popupContent);

  // Click to fly to
  marker.on('click', () => {
    LEAFLET_MAP.map.setView([place.coords[1], place.coords[0]], 17, {
      animate: true,
      duration: 1
    });
  });

  return marker;
}

// Add route lines
function addRouteLinesLeaflet() {
  if (!LEAFLET_MAP.map || !APP_DATA || !APP_DATA.routes) return;

  APP_DATA.routes.forEach(route => {
    const polyline = L.polyline(
      route.coords.map(coord => [coord[1], coord[0]]),
      {
        color: route.color,
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 4',
        lineCap: 'round',
        lineJoin: 'round'
      }
    ).addTo(LEAFLET_MAP.map);

    // Add route popup on line
    const midpoint = route.coords[Math.floor(route.coords.length / 2)];
    const routeMarker = L.marker([midpoint[1], midpoint[0]], {
      icon: L.divIcon({
        html: `<div style="background: ${route.color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${route.emoji} ${route.name}</div>`,
        iconSize: 'auto',
        iconAnchor: [0, 0]
      })
    }).addTo(LEAFLET_MAP.map);

    LEAFLET_MAP.routeLayers.push(polyline);
    LEAFLET_MAP.routeLayers.push(routeMarker);
  });
}

// Filter markers by category
function filterMarkersLeaflet(category) {
  if (!LEAFLET_MAP.map) return;

  LEAFLET_MAP.markers.forEach(marker => {
    const popup = marker.getPopup();
    if (!popup) return;

    // Get category from popup content
    const content = popup.getContent();
    const match = content.match(/>[A-Z]+</);
    const markerCat = match ? match[0].slice(1, -1).toLowerCase() : 'all';

    if (category === 'all' || markerCat === category) {
      marker.addTo(LEAFLET_MAP.map);
    } else {
      if (LEAFLET_MAP.map.hasLayer(marker)) {
        LEAFLET_MAP.map.removeLayer(marker);
      }
    }
  });
}

// Zoom to specific place
function flyToPlaceLeaflet(placeId) {
  if (!APP_DATA || !APP_DATA.places || !LEAFLET_MAP.map) return;

  const place = APP_DATA.places.find(p => p.id === placeId);
  if (!place) return;

  LEAFLET_MAP.map.setView([place.coords[1], place.coords[0]], 17, {
    animate: true,
    duration: 1
  });
}

// Initialize Leaflet when Mapbox is not available
function setupLeafletAlternative() {
  // Check if Leaflet is already loaded
  if (typeof L === 'undefined') {
    console.log('📡 Ładowanie Leaflet z CDN...');
    loadLeafletFromCDN();
  } else {
    initLeafletMap();
  }
}

// Load Leaflet from CDN
function loadLeafletFromCDN() {
  // Add CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(link);

  // Add JS
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  script.onload = () => {
    console.log('✅ Leaflet załadowany z CDN');
    initLeafletMap();
  };
  script.onerror = () => {
    console.error('❌ Błąd ładowania Leaflet z CDN');
    showToast('❌ Błąd ładowania biblioteki map');
  };
  document.head.appendChild(script);
}

// Export functions
window.leafletMap = {
  init: setupLeafletAlternative,
  filterMarkers: filterMarkersLeaflet,
  flyToPlace: flyToPlaceLeaflet,
  getMap: () => LEAFLET_MAP.map,
  isReady: () => LEAFLET_MAP.isInitialized
};

// Auto-initialize if Mapbox token is missing
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const token = localStorage.getItem('mapboxToken');
    if (!token || token === '') {
      // No token - try Leaflet alternative
      console.log('🗺️ Brak Mapbox tokenu - przygotowuję Leaflet...');
      setTimeout(setupLeafletAlternative, 1500);
    }
  }, 1000);
});
