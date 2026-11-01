(()=>{
// ── Parametri di sensibilità: qui si regola il "feeling" ──
const CFG={tilt:.14,        // inclinazione massima col mouse (rad)
  tiltSmooth:8,             // più alto = segue prima il cursore
  drag:.006,                // rad per pixel trascinato
  decel:.998,               // proiezione dello slancio (come lo scroll iOS)
  resp:.45,damp:.85,        // molla di assestamento: response (s) e damping ratio
  zoom:.78,zoomSmooth:6,    // quanto si avvicina sugli hotspot e con che rapidità
  scroll:.5,                // rotazione legata allo scroll (rad)
  dpr:2};                   // tetto del pixel ratio
const $=s=>document.querySelector(s),stage=$('#stage'),cv=$('#c3d'),hint=$('#hint'),cap=$('#cap'),hs=[...stage.querySelectorAll('.hs')];
const RM=matchMedia('(prefers-reduced-motion: reduce)'),W=1480,H=930,Z=Math.PI;
const INFO=[['Design su misura','Ogni pagina è disegnata sul tuo marchio: tipografia, spazi e colori coerenti, senza template riciclati.'],['Pensato per farti contattare','Ogni pagina ha un obiettivo chiaro: portare il cliente a scriverti, senza distrazioni.'],['Tutto in un unico posto','Sito, bot e automazioni lavorano insieme: meno lavoro manuale per te.']];
const HP=[[740,340],[372,560],[900,730]];
function drawScreen(){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  const F='-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif';
  rr(0,0,W,H,70);g.clip();
  const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#18181b');bg.addColorStop(1,'#0a0a0c');g.fillStyle=bg;g.fillRect(0,0,W,H);
  g.fillStyle='#3a3a3f';[70,106,142].forEach(x=>{g.beginPath();g.arc(x,70,10,0,7);g.fill()});
  g.font='500 28px '+F;g.fillStyle='#8e8e93';g.textAlign='right';g.fillText('Servizi      Chi siamo      Contatti',W-110,80);
  g.textAlign='left';g.fillStyle='#f5f5f7';g.font='600 96px '+F;try{g.letterSpacing='-3px'}catch(e){}
  g.fillText('Siti web che',110,300);g.fillText('portano clienti.',110,410);
  try{g.letterSpacing='0px'}catch(e){}
  g.font='400 34px '+F;g.fillStyle='#a1a1a6';g.fillText('Bot, automazioni e strumenti su misura.',110,480);
  rr(110,520,260,80,40);g.fillStyle='#0a84ff';g.fill();g.fillStyle='#fff';g.font='500 32px '+F;g.textAlign='center';g.fillStyle='#fff';g.fillText('Preventivo',240,572);g.textAlign='left';
  ['Siti ed e-commerce','Bot Telegram','Automazioni'].forEach((t,i)=>{const x=110+i*430;rr(x,690,400,170,36);g.fillStyle='#1c1c1e';g.fill();g.fillStyle='#f5f5f7';g.font='600 34px '+F;g.fillText(t,x+36,780);rr(x+36,806,150,14,7);g.fillStyle='#2c2c2e';g.fill()});
  return c}
function fallback(){cv.remove();hs.forEach(b=>b.remove());hint.remove();const c=drawScreen();c.className='fb';c.setAttribute('role','img');c.setAttribute('aria-label','Anteprima di un sito C & O');stage.prepend(c)}
if(typeof THREE==='undefined'){fallback();return}
let ren;try{ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){fallback();return}
const low=(navigator.hardwareConcurrency||8)<=2||(navigator.deviceMemory||8)<=2;
ren.setPixelRatio(low?1:Math.min(devicePixelRatio,CFG.dpr));ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;

// ── Scena: studio lighting con softbox (environment map procedurale) ──
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,60);
{const pm=new THREE.PMREMGenerator(ren),es=new THREE.Scene();es.background=new THREE.Color(0x8d8d92);
 const sb=(w,h,d,x,y,z,i,col=0xffffff)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(i)}));m.position.set(x,y,z);es.add(m)};
 sb(10,.5,10,0,6,0,5);sb(.5,6,6,-6,1,3,3.2);sb(.5,6,6,6,1,3,2.2,0xfff1e0);sb(8,4,.5,0,1,-7,1.4);
 scene.environment=pm.fromScene(es,.04).texture;pm.dispose()}

const rshape=(w,h,r)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Z/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,Z/2);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,Z/2,Z);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Z,1.5*Z);return s};
const slab=(w,h,r,d,b)=>{const g=new THREE.ExtrudeGeometry(rshape(w,h,r),{depth:d,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:6,curveSegments:32});g.center();return g};
const rig=new THREE.Group(),grp=new THREE.Group();rig.add(grp);scene.add(rig);

