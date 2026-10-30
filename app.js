(()=>{
'use strict';
const D=Math.PI/180,$=id=>document.getElementById(id),cv=$('sky'),ctx=cv.getContext('2d');
const KEY='hoshizora.v1',clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const def={lat:35.86,lon:139.65,city:'埼玉県（さいたま）',limit:5,lines:1,cons:1,names:1,real:1,az:180,alt:55,fov:110,arOff:0,speed:34};
const PREFECTURES=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
CITIES.forEach((city,index)=>city[0]=`${PREFECTURES[index]}（${city[0]}）`);
let S=Object.assign({},def);try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
if(!CITIES.some(city=>city[0]===S.city)){const old=CITIES.find(city=>city[0].endsWith(`（${S.city}）`));S.city=old?old[0]:def.city}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
let T=Date.now(),baseT=T,playing=false,last=0,ar=false,W=0,H=0,V={},hits=[],sel=null,dirty=true;

/* ---------- 星表 ---------- */
const stars=STAR_DATA.map(r=>({k:r[0],ra:r[1]*15,dec:r[2],mag:r[3],bv:r[4],con:r[5]}));
const byKey={};stars.forEach(s=>byKey[s.k]=s);
const conStars={};for(const c in CONS){const set=new Set();CONS[c][1].forEach(p=>p.forEach(k=>set.add(k)));conStars[c]=[...set].map(k=>byKey[k]).filter(Boolean)}
fetch('data/stars_extra.json').then(r=>r.ok?r.json():[]).then(a=>{a.forEach(r=>stars.push({k:null,ra:r[0]*15,dec:r[1],mag:r[2],bv:r[3]||0.5,con:''}));need()}).catch(()=>{});

/* ---------- 天文計算 ---------- */
const jd=t=>t/86400000+2440587.5;
const lstDeg=(J,lon)=>((280.46061837+360.98564736629*(J-2451545)+lon)%360+360)%360;
function eq2hor(ra,dec,L,lat){const h=(L-ra)*D,d=dec*D,f=lat*D;
 const alt=Math.asin(Math.sin(d)*Math.sin(f)+Math.cos(d)*Math.cos(f)*Math.cos(h));
 const az=Math.atan2(-Math.cos(d)*Math.sin(h),Math.sin(d)*Math.cos(f)-Math.cos(d)*Math.sin(f)*Math.cos(h));
 return [(az+2*Math.PI)%(2*Math.PI),alt]}
function ecl2eq(lam,beta,n){const e=(23.439-4e-7*n)*D;
 return [Math.atan2(Math.sin(lam)*Math.cos(e)-Math.tan(beta)*Math.sin(e),Math.cos(lam))/D,Math.asin(Math.sin(beta)*Math.cos(e)+Math.cos(beta)*Math.sin(e)*Math.sin(lam))/D]}
function sunPos(n){const L=280.460+0.9856474*n,g=(357.528+0.9856003*n)*D,lam=(L+1.915*Math.sin(g)+0.020*Math.sin(2*g))*D;
 const q=ecl2eq(lam,0,n);return {ra:(q[0]+360)%360,dec:q[1],lam}}
function moonPos(n,sunLam){const Lp=218.316+13.176396*n,M=(134.963+13.064993*n)*D,F=(93.272+13.229350*n)*D;
 const lam=(Lp+6.289*Math.sin(M))*D,beta=5.128*Math.sin(F)*D,q=ecl2eq(lam,beta,n);
 return {ra:(q[0]+360)%360,dec:q[1],el:lam-sunLam}}
function precess(s,yrs){const r=s.ra*D,d=s.dec*D;
 return [s.ra+(3.075+1.336*Math.sin(r)*Math.tan(d))*yrs*15/3600,s.dec+20.043*Math.cos(r)*yrs/3600]}

/* ---------- 色 ---------- */
const CT=[[-0.3,155,176,255],[0,195,210,255],[0.3,244,245,255],[0.6,255,244,232],[0.8,255,230,205],[1.0,255,210,160],[1.4,255,172,105],[1.9,255,135,70]];
function bvRGB(bv){bv=clamp(bv,-0.3,1.9);for(let i=1;i<CT.length;i++)if(bv<=CT[i][0]){const a=CT[i-1],b=CT[i],t=(bv-a[0])/(b[0]-a[0]);return [1,2,3].map(j=>a[j]+(b[j]-a[j])*t)}return [255,135,70]}
const tempK=bv=>Math.round(4600*(1/(0.92*bv+1.7)+1/(0.92*bv+0.62))/100)*100;
function starColor(s){let c=bvRGB(s.bv);if(S.real){const t=clamp((s.mag-0.3)/4.5,0,0.8);c=c.map(v=>v+(255-v)*t)}else c=c.map(v=>clamp(255+(v-255)*1.3,0,255));return c.map(Math.round)}

/* ---------- 投影 ---------- */
function setView(){const A=S.az*D,a=S.alt*D;
 V.c=[Math.cos(a)*Math.sin(A),Math.cos(a)*Math.cos(A),Math.sin(a)];V.u=[-Math.sin(a)*Math.sin(A),-Math.sin(a)*Math.cos(A),Math.cos(a)];V.r=[Math.cos(A),-Math.sin(A),0];
 V.s=(Math.min(W,H)/2)/(2*Math.tan(S.fov*D/4));V.cx=W/2;V.cy=H/2;V.z=clamp(Math.sqrt(110/S.fov),0.8,2.4)}
function proj(az,alt){const ca=Math.cos(alt),v=[ca*Math.sin(az),ca*Math.cos(az),Math.sin(alt)],w=dot(v,V.c);if(w<-0.8)return null;
 const k=2/(1+w);return [V.cx+k*dot(v,V.r)*V.s,V.cy-k*dot(v,V.u)*V.s]}

/* ---------- 描画 ---------- */
const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
function draw(){dirty=false;const dpr=window.devicePixelRatio||1;
 if(cv.width!==Math.round(innerWidth*dpr)||cv.height!==Math.round(innerHeight*dpr)){cv.width=Math.round(innerWidth*dpr);cv.height=Math.round(innerHeight*dpr)}
 W=innerWidth;H=innerHeight;ctx.setTransform(dpr,0,0,dpr,0,0);setView();
 const J=jd(T),n=J-2451545,L=lstDeg(J,S.lon),yrs=n/365.25;
 const sp=sunPos(n),sh=eq2hor(sp.ra,sp.dec,L,S.lat),sunAlt=sh[1]/D;
 const mp=moonPos(n,sp.lam),mh=eq2hor(mp.ra,mp.dec,L,S.lat),illum=(1-Math.cos(mp.el))/2;
 const tw=clamp((sunAlt+18)/18,0,1),dy=clamp(sunAlt/8,0,1);
 let bg=mix(mix([6,9,18],[40,54,100],tw),[100,152,212],dy);ctx.fillStyle=`rgb(${bg})`;ctx.fillRect(0,0,W,H);
 const eff=S.limit-clamp((sunAlt+18)*0.5,0,14)-(mh[1]>0?illum*Math.sin(mh[1])*1.2:0);
 const nightK=clamp(1-dy-(1-tw)*0.0,0,1)*tw;
 hits=[];ctx.lineCap='round';
 // 地平線と方位
 ctx.strokeStyle='rgba(232,180,90,.35)';ctx.lineWidth=1;ctx.beginPath();let pen=false;
 for(let a=0;a<=360;a+=4){const p=proj(a*D,0);if(!p){pen=false;continue}pen?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]);pen=true}ctx.stroke();
 ctx.font='600 15px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e8b45a';
 [['北',0],['東',90],['南',180],['西',270]].forEach(([t,a])=>{const p=proj(a*D,3*D);if(p)ctx.fillText(t,p[0],p[1])});
 // 位置計算
 for(const s of stars){if(s.mag>eff+0.5&&s.k===null){s.v=0;continue}const q=yrs?precess(s,yrs):[s.ra,s.dec],h=eq2hor(q[0],q[1],L,S.lat);s.az=h[0];s.alt=h[1];s.v=h[1]>-0.02}
 // 星座線
 if(S.lines&&nightK>0.02){ctx.strokeStyle=`rgba(110,150,205,${0.5*nightK})`;ctx.lineWidth=1;ctx.beginPath();
  for(const c in CONS)for(const [a,b] of CONS[c][1]){const A=byKey[a],B=byKey[b];if(!A||!B||!A.v||!B.v)continue;const p=proj(A.az,A.alt),q=proj(B.az,B.alt);if(p&&q){ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1])}}ctx.stroke()}
 // 星
 const nm=2.4+(110/S.fov-1)*0.9;
 for(const s of stars){if(!s.v||s.mag>eff)continue;const p=proj(s.az,s.alt);if(!p||p[0]<-20||p[0]>W+20||p[1]<-20||p[1]>H+20)continue;
  const r=Math.max(0.7,3.0*Math.pow(10,-0.11*s.mag)*V.z),al=clamp((eff-s.mag)/1.2+0.25,0.25,1)*(s.mag>eff-1.5?0.85:1),c=starColor(s);
  ctx.fillStyle=`rgba(${c},${al})`;if(s.mag<2.5){ctx.shadowColor=`rgba(${c},.9)`;ctx.shadowBlur=r*3}ctx.beginPath();ctx.arc(p[0],p[1],r,0,6.283);ctx.fill();ctx.shadowBlur=0;
  if(s.k)hits.push({x:p[0],y:p[1],s});
  if(S.names&&s.k&&s.mag<nm&&JA[s.k]!==undefined||S.names&&s.k&&s.mag<nm-1.2){ctx.fillStyle=`rgba(233,230,218,${0.75*nightK})`;ctx.font='12px sans-serif';ctx.textAlign='left';ctx.fillText((JA[s.k]||s.k).replace(/\(.*\)/,''),p[0]+r+4,p[1]-r-2)}}
 // 星座名
 if(S.cons&&nightK>0.1){ctx.font='13px sans-serif';ctx.textAlign='center';ctx.fillStyle=`rgba(232,180,90,${0.8*nightK})`;
  for(const c in CONS){const L2=conStars[c];if(!L2.length)continue;let x=0,y=0,z=0,m=0;for(const s of L2)if(s.v){x+=Math.cos(s.alt)*Math.sin(s.az);y+=Math.cos(s.alt)*Math.cos(s.az);z+=Math.sin(s.alt);m++}
   if(m<L2.length*0.6)continue;const az=(Math.atan2(x,y)+2*Math.PI)%(2*Math.PI),al=Math.atan2(z,Math.hypot(x,y)),p=proj(az,al);if(p)ctx.fillText(CONS[c][0],p[0],p[1]+16)}}
 // 太陽・月
 if(sh[1]>-0.05){const p=proj(sh[0],sh[1]);if(p){ctx.shadowColor='#ffd27a';ctx.shadowBlur=30;ctx.fillStyle='#ffe9a8';ctx.beginPath();ctx.arc(p[0],p[1],9*V.z,0,6.283);ctx.fill();ctx.shadowBlur=0}}
 if(mh[1]>-0.05){const p=proj(mh[0],mh[1]);if(p)moon(p[0],p[1],8*V.z,mp.el)}
 // 選択リング
 if(sel&&sel.v){const p=proj(sel.az,sel.alt);if(p){ctx.strokeStyle='#e8b45a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p[0],p[1],14,0,6.283);ctx.stroke()}}
}
function moon(x,y,R,el){const k=Math.cos(el),wax=Math.sin(el)>0;ctx.fillStyle='#262b3a';ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
 ctx.fillStyle='#f4f0dc';ctx.beginPath();ctx.arc(x,y,R,-Math.PI/2,Math.PI/2,!wax);
 ctx.ellipse(x,y,Math.max(0.01,R*Math.abs(k)),R,0,Math.PI/2,-Math.PI/2,wax?k>0:k<0);ctx.fill()}
function need(){if(!dirty){dirty=true;requestAnimationFrame(frame)}}
function frame(now){if(playing){const dt=Math.min(now-(last||now),100);last=now;T+=dt*speedSeconds();syncTime();dirty=true}
 draw();if(playing||ar){requestAnimationFrame(frame);dirty=true}}

/* ---------- 情報カード ---------- */
function showCard(s){sel=s;const i=INFO[s.k],card=$('card');$('cName').textContent=JA[s.k]||s.k;
 $('cSub').textContent=(CONS[s.con]?CONS[s.con][0]:'')+(JA[s.k]?' / '+s.k:'');
 const tempC=tempK(s.bv)-273;
 const rows=[['見かけの明るさ',s.mag.toFixed(2)+'等'],['距離',i?'約'+i[1]+'光年':'データなし'],['スペクトル型',i?i[0]:'データなし'],['表面温度（推定）','約'+tempC.toLocaleString()+' °C'],['推定年齢',i?i[2]:'推定データなし']];
 $('cList').replaceChildren(...rows.flatMap(([a,b])=>{const t=document.createElement('dt'),d=document.createElement('dd');t.textContent=a;d.textContent=b;return[t,d]}));
 $('cNote').textContent=i?i[3]:'';card.hidden=false;need()}
$('cardClose').onclick=()=>{$('card').hidden=true;sel=null;need()};

/* ---------- 操作 ---------- */
const ptrs=new Map();let down=null,pinch=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};if(ptrs.size===2)pinch=pd()});
const pd=()=>{const [a,b]=[...ptrs.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])};
cv.addEventListener('pointermove',e=>{const o=ptrs.get(e.pointerId);if(!o)return;const dx=e.clientX-o[0],dy=e.clientY-o[1];ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2){const d=pd();if(pinch)S.fov=clamp(S.fov*pinch/d,20,160);pinch=d;down&&(down.moved=true)}
 else{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)down.moved=true;const sc=S.fov/Math.min(W,H)*0.9;
  if(ar){S.arOff-=dx*sc}else{S.az=((S.az-dx*sc)%360+360)%360;S.alt=clamp(S.alt+dy*sc,-10,90)}}need()});
