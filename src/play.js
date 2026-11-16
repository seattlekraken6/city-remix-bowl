// ===== the match: you run the offense, and (optionally) control a defender when the other team has the ball =====
const QLEN=240;
const SKINS=['#f0c7a2','#d8a374','#b87a50','#8e5a3a','#6c4327','#52331f'];
// routes: [toward own sideline (+) or middle (-), depth, stop?] from the receiver's spot
const PLAYS=[
 {n:'Slants',t:'pass',d:'Quick throws inside',r:{WR1:[[0,2],[-8,9],[-16,16]],WR2:[[0,2],[-8,9],[-16,16]],WR3:[[0,6],[-0.5,5,1]],TE:[[0,4],[8,5],[14,5]],RB:[[5,0.5],[10,3]]}},
 {n:'Verticals',t:'pass',d:'Four deep shots',r:{WR1:[[0,45]],WR2:[[0,45]],WR3:[[-1,45]],TE:[[1,40]],RB:[[5,0.5],[9,2,1]]}},
 {n:'Mesh',t:'pass',d:'Crossers underneath',r:{WR1:[[0,3],[-28,6]],WR2:[[0,12],[-16,12]],WR3:[[0,9],[9,20]],TE:[[0,5],[-16,7]],RB:[[6,0],[11,3]]}},
 {n:'Deep Post',t:'pass',d:'Big play over the middle',r:{WR1:[[0,14],[-11,32]],WR2:[[0,16],[2,13,1]],WR3:[[0,8],[9,8]],TE:[[0,3],[-10,5]],RB:[[5,0.5],[10,3]]}},
 {n:'Curls',t:'pass',d:'Sit down at the sticks',r:{WR1:[[0,12],[-1.5,10,1]],WR2:[[0,12],[-1.5,10,1]],WR3:[[6,2],[8,26]],TE:[[0,7],[0,6,1]],RB:[[-5,0.5],[-10,3]]}},
 {n:'Inside Zone',t:'run',d:'Hit the hole up the middle'},
 {n:'Outside Toss',t:'run',toss:1,d:'Race to the edge'}];
const DCALLS=[{n:'Man Cover',d:'Balanced. One linebacker watches the middle.'},{n:'Blitz',d:'Send two linebackers. Fast pressure, thin coverage.'},{n:'Deep Zone',d:'Both safeties stay deep. Gives up short throws.'}];
let gm=null,rafOn=false,lastTs=0,hudStr='',flashT=0;
const inp={k:{},kx:0,kz:0,sx:0,sz:0,stick:null};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const isOL=e=>e.role==='LT'||e.role==='LG'||e.role==='C'||e.role==='RG'||e.role==='RT';
const uoff=()=>gm.poss==='U';

function makeKit(T,key){const u=UNI[T.abbr][key]||UNI[T.abbr].H,j=u[0],p=u[2];
  return {jersey:j,pads:j,sleeve:j,num:u[1],pants:p,socks:lum(j)>0.8?(lum(p)>0.8?u[4]:p):j,helmet:u[3],stripe:u[4],shoes:'#18191b'};}
function lineup(T){const s=p=>starters(T,p);return {QB:s('QB')[0],RB:s('RB')[0],WR:s('WR'),TE:s('TE')[0],OL:s('OL'),K:s('K')[0],DL:s('DL'),LB:s('LB'),CB:s('CB'),S:s('S')};}
function mkEnt(side,team,role,rp,x,z,kit,stance){const zs=gm.zone[rp.id];
  return {side,team,role,rp,x,z:Math.min(z,108),vx:0,vz:0,dir:side==='O'?0:Math.PI,max:5.2+(rp.spd-50)*0.07,kit,skin:SKINS[rp.id%SKINS.length],num:String(rp.num),
  zone:!!rp.xf&&(rp.pos==='OL'||!!(zs&&zs.on)),
  pose:{lean:0,lTh:0,rTh:0,lKn:0,rKn:0,lArm:0,rArm:0,lEl:0,rEl:0,fall:0,hop:0,spread:0.12},ph:Math.random()*6,anim:'idle',animT:0,stance,down:false,stun:0,eng:null,engT:0,shedAt:0,freeUntil:0,tklCd:0,fallDir:1,
  face:null,route:null,wp:0,cutT:-9,blk:null,beat:0,juke:0,jukeCd:0,slow:0,cover:null,cush:0,lag:0.2,react:0.25,blitz:false,dbl:false,deepSide:null,deepCush:false,zx:null,lunge:0,lx:0,lz:0,key:0,sx:null,sy:0,R:null,hip:1};}

function startGame(opp,userHome,uU,uO){const U=S.teams[S.user];
  gm={U,O:opp,userHome,home:userHome?U:opp,us:0,them:0,q:1,clock:QLEN,exp:false,poss:'U',pos:25,down:1,toGo:10,bx:0,phase:'huddle',ents:[],by:{},elig:[],ball:null,carrier:null,ctl:null,t:0,mode:'pocket',
    play:PLAYS[0],dcall:0,after:null,card:null,kick:null,msg:'',zmsg:'',zone:{},playDef:!!S.playDef,camSnap:true,
    st:{att:0,cmp:0,yds:0,td:0,int:0,rush:0,sk:0,dSk:0,dInt:0,dYds:0},kitU:makeKit(U,uU),kitO:makeKit(opp,uO),LU:lineup(U),LO:lineup(opp)};
  buildCrowd(gm.home);startDrive('U',25);showGame();}
function startDrive(side,pos){gm.poss=side;FLIP=side==='A';gm.camSnap=true;gm.pos=clamp(Math.round(pos),1,99);gm.down=1;gm.toGo=Math.min(10,100-gm.pos);gm.bx=0;setHuddle();
  if(gm&&gm.phase==='huddle'&&gm.playDef)flash(side==='A'?'Defense':'Offense');}
function setHuddle(){if(gm.poss==='A'){if(aiFourth())return;setFormation(aiPlay());}else setFormation(gm.play);gm.phase='huddle';renderPanel();}
function callPlay(i){if(!gm||gm.phase!=='huddle'||!uoff())return;setFormation(PLAYS[i]);gm.phase='presnap';renderPanel();}
function callDef(i){if(!gm||gm.phase!=='huddle'||uoff())return;gm.dcall=i;gm.phase='presnap';renderPanel();}
function aiPlay(){const d=gm.down,tg=gm.toGo;let pp=0.56;if(d>=3&&tg>=6)pp=0.88;else if(tg<=2)pp=0.35;else if(d===2&&tg>=8)pp=0.7;
  if(gm.q>=4&&gm.them<gm.us)pp=Math.max(pp,0.75);
  if(Math.random()<pp)return PLAYS[pick(tg>=12?[1,3,4,2]:tg<=4?[0,2,4]:[0,1,2,3,4])];return PLAYS[Math.random()<0.6?5:6];}
