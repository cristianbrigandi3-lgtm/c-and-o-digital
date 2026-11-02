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
const INFO=[['Schermata concept','Questa schermata è un prototipo visuale dell’identità e del percorso di un possibile sito C & O.'],['Passaggio leggibile','La demo esplora come una richiesta potrebbe diventare un’attività chiara, con una persona responsabile.'],['Strumenti da verificare','Siti, automazioni e piccoli strumenti sono direzioni in valutazione, non servizi acquistabili oggi.']];
function drawScreen(){
  const c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
  const rr=(x,y,w,h,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()};
  const F='-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",system-ui,sans-serif';
  rr(0,0,W,H,70);g.clip();
  g.fillStyle='#101719';g.fillRect(0,0,W,H);
  g.fillStyle='#3a3a3f';[70,106,142].forEach(x=>{g.beginPath();g.arc(x,70,10,0,7);g.fill()});
  g.font='500 28px '+F;g.fillStyle='#8e8e93';g.textAlign='right';g.fillText('Servizi      Chi siamo      Contatti',W-110,80);
  g.textAlign='left';g.fillStyle='#f5f5f7';g.font='600 96px '+F;try{g.letterSpacing='-3px'}catch(e){}
  g.fillText('Il digitale',110,300);g.fillText('senza attrito.',110,410);
  try{g.letterSpacing='0px'}catch(e){}
  g.font='400 34px '+F;g.fillStyle='#bdc8c4';g.fillText('Concept digitale per piccole attività.',110,480);
  rr(110,520,310,80,6);g.fillStyle='#b8d4c9';g.fill();g.fillStyle='#080d10';g.font='500 30px '+F;g.textAlign='center';g.fillText('Esplora il concept',265,572);g.textAlign='left';
  ['Siti e contenuti','Passaggi di lavoro','Strumenti digitali'].forEach((t,i)=>{const x=110+i*430;rr(x,690,400,170,10);g.fillStyle='#1b2527';g.fill();g.fillStyle='#f5f5f7';g.font='600 34px '+F;g.fillText(t,x+36,780);rr(x+36,806,150,14,7);g.fillStyle='#344447';g.fill()});
  return c}
function fallback(){cv.remove();hs.forEach(b=>b.remove());hint.remove();stage.classList.add('is-static');const c=drawScreen();c.className='fb';c.setAttribute('role','img');c.setAttribute('aria-label','Anteprima statica del concept C & O');stage.prepend(c)}
if(typeof THREE==='undefined'){fallback();return}
let ren;try{ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true,powerPreference:'high-performance'})}catch(e){fallback();return}
const low=(navigator.hardwareConcurrency||8)<=2||(navigator.deviceMemory||8)<=2;
ren.setPixelRatio(low?1:Math.min(devicePixelRatio,CFG.dpr));ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=.92;
const setSRGB=texture=>{if(THREE.SRGBColorSpace&&'colorSpace'in texture)texture.colorSpace=THREE.SRGBColorSpace;else if(THREE.sRGBEncoding)texture.encoding=THREE.sRGBEncoding;return texture};
if('outputColorSpace'in ren&&THREE.SRGBColorSpace)ren.outputColorSpace=THREE.SRGBColorSpace;else if('outputEncoding'in ren&&THREE.sRGBEncoding)ren.outputEncoding=THREE.sRGBEncoding;

// ── Scena: softbox, luce diffusa e riflessi controllati ──
const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,60);
{const pm=new THREE.PMREMGenerator(ren),es=new THREE.Scene();es.background=new THREE.Color(0x8d8d92);
 const sb=(w,h,d,x,y,z,i,col=0xffffff)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(i)}));m.position.set(x,y,z);es.add(m)};
 sb(10,.5,10,0,6,0,2.4);sb(.5,6,6,-6,1,3,1.4);sb(.5,6,6,6,1,3,1,0xfff1e0);sb(8,4,.5,0,1,-7,.75);
 scene.environment=pm.fromScene(es,.04).texture;pm.dispose()}
scene.add(new THREE.HemisphereLight(0xffffff,0x737d79,.32));
const keyLight=new THREE.DirectionalLight(0xffffff,.8);keyLight.position.set(-4,6,7);scene.add(keyLight);
const rimLight=new THREE.DirectionalLight(0xdce9e2,.42);rimLight.position.set(4,2,-5);scene.add(rimLight);

