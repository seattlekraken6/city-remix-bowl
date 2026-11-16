// ===== tiny 3D renderer: flat-shaded boxes on a 2D canvas =====
const FW=26.67,NEAR=1.2,FONT_D="'Barlow Condensed','Arial Narrow',Impact,sans-serif";
const cam={x:0,y:10.5,z:-21,pitch:0.36,c:1,s:0,F:500,cx:0,cy:0};
let cv=null,ctx=null,W=2,H=2,DPR=1,faces=[],crowd=[],FLIP=false;
// When the user plays defense the whole scene is turned around so the camera sits behind the defense.
const RX=x=>FLIP?-x:x,RZ=z=>FLIP?100-z:z;

function setCam(){cam.c=Math.cos(cam.pitch);cam.s=Math.sin(cam.pitch);cam.F=Math.min(1.0*H,0.47*W);cam.cx=W/2;cam.cy=H*0.54;}
function toCam(x,y,z){const dx=x-cam.x,dy=y-cam.y,dz=z-cam.z;return [dx,dy*cam.c+dz*cam.s,-dy*cam.s+dz*cam.c];}
function proj(c){const k=cam.F/c[2];return [cam.cx+c[0]*k,cam.cy-c[1]*k];}
function projW(x,y,z){const c=toCam(x,y,z);if(c[2]<NEAR)return null;const k=cam.F/c[2];return [cam.cx+c[0]*k,cam.cy-c[1]*k,c[2]];}
function clipNear(P){const out=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(ia)out.push(a);
  if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR]);}}return out;}
function poly3(pts,fill){let P=pts.map(p=>toCam(p[0],p[1],p[2]));P=clipNear(P);if(P.length<3)return;ctx.beginPath();
  for(let i=0;i<P.length;i++){const s=proj(P[i]);if(i)ctx.lineTo(s[0],s[1]);else ctx.moveTo(s[0],s[1]);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function gquad(x1,z1,x2,z2,fill){poly3([[x1,0,z1],[x2,0,z1],[x2,0,z2],[x1,0,z2]],fill);}
function gline(x1,z1,x2,z2,wYd,col){let a=toCam(x1,0,z1),b=toCam(x2,0,z2);if(a[2]<NEAR&&b[2]<NEAR)return;
  if(a[2]<NEAR){const t=(NEAR-a[2])/(b[2]-a[2]);a=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR];}
  else if(b[2]<NEAR){const t=(NEAR-b[2])/(a[2]-b[2]);b=[b[0]+(a[0]-b[0])*t,b[1]+(a[1]-b[1])*t,NEAR];}
  const pa=proj(a),pb=proj(b);ctx.strokeStyle=col;ctx.lineCap='round';ctx.lineWidth=Math.max(1.5*DPR,cam.F*wYd/((a[2]+b[2])/2));ctx.beginPath();ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.stroke();}
// Text painted flat onto a plane given three corners (top-left, top-right, bottom-left).
function textQuad(txt,TL,TR,BL,aspect,col){const a=projW(TL[0],TL[1],TL[2]),b=projW(TR[0],TR[1],TR[2]),c=projW(BL[0],BL[1],BL[2]);if(!a||!b||!c)return;const uw=100*aspect;
  ctx.setTransform((b[0]-a[0])/uw,(b[1]-a[1])/uw,(c[0]-a[0])/100,(c[1]-a[1])/100,a[0],a[1]);ctx.fillStyle=col;ctx.font='700 92px '+FONT_D;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(txt,uw/2,54,uw*0.96);ctx.setTransform(1,0,0,1,0,0);}

// matrices: 3x3 row-major + translation
function mT(x,y,z){return [1,0,0,0,1,0,0,0,1,x,y,z];}
function mRX(a){const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0,c,-s,0,s,c,0,0,0];}
function mRY(a){const c=Math.cos(a),s=Math.sin(a);return [c,0,s,0,1,0,-s,0,c,0,0,0];}
function mRZ(a){const c=Math.cos(a),s=Math.sin(a);return [c,-s,0,s,c,0,0,0,1,0,0,0];}
function mMul(A,B){return [
  A[0]*B[0]+A[1]*B[3]+A[2]*B[6],A[0]*B[1]+A[1]*B[4]+A[2]*B[7],A[0]*B[2]+A[1]*B[5]+A[2]*B[8],
  A[3]*B[0]+A[4]*B[3]+A[5]*B[6],A[3]*B[1]+A[4]*B[4]+A[5]*B[7],A[3]*B[2]+A[4]*B[5]+A[5]*B[8],
  A[6]*B[0]+A[7]*B[3]+A[8]*B[6],A[6]*B[1]+A[7]*B[4]+A[8]*B[7],A[6]*B[2]+A[7]*B[5]+A[8]*B[8],
  A[0]*B[9]+A[1]*B[10]+A[2]*B[11]+A[9],A[3]*B[9]+A[4]*B[10]+A[5]*B[11]+A[10],A[6]*B[9]+A[7]*B[10]+A[8]*B[11]+A[11]];}
