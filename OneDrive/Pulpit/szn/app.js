/* ===== SZCZECIN GUIDE — MAIN APP ===== */
'use strict';

// ===== CONFIG =====
// Mapbox public token — Replace with your own from mapbox.com
// Get token from: https://account.mapbox.com/tokens
// Set in browser console: localStorage.setItem('mapboxToken', 'your_token_here')
mapboxgl.accessToken = localStorage.getItem('mapboxToken') || '';

// ===== STATE =====
const state = {
  currentSection: 'map',
  currentCat: 'all',
  currentFilter: 'all',
  is3D: true,
  isDark: true,
  mapStyle: 'standard',
  markers: [],
  map: null,
  flyInterval: null,
  searchQuery: ''
};

// ===== CATEGORY COLORS =====
const CAT_COLORS = {
  sport: '#ff6b6b',
  food: '#ffd93d',
  shop: '#6bcb77',
  park: '#4ecdc4',
  service: '#a29bfe',
  edu: '#fd79a8'
};

const CAT_BG = {
  sport: 'rgba(255,107,107,0.15)',
  food: 'rgba(255,217,61,0.15)',
  shop: 'rgba(107,203,119,0.15)',
  park: 'rgba(78,205,196,0.15)',
  service: 'rgba(162,155,254,0.15)',
  edu: 'rgba(253,121,168,0.15)'
};

// ===== LOAD LEAFLET MAP IMMEDIATELY =====
function loadLeafletMapNow() {
  console.log('📥 Ładowanie Leaflet + OpenStreetMap...');
  
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // Load Leaflet CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
  document.head.appendChild(link);

  // Load Leaflet JS
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
  script.onload = () => {
    console.log('✅ Leaflet załadowany - inicjalizacja mapy...');
    
    // Initialize Leaflet map
    const map = L.map('map').setView([53.4025, 14.5520], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      minZoom: 1
    }).addTo(map);

    // Add layer control
    L.control.layers(
      {
        'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19
        }),
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
    ).addTo(map);

    // Add controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft' }).addTo(map);

    // Add highlight area
    const bounds = [
      [53.4005, 14.5490],
      [53.4055, 14.5555]
    ];
    L.rectangle(bounds, {
      color: '#6c63ff',
      weight: 2,
      opacity: 0.5,
      fill: true,
      fillColor: '#6c63ff',
      fillOpacity: 0.06,
      dashArray: '4, 2'
    }).addTo(map);

    // Add POI markers
    if (APP_DATA && APP_DATA.places) {
      APP_DATA.places.forEach(place => {
        const CAT_COLORS = {
          sport: '#ff6b6b',
          food: '#ffd93d',
          shop: '#6bcb77',
          park: '#4ecdc4',
          service: '#a29bfe',
          edu: '#fd79a8'
        };

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
          popupAnchor: [0, -40]
        });

        const marker = L.marker([place.coords[1], place.coords[0]], { icon: icon });
        marker.bindPopup(`
          <div style="font-size: 12px;">
            <strong>${place.name}</strong><br>
            📍 ${place.addr}<br>
            <button onclick="openPlaceModal(${place.id})" style="padding:4px 8px;background:${CAT_COLORS[place.cat]};color:white;border:none;border-radius:4px;cursor:pointer;margin-top:4px;">
              Szczegóły
            </button>
          </div>
        `);
        marker.addTo(map);
      });
    }

    // Add routes
    if (APP_DATA && APP_DATA.routes) {
      APP_DATA.routes.forEach(route => {
        L.polyline(
          route.coords.map(coord => [coord[1], coord[0]]),
          {
            color: route.color,
            weight: 4,
            opacity: 0.8,
            dashArray: '8, 4'
          }
        ).addTo(map);
      });
    }

    // Store map in state
    state.map = map;
    
    showToast('✅ Mapa OpenStreetMap załadowana! (100% darmowa)');
    console.log('✨ Mapa OpenStreetMap gotowa!');
  };
  
  script.onerror = () => {
    console.error('❌ Błąd ładowania Leaflet');
    showToast('❌ Błąd ładowania mapy');
  };
  
  document.head.appendChild(script);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Splash screen
  setTimeout(() => {
    document.getElementById('splash').style.opacity = '0';
    document.getElementById('splash').style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      document.getElementById('splash').style.display = 'none';
      document.getElementById('app').classList.remove('hidden');
      document.getElementById('app').style.display = 'flex';
      document.getElementById('app').style.flexDirection = 'column';
      document.getElementById('app').style.height = '100vh';
      initMap();
      initUI();
      renderPlaces();
      renderRoutes();
      renderInfo();
      renderTransport();
      renderEvents();
      renderCommunity();
      updateStatTotal();
    }, 500);
  }, 2200);
});

