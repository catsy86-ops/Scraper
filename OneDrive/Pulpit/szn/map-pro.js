/* ===================================================== */
/* ===== MAP PRO — premium UI/UX for the Leaflet map === */
/* ===================================================== */
'use strict';

const MAP_PRO = {
  map: null,
  userMarker: null,
  userCircle: null,
  contextMenu: null,
  viewHistory: [],
  viewHistoryIndex: -1,
  searchTimeout: null,
  styleNames: {
    voyager:   { label: 'Kolorowa',  icon: '🗺️' },
    dark:      { label: 'Ciemna',    icon: '🌙' },
    light:     { label: 'Jasna',     icon: '☀️' },
    satellite: { label: 'Satelita',  icon: '🛰️' },
    osm:       { label: 'Klasyczna', icon: '🌍' }
  }
};

// ===== INIT =====
function mapProInit(map) {
  if (!map || MAP_PRO.map) return;
  MAP_PRO.map = map;

  buildStyleSwitcher();
  buildFloatingControls();
  buildMapSearch();
  buildContextMenu();
  buildCompass();
  buildCoordBar();
  buildWeatherOverlay();
  updateLegendCounts();
  applyAutoDayNight();
  initKeyboardShortcuts();
  initViewHistory();

  if (!localStorage.getItem('mapHintShown')) {
    setTimeout(() => {
      showToast('💡 Wskazówka: 🔍 szukaj miejsc · prawy klik = menu · L = lokalizacja');
      localStorage.setItem('mapHintShown', '1');
    }, 3000);
  }
}

// ===== STYLE SWITCHER =====
function buildStyleSwitcher() {
  const container = document.getElementById('map');
  if (!container) return;
  const panel = document.createElement('div');
  panel.id = 'styleSwitcher';
  panel.className = 'style-switcher collapsed';
  panel.innerHTML = `
    <button class="ss-toggle" id="ssToggle" title="Zmień styl mapy (S)">🎨</button>
    <div class="ss-options" id="ssOptions">
      ${Object.keys(MAP_PRO.styleNames).map(key => `
        <button class="ss-opt ${key === 'voyager' ? 'active' : ''}" data-style="${key}">
          <span class="ss-icon">${MAP_PRO.styleNames[key].icon}</span>
          <span class="ss-label">${MAP_PRO.styleNames[key].label}</span>
        </button>
      `).join('')}
    </div>`;
  container.appendChild(panel);

  document.getElementById('ssToggle').addEventListener('click', () => panel.classList.toggle('collapsed'));
  panel.querySelectorAll('.ss-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      setMapStyle(btn.dataset.style);
      panel.querySelectorAll('.ss-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panel.classList.add('collapsed');
      sessionStorage.setItem('mapStyleManual', '1');
    });
  });
}

function setMapStyle(styleKey) {
  const st = window.state;
  if (!st || !st.baseLayers || !st.baseLayers[styleKey]) return;
  const map = MAP_PRO.map;
  if (st.baseLayers[st.currentBaseLayer] && map.hasLayer(st.baseLayers[st.currentBaseLayer])) {
    map.removeLayer(st.baseLayers[st.currentBaseLayer]);
  }
  st.baseLayers[styleKey].addTo(map);
  st.currentBaseLayer = styleKey;
  st.baseLayers[styleKey].bringToBack();
  showToast(`${MAP_PRO.styleNames[styleKey].icon} Styl: ${MAP_PRO.styleNames[styleKey].label}`);
}

// ===== FLOATING CONTROLS =====
function buildFloatingControls() {
  const container = document.getElementById('map');
  if (!container) return;
  const fc = document.createElement('div');
  fc.className = 'map-fab-group';
  fc.innerHTML = `
    <button class="map-fab" id="fabLocate"     title="Moja lokalizacja (L)">🎯</button>
    <button class="map-fab" id="fabFullscreen" title="Pełny ekran (F)">⛶</button>
    <button class="map-fab" id="fabReset"      title="Wyśrodkuj (R)">🏹</button>
    <button class="map-fab" id="fabBack"       title="Cofnij widok (←)" style="font-size:14px">◀</button>
    <button class="map-fab" id="fabForward"    title="Naprzód widok (→)" style="font-size:14px">▶</button>`;
  container.appendChild(fc);

  document.getElementById('fabLocate').addEventListener('click', locateUser);
  document.getElementById('fabFullscreen').addEventListener('click', toggleFullscreen);
  document.getElementById('fabReset').addEventListener('click', resetView);
  document.getElementById('fabBack').addEventListener('click', viewHistoryBack);
  document.getElementById('fabForward').addEventListener('click', viewHistoryForward);
}