// Display in alluminio con schermo
const alu=new THREE.MeshStandardMaterial({color:0xd9dadf,metalness:1,roughness:.34});
const body=new THREE.Mesh(slab(3.2,2.1,.2,.1,.035),alu);grp.add(body);
body.geometry.computeBoundingBox();const zf=body.geometry.boundingBox.max.z;
const tex=new THREE.CanvasTexture(drawScreen());tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.96,1.86),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false}));scr.position.z=zf+.002;grp.add(scr);
{const bc=document.createElement('canvas');bc.width=512;bc.height=256;const b=bc.getContext('2d');b.font='600 120px -apple-system,"SF Pro Display",system-ui,sans-serif';b.textAlign='center';b.textBaseline='middle';b.fillStyle='rgba(70,70,76,.6)';b.fillText('C & O',256,128);
 const t=new THREE.CanvasTexture(bc);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.6),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));m.rotation.y=Z;m.position.z=-zf-.002;grp.add(m)}

// Vetro smerigliato = il bot (rifrange e sfoca ciò che ha dietro)
const glassMat=low?new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.35,roughness:.3}):new THREE.MeshPhysicalMaterial({color:0xffffff,transmission:1,roughness:.32,thickness:.7,ior:1.45,clearcoat:1,clearcoatRoughness:.2,attenuationColor:new THREE.Color(0xdfe9ff),attenuationDistance:2});
const bub=new THREE.Mesh(slab(1.15,.74,.3,.2,.06),glassMat);bub.position.set(1.45,-.6,.75);bub.rotation.set(.1,-.25,0);grp.add(bub);
const dm=new THREE.MeshStandardMaterial({color:0x1d1d1f,roughness:.5});
[-.25,0,.25].forEach(x=>{const d=new THREE.Mesh(new THREE.SphereGeometry(.07,32,32),dm);d.position.x=x;bub.add(d)});
// Anello = automazione; sfera in ceramica = accento di colore
const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,32,128),alu);ring.position.set(-1.5,1.05,.5);grp.add(ring);
const cer=new THREE.Mesh(new THREE.SphereGeometry(.15,64,64),new THREE.MeshPhysicalMaterial({color:0x0a84ff,roughness:.22,clearcoat:1,clearcoatRoughness:.15}));cer.position.set(1.55,1,.3);grp.add(cer);
// Ombra di contatto diffusa
{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.35}));m.rotation.x=-Z/2;m.position.y=-1.75;scene.add(m)}
const hp=HP.map(([x,y])=>new THREE.Vector3((x/W-.5)*2.96,(.5-y/H)*1.86,zf+.01));

// ── Stato, loop on-demand, render ──
const s={tx:0,ty:0,zoom:0,fx:0,fy:0,yaw:0},t={tx:0,ty:0,zoom:0,fx:0,fy:0};
let z0=8.6,active=-1,vis=false,raf=0,last=0,w=0,h=0;
function size(){w=stage.clientWidth;h=stage.clientHeight;if(!w||!h)return;ren.setSize(w,h,false);cam.aspect=w/h;z0=8.6/Math.min(1,cam.aspect);cam.updateProjectionMatrix();need()}
function render(now){
  const r=stage.getBoundingClientRect(),p=RM.matches?.5:Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height))),f=RM.matches?0:Math.sin(now/1400);
  rig.position.y=f*.06+(.5-p)*.5;rig.rotation.x=s.ty+(p-.5)*.3;rig.rotation.y=s.tx+(p-.5)*CFG.scroll;grp.rotation.y=s.yaw;
  if(!RM.matches){ring.rotation.set(now/2200,.5,0);bub.position.y=-.6+Math.sin(now/1100+1)*.04}
  const k=s.zoom;cam.position.set(s.fx*.55*k,.5*(1-k)+s.fy*.55*k,z0+(4.6-z0)*k);cam.lookAt(s.fx*k,s.fy*k,0);
  scene.updateMatrixWorld();cam.updateMatrixWorld();
  const front=Math.cos(s.yaw)>.85;
  hs.forEach((b,i)=>{const v=hp[i].clone();grp.localToWorld(v);v.project(cam);b.style.transform=`translate(${(v.x*.5+.5)*w}px,${(-v.y*.5+.5)*h}px)`;b.classList.toggle('v',front&&(active<0||active===i))});
  ren.render(scene,cam)}
function frame(now){raf=0;if(!vis||document.hidden)return;const dt=Math.min((now-last)/1000,.05)||.016,e=k=>1-Math.exp(-k*dt);last=now;
  s.tx+=(t.tx-s.tx)*e(CFG.tiltSmooth);s.ty+=(t.ty-s.ty)*e(CFG.tiltSmooth);
  s.zoom+=(t.zoom-s.zoom)*e(CFG.zoomSmooth);s.fx+=(t.fx-s.fx)*e(CFG.zoomSmooth);s.fy+=(t.fy-s.fy)*e(CFG.zoomSmooth);
  render(now);raf=requestAnimationFrame(frame)}