const rshape=(w,h,r)=>{const s=new THREE.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.absarc(x+w-r,y+r,r,-Z/2,0);s.lineTo(x+w,y+h-r);s.absarc(x+w-r,y+h-r,r,0,Z/2);s.lineTo(x+r,y+h);s.absarc(x+r,y+h-r,r,Z/2,Z);s.lineTo(x,y+r);s.absarc(x+r,y+r,r,Z,1.5*Z);return s};
const slab=(w,h,r,d,b)=>{const g=new THREE.ExtrudeGeometry(rshape(w,h,r),{depth:d,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:6,curveSegments:32});g.center();return g};
const rig=new THREE.Group(),grp=new THREE.Group();grp.scale.setScalar(1.15);rig.add(grp);scene.add(rig);

// Portatile compatto: scocca, cornice, fotocamera, cerniera e piano tastiera.
const alu=new THREE.MeshPhongMaterial({color:0x8c999b,specular:0x5d696b,shininess:58});
const darkMetal=new THREE.MeshStandardMaterial({color:0x272d30,metalness:.28,roughness:.34});
const shell=new THREE.Mesh(slab(3.2,2.1,.2,.1,.035),alu);grp.add(shell);
shell.geometry.computeBoundingBox();const zf=shell.geometry.boundingBox.max.z;
const bezel=new THREE.Mesh(slab(3.02,1.92,.14,.028,.008),darkMetal);bezel.position.z=zf+.006;grp.add(bezel);
const tex=setSRGB(new THREE.CanvasTexture(drawScreen()));tex.anisotropy=ren.capabilities.getMaxAnisotropy();
const scr=new THREE.Mesh(new THREE.PlaneGeometry(2.88,1.78),new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));scr.position.z=zf+.04;grp.add(scr);
const lens=new THREE.Mesh(new THREE.SphereGeometry(.025,24,16),new THREE.MeshStandardMaterial({color:0x0a0d0e,metalness:.35,roughness:.18}));lens.position.set(0,.93,zf+.041);grp.add(lens);
const hinge=new THREE.Mesh(new THREE.CylinderGeometry(.062,.062,2.86,40),alu);hinge.rotation.z=Z/2;hinge.position.set(0,-1.045,-.12);grp.add(hinge);
const deck=new THREE.Mesh(slab(3.24,1.96,.17,.16,.045),alu);deck.rotation.x=-Z/2;deck.position.set(0,-1.105,.82);grp.add(deck);
const keyMat=new THREE.MeshStandardMaterial({color:0x252c2f,metalness:.12,roughness:.43});
const keyGeo=slab(.15,.12,.022,.028,.006),keys=new THREE.InstancedMesh(keyGeo,keyMat,65),dummy=new THREE.Object3D();
const legendMat=new THREE.MeshBasicMaterial({color:0x77817f}),legendGeo=new THREE.BoxGeometry(.052,.008,.018),legends=new THREE.InstancedMesh(legendGeo,legendMat,65);
let ki=0,li=0;for(let row=0;row<5;row++)for(let col=0;col<13;col++){
 const x=-1.16+col*.193,y=-.985,z=.16+row*.17;
 dummy.position.set(x,y,z);dummy.rotation.set(-Z/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();keys.setMatrixAt(ki++,dummy.matrix);
 if(!(row===4&&(col===5||col===6))){dummy.position.set(x,y+.035,z);dummy.rotation.set(-Z/2,0,0);dummy.scale.set(col===0||col===12?.035:.052,1,.018);dummy.updateMatrix();legends.setMatrixAt(li++,dummy.matrix)}
}keys.count=ki;keys.frustumCulled=false;keys.instanceMatrix.needsUpdate=true;grp.add(keys);
legends.count=li;legends.frustumCulled=false;legends.instanceMatrix.needsUpdate=true;grp.add(legends);
const trackpadRim=new THREE.Mesh(new THREE.BoxGeometry(1.02,.018,.68),new THREE.MeshPhongMaterial({color:0x596466,specular:0x30393b,shininess:24}));trackpadRim.position.set(0,-.991,1.37);grp.add(trackpadRim);
const trackpad=new THREE.Mesh(new THREE.BoxGeometry(.96,.02,.62),new THREE.MeshPhongMaterial({color:0x7b898b,specular:0x4a5658,shininess:20}));trackpad.position.set(0,-.972,1.37);grp.add(trackpad);
for(const z of [.3,.52]){const port=new THREE.Mesh(new THREE.BoxGeometry(.018,.045,.11),darkMetal);port.position.set(-1.62,-1.105,z);grp.add(port)}
const feetMat=new THREE.MeshStandardMaterial({color:0x252a2c,roughness:.72});
for(const x of [-1.25,1.25])for(const z of [.15,1.45]){const foot=new THREE.Mesh(new THREE.BoxGeometry(.3,.035,.11),feetMat);foot.position.set(x,-1.185,z);grp.add(foot)}
{const bc=document.createElement('canvas');bc.width=512;bc.height=256;const b=bc.getContext('2d');b.font='600 120px -apple-system,"SF Pro Display",system-ui,sans-serif';b.textAlign='center';b.textBaseline='middle';b.fillStyle='rgba(70,70,76,.6)';b.fillText('C & O',256,128);
 const t=setSRGB(new THREE.CanvasTexture(bc));const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.6),new THREE.MeshBasicMaterial({map:t,transparent:true,toneMapped:false}));m.rotation.y=Z;m.position.z=-zf-.002;grp.add(m)}