// ===== MAP SEARCH =====
function buildMapSearch() {
  const container = document.getElementById('map');
  if (!container) return;

  const searchBox = document.createElement('div');
  searchBox.id = 'mapSearchBox';
  searchBox.className = 'map-search-box';
  searchBox.innerHTML = `
    <div class="msb-inner">
      <span class="msb-icon">🔍</span>
      <input type="text" id="mapSearchInput" placeholder="Szukaj miejsca na mapie..." autocomplete="off" />
      <button class="msb-clear hidden" id="mapSearchClear">✕</button>
    </div>
    <div class="msb-results hidden" id="mapSearchResults"></div>`;
  container.appendChild(searchBox);

  const input = document.getElementById('mapSearchInput');
  const results = document.getElementById('mapSearchResults');
  const clearBtn = document.getElementById('mapSearchClear');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearBtn.classList.toggle('hidden', !q);
    if (!q) { results.classList.add('hidden'); return; }
    clearTimeout(MAP_PRO.searchTimeout);
    MAP_PRO.searchTimeout = setTimeout(() => searchOnMap(q), 350);
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    results.classList.add('hidden');
    clearBtn.classList.add('hidden');
    input.focus();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!searchBox.contains(e.target)) results.classList.add('hidden');
  });
}

async function searchOnMap(query) {
  const results = document.getElementById('mapSearchResults');
  if (!results) return;

  // First search local POI
  const localMatches = (APP_DATA?.places || []).filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.tags || []).some(t => t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 4);

  // Then Nominatim geocoding for Szczecin area
  let nominatimResults = [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Szczecin')}&format=json&limit=4&countrycodes=pl&viewbox=14.4,53.5,14.7,53.3&bounded=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pl' } });
    if (res.ok) nominatimResults = await res.json();
  } catch {}

  if (!localMatches.length && !nominatimResults.length) {
    results.innerHTML = `<div class="msr-empty">Brak wyników dla "${query}"</div>`;
    results.classList.remove('hidden');
    return;
  }

  results.innerHTML = [
    ...localMatches.map(p => `
      <div class="msr-item" onclick="mapProFlyToPoi(${p.id})">
        <span class="msr-icon">${p.emoji}</span>
        <div class="msr-info">
          <div class="msr-name">${p.name}</div>
          <div class="msr-addr">${p.addr}</div>
        </div>
        <span class="msr-badge local">POI</span>
      </div>`),
    ...nominatimResults.map(r => `
      <div class="msr-item" onclick="mapProFlyToCoords(${r.lat},${r.lon},'${r.display_name.split(',')[0]}')">
        <span class="msr-icon">📍</span>
        <div class="msr-info">
          <div class="msr-name">${r.display_name.split(',').slice(0,2).join(', ')}</div>
          <div class="msr-addr">${r.type}</div>
        </div>
        <span class="msr-badge geo">Adres</span>
      </div>`)
  ].join('');
  results.classList.remove('hidden');
}

window.mapProFlyToPoi = function(id) {
  document.getElementById('mapSearchResults')?.classList.add('hidden');
  if (typeof flyToPlace === 'function') flyToPlace(id);
};

window.mapProFlyToCoords = function(lat, lng, name) {
  document.getElementById('mapSearchResults')?.classList.add('hidden');
  document.getElementById('mapSearchInput').value = name || '';
  MAP_PRO.map.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
  showToast(`📍 ${name}`);
};