const up=e=>{ptrs.delete(e.pointerId);pinch=0;if(down&&!down.moved&&ptrs.size===0&&performance.now()-down.t<500)pick(e.clientX,e.clientY);if(!ptrs.size){down=null;save()}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();S.fov=clamp(S.fov*Math.exp(e.deltaY*0.001),20,160);need()},{passive:false});
function pick(x,y){let b=null,bd=22;for(const h of hits){const d=Math.hypot(h.x-x,h.y-y);if(d<bd||(d<bd+4&&b&&h.s.mag<b.mag-1)){bd=d;b=h.s}}if(b)showCard(b);else{$('card').hidden=true;sel=null;need()}}

/* ---------- 時刻・場所 ---------- */
const p2=n=>String(n).padStart(2,'0');
function syncTime(){const d=new Date(T);$('date').value=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;$('time').value=`${p2(d.getHours())}:${p2(d.getMinutes())}`}
function readTime(){const v=new Date($('date').value+'T'+($('time').value||'00:00'));if(!isNaN(v)){T=v.getTime();baseT=T;$('dayShift').value=0;need()}}
$('date').onchange=readTime;$('time').onchange=readTime;
$('now').onclick=()=>{T=Date.now();baseT=T;$('dayShift').value=0;syncTime();need()};
$('dayShift').oninput=e=>{T=baseT+(+e.target.value)*864e5;syncTime();need()};
$('play').onclick=e=>{playing=!playing;last=0;e.target.setAttribute('aria-pressed',playing);e.target.textContent=playing?'■':'▶';if(playing){baseT=T;requestAnimationFrame(frame)}};
const cs=$('city');cs.add(new Option('都道府県を選択',''));CITIES.forEach(c=>cs.add(new Option(c[0],c[0])));
function setLoc(lat,lon,city){S.lat=+(+lat).toFixed(2);S.lon=+(+lon).toFixed(2);S.city=city;cs.value=city;$('lat').value=S.lat;$('lon').value=S.lon;save();need()}
cs.onchange=()=>{const c=CITIES.find(x=>x[0]===cs.value);if(c)setLoc(c[1],c[2],c[0]);else S.city=''};
$('lat').onchange=$('lon').onchange=()=>{const la=+$('lat').value,lo=+$('lon').value;if(la>=-90&&la<=90&&lo>=-180&&lo<=180)setLoc(la,lo,'');else toast('緯度は-90〜90、経度は-180〜180で入力してください')};
$('geo').onclick=()=>{if(!navigator.geolocation)return toast('この端末では位置情報を使えません');
 navigator.geolocation.getCurrentPosition(p=>{setLoc(p.coords.latitude,p.coords.longitude,'');toast('現在地を設定しました(端末内のみで使用)')},()=>toast('位置情報を取得できませんでした。許可設定を確認してください'),{timeout:10000})};

