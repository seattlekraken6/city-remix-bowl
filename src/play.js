// ===== the match =====
const QLEN=240;
const SKINS=['#f0c7a2','#d8a374','#b87a50','#8e5a3a','#6c4327','#52331f'];
// Formations: where each skill player lines up, as [x from the ball, z from the line, stance].
const FORMS={
 gun:{n:'Shotgun',QB:[0,-5],RB:[1.9,-5.3],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]},
 single:{n:'Singleback',QB:[0,-1.4],RB:[0,-6.5],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]},
 iform:{n:'I-Form',QB:[0,-1.4],RB:[0,-7],TE:[0,-4.3],WR1:[-19,-0.6],WR2:[19,-1],WR3:[4.6,-0.7,'s3']},
 trips:{n:'Trips',QB:[0,-5],RB:[-1.9,-5.3],TE:[9,-1],WR1:[-19,-0.6],WR2:[19.5,-0.6],WR3:[14,-1.3]},
 bunch:{n:'Bunch',QB:[0,-5],RB:[-1.9,-5.3],TE:[9.3,-1.6],WR1:[-19,-0.6],WR2:[11,-0.6],WR3:[12.6,-1.7]},
 empty:{n:'Empty',QB:[0,-5],RB:[-13,-1.2],TE:[4.5,-0.7,'s3'],WR1:[-20,-0.6],WR2:[20,-0.6],WR3:[12,-1.2]},
 pistol:{n:'Pistol',QB:[0,-3.6],RB:[0,-6.6],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]}};
// Routes: [toward own sideline (+) or the middle (-), depth, stop?] from the receiver's spot.
const RT={go:[[0,45]],seam:[[-1,45]],fade:[[2.5,40]],slant:[[0,2],[-8,9],[-16,16]],hitch:[[0,6],[-0.5,5,1]],curl:[[0,12],[-1.5,10,1]],comeback:[[0,15],[2.5,12,1]],
 out:[[0,5],[8,5]],sail:[[0,12],[9,18]],dig:[[0,12],[-16,12]],in5:[[0,5],[-12,5.5]],corner:[[0,10],[9,22]],post:[[0,13],[-10,32]],drag:[[0,2],[-24,5]],cross:[[0,6],[-24,16]],
 stick:[[0,6],[1.5,5.5,1]],tflat:[[2,3],[9,4.5]],rflat:[[5,3.5],[11,7.5]],swing:[[6,1.5],[12,5.5]],wheel:[[6,3],[11,6.5],[12,30]],angle:[[5,5.5],[-3,11]],check:[[3,5.5],[3.5,6.5,1]],
 screen:[[5,1.5],[8,2.5,1]],fflat:[[5,4.5],[11,6]]};
// The playbook. g: group, f: formation, s: the situations a coach would call it in.
const PB=[
 {n:'Slants',g:'Q',f:'gun',s:'first med short goal hurry',d:'Quick slants from both sides',r:{WR1:'slant',WR2:'slant',WR3:'hitch',TE:'tflat',RB:'swing'}},
 {n:'Stick',g:'Q',f:'trips',s:'med short goal',d:'Easy read to the trips side',r:{WR2:'fade',WR3:'out',TE:'stick',WR1:'slant',RB:'rflat'}},
 {n:'Mesh',g:'Q',f:'gun',s:'first med',d:'Crossing routes underneath',r:{WR1:'drag',TE:'drag',WR3:'corner',WR2:'dig',RB:'rflat'}},
 {n:'Curl Flat',g:'Q',f:'single',s:'first med',d:'Curls outside, flats underneath',r:{WR1:'curl',WR2:'curl',WR3:'out',TE:'hitch',RB:'rflat'}},
 {n:'Quick Outs',g:'Q',f:'gun',s:'med hurry goal',d:'Outs to the sideline',r:{WR1:'out',WR2:'out',WR3:'seam',TE:'hitch',RB:'angle'}},
 {n:'HB Screen',g:'Q',f:'gun',s:'long med',d:'Dump it to the back behind the rush',r:{WR1:'go',WR2:'go',WR3:'drag',TE:null,RB:'screen'}},
 {n:'Drive',g:'Q',f:'bunch',s:'med short',d:'Shallow cross with a dig behind it',r:{WR3:'drag',TE:'dig',WR2:'corner',WR1:'post',RB:'rflat'}},
 {n:'Four Verticals',g:'D',f:'gun',s:'long hurry',d:'Four receivers straight down the field',r:{WR1:'go',WR2:'go',WR3:'seam',TE:'seam',RB:'check'}},
 {n:'Smash',g:'D',f:'gun',s:'med long',d:'Hitch underneath, corner over the top',r:{WR1:'hitch',WR3:'corner',WR2:'hitch',TE:'corner',RB:'check'}},
 {n:'Flood',g:'D',f:'trips',s:'med long hurry',d:'Three levels to one side',r:{WR2:'go',WR3:'sail',TE:'tflat',WR1:'dig',RB:null}},
 {n:'Y-Cross',g:'D',f:'gun',s:'first long',d:'Tight end on a deep crosser',r:{TE:'cross',WR1:'post',WR2:'comeback',WR3:'hitch',RB:'swing'}},
 {n:'Dagger',g:'D',f:'gun',s:'long',d:'The seam clears out for the dig',r:{WR3:'seam',WR1:'dig',WR2:'go',TE:'drag',RB:'rflat'}},
 {n:'Post Wheel',g:'D',f:'pistol',s:'first long',d:'Post inside, back up the sideline',r:{WR1:'post',WR2:'comeback',WR3:'dig',TE:'tflat',RB:'wheel'}},
 {n:'Levels',g:'D',f:'trips',s:'med long',d:'In-breaking routes at two depths',r:{WR2:'in5',WR3:'dig',TE:'seam',WR1:'comeback',RB:'check'}},
 {n:'Empty Go',g:'D',f:'empty',s:'long hurry',d:'Five out, nobody in the backfield',r:{WR1:'go',WR2:'go',WR3:'slant',TE:'stick',RB:'hitch'}},
 {n:'PA Boot',g:'P',f:'single',pa:1,aim:-3,s:'first med',d:'Fake the run, crossers come open',r:{WR1:'cross',WR2:'comeback',WR3:'post',TE:'drag',RB:'rflat'}},
 {n:'PA Deep Shot',g:'P',f:'iform',pa:1,aim:2,s:'first short',d:'Fake the dive and throw it deep',r:{WR1:'post',WR2:'go',WR3:'corner',TE:'fflat',RB:null}},
 {n:'PA Crossers',g:'P',f:'pistol',pa:1,aim:1,s:'first med',d:'Linebackers bite, crossers run free',r:{WR1:'cross',WR2:'dig',WR3:'go',TE:'tflat',RB:null}},
 {n:'Inside Zone',g:'R',t:'run',f:'gun',aim:0.6,hand:0.45,s:'first med short',d:'Downhill behind the guards'},
 {n:'Outside Zone',g:'R',t:'run',f:'single',aim:7,hand:0.5,s:'first med',d:'Stretch it to the edge and cut up'},
 {n:'Power',g:'R',t:'run',f:'iform',aim:3.4,hand:0.5,lead:'TE',s:'first short goal',d:'The fullback leads through the hole'},
 {n:'Counter',g:'R',t:'run',f:'single',aim:-3.6,hand:0.62,counter:1,s:'first med',d:'Step one way, cut back the other'},
 {n:'HB Draw',g:'R',t:'run',f:'gun',aim:0,hand:0.95,draw:1,s:'long med',d:'Looks like a pass, then a handoff'},
 {n:'Toss Sweep',g:'R',t:'run',f:'iform',aim:12,hand:0.3,toss:1,lead:'TE',s:'first med',d:'Pitch it wide with a lead blocker'},
 {n:'HB Dive',g:'R',t:'run',f:'iform',aim:-0.8,hand:0.36,lead:'TE',s:'short goal',d:'Quick hit straight ahead'},
 {n:'QB Sneak',g:'R',t:'run',f:'single',aim:0,sneak:1,s:'short goal',d:'The quarterback pushes for a yard'}];
for(const p of PB)if(!p.t)p.t='pass';
const GROUPS=[['S','Coach picks'],['Q','Quick pass'],['D','Deep pass'],['P','Play action'],['R','Run']];
const SIT_NAME={first:'First down',short:'Short yardage',med:'Move the chains',long:'Long yardage',goal:'Goal line',hurry:'Hurry-up'};
// Defensive calls. Each defender gets: m = man on a receiver, z = underneath zone [x, depth, radius], d = deep zone [x1, x2], r = rush, c = crash the line.
const DCALLS=[
 {n:'Cover 1',s:'first med short',d:'Man coverage with one deep safety and a linebacker in the middle.'},
 {n:'Cover 2 Man',s:'med long',d:'Man coverage underneath, two safeties deep.'},
 {n:'Cover 2 Zone',s:'first med',d:'Two deep, five underneath. Takes away short throws.'},
 {n:'Cover 3',s:'first med long',d:'Three deep, four under. Solid against deep shots.'},
 {n:'Cover 4',s:'long hurry',d:'Four deep. Stops the big play, gives up the short stuff.'},
 {n:'Man Blitz',s:'short med long',d:'Two linebackers rush. Fast pressure, thin coverage.'},
 {n:'Zone Blitz',s:'med long',d:'A linebacker and a safety rush with zones behind them.'},
 {n:'Run Stuff',s:'short goal',d:'Linebackers attack the line. Strong against the run, weak against the pass.'}];
const DEF=[
 {CB1:['m','WR1'],CB2:['m','WR2'],SS:['m','WR3'],LB3:['m','TE'],LB2:['m','RB'],LB1:['z',0,7,7],FS:['d',-30,30]},
 {CB1:['m','WR1'],CB2:['m','WR2'],LB1:['m','WR3'],LB3:['m','TE'],LB2:['m','RB'],SS:['d',-30,0],FS:['d',0,30]},
 {CB1:['z',-17,5,6],CB2:['z',17,5,6],LB1:['z',-8,9,6],LB2:['z',0,10,6],LB3:['z',8,9,6],SS:['d',-30,0],FS:['d',0,30]},
 {CB1:['d',-30,-9],FS:['d',-9,9],CB2:['d',9,30],SS:['z',-15,6,6],LB1:['z',-5,8,6],LB2:['z',5,8,6],LB3:['z',15,6,6]},
 {CB1:['d',-30,-13],SS:['d',-13,0],FS:['d',0,13],CB2:['d',13,30],LB1:['z',-11,7,7],LB2:['z',0,8,7],LB3:['z',11,7,7]},
 {CB1:['m','WR1'],CB2:['m','WR2'],SS:['m','WR3'],LB3:['m','TE'],LB1:['r'],LB2:['r'],FS:['d',-30,30]},
 {LB2:['r'],SS:['r'],CB1:['d',-30,-9],FS:['d',-9,9],CB2:['d',9,30],LB1:['z',-8,7,7],LB3:['z',8,7,7]},
 {CB1:['m','WR1'],CB2:['m','WR2'],FS:['m','WR3'],LB3:['m','TE'],SS:['m','RB'],LB1:['c'],LB2:['c']}];
const CELES=['Spike','Dance','Flex','Point up'];
let gm=null,rafOn=false,lastTs=0,hudStr='',whoStr='',flashT=0;
const inp={k:{},kx:0,kz:0,sx:0,sz:0,stick:null};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const isOL=e=>e.role==='LT'||e.role==='LG'||e.role==='C'||e.role==='RG'||e.role==='RT';
const uoff=()=>gm.poss==='U';
const zOn=(e,pos)=>e&&e.zone&&e.rp.pos===pos;

function makeKit(T,key){const u=UNI[T.abbr][key]||UNI[T.abbr].H,j=u[0],p=u[2];
  return {jersey:j,pads:j,sleeve:j,num:u[1],pants:p,socks:lum(j)>0.8?(lum(p)>0.8?u[4]:p):j,helmet:u[3],stripe:u[4],shoes:'#18191b',mask:lum(u[3])>0.55?'#3a3f46':'#d5d8dc',glove:lum(u[4])>0.85?'#e9e9e6':u[4]};}
function lineup(T){const s=p=>starters(T,p).map(x=>x.cap?Object.assign({},x,{ovr:Math.min(99,x.ovr+2)}):x);return {QB:s('QB')[0],RB:s('RB')[0],WR:s('WR'),TE:s('TE')[0],OL:s('OL'),K:s('K')[0],DL:s('DL'),LB:s('LB'),CB:s('CB'),S:s('S')};}
function jerseyName(n){n=String(n).trim();const w=n.split(/\s+/);return (w.length>1&&w[w.length-1].length>2?w[w.length-1]:n).toUpperCase().slice(0,11);}
function mkEnt(side,team,role,rp,x,z,kit,stance){const zs=gm.zone[rp.id],zone=!!rp.xf&&(rp.pos==='OL'||rp.pos==='K'||!!(zs&&zs.on));
  return {side,team,role,rp,x,z:Math.min(z,108),y:0,vy:0,vx:0,vz:0,dir:side==='O'?0:Math.PI,pdir:0,max:(5.2+(rp.spd-50)*0.07)*(zone&&(rp.pos==='RB'||rp.pos==='WR'||rp.pos==='CB')?1.05:1),kit,skin:SKINS[rp.id%SKINS.length],num:String(rp.num),nm:jerseyName(rp.n),cap:!!rp.cap,zone,
  pose:{lean:0,lTh:0,rTh:0,lKn:0,rKn:0,lArm:0,rArm:0,lEl:0,rEl:0,fall:0,hop:0,spread:0.12,roll:0},ph:Math.random()*6,anim:'idle',animT:0,stance,down:false,stun:0,eng:null,engT:0,shedAt:0,freeUntil:0,tklCd:0,fallDir:1,fallAmt:1,rollT:0,spl:null,
  face:null,route:null,wp:0,cutT:-9,blk:null,beat:0,juke:0,jukeCd:0,slow:0,stumble:0,cover:null,cush:0,lag:0.2,react:0.25,blitz:false,crash:false,dbl:false,zn:null,dz:null,bite:0,lunge:0,lx:0,lz:0,drag:null,wrap:null,brk:false,key:0,sx:null,sy:0,R:null,hip:1};}

