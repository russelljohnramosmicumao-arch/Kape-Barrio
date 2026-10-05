const CACHE='kbr-pos-v79-specials-drinks';
const ASSETS=[
  './',
  './index.html',
  './sw.js',
  './manifest.json',
  './payment.js',
  './menu.html',
  './menu.js',
  './menu-defaults.js',
  './menu-store.js',
  './images/creambar-thumbnail.png',
  './images/pinipig-thumbnail.png',
  './images/regular-cone-thumbnail.png',
  './images/jumbo-cone-thumbnail.png',
  './images/ice-cream-bilog-thumbnail.png',
  './images/ice-cream-tub-1-3l-thumbnail.png',
  './images/nom-chompoo-thumbnail.png',
  './images/cha-yen-thumbnail.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
