const CACHE_NAME = 'chartsense-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/banner.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
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
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});