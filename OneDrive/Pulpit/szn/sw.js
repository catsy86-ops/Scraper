// Service Worker — Szczecin Guide PWA
// v4 — Leaflet edition. Network-first for code so deploys take effect immediately.
const CACHE_NAME = 'szczecin-guide-v4-leaflet';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/data.js',
  '/live.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never intercept map tiles or external map/tile services — let them hit the network directly.
  if (
    url.includes('tile.openstreetmap.org') ||
    url.includes('server.arcgisonline.com') ||
    url.includes('stadiamaps.com') ||
    url.includes('cartocdn.com') ||
    url.includes('basemaps.cartocdn.com') ||
    url.includes('tile.') ||
    url.includes('googleapis.com/maps') ||
    url.includes('maps.googleapis.com')
  ) {
    return; // default browser fetch, no SW caching
  }

  // Network-first for our own HTML/JS/CSS so users always get the latest deployed code.
  if (
    e.request.mode === 'navigate' ||
    url.endsWith('.js') ||
    url.endsWith('.css') ||
    url.endsWith('.html')
  ) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else (fonts, icons, etc.)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