function need(){if(!w||!h)return;if(RM.matches){Object.assign(s,{tx:t.tx,ty:t.ty,zoom:t.zoom,fx:t.fx,fy:t.fy});render(performance.now())}else if(vis&&!raf){last=performance.now();raf=requestAnimationFrame(frame)}}
new ResizeObserver(size).observe(stage);
new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis)need()},{rootMargin:'100px'}).observe(stage);
document.addEventListener('visibilitychange',need);

// ── Interazione: molla con handoff di velocità + proiezione dello slancio ──
function spring(from,to,vel,resp,damp,tick){
  if(RM.matches){tick(to);return{stop(){}}}
  const wn=2*Math.PI/resp,k=wn*wn,c=2*damp*wn;let x=from,v=vel,l=performance.now(),id,dead=false;
  (function f(n){if(dead)return;const dt=Math.min((n-l)/1000,.032);l=n;const m=Math.ceil(dt/.004)||1,hh=dt/m;for(let i=0;i<m;i++){v+=(-k*(x-to)-c*v)*hh;x+=v*hh}tick(x);if(Math.abs(x-to)<.001&&Math.abs(v)<.01){tick(to);return}id=requestAnimationFrame(f)})(l);
  return{stop(){dead=true;cancelAnimationFrame(id)}}}
const project=(v,d=CFG.decel)=>(v/1000)*d/(1-d);
let down=false,drag=false,sx,y0,hist=[],ysp;
stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;down=true;drag=false;sx=e.clientX;y0=s.yaw;hist=[{p:e.clientX,t:e.timeStamp}];ysp&&ysp.stop()});
stage.addEventListener('pointermove',e=>{
  if(!down){if(e.pointerType==='mouse'&&!RM.matches&&active<0&&!e.target.closest('.hs')){const r=stage.getBoundingClientRect();t.tx=((e.clientX-r.left)/r.width-.5)*2*CFG.tilt;t.ty=((e.clientY-r.top)/r.height-.5)*2*CFG.tilt*.6;need()}return}
  const dx=e.clientX-sx;
  if(!drag){if(Math.abs(dx)<10)return;drag=true;stage.setPointerCapture(e.pointerId);stage.classList.add('drag');close();hint.classList.add('off')}
  hist.push({p:e.clientX,t:e.timeStamp});if(hist.length>5)hist.shift();
  s.yaw=y0+dx*CFG.drag;need()});
const end=()=>{if(!down)return;down=false;stage.classList.remove('drag');if(!drag)return;
  const a=hist[0],b=hist[hist.length-1],v=b.t>a.t?(b.p-a.p)/((b.t-a.t)/1000)*CFG.drag:0;
  const to=Math.round((s.yaw+project(v))/Z)*Z; // si ferma su fronte o retro, partendo dalla velocità del dito
  ysp=spring(s.yaw,to,v,CFG.resp,CFG.damp,x=>{s.yaw=x;need()})};
stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
stage.addEventListener('pointerleave',()=>{t.tx=t.ty=0;need()});

// ── Hotspot: zoom sul dettaglio, richiudibile in qualsiasi momento ──
function open(i){active=i;cap.querySelector('b').textContent=INFO[i][0];cap.querySelector('span').textContent=INFO[i][1];cap.classList.add('on');hint.classList.add('off');
  hs.forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-expanded',j===i)});
  t.tx=t.ty=0;t.zoom=CFG.zoom;t.fx=hp[i].x;t.fy=hp[i].y;need()}
function close(){if(active<0)return;active=-1;t.zoom=0;cap.classList.remove('on');hint.classList.remove('off');hs.forEach(b=>{b.classList.remove('on');b.setAttribute('aria-expanded','false')});need()}
// Gli hotspot si spostano a ogni frame (il modello si inclina col mouse): il click nativo
// può cadere sul canvas invece che sul bottone. Si attiva quindi su pointerup, con capture,
// e si ignora il click generato dal mouse (detail>0) così tastiera e tap restano corretti.
const toggle=i=>active===i?close():open(i);
hs.forEach((b,i)=>{
  let px=0,py=0,moved=false;
  b.addEventListener('pointerdown',e=>{e.stopPropagation();px=e.clientX;py=e.clientY;moved=false;
    try{b.setPointerCapture(e.pointerId)}catch(_){}});
  b.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-px,e.clientY-py)>10)moved=true});
  b.addEventListener('pointercancel',()=>{moved=true});
  b.addEventListener('pointerup',e=>{e.stopPropagation();if(!moved)toggle(i)});
  b.onclick=e=>{if(e.detail)return;toggle(i)}; // solo tastiera (Invio/Spazio)
});
$('#capx').onclick=close;addEventListener('keydown',e=>{if(e.key==='Escape')close()});
})();