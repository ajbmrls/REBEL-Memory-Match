// Caches the game, its art and its font on first load so it runs offline afterwards.
const CACHE='rebel-match-v4';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','index.html','icon.png','manifest.webmanifest','illustrations/rebel-wordmark-black.png','illustrations/rebel-wordmark-white.png','illustrations/stressed-at-desk.png','illustrations/talking-it-through.png','illustrations/strong-mind.png','illustrations/runner.png'])).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;
  }).catch(()=>caches.match('index.html'))));
});