/* ---------- 設定 ---------- */
const lim=$('limit');lim.value=S.limit;const limShow=()=>$('limOut').textContent=S.limit.toFixed(1)+'等';limShow();
lim.oninput=()=>{S.limit=+lim.value;limShow();save();need()};
const speed=$('speed'),speedOut=$('speedOut');
function speedSeconds(){return Math.round(60*Math.pow(1440,(+speed.value)/100))}
function showSpeed(){const seconds=speedSeconds();speedOut.textContent=seconds<3600?`1秒 = 約${Math.max(1,Math.round(seconds/60))}分`:`1秒 = 約${Math.round(seconds/3600*10)/10}時間`;S.speed=+speed.value}
speed.value=S.speed??def.speed;showSpeed();speed.oninput=()=>{showSpeed();save()};
[['tLines','lines'],['tCons','cons'],['tNames','names'],['tReal','real']].forEach(([id,k])=>{const el=$(id);el.checked=!!S[k];el.onchange=()=>{S[k]=el.checked?1:0;save();need()}});
$('reset').onclick=()=>{try{localStorage.removeItem(KEY)}catch(e){}S=Object.assign({},def);lim.value=S.limit;limShow();speed.value=S.speed;showSpeed();setLoc(S.lat,S.lon,S.city);['tLines','tCons','tNames','tReal'].forEach(i=>$(i).checked=true);toast('保存した設定を消去しました')};
let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)}

