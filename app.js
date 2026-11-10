(()=>{
'use strict';
const D=Math.PI/180,$=id=>document.getElementById(id),cv=$('sky'),ctx=cv.getContext('2d');
const KEY='hoshizora.v1',clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const AR_FOV=55,VER=4;/* 星との距離を近く: 通常の視野を110→80°、ジャイロ時を70→55°に */
const def={lat:35.86,lon:139.65,city:'埼玉県（さいたま）',limit:6.3,lines:1,cons:1,names:0,real:1,az:180,alt:55,fov:80,arOff:0,speed:34,auto:1,gyro:1,art:'sel',hint:0,intro:1,ver:VER};
const PREFECTURES=['北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'];
CITIES.forEach((city,index)=>city[0]=`${PREFECTURES[index]}（${city[0]}）`);
let S=Object.assign({},def),stored={};try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{};Object.assign(S,stored)}catch(e){stored={}}
/* 以前の版で保存された設定には、新しい初期値(星の名前オフ・近い視野・ジャイロオン)を一度だけ適用する */
if((stored.ver||1)<2){S.names=def.names;S.fov=def.fov;S.gyro=def.gyro}
if((stored.ver||1)<3)S.limit=def.limit;
if((stored.ver||1)<4)S.art=def.art;/* 星座絵は「タップした星座だけ」を初期設定にする(一度だけ) */
S.ver=VER;
if(!CITIES.some(city=>city[0]===S.city)){const old=CITIES.find(city=>city[0].endsWith(`（${S.city}）`));S.city=old?old[0]:def.city}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const fb=new Map();let posKey='',posT=0,T=Date.now(),baseT=T,playing=false,last=0,ar=false,W=0,H=0,V={},hits=[],sel=null,selCon=null,artSel=null,conHits=[],dirty=false,starting=false,vis=[];

/* ---------- 星表 ---------- */
const stars=STAR_DATA.map(r=>({k:r[0],ra:r[1]*15,dec:r[2],mag:r[3],bv:r[4],con:r[5],r0:3.0*Math.pow(10,-0.11*r[3])}));
const FAMOUS=new Set(['Sirius','Canopus','Arcturus','Rigil Kent','Vega','Capella','Rigel','Procyon','Betelgeuse','Achernar','Altair','Aldebaran','Antares','Spica','Pollux','Fomalhaut','Deneb','Regulus','Castor','Polaris','Acrux','Dubhe','Algol','Alnilam','Bellatrix','Denebola','Mizar','Shaula']);
const byKey={};stars.forEach(s=>byKey[s.k]=s);
const conStars={};for(const c in CONS){const set=new Set();CONS[c][1].forEach(p=>p.forEach(k=>set.add(k)));conStars[c]=[...set].map(k=>byKey[k]).filter(Boolean)}
for(const c in CONS)CONS[c][1].forEach(p=>p.forEach(k=>{if(byKey[k])byKey[k].ln=1}));
(window.STAR_EXTRA||[]).forEach(r=>stars.push({k:null,ra:r[0]*15,dec:r[1],mag:r[2],bv:r[3],con:'',r0:3.0*Math.pow(10,-0.11*r[2])}));

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
function draw(){dirty=false;const dpr=Math.min(window.devicePixelRatio||1,2)*qs;/* 3倍画面でも2倍までで描く(描く面積が約半分になり、フリーズしにくい) */
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
 /* 星の位置は、時刻・場所・見える暗さが変わらない限り同じ。ジャイロや指の操作(向きだけが変わる)では、毎回は計算し直さない */
 const pk=S.lat+'|'+S.lon+'|'+Math.round(eff*4);
 if(pk!==posKey||Math.abs(T-posT)>2000){posKey=pk;posT=T;
  for(const s of stars){if(s.mag>eff+0.5&&s.k===null){s.v=0;continue}const q=yrs?precess(s,yrs):[s.ra,s.dec],h=eq2hor(q[0],q[1],L,S.lat);s.az=h[0];s.alt=h[1];s.v=h[1]>-0.02;const ca=Math.cos(h[1]);s.vx=ca*Math.sin(h[0]);s.vy=ca*Math.cos(h[0]);s.vz=Math.sin(h[1])}
  vis=stars.filter(s=>s.v&&s.mag<=eff+(s.ln?1:0)+0.13)/* 見える星だけの一覧(毎回8,800個を調べない) */}
 drawArt(1-tw);
 // 星座線
 if(S.lines){ctx.strokeStyle=`rgba(${mix([110,150,205],[255,255,255],dy)},${0.5+0.1*dy})`;ctx.lineWidth=1;ctx.beginPath();
  for(const c in CONS)for(const [a,b] of CONS[c][1]){const A=byKey[a],B=byKey[b];if(!A||!B||!A.v||!B.v)continue;const p=proj(A.az,A.alt),q=proj(B.az,B.alt);if(p&&q){ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1])}}ctx.stroke()}
 // 選択中の星座の線
 if(selCon&&CONS[selCon]){ctx.strokeStyle='rgba(232,180,90,.95)';ctx.lineWidth=2.2;ctx.beginPath();
  for(const [a,b] of CONS[selCon][1]){const A=byKey[a],B=byKey[b];if(!A||!B||!A.v||!B.v)continue;const p=proj(A.az,A.alt),q=proj(B.az,B.alt);if(p&&q){ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1])}}ctx.stroke();ctx.lineWidth=1}
 // 星
 const nm=2.4+(110/S.fov-1)*0.9,cosMax=Math.cos(Math.min(3,2*Math.atan((Math.hypot(W,H)/2+30)/(2*V.s)))),vc=V.c;
 for(const s of vis){if(s.mag>eff+(s.ln?1:0))continue;if(s.vx*vc[0]+s.vy*vc[1]+s.vz*vc[2]<cosMax)continue;/* 視野の外の星は、投影の計算もしない */const p=proj(s.az,s.alt);if(!p||p[0]<-20||p[0]>W+20||p[1]<-20||p[1]>H+20)continue;
  const r=Math.max(0.7,s.r0*V.z),al=clamp((eff-s.mag)/1.2+0.25,0.25,1)*(s.mag>eff-1.5?0.85:1);
  if(s.mag>=3&&r<1.5){/* 暗い星は、色と明るさが近いものをまとめて、四角でいっぺんに描く(1つずつ描くより軽い) */
   const q=(Math.round(clamp(s.bv,-0.4,2)*5)+2)*1000+Math.round(s.mag)*10+Math.round(al*8);let a=fb.get(q);if(!a)fb.set(q,a=[]);a.push(p[0]-r,p[1]-r,2*r);
   if(s.k)hits.push({x:p[0],y:p[1],s});continue}
  if(s.cr!==S.real){s.cc=starColor(s);s.cs=s.cc.join(',');s.cr=S.real}
  ctx.fillStyle=`rgba(${s.cs},${al.toFixed(2)})`;
  if(s.mag<2){ctx.shadowColor=`rgba(${s.cs},.9)`;ctx.shadowBlur=r*3}ctx.beginPath();ctx.arc(p[0],p[1],r,0,6.283);ctx.fill();ctx.shadowBlur=0;
  if(s.k)hits.push({x:p[0],y:p[1],s});}
 for(const [q,a] of fb){if(!a.length)continue;const bvq=(Math.floor(q/1000)-2)/5,mg=Math.floor(q%1000/10),al=(q%10)/8;ctx.fillStyle=`rgba(${starColor({bv:bvq,mag:mg}).join(',')},${al.toFixed(2)})`;ctx.beginPath();for(let i=0;i<a.length;i+=3)ctx.rect(a[i],a[i+1],a[i+2],a[i+2]);ctx.fill();a.length=0}
 // 星の名前(有名な星のみ。選択中は昼でも常に表示)
 if(S.names){ctx.font='12px sans-serif';ctx.textAlign='left';ctx.textBaseline='middle';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.lineJoin='round';/* 文字の縁取り(ぼかしの影より軽い) */
  for(const s of stars){if(!s.k||!s.v||s.mag>S.limit||!(FAMOUS.has(s.k)||(S.fov<70&&JA[s.k])))continue;const p=proj(s.az,s.alt);if(!p||p[0]<-20||p[0]>W+20||p[1]<-20||p[1]>H+20)continue;
   const r=Math.max(0.7,3.0*Math.pow(10,-0.11*s.mag)*V.z);
   if(s.mag>eff){ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(p[0],p[1],1.6,0,6.283);ctx.fill();hits.push({x:p[0],y:p[1],s})}
   ctx.fillStyle='rgba(240,236,224,.95)';const tx=(JA[s.k]||s.k).replace(/\(.*\)/,'');ctx.strokeText(tx,p[0]+r+5,p[1]-r-2);ctx.fillText(tx,p[0]+r+5,p[1]-r-2)}
  ctx.shadowBlur=0;ctx.textBaseline='alphabetic'}
 // 星座名
 conHits.length=0;if(S.cons||selCon){ctx.font='13px sans-serif';ctx.textAlign='center';ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.fillStyle=`rgb(${mix([232,180,90],[255,240,190],dy)})`;
  for(const c in CONS){const L2=conStars[c];if(!L2.length||(!S.cons&&c!==selCon))continue;let x=0,y=0,z=0,m=0;for(const s of L2)if(s.v){x+=Math.cos(s.alt)*Math.sin(s.az);y+=Math.cos(s.alt)*Math.cos(s.az);z+=Math.sin(s.alt);m++}
   if(m<L2.length*0.6)continue;const az=(Math.atan2(x,y)+2*Math.PI)%(2*Math.PI),al=Math.atan2(z,Math.hypot(x,y)),p=proj(az,al);if(p){const nm=CONS[c][0]+(ARTS[c]?' ✦':'');ctx.strokeText(nm,p[0],p[1]+16);ctx.fillText(nm,p[0],p[1]+16);conHits.push({c,x:p[0],y:p[1]+16,w:ctx.measureText(nm).width})}}ctx.shadowBlur=0}
 // 太陽・月
 if(sh[1]>-0.05){const p=proj(sh[0],sh[1]);if(p){ctx.shadowColor='#ffd27a';ctx.shadowBlur=30;ctx.fillStyle='#ffe9a8';ctx.beginPath();ctx.arc(p[0],p[1],9*V.z,0,6.283);ctx.fill();ctx.shadowBlur=0}}
 if(mh[1]>-0.05){const p=proj(mh[0],mh[1]);if(p)moon(p[0],p[1],8*V.z,mp.el)}
 // 選択リング
 if(sel&&sel.v){const p=proj(sel.az,sel.alt);if(p){ctx.strokeStyle='#e8b45a';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p[0],p[1],14,0,6.283);ctx.stroke()}}
}
function moon(x,y,R,el){const k=Math.cos(el),wax=Math.sin(el)>0;ctx.fillStyle='#262b3a';ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
 ctx.fillStyle='#f4f0dc';ctx.beginPath();ctx.arc(x,y,R,-Math.PI/2,Math.PI/2,!wax);
 ctx.ellipse(x,y,Math.max(0.01,R*Math.abs(k)),R,0,Math.PI/2,-Math.PI/2,wax?k>0:k<0);ctx.fill()}
