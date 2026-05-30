/* ===== SZCZECIN GUIDE — MAIN APP (Leaflet Edition) ===== */
'use strict';

// ===== STATE =====
const state = {
  currentSection: 'map',
  currentCat: 'all',
  currentFilter: 'all',
  isDark: true,
  markers: [],
  leafletLayers: [],
  routePolylines: [],
  map: null,
  flyInterval: null,
  searchQuery: '',
  sortBy: 'default',      // default | rating | distance | name
  showFavoritesOnly: false
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
      handleDeepLink();
    }, 500);
  }, 2200);
});

// ===== DEEP LINK (#miejsce-X opens that place) =====
function handleDeepLink() {
  // Hide Street View button if Google Maps is unavailable
  if (window.GOOGLE_MAPS_FAILED) {
    const sv = document.getElementById('btnStreetView');
    if (sv) sv.style.display = 'none';
  }

  const hash = window.location.hash;
  const match = hash.match(/#miejsce-(\d+)/);
  if (match) {
    const id = parseInt(match[1]);
    navigateTo('places');
    setTimeout(() => openPlaceModal(id), 400);
  }
}

// ===== MAP INIT (Leaflet + OpenStreetMap) =====
function initMap() {
  console.log('🗺️ Inicjalizacja mapy Leaflet...');

  const mapContainer = document.getElementById('map');
  if (!mapContainer) {
    console.error('❌ Brak kontenera mapy!');
    return;
  }

  // Check if Leaflet is loaded
  if (typeof L === 'undefined') {
    console.log('⚠️ Leaflet nie załadowany, czekam...');
    setTimeout(initMap, 500);
    return;
  }

  try {
    // Clear any fallback content
    mapContainer.style.background = '';
    mapContainer.style.animation = '';
    mapContainer.innerHTML = '';

    // Initialize Leaflet map centered on Niebuszewo, Szczecin
    const map = L.map('map', {
      zoomControl: false
    }).setView([53.4530, 14.5520], 15);

    // Base tile layers — NO crossOrigin (it breaks tile display if the
    // tile server doesn't send CORS headers → tiles load but show blank/gray).
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    });

    // CARTO Voyager — colourful, modern default
    const voyagerLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // CARTO Dark — for night / dark theme
    const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    });

    // CARTO Light — clean, minimal
    const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    });

    // Esri satellite imagery
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    // If Voyager fails to load tiles, fall back to OSM
    let voyagerErrors = 0;
    voyagerLayer.on('tileerror', () => {
      voyagerErrors++;
      if (voyagerErrors === 4 && !map.hasLayer(osmLayer)) {
        console.warn('⚠️ CARTO tiles failing, switching to OpenStreetMap');
        map.removeLayer(voyagerLayer);
        osmLayer.addTo(map);
        state.currentBaseLayer = 'osm';
      }
    });

    // Store layers for switching (keys used by the style switcher UI)
    state.baseLayers = {
      voyager: voyagerLayer,
      dark: darkLayer,
      light: lightLayer,
      satellite: satelliteLayer,
      osm: osmLayer
    };
    state.currentBaseLayer = 'voyager';

    // Add controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    // Area highlight rectangle — Niebuszewo
    L.rectangle(
      [[53.4472, 14.5431], [53.4623, 14.5710]],
      { color: '#6c63ff', weight: 2, opacity: 0.4, fill: true, fillColor: '#6c63ff', fillOpacity: 0.04, dashArray: '4, 2' }
    ).addTo(map);

    // Add POI markers
    if (APP_DATA && APP_DATA.places) {
      APP_DATA.places.forEach(place => {
        const marker = createPoiMarker(place);
        marker.addTo(map);
        state.markers.push(marker);
      });
    }

    // Add routes
    if (APP_DATA && APP_DATA.routes) {
      APP_DATA.routes.forEach(route => {
        const polyline = L.polyline(
          route.coords.map(coord => [coord[1], coord[0]]),
          { color: route.color, weight: 4, opacity: 0.8, dashArray: '8, 4', lineCap: 'round', lineJoin: 'round' }
        );
        polyline.routeId = route.id;
        polyline.addTo(map);
        state.routePolylines.push(polyline);
      });
    }

    // Store map in state
    state.map = map;

    // CRITICAL: force Leaflet to recalculate container size so tiles load.
    map.invalidateSize(true);
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (mapContainer.clientHeight > 0) map.invalidateSize(true);
      });
      ro.observe(mapContainer);
    }
    setTimeout(() => map.invalidateSize(true), 100);
    setTimeout(() => map.invalidateSize(true), 500);
    setTimeout(() => map.invalidateSize(true), 1500);
    map.whenReady(() => setTimeout(() => map.invalidateSize(true), 50));
    window.addEventListener('resize', () => map.invalidateSize());

    // Initialize premium map features (style switcher, geolocation, etc.)
    if (window.mapPro && window.mapPro.init) {
      window.mapPro.init(map);
    }

    console.log('✨ Mapa Leaflet gotowa! Wysokość kontenera:', mapContainer.clientHeight);

  } catch (err) {
    console.error('❌ Błąd ładowania mapy:', err);
    showToast('❌ Błąd ładowania mapy');
  }
}

// ===== CREATE RICH POI MARKER =====
function createPoiMarker(place) {
  const PE = window.placesEnhanced;
  const status = PE ? PE.getOpenStatus(place) : null;
  const statusDot = status
    ? `<span class="mk-status ${status.open ? 'open' : 'closed'}"></span>`
    : '';

  const iconHtml = `
    <div class="mk-wrap" data-cat="${place.cat}">
      <div class="mk-pin" style="background:${CAT_COLORS[place.cat]}">
        <span class="mk-emoji">${place.emoji}</span>
      </div>
      ${statusDot}
      <div class="mk-pulse" style="border-color:${CAT_COLORS[place.cat]}"></div>
    </div>
  `;
  const icon = L.divIcon({
    html: iconHtml,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
    className: 'leaflet-marker-custom'
  });

  const marker = L.marker([place.coords[1], place.coords[0]], {
    icon: icon,
    riseOnHover: true
  });
  marker.placeData = place;

  const stars = PE ? PE.renderStars(place.rating || 0) : '';
  const statusBadge = status
    ? `<span class="pp-status ${status.open ? 'open' : 'closed'}">${status.open ? '🟢 Otwarte' : '🔴 Zamknięte'}</span>`
    : '';

  marker.bindPopup(`
    <div class="map-popup">
      <div class="pp-head" style="background:${place.gradient || CAT_COLORS[place.cat]}">
        <span class="pp-emoji">${place.emoji}</span>
        ${statusBadge}
      </div>
      <div class="pp-body">
        <div class="pp-cat" style="color:${CAT_COLORS[place.cat]}">${place.cat.toUpperCase()}</div>
        <div class="pp-name">${place.name}</div>
        <div class="pp-rating"><span class="pp-stars">${stars}</span> <b>${place.rating || '–'}</b></div>
        <div class="pp-addr">📍 ${place.addr}</div>
        <div class="pp-actions">
          <button class="pp-btn primary" onclick="openPlaceModal(${place.id})">Szczegóły</button>
          <button class="pp-btn" onclick="openGoogleMaps(${place.coords[1]},${place.coords[0]})">🧭</button>
        </div>
      </div>
    </div>
  `, { maxWidth: 260, minWidth: 220, closeButton: true, className: 'map-popup-wrapper' });

  return marker;
}

