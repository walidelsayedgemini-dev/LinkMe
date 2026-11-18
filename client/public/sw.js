// Link Me PWA Service Worker
const CACHE_NAME = 'linkme-pwa-v2';
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
      return cache.addAll(STATIC_ASSETS).catch(() => {});
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
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  // Skip API, Vite dev modules, and internal endpoints
  if (
    url.includes('/api/') ||
    url.includes('/@vite') ||
    url.includes('/@fs') ||
    url.includes('/src/') ||
    url.includes('/node_modules/') ||
    url.includes('/__manus__')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        const rootCached = await caches.match('/');
        if (rootCached) return rootCached;
      }
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    })
  );
});
