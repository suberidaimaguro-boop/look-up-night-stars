const V='hoshizora-v17',F=['./','index.html','style.css','app.js','data.js','myths.js','stars_extra.js','art.js','art/Cyg.webp','art/Ori.webp','art/Sco.webp','art/Cas.webp','art/UMa.webp','art/Leo.webp','art/Peg.webp','art/Lyr.webp','art/Aql.webp','art/Tau.webp','art/Gem.webp','art/CMa.webp','art/CMi.webp','art/Aur.webp','art/Vir.webp','art/Sgr.webp','manifest.json','icon.png','icon-night.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put(e.request,c));return n}).catch(()=>r)))});