/* ---------- 星座絵(絵の中の目印を、実際の星の位置に合わせて重ねる) ---------- */
const ARTS=window.ART||{},artImg={},artA={};let artNk=1;
function getArt(c){let o=artImg[c];if(!o){o=artImg[c]=new Image();o.onload=need;o.src=ARTS[c].src}return o.complete&&o.naturalWidth?o:null}
function artFit(c){const o=ARTS[c],P=[],Q=[],Wt=[],fl=o.flip?-1:1;let vis=0;
 for(const [k,u,v,w] of o.a){const s=byKey[k];if(!s)continue;const p=proj(s.az,s.alt);if(!p)continue;if(s.v)vis++;P.push([u,fl*v]);Q.push(p);Wt.push(w||1)}
 const need2=Math.min(3,o.a.length);if(P.length<need2||vis<Math.max(need2,Math.ceil(o.a.length*0.6)))return null;/* 目印が2つだけの星座(こいぬ座)も使えるようにした */
 let sw=0,mp=[0,0],mq=[0,0];P.forEach((p,i)=>{sw+=Wt[i];mp[0]+=Wt[i]*p[0];mp[1]+=Wt[i]*p[1];mq[0]+=Wt[i]*Q[i][0];mq[1]+=Wt[i]*Q[i][1]});
 mp=mp.map(x=>x/sw);mq=mq.map(x=>x/sw);let nr=0,ni=0,dn=0;
 P.forEach((p,i)=>{const px=p[0]-mp[0],py=p[1]-mp[1],qx=Q[i][0]-mq[0],qy=Q[i][1]-mq[1];nr+=Wt[i]*(px*qx+py*qy);ni+=Wt[i]*(px*qy-py*qx);dn+=Wt[i]*(px*px+py*py)});
 const ar=nr/dn,ai=ni/dn,sc=Math.hypot(ar,ai);if(!(sc>20&&sc<8000))return null;
 return [ar,ai,-fl*ai,fl*ar,mq[0]-ar*mp[0]+ai*mp[1],mq[1]-ai*mp[0]-ar*mp[1]]}
