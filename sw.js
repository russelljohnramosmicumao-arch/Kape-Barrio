const CACHE="kbr-pos-v101-separate-manager";
const ASSETS=[
  "./",
  "./app-links.js",
  "./app-sync.js",
  "./app-update.js",
  "./comp-payments.js",
  "./index.html",
  "./manager.html",
  "./manifest.json",
  "./menu-defaults.js",
  "./menu-store.js",
  "./pay-later.js",
  "./reset-password.html",
  "./reset-password.js",
  "./shift-records.html",
  "./shifts.js",
  "./sync-config.js",
  "./sync-core.js",
  "./sync-login.html",
  "./sync-ui.js",
  "./sync.css"
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("kbr-pos-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!u.href.startsWith(self.registration.scope))return;e.respondWith(caches.open(CACHE).then(async c=>{const saved=await c.match(e.request);if(saved)return saved;try{const response=await fetch(e.request);if(response.ok)c.put(e.request,response.clone()).catch(()=>{});return response;}catch(error){if(e.request.mode==='navigate')return c.match('./index.html');throw error;}}));});