function startGame(opp,userHome,uU,uO){const U=S.teams[S.user];
  gm={U,O:opp,userHome,home:userHome?U:opp,us:0,them:0,q:1,clock:QLEN,exp:false,poss:'U',pos:25,down:1,toGo:10,bx:0,phase:'huddle',ents:[],by:{},elig:[],ball:null,carrier:null,ctl:null,t:0,now:0,mode:'pocket',
    play:PB[0],defCall:0,after:null,card:null,kick:null,kanim:null,msg:'',zmsg:'',zone:{},playDef:!!S.playDef,camSnap:true,ko:false,conv:false,flag:null,recent:[],recentD:[],tab:'S',sug:[],sugD:[],cele:null,kz:0,
    st:{att:0,cmp:0,yds:0,td:0,int:0,rush:0,sk:0,dSk:0,dInt:0,dYds:0},kitU:makeKit(U,uU),kitO:makeKit(opp,uO),LU:lineup(U),LO:lineup(opp)};
  gm.ps={};gm.pend=null;buildCrowd(gm.home);showGame();startIntro();}
function startDrive(side,pos){gm.poss=side;FLIP=side==='A';gm.camSnap=true;gm.ko=false;gm.conv=false;gm.pos=clamp(Math.round(pos),1,99);gm.down=1;gm.toGo=Math.min(10,100-gm.pos);gm.bx=0;setHuddle();
  if(gm&&gm.phase==='huddle'&&gm.playDef)flash(side==='A'?'Defense':'Offense');}

// ----- play calling -----
function situation(){const d=gm.down,tg=gm.toGo,p=gm.pos,uo=uoff();if(gm.conv)return 'goal';
  if((gm.q===2||gm.q===4)&&gm.clock<45&&(gm.q===2||(uo?gm.us<=gm.them:gm.them<=gm.us)))return 'hurry';
  if(p>=95||(p+tg>=100&&tg<=3))return 'goal';if(tg<=2)return 'short';if((d>=3&&tg>=7)||tg>=12)return 'long';if(d===1)return 'first';return 'med';}
function pickFrom(list,sit,n,rec,mix){const c=shuffle(list.filter(p=>p.s.includes(sit)));c.sort((a,b)=>(rec.includes(a.n)?1:0)-(rec.includes(b.n)?1:0));const out=[];
  if(mix){const r=c.find(p=>p.t==='run'),q=c.find(p=>p.t==='pass');if(r)out.push(r);if(q)out.push(q);}
  for(const p of c){if(out.length>=n)break;if(!out.includes(p))out.push(p);}
  for(const p of shuffle(list.slice())){if(out.length>=n)break;if(!out.includes(p))out.push(p);}return out;}
const pickPlays=(sit,n)=>pickFrom(PB,sit,n,gm.recent,sit!=='long'&&sit!=='hurry');
const pickCalls=(sit,n)=>pickFrom(DCALLS,sit,n,gm.recentD,false);
function aiPlay(){const sit=situation(),d=gm.down,tg=gm.toGo;let pp=0.56;if(sit==='long'||sit==='hurry')pp=0.88;else if(tg<=2)pp=0.35;else if(d===2&&tg>=8)pp=0.7;
  if(gm.q>=4&&gm.them<gm.us)pp=Math.max(pp,0.75);const want=Math.random()<pp?'pass':'run',c=pickPlays(sit,6);return c.find(p=>p.t===want)||c[0];}
function aiDefCall(){const c=pickCalls(situation(),3);let i=DCALLS.indexOf(pick(c));if((i===5||i===6)&&Math.random()>0.55+0.2*dk())i=pick([0,2,3]);gm.recentD=[DCALLS[i].n];return i;}
function setHuddle(){gm.flag=null;gm.tab='S';gm.cele=null;const sit=situation();
  if(gm.poss==='A'){if(!gm.conv&&aiFourth())return;gm.aiNext=aiPlay();gm.sugD=pickCalls(sit,3);setFormation(gm.aiNext,gm.defCall||0);}
  else{gm.sug=pickPlays(sit,4);gm.aiDef=aiDefCall();setFormation(gm.sug[0],gm.aiDef);}
  gm.phase='huddle';renderPanel();}
function callPlay(p){if(!gm||gm.phase!=='huddle'||!uoff()||!p)return;gm.recent=[p.n,...gm.recent].slice(0,3);setFormation(p,gm.aiDef);gm.phase='presnap';renderPanel();}
function callDef(i){if(!gm||gm.phase!=='huddle'||uoff()||!DCALLS[i])return;gm.recentD=[DCALLS[i].n,...gm.recentD].slice(0,2);gm.recent=[gm.aiNext.n,...gm.recent].slice(0,3);setFormation(gm.aiNext,i);gm.phase='presnap';renderPanel();}
function setTab(t){if(!gm||gm.phase!=='huddle')return;gm.tab=t;renderPanel();}
function listed(){if(!gm)return [];if(uoff())return gm.tab==='S'?gm.sug:PB.filter(p=>p.g===gm.tab);return gm.tab==='S'?gm.sugD.map(c=>DCALLS.indexOf(c)):DCALLS.map((c,i)=>i);}

function buildRoute(e,wps){const dx0=e.x-gm.bx,sg=dx0<-0.5?-1:1;
  const pts=wps.map(w=>({x:clamp(e.x+w[0]*sg,-25.3,25.3),z:Math.min(108.5,e.z+w[1]),stop:!!w[2]}));const last=pts[pts.length-1];
  if(!last.stop){const prev=pts.length>1?pts[pts.length-2]:{x:e.x,z:e.z};let dx=last.x-prev.x,dz=last.z-prev.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;let k=40;
    if(dx>0.01)k=Math.min(k,(25.3-last.x)/dx);if(dx<-0.01)k=Math.min(k,(-25.3-last.x)/dx);if(dz>0.01)k=Math.min(k,(108.5-last.z)/dz);if(dz<-0.01)k=Math.min(k,(last.z-(gm.pos-3))/-dz);
    if(k>0.6)pts.push({x:last.x+dx*k,z:last.z+dz*k,stop:true});else last.stop=true;}
  return pts;}
function alignDef(dc){const by=gm.by,z0=gm.pos,bx=gm.bx,A=DEF[dc];
  for(const role in A){const a=A[role],d=by[role],cb=role[0]==='C',wr=by[role==='CB1'?'WR1':'WR2'];
    if(a[0]==='m'){const m=by[a[1]],wide=Math.abs(m.x-bx)>7;
      if(role[0]==='L'&&!wide){d.x=clamp(m.x,bx-7,bx+7);d.z=z0+4.6;}else{d.x=m.x+(m.x>bx?-0.6:0.6);d.z=z0+(cb?(dc===7?3:5.5):role==='FS'?9:6.5);}}
    else if(a[0]==='z'){if(cb){d.x=wr.x;d.z=z0+5;}else if(role==='SS'){d.x=bx+a[1]*0.7;d.z=z0+6;}}
    else if(a[0]==='d'){if(cb){d.x=wr.x;d.z=z0+7.5;}else{d.x=bx+(Math.max(a[1],-20)+Math.min(a[2],20))/2*0.75;d.z=z0+(a[2]-a[1]>40?14:12.5);}}
    else if(a[0]==='r'){d.z=z0+(role==='SS'?4.6:4.2);if(role==='SS')d.x=bx-6.5;}
    else{d.z=z0+3;if(role==='SS')d.x=bx-7;}
    d.z=Math.min(d.z,108);}}
function setFormation(play,dc){const z0=gm.pos,bx=gm.bx,uo=uoff(),Lo=uo?gm.LU:gm.LO,Ld=uo?gm.LO:gm.LU,ko=uo?gm.kitU:gm.kitO,kd=uo?gm.kitO:gm.kitU,to=uo?'U':'A',td=uo?'A':'U',E=[],by={},F=FORMS[play.f];
  gm.ents=E;gm.by=by;gm.play=play;gm.defCall=dc;gm.ko=false;
  const add=(side,role,rp,x,z,st)=>{const e=mkEnt(side,side==='O'?to:td,role,rp,x,z,side==='O'?ko:kd,st);E.push(e);by[role]=e;return e;};
  ['LT','LG','C','RG','RT'].forEach((r,i)=>add('O',r,Lo.OL[i],bx+(i-2)*1.45,z0-0.7,'s3'));
  const rp={QB:Lo.QB,RB:Lo.RB,TE:Lo.TE,WR1:Lo.WR[0],WR2:Lo.WR[1],WR3:Lo.WR[2]};
  for(const r of ['TE','WR1','WR2','WR3','QB','RB']){const f=F[r];add('O',r,rp[r],clamp(bx+f[0],-23.5,23.5),z0+f[1],f[2]||(r==='QB'?'qb':'s2'));}
  [-4.3,-1.45,1.45,4.3].forEach((x,i)=>add('D','DL'+(i+1),Ld.DL[i],bx+x,z0+0.9,'s3'));
  add('D','LB1',Ld.LB[0],bx-5,z0+4.5,'s2');add('D','LB2',Ld.LB[1],bx,z0+4.8,'s2');add('D','LB3',Ld.LB[2],bx+5.5,z0+4.5,'s2');
  add('D','CB1',Ld.CB[0],-18.4,z0+5.5,'s2');add('D','CB2',Ld.CB[1],18.4,z0+5.5,'s2');add('D','SS',Ld.S[0],bx-9,z0+6.5,'s2');add('D','FS',Ld.S[1],bx+2,z0+14,'s2');
  alignDef(dc);gm.elig=[];gm.runPath=null;
  if(play.t==='pass'){for(const r in play.r)if(play.r[r]){by[r].route=buildRoute(by[r],RT[play.r[r]]);gm.elig.push(by[r]);}
    gm.elig.sort((a,b)=>a.x-b.x).forEach((e,i)=>{e.key=i+1;});}
  else{const c=play.sneak?by.QB:by.RB,hx=bx+play.aim;gm.runPath=play.sneak?[[c.x,c.z],[hx,z0+4]]:[[c.x,c.z],[bx+play.aim*0.4,z0-2.2],[hx,z0+1.5],[hx+(play.aim>5?2:play.aim<-5?-2:0),z0+8]];}
  gm.ball={held:by.QB};gm.carrier=null;gm.ctl=uo?null:by.LB2;}
function snap(){if(!gm||gm.phase!=='presnap')return;if(gm.ko)return snapKO();const by=gm.by,play=gm.play,uo=uoff(),k=dk(),los=gm.pos;
  if(!gm.conv&&gm.q!==5&&Math.random()<0.014){const off=Math.random()<0.55,who=pick(gm.ents.filter(e=>off?isOL(e):e.role[0]==='D'&&e.role[1]==='L'));
    return applyPenalty(off?{off:true,n:'False start',y:5,pre:true}:{off:false,n:'Offside',y:5,pre:true},who);}
  hush();gm.phase='live';gm.t=0;gm.handed=!!play.sneak;gm.scr=false;gm.caught=false;gm.thrownAt=null;gm.throwing=null;gm.swatT=null;gm.tkBy=null;gm.intBy=null;gm.pbu=false;gm.airYds=0;
  gm.carrier=by.QB;gm.ball={held:by.QB};gm.mode='pocket';gm.aiDec=rnd(1.5,2.4)-0.1*k;gm.aiAware=Math.random()<0.6+0.15*k;
  gm.hole=play.t==='run'||play.pa?{x:gm.bx+play.aim,z:los+1.5}:null;gm.ucDrop=FORMS[play.f].QB[1]>-3;if(play.sneak)by.QB.anim='carry';
  const A=DEF[gm.defCall];for(const role in A){const a=A[role],d=by[role];if(a[0]==='m')d.cover=by[a[1]];else if(a[0]==='z')d.zn=[a[1],a[2],a[3]];else if(a[0]==='d')d.dz=[a[1],a[2]];else if(a[0]==='r')d.blitz=true;else d.crash=true;}
  for(const e of gm.ents){e.react=0.3+(92-e.rp.ovr)/120;
    if(e.cover){e.cush=e.z-e.cover.z;e.lag=zOn(e,'CB')?0:clamp(0.42-e.rp.ovr/300+(uo?-0.04:0.04)*k,0.02,0.4);}}
  if(play.pa)for(const r of ['LB1','LB2','LB3','SS']){const d=by[r];if(!d.blitz&&!d.crash)d.bite=rnd(0.25,0.6)*clamp(1.3-(d.rp.ovr-60)/45,0.4,1.3);}
  by.LT.blk=by.DL1;by.LG.blk=by.DL2;by.RG.blk=by.DL3;by.RT.blk=by.DL4;
  if(play.t==='pass'){const bl=by.LB1.blitz?by.LB1:by.LB2.blitz?by.LB2:null;by.C.blk=bl||by.DL2;by.DL2.dbl=!bl;}
  else{const used=new Set(),H=gm.hole,second=gm.ents.filter(d=>d.side==='D'&&d.role[0]!=='D');
    const take=(e,ref)=>{let b=null,bd=1e9;for(const d of second){if(used.has(d))continue;const dd=Math.hypot(d.x-ref.x,d.z-ref.z);if(dd<bd){bd=dd;b=d;}}if(b){used.add(b);e.blk=b;}};
    if(play.lead)take(by[play.lead],H);take(by.C,H);
    for(const r of ['TE','WR3','WR1','WR2','RB'])if(r!==play.lead&&!(r==='RB'&&!play.sneak))take(by[r],by[r]);}
  inp.sx=inp.sz=0;inp.stick=null;renderPanel();}

// ----- movement -----
function accel(e,wx,wz,dt){const ax=wx-e.vx,az=wz-e.vz,l=Math.hypot(ax,az),m=22*dt;if(l<=m){e.vx=wx;e.vz=wz;}else{e.vx+=ax/l*m;e.vz+=az/l*m;}}
function seek(e,tx,tz,sp,dt){const dx=tx-e.x,dz=tz-e.z,l=Math.hypot(dx,dz);if(l>0.12){const s=Math.min(sp,l*7);accel(e,dx/l*s,dz/l*s,dt);}else accel(e,0,0,dt);}
// Players on the ground slide to a stop; a big hit can lift them off the turf.
function integrate(dt){for(const e of gm.ents){if(e.down){const sp=Math.hypot(e.vx,e.vz);if(sp>0.05){const k=Math.max(0,sp-11*dt)/sp;e.vx*=k;e.vz*=k;}else e.vx=e.vz=0;}
    if(e.y>0||e.vy>0){e.vy-=20*dt;e.y+=e.vy*dt;if(e.y<=0){e.y=0;e.vy=0;}}
    e.x+=e.vx*dt;e.z+=e.vz*dt;}}