const lay=document.createElement('canvas'),lctx=lay.getContext('2d');
function drawArt(nk){artNk=nk;const cs=[artSel,sel&&sel.con],mode=S.art,jobs=[];let busy=false;
 for(const c in ARTS){const t=mode==='off'?0:cs.includes(c)?1:mode==='all'?0.5:0;let cur=artA[c]||0;
  if(Math.abs(t-cur)>0.01){cur+=(t-cur)*0.2;busy=true}else cur=t;artA[c]=cur;
  if(cur<0.02||nk<0.02)continue;const m=artFit(c);if(!m)continue;
  {const xs=[m[4],m[0]+m[4],m[2]+m[4],m[0]+m[2]+m[4]],ys=[m[5],m[1]+m[5],m[3]+m[5],m[1]+m[3]+m[5]];if(Math.max(...xs)<0||Math.min(...xs)>W||Math.max(...ys)<0||Math.min(...ys)>H)continue}/* 画面の外にある絵は描かない */
  const img=getArt(c);if(!img)continue;/* 画像は、実際に描くときに初めて読み込む(全36枚を一度にメモリへ載せない) */
  jobs.push([m,img,Math.min(1,0.75*cur*nk)])}
 if(jobs.length===1){const [m,img,al]=jobs[0];ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=al;ctx.transform(m[0],m[1],m[2],m[3],m[4],m[5]);ctx.drawImage(img,0,0,1,1);ctx.restore()}
 else if(jobs.length>1){/* 2枚以上のときは、半分の解像度の別の面にまとめて描いてから、1回だけ重ねる(絵はやわらかいので見た目はほぼ同じで、描く面積は約1/4) */
  const k=ctx.getTransform().a*0.5,lw=Math.max(1,Math.round(W*k)),lh=Math.max(1,Math.round(H*k));
  if(lay.width!==lw||lay.height!==lh){lay.width=lw;lay.height=lh}
  lctx.setTransform(1,0,0,1,0,0);lctx.globalCompositeOperation='source-over';lctx.globalAlpha=1;lctx.clearRect(0,0,lay.width,lay.height);/* 拡大した状態のまま消すと一部しか消えず、前のコマの絵が重なって真っ白になる(v27の不具合)。必ず等倍に戻してから全面を消す */
  lctx.setTransform(k,0,0,k,0,0);lctx.globalCompositeOperation='lighter';
  for(const [m,img,al] of jobs){lctx.save();lctx.globalAlpha=al;lctx.transform(m[0],m[1],m[2],m[3],m[4],m[5]);lctx.drawImage(img,0,0,1,1);lctx.restore()}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1;ctx.drawImage(lay,0,0,cv.width,cv.height);ctx.restore()}
 if(busy)need()}
