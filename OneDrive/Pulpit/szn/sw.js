// Service Worker — Szczecin Guide PWA v5
// Network-first for code, cache-first for tiles, offline fallback
const CACHE_NAME = 'niebuszewo-guide-v1';
const TILE_CACHE = 'map-tiles-v1';

const APP_SHELL = [
  '/', '/index.html', '/style.css',
  '/app.js', '/data.js', '/live.js',
  '/places-enhanced.js', '/map-pro.js', '/map-layers.js',
  '/map-enhancements.js', '/map-improvements.js',
  '/navigation.js', '/search.js', '/pwa.js',
  '/community-data.js', '/community-ui.js',
  '/routes-meetup.js', '/user-profile.js',
  '/place-images.js', '/ux-enhancements.js', '/pogon-mascot.js',
  '/google-maps.js', '/manifest.json'
];

// ===== INSTALL =====
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== TILE_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Map tiles — cache-first (tiles don't change)
  if (isTileRequest(url)) {
    e.respondWith(tileStrategy(e.request));
    return;
  }

  // API calls — network-only (always fresh)
  if (url.includes('/api/') || url.includes('open-meteo.com') ||
      url.includes('nominatim.openstreetmap.org') ||
      url.includes('overpass') || url.includes('osrm') ||
      url.includes('gios.gov.pl') || url.includes('imgw.pl') ||
      url.includes('zditm.szczecin.pl')) {
    return; // let browser handle, no SW caching
  }

  // App shell — network-first, fallback to cache
  if (e.request.mode === 'navigate' || isAppShell(url)) {
    e.respondWith(networkFirstStrategy(e.request));
    return;
  }

  // Everything else — cache-first
  e.respondWith(cacheFirstStrategy(e.request));
});

function isTileRequest(url) {
  return url.includes('tile.openstreetmap.org') ||
         url.includes('basemaps.cartocdn.com') ||
         url.includes('arcgisonline.com/ArcGIS');
}

function isAppShell(url) {
  return APP_SHELL.some(path => url.endsWith(path));
}

async function networkFirstStrategy(req) {
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    return cached || offlineFallback();
  }
}

async function cacheFirstStrategy(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    return offlineFallback();
  }
}

async function tileStrategy(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(TILE_CACHE);
      // Limit tile cache size
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    // Return transparent 1x1 PNG for missing tiles
    return new Response(
      atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='),
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
}

function offlineFallback() {
  return new Response(
    '<html><body style="font-family:sans-serif;text-align:center;padding:40px"><h2>📵 Tryb offline</h2><p>Brak połączenia z internetem. Sprawdź sieć i odśwież stronę.</p></body></html>',
    { headers: { 'Content-Type': 'text/html' } }
  );
}