function runRoute(e,dt){const r=e.route;if(e.wp>=r.length){accel(e,0,0,dt);e.face=gm.by.QB;return;}
  let w=r[e.wp];let dx=w.x-e.x,dz=w.z-e.z,l=Math.hypot(dx,dz);
  if(l<0.55){e.wp++;e.cutT=gm.t;if(e.wp>=r.length){accel(e,0,0,dt);return;}w=r[e.wp];dx=w.x-e.x;dz=w.z-e.z;l=Math.hypot(dx,dz)||1;}
  if(w.stop&&e.wp===r.length-1)seek(e,w.x,w.z,e.max,dt);else accel(e,dx/l*e.max,dz/l*e.max,dt);}
function predictPos(e,T){let x=e.x,z=e.z,wp=e.wp;const r=e.route;if(!r)return {x:x+e.vx*T,z:z+e.vz*T};let rem=T*e.max*0.96;
  while(rem>0&&wp<r.length){const w=r[wp],d=Math.hypot(w.x-x,w.z-z);if(d<=rem){x=w.x;z=w.z;rem-=d;wp++;}else{x+=(w.x-x)/d*rem;z+=(w.z-z)/d*rem;rem=0;}}
  return {x,z};}
function userInput(){let ix=inp.kx+inp.sx,iz=inp.kz+inp.sz;if(FLIP){ix=-ix;iz=-iz;}const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l;}return [ix,iz,l];}
function qbMesh(qb,dt){const p=gm.play;seek(qb,gm.bx+p.aim*(p.toss?0.1:0.2),Math.min(qb.z,gm.pos-3),qb.max*0.6,dt);qb.face=gm.by.RB;}
function control(e,dt,mode){const [ix0,iz0,l]=userInput();let ix=ix0,iz=iz0;const los=gm.pos;
  if(e===gm.by.QB&&gm.play.t==='run'&&!gm.play.sneak){qbMesh(e,dt);return;}
  let sp=e.max*(mode==='pocket'?0.8:0.94);if(e.slow>gm.t)sp*=0.5;
  if(l<0.1){if(mode==='pocket'){if(gm.ucDrop&&e.z>los-5.5&&gm.t<1.3)seek(e,e.x,los-6,e.max*0.8,dt);else accel(e,0,0,dt);e.face=gm.throwing?gm.throwing.rec:{x:e.x,z:e.z+10};return;}ix=0;iz=1;}
  accel(e,ix*sp,iz*sp,dt);
  if(mode==='pocket')e.face=gm.throwing?gm.throwing.rec:{x:e.x+ix*3,z:e.z+10};}
function juke(){const c=gm&&gm.carrier;if(!c||gm.phase!=='live'||!uoff()||gm.mode!=='run'||c.jukeCd>gm.t||c.drag)return;c.juke=gm.t+0.34;c.jukeCd=gm.t+2.2;
  const ix=inp.kx+inp.sx;c.vx+=(ix>0.2?1:ix<-0.2?-1:(Math.random()<0.5?1:-1))*8;}
function blockDur(b,d){const diff=(b.rp.ovr-d.rp.ovr)/55;let base;const pp=gm.play.t==='pass'&&gm.mode==='pocket';
  if(pp&&isOL(b))base=(b.team==='U'?3.4:2.7)+Math.random()*2.6+(d.dbl?0.9:0);
  else if(d.role[0]!=='D')base=0.5+Math.random()*0.8;else if(isOL(b))base=1.0+Math.random()*1.5;else base=0.8+Math.random()*1.0;
  base*=1+(b.team==='U'?-0.1:0.1)*dk();let dur=Math.max(0.5,base*(1+diff));
  if(pp&&zOn(b,'OL'))dur=Math.max(dur,3.5);else if(zOn(b,'OL'))dur*=1.3;
  if(zOn(d,'DL')){dur=Math.min(dur,rnd(0.6,1.0));d.xfShed=true;}
  return dur;}
function doBlock(e,dt,prot){const t=gm.t;let d=e.blk;
  if(!d||d.down||(d.eng&&d.eng!==e)||(d.freeUntil>t&&d.eng!==e)){d=null;let best=gm.ko?13:6;
    for(const x of gm.ents){if(x.side!=='D'||x.down||x.eng||x.freeUntil>t||x.role==='KK')continue;const dd=dist(e,x);if(dd<best){best=dd;d=x;}}e.blk=d;}
  if(!d){accel(e,0,0,dt);return;}
  const px=prot.x-d.x,pz=prot.z-d.z,l=Math.hypot(px,pz)||1;
  seek(e,d.x+px/l*0.95,d.z+pz/l*0.95,e.max*(e.beat>t?0.4:0.92),dt);
  if(!d.eng&&d.freeUntil<=t&&dist(e,d)<1.3){d.eng=e;d.engT=t;d.shedAt=t+blockDur(e,d);}
  if(dist(e,d)<2.2){e.anim='block';e.face=d;}else if(e.anim==='block')e.anim='idle';}
function cover(d,dt){const r=d.cover,t=gm.t;if(r.down){accel(d,0,0,dt);return;}
  const rs=Math.hypot(r.vx,r.vz);d.cush=Math.max(rs>3?-0.7:0.8,d.cush-dt*(rs<2?7:2));
  if(t<r.cutT+d.lag)return;
  seek(d,r.x+r.vx*0.22,Math.min(109,r.z+r.vz*0.22+d.cush),d.max*(0.9+d.rp.ovr/1000),dt);if(d.cush>1)d.face=gm.by.QB;}
function zoneCover(d,dt){const zn=d.zn,cx=gm.bx+zn[0],cz=gm.pos+zn[1];let best=null,bd=zn[2]+1.5;
  for(const e of gm.elig){const f=predictPos(e,0.35),dd=Math.hypot(f.x-cx,f.z-cz);if(dd<bd){bd=dd;best=f;}}
  if(best)seek(d,best.x*0.9+cx*0.1,Math.min(108,best.z+0.9),d.max*0.97,dt);
  else{const w=d.role[0]==='C'?gm.by[d.role==='CB1'?'WR1':'WR2']:null;if(w&&w.z>cz+1)seek(d,w.x,Math.min(w.z-1.5,gm.pos+18,108),d.max*0.95,dt);else seek(d,cx,Math.min(108,cz),d.max*0.75,dt);}
  d.face=gm.by.QB;}
function deepZone(d,dt){const x1=d.dz[0],x2=d.dz[1],bx=gm.bx,mid=bx+(Math.max(x1,-20)+Math.min(x2,20))/2;let dp=null,sx=0,n=0;
  for(const e of gm.elig){const ex=e.x-bx;if(ex<x1-2||ex>x2+2)continue;if(!dp||e.z>dp.z)dp=e;if(e.z>gm.pos+7){sx+=e.x;n++;}}
  seek(d,dp?clamp(n?sx/n:dp.x,bx+x1,bx+x2)*0.9+mid*0.1:mid,Math.min(108,Math.max(gm.pos+11,(dp?dp.z:0)+2)),d.max*0.97,dt);d.face=gm.by.QB;}
function pursue(d,c,dt,f){const dd=dist(d,c),tt=Math.min(1.1,dd/Math.max(3,d.max));seek(d,c.x+c.vx*tt*0.85,c.z+c.vz*tt*0.85,d.max*(f||1),dt);}
function separate(){const E=gm.ents,car=gm.carrier;
  for(let i=0;i<E.length;i++){const a=E[i];if(a.down)continue;for(let j=i+1;j<E.length;j++){const b=E[j];if(b.down)continue;
    if((a===car&&b.side==='D')||(b===car&&a.side==='D'))continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;
    if(d2<0.64&&d2>1e-6){const d=Math.sqrt(d2),p=(0.8-d)/2,ux=dx/d,uz=dz/d;a.x-=ux*p;a.z-=uz*p;b.x+=ux*p;b.z+=uz*p;}}}}

// ----- tackling: momentum decides how the runner goes down -----
function tryTackle(d,c){const t=gm.t,lg=d.lunge>t;if(d.tklCd>t||c.down||dist(d,c)>(d.eng?0.85:lg?1.6:1.12))return;d.tklCd=t+0.7;
  if(c.drag){if(d!==c.drag.by)finishTackle(d,c);return;}
  const qbp=c===gm.by.QB&&gm.mode==='pocket',ball=c.rp.pos==='RB'||c.rp.pos==='TE';
  if(!qbp&&c.zone&&ball&&!c.brk&&!d.eng){c.brk=true;d.stun=t+0.9;d.lunge=0;d.anim='dive';d.vx*=0.3;d.vz*=0.3;c.slow=t+0.1;flash(XF[c.rp.pos][0]+'! '+c.rp.n+' breaks the tackle');return;}
  let p=qbp?(c.team==='U'?0.72:0.88):0.75+(d.rp.ovr-c.rp.ovr)/220+(c.team==='U'?0.05:-0.05)*dk()+(c.team==='A'?0.06:0);
  if(!qbp){if(c.juke>t)p-=0.22;if(c.rp.pos==='RB'&&!gm.caught)p-=0.02;}
  if(d===gm.ctl)p+=lg?0.18:0.1;if(d.eng)p*=0.2;if(zOn(d,'LB')&&!d.eng)p=0.97;
  if(Math.random()<clamp(p,0.08,0.97)){
    if(!qbp&&!lg&&!zOn(d,'LB')&&Math.random()<0.3){c.drag={by:d,until:t+0.28+Math.random()*0.25};d.wrap=c;d.anim='block';return;}
    finishTackle(d,c);}
  else if(d.eng){c.slow=t+0.2;}else{d.stun=t+0.7;d.lunge=0;d.anim='dive';d.vx*=0.4;d.vz*=0.4;c.slow=t+0.18;c.stumble=t+0.35;flash(qbp?(uoff()?'Escaped the sack!':'He slips away'):uoff()?'Broken tackle!':'Missed tackle');}}
function finishTackle(d,c){const t=gm.t;c.drag=null;for(const x of gm.ents)x.wrap=null;
  const rvx=d.vx-c.vx,rvz=d.vz-c.vz,rs=Math.hypot(rvx,rvz),big=rs>9&&!d.eng;
  const fx=Math.sin(c.dir),fz=Math.cos(c.dir),ix=d.x-c.x,iz=d.z-c.z,il=Math.hypot(ix,iz)||1,front=(ix*fx+iz*fz)/il,side=(ix*fz-iz*fx)/il;
  c.down=true;c.anim='down';d.down=true;d.anim='dive';d.lunge=0;gm.tkBy=d;
  if(Math.abs(side)>0.72){c.rollT=side>0?-1:1;c.fallDir=1;c.fallAmt=0.5;}else{c.rollT=rnd(-0.25,0.25);c.fallDir=front>0.1?-1:1;c.fallAmt=1;}
  const mx=c.vx*0.5+d.vx*0.5,mz=c.vz*0.5+d.vz*0.5;c.vx=mx;c.vz=mz;d.vx=mx;d.vz=mz;d.fallDir=1;d.fallAmt=0.9;d.rollT=rnd(-0.3,0.3);
  if(big){c.vy=3.4;c.y=0.02;c.vx+=rvx*0.3;c.vz+=rvz*0.3;c.fallAmt=1;gm.bigHit=true;}
  c.spl=[rnd(1.0,2.9),rnd(1.0,2.9),rnd(0,0.8),rnd(0,0.8),rnd(0.1,1.0),rnd(0.1,1.0)];
  let n=0;for(const x of gm.ents){if(x.side!==d.side||x===d||x.down||x.eng||x.stun>t||n>=2)continue;if(dist(x,c)<2.3){x.down=true;x.anim='dive';x.fallAmt=0.9;x.rollT=rnd(-0.4,0.4);x.vx=(c.x-x.x)*2.2+mx*0.5;x.vz=(c.z-x.z)*2.2+mz*0.5;n++;}}
  endPlay(c===gm.by.QB&&c.z<gm.pos&&!gm.ko?'sack':'tackle',c.z);}
function dragStep(c,dt){const g=c.drag,sp=Math.hypot(c.vx,c.vz)||1,f=c.max*0.3;accel(c,c.vx/sp*f,c.vz/sp*f,dt);c.stumble=gm.t+0.1;if(gm.t>=g.until||g.by.down||g.by.stun>gm.t)finishTackle(g.by,c);}

// ----- the other team's offense -----
function nearestRusher(q){let nd=null,dn=99;for(const d of gm.ents){if(d.side!=='D'||d.down||d.eng||d.stun>gm.t)continue;const dd=dist(d,q);if(dd<dn){dn=dd;nd=d;}}return [nd,dn];}
function aiQB(qb,dt){const t=gm.t,[nd,dn]=nearestRusher(qb);let tx=gm.bx,tz=gm.pos-7.5;
  if(nd&&dn<4.5){tx=qb.x+(qb.x>=nd.x?1:-1)*3;tz=gm.pos-8.5;}
  seek(qb,clamp(tx,gm.bx-7,gm.bx+7),tz,qb.max*0.7,dt);qb.face=gm.throwing?gm.throwing.rec:{x:qb.x,z:qb.z+10};
  if(gm.throwing)return;const hot=gm.aiAware&&dn<2.2&&t>1.0;
  if(t<gm.aiDec+(gm.play.pa?0.4:0)&&!hot)return;
  let best=null,bs=-9,bo=0;for(const e of gm.elig){const o=openness(e),dp=e.z-gm.pos,sc=Math.min(o,5)+dp*0.07+(dp>=gm.toGo?0.8:0)+rnd(-0.6,0.6);if(sc>bs){bs=sc;best=e;bo=o;}}
  if(bo>1.7||hot||t>gm.aiDec+1.1){if(bo<0.8&&!hot){endPlay('inc',0,'Thrown away');return;}throwTo(best);}}