function buildRoute(e,wps){const sg=(e.x-gm.bx)>=0?1:-1;
  const pts=wps.map(w=>({x:clamp(e.x+w[0]*sg,-25.3,25.3),z:Math.min(108.5,e.z+w[1]),stop:!!w[2]}));const last=pts[pts.length-1];
  if(!last.stop){const prev=pts.length>1?pts[pts.length-2]:{x:e.x,z:e.z};let dx=last.x-prev.x,dz=last.z-prev.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;let k=40;
    if(dx>0.01)k=Math.min(k,(25.3-last.x)/dx);if(dx<-0.01)k=Math.min(k,(-25.3-last.x)/dx);if(dz>0.01)k=Math.min(k,(108.5-last.z)/dz);if(dz<-0.01)k=Math.min(k,(last.z-(gm.pos-3))/-dz);
    if(k>0.6)pts.push({x:last.x+dx*k,z:last.z+dz*k,stop:true});else last.stop=true;}
  return pts;}
function setFormation(play){const z0=gm.pos,bx=gm.bx,uo=uoff(),Lo=uo?gm.LU:gm.LO,Ld=uo?gm.LO:gm.LU,ko=uo?gm.kitU:gm.kitO,kd=uo?gm.kitO:gm.kitU,to=uo?'U':'A',td=uo?'A':'U',E=[],by={};gm.ents=E;gm.by=by;gm.play=play;
  const add=(side,role,rp,x,z,st)=>{const e=mkEnt(side,side==='O'?to:td,role,rp,x,z,side==='O'?ko:kd,st);E.push(e);by[role]=e;return e;};
  ['LT','LG','C','RG','RT'].forEach((r,i)=>add('O',r,Lo.OL[i],bx+(i-2)*1.45,z0-0.7,'s3'));
  add('O','TE',Lo.TE,bx+4.5,z0-0.7,'s3');add('O','WR1',Lo.WR[0],-19,z0-0.6,'s2');add('O','WR2',Lo.WR[1],19,z0-1,'s2');add('O','WR3',Lo.WR[2],bx-9.5,z0-1,'s2');
  add('O','QB',Lo.QB,bx,z0-5,'qb');add('O','RB',Lo.RB,bx+(play.toss?3.6:1.8),z0-5.3,'s2');
  [-4.3,-1.45,1.45,4.3].forEach((x,i)=>add('D','DL'+(i+1),Ld.DL[i],bx+x,z0+0.9,'s3'));
  add('D','LB1',Ld.LB[0],bx-5,z0+4.5,'s2');add('D','LB2',Ld.LB[1],bx,z0+4.8,'s2');add('D','LB3',Ld.LB[2],bx+5.5,z0+4.5,'s2');
  add('D','CB1',Ld.CB[0],-18.4,z0+5.5,'s2');add('D','CB2',Ld.CB[1],18.4,z0+5.5,'s2');add('D','SS',Ld.S[0],bx-9,z0+6.5,'s2');add('D','FS',Ld.S[1],bx+2,z0+14,'s2');
  gm.elig=[];
  if(play.t==='pass'){for(const r in play.r){by[r].route=buildRoute(by[r],play.r[r]);gm.elig.push(by[r]);}
    gm.elig.sort((a,b)=>a.x-b.x).forEach((e,i)=>{e.key=i+1;});}
  gm.ball={held:by.QB};gm.carrier=null;gm.ctl=uo?null:by.LB2;}
function snap(){if(!gm||gm.phase!=='presnap')return;const by=gm.by,play=gm.play,uo=uoff(),k=dk();gm.phase='live';gm.t=0;gm.handed=false;gm.scr=false;gm.caught=false;gm.thrownAt=null;gm.throwing=null;gm.swatT=null;gm.tkBy=null;gm.intBy=null;
  gm.carrier=by.QB;gm.ball={held:by.QB};gm.mode='pocket';gm.aiDec=rnd(1.5,2.4)-0.1*k;gm.aiAware=Math.random()<0.55+0.15*k;
  let call=gm.dcall;if(uo){const r=Math.random();call=r<0.16+0.03*k?1:(r<0.32&&gm.toGo>=8?2:0);}
  for(const m of [['CB1','WR1'],['CB2','WR2'],['SS','WR3'],['LB3','TE'],['LB2','RB']])by[m[0]].cover=by[m[1]];
  by.FS.deepSide=0;by.LB1.zx=by.LB1.x-gm.bx;
  if(call===1){by.LB1.blitz=play.t==='pass'||!uo;if(!uo||k>=1){by.LB2.blitz=true;by.LB2.cover=null;}}
  else if(call===2){by.SS.cover=null;by.SS.deepSide=-1;by.FS.deepSide=1;by.LB1.cover=by.WR3;by.CB1.deepCush=by.CB2.deepCush=true;by.SS.z+=5;by.CB1.z+=2;by.CB2.z+=2;}
  for(const e of gm.ents){e.react=0.3+(92-e.rp.ovr)/120;
    if(e.cover){e.cush=e.z-e.cover.z;e.lag=clamp(0.42-e.rp.ovr/300-(e.zone&&e.rp.pos==='CB'?0.1:0)+(uo?-0.04:0.04)*k,0.02,0.4);}}
  by.LT.blk=by.DL1;by.LG.blk=by.DL2;by.RG.blk=by.DL3;by.RT.blk=by.DL4;
  if(play.t==='pass'){by.C.blk=by.LB1.blitz?by.LB1:by.DL2;by.DL2.dbl=!by.LB1.blitz;}
  else{by.C.blk=by.LB2;by.TE.blk=by.LB3;by.WR1.blk=by.CB1;by.WR2.blk=by.CB2;by.WR3.blk=by.SS;}
  inp.sx=inp.sz=0;inp.stick=null;renderPanel();}

// ----- movement -----
function accel(e,wx,wz,dt){const ax=wx-e.vx,az=wz-e.vz,l=Math.hypot(ax,az),m=24*dt;if(l<=m){e.vx=wx;e.vz=wz;}else{e.vx+=ax/l*m;e.vz+=az/l*m;}}
function seek(e,tx,tz,sp,dt){const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz);if(l>0.12){const s=Math.min(sp,l*7);accel(e,dx/l*s,dz/l*s,dt);}else accel(e,0,0,dt);}
function runRoute(e,dt){const r=e.route;if(e.wp>=r.length){accel(e,0,0,dt);e.face=gm.by.QB;return;}
  let w=r[e.wp];let dx=w.x-e.x,dz=w.z-e.z,l=Math.hypot(dx,dz);
  if(l<0.55){e.wp++;e.cutT=gm.t;if(e.wp>=r.length){accel(e,0,0,dt);return;}w=r[e.wp];dx=w.x-e.x;dz=w.z-e.z;l=Math.hypot(dx,dz)||1;}
  if(w.stop&&e.wp===r.length-1)seek(e,w.x,w.z,e.max,dt);else accel(e,dx/l*e.max,dz/l*e.max,dt);}
function predictPos(e,T){let x=e.x,z=e.z,wp=e.wp;const r=e.route;if(!r)return {x:x+e.vx*T,z:z+e.vz*T};let rem=T*e.max*0.96;
  while(rem>0&&wp<r.length){const w=r[wp],d=Math.hypot(w.x-x,w.z-z);if(d<=rem){x=w.x;z=w.z;rem-=d;wp++;}else{x+=(w.x-x)/d*rem;z+=(w.z-z)/d*rem;rem=0;}}
  return {x,z};}