let force=true,lastSig='',qs=1,ema=30,prevD=0;
function need(){force=true;if(!dirty){dirty=true;requestAnimationFrame(frame)}}
let lastD=0;
function frame(now){if((ar||playing)&&now-lastD<28){requestAnimationFrame(frame);return}/* ジャイロ・再生中は約30回/秒まで(負荷を半分に) */lastD=now;
 const sig=S.az.toFixed(2)+'|'+S.alt.toFixed(2)+'|'+S.fov.toFixed(1);
 if(ar&&!playing&&!force&&sig===lastSig){requestAnimationFrame(frame);return}/* 向きが変わっていなければ描き直さない(スマホを持って静止しているとき) */
 if(sig!==lastSig&&prevD&&now-prevD<200){ema=ema*0.9+(now-prevD)*0.1;if(ema>45&&qs>0.6){qs=Math.max(0.6,qs*0.8);ema=30}}/* 動かしている間のコマ間隔が長い=重い端末。解像度を段階的に下げる */
 prevD=now;lastSig=sig;force=false;
 if(playing){const dt=Math.min(now-(last||now),100);last=now;T+=dt*speedSeconds();syncTime();dirty=true}
 draw();if(playing||ar){requestAnimationFrame(frame);dirty=true}}

/* ---------- 情報カード ---------- */
const GJ={Alpha:'α',Beta:'β',Gamma:'γ',Delta:'δ',Epsilon:'ε',Zeta:'ζ',Eta:'η',Theta:'θ',Iota:'ι',Kappa:'κ',Lambda:'λ',Mu:'μ',Nu:'ν',Xi:'ξ',Omicron:'ο',Pi:'π',Rho:'ρ',Sigma:'σ',Tau:'τ',Upsilon:'υ',Phi:'φ',Chi:'χ',Psi:'ψ',Omega:'ω'};
function starLabel(k){if(JA[k])return JA[k];let m=k.match(/^([A-Z][a-z]+)(\d?) (\w+)$/);
 if(m&&GJ[m[1]]&&CONS[m[3]])return CONS[m[3]][0]+GJ[m[1]]+m[2]+'星';
 if((m=k.match(/^(\d+) (\w+)$/))&&CONS[m[2]])return CONS[m[2]][0]+m[1]+'番星';
 if((m=k.match(/^([a-z]\d?) (\w+)$/))&&CONS[m[2]])return CONS[m[2]][0]+m[1]+'星';
 if((m=k.match(/^HIP(\d+)$/)))return 'HIP '+m[1];return k}
function showCard(s){sel=s;const i=INFO[s.k],card=$('card');$('cName').textContent=starLabel(s.k);
 $('cSub').textContent=(CONS[s.con]?CONS[s.con][0]:'')+(JA[s.k]?' / '+s.k:'');
 const tempC=tempK(s.bv)-273;
 const rows=[['見かけの明るさ',s.mag.toFixed(2)+'等'],['距離',i&&i[1]!=null?'約'+i[1]+'光年':'データなし'],['スペクトル型',i&&i[0]?i[0]:'データなし'],['表面温度（推定）','約'+tempC.toLocaleString()+' °C'],['推定年齢',i&&i[2]?i[2]:'推定データなし']];
 $('cList').replaceChildren(...rows.flatMap(([a,b])=>{const t=document.createElement('dt'),d=document.createElement('dd');t.textContent=a;d.textContent=b;return[t,d]}));
 $('cNote').textContent=i?i[3]:'';card.hidden=false;need()}
$('cardClose').onclick=()=>{$('card').hidden=true;sel=null;need()};

/* ---------- 操作 ---------- */
const ptrs=new Map();let down=null,pinch=0;
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,t:performance.now(),moved:false};if(ptrs.size===2)pinch=pd()});
const pd=()=>{const [a,b]=[...ptrs.values()];return Math.hypot(a[0]-b[0],a[1]-b[1])};
cv.addEventListener('pointermove',e=>{const o=ptrs.get(e.pointerId);if(!o)return;const dx=e.clientX-o[0],dy=e.clientY-o[1];ptrs.set(e.pointerId,[e.clientX,e.clientY]);
 if(ptrs.size===2){const d=pd();if(pinch)S.fov=clamp(S.fov*pinch/d,20,160);pinch=d;down&&(down.moved=true)}
 else{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>(e.pointerType==='touch'?12:6))down.moved=true;/* 指は少し動くので、タップと見なす範囲を広げる */const sc=S.fov/Math.min(W,H)*0.9;
  if(ar){S.arOff-=dx*sc}else{S.az=((S.az-dx*sc)%360+360)%360;S.alt=clamp(S.alt+dy*sc,-10,90)}}need()});