function aiRun(c,dt){const t=gm.t,p=gm.play;if(c===gm.by.QB&&p.t==='run'&&!p.sneak){qbMesh(c,dt);return;}
  let dx=0,dz=1,nd=null,dn=99;
  for(const d of gm.ents){if(d.side!=='D'||d.down||d.stun>t)continue;const ox=c.x-d.x,oz=c.z-d.z,dd=Math.hypot(ox,oz);
    if(dd<7&&oz<1.5){dx+=(ox>=0?1:-1)*(7-dd)/7*1.6*(d.eng?0.4:1);if(!d.eng&&dd<dn){dn=dd;nd=d;}}}
  if(gm.hole&&p.t==='run'&&c.z<gm.pos+1)dx+=clamp((gm.hole.x-c.x)*0.6,-2,2);
  if(c.x>FW-3)dx-=1.6;if(c.x<-FW+3)dx+=1.6;const l=Math.hypot(dx,dz);let sp=c.max*0.9;if(c.slow>t)sp*=0.5;
  accel(c,dx/l*sp,dz/l*sp,dt);
  if(nd&&dn<1.9&&c.jukeCd<=t&&Math.random()<dt*(1.5+0.6*dk())){c.juke=t+0.34;c.jukeCd=t+2.6;c.vx+=(c.x>=nd.x?1:-1)*8;}}

// ----- playing defense -----
function userDefend(d,dt){const t=gm.t,c=gm.carrier;
  if(d.stun>t){accel(d,0,0,dt);return;}
  if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;return;}
  if(d.lunge){if(d.lunge>t){d.vx=d.lx*d.max*1.8;d.vz=d.lz*d.max*1.8;if(c)tryTackle(d,c);return;}d.lunge=0;d.stun=t+0.7;d.vx*=0.2;d.vz*=0.2;return;}
  if(d.eng){if(t>=Math.min(d.shedAt,(d.engT||t)+0.9)||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
    else{accel(d,0,0,dt);d.anim='block';d.face=d.eng;if(c&&gm.mode==='run')tryTackle(d,c);return;}}
  d.anim=gm.swatT!=null&&t-gm.swatT<0.45?'catch':'idle';
  const [ix,iz,l]=userInput();if(l<0.1)accel(d,0,0,dt);else accel(d,ix*d.max*1.03,iz*d.max*1.03,dt);
  if(c&&!(c===gm.by.QB&&gm.play.t==='run'&&!gm.handed))tryTackle(d,c);}
function dive(){const d=gm&&gm.ctl;if(!d||gm.phase!=='live'||uoff()||d.down||d.stun>gm.t||d.eng||d.lunge||d.wrap)return;
  const b=gm.ball;if(b&&b.fly&&!b.ko){gm.swatT=gm.t;return;}
  const c=gm.carrier;let dx,dz;if(c&&dist(d,c)<5){dx=c.x+c.vx*0.15-d.x;dz=c.z+c.vz*0.15-d.z;}else{dx=d.vx;dz=d.vz;}const l=Math.hypot(dx,dz);if(l<0.1)return;
  d.lunge=gm.t+0.26;d.lx=dx/l;d.lz=dz/l;d.tklCd=0;d.anim='dive';}
function switchCtl(){if(!gm||uoff()||(gm.phase!=='live'&&gm.phase!=='presnap'))return;const b=gm.ball,c=gm.carrier,cur=gm.ctl;
  const tx=b&&b.fly?b.land.x:c?c.x:gm.bx,tz=b&&b.fly?b.land.z:c?c.z:gm.pos;
  const arr=gm.ents.filter(d=>d.side==='D'&&!d.down&&d.role!=='KK').sort((p,q)=>Math.hypot(p.x-tx,p.z-tz)-Math.hypot(q.x-tx,q.z-tz));if(arr.length<2)return;
  const nx=gm.phase==='presnap'?arr[(arr.indexOf(cur)+1)%arr.length]:(arr[0]===cur?arr[1]:arr[0]);if(cur)cur.lunge=0;gm.ctl=nx;}

// How open a receiver is: the smaller of his gap now and his gap a beat from now.
function openness(e){const f=predictPos(e,0.7);let dn=99;
  for(const d of gm.ents)if(d.side==='D'&&!d.down){const a=Math.hypot(d.x-e.x,d.z-e.z),b=Math.hypot(d.x+d.vx*0.5-f.x,d.z+d.vz*0.5-f.z);dn=Math.min(dn,a,b+0.6);}
  return dn;}
// ----- passing -----
function throwTo(rec){const qb=gm.by.QB;if(gm.phase!=='live'||gm.mode!=='pocket'||gm.throwing||gm.carrier!==qb)return;gm.throwing={rec,at:gm.t+0.2};qb.anim='throw';qb.animT=gm.t;}
function releaseBall(rec){const qb=gm.by.QB,rp=qb.rp,uo=uoff(),zq=zOn(qb,'QB');let T=0.6,land,d=0;
  for(let i=0;i<4;i++){land=predictPos(rec,T);d=Math.hypot(land.x-qb.x,land.z-qb.z);T=Math.max(0.26,d/((clamp(17+d*0.32,17,27)+(rp.ovr-75)*0.08)*(zq?1.3:1)));}
  const pres=!zq&&gm.ents.some(x=>x.side==='D'&&!x.eng&&!x.down&&dist(x,qb)<2.6),mv=!zq&&Math.hypot(qb.vx,qb.vz)>2.5;
  const sig=(0.28+d*0.022+Math.max(0,d-20)*0.03)*(1+(92-rp.ovr)/45)*(pres?1.7:1)*(mv?1.35:1)*(zq?0.4:1)*(uo?1+0.1*dk():1.15-0.12*dk());
  land.x=clamp(land.x+gauss()*sig,-28,28);land.z+=gauss()*sig;
  const x0=qb.x+0.3,z0=qb.z+0.3,y0=2.05,g=10.7;gm.airYds=land.z-gm.pos;
  gm.ball={fly:true,dist:d,x:x0,y:y0,z:z0,t:0,T,land,target:rec,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.45-y0)/T+0.5*g*T,g};
  gm.carrier=null;if(uo)gm.st.att++;PS(qb).att++;gm.thrownAt=gm.t;
  if(!uo&&gm.ctl){let nd=null,dn=99;for(const x of gm.ents)if(x.side==='D'&&!x.down){const dd=Math.hypot(x.x-land.x,x.z-land.z);if(dd<dn){dn=dd;nd=x;}}
    if(nd&&nd!==gm.ctl&&Math.hypot(gm.ctl.x-land.x,gm.ctl.z-land.z)>dn+2){gm.ctl.lunge=0;gm.ctl=nd;}}}
function resolvePass(){const b=gm.ball,rec=b.target,L=b.land,dR=Math.hypot(rec.x-L.x,rec.z-L.z),uo=uoff(),k=dk()*(uo?1:-1);let dD=99,D=null;
  for(const x of gm.ents)if(x.side==='D'&&!x.down&&x.stun<=gm.t){const dd=Math.hypot(x.x-L.x,x.z-L.z);if(dd<dD){dD=dd;D=x;}}
  const inb=Math.abs(L.x)<=FW-0.1&&L.z<=110&&L.z>=-10,swat=!uo&&D&&D===gm.ctl&&gm.swatT!=null&&gm.t-gm.swatT<0.5&&dD<2.2;
  const sure=rec.zone&&(rec.rp.pos==='WR'||rec.rp.pos==='TE'),hawk=zOn(D,'S'),lock=zOn(D,'CB')&&dD<2.6;
  const im=(1+0.3*k)*(hawk?3:1)*(swat?3:1);let out;
  if(dR<=1.6&&inb){const pInt=sure?0:clamp((dD<1.0?(dD<dR?0.12:0.03):swat?0.05:0)*im,0,0.6),hands=rec.rp.ovr-(rec.role==='RB'||rec.role==='TE'?5:0);
    let pC=clamp(0.96-(96-hands)/200-(dD<0.8?0.3:dD<1.6?0.15:dD<2.6?0.04:0)-dR*0.05-(lock?0.25:0)-0.04*k-(swat?0.3:0)-(dD<3.5?clamp(((b.dist||0)-14)*0.014,0,0.3):0),0.05,0.97);if(sure)pC=Math.max(pC,0.96);
    out=Math.random()<pInt?'int':Math.random()<pC?'catch':(dD<1.8?'pbu':'drop');}
  else out=(dD<1.1&&inb&&!sure&&Math.random()<Math.min(0.6,0.15*im))?'int':'miss';
  if(out==='catch'){rec.x=rec.x*0.4+L.x*0.6;rec.z=rec.z*0.4+L.z*0.6;rec.anim='carry';rec.slow=gm.t+0.2;gm.carrier=rec;gm.ball={held:rec};gm.caught=true;if(uo)gm.st.cmp++;PS(gm.by.QB).cmp++;PS(rec).rec++;
    if(sure&&dD<1.8)flash(XF[rec.rp.pos][0]+'! '+rec.rp.n+' holds on');else if(zOn(gm.by.QB,'QB')&&gm.airYds>=15)flash('Gunslinger! '+gm.by.QB.rp.n+' threads it');
    if(rec.z>=100)endPlay('td',100);}
  else if(out==='int'){D.anim='carry';gm.ball={held:D};gm.focus={x:D.x,z:D.z};gm.intBy=D;if(hawk)gm.xfNote='Ball Hawk! ';endPlay('int',L.z);}
  else{if(out==='pbu'){zoneUp(D,1);gm.pbu=true;}else if(out==='drop')zoneOut(rec);
    endPlay('inc',0,out==='pbu'?(swat?'Swatted away!':(lock?'Lockdown! ':'')+'Broken up by #'+D.num):out==='drop'?'Dropped':(inb?'Incomplete':'Out of bounds'));}}

// ----- one simulation step while the ball is live -----
function stepLive(dt){gm.t+=dt;const t=gm.t,E=gm.ents,by=gm.by,qb=by.QB,los=gm.pos,play=gm.play,uo=uoff(),run=play.t==='run';
  for(const e of E)e.face=null;
  if(run&&!gm.handed&&t>=play.hand){gm.handed=true;gm.carrier=by.RB;gm.ball={held:by.RB};by.RB.anim='carry';}
  if(gm.throwing&&t>=gm.throwing.at){const r=gm.throwing.rec;gm.throwing=null;releaseBall(r);}
  if(!run&&gm.carrier===qb&&qb.z>los+0.4&&!gm.scr){gm.scr=true;gm.throwing=null;qb.anim='carry';}
  const car=gm.carrier,b=gm.ball;
  const mode=b.fly?'air':(!run&&car===qb&&!gm.scr?'pocket':'run');gm.mode=mode;
  const hx=gm.hole?gm.hole.x:gm.bx,prot=(run&&car&&car.z<los+1)?gm.hole:(car||qb);
  for(const e of E){if(e.side!=='O'||e.down)continue;
    if(e===car){if(e.drag)dragStep(e,dt);else if(uo)control(e,dt,mode);else if(mode==='pocket')aiQB(e,dt);else aiRun(e,dt);if(gm.phase!=='live')return;continue;}
    if(e===qb){accel(e,0,0,dt);continue;}
    if(e===by.RB&&run&&!gm.handed){const fk=play.counter&&t<0.3?-Math.sign(play.aim)*2.5:0;
      if(play.toss)seek(e,gm.bx+play.aim*0.7,e.z+0.5,e.max*0.9,dt);else seek(e,gm.bx+play.aim*0.4+fk,los-2.2,e.max*0.85,dt);continue;}
    if(e===by.RB&&play.pa&&t<0.7){seek(e,gm.bx+play.aim*0.4,los-2,e.max*0.85,dt);continue;}
    if(mode==='air'&&e===b.target){seek(e,b.land.x,b.land.z,e.max,dt);if(b.T-b.t<0.35)e.anim='catch';continue;}
    if(e.route&&mode!=='run'){runRoute(e,dt);continue;}
    doBlock(e,dt,prot);}
  for(const d of E){if(d.side!=='D'||d.down)continue;
    if(d===gm.ctl&&!uo){userDefend(d,dt);if(gm.phase!=='live')return;continue;}
    if(d.stun>t){accel(d,0,0,dt);continue;}
    if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;continue;}
    if(d.eng){if(t>=d.shedAt||d.eng.down){if(d.xfShed&&t<d.engT+1.1){d.xfShed=false;flash('Unstoppable! '+d.rp.n+' beats the block');}d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
      else{const g=car||qb,bl=d.eng;if(run&&!gm.scr&&isOL(bl)&&g.z<d.z+1)accel(d,(d.x>=hx?1:-1)*0.9,1.5+(bl.rp.ovr-d.rp.ovr)*0.02,dt);else seek(d,g.x,g.z,(isOL(bl)||bl.role==='TE')?0.9+(d.rp.ovr-70)*0.02:d.max*0.5,dt);
        d.anim='block';d.face=bl;if(mode==='run'&&car)tryTackle(d,car);if(gm.phase!=='live')return;continue;}}
    d.anim='idle';const rusher=d.role[0]==='D'||d.blitz||(d.crash&&(run||t<0.9));
    if(mode==='pocket'){
      if(rusher){seek(d,qb.x,qb.z,d.max*(d.blitz?(uo?0.62+0.08*dk():0.9):uo?0.9:0.95),dt);tryTackle(d,qb);}
      else if(d.bite>t){seek(d,d.x,los+2,d.max*0.55,dt);d.face=qb;}
      else if(d.cover)cover(d,dt);else if(d.dz)deepZone(d,dt);else if(d.zn)zoneCover(d,dt);else{seek(d,d.x,los+4.5,d.max*0.6,dt);d.face=qb;}}
    else if(mode==='air'){const near=Math.hypot(d.x-b.land.x,d.z-b.land.z),hawk=zOn(d,'S');
      if(rusher)accel(d,0,0,dt);
      else if(t>=gm.thrownAt+(hawk?0:d.react)&&(d.cover===b.target||(d.dz&&near<(hawk?24:19))||(d.zn&&near<13)||near<4.5))seek(d,b.land.x,b.land.z,d.max*(d.dz?1.05:1),dt);
      else if(d.cover)cover(d,dt);else if(d.dz)deepZone(d,dt);else if(d.zn)zoneCover(d,dt);else accel(d,0,0,dt);}
    else{const read=(run&&!gm.caught)?0.72+(90-d.rp.ovr)/100+(play.draw?0.45:0)+(play.counter?0.2:0):0;
      if(!rusher&&t<read){if(d.cover)cover(d,dt);else accel(d,0,0,dt);}
      else{pursue(d,car,dt,car.z>los+10?1.04:1);tryTackle(d,car);}}
    if(gm.phase!=='live')return;}
  integrate(dt);separate();
  if(b.fly){b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.t>=b.T)resolvePass();}
  const c=gm.carrier;
  if(gm.phase==='live'&&c){if(c.z<-9.5)c.z=-9.5;if(c.z>=100&&Math.abs(c.x)<=FW)endPlay('td',100);else if(Math.abs(c.x)>FW)endPlay('oob',c.z);}}
