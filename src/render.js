// ===== tiny 3D renderer: flat-shaded polygons on a 2D canvas =====
const FW=26.67,NEAR=1.2,FONT_D="'Barlow Condensed','Arial Narrow',Impact,sans-serif";
const RCOL=['#4cc9f0','#ff5fa2','#ffa62b','#b79cff','#ffffff'];   // one color per receiver's route
const cam={x:0,y:10.5,z:-21,pitch:0.36,yaw:0,yc:1,ys:0,c:1,s:0,F:500,cx:0,cy:0};
let cv=null,ctx=null,W=2,H=2,DPR=1,faces=[],crowd=[],FLIP=false;
// When the user plays defense the whole scene is turned around so the camera sits behind the defense.
const RX=x=>FLIP?-x:x,RZ=z=>FLIP?100-z:z;

function setCam(){cam.c=Math.cos(cam.pitch);cam.s=Math.sin(cam.pitch);cam.yc=Math.cos(cam.yaw||0);cam.ys=Math.sin(cam.yaw||0);cam.F=Math.min(1.0*H,0.47*W);cam.cx=W/2;cam.cy=H*0.54;}
function toCam(x,y,z){let dx=x-cam.x,dy=y-cam.y,dz=z-cam.z;if(cam.yaw){const t=dx*cam.yc-dz*cam.ys;dz=dx*cam.ys+dz*cam.yc;dx=t;}return [dx,dy*cam.c+dz*cam.s,-dy*cam.s+dz*cam.c];}
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
function addBox(M,cx,cy,cz,hx,hy,hz,col){const P=[],Sc=[];
  for(let i=0;i<8;i++){const x=cx+(i&1?hx:-hx),y=cy+(i&2?hy:-hy),z=cz+(i&4?hz:-hz);
    const wx=M[0]*x+M[1]*y+M[2]*z+M[9],wy=M[3]*x+M[4]*y+M[5]*z+M[10],wz=M[6]*x+M[7]*y+M[8]*z+M[11];
    const c=toCam(wx,wy,wz);if(c[2]<NEAR)return;const k=cam.F/c[2];P.push([wx,wy,wz]);Sc.push([cam.cx+c[0]*k,cam.cy-c[1]*k,c[2]]);}
  for(let f=0;f<5;f++){const F=BOXF[f];
    const nx=M[0]*F[4]+M[1]*F[5]+M[2]*F[6],ny=M[3]*F[4]+M[4]*F[5]+M[5]*F[6],nz=M[6]*F[4]+M[7]*F[5]+M[8]*F[6];
    const a=P[F[0]],b=P[F[2]];
    if(((a[0]+b[0])/2-cam.x)*nx+((a[1]+b[1])/2-cam.y)*ny+((a[2]+b[2])/2-cam.z)*nz>=0)continue;
    const br=0.6+0.4*Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]);
    const s0=Sc[F[0]],s1=Sc[F[1]],s2=Sc[F[2]],s3=Sc[F[3]];
    faces.push({d:(s0[2]+s1[2]+s2[2]+s3[2])/4,p:[s0,s1,s2,s3],c:shade(col,br),lab:null});}}