// ===== MAP INIT =====
function initMap() {
  console.log('🗺️ initMap() - Starting map initialization');
  
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Map container not found!');
    return;
  }

  // Check if token is available
  const token = localStorage.getItem('mapboxToken');
  
  if (!token || token === '') {
    console.log('📍 Brak Mapbox tokenu - NATYCHMIAST ładowanie Leaflet...');
    showToast('🗺️ Ładowanie mapy OpenStreetMap...');
    
    // Load Leaflet immediately
    loadLeafletMapNow();
    return;
  }

  console.log('✅ Mapbox token dostępny - załadowanie Mapbox');
  
  // Try to load Mapbox
  try {
    state.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/standard',
      center: APP_DATA.center,
      zoom: 15.5,
      pitch: 60,
      bearing: -20,
      antialias: true
    });

  map.on('load', () => {
    // Enable 3D buildings (Mapbox Standard style has them built-in)
    map.setConfigProperty('basemap', 'lightPreset', 'dusk');
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
    map.setConfigProperty('basemap', 'showTransitLabels', true);

    // Add street highlight for Łucznicza & Tarczowa
    addStreetHighlights();

    // Add markers
    addAllMarkers(APP_DATA.places);

    // Add route lines
    addRouteLines();

    // Fly-in animation on load
    setTimeout(() => {
      map.flyTo({
        center: APP_DATA.center,
        zoom: 15.5,
        pitch: 60,
        bearing: -20,
        duration: 2500,
        essential: true
      });
    }, 300);
  });

  // Navigation controls
  map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
}

function addStreetHighlights() {
  const map = state.map;

  // Highlight area around Łucznicza & Tarczowa
  map.addSource('area-highlight', {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [14.5490, 53.4005],
          [14.5555, 53.4005],
          [14.5555, 53.4055],
          [14.5490, 53.4055],
          [14.5490, 53.4005]
        ]]
      }
    }
  });

  map.addLayer({
    id: 'area-fill',
    type: 'fill',
    source: 'area-highlight',
    paint: {
      'fill-color': '#6c63ff',
      'fill-opacity': 0.06
    }
  });

  map.addLayer({
    id: 'area-border',
    type: 'line',
    source: 'area-highlight',
    paint: {
      'line-color': '#6c63ff',
      'line-width': 2,
      'line-opacity': 0.5,
      'line-dasharray': [4, 2]
    }
  });
}

function addRouteLines() {
  const map = state.map;

  APP_DATA.routes.forEach(route => {
    const sourceId = `route-${route.id}`;
    map.addSource(sourceId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: route.coords
        }
      }
    });

    map.addLayer({
      id: `route-line-${route.id}`,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'none' },
      paint: {
        'line-color': route.color,
        'line-width': 4,
        'line-opacity': 0.8,
        'line-dasharray': [2, 1]
      }
    });
  });
}