// ===== FILTER MARKERS (Leaflet, cluster-aware) =====
function filterMarkers(cat) {
  if (!state.map) return;
  state.currentCat = cat;

  const clusterGroup = (window.mapEnhancements && window.mapEnhancements.getClusterGroup)
    ? window.mapEnhancements.getClusterGroup()
    : null;

  state.markers.forEach(marker => {
    const place = marker.placeData;
    if (!place) return;
    const show = (cat === 'all' || place.cat === cat);

    if (clusterGroup) {
      // Cluster mode: add/remove from the cluster group
      if (show) {
        if (!clusterGroup.hasLayer(marker)) clusterGroup.addLayer(marker);
      } else {
        if (clusterGroup.hasLayer(marker)) clusterGroup.removeLayer(marker);
      }
    } else {
      // Normal mode: add/remove from map
      if (show) {
        if (!state.map.hasLayer(marker)) marker.addTo(state.map);
      } else {
        if (state.map.hasLayer(marker)) state.map.removeLayer(marker);
      }
    }
  });
}

// ===== MAP CONTROLS (Leaflet-compatible) =====
function initMapControls() {
  const map = state.map;
  if (!map) return;

  // 3D toggle — removed (handled via style switcher / Street View)

  // Fly animation (rotate around center)
  const btnFly = document.getElementById('btnFly');
  if (btnFly) {
    btnFly.addEventListener('click', () => {
      if (state.flyInterval) {
        clearInterval(state.flyInterval);
        state.flyInterval = null;
        btnFly.classList.remove('active');
        showToast('✈️ Animacja zatrzymana');
        return;
      }
      btnFly.classList.add('active');
      showToast('✈️ Lot wokół dzielnicy uruchomiony');
      let zoom = map.getZoom();
      let step = 0;
      const center = [53.4530, 14.5520];
      const radius = 0.003;
      state.flyInterval = setInterval(() => {
        step += 0.02;
        const lat = center[0] + radius * Math.sin(step);
        const lng = center[1] + radius * Math.cos(step);
        map.setView([lat, lng], zoom, { animate: false });
      }, 50);
    });
  }

  // Street View (Google Maps)
  const btnStreetView = document.getElementById('btnStreetView');
  if (btnStreetView) {
    btnStreetView.addEventListener('click', () => {
      if (window.GOOGLE_MAPS_FAILED) {
        showToast('⚠️ Street View niedostępny (brak ważnego klucza Google Maps)');
        return;
      }
      if (window.googleMapsAPI && window.googleMapsAPI.toggleStreetView && GOOGLE_MAPS && GOOGLE_MAPS.panorama) {
        window.googleMapsAPI.toggleStreetView();
        showToast('📸 Google Street View');
      } else {
        showToast('⚠️ Street View jeszcze się ładuje lub jest niedostępny');
      }
    });
  }

  // Category filter buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterMarkers(btn.dataset.cat);
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

  if (toolsToggle && toolsPanel) {
    toolsToggle.addEventListener('click', () => {
      toolsPanel.classList.toggle('hidden');
      toolsToggle.style.background = toolsPanel.classList.contains('hidden')
        ? 'rgba(26,26,46,0.9)'
        : 'var(--accent)';
    });
  }
  if (toolsClose && toolsPanel) {
    toolsClose.addEventListener('click', () => {
      toolsPanel.classList.add('hidden');
      if (toolsToggle) toolsToggle.style.background = 'rgba(26,26,46,0.9)';
    });
  }

  // Map enhancement tool buttons
  const btnHeatmap = document.getElementById('btnHeatmap');
  if (btnHeatmap) {
    btnHeatmap.addEventListener('click', () => {
      if (window.mapEnhancements) window.mapEnhancements.toggleHeatmap();
      btnHeatmap.classList.toggle('active');
    });
  }

  const btnClustering = document.getElementById('btnClustering');
  if (btnClustering) {
    btnClustering.addEventListener('click', () => {
      if (window.mapEnhancements) window.mapEnhancements.enableClustering();
      btnClustering.classList.toggle('active');
    });
  }

  const btnGeofences = document.getElementById('btnGeofences');
  if (btnGeofences) {
    btnGeofences.addEventListener('click', () => {
      if (window.mapEnhancements) window.mapEnhancements.geofences();
      btnGeofences.classList.toggle('active');
    });
  }

  // Routing
  const btnCalculateRoute = document.getElementById('btnCalculateRoute');
  if (btnCalculateRoute) {
    btnCalculateRoute.addEventListener('click', () => {
      const startId = parseInt(document.getElementById('routeStart').value);
      const endId = parseInt(document.getElementById('routeEnd').value);
      if (startId && endId && window.mapEnhancements) {
        window.mapEnhancements.routing(startId, endId);
      } else {
        showToast('⚠️ Wybierz początek i koniec trasy');
      }
    });
  }

  // Populate route selects
  const selects = ['routeStart', 'routeEnd'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    if (select && APP_DATA && APP_DATA.places) {
      APP_DATA.places.forEach(place => {
        const option = document.createElement('option');
        option.value = place.id;
        option.textContent = place.name;
        select.appendChild(option);
      });
    }
  });

  // Measurement button
  const btnMeasure = document.getElementById('btnMeasure');
  if (btnMeasure) {
    btnMeasure.addEventListener('click', () => {
      if (window.mapEnhancements) window.mapEnhancements.measurement();
      btnMeasure.classList.toggle('active');
    });
  }

  // Export button
  const btnExportMap = document.getElementById('btnExportMap');
  if (btnExportMap) {
    btnExportMap.addEventListener('click', () => {
      if (window.mapEnhancements) window.mapEnhancements.export();
    });
  }

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
    showToast(state.isDark ? '🌙 Tryb ciemny' : '☀️ Tryb jasny');
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  initPlacesToolbar();
}