function stepDead(dt){gm.deadT+=dt;const b=gm.ball,ce=gm.cele;for(const e of gm.ents)if(!e.down)accel(e,0,0,dt);integrate(dt);
  if(b&&b.fly&&b.y>0.12){b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.y<=0.12){b.y=0.12;b.vx=b.vz=0;b.vy=0;b.spin=false;}}
  if(ce&&ce.spike&&gm.now-ce.e.animT>0.5){ce.spike=false;const e=ce.e;gm.ball={fly:true,spin:true,x:e.x+0.3,y:1.2,z:e.z+0.4,vx:rnd(-1,1),vy:-9,vz:rnd(0.5,2),g:20,t:0,T:99,land:{x:e.x,z:e.z}};}
  if(gm.zmsg&&gm.deadT>1.0&&gm.deadT<8){flash(gm.zmsg);gm.zmsg='';gm.zext=1.3;}
  const lim=(ce?(ce.picked?3.2:5):gm.after&&gm.after.td?2.8:1.7)+(gm.zext||0);
  if(gm.deadT>lim){gm.zext=0;gm.zmsg='';afterPlay();}}

// ----- kickoffs and returns -----
function kickoff(kicker){const R=kicker==='U'?'A':'U';gm.conv=false;gm.kanim=null;
  if(gm.q===5)return startDrive(R,25);
  if(R==='A'&&!(gm.playDef&&S.koRet))return give('A',rint(23,36));
  if(R==='U'&&!S.koRet)return startDrive('U',30);
  gm.poss=R;FLIP=R==='A';gm.camSnap=true;gm.ko=true;gm.pos=35;gm.down=1;gm.toGo=10;gm.bx=0;gm.flag=null;gm.cele=null;
  const uo=R==='U',Lr=uo?gm.LU:gm.LO,Lk=uo?gm.LO:gm.LU,kr=uo?gm.kitU:gm.kitO,kk=uo?gm.kitO:gm.kitU,tr=uo?'U':'A',tk=uo?'A':'U',E=[],by={};
  gm.ents=E;gm.by=by;gm.elig=[];gm.runPath=null;gm.play={t:'ko',n:'Kickoff',f:'gun'};
  const add=(side,role,rp,x,z)=>{const e=mkEnt(side,side==='O'?tr:tk,role,rp,x,z,side==='O'?kr:kk,'s2');E.push(e);by[role]=e;return e;};
  const fast=[Lr.RB,...Lr.WR,...Lr.CB].sort((a,b)=>b.spd-a.spd),krp=(uo?gm.U:gm.O).roster.find(x=>x.kr),retp=krp||fast[0];add('O','RET',retp,0,4);
  [Lr.TE,...Lr.LB,...Lr.S,...fast].filter(x=>x.id!==retp.id).slice(0,10).forEach((p,i)=>{const row=i<5?0:i<8?1:2,e=add('O','B'+i,p,row===0?(i-2)*9:row===1?(i-6)*12:(i-8.5)*14,row===0?52:row===1?38:22);e.hx=e.x*0.75;e.hz=row===0?36:row===1?29:20;});
  [...Lk.LB,...Lk.S,...Lk.CB,...Lk.WR].slice(0,10).forEach((p,i)=>add('D','C'+i,p,(i-4.5)*5.2,65.5));add('D','KK',Lk.K,0.8,67.5);
  gm.ctl=uo?null:by.C4;gm.carrier=null;gm.ball={still:true,x:0,y:0.2,z:65,vx:0,vz:-1};gm.phase='presnap';renderPanel();flash('Kickoff');}
function snapKO(){gm.phase='live';gm.t=0;gm.mode='run';gm.tkBy=null;gm.thrownAt=null;gm.caught=false;gm.hole=null;const k=gm.by.KK,ret=gm.by.RET;
  const land={x:rnd(-9,9),z:rnd(1,7)},T=3.3,x0=0,z0=65,y0=0.2,g=10.7;k.anim='kickleg';k.animT=gm.now;
  gm.ball={fly:true,ko:true,spin:true,x:x0,y:y0,z:z0,t:0,T,land,target:ret,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.3-y0)/T+0.5*g*T,g};gm.carrier=null;tick(6);renderPanel();}
function stepKO(dt){gm.t+=dt;const t=gm.t,E=gm.ents,b=gm.ball,ret=gm.by.RET,car=gm.carrier,uo=uoff();
  for(const e of E)e.face=null;
  for(const e of E){if(e.side!=='O'||e.down)continue;
    if(e===ret){if(car===ret){if(e.drag)dragStep(e,dt);else if(uo)control(e,dt,'run');else aiRun(e,dt);}
      else{seek(e,b.land.x,b.land.z,e.max,dt);if(b.T-b.t<0.4)e.anim='catch';e.face={x:e.x,z:e.z+10};}
      if(gm.phase!=='live')return;continue;}
    if(!car&&t<2.4){seek(e,e.hx,e.hz,e.max*0.7,dt);e.face={x:e.x,z:e.z+10};continue;}
    doBlock(e,dt,ret);}
  for(const d of E){if(d.side!=='D'||d.down)continue;
    if(d.role==='KK'){if(t>0.5)seek(d,0,52,d.max*0.5,dt);else if(t>0.15)seek(d,0,64.5,d.max,dt);continue;}
    if(t<0.3){accel(d,0,0,dt);continue;}
    if(d===gm.ctl&&!uo){userDefend(d,dt);if(gm.phase!=='live')return;continue;}
    if(d.stun>t){accel(d,0,0,dt);continue;}
    if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;continue;}
    if(d.eng){if(t>=d.shedAt||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}else{accel(d,0,0,dt);d.anim='block';d.face=d.eng;if(car)tryTackle(d,car);if(gm.phase!=='live')return;continue;}}
    d.anim='idle';if(car){pursue(d,car,dt);tryTackle(d,car);}else seek(d,b.land.x+(d.x-b.land.x)*0.3,b.land.z+7,d.max*0.96,dt);
    if(gm.phase!=='live')return;}
  integrate(dt);separate();
  if(b.fly){b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.t>=b.T){ret.x=ret.x*0.3+b.land.x*0.7;ret.z=ret.z*0.3+b.land.z*0.7;ret.anim='carry';gm.carrier=ret;gm.ball={held:ret};}}
  const c=gm.carrier;if(gm.phase==='live'&&c){if(c.z>=100&&Math.abs(c.x)<=FW)endPlay('td',100);else if(Math.abs(c.x)>FW)endPlay('oob',c.z);}}

// ----- field goals and extra points, with the kick shown on the field -----
function fgDist(){return Math.round(100-gm.pos+17);}
function setKickFormation(los){const bx=gm.bx,uo=uoff(),Lo=uo?gm.LU:gm.LO,Ld=uo?gm.LO:gm.LU,ko=uo?gm.kitU:gm.kitO,kd=uo?gm.kitO:gm.kitU,to=uo?'U':'A',td=uo?'A':'U',E=[],by={};
  gm.ents=E;gm.by=by;gm.elig=[];gm.runPath=null;gm.carrier=null;gm.ctl=null;gm.pos=los;gm.kz=los-7;gm.ko=false;
  const add=(side,role,rp,x,z,st)=>{const e=mkEnt(side,side==='O'?to:td,role,rp,x,z,side==='O'?ko:kd,st);E.push(e);by[role]=e;return e;};
  [...Lo.OL,Lo.TE,Lo.WR[2]].forEach((p,i)=>add('O','K'+i,p,bx+(i-3)*1.4,los-0.7,'s3'));add('O','W1',Lo.WR[0],bx-5.6,los-1.3,'s2');add('O','W2',Lo.WR[1],bx+5.6,los-1.3,'s2');
  const h=add('O','HOLD',Lo.QB,bx+0.7,los-7,'s2');h.anim='hold';h.dir=-1.57;add('O','KK',Lo.K,bx-1.5,los-9.4,'s2');
  [...Ld.DL,...Ld.LB].forEach((p,i)=>add('D','R'+i,p,bx+(i-3)*1.4,los+0.9,'s3'));[...Ld.CB,...Ld.S].forEach((p,i)=>add('D','S'+i,p,bx+(i-1.5)*5,los+(i===1||i===2?5:1.2),'s2'));
  gm.ball={still:true,x:bx,y:0.16,z:gm.kz,vx:0,vz:1};}
function tryFG(xp){if(!gm||!uoff()||(!xp&&gm.phase!=='huddle'))return;const d=xp?33:fgDist(),K=gm.LU.K;FLIP=false;gm.camSnap=true;setKickFormation(xp?85:gm.pos);gm.phase='kick';
  gm.kick={xp:!!xp,dist:d,tol:clamp(0.62-(d-20)*0.011+(K.ovr-75)*0.005+(K.xf?0.2:0)-0.04*dk(),0.1,0.88),t:0,m:-1};renderPanel();}
function kickNow(){const k=gm&&gm.kick;if(!k||gm.phase!=='kick')return;gm.kick=null;startKickAnim('U',k.xp,k.dist,Math.abs(k.m)<=k.tol,k.m);}
function aiKick(xp){const d=xp?33:fgDist(),good=Math.random()<clamp(0.95-(d-20)*0.012+(gm.LO.K.ovr-75)*0.004,0.2,0.98);gm.poss='A';FLIP=false;gm.camSnap=true;setKickFormation(xp?85:gm.pos);
  startKickAnim('A',xp,d,good,good?rnd(-0.5,0.5):pick([-1,1])*rnd(0.7,1));}
function startKickAnim(side,xp,dist,good,m){gm.phase='kanim';const kk=gm.by.KK;kk.anim='kickleg';kk.animT=gm.now;
  gm.kanim={side,xp,dist,good,t:0,T:1.25+dist*0.013,xT:gm.bx+(good?m*2.1:(m>=0?1:-1)*(4.2+Math.abs(m)*2.5)),sp:gm.pos,launched:false,done:false};renderPanel();}
function stepKickAnim(dt){const k=gm.kanim,b=gm.ball,kk=gm.by.KK,t0=0.42;k.t+=dt;
  if(k.t<t0)seek(kk,b.x-0.25,b.z-0.6,kk.max*0.8,dt);else accel(kk,0,0,dt);integrate(dt);
  if(k.t>=t0&&!k.launched){k.launched=true;const g=10.7,dz=110-b.z,yT=k.good?rnd(5,8.5):rnd(4,8);gm.ball={fly:true,spin:true,x:b.x,y:0.3,z:b.z,vx:(k.xT-b.x)/k.T,vz:dz/k.T,vy:(yT-0.3)/k.T+0.5*g*k.T,g,t:0,T:99,land:{x:k.xT,z:110}};
    for(const e of gm.ents)if(e.side==='D'&&e.role[0]==='R'){e.vz=-2.5;e.anim='block';}}
  const c=gm.ball;if(c.fly&&c.y>0.12){c.x+=c.vx*dt;c.z+=c.vz*dt;c.y+=c.vy*dt;c.vy-=c.g*dt;if(c.y<=0.12){c.y=0.12;c.vx=c.vz=c.vy=0;c.spin=false;}}
  if(k.launched)for(const e of gm.ents)if(e.side==='D')accel(e,0,0,dt);
  if(k.t>=t0+k.T&&!k.done){k.done=true;if(k.good)addScore(k.side,k.xp?1:3);flash(k.good?(k.xp?'Extra point is good':k.dist+'-yard field goal is good'):'No good');say([[0,k.good?(k.xp?'The extra point is good.':'The kick is up, and it is good from '+k.dist+' yards!'):'No good! He pushed it wide.'],k.xp?null:[1,scoreLine()+'.']]);}
  if(k.t>=t0+k.T+1.2){gm.kanim=null;const other=k.side==='U'?'A':'U';
    if(k.xp)return proceed({ko:k.side});
    tick(5);gm.after=k.good?{ko:k.side,fg:true}:{change:true,to:other,next:Math.max(20,100-k.sp)};afterPlay();}}
// After a touchdown: kick for one or run a play for two.
function startPat(side){gm.poss=side;gm.conv=false;gm.cele=null;
  if(side==='U'){gm.phase='pat';renderPanel();return;}
  const diff=gm.them-gm.us;if(!((gm.q>=4&&(diff===-2||diff===-5||diff===1))||Math.random()<0.03))return aiKick(true);
  if(gm.playDef)return setConv('A');
  const ok=Math.random()<0.45;if(ok)gm.them+=2;showCard('Two-point try',[gm.O.name+(ok?' convert for two.':' are stopped short.')],'Continue',()=>proceed({ko:'A'}));}
function setConv(side){gm.poss=side;FLIP=side==='A';gm.camSnap=true;gm.ko=false;gm.pos=98;gm.down=1;gm.toGo=2;gm.bx=0;gm.conv=true;setHuddle();flash('Two-point try');}
function patPick(two){if(!gm||gm.phase!=='pat')return;if(two)setConv('U');else tryFG(true);}
function celebrate(i){const ce=gm&&gm.cele;if(!ce||ce.picked||gm.phase!=='dead')return;ce.picked=true;ce.e.anim='c'+i;ce.e.animT=gm.now;ce.spike=i===0;gm.deadT=0.8;renderPanel();}

// ----- X-Factor zones -----
function zoneUp(e,need){if(!e||!e.rp.xf||e.rp.pos==='OL'||e.rp.pos==='K')return;const z=gm.zone[e.rp.id]||(gm.zone[e.rp.id]={c:0,on:false,n:e.rp.n,team:e.team});if(z.on)return;if(++z.c>=need){z.on=true;e.zone=true;gm.zmsg='X-Factor on: '+e.rp.n+' · '+XF[e.rp.pos][0];}}
function zoneOut(e){if(!e||!e.rp.xf||e.rp.pos==='OL'||e.rp.pos==='K')return;const z=gm.zone[e.rp.id];if(z){z.c=0;z.on=false;}}