function userInput(){let ix=inp.kx+inp.sx,iz=inp.kz+inp.sz;if(FLIP){ix=-ix;iz=-iz;}const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l;}return [ix,iz,l];}
function control(e,dt,mode){const [ix0,iz0,l]=userInput();let ix=ix0,iz=iz0;
  if(e===gm.by.QB&&gm.play.t==='run'){accel(e,0,0,dt);return;}
  let sp=e.max*(mode==='pocket'?0.8:0.93);if(e.slow>gm.t)sp*=0.5;
  if(l<0.1){if(mode==='pocket'){accel(e,0,0,dt);e.face={x:e.x,z:e.z+10};return;}ix=0;iz=1;}
  accel(e,ix*sp,iz*sp,dt);
  if(mode==='pocket')e.face=gm.throwing?gm.throwing.rec:{x:e.x+ix*3,z:e.z+10};}
function juke(){const c=gm&&gm.carrier;if(!c||gm.phase!=='live'||!uoff()||gm.mode!=='run'||c.jukeCd>gm.t)return;c.juke=gm.t+0.34;c.jukeCd=gm.t+2.4;
  const ix=inp.kx+inp.sx;c.vx+=(ix>0.2?1:ix<-0.2?-1:(Math.random()<0.5?1:-1))*8;}
function blockDur(b,d){const diff=(b.rp.ovr-d.rp.ovr)/55;let base;
  if(gm.play.t==='pass'&&gm.mode==='pocket'&&isOL(b))base=2.5+Math.random()*2.5+(d.dbl?0.9:0);
  else if(isOL(b))base=1.0+Math.random()*1.7;else if(b.role==='TE')base=1.0+Math.random()*1.2;else base=0.5+Math.random()*0.9;
  base*=1+(b.team==='U'?-0.1:0.1)*dk();if(b.zone&&b.rp.pos==='OL')base*=1.3;if(d.zone&&d.rp.pos==='DL')base*=0.65;
  return Math.max(0.5,base*(1+diff));}
function doBlock(e,dt,prot){const t=gm.t;let d=e.blk;
  if(!d||d.down||(d.eng&&d.eng!==e)||(d.freeUntil>t&&d.eng!==e)){d=null;let best=6;
    for(const x of gm.ents){if(x.side!=='D'||x.down||x.eng||x.freeUntil>t)continue;const dd=dist(e,x);if(dd<best){best=dd;d=x;}}e.blk=d;}
  if(!d){accel(e,0,0,dt);return;}
  const px=prot.x-d.x,pz=prot.z-d.z,l=Math.hypot(px,pz)||1;
  seek(e,d.x+px/l*0.95,d.z+pz/l*0.95,e.max*(e.beat>t?0.4:0.92),dt);
  if(!d.eng&&d.freeUntil<=t&&dist(e,d)<1.3){d.eng=e;d.engT=t;d.shedAt=t+blockDur(e,d);}
  if(dist(e,d)<2.2){e.anim='block';e.face=d;}else if(e.anim==='block')e.anim='idle';}
function cover(d,dt){const r=d.cover,t=gm.t;if(r.down){accel(d,0,0,dt);return;}
  const rs=Math.hypot(r.vx,r.vz);d.cush=Math.max(d.deepCush?2.5:(rs>3?-0.7:0.8),d.cush-dt*(rs<2?7:2));
  if(t<r.cutT+d.lag)return;
  seek(d,r.x+r.vx*0.22,Math.min(109,r.z+r.vz*0.22+d.cush),d.max*(0.9+d.rp.ovr/1000),dt);if(d.cush>1)d.face=gm.by.QB;}
function deep(d,dt){let dp=null;const sd=d.deepSide;for(const e of gm.elig){if(sd===1&&e.x<gm.bx)continue;if(sd===-1&&e.x>=gm.bx)continue;if(!dp||e.z>dp.z)dp=e;}
  seek(d,dp?dp.x*(sd?0.8:0.5):gm.bx+sd*10,Math.min(108,Math.max(gm.pos+13,(dp?dp.z:0)+3)),d.max*0.95,dt);d.face=gm.by.QB;}
function pursue(d,c,dt){const dd=dist(d,c),tt=Math.min(1.1,dd/Math.max(3,d.max));seek(d,c.x+c.vx*tt*0.85,c.z+c.vz*tt*0.85,d.max,dt);}
function tryTackle(d,c){const t=gm.t,lg=d.lunge>t;if(d.tklCd>t||dist(d,c)>(d.eng?0.85:lg?1.6:1.12))return;d.tklCd=t+0.7;
  const qbp=c===gm.by.QB&&gm.mode==='pocket';
  let p=qbp?0.9:0.76+(d.rp.ovr-c.rp.ovr)/220+(c.team==='U'?0.05:-0.05)*dk();
  if(!qbp){if(c.juke>t)p-=0.22;if(c.zone&&c.rp.pos==='RB')p-=0.18;}
  if(d.zone&&d.rp.pos==='LB')p+=0.15;if(d===gm.ctl)p+=lg?0.18:0.1;if(d.eng)p*=0.22;
  if(Math.random()<clamp(p,0.08,0.97)){c.down=true;c.anim='down';d.down=true;d.anim='dive';d.lunge=0;gm.tkBy=d;
    const fx=Math.sin(c.dir),fz=Math.cos(c.dir);c.fallDir=((d.x-c.x)*fx+(d.z-c.z)*fz)>0.4?-1:1;
    endPlay(c===gm.by.QB&&c.z<gm.pos?'sack':'tackle',c.z);}
  else if(d.eng){c.slow=t+0.2;}else{d.stun=t+0.75;d.lunge=0;d.anim='dive';c.slow=t+0.15;flash(uoff()?'Broken tackle!':'Missed tackle');}}
function separate(){const E=gm.ents,car=gm.carrier;
  for(let i=0;i<E.length;i++){const a=E[i];if(a.down)continue;for(let j=i+1;j<E.length;j++){const b=E[j];if(b.down)continue;
    if((a===car&&b.side==='D')||(b===car&&a.side==='D'))continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;
    if(d2<0.64&&d2>1e-6){const d=Math.sqrt(d2),p=(0.8-d)/2,ux=dx/d,uz=dz/d;a.x-=ux*p;a.z-=uz*p;b.x+=ux*p;b.z+=uz*p;}}}}

// ----- the other team's offense -----
function nearestRusher(q){let nd=null,dn=99;for(const d of gm.ents){if(d.side!=='D'||d.down||d.eng||d.stun>gm.t)continue;const dd=dist(d,q);if(dd<dn){dn=dd;nd=d;}}return [nd,dn];}
function aiQB(qb,dt){const t=gm.t,[nd,dn]=nearestRusher(qb);let tx=gm.bx,tz=gm.pos-7.5;
  if(nd&&dn<4.5){tx=qb.x+(qb.x>=nd.x?1:-1)*3;tz=gm.pos-8.5;}
  seek(qb,clamp(tx,gm.bx-7,gm.bx+7),tz,qb.max*0.7,dt);qb.face=gm.throwing?gm.throwing.rec:{x:qb.x,z:qb.z+10};
  if(gm.throwing)return;const hot=gm.aiAware&&dn<2.2&&t>1.0;
  if(t<gm.aiDec&&!hot)return;
  let best=null,bs=-9,bo=0;for(const e of gm.elig){const o=openness(e),dp=e.z-gm.pos,sc=Math.min(o,5)+dp*0.07+(dp>=gm.toGo?0.8:0)+rnd(-0.6,0.6);if(sc>bs){bs=sc;best=e;bo=o;}}
  if(bo>1.7||hot||t>gm.aiDec+1.1){if(bo<0.8&&!hot){endPlay('inc',0,'Thrown away');return;}throwTo(best);}}
