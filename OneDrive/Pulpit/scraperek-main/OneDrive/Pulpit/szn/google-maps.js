/**
 * Google Maps 4D Integration Module
 * Street View + Panoramic imagery for Szczecin Łucznicza/Tarczowa
 * 
 * Features:
 * - Dual map view (Mapbox 3D + Google Street View)
 * - Panoramic Street View exploration
 * - 360° immersive experience
 * - Interactive POI integration
 * - Real-time location tracking
 */

'use strict';

const GOOGLE_MAPS = {
  apiKey: 'YOUR_GOOGLE_API_KEY', // Replace with actual key
  center: { lat: 53.4025, lng: 14.5520 }, // Łucznicza, Szczecin
  defaultHeading: 290,
  defaultPitch: 10,
  defaultZoom: 1,
  streetView: null,
  panorama: null,
  isStreetViewVisible: false,
  currentPOI: null,
  markerLocations: {}
};

// ===== INIT GOOGLE MAPS =====
function initGoogleMaps() {
  // Create Street View container reference
  const streetViewContainer = document.getElementById('streetViewContainer');
  if (!streetViewContainer) {
    console.warn('Street View container not found');
    return;
  }

  // Initialize Street View
  GOOGLE_MAPS.panorama = new google.maps.StreetViewPanorama(
    streetViewContainer,
    {
      position: GOOGLE_MAPS.center,
      pov: {
        heading: GOOGLE_MAPS.defaultHeading,
        pitch: GOOGLE_MAPS.defaultPitch
      },
      zoom: GOOGLE_MAPS.defaultZoom,
      disableDefaultUI: false,
      addressControl: true,
      showRoadLabels: true,
      controlSize: 40
    }
  );

  // Add Street View event listeners
  setupStreetViewListeners();
  
  // Populate marker locations for easy navigation
  populateMarkerLocations();

  console.log('✓ Google Maps initialized');
}

// ===== STREET VIEW LISTENERS =====
function setupStreetViewListeners() {
  const panorama = GOOGLE_MAPS.panorama;

  // Listen for POV changes (rotation, pitch)
  panorama.addListener('pov_changed', () => {
    const pov = panorama.getPov();
    updatePOVDisplay(pov);
  });

  // Listen for position changes
  panorama.addListener('position_changed', () => {
    const position = panorama.getPosition();
    updatePositionDisplay(position);
    updateMapCenterFromStreetView(position);
  });

  // Listen for Street View links
  panorama.addListener('links_changed', () => {
    updateNavigationButtons();
  });
}

// ===== POPULATE MARKER LOCATIONS =====
function populateMarkerLocations() {
  // Map data from APP_DATA.places to Street View coordinates
  if (typeof APP_DATA !== 'undefined' && APP_DATA.places) {
    APP_DATA.places.forEach(place => {
      GOOGLE_MAPS.markerLocations[place.id] = {
        name: place.name,
        coords: { lat: place.lat, lng: place.lng },
        category: place.cat,
        description: place.desc
      };
    });
  }
}

// ===== NAVIGATE TO POI =====
function navigateToStreetViewPOI(placeId) {
  const location = GOOGLE_MAPS.markerLocations[placeId];
  if (!location) {
    console.warn(`POI ${placeId} not found`);
    return;
  }

  const panorama = GOOGLE_MAPS.panorama;
  
  // Animate to the location
  panorama.setPosition(location.coords);
  
  // Set a reasonable heading (towards the location center)
  panorama.setPov({
    heading: GOOGLE_MAPS.defaultHeading,
    pitch: 15
  });

  GOOGLE_MAPS.currentPOI = placeId;
  updatePOIInfo(location);
  
  // Show Street View if hidden
  if (!GOOGLE_MAPS.isStreetViewVisible) {
    toggleStreetView();
  }
}