// ===== CONTEXT MENU (right-click) =====
function buildContextMenu() {
  const map = MAP_PRO.map;
  const container = document.getElementById('map');
  if (!container) return;

  const menu = document.createElement('div');
  menu.id = 'mapContextMenu';
  menu.className = 'map-context-menu hidden';
  container.appendChild(menu);
  MAP_PRO.contextMenu = menu;

  map.on('contextmenu', e => {
    L.DomEvent.preventDefault(e.originalEvent);
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);
    menu.innerHTML = `
      <div class="mcm-header">📍 ${lat}, ${lng}</div>
      <button class="mcm-item" onclick="mapProCopyCoords('${lat}','${lng}')">📋 Kopiuj współrzędne</button>
      <button class="mcm-item" onclick="mapProOpenGoogleMaps('${lat}','${lng}')">🧭 Nawiguj tutaj</button>
      <button class="mcm-item" onclick="mapProReverseGeocode('${lat}','${lng}')">🏠 Jaki to adres?</button>
      <button class="mcm-item" onclick="mapProMeasureFrom('${lat}','${lng}')">📏 Mierz od tego punktu</button>
      <div class="mcm-sep"></div>
      <button class="mcm-item" onclick="mapProResetView()">🏹 Wyśrodkuj mapę</button>`;

    // Position menu
    const rect = container.getBoundingClientRect();
    const x = e.originalEvent.clientX - rect.left;
    const y = e.originalEvent.clientY - rect.top;
    menu.style.left = Math.min(x, container.offsetWidth - 200) + 'px';
    menu.style.top = Math.min(y, container.offsetHeight - 200) + 'px';
    menu.classList.remove('hidden');
  });

  // Close on map click
  map.on('click', () => menu.classList.add('hidden'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menu.classList.add('hidden'); });
}

window.mapProCopyCoords = function(lat, lng) {
  MAP_PRO.contextMenu?.classList.add('hidden');
  navigator.clipboard.writeText(`${lat}, ${lng}`).then(() => showToast('📋 Współrzędne skopiowane'));
};