function mApply(M,x,y,z){return [M[0]*x+M[1]*y+M[2]*z+M[9],M[3]*x+M[4]*y+M[5]*z+M[10],M[6]*x+M[7]*y+M[8]*z+M[11]];}

const LIGHT=(()=>{const v=[0.35,0.85,-0.4],l=Math.hypot(v[0],v[1],v[2]);return v.map(x=>x/l);})();
const shadeCache=new Map();
function shade(hex,k){const q=Math.round(k*16),key=hex+q;let v=shadeCache.get(key);if(v)return v;const n=parseInt(hex.slice(1),16),f=q/16;
  v='rgb('+Math.min(255,Math.round((n>>16&255)*f))+','+Math.min(255,Math.round((n>>8&255)*f))+','+Math.min(255,Math.round((n&255)*f))+')';shadeCache.set(key,v);return v;}
function lum(hex){const n=parseInt(hex.slice(1),16);return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255;}
function colDist(a,b){const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);return Math.hypot((x>>16&255)-(y>>16&255),(x>>8&255)-(y>>8&255),(x&255)-(y&255));}
// faces: corner indices (bit0=x, bit1=y, bit2=z) and outward normal
const BOXF=[[1,3,7,5,1,0,0],[0,2,6,4,-1,0,0],[2,3,7,6,0,1,0],[4,5,7,6,0,0,1],[0,1,3,2,0,0,-1]];
function addBox(M,cx,cy,cz,hx,hy,hz,col,lab){const P=[],Sc=[];
  for(let i=0;i<8;i++){const x=cx+(i&1?hx:-hx),y=cy+(i&2?hy:-hy),z=cz+(i&4?hz:-hz);
    const wx=M[0]*x+M[1]*y+M[2]*z+M[9],wy=M[3]*x+M[4]*y+M[5]*z+M[10],wz=M[6]*x+M[7]*y+M[8]*z+M[11];
    const c=toCam(wx,wy,wz);if(c[2]<NEAR)return;const k=cam.F/c[2];P.push([wx,wy,wz]);Sc.push([cam.cx+c[0]*k,cam.cy-c[1]*k,c[2]]);}
  for(let f=0;f<5;f++){const F=BOXF[f];
    const nx=M[0]*F[4]+M[1]*F[5]+M[2]*F[6],ny=M[3]*F[4]+M[4]*F[5]+M[5]*F[6],nz=M[6]*F[4]+M[7]*F[5]+M[8]*F[6];
    const a=P[F[0]],b=P[F[2]];
    if(((a[0]+b[0])/2-cam.x)*nx+((a[1]+b[1])/2-cam.y)*ny+((a[2]+b[2])/2-cam.z)*nz>=0)continue;
    const br=0.6+0.4*Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]);
    const s0=Sc[F[0]],s1=Sc[F[1]],s2=Sc[F[2]],s3=Sc[F[3]];
    faces.push({d:(s0[2]+s1[2]+s2[2]+s3[2])/4,p:[s0,s1,s2,s3],c:shade(col,br),lab:(lab&&f>=3)?lab:null,lc:f===3?[Sc[7],Sc[6],Sc[5]]:f===4?[Sc[2],Sc[3],Sc[0]]:null});}}
function flushFaces(){faces.sort((a,b)=>b.d-a.d);ctx.lineWidth=0.8;ctx.lineJoin='round';
  for(const f of faces){const p=f.p;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);ctx.lineTo(p[1][0],p[1][1]);ctx.lineTo(p[2][0],p[2][1]);ctx.lineTo(p[3][0],p[3][1]);ctx.closePath();
    ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle=f.c;ctx.stroke();
    if(f.lab){const a=f.lc[0],b=f.lc[1],c=f.lc[2];if(Math.hypot(b[0]-a[0],b[1]-a[1])>9*DPR){
      ctx.setTransform((b[0]-a[0])/100,(b[1]-a[1])/100,(c[0]-a[0])/100,(c[1]-a[1])/100,a[0],a[1]);ctx.fillStyle=f.lab.col;ctx.font='700 66px '+FONT_D;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(f.lab.t,50,52,92);ctx.setTransform(1,0,0,1,0,0);}}}
  faces.length=0;}

