const CACHE_NAME = 'techseller-offline-v1';
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

// Fetch Interceptor: Cache-First for static assets, Stale-While-Revalidate for GET API requests
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip caching non-GET requests (e.g. POST, PUT, DELETE)
  if (req.method !== 'GET') {
    return;
  }

  // Handle API GET requests with Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(req, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            return cache.match(req).then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              return new Response(JSON.stringify({ offline: true, error: 'Offline mode active' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
          });
      })
    );
    return;
  }

  // Cache-First with Network Fallback for Static Assets
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update in parallel
        fetch(req).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (networkResponse.status === 200 && req.url.startsWith('http')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
