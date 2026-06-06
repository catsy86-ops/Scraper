// Service Worker — Szczecin Guide PWA v6
// Network-first for code, cache-first for tiles, IndexedDB for API data, offline fallback
const CACHE_VERSION = 'v6';
const CACHE_NAME = `niebuszewo-guide-${CACHE_VERSION}`;
const TILE_CACHE = `map-tiles-${CACHE_VERSION}`;
const API_CACHE = `api-data-${CACHE_VERSION}`;
const MAX_TILE_CACHE_SIZE = 500; // max tiles to keep

const APP_SHELL = [
  '/', '/index.html', '/style.css',
  '/app.js', '/data.js', '/live.js',
  '/error-handler.js', '/offline-store.js',
  '/zditm-live.js',
  '/sync-manager.js', '/performance.js',
  '/pull-refresh.js',
  '/places-enhanced.js', '/map-pro.js', '/map-layers.js',
  '/map-enhancements.js', '/map-improvements.js',
  '/map-extras.js', '/map-extras2.js',
  '/buildings-3d.js',
  '/map-vehicles.js',
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
      .then(cache => {
        // Cache app shell — don't fail install if some resources are missing
        return Promise.allSettled(
          APP_SHELL.map(url => cache.add(url).catch(() => console.warn('SW: failed to cache', url)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== TILE_CACHE && k !== API_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH =====
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Map tiles — cache-first with size limit
  if (isTileRequest(url)) {
    e.respondWith(tileStrategy(e.request));
    return;
  }

  // API calls — network-first with cache fallback (stale data better than no data)
  if (isApiRequest(url)) {
    e.respondWith(apiStrategy(e.request));
    return;
  }

  // Google Fonts — cache-first (they rarely change)
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(cacheFirstStrategy(e.request));
    return;
  }

  // CDN resources (Leaflet, MarkerCluster) — cache-first
  if (url.includes('cdnjs.cloudflare.com')) {
    e.respondWith(cacheFirstStrategy(e.request));
    return;
  }

  // App shell — network-first, fallback to cache
  if (e.request.mode === 'navigate' || isAppShell(url)) {
    e.respondWith(networkFirstStrategy(e.request));
    return;
  }

  // Everything else — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(e.request));
});

// ===== STRATEGIES =====

function isTileRequest(url) {
  return url.includes('tile.openstreetmap.org') ||
         url.includes('basemaps.cartocdn.com') ||
         url.includes('arcgisonline.com/ArcGIS');
}

function isApiRequest(url) {
  return url.includes('/api/') ||
         url.includes('open-meteo.com') ||
         url.includes('air-quality-api.open-meteo.com') ||
         url.includes('nominatim.openstreetmap.org') ||
         url.includes('gios.gov.pl') ||
         url.includes('imgw.pl') ||
         url.includes('zditm.szczecin.pl');
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

async function staleWhileRevalidate(req) {
  const cached = await caches.match(req);
  const fetchPromise = fetch(req).then(res => {
    if (res.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(req, res.clone())).catch(() => {});
    }
    return res;
  }).catch(() => null);

  return cached || (await fetchPromise) || offlineFallback();
}

// API strategy — network-first with 5s timeout, fallback to cached API data
async function apiStrategy(req) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(req, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(req, res.clone()).catch(() => {});
      return res;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch {
    // Return cached API data if available (stale but better than nothing)
    const cached = await caches.match(req);
    if (cached) return cached;
    // Return empty JSON response so the app doesn't break
    return new Response(JSON.stringify({ error: 'offline', source: 'cache-miss' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function tileStrategy(req) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(req, res.clone()).catch(() => {});
      // Periodically trim tile cache
      trimTileCache();
    }
    return res;
  } catch {
    // Return transparent 1x1 PNG for missing tiles
    return new Response(
      Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), c => c.charCodeAt(0)),
      { headers: { 'Content-Type': 'image/png' } }
    );
  }
}

// Trim tile cache to prevent storage bloat
async function trimTileCache() {
  try {
    const cache = await caches.open(TILE_CACHE);
    const keys = await cache.keys();
    if (keys.length > MAX_TILE_CACHE_SIZE) {
      // Remove oldest tiles (first in = first out)
      const toDelete = keys.slice(0, keys.length - MAX_TILE_CACHE_SIZE);
      await Promise.all(toDelete.map(k => cache.delete(k)));
    }
  } catch {}
}

function offlineFallback() {
  return new Response(`<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Niebuszewo Guide</title>
<style>
  body{font-family:'Inter',sans-serif;text-align:center;padding:60px 20px;background:#1a1a2e;color:#e0e0e0;margin:0}
  h2{font-size:24px;margin-bottom:12px}
  p{color:#aaa;font-size:14px;line-height:1.6}
  .icon{font-size:64px;margin-bottom:20px}
  .retry-btn{margin-top:24px;padding:12px 24px;background:#6c63ff;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}
  .retry-btn:hover{background:#5a52e0}
</style></head>
<body>
  <div class="icon">📵</div>
  <h2>Tryb offline</h2>
  <p>Brak połączenia z internetem.<br>Sprawdź sieć i spróbuj ponownie.</p>
  <p>Dane z ostatniej sesji mogą być dostępne po odświeżeniu.</p>
  <button class="retry-btn" onclick="location.reload()">🔄 Odśwież stronę</button>
</body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ===== BACKGROUND SYNC (for future use) =====
self.addEventListener('sync', e => {
  if (e.tag === 'sync-favorites') {
    // Future: sync favorites to cloud
  }
});

// ===== PUSH NOTIFICATIONS (for future use) =====
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Niebuszewo Guide', {
      body: data.body || '',
      icon: '/manifest-icon-192.png',
      badge: '/manifest-icon-192.png',
      tag: data.tag || 'general'
    })
  );
});
