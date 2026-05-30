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

    // Initialize Leaflet map centered on Łucznicza/Tarczowa
    const map = L.map('map', {
      zoomControl: false
    }).setView([53.4025, 14.5520], 15);

    // Base tile layers — NO crossOrigin (it breaks tile display if the
    // tile server doesn't send CORS headers → tiles load but show blank/gray).
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // CARTO Voyager as alternative basemap
    const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    // If OSM fails to load tiles, fall back to CARTO
    let osmErrors = 0;
    osmLayer.on('tileerror', () => {
      osmErrors++;
      if (osmErrors === 4 && !map.hasLayer(cartoLayer)) {
        console.warn('⚠️ OSM tiles failing, switching to CARTO');
        map.removeLayer(osmLayer);
        cartoLayer.addTo(map);
        state.currentBaseLayer = 'street';
        state.baseLayers.street = cartoLayer;
      }
    });

    // Store layers for switching
    state.baseLayers = { street: osmLayer, carto: cartoLayer, satellite: satelliteLayer };
    state.currentBaseLayer = 'street';

    // Add controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    // Area highlight rectangle
    L.rectangle(
      [[53.4005, 14.5490], [53.4055, 14.5555]],
      { color: '#6c63ff', weight: 2, opacity: 0.5, fill: true, fillColor: '#6c63ff', fillOpacity: 0.06, dashArray: '4, 2' }
    ).addTo(map);

    // Add POI markers
    if (APP_DATA && APP_DATA.places) {
      APP_DATA.places.forEach(place => {
        const iconHtml = `
          <div style="width:40px;height:40px;background:${CAT_COLORS[place.cat]};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid rgba(255,255,255,0.3);font-size:18px;">
            <div style="transform:rotate(45deg);">${place.emoji}</div>
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
        marker.placeData = place; // Store reference for filtering
        marker.bindPopup(`
          <div style="font-size:12px;min-width:200px;">
            <div style="color:${CAT_COLORS[place.cat]};font-weight:bold;margin-bottom:4px;">${place.cat.toUpperCase()}</div>
            <strong>${place.name}</strong><br>
            📍 ${place.addr}<br>
            ${place.desc.substring(0, 80)}...<br>
            <button onclick="openPlaceModal(${place.id})" style="padding:6px 12px;background:${CAT_COLORS[place.cat]};color:white;border:none;border-radius:4px;cursor:pointer;margin-top:8px;font-weight:bold;">📍 Szczegóły</button>
          </div>
        `);
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
    // ResizeObserver reacts to the real moment the container gets its size
    // (after splash hides / section becomes visible) → fixes "gray map".
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

    showToast('✅ Mapa OpenStreetMap załadowana!');
    console.log('✨ Mapa Leaflet gotowa! Wysokość kontenera:', mapContainer.clientHeight);

  } catch (err) {
    console.error('❌ Błąd ładowania mapy:', err);
    showToast('❌ Błąd ładowania mapy');
  }
}

// ===== FILTER MARKERS (Leaflet) =====
function filterMarkers(cat) {
  if (!state.map) return;
  state.currentCat = cat;
  state.markers.forEach(marker => {
    const place = marker.placeData;
    if (!place) return;
    if (cat === 'all' || place.cat === cat) {
      if (!state.map.hasLayer(marker)) marker.addTo(state.map);
    } else {
      if (state.map.hasLayer(marker)) state.map.removeLayer(marker);
    }
  });
}

// ===== MAP CONTROLS (Leaflet-compatible) =====
function initMapControls() {
  const map = state.map;
  if (!map) return;

  // 3D toggle — Leaflet is 2D only, show toast
  const btn3D = document.getElementById('btn3D');
  if (btn3D) {
    btn3D.addEventListener('click', () => {
      showToast('ℹ️ Leaflet obsługuje widok 2D. Użyj Google Street View dla 3D.');
    });
    btn3D.classList.remove('active');
  }

  // Satellite toggle
  const btnSatellite = document.getElementById('btnSatellite');
  if (btnSatellite) {
    btnSatellite.addEventListener('click', () => {
      if (state.currentBaseLayer !== 'satellite') {
        map.removeLayer(state.baseLayers[state.currentBaseLayer]);
        state.baseLayers.satellite.addTo(map);
        state.currentBaseLayer = 'satellite';
        btnSatellite.classList.add('active');
        document.getElementById('btnMapStreet').classList.remove('active');
        showToast('🛰️ Widok satelitarny');
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  }

  // Street view toggle
  const btnMapStreet = document.getElementById('btnMapStreet');
  if (btnMapStreet) {
    btnMapStreet.addEventListener('click', () => {
      if (state.currentBaseLayer === 'satellite') {
        map.removeLayer(state.baseLayers.satellite);
        state.baseLayers.street.addTo(map);
        state.currentBaseLayer = 'street';
        btnMapStreet.classList.add('active');
        document.getElementById('btnSatellite').classList.remove('active');
        showToast('🗺️ Widok uliczny');
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  }

  // Locate
  const btnLocate = document.getElementById('btnLocate');
  if (btnLocate) {
    btnLocate.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('❌ Geolokalizacja niedostępna');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 16, { animate: true });
          showToast('📍 Znaleziono Twoją lokalizację');
        },
        () => {
          map.setView([53.4025, 14.5520], 15, { animate: true });
          showToast('📍 Powrót do centrum dzielnicy');
        }
      );
    });
  }

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
      showToast('✈️ Animacja lotu uruchomiona');
      let zoom = map.getZoom();
      let step = 0;
      const center = [53.4025, 14.5520];
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
      if (window.googleMapsAPI && window.googleMapsAPI.toggleStreetView) {
        window.googleMapsAPI.toggleStreetView();
        showToast('📸 Google Street View');
      } else {
        showToast('⚠️ Street View nie dostępny');
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
      PE.setUserLocation(53.4025, 14.5520);
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
        <span style="font-size:52px">${p.emoji}</span>
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

// ===== RENDER ROUTES =====
function renderRoutes() {
  const list = document.getElementById('routesList');
  if (!list) return;
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
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.textContent = isOpen ? '›' : '⌄';
}

function showRouteOnMap(id) {
  const route = APP_DATA.routes.find(r => r.id === id);
  if (!route || !state.map) return;
  navigateTo('map');

  setTimeout(() => {
    // Highlight selected route, dim others
    state.routePolylines.forEach(polyline => {
      if (polyline.routeId === id) {
        polyline.setStyle({ weight: 6, opacity: 1, dashArray: null });
      } else {
        polyline.setStyle({ weight: 3, opacity: 0.3, dashArray: '8, 4' });
      }
    });

    // Fit bounds to route
    const latLngs = route.coords.map(c => [c[1], c[0]]);
    state.map.fitBounds(L.latLngBounds(latLngs), { padding: [50, 50], animate: true });
    showToast(`🗺️ Trasa: ${route.name}`);
  }, 200);
}

// ===== RENDER INFO =====
function renderInfo() {
  const container = document.getElementById('infoCards');
  if (!container) return;
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
      <button class="modal-action-btn btn-secondary" onclick="openGoogleMaps(${place.coords[1]},${place.coords[0]})">
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