// A stack of 8-sided rings, bottom to top. Each ring is [y, half-width, half-depth, bevel, z-offset].
// Bevel 0 gives a plain tapered box. Face 0 points forward (+z) and face 4 backward; those two can carry a label.
function addPrism(M,rings,col,lab,cap){const R=[];
  for(const r of rings){const y=r[0],w=r[1],d=r[2],b=r[3]||0,zo=r[4]||0,L=[w-b,d,-(w-b),d,-w,d-b,-w,-(d-b),-(w-b),-d,w-b,-d,w,-(d-b),w,d-b],ring=[];
    for(let i=0;i<8;i++){const x=L[i*2],z=L[i*2+1]+zo,wx=M[0]*x+M[1]*y+M[2]*z+M[9],wy=M[3]*x+M[4]*y+M[5]*z+M[10],wz=M[6]*x+M[7]*y+M[8]*z+M[11];
      const c=toCam(wx,wy,wz);if(c[2]<NEAR)return;const k=cam.F/c[2];ring.push([wx,wy,wz,cam.cx+c[0]*k,cam.cy-c[1]*k,c[2]]);}
    R.push(ring);}
  for(let j=0;j<R.length-1;j++){const A=R[j],B=R[j+1],plain=!(rings[j][3]||rings[j+1][3]);
    for(let i=0;i<8;i++){if(plain&&(i&1))continue;const i2=(i+1)&7,a=A[i],b=A[i2],c=B[i2],d=B[i];
      const ux=d[0]-a[0],uy=d[1]-a[1],uz=d[2]-a[2],tx=b[0]-a[0],ty=b[1]-a[1],tz=b[2]-a[2];
      let nx=uy*tz-uz*ty,ny=uz*tx-ux*tz,nz=ux*ty-uy*tx;const nl=Math.hypot(nx,ny,nz);if(nl<1e-9)continue;nx/=nl;ny/=nl;nz/=nl;
      if(((a[0]+c[0])/2-cam.x)*nx+((a[1]+c[1])/2-cam.y)*ny+((a[2]+c[2])/2-cam.z)*nz>=0)continue;
      const br=0.6+0.4*Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]),use=lab&&(i===0||i===4);
      faces.push({d:(a[5]+b[5]+c[5]+d[5])/4,p:[[a[3],a[4]],[b[3],b[4]],[c[3],c[4]],[d[3],d[4]]],c:shade(col,br),lab:use?lab:null,back:i===4,lc:use?[[d[3],d[4]],[c[3],c[4]],[a[3],a[4]]]:null});}}
  if(cap){const T=R[R.length-1],nx=M[1],ny=M[4],nz=M[7];let cx=0,cy=0,cz=0,dd=0;for(const v of T){cx+=v[0];cy+=v[1];cz+=v[2];dd+=v[5];}
    if((cx/8-cam.x)*nx+(cy/8-cam.y)*ny+(cz/8-cam.z)*nz<0)faces.push({d:dd/8,p:T.map(v=>[v[3],v[4]]),c:shade(col,0.6+0.4*Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2])),lab:null});}}
function flushFaces(){faces.sort((a,b)=>b.d-a.d);ctx.lineWidth=0.8;ctx.lineJoin='round';
  for(const f of faces){const p=f.p;ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();
    ctx.fillStyle=f.c;ctx.fill();ctx.strokeStyle=f.c;ctx.stroke();
    if(f.lab){const a=f.lc[0],b=f.lc[1],c=f.lc[2];if(Math.hypot(b[0]-a[0],b[1]-a[1])>7*DPR){const L=f.lab;
      ctx.setTransform((b[0]-a[0])/100,(b[1]-a[1])/100,(c[0]-a[0])/100,(c[1]-a[1])/100,a[0],a[1]);ctx.fillStyle=L.col;ctx.textAlign='center';ctx.textBaseline='middle';
      if(f.back&&L.name){ctx.font='700 19px '+FONT_D;ctx.fillText(L.name,50,23,92);ctx.font='700 54px '+FONT_D;ctx.fillText(L.t,50,65,92);}
      else{ctx.font='700 58px '+FONT_D;ctx.fillText(L.t,50,58,92);if(L.cap){ctx.font='700 22px '+FONT_D;ctx.fillText('C',84,20);}}
      ctx.setTransform(1,0,0,1,0,0);}}}
  faces.length=0;}

// ===== stadium and field =====
function line3(x1,y1,z1,x2,y2,z2,lw,col){let a=toCam(x1,y1,z1),b=toCam(x2,y2,z2);if(a[2]<NEAR&&b[2]<NEAR)return;
  if(a[2]<NEAR){const t=(NEAR-a[2])/(b[2]-a[2]);a=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR];}else if(b[2]<NEAR){const t=(NEAR-b[2])/(a[2]-b[2]);b=[b[0]+(a[0]-b[0])*t,b[1]+(a[1]-b[1])*t,NEAR];}
  const pa=proj(a),pb=proj(b);ctx.strokeStyle=col;ctx.lineCap='butt';ctx.lineWidth=Math.max(1,lw*DPR*Math.min(2.5,70/((a[2]+b[2])/2)));ctx.beginPath();ctx.moveTo(pa[0],pa[1]);ctx.lineTo(pb[0],pb[1]);ctx.stroke();}
