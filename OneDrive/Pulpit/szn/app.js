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

    // Base tile layers
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 18
    });

    const tonerLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png', {
      attribution: '© Stadia Maps',
      maxZoom: 18
    });

    // Store layers for switching
    state.baseLayers = { osm: osmLayer, satellite: satelliteLayer, toner: tonerLayer };
    state.currentBaseLayer = 'osm';

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

    showToast('✅ Mapa OpenStreetMap załadowana!');
    console.log('✨ Mapa Leaflet gotowa!');

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
      }
    });
  }

  // Street view toggle
  const btnMapStreet = document.getElementById('btnMapStreet');
  if (btnMapStreet) {
    btnMapStreet.addEventListener('click', () => {
      if (state.currentBaseLayer !== 'osm') {
        map.removeLayer(state.baseLayers[state.currentBaseLayer]);
        state.baseLayers.osm.addTo(map);
        state.currentBaseLayer = 'osm';
        btnMapStreet.classList.add('active');
        document.getElementById('btnSatellite').classList.remove('active');
        showToast('🗺️ Widok uliczny');
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

// ===== RENDER PLACES =====
function renderPlaces(query = '') {
  const grid = document.getElementById('placesGrid');
  if (!grid) return;
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
