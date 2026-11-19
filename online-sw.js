
const CACHE='kbr-online-customer-v103-customer-addons-assets-phase2-customer-security-v1-compact-categories-v1-install-v1-flavor-stock-v2';
const ASSETS=[
  './online.html',
  './online-orders.css?v=84-food-status',
  './online-orders.js?v=105-food-status',
  './shop-hours-client.js?v=1',
  './online-manifest.webmanifest?v=72-install', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'}))))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('kbr-online-')&&k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==location.origin||!url.pathname.startsWith(new URL('./',self.registration.scope).pathname))return;

  event.respondWith(
    fetch(event.request,{cache:'no-store'})
      .then(response=>{
        if(response.ok){
          caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
        }
        return response;
      })
      .catch(async error=>{const cache=await caches.open(CACHE);const saved=await cache.match(event.request);if(saved)return saved;if(event.request.mode==='navigate'){const shell=await cache.match('./online.html');if(shell)return shell;}throw error;})
  );
});