const wall=(x1,x2,y1,y2,z,col)=>poly3([[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z]],col);
const stadOf=T=>STAD[T.abbr]||['O','#3a4350','none',70,''];
const openEnd=f=>f==='sky'||f==='water'||f==='mtn'||f==='palm'||f==='light'||f==='ship';
function buildCrowd(T){crowd=[];const cols=[T.c1,T.c2,'#e9e9e9','#d8b48a','#2b2f36','#9aa6b4',T.c1],far=openEnd(stadOf(T)[2])?1:3;
  for(let i=0;i<900;i++){let tier=rint(0,3);const u=Math.random(),col=pick(cols);let x,z;
    const q=Math.random();if(q<0.12){x=rnd(-44,44);z=-28-tier*5-u*5;}else if(q<0.38){tier=Math.min(tier,far);x=rnd(-44,44);z=128+tier*5+u*5;}else{x=(Math.random()<0.5?-1:1)*(33+tier*5+u*5);z=rnd(-40,128);}
    crowd.push([x,1.3+tier*3.2+u*3,z,col]);}
  crowd.sort((a,b)=>a[3]<b[3]?-1:a[3]>b[3]?1:0);}
// The stadium is drawn to match the home team's real building: its roof, seat color and landmark.
function drawBackdrop(T){const st=stadOf(T),roof=st[0],seat=st[1],feat=st[2],open=openEnd(feat),n=open?2:4,ind=roof==='D'||roof==='T';
  const hz=cam.cy-cam.F*Math.tan(cam.pitch),g=ctx.createLinearGradient(0,0,0,Math.max(1,hz));
  const wx=typeof gm!=='undefined'&&gm&&gm.wx||{},nt=wx.night&&roof!=='D';
  if(roof==='D'){g.addColorStop(0,'#15181d');g.addColorStop(1,'#39414c');}else if(nt){g.addColorStop(0,'#03050b');g.addColorStop(1,roof==='T'?'#2a3442':'#1a2436');}else if(roof==='T'){g.addColorStop(0,'#a9bcc8');g.addColorStop(1,'#e6eff3');}
  else if(wx.sky==='rain'){g.addColorStop(0,'#5d6873');g.addColorStop(1,'#a7b0b9');}else if(wx.sky==='snow'){g.addColorStop(0,'#8c96a2');g.addColorStop(1,'#dbe1e7');}else{g.addColorStop(0,'#5fa8e6');g.addColorStop(1,'#d2e8f8');}
  ctx.fillStyle=g;ctx.fillRect(0,0,W,hz+1);ctx.fillStyle=nt?(open?'#2a312d':'#1d3324'):wx.sky==='snow'?'#c9d1d4':open?'#7c8a80':'#2f5f3c';ctx.fillRect(0,hz,W,H-hz);if(feat==='water')gquad(-2500,138,2500,3000,'#5b8fb5');
  if(feat==='mtn')for(const m of [[-200,52],[-95,70],[10,58],[125,76],[230,50]]){poly3([[m[0]-115,0,460],[m[0]+115,0,460],[m[0],m[1],460]],'#7f8ba3');poly3([[m[0]-30,m[1]*0.74,459],[m[0]+30,m[1]*0.74,459],[m[0],m[1],459]],'#eef2f6');}
  if(feat==='sky'||feat==='water'||feat==='light'){const B=feat==='sky'?[[-46,9,30],[-34,7,44],[-24,8,26],[-13,10,52],[-2,7,36],[8,9,60],[19,8,33],[29,9,46],[41,8,28]]:[[-42,8,16],[-30,7,22],[24,9,19],[38,8,14]];
    for(const b of B)wall(b[0]-b[1]/2,b[0]+b[1]/2,0,b[2]*1.5,230,b[2]%3===0?'#7f90a6':b[2]%3===1?'#6c7d93':'#8fa0b4');}
  if(ind){wall(-60,60,0,31,150,roof==='D'?'#2b3139':'#c3d2da');
    if(feat==='win'){wall(-34,34,17.5,29.5,149.6,'#bfe0f5');for(const b of [[-27,7,30],[-17,6,44],[-8,7,26],[2,8,52],[12,6,36],[22,7,46]])wall(b[0]-b[1]/2,b[0]+b[1]/2,17.5,17.5+b[2]*0.2,149.5,b[2]%3?'#6c7d93':'#7f90a6');
      for(let x=-34;x<=34;x+=8.5)line3(x,17.5,149.4,x,29.5,149.4,1.5,'#6d7c88');}}
  const tc=[shade(seat,0.6),shade(seat,0.78),shade(seat,0.62),shade(seat,0.86)],rim=lum(T.c2)>0.9?T.c1:T.c2,ft=1.2+n*3.2,fz=128+n*5;
  if(nt&&roof!=='T')for(const L of [[-50,-30],[50,-30],[-50,132],[50,132]]){line3(L[0],0,L[1],L[0],38,L[1],2.5,'#3b4048');wall(L[0]-4,L[0]+4,36,40,L[1],'#fff6cf');}
  poly3([[-45,0,128],[45,0,128],[45,1.2,128],[-45,1.2,128]],'#20262d');
  if(cam.yaw){poly3([[-45,0,-28],[45,0,-28],[45,1.2,-28],[-45,1.2,-28]],'#20262d');for(let i=3;i>=0;i--)poly3([[-45,1.2+i*3.2,-28-i*5],[45,1.2+i*3.2,-28-i*5],[45,4.4+i*3.2,-33-i*5],[-45,4.4+i*3.2,-33-i*5]],tc[i]);}
  for(let i=n-1;i>=0;i--)poly3([[-45,1.2+i*3.2,128+i*5],[45,1.2+i*3.2,128+i*5],[45,4.4+i*3.2,133+i*5],[-45,4.4+i*3.2,133+i*5]],tc[i]);
  poly3([[-45,ft,fz],[45,ft,fz],[45,ft+2.4,fz],[-45,ft+2.4,fz]],T.c1);
  if(feat==='palm')for(const x of [-41,-27,-13,1,15,29,42]){line3(x,0,150,x+1.2,15,150,2.4,'#6b5236');for(let k=0;k<6;k++){const a=k*1.05;line3(x+1.2,15,150,x+1.2+Math.cos(a)*5.5,14.5+Math.sin(a)*3.2,150,2,'#2f8a4a');}}
  if(feat==='light'){wall(-25,-20,0,30,152,'#f2f1ec');wall(-25.8,-19.2,30,33.5,152,'#c0202a');wall(-24,-21,33.5,36.5,152,'#f2f1ec');wall(-6,30,13,27,151,'#11151b');wall(-5,29,14,26,150.9,'#254a7c');}
  if(feat==='ship'){poly3([[-17,3,139],[15,3,139],[19,9,139],[-21,9,139]],'#4a2f1c');line3(-8,9,139,-8,31,139,2.6,'#3a2616');line3(5,9,139,5,27,139,2.6,'#3a2616');
    wall(-13.5,-2.5,13,27,139.1,'#efe6d2');wall(0,10,12,23.5,139.1,'#efe6d2');wall(-8,-3.5,31,33.5,139,'#c0161b');}
  if(feat==='torch'){wall(-2.3,2.3,0,25,149,'#444a53');poly3([[-3.6,25,148.9],[3.6,25,148.9],[0,36,148.9]],'#ff8a1e');poly3([[-1.8,25.5,148.8],[1.8,25.5,148.8],[0,31.5,148.8]],'#ffd34d');}
  for(const s of [-1,1]){poly3([[s*33,0,-40],[s*33,0,140],[s*33,1.2,140],[s*33,1.2,-40]],'#20262d');
    for(let i=3;i>=0;i--)poly3([[s*(33+i*5),1.2+i*3.2,-50],[s*(33+i*5),1.2+i*3.2,150],[s*(38+i*5),4.4+i*3.2,150],[s*(38+i*5),4.4+i*3.2,-50]],tc[i]);
    poly3([[s*53,14,-50],[s*53,14,150],[s*53,16.4,150],[s*53,16.4,-50]],rim);
    if(feat==='col'){for(let z=-30;z<=140;z+=7)line3(s*55,16.4,z,s*55,25,z,3,'#e7e1d1');line3(s*55,25,-30,s*55,25,140,3.5,'#e7e1d1');}
    if(roof==='C'){poly3([[s*38,22,-50],[s*63,27,-50],[s*63,27,150],[s*38,22,150]],'#e3e8ec');line3(s*38,22,-50,s*38,22,150,2.5,'#98a4ae');}}
  let last='';for(const c of crowd){const p=projW(c[0],c[1],c[2]);if(!p||p[2]>190)continue;if(c[3]!==last){ctx.fillStyle=c[3];last=c[3];}
    const sz=Math.max(1.6*DPR,cam.F*0.5/p[2]);ctx.fillRect(p[0]-sz/2,p[1]-sz,sz,sz*1.3);}
  if(ind){const rc=roof==='D'?'#5a6370':'#8ea2af';for(let z=-40;z<=150;z+=19)line3(-60,31,z,60,31,z,2,rc);for(const x of [-30,0,30])line3(x,31,-60,x,31,150,2,rc);
    if(roof==='D'){ctx.fillStyle='#fff3c4';for(let z=-40;z<=150;z+=19)for(const x of [-42,-14,14,42]){const p=projW(x,30.6,z);if(p){const sz=Math.max(2*DPR,cam.F*1.1/p[2]);ctx.fillRect(p[0]-sz/2,p[1]-sz/3,sz,sz*0.66);}}}}
  if(feat==='board'){wall(-14,14,21,31,52,'#10141a');wall(-13,13,22,30,51.9,'#1f4580');if(typeof gm!=='undefined'&&gm)textQuad(gm.U.abbr+' '+gm.us+'   '+gm.O.abbr+' '+gm.them,[-12,29,51.8],[12,29,51.8],[-12,23,51.8],4,'#f4f6f2');}
  if(feat==='halo')for(let k=0;k<8;k++){const a0=k*0.7854+0.3927,a1=a0+0.7854,R=30;poly3([[R*Math.cos(a0),24,50+R*Math.sin(a0)],[R*Math.cos(a1),24,50+R*Math.sin(a1)],[R*Math.cos(a1),28,50+R*Math.sin(a1)],[R*Math.cos(a0),28,50+R*Math.sin(a0)]],k%2?'#2a5593':'#1f4580');}}