// ===== DUAL MAP VIEW =====
function toggleStreetView() {
  const container = document.getElementById('streetViewContainer');
  const mapContainer = document.getElementById('map');
  
  if (!container) return;

  const isVisible = !GOOGLE_MAPS.isStreetViewVisible;
  GOOGLE_MAPS.isStreetViewVisible = isVisible;

  if (isVisible) {
    // Show Street View - split screen
    container.classList.remove('hidden');
    container.style.display = 'block';
    container.style.width = '50%';
    mapContainer.style.width = '50%';
    
    // Trigger resize for Street View
    google.maps.event.trigger(GOOGLE_MAPS.panorama, 'resize');
    
    // Add visual indicator
    document.getElementById('streetViewToggle').classList.add('active');
  } else {
    // Hide Street View - full map
    container.classList.add('hidden');
    container.style.display = 'none';
    mapContainer.style.width = '100%';
    
    document.getElementById('streetViewToggle').classList.remove('active');
  }
}

// ===== PANORAMIC CONTROLS =====
function setupPanoramicControls() {
  const controls = document.getElementById('panoramicControls');
  if (!controls) return;

  // Zoom Street View
  document.getElementById('svZoomIn').addEventListener('click', () => {
    const zoom = GOOGLE_MAPS.panorama.getZoom();
    GOOGLE_MAPS.panorama.setZoom(Math.min(zoom + 1, 4));
  });

  document.getElementById('svZoomOut').addEventListener('click', () => {
    const zoom = GOOGLE_MAPS.panorama.getZoom();
    GOOGLE_MAPS.panorama.setZoom(Math.max(zoom - 1, 0));
  });

  // Rotate Street View
  document.getElementById('svRotateLeft').addEventListener('click', () => {
    rotatePanorama(-15);
  });

  document.getElementById('svRotateRight').addEventListener('click', () => {
    rotatePanorama(15);
  });

  // Toggle Street View
  document.getElementById('streetViewToggle').addEventListener('click', toggleStreetView);

  // Show nearby links
  document.getElementById('svShowLinks').addEventListener('click', showStreetViewLinks);

  // Reset view
  document.getElementById('svReset').addEventListener('click', resetStreetView);
}

// ===== ROTATE PANORAMA =====
function rotatePanorama(degrees) {
  const pov = GOOGLE_MAPS.panorama.getPov();
  GOOGLE_MAPS.panorama.setPov({
    heading: (pov.heading + degrees) % 360,
    pitch: pov.pitch
  });
}

// ===== SHOW STREET VIEW LINKS =====
function showStreetViewLinks() {
  const links = GOOGLE_MAPS.panorama.getLinks();
  const linksContainer = document.getElementById('streetViewLinks');
  
  if (!linksContainer) return;

  if (!links || links.length === 0) {
    linksContainer.innerHTML = '<p style="padding:10px;color:var(--text3)">Brak dostępnych powiązań</p>';
    return;
  }

  linksContainer.innerHTML = '<h4>Dostępne kierunki:</h4>';
  links.forEach(link => {
    const btn = document.createElement('button');
    btn.className = 'sv-link-btn';
    btn.textContent = `↔️ ${link.description || 'Dalej'}`;
    btn.addEventListener('click', () => {
      GOOGLE_MAPS.panorama.setPano(link.pano);
    });
    linksContainer.appendChild(btn);
  });
}

// ===== RESET STREET VIEW =====
function resetStreetView() {
  GOOGLE_MAPS.panorama.setPov({
    heading: GOOGLE_MAPS.defaultHeading,
    pitch: GOOGLE_MAPS.defaultPitch
  });
  GOOGLE_MAPS.panorama.setZoom(GOOGLE_MAPS.defaultZoom);
}

// ===== UPDATE POV DISPLAY =====
function updatePOVDisplay(pov) {
  const display = document.getElementById('povDisplay');
  if (!display) return;

  const heading = Math.round(pov.heading);
  const pitch = Math.round(pov.pitch);
  const zoom = Math.round(GOOGLE_MAPS.panorama.getZoom() * 100) / 100;

  const compassDir = getCompassDirection(heading);
  
  display.innerHTML = `
    <div class="pov-item">
      <span class="pov-label">Kierunek:</span>
      <span class="pov-value">${compassDir} (${heading}°)</span>
    </div>
    <div class="pov-item">
      <span class="pov-label">Kąt:</span>
      <span class="pov-value">${pitch}°</span>
    </div>
    <div class="pov-item">
      <span class="pov-label">Zoom:</span>
      <span class="pov-value">${zoom}x</span>
    </div>
  `;
}