// ===== MARKERS =====
function addAllMarkers(places) {
  // Remove existing markers
  state.markers.forEach(m => m.remove());
  state.markers = [];

  places.forEach(place => {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.setAttribute('data-cat', place.cat);
    el.innerHTML = `
      <div class="marker-inner" style="background:${CAT_COLORS[place.cat]}">
        <span>${place.emoji}</span>
      </div>
      <div class="marker-pulse" style="background:${CAT_COLORS[place.cat]}"></div>
    `;
    el.style.cssText = `
      width: 44px; height: 44px; cursor: pointer;
      position: relative; display: flex; align-items: center; justify-content: center;
    `;

    // Inject marker styles once
    if (!document.getElementById('marker-styles')) {
      const style = document.createElement('style');
      style.id = 'marker-styles';
      style.textContent = `
        .marker-inner {
          width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg); display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          border: 2px solid rgba(255,255,255,0.3); transition: transform 0.2s ease;
        }
        .marker-inner span { transform: rotate(45deg); font-size: 16px; }
        .marker-pulse {
          position: absolute; width: 44px; height: 44px; border-radius: 50%;
          opacity: 0.3; animation: markerPulse 2s ease infinite;
          top: 0; left: 0;
        }
        .custom-marker:hover .marker-inner { transform: rotate(-45deg) scale(1.2); }
      `;
      document.head.appendChild(style);
    }

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      maxWidth: '240px'
    }).setHTML(`
      <div class="popup-inner">
        <div class="popup-cat" style="color:${CAT_COLORS[place.cat]}">${place.cat.toUpperCase()}</div>
        <div class="popup-name">${place.name}</div>
        <div class="popup-desc">${place.desc.substring(0, 80)}...</div>
        <button class="popup-btn" onclick="openPlaceModal(${place.id})">Zobacz szczegóły →</button>
      </div>
    `);

    const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat(place.coords)
      .setPopup(popup)
      .addTo(state.map);

    el.addEventListener('click', () => {
      state.map.flyTo({ center: place.coords, zoom: 17, pitch: 55, duration: 800 });
    });

    state.markers.push(marker);
  });
}

function filterMarkers(cat) {
  state.markers.forEach(marker => {
    const el = marker.getElement();
    const markerCat = el.getAttribute('data-cat');
    if (cat === 'all' || markerCat === cat) {
      el.style.display = 'flex';
    } else {
      el.style.display = 'none';
      if (marker.getPopup().isOpen()) marker.togglePopup();
    }
  });
}

// ===== MAP CONTROLS =====
function initMapControls() {
  const map = state.map;

  // 3D toggle
  document.getElementById('btn3D').addEventListener('click', () => {
    state.is3D = !state.is3D;
    map.easeTo({
      pitch: state.is3D ? 60 : 0,
      bearing: state.is3D ? -20 : 0,
      duration: 800
    });
    document.getElementById('btn3D').classList.toggle('active', state.is3D);
    showToast(state.is3D ? '🏙️ Widok 3D włączony' : '🗺️ Widok 2D włączony');
  });

  // Satellite
  document.getElementById('btnSatellite').addEventListener('click', () => {
    map.setStyle('mapbox://styles/mapbox/satellite-streets-v12');
    state.mapStyle = 'satellite';
    document.getElementById('btnSatellite').classList.add('active');
    document.getElementById('btnMapStreet').classList.remove('active');
    showToast('🛰️ Widok satelitarny');
    map.once('style.load', () => {
      addStreetHighlights();
      addAllMarkers(APP_DATA.places);
      addRouteLines();
    });
  });

  // Street
  document.getElementById('btnMapStreet').addEventListener('click', () => {
    map.setStyle('mapbox://styles/mapbox/standard');
    state.mapStyle = 'standard';
    document.getElementById('btnMapStreet').classList.add('active');
    document.getElementById('btnSatellite').classList.remove('active');
    showToast('🗺️ Widok uliczny');
    map.once('style.load', () => {
      map.setConfigProperty('basemap', 'lightPreset', state.isDark ? 'dusk' : 'day');
      addStreetHighlights();
      addAllMarkers(APP_DATA.places);
      addRouteLines();
    });
  });

  // Locate
  document.getElementById('btnLocate').addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('❌ Geolokalizacja niedostępna');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 16, pitch: 50, duration: 1200
        });
        showToast('📍 Znaleziono Twoją lokalizację');
      },
      () => {
        map.flyTo({ center: APP_DATA.center, zoom: 15.5, pitch: 60, duration: 1200 });
        showToast('📍 Powrót do centrum dzielnicy');
      }
    );
  });

  // Fly animation
  document.getElementById('btnFly').addEventListener('click', () => {
    if (state.flyInterval) {
      clearInterval(state.flyInterval);
      state.flyInterval = null;
      document.getElementById('btnFly').classList.remove('active');
      showToast('✈️ Animacja zatrzymana');
      return;
    }
    document.getElementById('btnFly').classList.add('active');
    showToast('✈️ Animacja lotu uruchomiona');
    let bearing = map.getBearing();
    state.flyInterval = setInterval(() => {
      bearing += 0.3;
      map.setBearing(bearing);
    }, 16);
  });

  // Street View (Google Maps)
  document.getElementById('btnStreetView').addEventListener('click', () => {
    if (window.googleMapsAPI && window.googleMapsAPI.toggleStreetView) {
      window.googleMapsAPI.toggleStreetView();
      showToast('📸 Google Street View');
    } else {
      showToast('⚠️ Street View nie dostępny');
    }
  });

  // Category filter
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCat = btn.dataset.cat;
      filterMarkers(state.currentCat);
    });
  });
}

