// ──────────────────────────────────────────────────────────────
// SalonSync PWA Service Worker — Auto-Update Enabled
// Bump CACHE_VERSION on every deploy to trigger update cycle
// ──────────────────────────────────────────────────────────────
const CACHE_VERSION = 'salonsync-cache-v3';

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
      .then(() => self.skipWaiting()) // Activate new SW immediately, don't wait for tabs to close
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
      .then(() => self.clients.claim()) // Take control of all open pages immediately
  );
});

// ── FETCH: Network-first for pages, cache-first for static assets ──
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET, API calls, and external requests entirely
  if (
    request.method !== 'GET' ||
    request.url.includes('/api/') ||
    !request.url.startsWith(self.location.origin)
  ) {
    return;
  }

  // Navigation requests (HTML pages): NETWORK-FIRST
  // Always try to fetch the latest version from the server
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest page for offline fallback
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback: serve cached index.html
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts): CACHE-FIRST with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Asset not available offline — fail silently
        });
    })
  );
});

// ── MESSAGE: Listen for skip-waiting command from the client ──
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