// ===== stadium and field =====
function buildCrowd(T){crowd=[];const cols=[T.c1,T.c2,'#e9e9e9','#d8b48a','#2b2f36','#9aa6b4',T.c1];
  for(let i=0;i<900;i++){const tier=rint(0,3),u=Math.random(),col=pick(cols);let x,z;const y=1.3+tier*3.2+u*3,r=Math.random();
    if(r<0.2){x=rnd(-44,44);z=128+tier*5+u*5;}else if(r<0.4){x=rnd(-44,44);z=-28-tier*5-u*5;}else{x=(Math.random()<0.5?-1:1)*(33+tier*5+u*5);z=rnd(-28,128);}
    crowd.push([x,y,z,col]);}
  crowd.sort((a,b)=>a[3]<b[3]?-1:a[3]>b[3]?1:0);}
function drawBackdrop(T){const hz=cam.cy-cam.F*Math.tan(cam.pitch);const g=ctx.createLinearGradient(0,0,0,Math.max(1,hz));
  g.addColorStop(0,'#5fa8e6');g.addColorStop(1,'#d2e8f8');ctx.fillStyle=g;ctx.fillRect(0,0,W,hz+1);ctx.fillStyle='#2f5f3c';ctx.fillRect(0,hz,W,H-hz);
  const tc=['#3a4350','#444e5c','#3a4350','#4b5666'],rim=lum(T.c2)>0.9?T.c1:T.c2;
  for(const e of [[128,1],[-28,-1]]){const z0=e[0],s=e[1];if(z0-cam.z<NEAR)continue;
    poly3([[-45,0,z0],[45,0,z0],[45,1.2,z0],[-45,1.2,z0]],'#20262d');
    for(let i=3;i>=0;i--)poly3([[-45,1.2+i*3.2,z0+s*i*5],[45,1.2+i*3.2,z0+s*i*5],[45,4.4+i*3.2,z0+s*(i*5+5)],[-45,4.4+i*3.2,z0+s*(i*5+5)]],tc[i]);
    poly3([[-45,14,z0+s*20],[45,14,z0+s*20],[45,16.4,z0+s*20],[-45,16.4,z0+s*20]],T.c1);}
  for(const s of [-1,1]){poly3([[s*33,0,-40],[s*33,0,140],[s*33,1.2,140],[s*33,1.2,-40]],'#20262d');
    for(let i=3;i>=0;i--)poly3([[s*(33+i*5),1.2+i*3.2,-50],[s*(33+i*5),1.2+i*3.2,150],[s*(38+i*5),4.4+i*3.2,150],[s*(38+i*5),4.4+i*3.2,-50]],tc[i]);
    poly3([[s*53,14,-50],[s*53,14,150],[s*53,16.4,150],[s*53,16.4,-50]],rim);}
  let last='';for(const c of crowd){const p=projW(c[0],c[1],c[2]);if(!p||p[2]>190)continue;if(c[3]!==last){ctx.fillStyle=c[3];last=c[3];}
    const sz=Math.max(1.6*DPR,cam.F*0.5/p[2]);ctx.fillRect(p[0]-sz/2,p[1]-sz,sz,sz*1.3);}}
