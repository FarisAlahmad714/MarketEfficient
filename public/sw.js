const CACHE_NAME = 'chartsense-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/images/logo.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Skip service worker for Google Cloud Storage image requests
  if (event.request.url.includes('storage.googleapis.com')) {
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