// Scheda fisica per una richiesta: contenuto leggibile al posto degli elementi astratti.
const cardMat=new THREE.MeshStandardMaterial({color:0xf5f6f4,metalness:.04,roughness:.52});
const ticket=new THREE.Group();ticket.position.set(1.84,-.58,.86);ticket.rotation.set(.06,-.16,-.035);ticket.scale.setScalar(.82);grp.add(ticket);
const card=new THREE.Mesh(slab(1.34,.88,.085,.07,.018),cardMat);ticket.add(card);
const cc=document.createElement('canvas');cc.width=640;cc.height=420;const cg=cc.getContext('2d');
cg.fillStyle='#f5f6f4';cg.fillRect(0,0,640,420);cg.fillStyle='#68716e';cg.font='600 24px Arial,sans-serif';cg.fillText('C & O  /  RICHIESTA',42,58);
cg.fillStyle='#101719';cg.font='700 42px Arial,sans-serif';cg.fillText('Assistenza',42,133);cg.fillText('bicicletta',42,181);
cg.fillStyle='#626b68';cg.font='400 27px Arial,sans-serif';cg.fillText('Informazione da verificare',42,244);
cg.fillStyle='#d9e8df';cg.fillRect(42,286,226,56);cg.fillStyle='#173d2d';cg.font='700 22px Arial,sans-serif';cg.fillText('IN ATTESA',62,322);
const cardTex=setSRGB(new THREE.CanvasTexture(cc));cardTex.anisotropy=ren.capabilities.getMaxAnisotropy();
const cardFace=new THREE.Mesh(new THREE.PlaneGeometry(1.27,.82),new THREE.MeshBasicMaterial({map:cardTex,toneMapped:false}));cardFace.position.z=.061;ticket.add(cardFace);
// Ombra di contatto morbida sotto il portatile.
{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
 const m=new THREE.Mesh(new THREE.PlaneGeometry(4.8,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,opacity:.32}));m.rotation.x=-Z/2;m.position.set(0,-1.28,.5);scene.add(m)}
const hp=[new THREE.Vector3(1.28,.97,zf+.03),new THREE.Vector3(2.28,-.31,.87),new THREE.Vector3(-1.38,-.97,.82)];

// ── Stato, loop on-demand, render ──
const s={tx:0,ty:0,zoom:0,fx:0,fy:0,yaw:0},t={tx:0,ty:0,zoom:0,fx:0,fy:0};
let z0=7.6,active=-1,vis=false,raf=0,last=0,w=0,h=0;
function size(){w=stage.clientWidth;h=stage.clientHeight;if(!w||!h)return;grp.scale.setScalar(w<460?.94:1.04);ren.setSize(w,h,false);cam.aspect=w/h;z0=7.6/Math.min(1,cam.aspect);cam.updateProjectionMatrix();need()}
function render(now){
  const r=stage.getBoundingClientRect(),p=RM.matches?.5:Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height))),f=RM.matches?0:Math.sin(now/1400);
  rig.position.y=f*.06+(.5-p)*.5;rig.rotation.x=s.ty+(p-.5)*.3;rig.rotation.y=s.tx+(p-.5)*CFG.scroll;grp.rotation.y=s.yaw;
  if(!RM.matches)ticket.position.y=-.52+Math.sin(now/1450+1)*.025;
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