const up=e=>{ptrs.delete(e.pointerId);pinch=0;if(down&&!down.moved&&ptrs.size===0&&performance.now()-down.t<700)pick(e.clientX,e.clientY);if(!ptrs.size){down=null;save()}};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();S.fov=clamp(S.fov*Math.exp(e.deltaY*0.001),20,160);need()},{passive:false});
function pick(x,y){const lt=conLabelAt(x,y,1),lc=lt||conLabelAt(x,y);/* 星座名の近くでは、星の判定を狭くして星座名を優先する(指で押す位置はずれやすい) */let b=null,bd=lc?12:22;for(const h of hits){const d=Math.hypot(h.x-x,h.y-y);if(d<bd||(d<bd+4&&b&&h.s.mag<b.mag-1)){bd=d;b=h.s}}
 if(lt)tapCon(lt);else if(b)showCard(b);else if(lc)tapCon(lc);else if($('card').hidden===false){$('card').hidden=true;sel=null;need()}else setImmersive(!isImm())}
/* 星座名のタップ: 絵と神話を出す。同じ星座名をもう一度タップすると消す */
function conLabelAt(x,y,tight){let r=null,bd=1e9;for(const h of conHits){/* 押せる範囲は、文字の大きさより広く(縦およそ50px)。tight=文字のすぐ近く */if(tight?(Math.abs(x-h.x)<=h.w/2+10&&y>=h.y-18&&y<=h.y+14):(Math.abs(x-h.x)<=h.w/2+24&&y>=h.y-32&&y<=h.y+28)){const d=Math.hypot(x-h.x,y-h.y);if(d<bd){bd=d;r=h.c}}}return r}
function tapCon(c){if(artSel===c){artSel=null;if(selCon===c)hideMyth();need()}else{showMyth(c);lookAt(c,true);artNote(c)}/* 一覧から選んだときと同じく、タップでも星座をカードの上の見える範囲の中央へ動かす。ただし拡大率は変えず、向きだけを動かす(keepFov=true) */}
/* 絵が出ない理由を、タップしたときに伝える(出ない=壊れている、と誤解しないように) */
function artNote(c){if(!ARTS[c])return toast('この星座の絵は、まだありません');if(S.art==='off')return toast('星座絵が「表示しない」になっています(設定で変更できます)');
 if(artNk<0.5)return toast('星座の絵は、暗い夜にだけ出ます(いまは空が明るい時間です)');if(!artFit(c))toast('いまは、絵を合わせる星の多くが地平線の下にあるため、絵が出ません')}

/* ---------- 時刻・場所 ---------- */
const p2=n=>String(n).padStart(2,'0');
function syncTime(){const d=new Date(T);$('date').value=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;$('time').value=`${p2(d.getHours())}:${p2(d.getMinutes())}`;if(selCon)refreshMyth()}
function readTime(){const v=new Date($('date').value+'T'+($('time').value||'00:00'));if(!isNaN(v)){T=v.getTime();baseT=T;$('dayShift').value=0;need()}}
$('date').onchange=readTime;$('time').onchange=readTime;
$('now').onclick=()=>{T=Date.now();baseT=T;$('dayShift').value=0;syncTime();need()};
$('dayShift').oninput=e=>{T=baseT+(+e.target.value)*864e5;syncTime();need()};
$('play').onclick=e=>{playing=!playing;last=0;e.target.setAttribute('aria-pressed',playing);e.target.textContent=playing?'■':'▶';if(playing){baseT=T;requestAnimationFrame(frame)}};
const cs=$('city');cs.add(new Option('都道府県を選択',''));CITIES.forEach(c=>cs.add(new Option(c[0],c[0])));
function setLoc(lat,lon,city){S.lat=+(+lat).toFixed(2);S.lon=+(+lon).toFixed(2);S.city=city;cs.value=city;$('lat').value=S.lat;$('lon').value=S.lon;save();if(selCon)refreshMyth();need()}
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
/* 星座絵: 設定の選択と、上部の「星座絵」ボタン(見えている星座の絵をまとめて出す/隠す) */
function artSync(){$('artMode').value=S.art;$('artBtn').setAttribute('aria-pressed',S.art==='all')}
$('artMode').onchange=e=>{S.art=e.target.value;if(S.art==='off')artSel=null;save();artSync();need()};
$('artBtn').onclick=()=>{if(S.art==='all'){S.art='sel';artSel=null}else S.art='all';save();artSync();need();toast(S.art==='all'?'見えている星座の絵をすべて表示します(新しく見える星座にも出ます)':'絵を隠しました。星座名をタップすると、その星座の絵が出ます')};
artSync();
[['tLines','lines'],['tCons','cons'],['tNames','names'],['tReal','real'],['tAuto','auto'],['tIntro','intro']].forEach(([id,k])=>{const el=$(id);el.checked=!!S[k];el.onchange=()=>{S[k]=el.checked?1:0;save();need()}});
$('reset').onclick=()=>{try{localStorage.removeItem(KEY)}catch(e){}S=Object.assign({},def);artSel=null;artSync();lim.value=S.limit;limShow();speed.value=S.speed;showSpeed();setLoc(S.lat,S.lon,S.city);[['tLines','lines'],['tCons','cons'],['tNames','names'],['tReal','real'],['tAuto','auto'],['tIntro','intro']].forEach(([i,k])=>$(i).checked=!!S[k]);armIdle();startAR('quiet');toast('保存した設定を消去しました')};
let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)}

