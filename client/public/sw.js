// Link Me PWA Service Worker
const CACHE_NAME = 'linkme-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/brand-icon.svg',
  '/img/yassin-avatar.jpg',
  '/img/khadija-avatar.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Allow network first, fallback to cache for offline support
  if (event.request.method !== 'GET') return;
  
  // Skip API / tRPC requests to avoid stale responses
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