function aiRun(c,dt){const t=gm.t;if(c===gm.by.QB&&gm.play.t==='run'){accel(c,0,0,dt);return;}
  let dx=0,dz=1,nd=null,dn=99;
  for(const d of gm.ents){if(d.side!=='D'||d.down||d.stun>t)continue;const ox=c.x-d.x,oz=c.z-d.z,dd=Math.hypot(ox,oz);
    if(dd<7&&oz<1.5){dx+=(ox>=0?1:-1)*(7-dd)/7*1.6*(d.eng?0.4:1);if(!d.eng&&dd<dn){dn=dd;nd=d;}}}
  if(c.x>FW-3)dx-=1.6;if(c.x<-FW+3)dx+=1.6;const l=Math.hypot(dx,dz);let sp=c.max*0.95;if(c.slow>t)sp*=0.5;
  accel(c,dx/l*sp,dz/l*sp,dt);
  if(nd&&dn<1.9&&c.jukeCd<=t&&Math.random()<dt*(1.5+0.6*dk())){c.juke=t+0.34;c.jukeCd=t+2.6;c.vx+=(c.x>=nd.x?1:-1)*8;}}

// ----- playing defense -----
function userDefend(d,dt){const t=gm.t,c=gm.carrier;
  if(d.stun>t){accel(d,0,0,dt);return;}
  if(d.lunge){if(d.lunge>t){d.vx=d.lx*d.max*1.8;d.vz=d.lz*d.max*1.8;if(c)tryTackle(d,c);return;}d.lunge=0;d.stun=t+0.7;d.vx*=0.2;d.vz*=0.2;return;}
  if(d.eng){if(t>=Math.min(d.shedAt,(d.engT||t)+0.9)||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
    else{accel(d,0,0,dt);d.anim='block';d.face=d.eng;if(c&&gm.mode==='run')tryTackle(d,c);return;}}
  d.anim=gm.swatT!=null&&t-gm.swatT<0.45?'catch':'idle';
  const [ix,iz,l]=userInput();if(l<0.1)accel(d,0,0,dt);else accel(d,ix*d.max*1.03,iz*d.max*1.03,dt);
  if(c&&!(c===gm.by.QB&&gm.play.t==='run'&&!gm.handed))tryTackle(d,c);}
function dive(){const d=gm&&gm.ctl;if(!d||gm.phase!=='live'||uoff()||d.down||d.stun>gm.t||d.eng||d.lunge)return;
  const b=gm.ball;if(b&&b.fly){gm.swatT=gm.t;return;}
  const c=gm.carrier;let dx,dz;if(c&&dist(d,c)<5){dx=c.x+c.vx*0.15-d.x;dz=c.z+c.vz*0.15-d.z;}else{dx=d.vx;dz=d.vz;}const l=Math.hypot(dx,dz);if(l<0.1)return;
  d.lunge=gm.t+0.26;d.lx=dx/l;d.lz=dz/l;d.tklCd=0;d.anim='dive';}
function switchCtl(){if(!gm||uoff()||(gm.phase!=='live'&&gm.phase!=='presnap'))return;const b=gm.ball,c=gm.carrier,cur=gm.ctl;
  const tx=b&&b.fly?b.land.x:c?c.x:gm.bx,tz=b&&b.fly?b.land.z:c?c.z:gm.pos;
  const arr=gm.ents.filter(d=>d.side==='D'&&!d.down).sort((p,q)=>Math.hypot(p.x-tx,p.z-tz)-Math.hypot(q.x-tx,q.z-tz));if(arr.length<2)return;
  const nx=gm.phase==='presnap'?arr[(arr.indexOf(cur)+1)%arr.length]:(arr[0]===cur?arr[1]:arr[0]);if(cur)cur.lunge=0;gm.ctl=nx;}

// How open a receiver is: the smaller of his gap now and his gap a beat from now.
function openness(e){const f=predictPos(e,0.7);let dn=99;
  for(const d of gm.ents)if(d.side==='D'&&!d.down){const a=Math.hypot(d.x-e.x,d.z-e.z),b=Math.hypot(d.x+d.vx*0.5-f.x,d.z+d.vz*0.5-f.z);dn=Math.min(dn,a,b+0.6);}
  return dn;}
// ----- passing -----
function throwTo(rec){const qb=gm.by.QB;if(gm.phase!=='live'||gm.mode!=='pocket'||gm.throwing||gm.carrier!==qb)return;gm.throwing={rec,at:gm.t+0.2};qb.anim='throw';qb.animT=gm.t;}
function releaseBall(rec){const qb=gm.by.QB,rp=qb.rp,uo=uoff(),zq=qb.zone;let T=0.6,land,d=0;
  for(let i=0;i<4;i++){land=predictPos(rec,T);d=Math.hypot(land.x-qb.x,land.z-qb.z);T=Math.max(0.28,d/(clamp(17+d*0.32,17,27)+(rp.ovr-75)*0.08+(zq?3:0)));}
  const pres=gm.ents.some(x=>x.side==='D'&&!x.eng&&!x.down&&dist(x,qb)<2.6),mv=Math.hypot(qb.vx,qb.vz)>2.5;
  const sig=(0.28+d*0.022)*(1+(92-rp.ovr)/45)*(pres?1.7:1)*(mv?1.35:1)*(zq?0.6:1)*(1+(uo?0.1:-0.1)*dk());
  land.x=clamp(land.x+gauss()*sig,-28,28);land.z+=gauss()*sig;
  const x0=qb.x+0.3,z0=qb.z+0.3,y0=2.05,g=10.7;
  gm.ball={fly:true,x:x0,y:y0,z:z0,t:0,T,land,target:rec,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.45-y0)/T+0.5*g*T,g};
  gm.carrier=null;if(uo)gm.st.att++;gm.thrownAt=gm.t;
  if(!uo&&gm.ctl){let nd=null,dn=99;for(const x of gm.ents)if(x.side==='D'&&!x.down){const dd=Math.hypot(x.x-land.x,x.z-land.z);if(dd<dn){dn=dd;nd=x;}}
    if(nd&&nd!==gm.ctl&&Math.hypot(gm.ctl.x-land.x,gm.ctl.z-land.z)>dn+2){gm.ctl.lunge=0;gm.ctl=nd;}}}