// ===== UPDATE POSITION DISPLAY =====
function updatePositionDisplay(position) {
  const display = document.getElementById('positionDisplay');
  if (!display) return;

  display.innerHTML = `
    <div class="position-item">
      <span class="pos-label">Szerokość:</span>
      <span class="pos-value">${position.lat().toFixed(4)}°</span>
    </div>
    <div class="position-item">
      <span class="pos-label">Długość:</span>
      <span class="pos-value">${position.lng().toFixed(4)}°</span>
    </div>
  `;
}

// ===== UPDATE POI INFO =====
function updatePOIInfo(location) {
  const info = document.getElementById('poiStreetViewInfo');
  if (!info) return;

  const catEmoji = {
    sport: '⚽',
    food: '🍽️',
    shop: '🛒',
    park: '🌳',
    service: '🔧',
    edu: '📚'
  }[location.category] || '📍';

  info.innerHTML = `
    <div class="poi-sv-card">
      <div class="poi-sv-icon">${catEmoji}</div>
      <h3>${location.name}</h3>
      <p>${location.description}</p>
      <p class="poi-coords">📍 ${location.coords.lat.toFixed(4)}, ${location.coords.lng.toFixed(4)}</p>
    </div>
  `;
}

// ===== COMPASS DIRECTION =====
function getCompassDirection(heading) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return dirs[index];
}

// ===== UPDATE MAP CENTER FROM STREET VIEW =====
function updateMapCenterFromStreetView(position) {
  // If Mapbox map exists, update its center
  if (window.state && window.state.map) {
    window.state.map.easeTo({
      center: [position.lng(), position.lat()],
      duration: 500
    });
  }
}

// ===== UPDATE NAVIGATION BUTTONS =====
function updateNavigationButtons() {
  const links = GOOGLE_MAPS.panorama.getLinks();
  const navPanel = document.getElementById('streetViewNavigation');
  if (!navPanel) return;

  navPanel.innerHTML = '';
  if (links && links.length > 0) {
    links.forEach((link, idx) => {
      const btn = document.createElement('button');
      btn.className = 'nav-link-btn';
      btn.textContent = `${link.description || `Kierunek ${idx + 1}`}`;
      btn.addEventListener('click', () => {
        GOOGLE_MAPS.panorama.setPano(link.pano);
      });
      navPanel.appendChild(btn);
    });
  }
}

// ===== FULL SCREEN STREET VIEW =====
function enterFullscreenStreetView() {
  const container = document.getElementById('streetViewContainer');
  if (!container) return;

  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  }

  // Trigger resize
  setTimeout(() => {
    google.maps.event.trigger(GOOGLE_MAPS.panorama, 'resize');
  }, 500);
}

// ===== STREET VIEW SHARING =====
function generateStreetViewShareLink() {
  const position = GOOGLE_MAPS.panorama.getPosition();
  const pov = GOOGLE_MAPS.panorama.getPov();

  // Google Maps URL scheme
  const url = `https://www.google.com/maps/@${position.lat()},${position.lng()},0a,75y,${pov.heading}h,${pov.pitch}t/data=!3m1!1e3`;
  
  return url;
}

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.googleMapsAPI = {
  init: initGoogleMaps,
  navigateToPOI: navigateToStreetViewPOI,
  toggleStreetView: toggleStreetView,
  setupControls: setupPanoramicControls,
  rotatePanorama: rotatePanorama,
  enterFullscreen: enterFullscreenStreetView,
  getShareLink: generateStreetViewShareLink,
  getStreetViewPanorama: () => GOOGLE_MAPS.panorama
};

// Auto-initialize when DOM is ready (only if API loaded AND callback didn't already run)
document.addEventListener('DOMContentLoaded', () => {
  if (window.GOOGLE_MAPS_FAILED) return;
  // The async script uses callback=initGoogleMapsCallback. This is a fallback
  // in case the API was already present (cached) without firing the callback.
  setTimeout(() => {
    if (window.GOOGLE_MAPS_FAILED) return;
    if (typeof google !== 'undefined' && google.maps && !GOOGLE_MAPS.panorama) {
      try {
        initGoogleMaps();
        setupPanoramicControls();
      } catch (e) {
        console.warn('Google Maps init skipped:', e);
      }
    }
  }, 600);
});
