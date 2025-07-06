const CACHE_NAME = 'chartsense-v4';
const urlsToCache = [
  '/manifest.json',
  '/images/banner.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Skip service worker for API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Skip service worker for Google Cloud Storage image requests
  if (event.request.url.includes('storage.googleapis.com')) {
    return;
  }
  
  // Skip service worker for POST requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Never cache the root path - always fetch fresh
  if (event.request.url === self.location.origin + '/' || 
      event.request.url.endsWith('/') && !event.request.url.includes('.')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Use network first strategy for HTML documents
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For static assets, use cache first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return response;
        });
      })
  );
});