/* ---------- ジャイロ(スマホの向きに連動) ---------- */
let hd=null,gotOri=false,oev='ondeviceorientationabsolute' in window?'deviceorientationabsolute':'deviceorientation',oriT=0;
function onOri(e){let h=e.webkitCompassHeading;if(h==null&&e.alpha!=null)h=(360-e.alpha)%360;if(h==null||e.beta==null)return;
 hd=hd==null?h:hd+((((h-hd)%360)+540)%360-180)*0.25;gotOri=true;const na=((hd+S.arOff)%360+360)%360,nl=clamp(e.beta-90,-30,90);
 if(Math.abs(((na-S.az+540)%360)-180)>0.08||Math.abs(nl-S.alt)>0.08){S.az=na;S.alt=nl}/* センサーの細かい揺れ(0.08°未満)は無視して、止まっているときは再描画しない */}
const arBtn=$('ar'),arReset=$('arReset'),needPerm=typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function';
function arUi(on){arReset.hidden=!on;arBtn.textContent=on?'ジャイロをオフにする':'ジャイロ(向きに連動)をオンにする';arBtn.setAttribute('aria-pressed',on)}
function beginAR(mode){ar=true;hd=null;gotOri=false;S.arOff=0;S.fov=AR_FOV;addEventListener(oev,onOri);arUi(true);
 /* Androidは「絶対方位」(コンパス基準)のイベントを優先する。届かない端末では通常のイベントに切り替える */
 clearTimeout(oriT);if(oev!=='deviceorientation')oriT=setTimeout(()=>{if(ar&&!gotOri){removeEventListener(oev,onOri);oev='deviceorientation';addEventListener(oev,onOri)}},2000);
 if(mode==='button'){setImmersive(true);toast('スマホを空に向けてください。方位がずれる時は、右下の「方位リセット」を押すか、画面を左右にドラッグして補正できます。空をタップすると操作画面が戻ります')}
 else if(mode==='tap')toast('ジャイロがオンになりました。スマホを空に向けてください');
 requestAnimationFrame(frame)}
function stopAR(persist){if(!ar)return;ar=false;clearTimeout(oriT);removeEventListener(oev,onOri);arUi(false);if(persist){S.gyro=0;save()}if(persist)setImmersive(false);need()}
/* mode: 'button'(ボタン操作) / 'tap'(起動後の最初のタップ) / 'quiet'(通知なし) */
async function startAR(mode){if(ar||starting)return;starting=true;
 try{if(needPerm){try{if(await DeviceOrientationEvent.requestPermission()!=='granted'){toast('「モーションと方向」が許可されませんでした');return}}catch(x){toast('向きセンサーを使えませんでした');return}}
  if(!('DeviceOrientationEvent' in window)){toast('この端末は向きセンサーに対応していません');return}
  if(mode==='button'){S.gyro=1;save()}
  beginAR(mode)}finally{starting=false}}
arBtn.onclick=()=>{if(ar)stopAR(true);else startAR('button')};
/* 方位リセット: ドラッグで加えた補正を消して、センサーが示す向きに戻す */
arReset.onclick=()=>{if(!ar)return;S.arOff=0;hd=null;save();need();toast('方位をセンサーの向きに戻しました')};
/* 起動時の自動オン。iPhoneは許可の確認に画面の操作が必要なので、最初のタップで始める。
   Androidなどは、実際にセンサーの値が届いたときだけオンにする(PCではオンにならない) */
function autoGyro(){if(!S.gyro)return;
 /* iPhone: 許可の確認は画面の操作の中でしか出せない。起動メッセージの最中でも、最初のタップですぐ求める */
 if(needPerm){/* 案内は出さない(最初のタップで静かに許可を求める) */
  const go=()=>{document.removeEventListener('click',go,true);document.removeEventListener('touchend',go,true);if(S.gyro&&!ar)startAR('tap')};
  document.addEventListener('click',go,true);document.addEventListener('touchend',go,true);return}
 if(!('DeviceOrientationEvent' in window))return;let pt;
 const evs=['deviceorientationabsolute','deviceorientation'];
 const probe=e=>{if(e.beta!=null&&(e.alpha!=null||e.webkitCompassHeading!=null)){evs.forEach(n=>removeEventListener(n,probe));clearTimeout(pt);oev=e.type==='deviceorientationabsolute'?'deviceorientationabsolute':'deviceorientation';if(S.gyro&&!ar)beginAR('quiet')}};
 evs.forEach(n=>addEventListener(n,probe));pt=setTimeout(()=>evs.forEach(n=>removeEventListener(n,probe)),4000)}

/* ---------- 起動時のメッセージ(約3秒で自動的に消える。設定でオフにできる) ---------- */
function showIntro(done){const el=$('intro');
 if(!el)return done();if(!S.intro){el.remove();return done()}
 const lines=['カーテンを閉めたままでも、','シャッターを閉めたままでも、','いつでも星を見ることができます。'],box=el.querySelector('.txt');let i=0,ended=false,t1,t2;
 lines.forEach(t=>{const p=document.createElement('span');p.className='ln';[...t].forEach(c=>{const x=document.createElement('span');x.className='ch';x.textContent=c;x.style.setProperty('--i',i++);p.append(x)});box.append(p)});
 el.hidden=false;
 const end=()=>{if(ended)return;ended=true;clearTimeout(t1);clearTimeout(t2);el.remove();done()};
 const out=()=>{if(el.classList.contains('out'))return;clearTimeout(t1);el.classList.add('out');t2=setTimeout(end,matchMedia('(prefers-reduced-motion:reduce)').matches?400:1700)};
 t1=setTimeout(out,3000);
 el.onclick=out;
 $('introOff').onclick=e=>{e.stopPropagation();S.intro=0;$('tIntro').checked=false;save();out()}}