window.mapProOpenGoogleMaps = function(lat, lng) {
  MAP_PRO.contextMenu?.classList.add('hidden');
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

window.mapProReverseGeocode = async function(lat, lng) {
  MAP_PRO.contextMenu?.classList.add('hidden');
  showToast('🔄 Pobieranie adresu...');
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pl`);
    const data = await res.json();
    const addr = data.display_name || 'Nieznany adres';
    const short = addr.split(',').slice(0, 3).join(', ');
    showToast(`🏠 ${short}`);
    // Show popup on map
    L.popup().setLatLng([lat, lng]).setContent(`<b>📍 Adres:</b><br>${short}`).openOn(MAP_PRO.map);
  } catch {
    showToast('❌ Nie udało się pobrać adresu');
  }
};

window.mapProMeasureFrom = function(lat, lng) {
  MAP_PRO.contextMenu?.classList.add('hidden');
  if (window.mapEnhancements) {
    // Enable measurement mode and add first point
    if (!window.mapEnhancements.isMeasuring?.()) {
      window.mapEnhancements.measurement();
    }
    MAP_PRO.map.fire('click', { latlng: L.latLng(parseFloat(lat), parseFloat(lng)) });
  }
};

window.mapProResetView = function() {
  MAP_PRO.contextMenu?.classList.add('hidden');
  resetView();
};

// ===== COMPASS =====
function buildCompass() {
  const container = document.getElementById('map');
  if (!container) return;

  const compass = document.createElement('div');
  compass.id = 'mapCompass';
  compass.className = 'map-compass';
  compass.innerHTML = `<div class="compass-needle">🧭</div><div class="compass-label">N</div>`;
  compass.title = 'Kompas — kliknij aby wyśrodkować';
  container.appendChild(compass);

  compass.addEventListener('click', resetView);

  // Update compass on device orientation (if available)
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', e => {
      if (e.alpha != null) {
        const needle = compass.querySelector('.compass-needle');
        if (needle) needle.style.transform = `rotate(${-e.alpha}deg)`;
      }
    });
  }
}

// ===== COORDINATE BAR (click on map shows coords) =====
function buildCoordBar() {
  const container = document.getElementById('map');
  if (!container) return;

  const bar = document.createElement('div');
  bar.id = 'coordBar';
  bar.className = 'coord-bar';
  bar.innerHTML = `<span id="coordText">📍 Kliknij na mapę aby zobaczyć współrzędne</span>`;
  container.appendChild(bar);

  MAP_PRO.map.on('mousemove', e => {
    const el = document.getElementById('coordText');
    if (el) el.textContent = `📍 ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
  });

  MAP_PRO.map.on('click', e => {
    const el = document.getElementById('coordText');
    if (el) {
      el.textContent = `✅ Skopiowano: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
      navigator.clipboard?.writeText(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      setTimeout(() => { if (el) el.textContent = '📍 Kliknij na mapę aby zobaczyć współrzędne'; }, 3000);
    }
  });
}

// ===== WEATHER OVERLAY on map =====
function buildWeatherOverlay() {
  const container = document.getElementById('map');
  if (!container) return;

  const overlay = document.createElement('div');
  overlay.id = 'mapWeatherOverlay';
  overlay.className = 'map-weather-overlay';
  overlay.innerHTML = `<div class="mwo-loading">⏳</div>`;
  container.appendChild(overlay);

  // Populate from live.js data when available
  function tryPopulate() {
    const wData = document.getElementById('wTemp');
    const wIcon = document.getElementById('wIcon');
    const wDesc = document.getElementById('wDesc');
    if (wData && wData.textContent && wData.textContent !== '--°') {
      overlay.innerHTML = `
        <span class="mwo-icon">${wIcon?.textContent || '🌡️'}</span>
        <span class="mwo-temp">${wData.textContent}</span>
        <span class="mwo-desc">${wDesc?.textContent || ''}</span>`;
    } else {
      setTimeout(tryPopulate, 2000);
    }
  }
  setTimeout(tryPopulate, 1500);

  // Refresh every 5 min
  setInterval(tryPopulate, 5 * 60 * 1000);
}

// ===== LEGEND WITH POI COUNTS =====
function updateLegendCounts() {
  const legend = document.getElementById('mapLegend');
  if (!legend || !APP_DATA?.places) return;

  const counts = {};
  APP_DATA.places.forEach(p => { counts[p.cat] = (counts[p.cat] || 0) + 1; });

  legend.querySelectorAll('.legend-item').forEach(item => {
    const dot = item.querySelector('.legend-dot');
    if (!dot) return;
    const cat = Array.from(dot.classList).find(c => c !== 'legend-dot');
    if (cat && counts[cat]) {
      // Add count badge if not already there
      if (!item.querySelector('.legend-count')) {
        const badge = document.createElement('span');
        badge.className = 'legend-count';
        badge.textContent = counts[cat];
        item.appendChild(badge);
      }
    }
  });
}

// ===== GEOLOCATION =====
function locateUser() {
  const map = MAP_PRO.map;
  if (!navigator.geolocation) { showToast('❌ Geolokalizacja niedostępna'); return; }
  showToast('🔄 Lokalizowanie...');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng, accuracy: acc = 50 } = pos.coords;
      if (window.placesEnhanced) window.placesEnhanced.setUserLocation(lat, lng);
      if (MAP_PRO.userMarker) map.removeLayer(MAP_PRO.userMarker);
      if (MAP_PRO.userCircle) map.removeLayer(MAP_PRO.userCircle);

      const userIcon = L.divIcon({
        html: '<div class="user-dot"><div class="user-dot-core"></div><div class="user-dot-pulse"></div></div>',
        iconSize: [24, 24], iconAnchor: [12, 12], className: 'user-location-icon'
      });
      MAP_PRO.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      MAP_PRO.userMarker.bindPopup(`<b>📍 Twoja lokalizacja</b><br>Dokładność: ±${Math.round(acc)}m`);
      MAP_PRO.userCircle = L.circle([lat, lng], {
        radius: acc, color: '#4285f4', weight: 1, fillColor: '#4285f4', fillOpacity: 0.12
      }).addTo(map);

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      showToast(`📍 Znaleziono (±${Math.round(acc)}m)`);
    },
    () => showToast('❌ Nie udało się zlokalizować'),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

// ===== FULLSCREEN =====
function toggleFullscreen() {
  const el = document.querySelector('.map-container') || document.getElementById('map');
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    showToast('⛶ Pełny ekran — Esc aby wyjść');
  } else {
    document.exitFullscreen();
  }
  setTimeout(() => MAP_PRO.map?.invalidateSize(true), 300);
}
document.addEventListener('fullscreenchange', () => {
  setTimeout(() => MAP_PRO.map?.invalidateSize(true), 200);
});

// ===== RESET VIEW =====
function resetView() {
  if (!MAP_PRO.map) return;
  MAP_PRO.map.flyTo([53.4530, 14.5520], 15, { animate: true, duration: 1 });
  showToast('🏹 Powrót do centrum dzielnicy');
}

// ===== VIEW HISTORY (back/forward) =====
function initViewHistory() {
  const map = MAP_PRO.map;
  // Save view on moveend
  map.on('moveend', () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    const entry = { lat: center.lat, lng: center.lng, zoom };
    // Trim forward history
    MAP_PRO.viewHistory = MAP_PRO.viewHistory.slice(0, MAP_PRO.viewHistoryIndex + 1);
    MAP_PRO.viewHistory.push(entry);
    if (MAP_PRO.viewHistory.length > 30) MAP_PRO.viewHistory.shift();
    MAP_PRO.viewHistoryIndex = MAP_PRO.viewHistory.length - 1;
    updateHistoryButtons();
  });
}

function updateHistoryButtons() {
  const back = document.getElementById('fabBack');
  const fwd = document.getElementById('fabForward');
  if (back) back.style.opacity = MAP_PRO.viewHistoryIndex > 0 ? '1' : '0.35';
  if (fwd) fwd.style.opacity = MAP_PRO.viewHistoryIndex < MAP_PRO.viewHistory.length - 1 ? '1' : '0.35';
}

function viewHistoryBack() {
  if (MAP_PRO.viewHistoryIndex <= 0) return;
  MAP_PRO.viewHistoryIndex--;
  const v = MAP_PRO.viewHistory[MAP_PRO.viewHistoryIndex];
  MAP_PRO.map.setView([v.lat, v.lng], v.zoom, { animate: true });
  updateHistoryButtons();
}

function viewHistoryForward() {
  if (MAP_PRO.viewHistoryIndex >= MAP_PRO.viewHistory.length - 1) return;
  MAP_PRO.viewHistoryIndex++;
  const v = MAP_PRO.viewHistory[MAP_PRO.viewHistoryIndex];
  MAP_PRO.map.setView([v.lat, v.lng], v.zoom, { animate: true });
  updateHistoryButtons();
}

// ===== AUTO DAY/NIGHT =====
function applyAutoDayNight() {
  if (sessionStorage.getItem('mapStyleManual')) return;
  const h = new Date().getHours();
  if (h >= 20 || h < 6) setMapStyle('dark');
}

// ===== KEYBOARD SHORTCUTS =====
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (window.state?.currentSection !== 'map') return;
    switch (e.key.toLowerCase()) {
      case 'l': locateUser(); break;
      case 'f': toggleFullscreen(); break;
      case 'r': resetView(); break;
      case 's': document.getElementById('ssToggle')?.click(); break;
      case '/': document.getElementById('mapSearchInput')?.focus(); e.preventDefault(); break;
      case '+': case '=': MAP_PRO.map?.zoomIn(); break;
      case '-': MAP_PRO.map?.zoomOut(); break;
      case 'arrowleft': viewHistoryBack(); break;
      case 'arrowright': viewHistoryForward(); break;
    }
  });
}

// ===== EXPORT =====
window.mapPro = {
  init: mapProInit,
  setStyle: setMapStyle,
  locate: locateUser,
  fullscreen: toggleFullscreen,
  reset: resetView,
  search: searchOnMap
};