function drawField(T){const wx=typeof gm!=='undefined'&&gm&&gm.wx||{},sn=wx.sky==='snow',rn=wx.sky==='rain';gquad(-31,-14,31,114,sn?'#b9c9bf':'#2e7a3a');
  for(let i=0;i<20;i++)gquad(-FW,i*5,FW,i*5+5,sn?(i%2?'#a9c3b0':'#b3cbb9'):rn?(i%2?'#367f3c':'#3d8b43'):(i%2?'#3f9145':'#47a04c'));
  gquad(-FW,-10,FW,0,T.c1);gquad(-FW,100,FW,110,T.c1);
  const wl='#f4f6f2';gquad(-FW-0.7,-10.7,-FW,110.7,wl);gquad(FW,-10.7,FW+0.7,110.7,wl);gquad(-FW,-10.7,FW,-10,wl);gquad(-FW,110,FW,110.7,wl);
  for(let z=0;z<=100;z+=5){const w=(z===0||z===100)?0.22:0.1;gquad(-FW,z-w,FW,z+w,'rgba(255,255,255,.88)');}
  ctx.beginPath();
  for(let z=1;z<100;z++){if(z%5===0)continue;const dz=cam.yaw?toCam(0,0,z)[2]:z-cam.z;if(dz<2||dz>(cam.yaw?120:75))continue;
    for(const sg of [[-FW,-FW+0.7],[-3.4,-2.7],[2.7,3.4],[FW-0.7,FW]]){const a=projW(sg[0],0,z),b=projW(sg[1],0,z);if(a&&b){ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);}}}
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=Math.max(1,DPR);ctx.stroke();
  for(let yl=10;yl<=90;yl+=10){const dz=cam.yaw?toCam(0,0,yl)[2]:yl-cam.z;if(dz<4||dz>(cam.yaw?130:85))continue;const n=String(yl<=50?yl:100-yl),t=n[0]+' '+n[1],c='rgba(255,255,255,.85)';
    textQuad(t,[-15.2,0,yl+3.2],[-15.2,0,yl-3.2],[-17.6,0,yl+3.2],2.67,c);
    textQuad(t,[15.2,0,yl-3.2],[15.2,0,yl+3.2],[17.6,0,yl-3.2],2.67,c);}
  const ec=lum(T.c1)>0.5?'#16181c':(lum(T.c2)>0.35?T.c2:'#ffffff'),name=T.name.toUpperCase();
  textQuad(name,[-20,0,108.3],[20,0,108.3],[-20,0,101.7],6.06,ec);textQuad(name,[-20,0,-1.7],[20,0,-1.7],[-20,0,-8.3],6.06,ec);}