/* ---------- 星座の一覧・神話 ---------- */
const MYTH=window.MYTH||{},MODERN=new Set(window.MODERN||[]),conGeo={};let conFilter='all';
const DIRS=['北','北東','東','南東','南','南西','西','北西'],dirName=az=>DIRS[Math.round((((az%360)+360)%360)/45)%8];
function geo(c){if(conGeo[c])return conGeo[c];const L2=conStars[c]||[];let x=0,y=0,z=0;
 for(const s of L2){const r=s.ra*D,d=s.dec*D;x+=Math.cos(d)*Math.cos(r);y+=Math.cos(d)*Math.sin(r);z+=Math.sin(d)}
 const n=Math.hypot(x,y,z)||1;x/=n;y/=n;z/=n;let rad=0;
 for(const s of L2){const r=s.ra*D,d=s.dec*D;rad=Math.max(rad,Math.acos(clamp(x*Math.cos(d)*Math.cos(r)+y*Math.cos(d)*Math.sin(r)+z*Math.sin(d),-1,1))/D)}
 return conGeo[c]={ra:(Math.atan2(y,x)/D+360)%360,dec:Math.asin(clamp(z,-1,1))/D,rad}}
function conAt(c,t){const g=geo(c),J=jd(t),q=precess(g,(J-2451545)/365.25),h=eq2hor(q[0],q[1],lstDeg(J,S.lon),S.lat);return {az:h[0]/D,alt:h[1]/D}}
function sunAltAt(t){const J=jd(t),n=J-2451545,sp=sunPos(n);return eq2hor(sp.ra,sp.dec,lstDeg(J,S.lon),S.lat)[1]/D}
function conState(c){const a=conAt(c,T);if(a.alt<3)return {k:'below',a};return {k:sunAltAt(T)>-9?'bright':'up',a}}
function stateText(st){return st.k==='up'?`いま見えています(${dirName(st.a.az)}の空・高度${Math.round(st.a.alt)}°ごろ)`:st.k==='bright'?'いまは空が明るく、星は見えにくい時間です':'いまは地平線の下にあります'}
function findVisible(c){for(const thr of [20,8])for(let k=1;k<=366*48;k++){const t=T+k*18e5;if(sunAltAt(t)>-12)continue;let ba=conAt(c,t).alt;if(ba<thr)continue;
  let best=t;for(let j=1;j<=16;j++){const u=t+j*9e5;if(sunAltAt(u)>-12)break;const a=conAt(c,u).alt;if(a>ba){ba=a;best=u}}return best}return null}
function lookAt(c,keepFov){stopAR(false);const a=conAt(c,T);S.az=(a.az+360)%360;if(!keepFov)S.fov=clamp(geo(c).rad*2.6,45,120);setView();
 /* 神話カードがおおう範囲を除いた「見える範囲」の中央に星座がくるよう視線をずらす */
 const m=$('myth'),side=!m.hidden&&matchMedia('(orientation:landscape) and (max-height:520px)').matches;
 if(side){/* 横向き: カードが左側にあるので、星座が右側の中央にくるよう視線を左へ回す */
  const dx=m.getBoundingClientRect().right/2/V.s/D,al=Math.max(a.alt,12);S.alt=clamp(al,-10,90);S.az=((a.az-dx/Math.max(0.3,Math.cos(al*D)))%360+360)%360}
 else{/* 縦向き: カードの上端から画面上端までの中央。ずらす量はカードの高さだけでなく、カードの下の余白(54px+セーフエリア)も含めて実測する */
  const shiftPx=m.hidden?0:Math.max(0,(innerHeight-m.getBoundingClientRect().top)/2),sh=shiftPx/V.s/D;S.alt=clamp(Math.max(a.alt,12)-sh,-10,90)}
 save();need()}
function refreshMyth(){if(!selCon)return;const st=conState(selCon),t=stateText(st);if($('mState').textContent!==t)$('mState').textContent=t;$('mWhen').hidden=st.k==='up'}
/* 神話カードの開閉: 最初は折りたたみ(星座名・方角と高度の1行・ボタンだけ)。神話の文章は「神話を読む」を押したときだけ開く */
function setMythExpanded(on){const box=$('myth');box.classList.toggle('collapsed',!on);$('mMore').hidden=!on;$('mRead').setAttribute('aria-expanded',String(on));$('mRead').textContent=on?'神話を閉じる':'神話を読む'}
function showMyth(c){selCon=c;artSel=c;$('mName').textContent=CONS[c][0];$('mSub').textContent=(MODERN.has(c)?'近世にできた星座の由来':'星座にまつわる神話')+'(略号 '+c+')';
 $('mText').textContent=MYTH[c];$('mState').textContent='';refreshMyth();const box=$('myth');box.hidden=false;setMythExpanded(false);box.scrollTop=0;need()}
