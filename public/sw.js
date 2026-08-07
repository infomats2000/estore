const CACHE_NAME = 'techseller-offline-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/images/app_logo.jpg',
  '/manifest.json'
];

// Service Worker Installation: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch interceptor: authenticated and tenant-scoped APIs always use the network.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip caching non-GET requests (e.g. POST, PUT, DELETE)
  if (req.method !== 'GET') {
    return;
  }

  // Never put API responses in the shared browser cache. This prevents stale or
  // cross-session tenant data and avoids a duplicate background request.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  const isHashedAsset = /\/assets\/[^/]+-[A-Za-z0-9_-]+\.(?:js|css)$/.test(url.pathname);

  // Hashed assets are immutable, so cache-first does not need revalidation.
  if (isHashedAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => cachedResponse || fetch(req).then((networkResponse) => {
        if (networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse.clone()));
        }
        return networkResponse;
      }))
    );
    return;
  }

  // Network-first for HTML and other mutable public assets.
  event.respondWith(
    fetch(req).then((networkResponse) => {
        if (networkResponse.status === 200 && req.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(req).then((cachedResponse) => cachedResponse ||
          (req.headers.get('accept')?.includes('text/html') ? caches.match('/index.html') : undefined));
      })
  );
});
