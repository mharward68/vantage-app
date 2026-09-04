const CACHE_NAME = 'vantageprm-cache-v128';
const ASSETS = [
  './index.html',
  './style.css',
  './app.js',
  './prm_data.json',
  './manifest.json',
  './assets/logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install Event - Pre-cache resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clear old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve assets from cache, fallback to network
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request, { redirect: 'follow' }).then((networkResponse) => {
        // Don't cache redirects, errors, or cross-origin opaque responses
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type === 'opaqueredirect' ||
          networkResponse.type === 'error'
        ) {
          return networkResponse;
        }

        // Cache same-origin and CORS responses only
        if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            if (e.request.url.startsWith('http')) {
              cache.put(e.request, responseToCache);
            }
          });
        }

        return networkResponse;
      }).catch(() => {
        // Offline fallback if fetch fails
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