// ----- flags -----
function applyPenalty(pen,who){const uo=uoff(),T=pen.off?(uo?gm.U:gm.O):(uo?gm.O:gm.U),los=gm.pos;let y=pen.y||0,txt,fd=false;
  gm.phase='dead';gm.deadT=0;gm.throwing=null;gm.cele=null;
  if(pen.spot){y=pen.spot-los;gm.pos=pen.spot;gm.down=1;gm.toGo=Math.min(10,100-gm.pos);fd=true;}
  else if(pen.off){y=Math.min(y,Math.max(1,Math.floor(los/2)));gm.pos=los-y;gm.toGo+=y;}
  else{y=Math.min(y,Math.max(1,Math.ceil((100-los)/2)));gm.pos=Math.min(99,los+y);gm.toGo-=y;if(pen.auto||gm.toGo<=0){gm.down=1;gm.toGo=Math.min(10,100-gm.pos);fd=true;}}
  txt='Flag: '+pen.n+(who?' on #'+who.num:'')+', '+T.name+' · '+y+' yards'+(fd?' · First down':pen.pre?'':' · Replay the down');
  const fx=who?who.x:gm.bx+rnd(-8,8),fz=pen.spot||(who?who.z:los+rnd(-1,5));gm.flag={x:clamp(fx+rnd(-1.5,1.5),-25,25),z:fz+rnd(-1,1),t:gm.now};
  if(!pen.pre)tick(5);gm.tkBy=null;gm.after={};gm.msg=txt;flash(txt);say([[0,'Flag on the play. '+pen.n+' on '+T.name+', '+y+' yards.']]);renderPanel();}
// ----- the broadcast booth: spoken play-by-play and captions -----
const BOOTH=['Ray Calloway','Tony Mercer'],ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth'];let voices=null,capT=0;
function pickVoices(){try{const v=speechSynthesis.getVoices().filter(x=>/^en/i.test(x.lang));if(!v.length)return;const a=v.find(x=>/en-US/i.test(x.lang))||v[0],b=v.find(x=>x.name!==a.name&&/en-(US|GB)/i.test(x.lang))||v.find(x=>x.name!==a.name)||a;voices=[a,b];}catch(e){}}
function say(lines,keep,nocap){if(!S.talk||!lines)return;lines=lines.filter(l=>l&&l[1]);if(!lines.length)return;
  const el=document.getElementById('cap');if(el&&!nocap){el.innerHTML=lines.map(l=>'<b>'+BOOTH[l[0]].split(' ')[0]+':</b> '+esc(l[1])).join('<br>');el.hidden=false;capT=2.5+lines.reduce((n,l)=>n+l[1].length,0)*0.055;}
  if(S.talk===2&&window.speechSynthesis){try{if(!keep)speechSynthesis.cancel();if(!voices)pickVoices();
    for(const l of lines){const u=new SpeechSynthesisUtterance(l[1]);if(voices)u.voice=voices[l[0]];u.rate=l[0]?1.05:1.15;u.pitch=l[0]?0.75:1.05;speechSynthesis.speak(u);}}catch(e){}}}
