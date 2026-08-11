// ──────────────────────────────────────────────────────────────
// SalonSync PWA Service Worker — Network-First Live Updates
// ──────────────────────────────────────────────────────────────
const CACHE_VERSION = 'salonsync-live-v12';

const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

// ── INSTALL: Pre-cache core shell & force immediate activation ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS_TO_PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: Purge all old caches & claim all open clients ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_VERSION) {
              console.log('[SW] Purging old cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── FETCH: NETWORK-FIRST strategy to guarantee fresh code on every deploy ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, API calls, and external requests
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Network-First for ALL requests (HTML, JS, CSS) to prevent stale cache issues
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is completely offline
        return caches.match(request).then((cached) => cached || caches.match('/index.html'));
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