function resolvePass(){const b=gm.ball,rec=b.target,L=b.land,dR=Math.hypot(rec.x-L.x,rec.z-L.z),uo=uoff(),k=dk()*(uo?1:-1);let dD=99,D=null;
  for(const x of gm.ents)if(x.side==='D'&&!x.down&&x.stun<=gm.t){const dd=Math.hypot(x.x-L.x,x.z-L.z);if(dd<dD){dD=dd;D=x;}}
  const inb=Math.abs(L.x)<=FW-0.1&&L.z<=110&&L.z>=-10,swat=!uo&&D&&D===gm.ctl&&gm.swatT!=null&&gm.t-gm.swatT<0.5&&dD<2.2;
  const im=(1+0.3*k)*(D&&D.zone&&D.rp.pos==='S'?2.5:1)*(swat?3:1);let out;
  if(dR<=1.6&&inb){const pInt=clamp((dD<1.0?(dD<dR?0.12:0.03):swat?0.05:0)*im,0,0.6),hands=rec.rp.ovr-(rec.role==='RB'||rec.role==='TE'?5:0);
    const pC=clamp(0.96-(96-hands)/200-(dD<0.8?0.3:dD<1.6?0.15:dD<2.6?0.04:0)-dR*0.05+(rec.zone?0.14:0)-(D&&D.zone&&D.rp.pos==='CB'&&dD<2.6?0.1:0)-0.04*k-(swat?0.3:0),0.05,0.97);
    out=Math.random()<pInt?'int':Math.random()<pC?'catch':(dD<1.8?'pbu':'drop');}
  else out=(dD<1.1&&inb&&Math.random()<Math.min(0.6,0.15*im))?'int':'miss';
  if(out==='catch'){rec.x=rec.x*0.4+L.x*0.6;rec.z=rec.z*0.4+L.z*0.6;rec.anim='carry';gm.carrier=rec;gm.ball={held:rec};gm.caught=true;if(uo)gm.st.cmp++;if(rec.z>=100)endPlay('td',100);}
  else if(out==='int'){D.anim='carry';gm.ball={held:D};gm.focus={x:D.x,z:D.z};gm.intBy=D;endPlay('int',L.z);}
  else{if(out==='pbu')zoneUp(D,2);else if(out==='drop')zoneOut(rec);
    endPlay('inc',0,out==='pbu'?(swat?'Swatted away!':'Broken up by #'+D.num):out==='drop'?'Dropped':(inb?'Incomplete':'Out of bounds'));}}

// ----- one simulation step while the ball is live -----
function stepLive(dt){gm.t+=dt;const t=gm.t,E=gm.ents,by=gm.by,qb=by.QB,los=gm.pos,play=gm.play,uo=uoff();
  for(const e of E)e.face=null;
  if(play.t==='run'&&!gm.handed&&t>=(play.toss?0.3:0.42)){gm.handed=true;gm.carrier=by.RB;gm.ball={held:by.RB};by.RB.anim='carry';}
  if(gm.throwing&&t>=gm.throwing.at){const r=gm.throwing.rec;gm.throwing=null;releaseBall(r);}
  if(play.t==='pass'&&gm.carrier===qb&&qb.z>los+0.4&&!gm.scr){gm.scr=true;gm.throwing=null;qb.anim='carry';}
  const car=gm.carrier,b=gm.ball;
  const mode=b.fly?'air':(play.t==='pass'&&car===qb&&!gm.scr?'pocket':'run');gm.mode=mode;
  for(const e of E){if(e.side!=='O'||e.down)continue;
    if(e===car){if(uo)control(e,dt,mode);else if(mode==='pocket')aiQB(e,dt);else aiRun(e,dt);if(gm.phase!=='live')return;continue;}
    if(e===qb){accel(e,0,0,dt);continue;}
    if(mode==='air'&&e===b.target){seek(e,b.land.x,b.land.z,e.max,dt);if(b.T-b.t<0.35)e.anim='catch';continue;}
    if(e.route&&mode!=='run'){runRoute(e,dt);continue;}
    doBlock(e,dt,car||qb);}
  for(const d of E){if(d.side!=='D'||d.down)continue;
    if(d===gm.ctl&&!uo){userDefend(d,dt);if(gm.phase!=='live')return;continue;}
    if(d.stun>t){accel(d,0,0,dt);continue;}
    if(d.eng){if(t>=d.shedAt||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
      else{const g=car||qb,bl=d.eng;if(play.t==='run'&&!gm.scr&&isOL(bl)&&g.z<d.z+1)accel(d,(d.x>=gm.bx?1:-1)*0.9,1.5+(bl.rp.ovr-d.rp.ovr)*0.02,dt);else seek(d,g.x,g.z,(isOL(bl)||bl.role==='TE')?0.9+(d.rp.ovr-70)*0.02:d.max*0.5,dt);
        d.anim='block';d.face=bl;if(mode==='run'&&car)tryTackle(d,car);if(gm.phase!=='live')return;continue;}}
    d.anim='idle';const rusher=d.role[0]==='D'||d.blitz;
    if(mode==='pocket'){
      if(rusher){seek(d,qb.x,qb.z,d.max*0.95,dt);tryTackle(d,qb);}
      else if(d.cover)cover(d,dt);else if(d.deepSide!=null)deep(d,dt);
      else{seek(d,gm.bx+(d.zx||0)*0.7+(qb.x-gm.bx)*0.4,los+6,d.max*0.6,dt);d.face=qb;}}
    else if(mode==='air'){const near=Math.hypot(d.x-b.land.x,d.z-b.land.z);
      if(rusher)accel(d,0,0,dt);
      else if(t>=gm.thrownAt+d.react&&(d.cover===b.target||((d.deepSide!=null||d.role==='LB1')&&near<11)||near<4.5))seek(d,b.land.x,b.land.z,d.max,dt);
      else if(d.cover)cover(d,dt);else if(d.deepSide!=null)deep(d,dt);else accel(d,0,0,dt);}
    else{const read=(play.t==='run'&&!gm.caught)?0.68+(90-d.rp.ovr)/100:0;
      if(!rusher&&t<read){if(d.cover)cover(d,dt);else accel(d,0,0,dt);}
      else{pursue(d,car,dt);tryTackle(d,car);}}
    if(gm.phase!=='live')return;}
  for(const e of E){if(e.down)continue;e.x+=e.vx*dt;e.z+=e.vz*dt;}
  separate();
  if(b.fly){b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.t>=b.T)resolvePass();}
  const c=gm.carrier;
  if(gm.phase==='live'&&c){if(c.z<-9.5)c.z=-9.5;if(c.z>=100&&Math.abs(c.x)<=FW)endPlay('td',100);else if(Math.abs(c.x)>FW)endPlay('oob',c.z);}}
function stepDead(dt){gm.deadT+=dt;for(const e of gm.ents){if(e.down)continue;accel(e,0,0,dt);e.x+=e.vx*dt;e.z+=e.vz*dt;}
  const b=gm.ball;if(b.fly&&b.y>0.12){b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.y<=0.12){b.y=0.12;b.vx=b.vz=0;b.vy=0;}}
  if(gm.zmsg&&gm.deadT>1.0&&gm.deadT<8){flash(gm.zmsg);gm.zmsg='';gm.zext=1.3;}
  if(gm.deadT>(gm.after&&gm.after.scored?2.8:1.9)+(gm.zext||0)){gm.zext=0;gm.zmsg='';afterPlay();}}

// ----- X-Factor zones -----
function zoneUp(e,need){if(!e||!e.rp.xf||e.rp.pos==='OL')return;const z=gm.zone[e.rp.id]||(gm.zone[e.rp.id]={c:0,on:false});if(z.on)return;if(++z.c>=need){z.on=true;e.zone=true;gm.zmsg='X-Factor: '+e.rp.n+' is in the zone';}}
function zoneOut(e){if(!e||!e.rp.xf||e.rp.pos==='OL')return;const z=gm.zone[e.rp.id];if(z){z.c=0;z.on=false;}}

