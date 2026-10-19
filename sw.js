// Pages, scripts and styles are network first: online devices always get the latest and refresh the offline copy.
// Offline devices fall back to the cached copy. Bumping CACHE also clears every older cache.
const CACHE='rebel-games-v37';
const FILES=['./','index.html','icon.png','manifest.webmanifest','css/app.css','js/content.js','js/core.js','js/memory.js','js/quiz.js','js/app.js','assets/hero.jpg','assets/qr-score.svg','assets/qr-play.svg','assets/qr-hypertension.svg','assets/qr-diabetes.svg',
  'illustrations/rebel-wordmark-black.png','illustrations/rebel-wordmark-white.png','illustrations/stressed-at-desk.png','illustrations/talking-it-through.png','illustrations/strong-mind.png','illustrations/runner.png','illustrations/coach-consultation.png','illustrations/team-cheering.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  // Images and QR codes: answer from the cache at once and refresh it in the background, so they appear instantly.
  if(/\.(svg|png|jpe?g|webp)$/.test(new URL(e.request.url).pathname)){
    e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
      const net=fetch(e.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(e.request,res.clone()));return res}).catch(()=>hit);
      return hit||net;
    }));
    return;
  }
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(res=>{
    if(res.ok||res.type==='opaque'){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}
    return res;
  }).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||caches.match('index.html'))));
});