function hush(){try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
function scoreLine(){const a=gm.us,b=gm.them;return a===b?'We are tied at '+a:(a>b?gm.U.name+' '+a+', '+gm.O.name+' '+b:gm.O.name+' '+b+', '+gm.U.name+' '+a);}
// per-player numbers for this game
function PS(e){const id=e.rp.id;return gm.ps[id]||(gm.ps[id]={n:e.rp.n,pos:e.rp.pos,team:e.team,att:0,cmp:0,py:0,ptd:0,pint:0,car:0,ry:0,rec:0,recy:0,td:0,tk:0,sk:0,int:0});}
function callIt(kind,gain,fd,c,tk,passed,note){const qb=gm.by.QB,L=[],T=uoff()?gm.U:gm.O,nm=e=>e.rp.n,r=Math.random();
  if(kind==='td'){L.push([0,'Touchdown '+T.name+'! '+(c?nm(c)+(passed?' hauls it in':' takes it in')+(gain>1?' from '+gain+' yards out.':'.'):'')]);L.push([1,scoreLine()+', with the try still to come.']);}
  else if(kind==='int'){const d=gm.intBy;L.push([0,'Intercepted! '+(d?nm(d)+' picks it off.':'')]);L.push([1,pick(['That is a costly mistake by '+nm(qb)+'.','He never saw the defender.','Great read by the defense.'])]);}
  else if(kind==='sack'){const s=tk?PS(tk).sk:0;L.push([0,(tk?nm(tk):'The rush')+' brings down '+nm(qb)+' for a loss of '+(-gain)+'.']);L.push([1,s>=2?'That is his '+ORD[Math.min(7,s-1)]+' sack today.':pick(['The protection broke down.','He had nowhere to go with the ball.','That is a drive killer.'])]);}
  else if(kind==='inc'){L.push([0,note&&!/^Incomplete|^Out/.test(note)?note.replace('#','number ')+'.':'Incomplete'+(gm.ball&&gm.ball.target?', intended for '+nm(gm.ball.target)+'.':'.')]);if(gm.down>4)L.push([1,'And the defense holds.']);else if(gm.down===4)L.push([1,'That brings up fourth down.']);}
  else if(passed&&gm.caught&&c){const s=PS(c),q=PS(qb);L.push([0,(gain>=20?pick([nm(qb)+' goes deep to '+nm(c)+'! A gain of '+gain,nm(qb)+' finds '+nm(c)+' wide open for '+gain]):pick([nm(qb)+' to '+nm(c)+' for '+(gain>0?gain:'no gain'),nm(qb)+' finds '+nm(c)+', '+(gain>0?'a gain of '+gain:'no gain'),'Caught by '+nm(c)+' for '+(gain>0?gain:'no gain')]))+(fd?', and a first down.':'.')]);
    if(s.rec>=3&&r<0.6)L.push([1,nm(c)+' now has '+s.rec+' catches for '+s.recy+' yards.']);else if(q.att>=6&&r<0.5)L.push([1,nm(qb)+' is '+q.cmp+' of '+q.att+' for '+q.py+' yards.']);else if(gain>=20)L.push([1,pick(['That is a big-time throw.','Look at the room he had.','You cannot leave him that open.'])]);}
  else if(c){const s=PS(c);L.push([0,gain>=10?nm(c)+' breaks free for '+gain+(fd?' and a first down.':'.'):gain>0?pick([nm(c)+' carries for '+gain,nm(c)+' picks up '+gain,'Handoff to '+nm(c)+', a gain of '+gain])+(fd?', enough for the first down.':'.'):gain===0?nm(c)+' is stopped for no gain.':nm(c)+' is dropped for a loss of '+(-gain)+'.']);
    if(gm.bigHit&&tk)L.push([1,'What a hit by '+nm(tk)+'!']);else if(s.car>=4&&r<0.55)L.push([1,s.car+' carries for '+s.ry+' yards for '+nm(c)+'.']);else if(gain<=0&&tk)L.push([1,nm(tk)+' was there waiting for him.']);}
  if(gm.zmsg&&L.length<2)L.push([1,gm.zmsg.replace('X-Factor on: ','').split(' · ')[0]+' is in the zone now. Watch him.']);
  say(L.slice(0,2));}
// ----- stadium introduction before kickoff -----
function startIntro(){gm.phase='intro';gm.intro={t:0};const H=gm.home,V=gm.userHome?gm.O:gm.U,st=stadOf(H),el=document.getElementById('intro');
  const caps=gm.U.roster.filter(x=>x.cap).map(x=>x.n),xs=[...gm.U.roster,...gm.O.roster].filter(x=>x.xf).sort((a,b)=>b.ovr-a.ovr).slice(0,4).map(x=>x.n);
  el.innerHTML='<p class="eyebrow">Welcome to</p><h2>'+stadName(H)+'</h2><p class="sub">'+H.name+' · '+ROOF[st[0]]+' · '+st[3]+',000 seats</p><p class="x">'+esc(st[4])+'</p><p><b>'+V.name+'</b> ('+V.w+'-'+V.l+') at <b>'+H.name+'</b> ('+H.w+'-'+H.l+')</p>'+(caps.length?'<p class="x">Your captains: '+caps.map(esc).join(', ')+'</p>':'')+(xs.length?'<p class="x">X-Factors to watch: '+xs.map(esc).join(', ')+'</p>':'');el.hidden=false;
  cam.x=0;cam.y=26;cam.z=-54;cam.pitch=0.52;document.getElementById('cap').hidden=true;capT=0;renderPanel();
  say([[0,'Welcome to '+stadName(H)+'. '+st[4]],[0,'I am '+BOOTH[0]+', alongside '+BOOTH[1]+'. '+V.name+' visit '+H.name+' today.'],[1,xs.length?'Keep your eyes on '+xs[0]+'. He can take over a game.':'This one should be a battle up front.']],false,true);}
function stepIntro(dt){const I=gm.intro;I.t+=dt;const u=Math.min(1,I.t/9),e=u*u*(3-2*u);cam.y=26+(12-26)*e;cam.z=-54+32*e;cam.pitch=0.52-0.14*e;cam.x=Math.sin(u*3.1416)*12;if(I.t>11)endIntro();}
function endIntro(){if(!gm||gm.phase!=='intro')return;document.getElementById('intro').hidden=true;gm.intro=null;cam.x=0;cam.y=10.5;cam.pitch=0.36;kickoff('A');}
// ----- flags: you accept or decline when the other team commits the foul -----
function penCalc(pen,pos,down,toGo){if(pen.spot)return {pos:pen.spot,down:1,toGo:Math.min(10,100-pen.spot)};
  if(pen.off){const y=Math.min(pen.y,Math.max(1,Math.floor(pos/2)));return {pos:pos-y,down,toGo:toGo+y};}
  const y=Math.min(pen.y,Math.max(1,Math.ceil((100-pos)/2))),q=Math.min(99,pos+y),tg=toGo-y;return (pen.auto||tg<=0)?{pos:q,down:1,toGo:Math.min(10,100-q)}:{pos:q,down,toGo:tg};}
function downText(d,tg,pos){const uo=uoff(),PT=uo?gm.U:gm.O,DT=uo?gm.O:gm.U;return ['1st','2nd','3rd','4th'][Math.min(3,d-1)]+' & '+(pos+tg>=100?'Goal':tg)+' at '+(pos===50?'midfield':'the '+(pos<50?PT.abbr+' '+pos:DT.abbr+' '+(100-pos)));}
function flagPick(acc){const f=gm&&gm.pend;if(!f||gm.phase!=='flag')return;gm.pend=null;
  if(acc){const s=f.snap;gm.pos=s.pos;gm.down=s.down;gm.toGo=s.toGo;gm.bx=s.bx;gm.us=s.us;gm.them=s.them;gm.clock=s.clock;gm.exp=s.exp;gm.st=s.st;gm.zone=s.zone;gm.ps=s.ps;gm.cele=null;gm.after=null;applyPenalty(f.pen,f.who);}
  else{flash('Penalty declined');say([[0,'The penalty is declined.']]);gm.phase='dead';gm.deadT=99;renderPanel();}}
// A foul on this play, and whether the team it helps would want it enforced.
function rollFoul(kind,z){if(gm.conv||gm.ko||gm.q===5)return null;const los=gm.pos,r=Math.random(),gain=(kind==='inc'||kind==='int')?0:(kind==='td'?100:Math.min(99,Math.round(z)))-los,E=gm.ents,D=E.filter(e=>e.side==='D');
  if(r<0.016)return {pen:{off:true,n:'Holding',y:10},who:pick(E.filter(isOL)),want:kind!=='int'&&gain>0};
  if(r<0.03)return {pen:{off:false,n:'Defensive holding',y:5,auto:true},who:pick(D.filter(e=>e.role[0]!=='D')),want:!(kind==='td'||gain>=Math.max(5,gm.toGo))};
  if(kind==='inc'&&gm.pbu&&r<0.12){const sp=clamp(Math.round(gm.ball.land.z),los+1,99);if(sp>=los+4)return {pen:{off:false,n:'Pass interference',spot:sp,auto:true},who:pick(D.filter(e=>e.role[0]==='C')),want:true};}
  if(gm.thrownAt!=null&&r>0.994)return {pen:{off:false,n:'Roughing the passer',y:15,auto:true},who:pick(D.filter(e=>e.role[0]==='D')),want:kind!=='td'&&gain<15};
  return null;}

// ----- downs, scoring, clock -----
function tick(sec){if(gm.q===5)return;gm.clock-=sec;if(gm.clock<=0){gm.clock=0;gm.exp=true;}}
function addScore(side,pts){if(side==='U')gm.us+=pts;else gm.them+=pts;}
function endPlay(kind,z,note){if(gm.phase!=='live')return;const uo=uoff(),other=uo?'A':'U',c=gm.carrier;
  if(gm.ko){gm.phase='dead';gm.deadT=0;let txt;
    if(kind==='td'){addScore(gm.poss,6);txt=uo?'Kick return touchdown!':'Kick return touchdown '+gm.O.name;gm.after={td:true};for(const e of gm.ents)if(e.side==='O'&&!e.down&&e!==c)e.anim='cele';if(uo)gm.cele={e:c,picked:false};else{c.anim='c'+rint(1,3);c.animT=gm.now;}}
    else{const s=clamp(Math.round(z),1,99);txt='Returned to the '+(s<=50?s:100-s)+'-yard line';gm.after={change:true,to:gm.poss,next:s};if(c)say([[0,c.rp.n+' brings the kickoff out to the '+(s<=50?s:100-s)+'.']]);}
    gm.tkBy=null;gm.msg=txt;flash(txt);renderPanel();return;}
  if(gm.conv){gm.phase='dead';gm.deadT=0;gm.throwing=null;const ok=kind==='td';if(ok){addScore(gm.poss,2);for(const e of gm.ents)if(e.side==='O'&&!e.down)e.anim='cele';}
    gm.conv=false;gm.tkBy=null;gm.after={ko:gm.poss};gm.msg=ok?'Two-point try is good':'Two-point try fails';flash(gm.msg);renderPanel();return;}
  const foul=rollFoul(kind,z),ub=!!foul&&(foul.pen.off?!uo:uo);if(foul&&!ub&&foul.want)return applyPenalty(foul.pen,foul.who);
  const snap0=ub?{pos:gm.pos,down:gm.down,toGo:gm.toGo,bx:gm.bx,us:gm.us,them:gm.them,clock:gm.clock,exp:gm.exp,st:Object.assign({},gm.st),zone:JSON.parse(JSON.stringify(gm.zone)),ps:JSON.parse(JSON.stringify(gm.ps))}:null;
  gm.phase='dead';gm.deadT=0;gm.throwing=null;
  const los=gm.pos,st=gm.st,passed=gm.thrownAt!=null,by=gm.by,tk=gm.tkBy;
  let txt='',after={},run=18,cg=0,cfd=false;
  if(kind==='inc'){txt=note;gm.down++;run=5;}
  else if(kind==='int'){txt=(gm.xfNote||'')+(uo?'Intercepted!':'Interception! Your ball');gm.xfNote='';if(uo)st.int++;else st.dInt++;after={change:true,to:other,next:z>=100?20:clamp(Math.round(100-z),1,99)};run=6;zoneOut(by.QB);zoneUp(gm.intBy,1);PS(by.QB).pint++;if(gm.intBy)PS(gm.intBy).int++;}
  else{const td=kind==='td',zr=td?100:Math.min(99,Math.round(z)),gain=zr-los;cg=gain;
    if(kind==='sack'){if(tk){PS(tk).sk++;PS(tk).tk++;}}else{if(passed&&gm.caught&&c){PS(by.QB).py+=gain;PS(c).recy+=gain;if(td){PS(by.QB).ptd++;PS(c).td++;}}else if(c){const s=PS(c);s.car++;s.ry+=gain;if(td)s.td++;}if(tk)PS(tk).tk++;}
    if(uo){if(kind==='sack')st.sk++;else if(passed)st.yds+=gain;else st.rush+=gain;if(td&&passed)st.td++;}
    else{if(kind==='sack')st.dSk++;st.dYds+=gain;}
    if(kind==='sack'){zoneOut(by.QB);zoneUp(tk,1);}
    else{if(gm.caught){zoneUp(by.QB,2);zoneUp(c,2);}else if(c&&c.rp.pos==='RB'){if(gain>=4)zoneUp(c,2);else if(gain<=-2)zoneOut(c);}
      if(tk)zoneUp(tk,tk.rp.pos==='DL'?(gain<=0?1:3):2);}
    if(td||gain>=20)for(const e of gm.ents)if(e.side==='D')zoneOut(e);
    if(td){addScore(gm.poss,6);txt=uo?'Touchdown!':'Touchdown '+gm.O.name;after={td:true};run=6;
      for(const e of gm.ents)if(e.side==='O'&&!e.down&&e!==c)e.anim='cele';
      if(c){if(uo)gm.cele={e:c,picked:false};else{c.anim='c'+rint(1,3);c.animT=gm.now;}}}
    else if(zr<=0){addScore(other,2);txt='Safety';after={ko:gm.poss};}
    else{gm.pos=zr;if(c)gm.bx=clamp(c.x,-3.1,3.1);
      if(gain>=gm.toGo){gm.down=1;gm.toGo=Math.min(10,100-zr);cfd=true;txt=(gain>=0?'+':'')+gain+' yards · First down';}
      else{gm.down++;gm.toGo-=gain;txt=kind==='sack'?'Sacked · '+gain+' yards':gain===0?'No gain':(gain>0?'+':'')+gain+' yard'+(Math.abs(gain)===1?'':'s');}
      if(gm.bigHit)txt='Big hit! '+txt;
      if(kind==='oob')run=6;}}
  callIt(kind,cg,cfd,c,tk,passed,note);gm.bigHit=false;
  if(foul){const FT=foul.pen.off?(uo?gm.U:gm.O):(uo?gm.O:gm.U),w=foul.who;gm.flag={x:clamp((w?w.x:gm.bx)+rnd(-1.5,1.5),-25,25),z:(foul.pen.spot||(w?w.z:los))+rnd(-1,1),t:gm.now};
    if(ub){gm.pend={pen:foul.pen,who:w,snap:snap0};txt+=' · Flag on '+FT.name;}else txt+=' · '+foul.pen.n+' on '+FT.name+', declined';}
  if(!after.td&&!after.ko&&!after.change&&gm.down>4){after={change:true,to:other,next:clamp(100-gm.pos,1,99)};txt+=uo?' · Turnover on downs':' · Stopped on downs';}
  gm.tkBy=null;tick(run+Math.min(8,gm.t));gm.after=after;gm.msg=txt;flash(txt);renderPanel();}
function ydName(pos){return pos<50?'your own '+pos:pos===50?'midfield':'the '+gm.O.name+' '+(100-pos);}
function showCard(title,lines,btn,fn){gm.phase='card';gm.card={title,lines,btn,fn};renderPanel();}
function cardGo(){if(!gm||!gm.card)return;const fn=gm.card.fn;gm.card=null;fn();}
function nextQuarter(){if(!gm.exp)return false;if(gm.q===2){halftime();return true;}if(gm.q===4){endReg();return true;}gm.q++;gm.clock=QLEN;gm.exp=false;say([[0,'That is the end of the '+ORD[gm.q-2]+' quarter. '+scoreLine()+'.']],true);return false;}
function give(side,pos){gm.ko=false;if(side==='A'&&!gm.playDef)return oppDrive(pos);startDrive(side,pos);}
function proceed(a){if(nextQuarter())return;if(a.ko)return kickoff(a.ko);if(a.change)return give(a.to,a.next);setHuddle();}
function afterPlay(){if(gm.pend){gm.phase='flag';renderPanel();return;}const a=gm.after||{};gm.after=null;gm.flag=null;
  if(gm.q===5){if(a.td||a.fg)return finalCard();if(a.change||a.ko){gm.them+=3;return showCard('Overtime',[gm.O.name+' kick the winning field goal.'],'See final score',finalCard);}return setHuddle();}
  if(a.td)return startPat(gm.poss);
  proceed(a);}
function halftime(){gm.q=3;gm.clock=QLEN;gm.exp=false;{const st=gm.st;say([[0,'We have reached halftime. '+scoreLine()+'.'],[1,gm.LU.QB.n+' is '+st.cmp+' of '+st.att+' for '+Math.round(st.yds)+' yards at the break.']],true);}showCard('Halftime',[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,'You kick off to start the second half.'],'Start second half',()=>kickoff('U'));}
function endReg(){if(gm.us===gm.them){gm.q=5;gm.exp=false;showCard('Overtime',['Tied at '+gm.us+'. You get the ball first. Score and you win.'],'Start overtime',()=>startDrive('U',25));}else finalCard();}
function finalCard(){const st=gm.st,lines=[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,
  gm.LU.QB.n+': '+st.cmp+' of '+st.att+', '+Math.round(st.yds)+' yards, '+st.td+' TD, '+st.int+' INT','Rushing: '+Math.round(st.rush)+' yards · Sacks taken: '+st.sk];
  if(gm.playDef)lines.push('Defense: '+Math.round(st.dYds)+' yards allowed · '+st.dSk+' sacks · '+st.dInt+' interceptions');
  say([[0,'And that is the ball game. Final score: '+scoreLine()+'.'],[1,gm.us>gm.them?gm.U.name+' earned that one.':gm.O.name+' were the better team today.']],true);
  showCard(gm.us>gm.them?'You win':'You lose',lines,'Back to team',finishGame);}
function finishGame(){const us=gm.us,them=gm.them;
  for(const id in gm.ps){const q=gm.ps[id];if(q.team!=='U')continue;const s=S.pst[id]||(S.pst[id]={n:q.n,pos:q.pos});s.n=q.n;for(const k of ['att','cmp','py','ptd','pint','car','ry','rec','recy','td','tk','sk','int'])s[k]=(s[k]||0)+q[k];}
  hush();document.getElementById('cap').hidden=true;document.getElementById('intro').hidden=true;gm=null;FLIP=false;hideGame();finishUserGame(us,them);render();}
// The other team's fourth-down choice when you are playing defense.
function aiFourth(){if(gm.down!==4)return false;const d=fgDist(),O=gm.O,sp=gm.pos;
  if(d<=53){aiKick(false);return true;}
  if(gm.toGo<=2&&sp>=50)return false;
  const net=rint(36,50),land=sp+net,s=land>=100?20:clamp(100-land,3,60);tick(8);
  showCard(O.name+' punt',[net+'-yard punt. You start at '+ydName(s)+'.'],'Continue',()=>proceed({change:true,to:'U',next:s}));return true;}
// Simulated drive, used when "play defense" is turned off.
function oppDrive(s){const O=gm.O,diff=ratings(O).off-ratings(gm.U).def,lines=[];let next=25;s=clamp(s,1,99);gm.poss='A';
  if(gm.clock<18){gm.clock=0;gm.exp=true;lines.push(O.name+' run out the clock.');}
  else{let pTD=clamp(0.27+diff*0.011+(s-25)*0.006+0.04*dk(),0.06,0.8);const pFG=clamp(0.14+(s-25)*0.004,0.08,0.3),pTO=clamp(0.13-diff*0.003,0.05,0.22);
    const plays=rint(3,11);let time=plays*rint(7,11);if(time>gm.clock+10){time=gm.clock;pTD*=0.6;}
    const x=Math.random();
    if(x<pTD){const pat=Math.random()<0.95;gm.them+=pat?7:6;lines.push(O.name+' drive '+(100-s)+' yards in '+plays+' plays. Touchdown'+(pat?'.':', but the extra point is no good.'));next=-1;}
    else if(x<pTD+pFG){gm.them+=3;lines.push(O.name+' move into range and hit a '+rint(24,49)+'-yard field goal.');next=-1;}
    else if(x<pTD+pFG+pTO){const y=clamp(s+rint(2,35),5,95),who=pick([...gm.LU.DL,...gm.LU.LB,...gm.LU.CB,...gm.LU.S]);next=100-y;lines.push('Turnover! '+who.n+' ('+who.pos+') takes the ball away.');}
    else{const y=clamp(s+rint(3,30),10,70),land=y+rint(36,50);next=land>=100?20:clamp(100-land,5,45);lines.push(O.name+' go '+(y-s)+' yards and punt.');}
    tick(time);}
  const over=gm.exp&&(gm.q===4||gm.q===2);
  if(!over)lines.push(next<0?'They kick off to you.':'You take over at '+ydName(next)+'.');
  showCard(O.name+' possession',lines,'Continue',()=>proceed(next<0?{ko:'A'}:{change:true,to:'U',next}));}
function punt(){if(!gm||gm.phase!=='huddle'||!uoff())return;const net=rint(36,50),land=gm.pos+net,s=land>=100?20:clamp(100-land,3,60);tick(8);
  showCard('Punt',[net+'-yard punt. '+gm.O.name+' start at their own '+s+'.'],'Continue',()=>proceed({change:true,to:'A',next:s}));}
function simRest(){if(!gm||(gm.card&&gm.card.fn===finishGame))return;const f=gm.q>=5?0:((4-gm.q)*QLEN+gm.clock)/(4*QLEN),r=simGame(gm.U,gm.O);
  const sc=x=>{const v=x*f,td=Math.floor(v/7);return td*7+(v-td*7>=3.5?3:0);};gm.us+=sc(r[0]);gm.them+=sc(r[1]);
  if(gm.us===gm.them){if(Math.random()<0.5)gm.us+=3;else gm.them+=3;}gm.q=4;gm.clock=0;gm.exp=false;gm.kick=null;gm.kanim=null;gm.pend=null;gm.intro=null;document.getElementById('intro').hidden=true;cam.y=10.5;cam.pitch=0.36;finalCard();}

// ----- body motion -----
function updPose(e,dt){const p=e.pose,sp=Math.hypot(e.vx,e.vz),t=gm.t,now=gm.now,ph=gm.phase;
  const T={lean:0.05,lTh:0.05,rTh:0.05,lKn:0.1,rKn:0.1,lArm:0.1,rArm:0.1,lEl:0.25,rEl:0.25,fall:0,hop:0,spread:0.12,roll:0};
  const pre=ph==='presnap'||ph==='huddle'||ph==='kick'||ph==='card'||ph==='pat'||(ph==='kanim'&&!gm.kanim.launched);
  const fwd=e.vx*Math.sin(e.dir)+e.vz*Math.cos(e.dir);
  if(sp>0.6&&!e.down){e.ph+=sp*dt*1.75;const a=Math.min(1,sp/6.5),s=Math.sin(e.ph),c=Math.cos(e.ph);
    if(fwd<-0.8){T.lTh=s*0.45*a-0.1;T.rTh=-s*0.45*a-0.1;T.lKn=a*(0.35+0.4*Math.max(0,c));T.rKn=a*(0.35+0.4*Math.max(0,-c));T.lArm=-s*0.35;T.rArm=s*0.35;T.lEl=T.rEl=1.1;T.lean=0.12;}
    else{T.lTh=s*(0.6+0.45*a)+0.18*a;T.rTh=-s*(0.6+0.45*a)+0.18*a;T.lKn=a*(0.2+1.35*Math.max(0,c+0.25));T.rKn=a*(0.2+1.35*Math.max(0,-c+0.25));
      T.lArm=-s*(0.5+0.5*a);T.rArm=s*(0.5+0.5*a);T.lEl=T.rEl=0.5+1.05*a;T.lean=0.08+0.26*a;T.hop=Math.abs(c)*0.07*a;}
    let av=e.dir-e.pdir;while(av>Math.PI)av-=2*Math.PI;while(av<-Math.PI)av+=2*Math.PI;T.roll=clamp(-av/Math.max(dt,0.004)*sp*0.004,-0.28,0.28);}
  else if(pre){if(e.stance==='s3'){T.lean=0.95;T.lTh=T.rTh=0.8;T.lKn=T.rKn=1.35;T.rArm=1.15;T.rEl=0;T.lArm=0.5;T.lEl=1.0;}
    else if(e.stance==='s2'){T.lean=0.32;T.lTh=T.rTh=0.38;T.lKn=T.rKn=0.62;T.lArm=T.rArm=0.25;T.lEl=T.rEl=0.9;}
    else{T.lean=0.12;T.lTh=T.rTh=0.15;T.lKn=T.rKn=0.28;T.lArm=T.rArm=0.7;T.lEl=T.rEl=1.25;}}
  e.pdir=e.dir;if(e.stumble>t&&!e.down)T.lean=0.7;
  const an=e.anim,u=now-e.animT;
  if(an==='block'){T.lean=0.28;T.lArm=T.rArm=1.5;T.lEl=T.rEl=0.25;if(sp<=0.6){T.lTh=T.rTh=0.35;T.lKn=T.rKn=0.6;}}
  else if(an==='throw'){const v=(t-e.animT)/0.36;if(v>1.4)e.anim='idle';else{const w=Math.min(1,v/0.55),f=clamp((v-0.55)/0.45,0,1);T.rArm=v<0.55?1.2+2.5*w:3.7-2.7*f;T.rEl=v<0.55?1.4:0.2;T.lArm=0.9;T.lEl=0.8;T.lean=0.1;}}
  else if(an==='catch'){T.lArm=T.rArm=2.3;T.lEl=T.rEl=0.35;}
  else if(an==='carry'){T.rArm=0.55;T.rEl=1.9;}
  else if(an==='hold'){T.lean=0.55;T.lTh=1.5;T.lKn=1.6;T.rTh=0.2;T.rKn=1.7;T.lArm=T.rArm=1.0;T.lEl=T.rEl=0.3;}
  else if(an==='kickleg'){const v=u/0.5;if(v<0.84)T.rTh=-0.7;else if(v<1.5){T.rTh=1.6;T.rKn=0.05;T.lean=-0.12;T.lArm=1.2;T.hop=0.06;}else e.anim='idle';}
  else if(an==='down'){const q=e.spl||[2.2,2.2,0.2,0.2,0.3,0.1];T.fall=e.fallAmt;T.roll=e.rollT*1.35;T.lArm=q[0];T.rArm=q[1];T.lEl=q[2];T.rEl=q[3];T.lTh=q[4]*0.5;T.rTh=q[5]*0.3;T.lKn=q[4];T.rKn=q[5];T.lean=0;}
  else if(an==='dive'){T.fall=e.down?(e.fallAmt||0.92):0.92;T.roll=e.down?e.rollT:0;T.lArm=T.rArm=2.2;T.lEl=T.rEl=0.1;T.lean=0;T.lTh=T.rTh=0.1;T.lKn=T.rKn=0.15;}
  else if(an==='cele'){T.lArm=T.rArm=3.0;T.lEl=T.rEl=0.1;T.lean=-0.05;T.hop=Math.abs(Math.sin(now*9+e.ph))*0.4;T.spread=0.3;}
  else if(an==='c0'){if(u<0.5){T.rArm=3.1;T.rEl=0.1;T.lean=-0.15;}else if(u<0.9){T.rArm=0.5;T.rEl=0;T.lean=0.55;}else{T.lArm=T.rArm=1.5;T.lEl=T.rEl=2.2;T.spread=1.0;T.lean=-0.12;T.hop=Math.abs(Math.sin(now*7))*0.12;}}
  else if(an==='c1'){const w=Math.sin(now*8);T.lArm=1.9+w*0.9;T.rArm=1.9-w*0.9;T.lEl=T.rEl=0.9;T.spread=0.5;T.lean=0.1*Math.sin(now*4);T.hop=Math.abs(w)*0.18;T.lTh=0.25*w;T.rTh=-0.25*w;T.lKn=T.rKn=0.4;e.dir+=dt*3.2;}
  else if(an==='c2'){T.lArm=T.rArm=1.5;T.lEl=T.rEl=2.3;T.spread=1.05;T.lean=-0.16;T.lTh=T.rTh=0.3;T.lKn=T.rKn=0.5;T.hop=Math.abs(Math.sin(now*5))*0.08;}
  else if(an==='c3'){T.rArm=3.1;T.rEl=0;T.lArm=0.3;T.lean=-0.2;T.lTh=0.9;T.lKn=1.5;T.rKn=1.2;T.rTh=-0.1;}
  if(an==='dive'&&!e.down&&e.stun<=t&&!e.lunge)e.anim='idle';
  const k=1-Math.exp(-dt*18),kf=1-Math.exp(-dt*10);
  for(const key in T){if(key==='fall')p.fall+=(T.fall-p.fall)*kf;else if(key==='roll')p.roll+=(T.roll-p.roll)*kf;else if(key==='hop')p.hop=T.hop;else p[key]+=(T[key]-p[key])*k;}
  if(e.down)return;
  let want=e.dir;if(e.face)want=Math.atan2(e.face.x-e.x,e.face.z-e.z);else if(sp>1)want=Math.atan2(e.vx,e.vz);
  let dd=want-e.dir;while(dd>Math.PI)dd-=2*Math.PI;while(dd<-Math.PI)dd+=2*Math.PI;e.dir+=dd*(1-Math.exp(-dt*12));}
function updCam(dt){const uo=uoff();let fx=gm.bx,fz=uo?gm.pos-5:gm.pos+5,back=uo?15.5:19;const b=gm.ball,c=gm.ctl,ph=gm.phase;
  if(ph==='intro')return;if(ph==='pat'){gm.camSnap=false;return;}
  let yT=10.5,pT=0.36;if((ph==='huddle'||ph==='presnap')&&!gm.ko){yT=12;pT=0.39;back+=1.5;fx*=0.6;if(uo)fz+=2.5;}
  if(ph==='kick'||ph==='kanim'){fx=gm.bx;fz=gm.kz+2;back=15;}
  else if(gm.ko){const r=gm.by.RET,car=gm.carrier;if(uo){fx=r.x;fz=r.z;back=14;}else{fx=c?c.x:0;fz=Math.max(c&&!c.down?c.z:0,car?car.z:0,ph==='presnap'?66:0)-3;back=15;}}
  else if(ph==='live'||ph==='dead'){
    if(b&&b.fly&&b.land){fx=uo?b.x:b.land.x;fz=uo?Math.max(gm.by.QB?gm.by.QB.z:b.z,b.z-4):b.land.z;back=uo?15.5:17;}
    else if(!uo&&gm.mode==='pocket'&&ph==='live'&&c){fx=c.x*0.6;fz=(c.z+gm.pos+5)/2;}
    else if(b&&b.held){fx=b.held.x;fz=b.held.z;if(!uo)back=16;}else if(gm.cele){fx=gm.cele.e.x;fz=gm.cele.e.z;back=11;}else if(gm.focus){fx=gm.focus.x;fz=gm.focus.z;}}
  const k=gm.camSnap?1:1-Math.exp(-dt*4.5);gm.camSnap=false;cam.x+=(RX(fx)*0.7-cam.x)*k;cam.z+=(RZ(fz)-back-cam.z)*k;cam.y+=(yT-cam.y)*k;cam.pitch+=(pT-cam.pitch)*k;}

// ----- frame loop, HUD, input -----
function flash(t){const el=document.getElementById('flash');el.textContent=t;el.classList.add('on');flashT=1.9;}
function fmtClock(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function whoTag(e,pre){const rp=e.rp,T=e.team==='U'?gm.U:gm.O;return sw(T)+' '+(pre||'')+'<b>#'+e.num+' '+esc(rp.n)+'</b> <span>'+rp.pos+' · '+rp.ovr+' OVR</span>'+(rp.xf?' <em class="xf'+(e.zone?'':' off')+'">X</em> <span>'+XF[rp.pos][0]+(e.zone?' is on':'')+'</span>':'');}
function updHud(){const g=gm,A=g.userHome?g.O:g.U,Hm=g.home,as=g.userHome?g.them:g.us,hs=g.userHome?g.us:g.them,uo=g.poss==='U',PT=uo?g.U:g.O,DT=uo?g.O:g.U;
  const ord=['1st','2nd','3rd','4th'][Math.min(3,g.down-1)],goal=g.pos+g.toGo>=100;
  const spot=g.pos===50?'Midfield':(g.pos<50?PT.abbr+' '+g.pos:DT.abbr+' '+(100-g.pos)),dot='<em class="poss" title="Has the ball"></em>';
  const sit=g.ko?'Kickoff':g.conv?'Two-point try':(g.kanim||g.kick)?((g.kanim||g.kick).xp?'Extra point':(g.kanim||g.kick).dist+'-yard field goal'):g.phase==='pat'?'After the touchdown':ord+' &amp; '+(goal?'Goal':g.toGo)+' · '+spot;
  const s=`<div class="tm">${sw(A)}<b>${A.abbr}</b>${PT===A?dot:''}<i>${as}</i></div><div class="mid"><b>${g.q>=5?'OT':'Q'+g.q+' '+fmtClock(g.clock)}</b><span>${sit}</span></div><div class="tm"><i>${hs}</i>${PT===Hm?dot:''}<b>${Hm.abbr}</b>${sw(Hm)}</div>${g.flag?'<span class="flagchip">Flag</span>':''}<button class="btn ghost sm" data-a="simRest">Sim<span class="wide"> rest</span></button>`;
  if(s!==hudStr){hudStr=s;document.getElementById('bug').innerHTML=s;}
  // who has the ball
  let w='';const b=g.ball;
  if(g.phase==='live'||g.phase==='dead'){if(b&&b.fly&&b.target&&!b.ko)w=whoTag(b.target,'Pass to ');else{const c=g.carrier||(b&&b.held);if(c&&c.rp)w=whoTag(c);}}
  const zl=[];for(const id in g.zone){const z=g.zone[id];if(z.on)zl.push(esc(z.n));}
  if(zl.length)w+=(w?'<br>':'')+'<span class="zl"><em class="xf">X</em> In the zone: '+zl.join(', ')+'</span>';
  if(w!==whoStr){whoStr=w;const el=document.getElementById('who');el.innerHTML=w;el.hidden=!w;}}
function frame(ts){if(!gm){rafOn=false;return;}const real=Math.min(0.05,(ts-lastTs)/1000||0.016);lastTs=ts;const dt=real*(SPEED_X[S.speed]||1);
  const n=Math.max(1,Math.ceil(dt/0.0167)),h=dt/n;
  for(let i=0;i<n&&gm;i++){gm.now+=h;const ph=gm.phase;if(ph==='live'){if(gm.ko)stepKO(h);else stepLive(h);}else if(ph==='dead')stepDead(h);else if(ph==='kanim')stepKickAnim(h);if(!gm)break;for(const e of gm.ents)updPose(e,h);}
  if(!gm){rafOn=false;return;}
  if(gm.kick){const k=gm.kick;k.t+=real;k.m=Math.sin(k.t*(2.6+k.dist*0.035)-1.57);const mk=document.getElementById('kmk');if(mk)mk.style.left=((k.m+1)*50)+'%';}
  if(flashT>0){flashT-=real;if(flashT<=0)document.getElementById('flash').classList.remove('on');}
  if(capT>0){capT-=real;if(capT<=0)document.getElementById('cap').hidden=true;}
  if(gm.phase==='intro')stepIntro(real);if(!gm){rafOn=false;return;}
  updCam(real);updHud();renderGame();requestAnimationFrame(frame);}
function fitCanvas(){if(!cv)return;const st=document.getElementById('stage');DPR=Math.min(2,window.devicePixelRatio||1);W=Math.max(2,Math.round(st.clientWidth*DPR));H=Math.max(2,Math.round(st.clientHeight*DPR));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}
function showGame(){document.getElementById('game').hidden=false;hudStr='';whoStr='x';fitCanvas();if(!rafOn){rafOn=true;lastTs=performance.now();requestAnimationFrame(frame);}}
function hideGame(){document.getElementById('game').hidden=true;}
function setKeys(){const k=inp.k;inp.kx=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);inp.kz=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0);}
function initInput(){cv=document.getElementById('cv');ctx=cv.getContext('2d');
  if(window.ResizeObserver)new ResizeObserver(fitCanvas).observe(document.getElementById('stage'));addEventListener('resize',fitCanvas);
  addEventListener('keydown',ev=>{if(!gm)return;const c=ev.code,ph=gm.phase;if(c==='Space'||c==='Tab'||c.startsWith('Arrow'))ev.preventDefault();inp.k[c]=true;setKeys();if(ev.repeat)return;
    if(c==='Space'){if(ph==='presnap')snap();else if(ph==='live'){if(uoff())juke();else dive();}else if(ph==='kick')kickNow();else if(ph==='dead'){if(!gm.cele||gm.cele.picked)gm.deadT=9;}else if(ph==='card')cardGo();else if(ph==='intro')endIntro();}
    else if(c==='Tab'||c==='KeyQ'||c==='KeyE'){if(ph==='huddle'){const ids=GROUPS.map(x=>x[0]).filter(x=>uoff()||x==='S'||x==='Q');const i=ids.indexOf(gm.tab);setTab(ids[(i+(c==='KeyQ'?ids.length-1:1))%ids.length]);}else switchCtl();}
    else if(/^(Digit|Numpad)[1-9]$/.test(c)){const n=+c.slice(-1);
      if(ph==='huddle'){const L=listed();if(n<=L.length){if(uoff())callPlay(L[n-1]);else callDef(L[n-1]);}}
      else if(ph==='pat'){if(n<=2)patPick(n===2);}
      else if(ph==='flag'){if(n<=2)flagPick(n===1);}
      else if(ph==='dead'&&gm.cele&&!gm.cele.picked){if(n<=CELES.length)celebrate(n-1);}
      else if(ph==='live'&&uoff()&&!gm.ko){const r=gm.elig.find(e=>e.key===n);if(r)throwTo(r);}}});
  addEventListener('keyup',ev=>{inp.k[ev.code]=false;setKeys();});
  addEventListener('blur',()=>{inp.k={};setKeys();});
  const startStick=ev=>{inp.stick={id:ev.pointerId,x:ev.clientX,y:ev.clientY};inp.sx=inp.sz=0;};
  const pt=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*DPR,(ev.clientY-r.top)*DPR];};
  cv.addEventListener('pointerdown',ev=>{if(!gm)return;ev.preventDefault();const p=pt(ev),ph=gm.phase;
    if(ph==='intro'){endIntro();return;}
    if(ph==='presnap'){snap();return;}
    if(ph==='dead'){if(!gm.cele||gm.cele.picked)gm.deadT=9;return;}
    if(ph!=='live')return;
    if(uoff()&&gm.mode==='pocket'&&!gm.ko){let best=null,bd=52*DPR;for(const e of gm.elig){if(e.sx==null)continue;const d=Math.hypot(e.sx-p[0],e.sy-p[1]);if(d<bd){bd=d;best=e;}}if(best){throwTo(best);return;}}
    if(ev.pointerType==='mouse'){if(!uoff())dive();else if(gm.mode==='run')juke();return;}
    startStick(ev);});
  addEventListener('pointermove',ev=>{const s=inp.stick;if(!s||s.id!==ev.pointerId)return;inp.sx=clamp((ev.clientX-s.x)/44,-1,1);inp.sz=clamp(-(ev.clientY-s.y)/44,-1,1);});
  const up=ev=>{if(inp.stick&&inp.stick.id===ev.pointerId){inp.stick=null;inp.sx=inp.sz=0;}};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
  document.getElementById('panel').addEventListener('pointerdown',ev=>{if(!gm||gm.phase!=='live'||ev.pointerType==='mouse'||ev.target.closest('button'))return;ev.preventDefault();startStick(ev);});}
