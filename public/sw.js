self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
  // Basic fetch handler to satisfy PWA requirements
  event.respondWith(fetch(event.request));
});
