const CACHE = 'signal-dashboard-v1.1';
const ASSETS = [
  './signal-dashboard-v1.1.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS.filter(a => !a.includes('.png'))))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first for API calls, cache first for static
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for API calls (Alpaca, Anthropic)
  if (url.hostname.includes('alpaca') ||
      url.hostname.includes('anthropic') ||
      url.hostname.includes('finnhub')) {
    e.respondWith(fetch(e.request).catch(() => new Response('offline', {status: 503})));
    return;
  }

  // Cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