function addPosts(z){const M=mT(0,0,z),c='#f0cf2e';addBox(M,0,1.67,0,0.1,1.67,0.1,c);addBox(M,0,3.38,0,3.14,0.09,0.09,c);addBox(M,-3.08,8.4,0,0.08,5,0.08,c);addBox(M,3.08,8.4,0,0.08,5,0.08,c);}

// ===== player: tapered limbs, shaped torso and pads, rounded helmet with facemask, on a jointed skeleton =====
function drawPlayer(e){const p=e.pose,k=e.kit;
  const hip=Math.max(0.5*Math.cos(p.lTh)+0.5*Math.cos(p.lTh-p.lKn),0.5*Math.cos(p.rTh)+0.5*Math.cos(p.rTh-p.rKn))+0.07;
  const R=mMul(mT(RX(e.x),(e.y||0)+p.hop+p.fall*0.22,RZ(e.z)),mMul(mRY(e.dir+(FLIP?Math.PI:0)),mMul(mRZ(p.roll),mRX(p.fall*1.5*e.fallDir))));
  for(const s of [-1,1]){const th=s<0?p.lTh:p.rTh,kn=s<0?p.lKn:p.rKn;
    const Mt=mMul(R,mMul(mT(s*0.13,hip,0),mRX(-th)));addPrism(Mt,[[-0.5,0.08,0.085],[0,0.118,0.128]],k.pants);
    const Ms=mMul(Mt,mMul(mT(0,-0.5,0),mRX(kn)));addPrism(Ms,[[-0.46,0.052,0.058],[-0.17,0.084,0.094],[0,0.078,0.083]],k.socks);addBox(Ms,0,-0.5,0.07,0.062,0.045,0.14,k.shoes);}
  const U=mMul(R,mMul(mT(0,hip,0),mRX(p.lean)));
  addPrism(U,[[-0.1,0.17,0.118,0.04],[0.1,0.185,0.13,0.04]],k.pants);
  addPrism(U,[[0.1,0.185,0.13,0.04],[0.52,0.25,0.155,0.05]],k.jersey,{t:e.num,col:k.num,name:e.nm,cap:e.cap});
  addPrism(U,[[0.5,0.35,0.165,0.07],[0.63,0.3,0.15,0.09]],k.pads,null,true);
  const Hd=mMul(U,mMul(mT(0,0.64,0),mRX(-p.lean*0.6)));
  addPrism(Hd,[[0,0.125,0.145,0.055,0.01],[0.1,0.185,0.2,0.075,0.01],[0.25,0.185,0.2,0.075,0.01],[0.36,0.115,0.135,0.06,0]],k.helmet,null,true);
  addBox(Hd,0,0.115,0.2,0.1,0.07,0.012,e.skin);addBox(Hd,0,0.075,0.228,0.115,0.011,0.011,k.mask);addBox(Hd,0,0.135,0.228,0.115,0.011,0.011,k.mask);
  addBox(Hd,0,0.366,0,0.03,0.006,0.115,k.stripe);
  for(const s of [-1,1]){const ar=s<0?p.lArm:p.rArm,el=s<0?p.lEl:p.rEl;
    const Ma=mMul(U,mMul(mT(s*0.34,0.58,0),mMul(mRZ(s*p.spread),mRX(-ar))));addPrism(Ma,[[-0.18,0.074,0.08],[0.03,0.09,0.095]],k.sleeve);addPrism(Ma,[[-0.36,0.058,0.062],[-0.18,0.07,0.074]],e.skin);
    const Mf=mMul(Ma,mMul(mT(0,-0.36,0),mRX(-el)));addPrism(Mf,[[-0.3,0.045,0.05],[0,0.058,0.062]],e.skin);addBox(Mf,0,-0.35,0,0.045,0.055,0.05,k.glove);}
  e.R=R;e.hip=hip;}
