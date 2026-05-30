/* ===================================================== */
/* ===== MAP PRO — premium UI/UX for the Leaflet map === */
/* ===================================================== */
'use strict';

const MAP_PRO = {
  map: null,
  userMarker: null,
  userCircle: null,
  watchId: null,
  styleNames: {
    voyager: { label: 'Kolorowa', icon: '🗺️' },
    dark: { label: 'Ciemna', icon: '🌙' },
    light: { label: 'Jasna', icon: '☀️' },
    satellite: { label: 'Satelita', icon: '🛰️' },
    osm: { label: 'Klasyczna', icon: '🌍' }
  }
};

function mapProInit(map) {
  if (!map || MAP_PRO.map) return;
  MAP_PRO.map = map;

  buildStyleSwitcher();
  buildFloatingControls();
  applyAutoDayNight();
  initKeyboardShortcuts();

  // Show subtle hint once
  if (!localStorage.getItem('mapHintShown')) {
    setTimeout(() => {
      if (typeof showToast === 'function') showToast('💡 Wskazówka: użyj 🎨 aby zmienić styl mapy');
      localStorage.setItem('mapHintShown', '1');
    }, 2500);
  }
}

// ===== STYLE SWITCHER (visual) =====
function buildStyleSwitcher() {
  const container = document.getElementById('map');
  if (!container) return;

  const panel = document.createElement('div');
  panel.id = 'styleSwitcher';
  panel.className = 'style-switcher collapsed';

  const styles = Object.keys(MAP_PRO.styleNames);
  panel.innerHTML = `
    <button class="ss-toggle" id="ssToggle" title="Zmień styl mapy">🎨</button>
    <div class="ss-options" id="ssOptions">
      ${styles.map(key => `
        <button class="ss-opt ${key === (window.state?.currentBaseLayer || 'voyager') ? 'active' : ''}" data-style="${key}">
          <span class="ss-icon">${MAP_PRO.styleNames[key].icon}</span>
          <span class="ss-label">${MAP_PRO.styleNames[key].label}</span>
        </button>
      `).join('')}
    </div>
  `;
  container.appendChild(panel);

  document.getElementById('ssToggle').addEventListener('click', () => {
    panel.classList.toggle('collapsed');
  });

  panel.querySelectorAll('.ss-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      setMapStyle(btn.dataset.style);
      panel.querySelectorAll('.ss-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      panel.classList.add('collapsed');
    });
  });
}

function setMapStyle(styleKey) {
  const st = window.state;
  if (!st || !st.baseLayers || !st.baseLayers[styleKey]) return;
  const map = MAP_PRO.map;

  // Remove current
  if (st.baseLayers[st.currentBaseLayer] && map.hasLayer(st.baseLayers[st.currentBaseLayer])) {
    map.removeLayer(st.baseLayers[st.currentBaseLayer]);
  }
  st.baseLayers[styleKey].addTo(map);
  st.currentBaseLayer = styleKey;
  st.baseLayers[styleKey].bringToBack();

  if (typeof showToast === 'function') {
    showToast(`${MAP_PRO.styleNames[styleKey].icon} Styl: ${MAP_PRO.styleNames[styleKey].label}`);
  }
}

// ===== FLOATING CONTROLS (locate, fullscreen, reset) =====
function buildFloatingControls() {
  const container = document.getElementById('map');
  if (!container) return;

  const fc = document.createElement('div');
  fc.className = 'map-fab-group';
  fc.innerHTML = `
    <button class="map-fab" id="fabLocate" title="Moja lokalizacja (L)">🎯</button>
    <button class="map-fab" id="fabFullscreen" title="Pełny ekran (F)">⛶</button>
    <button class="map-fab" id="fabReset" title="Wyśrodkuj (R)">🏹</button>
  `;
  container.appendChild(fc);

  document.getElementById('fabLocate').addEventListener('click', locateUser);
  document.getElementById('fabFullscreen').addEventListener('click', toggleFullscreen);
  document.getElementById('fabReset').addEventListener('click', resetView);
}

// ===== GEOLOCATION with pulsing marker + accuracy circle =====
function locateUser() {
  const map = MAP_PRO.map;
  if (!navigator.geolocation) {
    if (typeof showToast === 'function') showToast('❌ Geolokalizacja niedostępna');
    return;
  }
  if (typeof showToast === 'function') showToast('🔄 Lokalizowanie...');

  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy || 50;

      if (window.placesEnhanced) window.placesEnhanced.setUserLocation(lat, lng);

      if (MAP_PRO.userMarker) map.removeLayer(MAP_PRO.userMarker);
      if (MAP_PRO.userCircle) map.removeLayer(MAP_PRO.userCircle);

      const userIcon = L.divIcon({
        html: '<div class="user-dot"><div class="user-dot-core"></div><div class="user-dot-pulse"></div></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        className: 'user-location-icon'
      });
      MAP_PRO.userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      MAP_PRO.userMarker.bindPopup('📍 Twoja lokalizacja');
      MAP_PRO.userCircle = L.circle([lat, lng], {
        radius: acc, color: '#4285f4', weight: 1, fillColor: '#4285f4', fillOpacity: 0.12
      }).addTo(map);

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
      if (typeof showToast === 'function') showToast(`📍 Znaleziono (±${Math.round(acc)}m)`);
    },
    err => {
      if (typeof showToast === 'function') showToast('❌ Nie udało się zlokalizować');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  );
}

// ===== FULLSCREEN =====
function toggleFullscreen() {
  const el = document.querySelector('.map-container') || document.getElementById('map');
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    if (typeof showToast === 'function') showToast('⛶ Pełny ekran (Esc aby wyjść)');
  } else {
    document.exitFullscreen();
  }
  setTimeout(() => MAP_PRO.map && MAP_PRO.map.invalidateSize(true), 300);
}

document.addEventListener('fullscreenchange', () => {
  setTimeout(() => MAP_PRO.map && MAP_PRO.map.invalidateSize(true), 200);
});

// ===== RESET VIEW =====
function resetView() {
  if (!MAP_PRO.map) return;
  MAP_PRO.map.flyTo([53.4025, 14.5520], 15, { animate: true, duration: 1 });
  if (typeof showToast === 'function') showToast('🏹 Powrót do centrum dzielnicy');
}

// ===== AUTO DAY / NIGHT =====
function applyAutoDayNight() {
  // Only auto-switch if user hasn't manually chosen yet this session
  if (sessionStorage.getItem('mapStyleManual')) return;
  const hour = new Date().getHours();
  // Night between 20:00–6:00 → dark map
  if (hour >= 20 || hour < 6) {
    setMapStyle('dark');
  }
}

// ===== KEYBOARD SHORTCUTS =====
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    // ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (window.state && window.state.currentSection !== 'map') return;

    switch (e.key.toLowerCase()) {
      case 'l': locateUser(); break;
      case 'f': toggleFullscreen(); break;
      case 'r': resetView(); break;
      case '+': case '=': MAP_PRO.map && MAP_PRO.map.zoomIn(); break;
      case '-': MAP_PRO.map && MAP_PRO.map.zoomOut(); break;
    }
  });
}

// Mark manual style choice (so auto day/night doesn't override)
window.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('.ss-opt')) {
    sessionStorage.setItem('mapStyleManual', '1');
  }
});

// Export
window.mapPro = {
  init: mapProInit,
  setStyle: setMapStyle,
  locate: locateUser,
  fullscreen: toggleFullscreen,
  reset: resetView
};