// ----- downs, scoring, clock -----
function tick(sec){if(gm.q===5)return;gm.clock-=sec;if(gm.clock<=0){gm.clock=0;gm.exp=true;}}
function addScore(side,pts){if(side==='U')gm.us+=pts;else gm.them+=pts;}
function endPlay(kind,z,note){if(gm.phase!=='live')return;gm.phase='dead';gm.deadT=0;gm.throwing=null;
  const los=gm.pos,st=gm.st,passed=gm.thrownAt!=null,uo=uoff(),other=uo?'A':'U',by=gm.by,c=gm.carrier,tk=gm.tkBy;
  let txt='',change=false,next=25,run=18,scored=false;
  if(kind==='inc'){txt=note;gm.down++;run=5;}
  else if(kind==='int'){txt=uo?'Intercepted!':'Interception! Your ball';if(uo)st.int++;else st.dInt++;change=true;next=z>=100?20:clamp(Math.round(100-z),1,99);run=6;zoneOut(by.QB);zoneUp(gm.intBy,1);}
  else{const td=kind==='td',zr=td?100:Math.min(99,Math.round(z)),gain=zr-los;
    if(uo){if(kind==='sack')st.sk++;else if(passed)st.yds+=gain;else st.rush+=gain;if(td&&passed)st.td++;}
    else{if(kind==='sack')st.dSk++;st.dYds+=gain;}
    if(kind==='sack'){zoneOut(by.QB);zoneUp(tk,1);}
    else{if(gm.caught){zoneUp(by.QB,3);zoneUp(c,2);}else if(c&&c.rp.pos==='RB'){if(gain>=5)zoneUp(c,2);else if(gain<0)zoneOut(c);}
      if(tk)zoneUp(tk,tk.rp.pos==='DL'?(gain<=0?1:3):2);}
    if(td||gain>=20)for(const e of gm.ents)if(e.side==='D')zoneOut(e);
    if(td){const pat=Math.random()<0.96;addScore(gm.poss,pat?7:6);txt=(uo?'Touchdown!':'Touchdown '+gm.O.name)+(pat?'':' · Extra point missed');change=true;scored=true;run=6;
      for(const e of gm.ents)if(e.side==='O'&&!e.down)e.anim='cele';}
    else if(zr<=0){addScore(other,2);txt='Safety';change=true;next=35;}
    else{gm.pos=zr;if(c)gm.bx=clamp(c.x,-3.1,3.1);
      if(gain>=gm.toGo){gm.down=1;gm.toGo=Math.min(10,100-zr);txt=(gain>=0?'+':'')+gain+' yards · First down';}
      else{gm.down++;gm.toGo-=gain;txt=kind==='sack'?'Sacked · '+gain+' yards':gain===0?'No gain':(gain>0?'+':'')+gain+' yard'+(Math.abs(gain)===1?'':'s');}
      if(kind==='oob')run=6;}}
  if(!change&&gm.down>4){change=true;next=clamp(100-gm.pos,1,99);txt+=uo?' · Turnover on downs':' · Stopped on downs';}
  gm.tkBy=null;tick(run+Math.min(8,gm.t));gm.after={change,next,scored};gm.msg=txt;flash(txt);renderPanel();}
function ydName(pos){return pos<50?'your own '+pos:pos===50?'midfield':'the '+gm.O.name+' '+(100-pos);}
function showCard(title,lines,btn,fn){gm.phase='card';gm.card={title,lines,btn,fn};renderPanel();}
function cardGo(){if(!gm||!gm.card)return;const fn=gm.card.fn;gm.card=null;fn();}
function nextQuarter(){if(!gm.exp)return false;if(gm.q===2){halftime();return true;}if(gm.q===4){endReg();return true;}gm.q++;gm.clock=QLEN;gm.exp=false;return false;}
function give(side,pos){if(side==='A'&&!gm.playDef)return oppDrive(pos);startDrive(side,pos);}
function afterPlay(){const a=gm.after||{change:false};gm.after=null;const other=uoff()?'A':'U';
  if(gm.q===5){if(a.scored)return finalCard();if(a.change){gm.them+=3;return showCard('Overtime',[gm.O.name+' kick the winning field goal.'],'See final score',finalCard);}return setHuddle();}
  if(nextQuarter())return;
  if(a.change)return give(other,a.next);
  setHuddle();}
function halftime(){gm.q=3;gm.clock=QLEN;gm.exp=false;showCard('Halftime',[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,gm.O.name+' get the ball to start the second half.'],'Start second half',()=>give('A',25));}
function endReg(){if(gm.us===gm.them){gm.q=5;gm.exp=false;showCard('Overtime',['Tied at '+gm.us+'. You get the ball first. Score and you win.'],'Start overtime',()=>startDrive('U',25));}else finalCard();}
function finalCard(){const st=gm.st,lines=[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,
  gm.LU.QB.n+': '+st.cmp+' of '+st.att+', '+Math.round(st.yds)+' yards, '+st.td+' TD, '+st.int+' INT','Rushing: '+Math.round(st.rush)+' yards · Sacks taken: '+st.sk];
  if(gm.playDef)lines.push('Defense: '+Math.round(st.dYds)+' yards allowed · '+st.dSk+' sacks · '+st.dInt+' interceptions');
  showCard(gm.us>gm.them?'You win':'You lose',lines,'Back to team',finishGame);}
function finishGame(){const us=gm.us,them=gm.them;gm=null;FLIP=false;hideGame();finishUserGame(us,them);render();}
function fgDist(){return Math.round(100-gm.pos+17);}
// The other team's fourth-down choice when you are playing defense.
function aiFourth(){if(gm.down!==4)return false;const d=fgDist(),O=gm.O,sp=gm.pos;
  if(d<=53){const good=Math.random()<clamp(0.95-(d-20)*0.012+(gm.LO.K.ovr-75)*0.004,0.2,0.98);tick(5);if(good)gm.them+=3;
    showCard(O.name+' field goal',[d+'-yard attempt is '+(good?'good.':'no good.')],'Continue',()=>{gm.after={change:true,next:good?25:Math.max(20,100-sp)};afterPlay();});return true;}
  if(gm.toGo<=2&&sp>=50)return false;
  const net=rint(36,50),land=sp+net,s=land>=100?20:clamp(100-land,3,60);tick(8);
  showCard(O.name+' punt',[net+'-yard punt. You start at '+ydName(s)+'.'],'Continue',()=>{gm.after={change:true,next:s};afterPlay();});return true;}