function drawField(T){gquad(-31,-14,31,114,'#2e7a3a');
  for(let i=0;i<20;i++)gquad(-FW,i*5,FW,i*5+5,i%2?'#3f9145':'#47a04c');
  gquad(-FW,-10,FW,0,T.c1);gquad(-FW,100,FW,110,T.c1);
  const wl='#f4f6f2';gquad(-FW-0.7,-10.7,-FW,110.7,wl);gquad(FW,-10.7,FW+0.7,110.7,wl);gquad(-FW,-10.7,FW,-10,wl);gquad(-FW,110,FW,110.7,wl);
  for(let z=0;z<=100;z+=5){const w=(z===0||z===100)?0.22:0.1;gquad(-FW,z-w,FW,z+w,'rgba(255,255,255,.88)');}
  ctx.beginPath();
  for(let z=1;z<100;z++){if(z%5===0)continue;const dz=z-cam.z;if(dz<2||dz>75)continue;
    for(const sg of [[-FW,-FW+0.7],[-3.4,-2.7],[2.7,3.4],[FW-0.7,FW]]){const a=projW(sg[0],0,z),b=projW(sg[1],0,z);if(a&&b){ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}}}
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=Math.max(1,DPR);ctx.stroke();
  for(let yl=10;yl<=90;yl+=10){const dz=yl-cam.z;if(dz<4||dz>85)continue;const n=String(yl<=50?yl:100-yl),t=n[0]+' '+n[1],c='rgba(255,255,255,.85)';
    textQuad(t,[-15.2,0,yl+3.2],[-15.2,0,yl-3.2],[-17.6,0,yl+3.2],2.67,c);
    textQuad(t,[15.2,0,yl-3.2],[15.2,0,yl+3.2],[17.6,0,yl-3.2],2.67,c);}
  const ec=lum(T.c1)>0.5?'#16181c':(lum(T.c2)>0.35?T.c2:'#ffffff'),name=T.name.toUpperCase();
  textQuad(name,[-20,0,108.3],[20,0,108.3],[-20,0,101.7],6.06,ec);textQuad(name,[-20,0,-1.7],[20,0,-1.7],[-20,0,-8.3],6.06,ec);}
function addPosts(z){const M=mT(0,0,z),c='#f0cf2e';addBox(M,0,1.67,0,0.1,1.67,0.1,c);addBox(M,0,3.38,0,3.14,0.09,0.09,c);addBox(M,-3.08,8.4,0,0.08,5,0.08,c);addBox(M,3.08,8.4,0,0.08,5,0.08,c);}

// ===== low-poly player: 15 boxes on a jointed skeleton =====
function drawPlayer(e){const p=e.pose,k=e.kit;
  const hip=Math.max(0.5*Math.cos(p.lTh)+0.5*Math.cos(p.lTh-p.lKn),0.5*Math.cos(p.rTh)+0.5*Math.cos(p.rTh-p.rKn))+0.07;
  const R=mMul(mT(RX(e.x),p.hop+p.fall*0.2,RZ(e.z)),mMul(mRY(e.dir+(FLIP?Math.PI:0)),mRX(p.fall*1.5*e.fallDir)));
  for(const s of [-1,1]){const th=s<0?p.lTh:p.rTh,kn=s<0?p.lKn:p.rKn;
    const Mt=mMul(R,mMul(mT(s*0.16,hip,0),mRX(-th)));addBox(Mt,0,-0.25,0,0.12,0.27,0.13,k.pants);
    const Ms=mMul(Mt,mMul(mT(0,-0.5,0),mRX(kn)));addBox(Ms,0,-0.24,0,0.1,0.25,0.1,k.socks);addBox(Ms,0,-0.5,0.07,0.1,0.06,0.17,k.shoes);}
  const U=mMul(R,mMul(mT(0,hip,0),mRX(p.lean)));
  addBox(U,0,0.32,0,0.31,0.32,0.19,k.jersey,{t:e.num,col:k.num});
  addBox(U,0,0.67,0,0.46,0.11,0.24,k.pads);
  const Hd=mMul(U,mMul(mT(0,0.78,0),mRX(-p.lean*0.6)));
  addBox(Hd,0,0.22,0.02,0.21,0.21,0.23,k.helmet);addBox(Hd,0,0.16,0.25,0.15,0.1,0.03,'#22262b');addBox(Hd,0,0.44,0.02,0.04,0.012,0.23,k.stripe);
  for(const s of [-1,1]){const ar=s<0?p.lArm:p.rArm,el=s<0?p.lEl:p.rEl;
    const Ma=mMul(U,mMul(mT(s*0.5,0.68,0),mMul(mRZ(s*p.spread),mRX(-ar))));addBox(Ma,0,-0.19,0,0.085,0.2,0.085,k.sleeve);
    const Mf=mMul(Ma,mMul(mT(0,-0.38,0),mRX(-el)));addBox(Mf,0,-0.18,0,0.075,0.19,0.075,e.skin);}
  e.R=R;e.hip=hip;}
function ring(x,z,rYd,col,lw){const s=projW(RX(x),0.02,RZ(z));if(!s)return;const r=cam.F*rYd/s[2];ctx.beginPath();ctx.ellipse(s[0],s[1],r,r*0.42,0,0,6.2832);ctx.strokeStyle=col;ctx.lineWidth=lw*DPR;ctx.stroke();}

