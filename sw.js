const CACHE='kbr-pos-v92-payment-quick-cash-keypads';
const ASSETS=[
  './',
  './index.html',
  './comp-payments.js',
  './pay-later.js',
  './app-update.js',
  './sales.html',
  './manager.html',
  './manager.js',
  './sales.js',
  './sales-data.js',
  './sw.js',
  './manifest.json',
  './payment.js',
  './sync-config.js',
  './sync-core.js',
  './sync-ui.js',
  './app-sync.js',
  './menu-sync.js',
  './sync.css',
  './sync-login.html',
  './display.html',
  './menu.html',
  './menu.js',
  './menu-defaults.js',
  './menu-store.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('kbr-pos-') && key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Authenticated Supabase responses must always bypass the offline cache.
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