// ===== PLACES TOOLBAR (sort + favorites + distance) =====
function initPlacesToolbar() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sortBy = sortSelect.value;
      if (state.sortBy === 'distance') {
        requestUserLocation(() => renderPlaces(state.searchQuery));
      } else {
        renderPlaces(state.searchQuery);
      }
    });
  }

  const favToggleBtn = document.getElementById('favToggleBtn');
  if (favToggleBtn) {
    favToggleBtn.addEventListener('click', () => {
      state.showFavoritesOnly = !state.showFavoritesOnly;
      favToggleBtn.classList.toggle('active', state.showFavoritesOnly);
      favToggleBtn.innerHTML = state.showFavoritesOnly ? '❤️ Ulubione' : '🤍 Ulubione';
      renderPlaces(state.searchQuery);
    });
  }

  const distSortBtn = document.getElementById('distSortBtn');
  if (distSortBtn) {
    distSortBtn.addEventListener('click', () => {
      requestUserLocation(() => {
        state.sortBy = 'distance';
        if (sortSelect) sortSelect.value = 'distance';
        distSortBtn.classList.add('active');
        renderPlaces(state.searchQuery);
        showToast('📍 Posortowano wg odległości od Ciebie');
      });
    });
  }
}

// ===== GEOLOCATION HELPER =====
function requestUserLocation(callback) {
  const PE = window.placesEnhanced;
  if (!navigator.geolocation || !PE) {
    showToast('❌ Geolokalizacja niedostępna');
    if (callback) callback();
    return;
  }
  showToast('🔄 Pobieranie lokalizacji...');
  navigator.geolocation.getCurrentPosition(
    pos => {
      PE.setUserLocation(pos.coords.latitude, pos.coords.longitude);
      if (callback) callback();
    },
    () => {
      // Fallback: use district center
      PE.setUserLocation(53.4530, 14.5520);
      showToast('📍 Używam centrum dzielnicy jako punktu odniesienia');
      if (callback) callback();
    }
  );
}

// ===== NAVIGATION =====
function navigateTo(section) {
  window.navigateTo = navigateTo;
  state.currentSection = section;

  document.querySelectorAll('.section').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const target = document.getElementById(`section-${section}`);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('active');
  }

  document.querySelectorAll('.nav-item').forEach(i => {
    i.classList.toggle('active', i.dataset.section === section);
  });
  document.querySelectorAll('.bnav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.section === section);
  });

  // If map section, invalidate size so Leaflet redraws tiles
  if (section === 'map' && state.map) {
    setTimeout(() => state.map.invalidateSize(), 100);
  }
}