function ring(x,z,rYd,col,lw){const s=projW(RX(x),0.02,RZ(z));if(!s)return;const r=cam.F*rYd/s[2];ctx.beginPath();ctx.ellipse(s[0],s[1],r,r*0.42,0,0,6.2832);ctx.strokeStyle=col;ctx.lineWidth=lw*DPR;ctx.stroke();}

// Rain streaks or snowflakes drawn over the field.
function drawWeather(g){const w=g.wx;if(!w||w.indoor||w.sky==='clear')return;const t=g.now,n=w.sky==='rain'?170:120,dx=(w.wdir||1)*(w.wind||0)*(FLIP?-1:1);
  if(w.sky==='rain'){ctx.strokeStyle='rgba(215,228,240,.5)';ctx.lineWidth=1.5*DPR;ctx.beginPath();for(let i=0;i<n;i++){const a=(i*0.61803)%1,b=(i*0.7548)%1,y=((b+t*1.6)%1)*H,x=((a+t*dx*0.004)%1+1)%1*W,l=16*DPR;ctx.moveTo(x,y);ctx.lineTo(x+dx*0.6*DPR,y+l);}ctx.stroke();}
  else{ctx.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<n;i++){const a=(i*0.61803)%1,b=(i*0.7548)%1,s=(1+(i%3))*DPR,y=((b+t*(0.12+(i%3)*0.05))%1)*H,x=(((a+Math.sin(t*1.3+i)*0.01+t*dx*0.002)%1)+1)%1*W;ctx.fillRect(x,y,s,s);}}}