// Simulated drive, used when "play defense" is turned off.
function oppDrive(s){const O=gm.O,diff=ratings(O).off-ratings(gm.U).def,lines=[];let next=25;s=clamp(s,1,99);
  if(gm.clock<18){gm.clock=0;gm.exp=true;lines.push(O.name+' run out the clock.');}
  else{let pTD=clamp(0.27+diff*0.011+(s-25)*0.006+0.04*dk(),0.06,0.8);const pFG=clamp(0.14+(s-25)*0.004,0.08,0.3),pTO=clamp(0.13-diff*0.003,0.05,0.22);
    const plays=rint(3,11);let time=plays*rint(7,11);if(time>gm.clock+10){time=gm.clock;pTD*=0.6;}
    const x=Math.random();
    if(x<pTD){const pat=Math.random()<0.95;gm.them+=pat?7:6;lines.push(O.name+' drive '+(100-s)+' yards in '+plays+' plays. Touchdown'+(pat?'.':', but the extra point is no good.'));}
    else if(x<pTD+pFG){gm.them+=3;lines.push(O.name+' move into range and hit a '+rint(24,49)+'-yard field goal.');}
    else if(x<pTD+pFG+pTO){const y=clamp(s+rint(2,35),5,95),who=pick([...gm.LU.DL,...gm.LU.LB,...gm.LU.CB,...gm.LU.S]);next=100-y;lines.push('Turnover! '+who.n+' ('+who.pos+') takes the ball away.');}
    else{const y=clamp(s+rint(3,30),10,70),land=y+rint(36,50);next=land>=100?20:clamp(100-land,5,45);lines.push(O.name+' go '+(y-s)+' yards and punt.');}
    tick(time);}
  const endsGame=gm.exp&&gm.q===4,endsHalf=gm.exp&&gm.q===2;
  if(!endsGame&&!endsHalf)lines.push('You take over at '+ydName(next)+'.');
  showCard(O.name+' possession',lines,'Continue',()=>{if(nextQuarter())return;startDrive('U',next);});}
function punt(){if(!gm||gm.phase!=='huddle'||!uoff())return;const net=rint(36,50),land=gm.pos+net,s=land>=100?20:clamp(100-land,3,60);tick(8);
  showCard('Punt',[net+'-yard punt. '+gm.O.name+' start at their own '+s+'.'],'Continue',()=>{gm.after={change:true,next:s};afterPlay();});}
function tryFG(){if(!gm||gm.phase!=='huddle'||!uoff())return;const d=fgDist(),K=gm.LU.K;gm.phase='kick';gm.kick={dist:d,tol:clamp(0.62-(d-20)*0.011+(K.ovr-75)*0.005+(K.xf?0.1:0)-0.04*dk(),0.1,0.75),t:0,m:-1};renderPanel();}
function kickNow(){const k=gm&&gm.kick;if(!k||gm.phase!=='kick')return;const good=Math.abs(k.m)<=k.tol,sp=gm.pos;gm.kick=null;tick(5);if(good)gm.us+=3;
  showCard(good?'Field goal is good':'No good',[k.dist+'-yard attempt '+(good?'splits the uprights.':'misses.')],'Continue',()=>{gm.after={change:true,next:good?25:Math.max(20,100-sp),scored:good};afterPlay();});}
function simRest(){if(!gm||(gm.card&&gm.card.fn===finishGame))return;const f=gm.q>=5?0:((4-gm.q)*QLEN+gm.clock)/(4*QLEN),r=simGame(gm.U,gm.O);
  const sc=x=>{const v=x*f,td=Math.floor(v/7);return td*7+(v-td*7>=3.5?3:0);};gm.us+=sc(r[0]);gm.them+=sc(r[1]);
  if(gm.us===gm.them){if(Math.random()<0.5)gm.us+=3;else gm.them+=3;}gm.q=4;gm.clock=0;gm.exp=false;finalCard();}

// ----- body motion -----
function updPose(e,dt){const p=e.pose,sp=Math.hypot(e.vx,e.vz),t=gm.t;
  const T={lean:0.05,lTh:0.05,rTh:0.05,lKn:0.1,rKn:0.1,lArm:0.1,rArm:0.1,lEl:0.25,rEl:0.25,fall:0,hop:0,spread:0.12};
  const pre=gm.phase==='presnap'||gm.phase==='huddle'||gm.phase==='kick'||gm.phase==='card';
  if(sp>0.6){e.ph+=sp*dt*1.9;const a=Math.min(1,sp/6),s=Math.sin(e.ph),c=Math.cos(e.ph);
    T.lTh=s*0.95*a+0.12*a;T.rTh=-s*0.95*a+0.12*a;T.lKn=a*(0.25+1.1*Math.max(0,c));T.rKn=a*(0.25+1.1*Math.max(0,-c));
    T.lArm=-s*0.8*a;T.rArm=s*0.8*a;T.lEl=T.rEl=0.3+1.1*a;T.lean=0.1+0.2*a;}
  else if(pre){if(e.stance==='s3'){T.lean=0.95;T.lTh=T.rTh=0.8;T.lKn=T.rKn=1.35;T.rArm=1.15;T.rEl=0;T.lArm=0.5;T.lEl=1.0;}
    else if(e.stance==='s2'){T.lean=0.32;T.lTh=T.rTh=0.38;T.lKn=T.rKn=0.62;T.lArm=T.rArm=0.25;T.lEl=T.rEl=0.9;}
    else{T.lean=0.12;T.lTh=T.rTh=0.15;T.lKn=T.rKn=0.28;T.lArm=T.rArm=0.7;T.lEl=T.rEl=1.25;}}
  const an=e.anim;
  if(an==='block'){T.lean=0.28;T.lArm=T.rArm=1.5;T.lEl=T.rEl=0.25;if(sp<=0.6){T.lTh=T.rTh=0.35;T.lKn=T.rKn=0.6;}}
  else if(an==='throw'){const u=(t-e.animT)/0.36;if(u>1.4)e.anim='idle';else{const w=Math.min(1,u/0.55),f=clamp((u-0.55)/0.45,0,1);T.rArm=u<0.55?1.2+2.5*w:3.7-2.7*f;T.rEl=u<0.55?1.4:0.2;T.lArm=0.9;T.lEl=0.8;T.lean=0.1;}}
  else if(an==='catch'){T.lArm=T.rArm=2.3;T.lEl=T.rEl=0.35;}
  else if(an==='carry'){T.rArm=0.55;T.rEl=1.9;}
  else if(an==='down'){T.fall=1;T.lArm=T.rArm=2.5;T.lEl=T.rEl=0.2;T.lTh=0.15;T.rTh=0.05;T.lKn=0.3;T.rKn=0.1;T.lean=0;}
  else if(an==='dive'){T.fall=0.92;T.lArm=T.rArm=2.2;T.lEl=T.rEl=0.1;T.lean=0;T.lTh=T.rTh=0.1;T.lKn=T.rKn=0.15;}
  else if(an==='cele'){T.lArm=T.rArm=3.0;T.lEl=T.rEl=0.1;T.lean=-0.05;T.hop=Math.abs(Math.sin(performance.now()/110+e.ph))*0.4;T.spread=0.3;}
  if(an==='dive'&&!e.down&&e.stun<=t&&!e.lunge)e.anim='idle';
  const k=1-Math.exp(-dt*18),kf=1-Math.exp(-dt*9);
  for(const key in T){if(key==='fall')p.fall+=(T.fall-p.fall)*kf;else if(key==='hop')p.hop=T.hop;else p[key]+=(T[key]-p[key])*k;}
  let want=e.dir;if(e.face)want=Math.atan2(e.face.x-e.x,e.face.z-e.z);else if(sp>1)want=Math.atan2(e.vx,e.vz);
  let dd=want-e.dir;while(dd>Math.PI)dd-=2*Math.PI;while(dd<-Math.PI)dd+=2*Math.PI;e.dir+=dd*(1-Math.exp(-dt*12));}