// ===== RENDER PLACES (ENHANCED) =====
function renderPlaces(query = '') {
  const grid = document.getElementById('placesGrid');
  if (!grid) return;
  const PE = window.placesEnhanced;
  let places = [...APP_DATA.places];

  // Filter by category
  if (state.currentFilter !== 'all') {
    places = places.filter(p => p.cat === state.currentFilter);
  }
  // Filter favorites
  if (state.showFavoritesOnly && PE) {
    places = places.filter(p => PE.isFavorite(p.id));
  }
  // Search
  if (query) {
    places = places.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.desc.toLowerCase().includes(query) ||
      p.cat.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    );
  }

  // Sorting
  if (state.sortBy === 'rating') {
    places.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (state.sortBy === 'name') {
    places.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
  } else if (state.sortBy === 'distance' && PE) {
    places.sort((a, b) => {
      const da = PE.distanceToPlace(a), db = PE.distanceToPlace(b);
      if (da == null) return 1;
      if (db == null) return -1;
      return da - db;
    });
  } else {
    // default: featured first, then popular, then rating
    places.sort((a, b) => {
      if ((b.featured ? 1 : 0) !== (a.featured ? 1 : 0)) return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if ((b.popular ? 1 : 0) !== (a.popular ? 1 : 0)) return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  grid.innerHTML = places.map(p => renderPlaceCard(p)).join('');

  // Update count
  const countEl = document.getElementById('placesCount');
  if (countEl) {
    countEl.textContent = `${places.length} ${places.length === 1 ? 'miejsce' : (places.length < 5 ? 'miejsca' : 'miejsc')}`;
  }

  if (places.length === 0) {
    const msg = state.showFavoritesOnly
      ? 'Nie masz jeszcze ulubionych miejsc. Kliknij ❤️ na karcie miejsca.'
      : `Brak wyników dla "${query}"`;
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:48px;margin-bottom:12px">🔍</div>
      <p>${msg}</p>
    </div>`;
  }

  // Filter tabs
  document.querySelectorAll('#placesFilter .filter-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('#placesFilter .filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.currentFilter = tab.dataset.filter;
      renderPlaces(state.searchQuery);
    };
  });
}

// ===== RENDER SINGLE PLACE CARD =====
function renderPlaceCard(p) {
  const PE = window.placesEnhanced;
  const status = PE ? PE.getOpenStatus(p) : null;
  const fav = PE ? PE.isFavorite(p.id) : false;
  const dist = PE ? PE.distanceToPlace(p) : null;
  const stars = PE ? PE.renderStars(p.rating || 0) : '';
  const price = PE ? PE.renderPriceLevel(p.price) : '';

  const tagsHtml = (p.tags || []).slice(0, 3).map(t =>
    `<span class="card-tag">#${t}</span>`).join('');

  return `
    <div class="place-card ${p.featured ? 'is-featured' : ''}" onclick="openPlaceModal(${p.id})">
      ${p.featured ? '<span class="featured-ribbon">⭐ POLECANE</span>' : ''}
      <button class="fav-btn ${fav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFav(${p.id}, this)" title="Dodaj do ulubionych">
        ${fav ? '❤️' : '🤍'}
      </button>
      <div class="place-card-header" style="background:${p.gradient || CAT_BG[p.cat]}">
        ${p.image ? `<img src="${p.image}" class="place-card-img" alt="${p.name}" loading="lazy" onerror="this.style.display='none'">` : ''}
        <span style="font-size:52px;position:relative;z-index:1">${p.emoji}</span>
        <span class="place-card-badge badge-${p.cat}">${p.cat}</span>
        ${status ? `<span class="status-badge ${status.open ? 'is-open' : 'is-closed'}">${status.open ? '🟢' : '🔴'} ${status.label}</span>` : ''}
      </div>
      <div class="place-card-body">
        <div class="place-card-name">${p.name}</div>
        <div class="card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${p.rating || '–'}</span>
          ${p.reviewCount ? `<span class="review-count">(${p.reviewCount})</span>` : ''}
          ${price ? `<span class="card-price">${price}</span>` : ''}
        </div>
        <div class="place-card-addr">📍 ${p.addr}${dist != null ? ` · <strong>${PE.formatDistance(dist)}</strong>` : ''}</div>
        <div class="place-card-desc">${p.desc.substring(0, 80)}...</div>
        <div class="card-tags">${tagsHtml}</div>
      </div>
      <div class="place-card-footer">
        <span class="place-card-hours ${status && !status.open ? 'closed' : ''}">⏰ ${status ? status.sub : p.hours}</span>
        <button class="place-card-btn" onclick="event.stopPropagation(); flyToPlace(${p.id})">
          🗺️ Na mapie
        </button>
      </div>
    </div>
  `;
}

// ===== TOGGLE FAVORITE =====
function toggleFav(id, btn) {
  const PE = window.placesEnhanced;
  if (!PE) return;
  const isFav = PE.toggleFavorite(id);
  btn.textContent = isFav ? '❤️' : '🤍';
  btn.classList.toggle('active', isFav);
  showToast(isFav ? '❤️ Dodano do ulubionych' : '🤍 Usunięto z ulubionych');
  if (state.showFavoritesOnly) renderPlaces(state.searchQuery);
}

// ===== FLY TO PLACE (Leaflet) =====
function flyToPlace(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place || !state.map) return;
  navigateTo('map');
  setTimeout(() => {
    state.map.setView([place.coords[1], place.coords[0]], 17, { animate: true, duration: 1.5 });
    // Open popup for matching marker
    state.markers.forEach(marker => {
      if (marker.placeData && marker.placeData.id === id) {
        setTimeout(() => marker.openPopup(), 800);
      }
    });
  }, 200);
}

function updateStatTotal() {
  const el = document.getElementById('statTotal');
  if (el) el.textContent = APP_DATA.places.length;
}

// ===== RENDER ROUTES (ENHANCED) =====
const ROUTE_FAVS_KEY = 'lucznicza_route_favs';
const routeState = { filter: 'all', activeTimer: null, timerRouteId: null, timerStart: null };

function getRouteFavs() {
  try { return JSON.parse(localStorage.getItem(ROUTE_FAVS_KEY) || '[]'); } catch { return []; }
}
function toggleRouteFav(id) {
  let favs = getRouteFavs();
  favs = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id];
  localStorage.setItem(ROUTE_FAVS_KEY, JSON.stringify(favs));
  return favs.includes(id);
}

function renderRoutes() {
  const container = document.getElementById('section-routes');
  if (!container) return;

  // Build the full section HTML
  container.querySelector('.section-content').innerHTML = `
    <div class="section-hero">
      <h2>🚶 Trasy spacerowe</h2>
      <p>Odkryj dzielnicę pieszo, rowerem lub biegiem</p>
    </div>

    <!-- Stats bar -->
    <div class="routes-stats-bar">
      <div class="rst-item"><span class="rst-num">${APP_DATA.routes.length}</span><span class="rst-label">Tras</span></div>
      <div class="rst-item"><span class="rst-num">${APP_DATA.routes.filter(r=>r.type==='walk').length}</span><span class="rst-label">Spacerowych</span></div>
      <div class="rst-item"><span class="rst-num">${APP_DATA.routes.filter(r=>r.type==='bike').length}</span><span class="rst-label">Rowerowych</span></div>
      <div class="rst-item"><span class="rst-num">${APP_DATA.routes.filter(r=>r.type==='run').length}</span><span class="rst-label">Biegowych</span></div>
      <div class="rst-item"><span class="rst-num" id="totalParticipants">0</span><span class="rst-label">Uczestników</span></div>
    </div>

    <!-- Filter tabs -->
    <div class="routes-filter-tabs" id="routesFilterTabs">
      <button class="rft-btn active" data-type="all">🗺️ Wszystkie</button>
      <button class="rft-btn" data-type="walk">🚶 Spacer</button>
      <button class="rft-btn" data-type="bike">🚴 Rower</button>
      <button class="rft-btn" data-type="run">🏃 Bieg</button>
      <button class="rft-btn" data-type="fav">❤️ Ulubione</button>
    </div>

    <!-- Routes list -->
    <div class="routes-list" id="routesList"></div>
  `;

  // Wire filter tabs
  container.querySelectorAll('.rft-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.rft-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      routeState.filter = btn.dataset.type;
      renderRouteCards();
    });
  });

  renderRouteCards();
  // Update total participants count
  setTimeout(() => {
    if (window.routesMeetup) {
      const total = APP_DATA.routes.reduce((sum, r) => sum + window.routesMeetup.getJoined(r.id).length, 0);
      const el = document.getElementById('totalParticipants');
      if (el) el.textContent = total;
    }
  }, 100);
}