function renderGame(){const g=gm;if(!g||!ctx)return;setCam();ctx.setTransform(1,0,0,1,0,0);
  drawBackdrop(g.home);drawField(g.home);
  const live=g.phase==='live',uo=g.poss==='U',scrim=!g.ko&&g.phase!=='card';
  if(g.ents.length&&scrim){const lz=RZ(g.pos),fz=RZ(g.pos+g.toGo);gquad(-FW,lz-0.13,FW,lz+0.13,'rgba(46,110,255,.8)');if(g.pos+g.toGo<100&&!g.conv&&!g.kanim&&g.phase!=='kick')gquad(-FW,fz-0.13,FW,fz+0.13,'rgba(244,196,48,.9)');}
  if(g.phase==='presnap'&&uo&&!g.ko&&!g.two&&!g.drillHide){
    const pf=g.pro&&g.pro.pos!=='QB';for(const e of g.elig){if(pf&&e.rp.id!==g.pro.id)continue;const col=pf?'#f4c430':RCOL[(e.key-1)%5];let px=e.x,pz=e.z;for(const w of e.route){gline(px,pz,w.x,w.z,pf?0.32:0.22,col);px=w.x;pz=w.z;}ring(px,pz,pf?0.7:0.5,col,2.5);}
    if(g.runPath){const P=g.runPath;for(let i=1;i<P.length;i++)gline(P[i-1][0],P[i-1][1],P[i][0],P[i][1],0.26,RCOL[2]);ring(P[P.length-1][0],P[P.length-1][1],0.5,RCOL[2],2.5);}}
  ctx.fillStyle='rgba(0,0,0,.26)';
  for(const e of g.ents){const s=projW(RX(e.x),0,RZ(e.z));if(!s)continue;const r=cam.F*0.55/s[2];ctx.beginPath();ctx.ellipse(s[0],s[1],r,r*0.4,0,0,6.2832);ctx.fill();}
  const b=g.ball;
  for(const e of g.ents)if(e.zone&&!e.down){ring(e.x,e.z,0.62,'rgba(255,214,64,.95)',2);ring(e.x,e.z,0.95,'rgba(255,214,64,.55)',1.5);}
  if(live){const car=g.carrier||(b&&b.fly&&!b.ko?b.target:null),pc=c=>g.two&&c.team==='A'?'rgba(255,140,80,.95)':'rgba(90,200,255,.95)';if((uo||g.two)&&car)ring(car.x,car.z,0.85,'rgba(244,196,48,.95)',2.5);for(const c of [g.ctl,g.ctl2])if(c&&c!==car&&!g.pro)ring(c.x,c.z,0.85,pc(c),2.5);
    if(b&&b.fly){ring(b.land.x,b.land.z,0.9,'rgba(255,255,255,.9)',2);ring(b.land.x,b.land.z,0.35,'rgba(255,255,255,.9)',2);}}
  else if((!uo||g.two)&&g.ctl&&g.phase==='presnap'&&!g.pro)ring(g.ctl.x,g.ctl.z,0.85,g.two&&g.ctl.team==='A'?'rgba(255,140,80,.95)':'rgba(90,200,255,.95)',2.5);
  for(const e of g.ents)drawPlayer(e);
  if(b){let bx,by,bz,yaw=0,pit=0;
    if(b.held&&b.held.R){const h=b.held;const w=h.anim==='carry'||h.anim==='down'?mApply(h.R,0.3,h.hip+0.3,0.22):mApply(h.R,0.05,h.hip+0.45,0.3);bx=w[0];by=w[1];bz=w[2];yaw=h.dir+(FLIP?Math.PI:0);}
    else if(!b.held){bx=RX(b.x);by=b.y;bz=RZ(b.z);yaw=Math.atan2(RX(b.vx||0),FLIP?-(b.vz||1):(b.vz||1));pit=b.spin?g.now*14:-Math.atan2(b.vy||0,Math.hypot(b.vx||0,b.vz||0)||1);}
    if(bx!==undefined){const Mb=mMul(mT(bx,by,bz),mMul(mRY(yaw),mRX(pit)));addPrism(mMul(Mb,mRX(1.5708)),[[-0.19,0.03,0.03,0.012],[-0.07,0.085,0.085,0.035],[0.07,0.085,0.085,0.035],[0.19,0.03,0.03,0.012]],'#7a4a26');}}
  if(g.flag){const f=g.flag,a=Math.min(1,(g.now-f.t)/0.5),y=Math.sin(a*3.1416)*2.2+0.06;addBox(mMul(mT(RX(f.x),y,RZ(f.z)),mRY(g.now*(a<1?9:0)+0.6)),0,0,0,0.2,0.03,0.16,'#ffd400');}
  addPosts(110);addPosts(-10);flushFaces();drawWeather(g);
  ctx.textAlign='center';ctx.textBaseline='middle';
  // gold X over players who are in the zone
  ctx.font='700 '+Math.round(15*DPR)+'px '+FONT_D;
  for(const e of g.ents)if(e.zone&&!e.down&&e.rp.pos!=='OL'){const s=projW(RX(e.x),2.55+(e.y||0),RZ(e.z));if(s&&s[2]<60){ctx.lineWidth=3*DPR;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.strokeText('X',s[0],s[1]);ctx.fillStyle='#ffd640';ctx.fillText('X',s[0],s[1]);}}
  if((uo||g.two)&&!g.ko&&!(g.pro&&g.pro.pos!=='QB')&&((live&&g.mode==='pocket'&&!g.throwing)||g.phase==='presnap')){
    for(const e of g.elig){const s=projW(e.x,2.9,e.z);e.sx=null;if(!s)continue;e.sx=s[0];e.sy=s[1];const dn=openness(e),rc=RCOL[(e.key-1)%5];
      const col=g.phase==='presnap'?rc:dn>3.2?'#4cc47a':dn>1.7?'#f4c430':'#e5604f',r=11*DPR;
      ctx.beginPath();ctx.arc(s[0],s[1]-r,r,0,6.2832);ctx.fillStyle=col;ctx.fill();ctx.lineWidth=3*DPR;ctx.strokeStyle=g.phase==='presnap'?'rgba(0,0,0,.55)':rc;ctx.stroke();ctx.fillStyle='#141a12';ctx.fillText(String(g.two&&!uo?(e.key+5)%10:e.key),s[0],s[1]-r+DPR);}}
  else for(const e of g.elig)e.sx=null;
  if(g.pro&&!g.ko&&(live||g.phase==='presnap'||g.phase==='dead')){const pe=proEnt();if(pe&&!pe.down){const s=projW(RX(pe.x),2.95+(pe.y||0),RZ(pe.z));if(s){const r=11*DPR;ctx.beginPath();ctx.moveTo(s[0]-r,s[1]-r*1.6);ctx.lineTo(s[0]+r,s[1]-r*1.6);ctx.lineTo(s[0],s[1]);ctx.closePath();ctx.fillStyle='#f4c430';ctx.fill();ctx.lineWidth=2*DPR;ctx.strokeStyle='rgba(0,0,0,.6)';ctx.stroke();
      ctx.font='800 '+Math.round(11*DPR)+'px '+FONT_D;ctx.lineWidth=3*DPR;ctx.strokeText('YOU',s[0],s[1]-r*2.5);ctx.fillStyle='#f4c430';ctx.fillText('YOU',s[0],s[1]-r*2.5);}}}
  else if((!uo||g.two||g.loose)&&(live||g.phase==='presnap'))for(const cc of [g.ctl,g.ctl2]){if(!cc||cc===g.carrier&&!g.ret)continue;const s=projW(RX(cc.x),2.9,RZ(cc.z));if(s){const r=8*DPR;ctx.beginPath();ctx.moveTo(s[0]-r,s[1]-r*1.6);ctx.lineTo(s[0]+r,s[1]-r*1.6);ctx.lineTo(s[0],s[1]);ctx.closePath();ctx.fillStyle=g.two&&cc.team==='A'?'#ff8c50':'#5ac8ff';ctx.fill();ctx.lineWidth=2*DPR;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.stroke();}}}
