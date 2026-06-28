const CACHE = 'vipglass-sw-v1';
const FALLBACK = '/vpn-blocked.html';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.add(FALLBACK))
  );
  self.skipWaiting();
});

self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { signal: AbortSignal.timeout(8000) })
        .catch(() => caches.match(FALLBACK))
    );
  }
});