function renderRouteCards() {
  const list = document.getElementById('routesList');
  if (!list) return;
  const favs = getRouteFavs();
  let routes = APP_DATA.routes;

  if (routeState.filter === 'fav') {
    routes = routes.filter(r => favs.includes(r.id));
  } else if (routeState.filter !== 'all') {
    routes = routes.filter(r => r.type === routeState.filter);
  }

  if (!routes.length) {
    list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text2)">
      <div style="font-size:48px;margin-bottom:12px">🗺️</div>
      <p>Brak tras w tej kategorii</p>
    </div>`;
    return;
  }

  list.innerHTML = routes.map(r => renderRouteCard(r, favs.includes(r.id))).join('');
}

function renderRouteCard(r, isFav) {
  const typeIcon = { walk: '🚶', bike: '🚴', run: '🏃' }[r.type] || '🗺️';
  const typeLabel = { walk: 'Spacer', bike: 'Rower', run: 'Bieg' }[r.type] || '';
  const diffColor = r.difficultyLevel === 1 ? '#43e97b' : r.difficultyLevel === 2 ? '#ffd93d' : '#ff6584';
  const diffDots = '●'.repeat(r.difficultyLevel) + '○'.repeat(3 - r.difficultyLevel);
  const tagsHtml = (r.tags || []).map(t => `<span class="route-tag-pill">#${t}</span>`).join('');
  const highlightsHtml = (r.highlights || []).map(h => `<li>${h}</li>`).join('');
  const stopsHtml = (r.stops || []).map((s, i) => `
    <div class="route-stop-item ${i === 0 ? 'start' : i === (r.stops.length-1) ? 'end' : ''}">
      <div class="rsi-dot" style="background:${r.color}">
        ${i === 0 ? '▶' : i === (r.stops.length-1) ? '🏁' : (i+1)}
      </div>
      <div class="rsi-info">
        <span class="rsi-emoji">${s.emoji}</span>
        <div>
          <div class="rsi-name">${s.name}</div>
          <div class="rsi-addr">${s.addr}</div>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <div class="route-card-v2" id="rcard-${r.id}">
      <!-- Hero -->
      <div class="rc2-hero" style="background:linear-gradient(135deg,${r.color}dd,${r.color}88)">
        <div class="rc2-hero-left">
          <span class="rc2-emoji">${r.emoji}</span>
          <div>
            <div class="rc2-type-badge">${typeIcon} ${typeLabel}</div>
            <div class="rc2-name">${r.name}</div>
          </div>
        </div>
        <button class="rc2-fav ${isFav ? 'active' : ''}" onclick="toggleRouteCardFav(${r.id}, this)">
          ${isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <!-- Quick stats -->
      <div class="rc2-stats">
        <div class="rc2-stat">
          <span class="rc2-stat-icon">📏</span>
          <span class="rc2-stat-val">${r.distance}</span>
          <span class="rc2-stat-lbl">Dystans</span>
        </div>
        <div class="rc2-stat">
          <span class="rc2-stat-icon">⏱️</span>
          <span class="rc2-stat-val">${r.time}</span>
          <span class="rc2-stat-lbl">Czas</span>
        </div>
        <div class="rc2-stat">
          <span class="rc2-stat-icon">🔥</span>
          <span class="rc2-stat-val">${r.calories}</span>
          <span class="rc2-stat-lbl">kcal</span>
        </div>
        <div class="rc2-stat">
          <span class="rc2-stat-icon" style="color:${diffColor}">${diffDots}</span>
          <span class="rc2-stat-val" style="color:${diffColor}">${r.difficulty}</span>
          <span class="rc2-stat-lbl">Poziom</span>
        </div>
      </div>

      <!-- Difficulty bar -->
      <div class="rc2-diff-bar">
        <div class="rc2-diff-fill" style="width:${r.difficultyLevel * 33.3}%;background:${diffColor}"></div>
      </div>

      <!-- Tags -->
      <div class="rc2-tags">${tagsHtml}</div>

      <!-- Description (collapsed by default) -->
      <div class="rc2-body" id="rbody-${r.id}" style="display:none">
        <p class="rc2-desc">${r.desc}</p>

        ${r.highlights ? `
          <div class="rc2-section-title">✨ Atrakcje na trasie</div>
          <ul class="rc2-highlights">${highlightsHtml}</ul>
        ` : ''}

        <div class="rc2-section-title">📍 Punkty trasy</div>
        <div class="rc2-stops">${stopsHtml}</div>

        <div class="rc2-meta-row">
          <span>🌍 ${r.terrain}</span>
          <span>🕐 Najlepiej: ${r.bestTime}</span>
        </div>

        <!-- Calorie calculator -->
        <div class="rc2-calc">
          <div class="rc2-calc-title">🔥 Kalkulator kalorii</div>
          <div class="rc2-calc-row">
            <label>Waga (kg):</label>
            <input type="number" class="rc2-weight-input" id="weight-${r.id}" value="70" min="30" max="200" />
            <button class="rc2-calc-btn" onclick="calcRouteCalories(${r.id}, ${r.distanceNum})">Oblicz</button>
          </div>
          <div class="rc2-calc-result" id="calc-result-${r.id}"></div>
        </div>

        <!-- Action buttons -->
        <div class="rc2-actions">
          <button class="rc2-btn primary" onclick="showRouteOnMap(${r.id})">
            🗺️ Pokaż na mapie
          </button>
          <button class="rc2-btn timer ${routeState.timerRouteId === r.id ? 'active' : ''}" id="timer-btn-${r.id}" onclick="toggleRouteTimer(${r.id})">
            ${routeState.timerRouteId === r.id ? '⏹ Stop' : '▶ Start trasy'}
          </button>
          <button class="rc2-btn share" onclick="shareRoute(${r.id})">
            🔗 Udostępnij
          </button>
        </div>

        <!-- Timer display -->
        <div class="rc2-timer hidden" id="timer-display-${r.id}">
          <span class="timer-icon">⏱️</span>
          <span class="timer-time" id="timer-time-${r.id}">00:00</span>
          <span class="timer-label">czas trasy</span>
        </div>

        <!-- ===== MEETUP SECTION ===== -->
        ${window.routesMeetup ? window.routesMeetup.renderMeetupSection(r.id, r.color) : ''}

      </div>

      <!-- Toggle button -->
      <button class="rc2-toggle" onclick="toggleRouteCard(${r.id})" id="rtoggle-${r.id}">
        <span>Szczegóły trasy</span>
        <span class="rc2-arrow" id="rarrow-${r.id}">›</span>
      </button>
    </div>
  `;
}

function toggleRouteCard(id) {
  const body = document.getElementById(`rbody-${id}`);
  const arrow = document.getElementById(`rarrow-${id}`);
  const toggle = document.getElementById(`rtoggle-${id}`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '›' : '⌄';
  if (toggle) toggle.querySelector('span').textContent = isOpen ? 'Szczegóły trasy' : 'Zwiń';
}

function toggleRouteCardFav(id, btn) {
  const isFav = toggleRouteFav(id);
  btn.textContent = isFav ? '❤️' : '🤍';
  btn.classList.toggle('active', isFav);
  showToast(isFav ? '❤️ Trasa dodana do ulubionych' : '🤍 Usunięto z ulubionych');
  if (routeState.filter === 'fav') renderRouteCards();
}

function calcRouteCalories(routeId, distanceKm) {
  const input = document.getElementById(`weight-${routeId}`);
  const result = document.getElementById(`calc-result-${routeId}`);
  if (!input || !result) return;
  const weight = parseFloat(input.value) || 70;
  const route = APP_DATA.routes.find(r => r.id === routeId);
  const MET = { walk: 3.5, bike: 6.0, run: 9.0 }[route?.type] || 3.5;
  const timeH = (route?.timeMin || 20) / 60;
  const kcal = Math.round(MET * weight * timeH);
  result.innerHTML = `<span class="calc-kcal">🔥 ${kcal} kcal</span> <span class="calc-note">dla ${weight}kg · ${route?.time}</span>`;
}

// ===== ROUTE TIMER =====
function toggleRouteTimer(routeId) {
  const btn = document.getElementById(`timer-btn-${routeId}`);
  const display = document.getElementById(`timer-display-${routeId}`);
  const timeEl = document.getElementById(`timer-time-${routeId}`);

  if (routeState.timerRouteId === routeId) {
    // Stop timer
    clearInterval(routeState.activeTimer);
    routeState.activeTimer = null;
    routeState.timerRouteId = null;
    if (btn) { btn.textContent = '▶ Start trasy'; btn.classList.remove('active'); }
    if (display) display.classList.add('hidden');
    const elapsed = Math.round((Date.now() - routeState.timerStart) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    showToast(`✅ Trasa ukończona! Czas: ${m}:${String(s).padStart(2,'0')}`);
  } else {
    // Stop any existing timer
    if (routeState.activeTimer) {
      clearInterval(routeState.activeTimer);
      const oldBtn = document.getElementById(`timer-btn-${routeState.timerRouteId}`);
      const oldDisp = document.getElementById(`timer-display-${routeState.timerRouteId}`);
      if (oldBtn) { oldBtn.textContent = '▶ Start trasy'; oldBtn.classList.remove('active'); }
      if (oldDisp) oldDisp.classList.add('hidden');
    }
    // Start new timer
    routeState.timerRouteId = routeId;
    routeState.timerStart = Date.now();
    if (btn) { btn.textContent = '⏹ Stop'; btn.classList.add('active'); }
    if (display) display.classList.remove('hidden');
    routeState.activeTimer = setInterval(() => {
      const elapsed = Math.round((Date.now() - routeState.timerStart) / 1000);
      const m = Math.floor(elapsed / 60), s = elapsed % 60;
      if (timeEl) timeEl.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }, 1000);
    showToast('▶ Timer trasy uruchomiony!');
    showRouteOnMap(routeId);
  }
}

function shareRoute(id) {
  const route = APP_DATA.routes.find(r => r.id === id);
  if (!route) return;
  const text = `${route.emoji} ${route.name} — ${route.distance}, ${route.time}. Sprawdź w przewodniku Łucznicza & Tarczowa!`;
  const url = window.location.href.split('#')[0] + '#trasa-' + id;
  if (navigator.share) {
    navigator.share({ title: route.name, text, url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('🔗 Link skopiowany!')).catch(() => showToast('🔗 ' + url));
  }
}

function showRouteOnMap(id) {
  const route = APP_DATA.routes.find(r => r.id === id);
  if (!route || !state.map) return;
  navigateTo('map');

  setTimeout(() => {
    // Dim all route polylines
    state.routePolylines.forEach(polyline => {
      polyline.setStyle({ weight: 3, opacity: 0.2, dashArray: '8, 4' });
    });

    // Fit bounds to route
    const latLngs = route.coords.map(c => [c[1], c[0]]);
    state.map.fitBounds(L.latLngBounds(latLngs), { padding: [60, 60], animate: true });

    // Animate route drawing
    if (window.mapImprovements?.animateRoute) {
      setTimeout(() => window.mapImprovements.animateRoute(id), 400);
    }

    showToast(`${route.emoji} ${route.name} · ${route.distance}`);
  }, 200);
}

// ===== RENDER INFO (ENHANCED) =====
function renderInfo() {
  const section = document.getElementById('section-info');
  if (!section) return;
  const content = section.querySelector('.section-content');
  if (!content) return;

  content.innerHTML = `

    <!-- Hero banner -->
    <div class="info-hero">
      <div class="info-hero-bg"></div>
      <div class="info-hero-content">
        <div class="info-hero-badge">🏹 Szczecin</div>
        <h1 class="info-hero-title">Łucznicza & Tarczowa</h1>
        <p class="info-hero-sub">Dzielnica mieszkaniowa · Szczecin Zachód</p>
        <div class="info-hero-stats">
          <div class="ihs-item"><span class="ihs-num" data-target="8000">0</span><span class="ihs-label">Mieszkańców</span></div>
          <div class="ihs-item"><span class="ihs-num" data-target="50">0</span><span class="ihs-label">Lat historii</span></div>
          <div class="ihs-item"><span class="ihs-num" data-target="12">0</span><span class="ihs-label">Miejsc POI</span></div>
          <div class="ihs-item"><span class="ihs-num" data-target="6">0</span><span class="ihs-label">Tras</span></div>
        </div>
      </div>
    </div>

    <!-- Quick nav pills -->
    <div class="info-nav-pills">
      <button class="inp-btn active" onclick="scrollToInfoSection('info-cards-section')">📋 Informacje</button>
      <button class="inp-btn" onclick="scrollToInfoSection('info-timeline-section')">📅 Historia</button>
      <button class="inp-btn" onclick="scrollToInfoSection('info-facts-section')">💡 Ciekawostki</button>
      <button class="inp-btn" onclick="scrollToInfoSection('info-contact-section')">📞 Kontakt</button>
    </div>

    <!-- Info cards -->
    <div id="info-cards-section">
      <div class="info-section-title">📋 O dzielnicy</div>
      <div class="info-cards" id="infoCards">
        ${APP_DATA.info.map(item => renderInfoCard(item)).join('')}
      </div>
    </div>

    <!-- Timeline -->
    <div id="info-timeline-section">
      <div class="info-section-title">📅 Historia dzielnicy</div>
      <div class="info-timeline">
        ${APP_DATA.timeline.map((t, i) => `
          <div class="tl-item ${t.year === '2026' ? 'tl-current' : ''}">
            <div class="tl-year">${t.year}</div>
            <div class="tl-dot">${t.icon}</div>
            <div class="tl-content">
              <div class="tl-title">${t.title}</div>
              <div class="tl-desc">${t.desc}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Fun facts -->
    <div id="info-facts-section">
      <div class="info-section-title">💡 Czy wiesz, że...</div>
      <div class="info-facts-grid">
        ${APP_DATA.funFacts.map((f, i) => `
          <div class="fact-card" style="animation-delay:${i * 0.08}s">
            <span class="fact-emoji">${f.emoji}</span>
            <p class="fact-text">${f.text}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Contact / Council -->
    <div id="info-contact-section">
      <div class="info-section-title">📞 Kontakt z dzielnicą</div>
      <div class="info-contact-grid">
        <div class="contact-card">
          <div class="cc-icon">🏛️</div>
          <div class="cc-body">
            <div class="cc-title">Rada Osiedla Łucznicza-Tarczowa</div>
            <div class="cc-detail">📧 rada.lucznicza@szczecin.pl</div>
            <div class="cc-detail">📞 +48 91 424 50 00</div>
            <div class="cc-detail">🕐 Dyżury: wt. i czw. 17:00–19:00</div>
          </div>
        </div>
        <div class="contact-card">
          <div class="cc-icon">🏙️</div>
          <div class="cc-body">
            <div class="cc-title">Urząd Miasta Szczecin</div>
            <div class="cc-detail">🌐 szczecin.eu</div>
            <div class="cc-detail">📞 +48 91 424 50 00</div>
            <div class="cc-detail">📍 pl. Armii Krajowej 1</div>
          </div>
        </div>
        <div class="contact-card">
          <div class="cc-icon">🚨</div>
          <div class="cc-body">
            <div class="cc-title">Numery alarmowe</div>
            <div class="cc-detail">🚒 Straż pożarna: <strong>998</strong></div>
            <div class="cc-detail">🚑 Pogotowie: <strong>999</strong></div>
            <div class="cc-detail">👮 Policja: <strong>997</strong> · Ogólny: <strong>112</strong></div>
          </div>
        </div>
        <div class="contact-card">
          <div class="cc-icon">🌐</div>
          <div class="cc-body">
            <div class="cc-title">Przydatne linki</div>
            <a class="cc-link" href="https://www.szczecin.eu" target="_blank">🏙️ szczecin.eu</a>
            <a class="cc-link" href="https://www.zditm.szczecin.pl" target="_blank">🚌 ZDiTM Szczecin</a>
            <a class="cc-link" href="https://www.bike-s.pl" target="_blank">🚲 Bike_S Szczecin</a>
          </div>
        </div>
      </div>
    </div>

  `;

  // Animate counters
  animateInfoCounters();
}

function renderInfoCard(item) {
  const factsHtml = (item.facts || []).map(f => `
    <li class="ic2-fact"><span class="ic2-check">✓</span>${f}</li>
  `).join('');

  const statsHtml = item.stats.map(s => `
    <div class="ic2-stat">
      <span class="ic2-stat-icon">${s.icon || ''}</span>
      <span class="ic2-stat-num">${s.num}</span>
      <span class="ic2-stat-label">${s.label}</span>
    </div>
  `).join('');

  return `
    <div class="info-card-v2" id="icard-${item.id}">
      <div class="ic2-header" style="background:linear-gradient(135deg,${item.color}33,${item.color}11);border-left:4px solid ${item.color}">
        <span class="ic2-icon">${item.icon}</span>
        <h3 class="ic2-title">${item.title}</h3>
        <button class="ic2-toggle" onclick="toggleInfoCard('${item.id}')" id="ictoggle-${item.id}">›</button>
      </div>
      <div class="ic2-body" id="icbody-${item.id}" style="display:none">
        <p class="ic2-text">${item.text}</p>
        ${factsHtml ? `<ul class="ic2-facts">${factsHtml}</ul>` : ''}
        <div class="ic2-stats">${statsHtml}</div>
      </div>
    </div>
  `;
}

function toggleInfoCard(id) {
  const body = document.getElementById(`icbody-${id}`);
  const btn = document.getElementById(`ictoggle-${id}`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.textContent = isOpen ? '›' : '⌄';
}

function scrollToInfoSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Update active pill
  document.querySelectorAll('.inp-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// Animate number counters in the hero
function animateInfoCounters() {
  const els = document.querySelectorAll('.ihs-num[data-target]');
  els.forEach(el => {
    const target = parseInt(el.dataset.target);
    const duration = 1200;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = Math.round(current).toLocaleString('pl');
      if (current >= target) clearInterval(timer);
    }, 16);
  });
}

// ===== RENDER TRANSPORT =====
function renderTransport() {
  const container = document.getElementById('transportGrid');
  if (!container) return;
  container.innerHTML = APP_DATA.transport.map(t => `
    <div class="transport-card">
      <div class="transport-header">
        <div class="transport-icon" style="background:${t.color}22">${t.icon}</div>
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
  if (!container) return;
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
  const PE = window.placesEnhanced;
  const status = PE ? PE.getOpenStatus(place) : null;
  const fav = PE ? PE.isFavorite(place.id) : false;
  const stars = PE ? PE.renderStars(place.rating || 0) : '';
  const price = PE ? PE.renderPriceLevel(place.price) : '';
  const dist = PE ? PE.distanceToPlace(place) : null;

  // Weekly hours table
  const dayNames = { mon: 'Pon', tue: 'Wt', wed: 'Śr', thu: 'Czw', fri: 'Pt', sat: 'Sob', sun: 'Ndz' };
  const todayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];
  let hoursTable = '';
  if (place.hoursWeek) {
    hoursTable = Object.keys(dayNames).map(d => {
      const v = place.hoursWeek[d];
      let label = v === '0-24' ? 'Całą dobę' : v === 'zamkn' ? 'Zamknięte' : v === 'dyżur' ? 'Dyżur' : v.replace('-', ':00–') + ':00';
      label = label.replace('7.5:00', '7:30');
      return `<div class="hours-row ${d === todayKey ? 'today' : ''}">
        <span>${dayNames[d]}${d === todayKey ? ' (dziś)' : ''}</span>
        <span class="${v === 'zamkn' ? 'closed' : ''}">${label}</span>
      </div>`;
    }).join('');
  }

  // Reviews
  let reviewsHtml = '';
  if (place.reviews && place.reviews.length) {
    reviewsHtml = `
      <div class="modal-section-title">💬 Opinie (${place.reviews.length})</div>
      <div class="reviews-block">
        ${place.reviews.map(r => `
          <div class="review-item">
            <div class="review-head">
              <span class="review-avatar">${r.name.charAt(0)}</span>
              <div>
                <div class="review-name">${r.name}</div>
                <div class="review-date">${r.date}</div>
              </div>
              <span class="review-stars">${PE ? PE.renderStars(r.rating) : ''}</span>
            </div>
            <div class="review-text">${r.text}</div>
          </div>
        `).join('')}
      </div>
      <button class="add-review-btn" onclick="addReviewPrompt(${place.id})">✍️ Dodaj opinię</button>
    `;
  }

  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-hero" style="background:${place.gradient || CAT_BG[place.cat]}">
      <span class="modal-hero-emoji">${place.emoji}</span>
      <button class="modal-fav-btn ${fav ? 'active' : ''}" onclick="toggleFav(${place.id}, this); syncModalFav(${place.id})">
        ${fav ? '❤️' : '🤍'}
      </button>
      ${status ? `<span class="modal-status ${status.open ? 'is-open' : 'is-closed'}">${status.open ? '🟢' : '🔴'} ${status.label}</span>` : ''}
    </div>
    <div style="display:flex;align-items:center;gap:8px;margin:14px 0 6px;flex-wrap:wrap">
      <span class="place-card-badge badge-${place.cat}" style="position:static">${place.cat}</span>
      ${price ? `<span class="modal-price">${price}</span>` : ''}
      ${place.featured ? '<span class="modal-featured">⭐ POLECANE</span>' : ''}
    </div>
    <h2 class="modal-title">${place.name}</h2>
    <div class="modal-rating">
      <span class="stars-lg">${stars}</span>
      <span class="rating-big">${place.rating || '–'}</span>
      <span class="rating-out">/ 5</span>
      ${place.reviewCount ? `<span class="review-count">· ${place.reviewCount} opinii</span>` : ''}
    </div>
    <p class="modal-addr">📍 ${place.addr}${dist != null ? ` · ${PE.formatDistance(dist)} od Ciebie` : ''}</p>
    <p class="modal-desc">${place.desc}</p>

    ${hoursTable ? `
      <div class="modal-section-title">⏰ Godziny otwarcia</div>
      <div class="hours-table">${hoursTable}</div>
    ` : ''}

    <div class="modal-details">
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
          ${place.tags.map(t => `<span style="background:var(--surface2);padding:3px 10px;border-radius:50px;font-size:12px">#${t}</span>`).join('')}
        </div>
      ` : ''}
    </div>

    ${reviewsHtml}

    <div class="modal-actions">
      <button class="modal-action-btn btn-primary" onclick="flyToPlace(${place.id});closeModal()">
        🗺️ Pokaż na mapie
      </button>
      <button class="modal-action-btn btn-secondary" onclick="startNavigation(${place.coords[1]},${place.coords[0]},'${place.name.replace(/'/g,"\\'")}');closeModal()">
        🧭 Nawiguj
      </button>
    </div>
    <div class="modal-actions" style="margin-top:8px">
      <button class="modal-action-btn btn-secondary" onclick="sharePlace(${place.id})">
        🔗 Udostępnij
      </button>
      <button class="modal-action-btn btn-secondary" onclick="showQRCode(${place.id})">
        📱 Kod QR
      </button>
      ${place.phone ? `<button class="modal-action-btn btn-secondary" onclick="window.location.href='tel:${place.phone}'">📞 Zadzwoń</button>` : ''}
    </div>
    <div id="qrContainer" class="qr-container hidden"></div>
  `;

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('modalOverlay').style.display = 'flex';
}

// Sync favorite button between modal and re-render the grid
function syncModalFav(id) {
  if (state.currentSection === 'places') renderPlaces(state.searchQuery);
}

// Add a review (stored in localStorage, prepended to reviews)
function addReviewPrompt(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place) return;
  const text = prompt('Twoja opinia o "' + place.name + '":');
  if (!text || !text.trim()) return;
  const ratingStr = prompt('Ocena 1–5:', '5');
  const rating = Math.max(1, Math.min(5, parseInt(ratingStr) || 5));
  if (!place.reviews) place.reviews = [];
  place.reviews.unshift({ name: 'Ty', rating, text: text.trim(), date: 'przed chwilą' });
  place.reviewCount = place.reviews.length;
  // persist user reviews
  try {
    const key = 'lucznicza_reviews_' + id;
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    stored.unshift({ name: 'Ty', rating, text: text.trim(), date: new Date().toLocaleDateString('pl') });
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {}
  showToast('✅ Dziękujemy za opinię!');
  openPlaceModal(id); // refresh modal
}

// Share place
function sharePlace(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place) return;
  const shareData = {
    title: place.name,
    text: `${place.name} — ${place.addr}. Sprawdź w przewodniku Łucznicza & Tarczowa!`,
    url: window.location.href.split('#')[0] + '#miejsce-' + id
  };
  if (navigator.share) {
    navigator.share(shareData).catch(() => {});
  } else {
    navigator.clipboard.writeText(shareData.url).then(() => {
      showToast('🔗 Link skopiowany do schowka');
    }).catch(() => showToast('🔗 ' + shareData.url));
  }
}

// Show QR code for the place (free QR API)
function showQRCode(id) {
  const place = APP_DATA.places.find(p => p.id === id);
  if (!place) return;
  const container = document.getElementById('qrContainer');
  if (!container) return;

  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  // Google Maps navigation link encoded in QR
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.coords[1]},${place.coords[0]}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(navUrl)}`;
  container.innerHTML = `
    <div class="qr-inner">
      <img src="${qrSrc}" alt="Kod QR — nawigacja do ${place.name}" width="180" height="180" />
      <p>📱 Zeskanuj telefonem, aby nawigować do<br><strong>${place.name}</strong></p>
    </div>
  `;
  container.classList.remove('hidden');
}

// ===== PROXIMITY NOTIFICATIONS (near me alerts) =====
function initProximityAlerts() {
  if (!navigator.geolocation) return;
  const PE = window.placesEnhanced;
  if (!PE) return;

  const notified = new Set();
  navigator.geolocation.watchPosition(
    pos => {
      PE.setUserLocation(pos.coords.latitude, pos.coords.longitude);
      APP_DATA.places.forEach(p => {
        const d = PE.distanceToPlace(p);
        if (d != null && d < 0.1 && !notified.has(p.id)) { // within 100m
          notified.add(p.id);
          notifyNearby(p, Math.round(d * 1000));
        }
      });
    },
    () => {},
    { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 }
  );
}

function notifyNearby(place, meters) {
  const msg = `📍 Jesteś ${meters}m od: ${place.name}`;
  showToast(msg);
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Łucznicza & Tarczowa', {
      body: `${place.emoji} ${place.name} — ${meters}m od Ciebie`,
      tag: 'nearby-' + place.id
    });
  }
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.getElementById('modalOverlay').style.display = 'none';
}

function openGoogleMaps(lat, lng) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}

// ===== TOAST =====
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.style.display = 'block';
  toast.style.opacity = '1';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}

// ===== RENDER COMMUNITY (handled by community-ui.js auto-init) =====
function renderCommunity() {
  // community-ui.js initializes itself via DOMContentLoaded
  // Nothing needed here
}