function renderGame(){const g=gm;if(!g||!ctx)return;setCam();ctx.setTransform(1,0,0,1,0,0);
  drawBackdrop(g.home);drawField(g.home);
  const live=g.phase==='live',uo=g.poss==='U';
  if(g.ents.length&&g.phase!=='card'){const lz=RZ(g.pos),fz=RZ(g.pos+g.toGo);gquad(-FW,lz-0.13,FW,lz+0.13,'rgba(46,110,255,.8)');if(g.pos+g.toGo<100)gquad(-FW,fz-0.13,FW,fz+0.13,'rgba(244,196,48,.9)');}
  if(g.phase==='presnap'&&uo)for(const e of g.elig){let px=e.x,pz=e.z;for(const w of e.route){gline(px,pz,w.x,w.z,0.2,'rgba(244,196,48,.85)');px=w.x;pz=w.z;}ring(px,pz,0.5,'rgba(244,196,48,.9)',2);}
  ctx.fillStyle='rgba(0,0,0,.26)';
  for(const e of g.ents){const s=projW(RX(e.x),0,RZ(e.z));if(!s)continue;const r=cam.F*0.55/s[2];ctx.beginPath();ctx.ellipse(s[0],s[1],r,r*0.4,0,0,6.2832);ctx.fill();}
  const b=g.ball;
  for(const e of g.ents)if(e.zone&&!e.down){ring(e.x,e.z,0.62,'rgba(255,214,64,.95)',2);ring(e.x,e.z,0.95,'rgba(255,214,64,.55)',1.5);}
  if(live){const u=uo?(g.carrier||(b&&b.fly?b.target:null)):g.ctl;if(u)ring(u.x,u.z,0.85,uo?'rgba(244,196,48,.95)':'rgba(90,200,255,.95)',2.5);
    if(b&&b.fly){ring(b.land.x,b.land.z,0.9,'rgba(255,255,255,.9)',2);ring(b.land.x,b.land.z,0.35,'rgba(255,255,255,.9)',2);}}
  else if(!uo&&g.ctl&&g.phase==='presnap')ring(g.ctl.x,g.ctl.z,0.85,'rgba(90,200,255,.95)',2.5);
  for(const e of g.ents)drawPlayer(e);
  if(b){let bx,by,bz,yaw=0,pit=0;
    if(b.held&&b.held.R){const h=b.held;const w=h.anim==='carry'?mApply(h.R,0.3,h.hip+0.3,0.22):mApply(h.R,0.05,h.hip+0.45,0.3);bx=w[0];by=w[1];bz=w[2];yaw=h.dir+(FLIP?Math.PI:0);}
    else if(!b.held){bx=RX(b.x);by=b.y;bz=RZ(b.z);yaw=Math.atan2(RX(b.vx),FLIP?-b.vz:b.vz);pit=-Math.atan2(b.vy,Math.hypot(b.vx,b.vz)||1);}
    if(bx!==undefined)addBox(mMul(mT(bx,by,bz),mMul(mRY(yaw),mRX(pit))),0,0,0,0.085,0.085,0.17,'#7a4a26');}
  addPosts(110);addPosts(-10);flushFaces();
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 '+Math.round(15*DPR)+'px '+FONT_D;
  if(uo&&((live&&g.mode==='pocket'&&!g.throwing)||g.phase==='presnap')){
    for(const e of g.elig){const s=projW(e.x,2.8,e.z);e.sx=null;if(!s)continue;e.sx=s[0];e.sy=s[1];const dn=openness(e);
      const col=g.phase==='presnap'?'#f4c430':dn>3.2?'#4cc47a':dn>1.7?'#f4c430':'#e5604f',r=11*DPR;
      ctx.beginPath();ctx.arc(s[0],s[1]-r,r,0,6.2832);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=2*DPR;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.stroke();ctx.fillStyle='#141a12';ctx.fillText(String(e.key),s[0],s[1]-r+DPR);}}
  else for(const e of g.elig)e.sx=null;
  if(!uo&&g.ctl&&(live||g.phase==='presnap')){const s=projW(RX(g.ctl.x),2.7,RZ(g.ctl.z));if(s){const r=8*DPR;ctx.beginPath();ctx.moveTo(s[0]-r,s[1]-r*1.6);ctx.lineTo(s[0]+r,s[1]-r*1.6);ctx.lineTo(s[0],s[1]);ctx.closePath();ctx.fillStyle='#5ac8ff';ctx.fill();ctx.lineWidth=2*DPR;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.stroke();}}}