function updCam(dt){const uo=uoff();let fx=gm.bx,fz=uo?gm.pos-5:gm.pos+5,back=uo?15.5:19;
  if(gm.phase==='live'||gm.phase==='dead'){const b=gm.ball,c=gm.ctl;
    if(b&&b.fly){fx=uo?b.x:b.land.x;fz=uo?Math.max(gm.by.QB.z,b.z-4):b.land.z;back=uo?15.5:17;}
    else if(!uo&&gm.mode==='pocket'&&gm.phase==='live'&&c){fx=c.x*0.6;fz=(c.z+gm.pos+5)/2;}
    else if(b&&b.held){fx=b.held.x;fz=b.held.z;if(!uo)back=16;}else if(gm.focus){fx=gm.focus.x;fz=gm.focus.z;}}
  const k=gm.camSnap?1:1-Math.exp(-dt*4.5);gm.camSnap=false;cam.x+=(RX(fx)*0.7-cam.x)*k;cam.z+=(RZ(fz)-back-cam.z)*k;}

// ----- frame loop, HUD, input -----
function flash(t){const el=document.getElementById('flash');el.textContent=t;el.classList.add('on');flashT=1.7;}
function fmtClock(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function updHud(){const g=gm,A=g.userHome?g.O:g.U,Hm=g.home,as=g.userHome?g.them:g.us,hs=g.userHome?g.us:g.them,uo=g.poss==='U',PT=uo?g.U:g.O,DT=uo?g.O:g.U;
  const ord=['1st','2nd','3rd','4th'][Math.min(3,g.down-1)],goal=g.pos+g.toGo>=100;
  const spot=g.pos===50?'Midfield':(g.pos<50?PT.abbr+' '+g.pos:DT.abbr+' '+(100-g.pos)),dot='<em class="poss" title="Has the ball"></em>';
  const s=`<div class="tm">${sw(A)}<b>${A.abbr}</b>${PT===A?dot:''}<i>${as}</i></div><div class="mid"><b>${g.q>=5?'OT':'Q'+g.q+' '+fmtClock(g.clock)}</b><span>${ord} &amp; ${goal?'Goal':g.toGo} · ${spot}</span></div><div class="tm"><i>${hs}</i>${PT===Hm?dot:''}<b>${Hm.abbr}</b>${sw(Hm)}</div><button class="btn ghost sm" data-a="simRest">Sim<span class="wide"> rest</span></button>`;
  if(s!==hudStr){hudStr=s;document.getElementById('bug').innerHTML=s;}}
function frame(ts){if(!gm){rafOn=false;return;}const dt=Math.min(0.05,(ts-lastTs)/1000||0.016);lastTs=ts;
  const n=Math.max(1,Math.ceil(dt/0.0167)),h=dt/n;
  for(let i=0;i<n&&gm;i++){if(gm.phase==='live')stepLive(h);else if(gm.phase==='dead')stepDead(h);if(!gm)break;for(const e of gm.ents)updPose(e,h);}
  if(!gm){rafOn=false;return;}
  if(gm.kick){const k=gm.kick;k.t+=dt;k.m=Math.sin(k.t*(2.6+k.dist*0.035)-1.57);const mk=document.getElementById('kmk');if(mk)mk.style.left=((k.m+1)*50)+'%';}
  if(flashT>0){flashT-=dt;if(flashT<=0)document.getElementById('flash').classList.remove('on');}
  updCam(dt);updHud();renderGame();requestAnimationFrame(frame);}
function fitCanvas(){if(!cv)return;const st=document.getElementById('stage');DPR=Math.min(2,window.devicePixelRatio||1);W=Math.max(2,Math.round(st.clientWidth*DPR));H=Math.max(2,Math.round(st.clientHeight*DPR));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}
function showGame(){document.getElementById('game').hidden=false;hudStr='';fitCanvas();if(!rafOn){rafOn=true;lastTs=performance.now();requestAnimationFrame(frame);}}
function hideGame(){document.getElementById('game').hidden=true;}
function setKeys(){const k=inp.k;inp.kx=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);inp.kz=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0);}
function initInput(){cv=document.getElementById('cv');ctx=cv.getContext('2d');
  if(window.ResizeObserver)new ResizeObserver(fitCanvas).observe(document.getElementById('stage'));addEventListener('resize',fitCanvas);
  addEventListener('keydown',ev=>{if(!gm)return;const c=ev.code;if(c==='Space'||c==='Tab'||c.startsWith('Arrow'))ev.preventDefault();inp.k[c]=true;setKeys();if(ev.repeat)return;
    if(c==='Space'){if(gm.phase==='presnap')snap();else if(gm.phase==='live'){if(uoff())juke();else dive();}else if(gm.phase==='kick')kickNow();else if(gm.phase==='dead')gm.deadT=9;else if(gm.phase==='card')cardGo();}
    else if(c==='KeyQ'||c==='Tab'||c==='KeyE')switchCtl();
    else if(/^(Digit|Numpad)[1-9]$/.test(c)){const n=+c.slice(-1);if(gm.phase==='huddle'){if(uoff()){if(n<=PLAYS.length)callPlay(n-1);}else if(n<=DCALLS.length)callDef(n-1);}else if(gm.phase==='live'&&uoff()){const r=gm.elig.find(e=>e.key===n);if(r)throwTo(r);}}});
  addEventListener('keyup',ev=>{inp.k[ev.code]=false;setKeys();});
  addEventListener('blur',()=>{inp.k={};setKeys();});
  const startStick=ev=>{inp.stick={id:ev.pointerId,x:ev.clientX,y:ev.clientY};inp.sx=inp.sz=0;};
  const pt=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*DPR,(ev.clientY-r.top)*DPR];};
  cv.addEventListener('pointerdown',ev=>{if(!gm)return;ev.preventDefault();const p=pt(ev);
    if(gm.phase==='presnap'){snap();return;}
    if(gm.phase==='dead'){gm.deadT=9;return;}
    if(gm.phase!=='live')return;
    if(uoff()&&gm.mode==='pocket'){let best=null,bd=52*DPR;for(const e of gm.elig){if(e.sx==null)continue;const d=Math.hypot(e.sx-p[0],e.sy-p[1]);if(d<bd){bd=d;best=e;}}if(best){throwTo(best);return;}}
    if(ev.pointerType==='mouse'){if(!uoff())dive();else if(gm.mode==='run')juke();return;}
    startStick(ev);});
  addEventListener('pointermove',ev=>{const s=inp.stick;if(!s||s.id!==ev.pointerId)return;inp.sx=clamp((ev.clientX-s.x)/44,-1,1);inp.sz=clamp(-(ev.clientY-s.y)/44,-1,1);});
  const up=ev=>{if(inp.stick&&inp.stick.id===ev.pointerId){inp.stick=null;inp.sx=inp.sz=0;}};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
  document.getElementById('panel').addEventListener('pointerdown',ev=>{if(!gm||gm.phase!=='live'||ev.pointerType==='mouse'||ev.target.closest('button'))return;ev.preventDefault();startStick(ev);});}