/* ---------- 空にかざす ---------- */
let hd=null;
function onOri(e){let h=e.webkitCompassHeading;if(h==null&&e.alpha!=null)h=(360-e.alpha)%360;if(h==null||e.beta==null)return;
 hd=hd==null?h:hd+((((h-hd)%360)+540)%360-180)*0.25;S.az=((hd+S.arOff)%360+360)%360;S.alt=clamp(e.beta-90,-30,90)}
$('ar').onclick=async e=>{
 if(ar){ar=false;removeEventListener('deviceorientation',onOri);e.target.textContent='空にかざす(向きに連動)';e.target.setAttribute('aria-pressed',false);need();return}
 try{if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){if(await DeviceOrientationEvent.requestPermission()!=='granted')return toast('「モーションと方向」が許可されませんでした')}}catch(x){return toast('向きセンサーを使えませんでした')}
 if(!('DeviceOrientationEvent' in window))return toast('この端末は向きセンサーに対応していません');
 ar=true;hd=null;S.fov=70;addEventListener('deviceorientation',onOri);e.target.textContent='かざす表示を終了';e.target.setAttribute('aria-pressed',true);
 toast('スマホを空に向けてください。方位がずれる時は画面を左右にドラッグして補正できます');requestAnimationFrame(frame)};

/* ---------- 起動 ---------- */
setLoc(S.lat,S.lon,S.city);syncTime();addEventListener('resize',need);
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
need();
})();
