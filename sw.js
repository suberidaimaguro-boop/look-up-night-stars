const V='hoshizora-v30',CORE=['./','index.html','style.css','app.js','data.js','myths.js','stars_extra.js','art.js','manifest.json','icon.png','icon-192.png','apple-touch-icon.png'];
/* 星座絵(オフラインでも表示するため全部保存する)。インストールは軽くして、起動後に1枚ずつ保存する */
const ART=['Cyg','Ori','Sco','Cas','UMa','Leo','Peg','Lyr','Aql','Tau','Gem','CMa','CMi','Aur','Vir','Sgr','Per','And','Her','Oph','Boo','Cep','Lib','Cap','Aqr','Psc','Ari','Cet','Cen','Cru','Cnc','UMi','CrB','Del','Sge','Dra'].map(c=>'art/'+c+'.webp');
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data!=='art')return;
 e.waitUntil(caches.open(V).then(async c=>{for(const u of ART){try{if(!(await c.match(u)))await c.add(u)}catch(x){}}}))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put(e.request,c));return n}).catch(()=>r)))});