// ===== UI INIT =====
function initUI() {
  initMapControls();

  // Map Tools Panel
  const toolsToggle = document.getElementById('toolsToggle');
  const toolsPanel = document.getElementById('mapToolsPanel');
  const toolsClose = document.getElementById('toolsClose');

  toolsToggle.addEventListener('click', () => {
    toolsPanel.classList.toggle('hidden');
    toolsToggle.style.background = toolsPanel.classList.contains('hidden') 
      ? 'rgba(26,26,46,0.9)' 
      : 'var(--accent)';
  });

  toolsClose.addEventListener('click', () => {
    toolsPanel.classList.add('hidden');
    toolsToggle.style.background = 'rgba(26,26,46,0.9)';
  });

  // Heatmap button
  document.getElementById('btnHeatmap').addEventListener('click', () => {
    window.mapEnhancements.toggleHeatmap();
    document.getElementById('btnHeatmap').classList.toggle('active');
  });

  // Clustering button
  document.getElementById('btnClustering').addEventListener('click', () => {
    window.mapEnhancements.enableClustering();
    document.getElementById('btnClustering').classList.toggle('active');
  });

  // Geofences button
  document.getElementById('btnGeofences').addEventListener('click', () => {
    window.mapEnhancements.geofences();
    document.getElementById('btnGeofences').classList.toggle('active');
  });

  // Routing
  document.getElementById('btnCalculateRoute').addEventListener('click', () => {
    const startId = parseInt(document.getElementById('routeStart').value);
    const endId = parseInt(document.getElementById('routeEnd').value);
    if (startId && endId) {
      window.mapEnhancements.routing(startId, endId);
    } else {
      showToast('⚠️ Wybierz początek i koniec trasy');
    }
  });

  // Populate route selects
  const selects = ['routeStart', 'routeEnd'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    APP_DATA.places.forEach(place => {
      const option = document.createElement('option');
      option.value = place.id;
      option.textContent = place.name;
      select.appendChild(option);
    });
  });

  // Measurement button
  document.getElementById('btnMeasure').addEventListener('click', () => {
    window.mapEnhancements.measurement();
    document.getElementById('btnMeasure').classList.toggle('active');
  });

  // Export button
  document.getElementById('btnExportMap').addEventListener('click', () => {
    window.mapEnhancements.export();
  });

  // Menu button
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
  });

  document.getElementById('closeSidebar').addEventListener('click', closeSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  }

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.section);
      closeSidebar();
    });
  });

  // Bottom nav
  document.querySelectorAll('.bnav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  // Search
  document.getElementById('searchBtn').addEventListener('click', () => {
    document.getElementById('searchBar').classList.remove('hidden');
    document.getElementById('searchInput').focus();
  });
  document.getElementById('searchClose').addEventListener('click', () => {
    document.getElementById('searchBar').classList.add('hidden');
    document.getElementById('searchInput').value = '';
    renderPlaces();
  });
  document.getElementById('searchInput').addEventListener('input', e => {
    state.searchQuery = e.target.value.toLowerCase();
    renderPlaces(state.searchQuery);
  });

  // Theme toggle
  document.getElementById('themeBtn').addEventListener('click', () => {
    state.isDark = !state.isDark;
    document.documentElement.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
    if (state.map && state.mapStyle === 'standard') {
      state.map.setConfigProperty('basemap', 'lightPreset', state.isDark ? 'dusk' : 'day');
    }
    showToast(state.isDark ? '🌙 Tryb ciemny' : '☀️ Tryb jasny');
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });
}

// ===== NAVIGATION =====
function navigateTo(section) {
  window.navigateTo = navigateTo; // expose globally for live.js
  state.currentSection = section;

  // Update sections
  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.section === section);
  });
  document.querySelectorAll('.bnav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });

  // If map section, resize map
  if (section === 'map' && state.map) {
    setTimeout(() => state.map.resize(), 100);
  }
}

