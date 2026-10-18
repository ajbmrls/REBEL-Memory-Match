// Caches the games, their art and the font on first load so everything runs offline afterwards.
// Bump CACHE on every deploy or installed devices keep the old copy.
const CACHE='rebel-games-v7';
const FILES=['./','index.html','icon.png','manifest.webmanifest','css/app.css','js/content.js','js/core.js','js/memory.js','js/quiz.js','js/app.js','assets/hero.jpg',
  'illustrations/rebel-wordmark-black.png','illustrations/rebel-wordmark-white.png','illustrations/stressed-at-desk.png','illustrations/talking-it-through.png','illustrations/strong-mind.png','illustrations/runner.png','illustrations/coach-consultation.png','illustrations/team-cheering.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(res=>{
    const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res;
  }).catch(()=>caches.match('index.html'))));
});