function hideMyth(){selCon=null;$('myth').hidden=true;need()}
function renderList(){const q=$('conQ').value.trim().toLowerCase(),ul=$('conUl');
 let items=Object.keys(CONS).filter(c=>MYTH[c]).map(c=>({c,name:CONS[c][0],st:conState(c)}));const total=items.length;
 items=items.filter(o=>(conFilter==='all'||(conFilter==='up'&&o.st.k==='up')||(conFilter==='myth'&&!MODERN.has(o.c))||(conFilter==='modern'&&MODERN.has(o.c)))&&(!q||o.name.toLowerCase().includes(q)||o.c.toLowerCase().startsWith(q)));
 items.sort((a,b)=>a.name.localeCompare(b.name,'ja'));
 const lis=items.map(o=>{const li=document.createElement('li'),b=document.createElement('button'),n=document.createElement('span'),m=document.createElement('span');
  b.type='button';b.dataset.c=o.c;n.className='cn';n.textContent=o.name;m.className='cm'+(o.st.k==='up'?' on':'');
  m.textContent=(MODERN.has(o.c)?'由来':'神話')+' ・ '+(o.st.k==='up'?'いま見える':o.st.k==='bright'?'昼は見えない':'地平線の下');
  b.append(n,m);li.append(b);return li});
 if(!lis.length){const li=document.createElement('li');li.className='empty';li.textContent='見つかりませんでした';lis.push(li)}
 ul.replaceChildren(...lis);$('conCount').textContent=`${items.length}星座を表示(全${total}星座)`}
function closeList(){$('conSheet').hidden=true}
$('conOpen').onclick=()=>{$('panel').open=false;$('card').hidden=true;sel=null;$('conQ').value='';renderList();$('conSheet').hidden=false;$('conUl').scrollTop=0;$('conSheetClose').focus()};
$('conSheetClose').onclick=()=>{closeList();$('conOpen').focus()};
$('conQ').oninput=renderList;
$('conFilters').onclick=e=>{const b=e.target.closest('button[data-f]');if(!b)return;conFilter=b.dataset.f;for(const x of $('conFilters').children)x.setAttribute('aria-pressed',x===b);renderList()};
$('conUl').onclick=e=>{const b=e.target.closest('button[data-c]');if(!b)return;const c=b.dataset.c;closeList();showMyth(c);lookAt(c);
 const st=conState(c);if(st.k!=='up')toast(st.k==='below'?'いまは地平線の下です。「見える日時にする」で時刻を合わせられます':'いまは空が明るい時間です。「見える日時にする」で夜に合わせられます')};
$('mRead').onclick=()=>{const on=$('mMore').hidden;setMythExpanded(on);if(on)$('myth').scrollTop=0;if(selCon)lookAt(selCon,true)};/* 開閉でカードの高さが変わるので、拡大率は変えずに、星座が新しい見える範囲の中央へ来るよう向きだけ合わせ直す */
$('mLook').onclick=()=>{if(selCon)lookAt(selCon)};
$('mWhen').onclick=()=>{if(!selCon)return;const t=findVisible(selCon);if(t==null)return toast('この場所では、1年を通してほとんど見えない星座です');
 T=t;baseT=t;$('dayShift').value=0;syncTime();lookAt(selCon);const d=new Date(t);toast(`${d.getMonth()+1}月${d.getDate()}日 ${p2(d.getHours())}:${p2(d.getMinutes())}ごろの空に合わせました`)};
$('mythClose').onclick=hideMyth;
addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('conSheet').hidden)closeList();else if(!$('myth').hidden)hideMyth()});

/* ---------- 没入モード(上部バー・設定パネルを隠して星空に集中) ---------- */
const IDLE_MS=10000,bodyCl=document.body.classList;let idleT=0,hintN=0;
function isImm(){return bodyCl.contains('immersive')}
function setImmersive(on,hint){
 if(on===isImm())return;
 bodyCl.toggle('immersive',on);$('uiShow').hidden=!on;
 if(on){clearTimeout(idleT);$('panel').open=false;if(hint&&hintN++<2)toast('空をタップすると操作画面が戻ります')}
 else armIdle()}
function armIdle(){clearTimeout(idleT);if(!S.auto||isImm())return;
 idleT=setTimeout(()=>{if($('panel').open||!$('conSheet').hidden||ptrs.size)armIdle();else setImmersive(true,true)},IDLE_MS)}
$('uiShow').onclick=()=>setImmersive(false);
$('tAuto').addEventListener('change',armIdle);
['pointerdown','keydown','input','change','wheel'].forEach(t=>addEventListener(t,()=>{if(t==='keydown'&&isImm())setImmersive(false);else armIdle()},true));

/* ---------- 起動 ---------- */
setLoc(S.lat,S.lon,S.city);syncTime();addEventListener('resize',need);armIdle();showIntro(()=>{setTimeout(()=>{if(!S.hint&&S.cons&&Object.keys(ARTS).length){S.hint=1;save();toast('星座名をタップすると、絵と神話が出ます(✦つきが、絵のある星座です)')}},4000)});autoGyro();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').then(()=>navigator.serviceWorker.ready).then(r=>setTimeout(()=>r.active&&r.active.postMessage('art'),6000)).catch(()=>{});/* 起動の6秒後から、星座絵をオフライン用に1枚ずつ保存する */
need();
})();