// ===== RENDER PLACES =====
function renderPlaces(query = '') {
  const grid = document.getElementById('placesGrid');
  let places = APP_DATA.places;

  if (state.currentFilter !== 'all') {
    places = places.filter(p => p.cat === state.currentFilter);
  }
  if (query) {
    places = places.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query) ||
      p.cat.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    );
  }

  grid.innerHTML = places.map(p => `
    <div class="place-card" onclick="openPlaceModal(${p.id})">
      <div class="place-card-header" style="background:${CAT_BG[p.cat]}">
        <span style="font-size:52px">${p.emoji}</span>
        <span class="place-card-badge badge-${p.cat}">${p.cat}</span>
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
  `).join('');

  if (places.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <p>Brak wyników dla "${query}"</p>
    </div>`;
  }

  // Filter tabs
  document.querySelectorAll('#placesFilter .filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#placesFilter .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.dataset.filter;
      renderPlaces(state.searchQuery);
    });
  });
}

function flyToPlace(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place) return;
  navigateTo('map');
  setTimeout(() => {
    state.map.flyTo({
      center: place.coords,
      zoom: 17.5,
      pitch: 65,
      bearing: Math.random() * 60 - 30,
      duration: 1500
    });
    // Open popup
    state.markers.forEach(marker => {
      const el = marker.getElement();
      const lngLat = marker.getLngLat();
      if (Math.abs(lngLat.lng - place.coords[0]) < 0.0001) {
        setTimeout(() => marker.togglePopup(), 1600);
      }
    });
  }, 200);
}

function updateStatTotal() {
  document.getElementById('statTotal').textContent = APP_DATA.places.length;
}

// ===== RENDER ROUTES =====
function renderRoutes() {
  const list = document.getElementById('routesList');
  list.innerHTML = APP_DATA.routes.map(r => `
    <div class="route-card">
      <div class="route-header" onclick="toggleRoute(${r.id})">
        <div class="route-icon" style="background:${r.color}22">
          <span>${r.emoji}</span>
        </div>
        <div class="route-meta">
          <div class="route-name">${r.name}</div>
          <div class="route-info">
            <span class="route-tag">📏 ${r.distance}</span>
            <span class="route-tag">⏱️ ${r.time}</span>
            <span class="route-tag">🟢 ${r.difficulty}</span>
          </div>
        </div>
        <span style="color:var(--text2);font-size:20px" id="route-arrow-${r.id}">›</span>
      </div>
      <div class="route-body" id="route-body-${r.id}" style="display:none">
        <div class="route-desc">${r.desc}</div>
        <div class="route-stops">
          ${r.stops.map(s => `
            <div class="route-stop">
              <span class="stop-dot" style="background:${r.color}"></span>
              ${s}
            </div>
          `).join('')}
        </div>
        <button class="route-btn" onclick="showRouteOnMap(${r.id})" style="background:${r.color}">
          🗺️ Pokaż trasę na mapie
        </button>
      </div>
    </div>
  `).join('');
}

function toggleRoute(id) {
  const body = document.getElementById(`route-body-${id}`);
  const arrow = document.getElementById(`route-arrow-${id}`);
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  arrow.textContent = isOpen ? '›' : '⌄';
}

function showRouteOnMap(id) {
  const route = APP_DATA.routes.find(r => r.id === id);
  if (!route) return;
  navigateTo('map');

  setTimeout(() => {
    // Show route layer
    APP_DATA.routes.forEach(r => {
      state.map.setLayoutProperty(`route-line-${r.id}`, 'visibility', r.id === id ? 'visible' : 'none');
    });

    // Fit bounds to route
    const bounds = route.coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(route.coords[0], route.coords[0]));
    state.map.fitBounds(bounds, { padding: 80, pitch: 55, duration: 1500 });
    showToast(`🗺️ Trasa: ${route.name}`);
  }, 200);
}

// ===== RENDER INFO =====
function renderInfo() {
  const container = document.getElementById('infoCards');
  container.innerHTML = APP_DATA.info.map(item => `
    <div class="info-card">
      <div class="info-card-header">
        <span class="info-card-icon">${item.icon}</span>
        <h3 class="info-card-title">${item.title}</h3>
      </div>
      <p class="info-card-text">${item.text}</p>
      <div class="info-stats">
        ${item.stats.map(s => `
          <div class="info-stat">
            <div class="info-stat-num">${s.num}</div>
            <div class="info-stat-label">${s.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ===== RENDER TRANSPORT =====
function renderTransport() {
  const container = document.getElementById('transportGrid');
  container.innerHTML = APP_DATA.transport.map(t => `
    <div class="transport-card">
      <div class="transport-header">
        <div class="transport-icon" style="background:${t.color}22">
          ${t.icon}
        </div>
        <div>
          <div class="transport-title">${t.title}</div>
          <div class="transport-sub">${t.subtitle}</div>
        </div>
      </div>
      ${t.lines.length > 0 ? `
        <div class="lines-list">
          ${t.lines.map(l => `<span class="line-badge ${l.color}">${l.num}</span>`).join('')}
        </div>
      ` : ''}
      <div class="stop-info">
        ${t.stops.map(s => `
          <div class="stop-row">
            <span class="stop-name">🚏 ${s.name}</span>
            <span class="stop-dist">${s.dist}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ===== RENDER EVENTS =====
function renderEvents() {
  const container = document.getElementById('eventsList');
  container.innerHTML = APP_DATA.events.map(e => `
    <div class="event-card">
      <div class="event-date">
        <div class="event-day">${e.day}</div>
        <div class="event-month">${e.month}</div>
      </div>
      <div class="event-body">
        <div class="event-name">${e.name}</div>
        <div class="event-place">📍 ${e.place}</div>
        <div class="event-desc">${e.desc}</div>
        <span class="event-tag">${e.tag}</span>
      </div>
    </div>
  `).join('');
}

// ===== MODAL =====
function openPlaceModal(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place) return;

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-emoji">${place.emoji}</div>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span class="place-card-badge badge-${place.cat}" style="position:static">${place.cat}</span>
      <span style="color:var(--text2);font-size:13px">⭐ ${place.rating}/5</span>
    </div>
    <h2 class="modal-title">${place.name}</h2>
    <p class="modal-addr">📍 ${place.addr}</p>
    <p class="modal-desc">${place.desc}</p>
    <div class="modal-details">
      <div class="modal-detail">
        <span class="modal-detail-icon">⏰</span>
        <span><strong>Godziny:</strong> ${place.hours}</span>
      </div>
      ${place.phone ? `
        <div class="modal-detail">
          <span class="modal-detail-icon">📞</span>
          <span><strong>Telefon:</strong> <a href="tel:${place.phone}" style="color:var(--accent)">${place.phone}</a></span>
        </div>
      ` : ''}
      ${place.website ? `
        <div class="modal-detail">
          <span class="modal-detail-icon">🌐</span>
          <span><strong>Strona:</strong> <a href="https://${place.website}" target="_blank" style="color:var(--accent)">${place.website}</a></span>
        </div>
      ` : ''}
      ${place.tags ? `
        <div class="modal-detail" style="flex-wrap:wrap;gap:6px">
          <span class="modal-detail-icon">🏷️</span>
          ${place.tags.map(t => `<span style="background:var(--surface2);padding:3px 10px;border-radius:50px;font-size:12px">${t}</span>`).join('')}
        </div>
      ` : ''}
    </div>
    <div class="modal-actions">
      <button class="modal-action-btn btn-primary" onclick="flyToPlace(${place.id});closeModal()">
        🗺️ Pokaż na mapie
      </button>
      <button class="modal-action-btn btn-secondary" onclick="openGoogleMaps(${place.coords[1]},${place.coords[0]})">
        🧭 Nawiguj
      </button>
    </div>
  `;

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalOverlay').style.display = 'none';
}

function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// ===== TOAST =====
let toastTimeout;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.style.display = 'block';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
    toast.style.display = 'none';
  }, 2500);
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    document.getElementById('searchBar').classList.add('hidden');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  }
  if (e.key === '/' && !e.ctrlKey) {
    e.preventDefault();
    document.getElementById('searchBar').classList.remove('hidden');
    document.getElementById('searchInput').focus();
  }
});

// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
