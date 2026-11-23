// ===== the match =====
const QLEN=240; // default; each game uses gm.QL from the quarter-length setting
// Ten skin tones, light to deep. A player keeps his tone (p.sk); older saves map onto the nearest of these.
const SKINS=['#f6d8bf','#ecc29f','#e0ad84','#cc956b','#b47c54','#9a6443','#7f4f33','#683f28','#52301e','#3d2316'];
const SK_OLD=[1,3,4,6,7,8],skinIx=rp=>rp&&rp.sk!=null?clamp(rp.sk,0,9):SK_OLD[((rp&&rp.id)||0)%6],skinOf=rp=>SKINS[skinIx(rp)];
// Formations: where each skill player lines up, as [x from the ball, z from the line, stance].
const FORMS={
 gun:{n:'Shotgun',QB:[0,-5],RB:[1.9,-5.3],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]},
 single:{n:'Singleback',QB:[0,-1.4],RB:[0,-6.5],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]},
 iform:{n:'I-Form',QB:[0,-1.4],RB:[0,-7],TE:[0,-4.3],WR1:[-19,-0.6],WR2:[19,-1],WR3:[4.6,-0.7,'s3']},
 trips:{n:'Trips',QB:[0,-5],RB:[-1.9,-5.3],TE:[9,-1],WR1:[-19,-0.6],WR2:[19.5,-0.6],WR3:[14,-1.3]},
 bunch:{n:'Bunch',QB:[0,-5],RB:[-1.9,-5.3],TE:[9.3,-1.6],WR1:[-19,-0.6],WR2:[11,-0.6],WR3:[12.6,-1.7]},
 empty:{n:'Empty',QB:[0,-5],RB:[-13,-1.2],TE:[4.5,-0.7,'s3'],WR1:[-20,-0.6],WR2:[20,-0.6],WR3:[12,-1.2]},
 pistol:{n:'Pistol',QB:[0,-3.6],RB:[0,-6.6],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],WR3:[-9.5,-1]},
 pro:{n:'Pro I (two backs)',QB:[0,-1.4],RB:[0,-7.2],WR3:[0,-4.4],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],fb:1},
 split:{n:'Split backs',QB:[0,-5],RB:[2,-5.2],WR3:[-2,-5.2],TE:[4.5,-0.7,'s3'],WR1:[-19,-0.6],WR2:[19,-1],fb:1},
 punt:{n:'Punt',QB:[0,-13],RB:[-1.4,-4.6],WR3:[1.4,-4.6],TE:[4.5,-0.7,'s3'],WR1:[-22,-0.6],WR2:[22,-0.6],pk:1},
 fgf:{n:'Field goal',QB:[0.7,-7],RB:[-1.5,-9.4],WR3:[-4.4,-0.9,'s3'],TE:[4.4,-0.9,'s3'],WR1:[-5.8,-1.3],WR2:[5.8,-1.3],kick:1}};
// Routes: [toward own sideline (+) or the middle (-), depth, stop?] from the receiver's spot.
const RT={go:[[0,45]],seam:[[-1,45]],fade:[[2.5,40]],slant:[[0,2],[-8,9],[-16,16]],hitch:[[0,6],[-0.5,5,1]],curl:[[0,12],[-1.5,10,1]],comeback:[[0,15],[2.5,12,1]],
 out:[[0,5],[8,5]],sail:[[0,12],[9,18]],dig:[[0,12],[-16,12]],in5:[[0,5],[-12,5.5]],corner:[[0,10],[9,22]],post:[[0,13],[-10,32]],drag:[[0,2],[-24,5]],cross:[[0,6],[-24,16]],
 stick:[[0,6],[1.5,5.5,1]],tflat:[[2,3],[9,4.5]],rflat:[[5,3.5],[11,7.5]],swing:[[6,1.5],[12,5.5]],wheel:[[6,3],[11,6.5],[12,30]],angle:[[5,5.5],[-3,11]],check:[[3,5.5],[3.5,6.5,1]],
 screen:[[5,1.5],[8,2.5,1]],fflat:[[5,4.5],[11,6]],trail:[[-6,1],[-11,7],[-11.5,9,1]]};
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
 {n:'QB Sneak',g:'R',t:'run',f:'single',aim:0,sneak:1,s:'short goal',d:'The quarterback pushes for a yard'},
 {n:'FB Lead',g:'R',t:'run',f:'pro',aim:2.6,hand:0.5,lead:'WR3',s:'first short goal',d:'The fullback leads the tailback through the hole'},
 {n:'Split Zone',g:'R',t:'run',f:'split',aim:-1.2,hand:0.45,lead:'WR3',s:'first med',d:'One back blocks across, the other carries'},
 {n:'Pro PA Post',g:'P',f:'pro',pa:1,aim:1.5,s:'first med',d:'Fake to the tailback, the fullback slips into the flat',r:{WR1:'post',WR2:'dig',TE:'cross',WR3:'rflat',RB:null}},
 {n:'Split Swing',g:'Q',f:'split',s:'med long',d:'Both backs leak out to the flats',r:{WR1:'slant',WR2:'curl',TE:'seam',WR3:'swing',RB:'swing'}},
 {n:'Flea Flicker',g:'T',f:'single',flea:1,aim:0.6,s:'',d:'Handoff, the back pitches it back, then a deep shot',r:{WR1:'post',WR2:'go',WR3:'seam',TE:'drag',RB:null}},
 {n:'WR Reverse',g:'T',t:'run',f:'single',rev:1,aim:6,hand:0.4,s:'',d:'The back runs right, the receiver takes it back left'},
 {n:'Hook and Lateral',g:'T',f:'gun',hook:1,s:'',d:'Catch on a curl, then pitch it to the trailing back (L)',r:{WR1:'go',WR2:'go',WR3:'curl',TE:'seam',RB:'trail'}},
 {n:'Fake Punt',g:'T',f:'punt',fake:'punt',s:'',d:'Fourth down only. The punter throws to an up-back',r:{WR1:'go',WR2:'slant',TE:'stick',WR3:'rflat',RB:'check'}},
 {n:'Fake Field Goal',g:'T',f:'fgf',fake:'fg',s:'',d:'Fourth down only. The holder throws to the wing',r:{WR1:'tflat',WR2:'stick',TE:'seam',WR3:null,RB:null}},
 {n:'Holder Keeper',g:'T',t:'run',f:'fgf',fake:'fg',sneak:1,aim:7,s:'',d:'Fourth down only. The holder runs for the edge'}];
for(const p of PB)if(!p.t)p.t='pass';
const GROUPS=[['S','Coach picks'],['Q','Quick pass'],['D','Deep pass'],['P','Play action'],['R','Run'],['T','Trick plays']];
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
const inp={k:{},kx:0,kz:0,sx:0,sz:0,p1x:0,p1z:0,p2x:0,p2z:0,stick:null};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const isOL=e=>e.role==='LT'||e.role==='LG'||e.role==='C'||e.role==='RG'||e.role==='RT';
const uoff=()=>gm.poss==='U';
const zOn=(e,pos)=>e&&e.zone&&e.rp.pos===pos,zx=(e,k)=>!!(e&&e.zone&&xfKey(e.rp)===k);
const XF_SPD={wreck:1.05,escape:1.06,deep:1.06,seam:1.05,hands:1.03,speed:1.1,blitz:1.08,lock:1.05,press:1.05,closer:1.08};

function makeKit(T,key){const U0=uniOf(T),u=U0[key]||U0.H,j=u[0],p=u[2];
  return {jersey:j,pads:j,sleeve:j,num:u[1],pants:p,socks:lum(j)>0.8?(lum(p)>0.8?u[4]:p):j,helmet:u[3],stripe:u[4],shoes:'#18191b',mask:lum(u[3])>0.55?'#3a3f46':'#d5d8dc',glove:lum(u[4])>0.85?'#e9e9e6':u[4]};}
function lineup(T){const s=p=>starters(T,p).map(x=>x.cap?Object.assign({},x,{ovr:Math.min(99,x.ovr+2)}):x);const h=pos=>T.roster.filter(p=>p.pos===pos&&!p.inj).sort((a,b)=>b.ovr-a.ovr);const rb1=s('RB')[0],rb2=h('RB').filter(p=>!rb1||p.id!==rb1.id)[0]||h('TE')[1]||h('WR')[3]||rb1;
  return {RB2:rb2,QB:s('QB')[0],RB:s('RB')[0],WR:s('WR'),TE:s('TE')[0],OL:s('OL'),K:s('K')[0],DL:s('DL'),LB:s('LB'),CB:s('CB'),S:s('S')};}
function jerseyName(n){n=String(n).trim();const w=n.split(/\s+/);return (w.length>1&&w[w.length-1].length>2?w[w.length-1]:n).toUpperCase().slice(0,11);}
// Body types by position plus a little per player, a personal gait, and gear choices, so no two players look or move the same.
const BODY={OL:[1.22,1.04],DL:[1.16,1.03],TE:[1.08,1.03],LB:[1.06,1.01],QB:[1.0,1.02],RB:[1.04,0.96],WR:[0.93,1.02],CB:[0.92,0.99],S:[0.96,1.0],K:[0.92,0.98],P:[0.93,1.0]};
function looks(rp){let h=(((rp.id||1)*2654435761)>>>0);const r=()=>{h=(h*1103515245+12345)>>>0;return (h>>>8)/16777216;};const b=BODY[rp.pos]||[1,1],big=rp.pos==='OL'||rp.pos==='DL';
  return {bw:b[0]+(r()-0.5)*0.09,bh:b[1]+(r()-0.5)*0.06,gait:0.92+r()*0.16,bp:r()*6.28,visor:!big&&r()<0.24,eb:r()<0.3,sl:r()<0.3?(r()<0.55?'#16181c':'#f2f2f2'):null,towel:!big&&rp.pos!=='K'&&r()<0.35,shoe:r()<0.5?'#f4f4f4':r()<0.8?'#16181c':null,glove:r()<0.3?'#f2f2f2':r()<0.5?'#16181c':null,cage:big||rp.pos==='LB'||rp.pos==='TE',hips:r()<0.4};}
function mkEnt(side,team,role,rp,x,z,kit,stance){const zs=gm.zone[rp.id],zone=!!rp.xf&&(rp.pos==='OL'||rp.pos==='K'||!!(zs&&zs.on));
  return {side,team,role,rp,x,z:Math.min(z,108),y:0,vy:0,vx:0,vz:0,dir:side==='O'?0:Math.PI,pdir:0,max:(5.2+(rp.spd-50)*0.07)*(zone&&XF_SPD[xfKey(rp)]||1)*(team==='A'&&!gm.two?1+0.012*clamp(dk(),0,2.2):1)*(gm.wx&&gm.wx.sky==='snow'?0.95:gm.wx&&gm.wx.sky==='rain'?0.98:1),kit,skin:skinOf(rp),lk:looks(rp),num:String(rp.num),nm:jerseyName(rp.n),cap:!!rp.cap,zone,
  pose:{lean:0,lTh:0,rTh:0,lKn:0,rKn:0,lArm:0,rArm:0,lEl:0,rEl:0,fall:0,hop:0,spread:0.12,roll:0},ph:Math.random()*6,anim:'idle',animT:0,stance,down:false,stun:0,eng:null,engT:0,shedAt:0,freeUntil:0,tklCd:0,fallDir:1,fallAmt:1,rollT:0,spl:null,
  face:null,route:null,wp:0,cutT:-9,blk:null,beat:0,juke:0,jukeCd:0,slow:0,stumble:0,cover:null,cush:0,lag:0.2,react:0.25,blitz:false,crash:false,dbl:false,zn:null,dz:null,bite:0,lunge:0,lx:0,lz:0,drag:null,wrap:null,brk:false,key:0,sx:null,sy:0,R:null,hip:1};}

function startGame(opp,userHome,uU,uO,opt){opt=opt||{};const U=opt.U||S.teams[S.user];
  gm={U,O:opp,userHome,home:userHome?U:opp,us:0,them:0,q:1,clock:(S.qlen||4)*60,exp:false,poss:'U',pos:25,down:1,toGo:10,bx:0,phase:'huddle',ents:[],by:{},elig:[],ball:null,carrier:null,ctl:null,t:0,now:0,mode:'pocket',
    play:PB[0],defCall:0,after:null,card:null,kick:null,kanim:null,msg:'',zmsg:'',zone:{},playDef:!!S.playDef||!!opt.two||!!opt.drill,camSnap:true,ko:false,conv:false,flag:null,recent:[],recentD:[],tab:'S',sug:[],sugD:[],cele:null,kz:0,
    st:{att:0,cmp:0,yds:0,td:0,int:0,rush:0,sk:0,dSk:0,dInt:0,dYds:0},kitU:makeKit(U,uU),kitO:makeKit(opp,uO),LU:lineup(U),LO:lineup(opp)};
  gm.ps={};gm.pend=null;gm.to={U:3,A:3};gm.run=false;gm.pc=null;gm.recv1='U';gm.injLog=[];gm.QL=(opt.ql||S.qlen||4)*60;gm.clock=gm.QL;gm.quick=!!opt.quick;gm.two=!!opt.two;gm.drill=opt.drill||null;gm.hls=[];gm.ctl2=null;gm.hurry=false;
  gm.road=!!opt.road;if(opt.pro){gm.pro={id:opt.pro.id,pos:opt.pro.pos,side:proSide(opt.pro.pos),n:opt.pro.n};gm.playDef=gm.pro.side==='D';}
  gm.wx=gm.drill?{sky:'clear',wind:0,wdir:1,night:false,indoor:true}:gameWeather(gm.home);if(gm.drill){gm.to={U:0,A:0};gm.playDef=true;}
  buildCrowd(gm.home);showGame();crowdStart();if(gm.drill)drillNext();else startIntro();}
function startDrive(side,pos){gm.run=false;gm.ret=null;gm.loose=null;gm.fumRet=false;gm.poss=side;FLIP=side==='A'&&!gm.two;gm.camSnap=true;gm.ko=false;gm.conv=false;gm.pos=clamp(Math.round(pos),1,99);gm.down=1;gm.toGo=Math.min(10,100-gm.pos);gm.bx=0;setHuddle();
  if(gm&&gm.phase==='huddle'&&gm.playDef&&!gm.drill)flash(gm.two?(side==='U'?gm.U:gm.O).name+' ball':side==='A'?'Defense':'Offense');}

// ----- play calling -----
function situation(){const d=gm.down,tg=gm.toGo,p=gm.pos,uo=uoff();if(gm.conv)return 'goal';
  if((gm.q===2||gm.q===4)&&gm.clock<45&&(gm.q===2||(uo?gm.us<=gm.them:gm.them<=gm.us)))return 'hurry';
  if(p>=95||(p+tg>=100&&tg<=3))return 'goal';if(tg<=2)return 'short';if((d>=3&&tg>=7)||tg>=12)return 'long';if(d===1)return 'first';return 'med';}
function pickFrom(list,sit,n,rec,mix){const c=shuffle(list.filter(p=>p.s.includes(sit)));c.sort((a,b)=>(rec.includes(a.n)?1:0)-(rec.includes(b.n)?1:0));const out=[];
  if(mix){const r=c.find(p=>p.t==='run'),q=c.find(p=>p.t==='pass');if(r)out.push(r);if(q)out.push(q);}
  for(const p of c){if(out.length>=n)break;if(!out.includes(p))out.push(p);}
  for(const p of shuffle(list.slice())){if(out.length>=n)break;if(!out.includes(p)&&p.g!=='T')out.push(p);}return out;}
const pickPlays=(sit,n)=>pickFrom(PB,sit,n,gm.recent,sit!=='long'&&sit!=='hurry');
const pickCalls=(sit,n)=>pickFrom(DCALLS,sit,n,gm.recentD,false);
function aiPlay(){const sit=situation(),d=gm.down,tg=gm.toGo;let pp=0.56;if(sit==='long'||sit==='hurry')pp=0.88;else if(tg<=2)pp=0.35;else if(d===2&&tg>=8)pp=0.7;
  if(gm.q>=4&&gm.them<gm.us)pp=Math.max(pp,0.75);const want=Math.random()<pp?'pass':'run',c=pickPlays(sit,6);return c.find(p=>p.t===want)||c[0];}
function aiDefCall(){const c=pickCalls(situation(),3);let i=DCALLS.indexOf(pick(c));if((i===5||i===6)&&Math.random()>0.55+0.2*dk())i=pick([0,2,3]);gm.recentD=[DCALLS[i].n];return i;}
function setHuddle(){gm.flag=null;gm.tab='S';gm.cele=null;gm.aud=null;gm.audK=null;const sit=situation();
  if(gm.two){gm.hs='O';gm.sug=pickPlays(sit,4);gm.sugD=pickCalls(sit,3);gm.twoPlay=null;setFormation(gm.sug[0],0);}
  else if(gm.poss==='A'){if(!gm.conv&&!gm.drill&&aiFourth())return;gm.aiNext=gm.aiFake||aiPlay();gm.aiFake=null;gm.sugD=pickCalls(sit,3);setFormation(gm.aiNext,gm.defCall||0);}
  else{gm.sug=gm.drill&&gm.drill.kind==='pass'?pickFrom(PB.filter(q=>q.t==='pass'&&q.g!=='T'),sit,4,gm.recent,false):pickPlays(sit,4);gm.aiDef=aiDefCall();setFormation(gm.sug[0],gm.aiDef);}
  gm.aiHurry=!gm.two&&gm.poss==='A'&&((gm.q===2&&gm.clock<120)||(gm.q===4&&gm.them<gm.us&&gm.clock<300));
  gm.phase='huddle';gm.pc=gm.drill?null:40;gm.preT=0;if(gm.poss==='A'){const late=(gm.q===2||gm.q===4)&&gm.clock<150,lead=gm.them-gm.us;gm.aiSnapAt=late&&gm.q===4&&lead>0?rint(1,3):late&&(gm.q===2||lead<=0)?31:rint(5,15);}
  aiTimeoutCheck();renderPanel();if(gm.pro&&gm.phase==='huddle')proHuddle();}
function callPlay(p){if(!gm||gm.phase!=='huddle'||!p)return;if(p.fake&&(gm.down!==4||gm.conv))return;
  if(gm.two){if(gm.hs!=='O')return;gm.twoPlay=p;gm.lastPlay=p;gm.hs='D';gm.tab='S';gm.recent=[p.n,...gm.recent].slice(0,3);renderPanel();return;}if(!uoff())return;gm.lastPlay=p;gm.recent=[p.n,...gm.recent].slice(0,3);setFormation(p,gm.aiDef);gm.phase='presnap';renderPanel();}
function callDef(i){if(!gm||gm.phase!=='huddle'||!DCALLS[i])return;if(gm.two){if(gm.hs!=='D')return;gm.hs=null;setFormation(gm.twoPlay,i);gm.phase='presnap';gm.preT=0;renderPanel();return;}if(uoff())return;gm.recentD=[DCALLS[i].n,...gm.recentD].slice(0,2);gm.recent=[gm.aiNext.n,...gm.recent].slice(0,3);setFormation(gm.aiNext,i);gm.phase='presnap';gm.preT=0;renderPanel();}
function setTab(t){if(!gm||gm.phase!=='huddle')return;gm.tab=t;renderPanel();}
function listed(){if(!gm)return [];if(gm.two?gm.hs==='O':uoff())return gm.tab==='S'?gm.sug:PB.filter(p=>p.g===gm.tab&&(!p.fake||gm.down===4&&!gm.conv));return gm.tab==='S'?gm.sugD.map(c=>DCALLS.indexOf(c)):DCALLS.map((c,i)=>i);}

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
function setFormation(play,dc){if(play.fake&&uoff()&&!gm.two)dc=play.fake==='punt'?2:7;const z0=gm.pos,bx=gm.bx,uo=uoff(),Lo=uo?gm.LU:gm.LO,Ld=uo?gm.LO:gm.LU,ko=uo?gm.kitU:gm.kitO,kd=uo?gm.kitO:gm.kitU,to=uo?'U':'A',td=uo?'A':'U',E=[],by={},F=FORMS[play.f];
  gm.ents=E;gm.by=by;gm.play=play;gm.defCall=dc;gm.ko=false;
  const add=(side,role,rp,x,z,st)=>{const e=mkEnt(side,side==='O'?to:td,role,rp,x,z,side==='O'?ko:kd,st);E.push(e);by[role]=e;return e;};
  ['LT','LG','C','RG','RT'].forEach((r,i)=>add('O',r,Lo.OL[i],bx+(i-2)*1.45,z0-0.7,'s3'));
  const rp={QB:F.pk?Lo.K:Lo.QB,RB:F.kick?Lo.K:Lo.RB,TE:Lo.TE,WR1:Lo.WR[0],WR2:Lo.WR[1],WR3:F.fb?Lo.RB2:Lo.WR[2]};
  for(const r of ['TE','WR1','WR2','WR3','QB','RB']){const f=F[r];add('O',r,rp[r],clamp(bx+f[0],-23.5,23.5),z0+f[1],f[2]||(r==='QB'?'qb':'s2'));}
  [-4.3,-1.45,1.45,4.3].forEach((x,i)=>add('D','DL'+(i+1),Ld.DL[i],bx+x,z0+0.9,'s3'));
  add('D','LB1',Ld.LB[0],bx-5,z0+4.5,'s2');add('D','LB2',Ld.LB[1],bx,z0+4.8,'s2');add('D','LB3',Ld.LB[2],bx+5.5,z0+4.5,'s2');
  add('D','CB1',Ld.CB[0],-18.4,z0+5.5,'s2');add('D','CB2',Ld.CB[1],18.4,z0+5.5,'s2');add('D','SS',Ld.S[0],bx-9,z0+6.5,'s2');add('D','FS',Ld.S[1],bx+2,z0+14,'s2');
  alignDef(dc);gm.elig=[];gm.runPath=null;
  if(play.t==='pass'){for(const r in play.r)if(play.r[r]){by[r].route=buildRoute(by[r],RT[play.r[r]]);gm.elig.push(by[r]);}
    gm.elig.sort((a,b)=>a.x-b.x).forEach((e,i)=>{e.key=i+1;});}
  else{const c=play.sneak?by.QB:by.RB,hx=bx+play.aim;gm.runPath=play.sneak?[[c.x,c.z],[hx,z0+4]]:[[c.x,c.z],[bx+play.aim*0.4,z0-2.2],[hx,z0+1.5],[hx+(play.aim>5?2:play.aim<-5?-2:0),z0+8]];
    if(play.fake&&play.sneak)gm.runPath=[[c.x,c.z],[bx+9,z0-3],[bx+10.5,z0+4]];
    if(play.rev){const w=by.WR2;gm.runPath=[[w.x,w.z],[bx+3,z0-3.4],[bx-4,z0-2.5],[bx-13,z0+3]];}}
  if(F.kick&&!play.sneak){by.QB.anim='hold';by.QB.animT=0;}gm.aud=null;gm.audK=null;gm.trick=null;
  gm.ball={held:by.QB};gm.carrier=null;gm.ctl=uo&&!gm.two?null:gm.pro?(window.__auto?null:proEnt()||by.LB2):by.LB2;gm.ctl2=null;}
function snap(){if(!gm||gm.phase!=='presnap')return;if(gm.ko){const kt=gm.poss==='U'?'A':'U';if(!gm.onside&&gm.koPow==null&&!gm.drill&&(kt==='U'||gm.two))return koMeterStart(kt,gm.poss,true);return snapKO();}const by=gm.by,play=gm.play,uo=uoff(),k=dk(),los=gm.pos;
  if(!gm.conv&&gm.q!==5&&!gm.drill&&Math.random()<0.014){const off=Math.random()<0.55,who=pick(gm.ents.filter(e=>off?isOL(e):e.role[0]==='D'&&e.role[1]==='L'));
    return applyPenalty(off?{off:true,n:'False start',y:5,pre:true}:{off:false,n:'Offside',y:5,pre:true},who);}
  hush();gm.ret=null;gm.loose=null;gm.fumRet=false;gm.lats=0;gm.ctl2=null;gm.onside=false;gm.catchT=0;gm.aud=null;gm.audK=null;gm.trick=(play.flea||play.rev)?{done:false,w:play.rev?by.WR2:null}:null;if(by.QB.anim==='hold')by.QB.anim='idle';
  gm.lcAny=gm.lcCatch=gm.lcRoom=gm.lcGoal=false;gm.phase='live';gm.t=0;gm.handed=!!play.sneak;gm.scr=false;gm.caught=false;gm.thrownAt=null;gm.throwing=null;gm.swatT=null;gm.tkBy=null;gm.intBy=null;gm.pbu=false;gm.airYds=0;
  gm.carrier=by.QB;gm.ball={held:by.QB};gm.mode='pocket';gm.aiDec=rnd(1.5,2.4)-0.1*k;gm.aiAware=Math.random()<0.6+0.15*k;
  gm.hole=play.t==='run'||play.pa?{x:gm.bx+play.aim,z:los+1.5}:null;gm.ucDrop=FORMS[play.f].QB[1]>-3;if(play.sneak)by.QB.anim='carry';
  const A=DEF[gm.defCall];for(const role in A){const a=A[role],d=by[role];if(a[0]==='m')d.cover=by[a[1]];else if(a[0]==='z')d.zn=[a[1],a[2],a[3]];else if(a[0]==='d')d.dz=[a[1],a[2]];else if(a[0]==='r')d.blitz=true;else d.crash=true;}
  for(const e of gm.ents){e.react=0.3+(92-e.rp.ovr)/120;
    if(e.cover){e.cush=e.z-e.cover.z;e.lag=zx(e,'lock')?0:clamp(0.42-e.rp.ovr/300+(uo?-0.04:0.04)*Math.min(k,1.8)+(zx(e.cover,'deep')?0.14:0),0.02,0.55);if(zx(e,'press'))e.cover.jam=0.9;}}
  if(play.pa)for(const r of ['LB1','LB2','LB3','SS']){const d=by[r];if(!d.blitz&&!d.crash)d.bite=rnd(0.25,0.6)*clamp(1.3-(d.rp.ovr-60)/45,0.4,1.3);}
  by.LT.blk=by.DL1;by.LG.blk=by.DL2;by.RG.blk=by.DL3;by.RT.blk=by.DL4;
  if(play.t==='pass'){const bl=by.LB1.blitz?by.LB1:by.LB2.blitz?by.LB2:null;by.C.blk=bl||by.DL2;by.DL2.dbl=!bl;}
  else{const used=new Set(),H=gm.hole,second=gm.ents.filter(d=>d.side==='D'&&d.role[0]!=='D');
    const take=(e,ref)=>{let b=null,bd=1e9;for(const d of second){if(used.has(d))continue;const dd=Math.hypot(d.x-ref.x,d.z-ref.z);if(dd<bd){bd=dd;b=d;}}if(b){used.add(b);e.blk=b;}};
    if(play.lead)take(by[play.lead],H);take(by.C,H);
    for(const r of ['TE','WR3','WR1','WR2','RB'])if(r!==play.lead&&!(r==='RB'&&!play.sneak)&&!(play.rev&&r==='WR2'))take(by[r],by[r]);}
  inp.sx=inp.sz=0;inp.stick=null;recStart();renderPanel();}

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
  const mx=e.max*(e.jam>gm.t?0.4:1);if(w.stop&&e.wp===r.length-1)seek(e,w.x,w.z,mx,dt);else accel(e,dx/l*mx,dz/l*mx,dt);}
function predictPos(e,T){let x=e.x,z=e.z,wp=e.wp;const r=e.route;if(!r||e.free)return {x:x+e.vx*T,z:z+e.vz*T};let rem=T*e.max*0.96;
  while(rem>0&&wp<r.length){const w=r[wp],d=Math.hypot(w.x-x,w.z-z);if(d<=rem){x=w.x;z=w.z;rem-=d;wp++;}else{x+=(w.x-x)/d*rem;z+=(w.z-z)/d*rem;rem=0;}}
  return {x,z};}
function userInput(team){let ix,iz;if(gm&&gm.two){if(team==='A'){ix=inp.p2x;iz=inp.p2z;}else{ix=inp.p1x+inp.sx;iz=inp.p1z+inp.sz;}}else{ix=inp.kx+inp.sx;iz=inp.kz+inp.sz;}if(FLIP){ix=-ix;iz=-iz;}const l=Math.hypot(ix,iz);if(l>1){ix/=l;iz/=l;}return [ix,iz,l];}
function qbMesh(qb,dt){const p=gm.play;seek(qb,gm.bx+p.aim*(p.toss?0.1:0.2),Math.min(qb.z,gm.pos-3),qb.max*0.6,dt);qb.face=gm.by.RB;}
function control(e,dt,mode){const [ix0,iz0,l]=userInput(e.team);let ix=ix0,iz=iz0;const los=gm.pos;
  if(e===gm.by.QB&&gm.play.t==='run'&&!gm.play.sneak){qbMesh(e,dt);return;}
  let sp=e.max*(mode==='pocket'?0.8:0.94);if(e.slow>gm.t)sp*=0.5;if(e.spin>gm.t)sp*=0.72;
  if(l<0.1){if(mode==='pocket'){if(gm.ucDrop&&e.z>los-5.5&&gm.t<1.3)seek(e,e.x,los-6,e.max*0.8,dt);else accel(e,0,0,dt);e.face=gm.throwing?gm.throwing.rec:{x:e.x,z:e.z+10};return;}
    const P=!gm.ko&&!gm.ret&&gm.play.t==='run'&&e.z<los+1&&gm.runPath;if(P){const q=P.find(v=>v[1]>e.z+0.6&&Math.hypot(v[0]-e.x,v[1]-e.z)>1)||P[P.length-1],dx=q[0]-e.x,dz=q[1]-e.z,ll=Math.hypot(dx,dz)||1;ix=dx/ll;iz=dz/ll;}else{ix=0;iz=1;}}
  accel(e,ix*sp,iz*sp,dt);
  if(mode==='pocket')e.face=gm.throwing?gm.throwing.rec:{x:e.x+ix*3,z:e.z+10};}
function juke(team){team=team||'U';const c=gm&&gm.carrier;if(!c||gm.pro&&c.rp.id!==gm.pro.id||gm.phase!=='live'||c.team!==team||gm.mode!=='run'||c.jukeCd>gm.t||c.drag)return;c.juke=gm.t+0.34;c.jukeCd=gm.t+(zx(c,'ankle')?1.1:2.2);
  const ix=gm.two?(team==='A'?inp.p2x:inp.p1x+inp.sx):inp.kx+inp.sx;c.vx+=(ix>0.2?1:ix<-0.2?-1:(Math.random()<0.5?1:-1))*8;}
function blockDur(b,d){const diff=(b.rp.ovr-d.rp.ovr)/55;let base;const pp=gm.play.t==='pass'&&gm.mode==='pocket';
  if(pp&&isOL(b))base=(b.team==='U'?2.5:2.1)+Math.random()*2.0+(d.dbl?0.8:0);
  else if(d.role[0]!=='D')base=0.5+Math.random()*0.8;else if(isOL(b))base=1.0+Math.random()*1.5;else base=0.8+Math.random()*1.0;
  base*=1+(b.team==='U'?-0.1:0.1)*dk();let dur=Math.max(0.5,base*(1+diff));
  if(pp&&zx(b,'anchor'))dur=Math.max(dur,3.5);else if(zx(b,'anchor'))dur*=1.3;if(!pp&&zx(b,'grader'))dur*=2;if(zx(b,'mauler'))dur*=1.45;if(zx(b,'wall'))dur*=1.8;
  if(zx(d,'unstop')){dur=Math.min(dur,rnd(0.6,1.0));d.xfShed=true;}else if(zx(d,'speed'))dur*=0.7;else if(zx(d,'blitz'))dur*=0.55;
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
    const ts=gm.ret?'O':'D';if((a===car&&b.side===ts)||(b===car&&a.side===ts))continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;
    if(d2<0.64&&d2>1e-6){const d=Math.sqrt(d2),p=(0.8-d)/2,ux=dx/d,uz=dz/d;a.x-=ux*p;a.z-=uz*p;b.x+=ux*p;b.z+=uz*p;}}}}

// ----- tackling: momentum decides how the runner goes down -----
function tryTackle(d,c){const t=gm.t,lg=d.lunge>t;if(d.tklCd>t||c.down||dist(d,c)>(d.eng?0.85:lg?1.6:1.12))return;d.tklCd=t+0.7;
  if(c.drag){if(d!==c.drag.by)finishTackle(d,c);return;}
  const qbp=c===gm.by.QB&&gm.mode==='pocket',ball=c.rp.pos==='RB'||c.rp.pos==='TE';
  const xk=c.zone&&xfKey(c.rp),brk=qbp?xk==='escape':(xk==='wreck'||xk==='mismatch'||xk==='yac'&&gm.caught);
  if(brk&&!c.brk&&!d.eng&&!zx(d,'enforcer')&&!zx(d,'closer')){c.brk=true;d.stun=t+0.9;d.lunge=0;d.anim='dive';d.vx*=0.3;d.vz*=0.3;c.slow=t+0.1;flash(xfName(c.rp)+'! '+c.rp.n+(qbp?' slips the sack':' breaks the tackle'));return;}
  let p=qbp?(c.team==='U'?0.72:0.88):0.75+(d.rp.ovr-c.rp.ovr)/220+(c.team==='U'?0.05:-0.05)*Math.min(dk(),1.6)+(c.team==='A'?0.06:0);
  if(!qbp){const ab=xk==='ankle';if(c.juke>t)p-=ab?0.5:0.22;if(c.spin>t)p-=ab?0.55:0.3;if(c.rp.pos==='RB'&&!gm.caught)p-=0.02;}
  if(d===gm.ctl)p+=lg?0.18:0.1;if(d.eng)p*=0.2;const sure=(zx(d,'enforcer')||zx(d,'closer'))&&!d.eng;if(sure)p=0.97;
  if(Math.random()<clamp(p,0.08,0.97)){
    if(!qbp&&!lg&&!sure&&Math.random()<0.3){c.drag={by:d,until:t+0.28+Math.random()*0.25};d.wrap=c;d.anim='block';return;}
    finishTackle(d,c);}
  else if(d.eng){c.slow=t+0.2;}else{d.stun=t+0.7;d.lunge=0;d.anim='dive';d.vx*=0.4;d.vz*=0.4;c.slow=t+0.18;c.stumble=t+0.35;flash(c.spin>t?'Spin move! '+c.rp.n+' gets free':qbp?(uoff()?'Escaped the sack!':'He slips away'):c.team==='U'?'Broken tackle!':'Missed tackle');}}
function finishTackle(d,c){const t=gm.t;c.drag=null;for(const x of gm.ents)x.wrap=null;
  const rvx=d.vx-c.vx,rvz=d.vz-c.vz,rs=Math.hypot(rvx,rvz),big=rs>9&&!d.eng;
  const fx=Math.sin(c.dir),fz=Math.cos(c.dir),ix=d.x-c.x,iz=d.z-c.z,il=Math.hypot(ix,iz)||1,front=(ix*fx+iz*fz)/il,side=(ix*fz-iz*fx)/il;
  c.down=true;c.anim='down';d.down=true;d.anim='dive';d.lunge=0;gm.tkBy=d;
  if(Math.abs(side)>0.72){c.rollT=side>0?-1:1;c.fallDir=1;c.fallAmt=0.5;}else{c.rollT=rnd(-0.25,0.25);c.fallDir=front>0.1?-1:1;c.fallAmt=1;}
  const mx=c.vx*0.5+d.vx*0.5,mz=c.vz*0.5+d.vz*0.5;c.vx=mx;c.vz=mz;d.vx=mx;d.vz=mz;d.fallDir=1;d.fallAmt=0.9;d.rollT=rnd(-0.3,0.3);
  if(big){c.vy=3.4;c.y=0.02;c.vx+=rvx*0.3;c.vz+=rvz*0.3;c.fallAmt=1;gm.bigHit=true;}
  c.spl=[rnd(1.0,2.9),rnd(1.0,2.9),rnd(0,0.8),rnd(0,0.8),rnd(0.1,1.0),rnd(0.1,1.0)];
  let n=0;for(const x of gm.ents){if(x.side!==d.side||x===d||x.down||x.eng||x.stun>t||n>=2)continue;if(dist(x,c)<2.3){x.down=true;x.anim='dive';x.fallAmt=0.9;x.rollT=rnd(-0.4,0.4);x.vx=(c.x-x.x)*2.2+mx*0.5;x.vz=(c.z-x.z)*2.2+mz*0.5;n++;}}
  maybeInjure(c,d,big);const sk=c===gm.by.QB&&c.z<gm.pos&&!gm.ko&&gm.mode==='pocket';if(fumbleCheck(c,d,big,sk))return;
  endPlay(gm.ret?'int':c===gm.by.QB&&c.z<gm.pos&&!gm.ko&&gm.play.t==='pass'?'sack':'tackle',c.z);}
function dragStep(c,dt){const g=c.drag,sp=Math.hypot(c.vx,c.vz)||1,f=c.max*0.3;accel(c,c.vx/sp*f,c.vz/sp*f,dt);c.stumble=gm.t+0.1;if(gm.t>=g.until||g.by.down||g.by.stun>gm.t)finishTackle(g.by,c);}

// ----- the other team's offense -----
function nearestRusher(q){let nd=null,dn=99;for(const d of gm.ents){if(d.side!=='D'||d.down||d.eng||d.stun>gm.t)continue;const dd=dist(d,q);if(dd<dn){dn=dd;nd=d;}}return [nd,dn];}
function aiQB(qb,dt){const t=gm.t,[nd,dn]=nearestRusher(qb);let tx=gm.bx,tz=gm.pos-7.5;
  if(nd&&dn<4.5){tx=qb.x+(qb.x>=nd.x?1:-1)*3;tz=gm.pos-8.5;}
  seek(qb,clamp(tx,gm.bx-7,gm.bx+7),tz,qb.max*0.7,dt);qb.face=gm.throwing?gm.throwing.rec:{x:qb.x,z:qb.z+10};
  if(gm.throwing)return;const hot=gm.aiAware&&dn<2.2&&t>1.0;
  if(t<gm.aiDec+(gm.play.pa?0.4:0)&&!hot)return;
  let best=null,bs=-9,bo=0;for(const e of gm.elig){const o=openness(e),dp=e.z-gm.pos,sc=Math.min(o,5)+dp*0.07+(dp>=gm.toGo?0.8:0)+rnd(-0.6,0.6)+(gm.pro&&e.rp.id===gm.pro.id&&o>1.2?(e.rp.pos==='RB'?0.8:1.5):0);if(sc>bs){bs=sc;best=e;bo=o;}}
  if(bo>1.7||hot||t>gm.aiDec+1.1){if(bo<0.8&&!hot){endPlay('inc',0,'Thrown away');return;}throwTo(best);}}
function aiRun(c,dt){const t=gm.t,p=gm.play;if(c===gm.by.QB&&p.t==='run'&&!p.sneak){qbMesh(c,dt);return;}
  let dx=0,dz=1,nd=null,dn=99;
  for(const d of gm.ents){if(d.side!=='D'||d.down||d.stun>t)continue;const ox=c.x-d.x,oz=c.z-d.z,dd=Math.hypot(ox,oz);
    if(dd<7&&oz<1.5){dx+=(ox>=0?1:-1)*(7-dd)/7*1.6*(d.eng?0.4:1);if(!d.eng&&dd<dn){dn=dd;nd=d;}}}
  if(gm.hole&&p.t==='run'&&c.z<gm.pos+1)dx+=clamp((gm.hole.x-c.x)*0.6,-2,2);
  if(c.x>FW-3)dx-=1.6;if(c.x<-FW+3)dx+=1.6;const l=Math.hypot(dx,dz);let sp=c.max*0.9;if(c.slow>t)sp*=0.5;if(c.spin>t)sp*=0.72;
  accel(c,dx/l*sp,dz/l*sp,dt);
  if(nd&&dn<1.9&&c.jukeCd<=t&&Math.random()<dt*(1.5+0.6*dk())){if(Math.random()<0.3){c.spin=t+0.42;c.jukeCd=t+2.6;}else{c.juke=t+0.34;c.jukeCd=t+2.6;c.vx+=(c.x>=nd.x?1:-1)*8;}}}

// ----- playing defense -----
function userDefend(d,dt){const t=gm.t,c=gm.carrier;
  if(d.stun>t){accel(d,0,0,dt);return;}
  if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;return;}
  if(d.lunge){if(d.lunge>t){d.vx=d.lx*d.max*1.8;d.vz=d.lz*d.max*1.8;if(c)tryTackle(d,c);return;}d.lunge=0;d.stun=t+0.7;d.vx*=0.2;d.vz*=0.2;return;}
  if(d.eng){if(t>=Math.min(d.shedAt,(d.engT||t)+0.9)||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
    else{accel(d,0,0,dt);d.anim='block';d.face=d.eng;if(c&&gm.mode==='run')tryTackle(d,c);return;}}
  d.anim=gm.swatT!=null&&t-gm.swatT<0.45?'catch':'idle';
  const [ix,iz,l]=userInput(d.team);if(l<0.1)accel(d,0,0,dt);else accel(d,ix*d.max*1.03,iz*d.max*1.03,dt);
  if(c&&!(c===gm.by.QB&&gm.play.t==='run'&&!gm.handed))tryTackle(d,c);}
function dive(team){team=team||'U';const d=gm&&ctlOf(team);if(!d||gm.phase!=='live'||gm.loose||(gm.carrier&&gm.carrier.team===team)||d.down||d.stun>gm.t||d.eng||d.lunge||d.wrap)return;
  const b=gm.ball;if(b&&b.fly&&!b.ko){gm.swatT=gm.t;return;}
  const c=gm.carrier;let dx,dz;if(c&&dist(d,c)<5){dx=c.x+c.vx*0.15-d.x;dz=c.z+c.vz*0.15-d.z;}else{dx=d.vx;dz=d.vz;}const l=Math.hypot(dx,dz);if(l<0.1)return;
  d.lunge=gm.t+0.26;d.lx=dx/l;d.lz=dz/l;d.tklCd=0;d.anim='dive';}
function switchCtl(team){team=team||'U';if(!gm||gm.pro||(gm.phase!=='live'&&gm.phase!=='presnap')||(gm.carrier&&gm.carrier.team===team&&gm.phase==='live'))return;const b=gm.ball,c=gm.carrier,cur=ctlOf(team);if(!cur)return;const sd=cur.side;
  const tx=b&&b.fly?b.land.x:c?c.x:gm.bx,tz=b&&b.fly?b.land.z:c?c.z:gm.pos;
  const arr=gm.ents.filter(d=>d.side===sd&&d.team===team&&!d.down&&d.role!=='KK').sort((p,q)=>Math.hypot(p.x-tx,p.z-tz)-Math.hypot(q.x-tx,q.z-tz));if(arr.length<2)return;
  const nx=gm.phase==='presnap'?arr[(arr.indexOf(cur)+1)%arr.length]:(arr[0]===cur?arr[1]:arr[0]);if(cur)cur.lunge=0;if(gm.ctl===cur)gm.ctl=nx;else gm.ctl2=nx;}

// How open a receiver is: the smaller of his gap now and his gap a beat from now.
function openness(e){const f=predictPos(e,0.7);let dn=99;
  for(const d of gm.ents)if(d.side==='D'&&!d.down){const a=Math.hypot(d.x-e.x,d.z-e.z),b=Math.hypot(d.x+d.vx*0.5-f.x,d.z+d.vz*0.5-f.z);dn=Math.min(dn,a,b+0.6);}
  return dn;}
// ----- passing -----
function throwTo(rec){const qb=gm.by.QB;if(gm.phase!=='live'||gm.mode!=='pocket'||gm.throwing||gm.carrier!==qb)return;gm.throwing={rec,at:gm.t+0.2};qb.anim='throw';qb.animT=gm.t;}
function releaseBall(rec){const qb=gm.by.QB,rp=qb.rp,uo=uoff(),zq=zx(qb,'gun'),dime=zx(qb,'dime');let T=0.6,land,d=0;
  for(let i=0;i<4;i++){land=predictPos(rec,T);d=Math.hypot(land.x-qb.x,land.z-qb.z);T=Math.max(0.26,d/((clamp(17+d*0.32,17,27)+(rp.ovr-75)*0.08)*(zq?1.3:1)));}
  const pres=!zq&&gm.ents.some(x=>x.side==='D'&&!x.eng&&!x.down&&dist(x,qb)<2.6),mv=!zq&&Math.hypot(qb.vx,qb.vz)>2.5;
  const sig=(0.28+d*0.022+Math.max(0,d-20)*0.03)*(1+(92-rp.ovr)/45)*(pres?1.7:1)*(mv?1.35:1)*(zq?0.4:1)*(dime&&d>=16?0.45:1)*(uo?1+0.1*dk():1.15-0.12*dk())*(gm.wx.sky==='rain'?1.15:gm.wx.sky==='snow'?1.2:1)*(1+(gm.wx.wind||0)/60*(d>15?1:0.3));
  land.x=clamp(land.x+gauss()*sig+(gm.wx.wdir||1)*(gm.wx.wind||0)*0.004*d,-28,28);land.z+=gauss()*sig;
  const x0=qb.x+0.3,z0=qb.z+0.3,y0=2.05,g=10.7;gm.airYds=land.z-gm.pos;
  gm.ball={fly:true,dist:d,x:x0,y:y0,z:z0,t:0,T,land,target:rec,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.45-y0)/T+0.5*g*T,g};
  gm.carrier=null;if(uo)gm.st.att++;PS(qb).att++;gm.thrownAt=gm.t;liveCall('throw',rec);
  if((!uo||gm.two)&&gm.ctl&&!gm.pro){let nd=null,dn=99;for(const x of gm.ents)if(x.side==='D'&&!x.down){const dd=Math.hypot(x.x-land.x,x.z-land.z);if(dd<dn){dn=dd;nd=x;}}
    if(nd&&nd!==gm.ctl&&Math.hypot(gm.ctl.x-land.x,gm.ctl.z-land.z)>dn+2){gm.ctl.lunge=0;gm.ctl=nd;}}}
function resolvePass(){const b=gm.ball,rec=b.target,L=b.land,dR=Math.hypot(rec.x-L.x,rec.z-L.z),uo=uoff(),k=dk()*(uo?1:-1);let dD=99,D=null;
  for(const x of gm.ents)if(x.side==='D'&&!x.down&&x.stun<=gm.t){const dd=Math.hypot(x.x-L.x,x.z-L.z);if(dd<dD){dD=dd;D=x;}}
  const inb=Math.abs(L.x)<=FW-0.1&&L.z<=110&&L.z>=-10,swat=!uo&&D&&D===gm.ctl&&gm.swatT!=null&&gm.t-gm.swatT<0.5&&dD<2.2;
  const sure=zx(rec,'hands')||zx(rec,'mismatch'),hawk=zx(D,'hawk')||zx(D,'lurker')&&(b.dist||0)<22,lock=zx(D,'lock')&&dD<2.6,picker=zx(D,'pick'),ham=zx(D,'hammer')&&dD<1.8,
    win=zx(rec,'seam')||zx(gm.by.QB,'dime')&&(b.dist||0)>=16;
  const im=(1+0.3*k)*(hawk?3:1)*(swat?3:1)*(picker?3.5:1)*(win?0.4:1);let out;
  if(dR<=1.6&&inb){const pInt=sure?0:clamp((dD<1.0?(dD<dR?0.12:0.03):swat?0.05:0)*im,0,0.6),hands=rec.rp.ovr-(rec.role==='RB'||rec.role==='TE'?5:0);
    let pC=clamp(0.96-(96-hands)/200-(dD<0.8?0.3:dD<1.6?0.15:dD<2.6?0.04:0)-dR*0.05-(lock?0.25:0)-0.04*k-(swat?0.3:0)-(ham?0.2:0)+(win&&dD<2.6?0.22:0)-(gm.wx.sky==='rain'?0.05:gm.wx.sky==='snow'?0.04:0)-(dD<3.5?clamp(((b.dist||0)-14)*0.014,0,0.3):0),0.05,0.97);if(sure)pC=Math.max(pC,0.96);
    out=Math.random()<pInt?'int':Math.random()<pC?'catch':(dD<1.8?'pbu':'drop');}
  else out=(dD<1.1&&inb&&!sure&&Math.random()<Math.min(0.6,0.15*im))?'int':'miss';
  if(out==='catch'){gm.catchT=gm.t;rec.x=rec.x*0.4+L.x*0.6;rec.z=rec.z*0.4+L.z*0.6;rec.anim='carry';rec.slow=gm.t+0.2;gm.carrier=rec;gm.ball={held:rec};gm.caught=true;if(uo)gm.st.cmp++;PS(gm.by.QB).cmp++;PS(rec).rec++;
    if((sure||win&&zx(rec,'seam'))&&dD<1.8)flash(xfName(rec.rp)+'! '+rec.rp.n+' holds on');else if(zx(gm.by.QB,'gun')&&gm.airYds>=15)flash('Gunslinger! '+gm.by.QB.rp.n+' threads it');else if(zx(gm.by.QB,'dime')&&gm.airYds>=18)flash('Dime Dropper! Right on the money');
    if(rec.z>=100)endPlay('td',100);else liveCall('catch',rec);}
  else if(out==='int'){D.anim='carry';gm.ball={held:D};gm.focus={x:D.x,z:D.z};gm.intBy=D;if(hawk||picker)gm.xfNote=xfName(D.rp)+'! ';startReturn(D,L.z);}
  else{if(out==='pbu'){zoneUp(D,1);gm.pbu=true;PS(D).pd=(PS(D).pd||0)+1;recCred(D,1.8,'Pass breakup');}else if(out==='drop')zoneOut(rec);
    endPlay('inc',0,out==='pbu'?(swat?'Swatted away!':(lock?'Lockdown! ':'')+'Broken up by #'+D.num):out==='drop'?'Dropped':(inb?'Incomplete':'Out of bounds'));}}

// ----- spin moves -----
function spin(team){team=team||'U';const c=gm&&gm.carrier;if(!c||gm.pro&&c.rp.id!==gm.pro.id||gm.phase!=='live'||c.team!==team||gm.mode!=='run'||(c.spinCd||0)>gm.t||c.drag||c.down)return;c.spin=gm.t+0.42;c.spinCd=gm.t+(zx(c,'ankle')?1.3:2.6);c.jukeCd=Math.max(c.jukeCd||0,gm.t+0.5);}
// ----- interception returns: the defender who picks it off runs it back -----
function startReturn(D,z,fum){const t=gm.t,userD=D.team==='U';gm.loose=null;gm.lcRoom=gm.lcGoal=false;gm.lcAny=true;gm.ret={z0:Math.min(z,109)};D.z=Math.min(D.z,109);gm.carrier=D;gm.ball={held:D};gm.mode='run';gm.throwing=null;
  for(const e of gm.ents){e.eng=null;e.blk=null;e.wrap=null;e.lunge=0;e.drag=null;e.cover=null;e.zn=null;e.dz=null;e.route=null;e.blitz=false;e.crash=false;e.bite=0;e.rr=t+(e.side==='O'?(isOL(e)?rnd(0.5,0.9):rnd(0.2,0.55)):0);}
  if(gm.two){gm.ctl2=D;const ch=gm.ents.filter(e=>e.side==='O'&&!e.down).sort((a,b)=>dist(a,D)-dist(b,D));gm.ctl=ch.find(e=>!isOL(e))||ch[0]||null;}
  else if(gm.pro){const pe=proEnt();gm.ctl=window.__auto?null:pe&&pe===D||pe&&!pe.down?pe:null;}
  else if(userD){if(gm.ctl)gm.ctl=D;}else{const ch=gm.ents.filter(e=>e.side==='O'&&!e.down).sort((a,b)=>dist(a,D)-dist(b,D));gm.ctl=ch.find(e=>!isOL(e))||ch[0]||null;}
  if(!FLIP){FLIP=true;gm.camSnap=true;}
  if(!fum){flash(gm.two?'Intercepted by '+(userD?gm.U:gm.O).name+'!':userD?'Picked off! Run it back!':'Intercepted! Chase him down!');say([[0,pick(['Picked off!','Intercepted!','It\'s picked!'])+' '+D.rp.n+' has it!',2]]);}cheer((userD===gm.userHome)?0.8:0.2);renderPanel();}
function retControl(e,dt){let [ix,iz,l]=userInput(e.team);if(l<0.1){ix=0;iz=-1;}let sp=e.max*0.94;if(e.slow>gm.t)sp*=0.5;if(e.spin>gm.t)sp*=0.72;accel(e,ix*sp,iz*sp,dt);}
function aiRet(c,dt){const t=gm.t;let dx=0,dz=-1,nd=null,dn=99;
  for(const o of gm.ents){if(o.side!=='O'||o.down||o.stun>t)continue;const ox=c.x-o.x,oz=c.z-o.z,dd=Math.hypot(ox,oz);if(dd<7&&oz>-1.5){dx+=(ox>=0?1:-1)*(7-dd)/7*1.6;if(dd<dn){dn=dd;nd=o;}}}
  if(c.x>FW-3)dx-=1.6;if(c.x<-FW+3)dx+=1.6;const l=Math.hypot(dx,dz);let sp=c.max*0.92;if(c.slow>t)sp*=0.5;if(c.spin>t)sp*=0.72;accel(c,dx/l*sp,dz/l*sp,dt);
  if(nd&&dn<1.9&&(c.jukeCd||0)<=t&&Math.random()<dt*1.6){if(Math.random()<0.4){c.spin=t+0.42;c.jukeCd=t+2.6;}else{c.juke=t+0.34;c.jukeCd=t+2.6;c.vx+=(c.x>=nd.x?1:-1)*8;}}}
function stepRet(dt){gm.t+=dt;const t=gm.t,E=gm.ents,c=gm.carrier;for(const e of E)e.face=null;if(!c)return;
  if(c.drag)dragStep(c,dt);else if((c.team==='U'||gm.two)&&(c===gm.ctl||c===gm.ctl2))retControl(c,dt);else aiRet(c,dt);if(gm.phase!=='live')return;
  for(const o of E){if(o.side!=='O'||o.down)continue;
    if((o===gm.ctl||o===gm.ctl2)&&c.team!==o.team){userDefend(o,dt);if(gm.phase!=='live')return;continue;}
    if(o.stun>t||t<o.rr){accel(o,0,0,dt);continue;}
    if(o.wrap){seek(o,o.wrap.x,o.wrap.z,o.wrap.max*0.5,dt);o.anim='block';continue;}
    o.anim='idle';pursue(o,c,dt,isOL(o)?0.86:1);tryTackle(o,c);if(gm.phase!=='live')return;}
  for(const d of E){if(d.side!=='D'||d===c||d.down)continue;if(d.stun>t){accel(d,0,0,dt);continue;}
    let tg=null,bd=10;for(const o of E){if(o.side!=='O'||o.down||o.stun>t)continue;const dd=dist(d,o);if(dd<bd&&dist(o,c)<14){bd=dd;tg=o;}}
    if(tg){const ux=c.x-tg.x,uz=c.z-tg.z,l=Math.hypot(ux,uz)||1;seek(d,tg.x+ux/l*0.9,tg.z+uz/l*0.9,d.max*0.95,dt);d.face=tg;
      if(bd<1.15&&(d.blkCd||0)<t){d.blkCd=t+1.1;d.anim='block';if(Math.random()<0.55+(d.rp.ovr-tg.rp.ovr)/150){tg.stun=t+rnd(0.5,1.0);tg.anim='block';tg.vx*=0.3;tg.vz*=0.3;}}}
    else{d.anim='idle';seek(d,c.x+(d.x>c.x?3:-3),c.z-5,d.max*0.85,dt);}}
  integrate(dt);separate();
  if(gm.phase==='live'){if(c.z>109.5)c.z=109.5;roomCheck(c,-1,gm.ret.z0);if(c.z<=0&&Math.abs(c.x)<=FW)endPlay('pick6',0);else if(Math.abs(c.x)>FW)endPlay('int',c.z);}}
// ----- injuries: rare, more likely on a big hit -----
function maybeInjure(c,d,big){if(gm.road||gm.pro&&(c&&c.rp.id===gm.pro.id||d&&d.rp.id===gm.pro.id)||gm.two||gm.quick||gm.drill||gm.conv||Math.random()>(big?0.015:0.003))return;const v=Math.random()<0.65?c:d;if(!v||!v.rp||v.rp.pos==='K'||gm.injLog.some(x=>x.team===v.team))return;
  const T=v.team==='U'?gm.U:gm.O,p=T.roster.find(x=>x.id===v.rp.id);if(!p||p.inj)return;const wk=pick([1,1,1,2,2,3,4,6]);p.inj=wk+1;
  gm.injLog.push({team:v.team,n:p.n,pos:p.pos,wk});if(v.team==='U')gm.LU=lineup(gm.U);else gm.LO=lineup(gm.O);gm.injNote={n:p.n,pos:p.pos,team:T.name,wk,user:v.team==='U'};}
function injSay(){const I=gm.injNote;if(!I)return;gm.injNote=null;say([[0,'And there\'s a player down. Looks like '+I.n+' is hurt.'],[1,I.user?'That\'s a tough break. Next man up.':'That\'s a big loss for '+I.team+'.']],true);}
// ----- one simulation step while the ball is live -----
function stepLive(dt){if(gm.ret)return stepRet(dt);if(gm.loose)return stepLoose(dt);gm.t+=dt;const t=gm.t,E=gm.ents,by=gm.by,qb=by.QB,los=gm.pos,play=gm.play,uo=uoff(),run=play.t==='run';
  for(const e of E)e.face=null;
  if(run&&!gm.handed&&t>=play.hand){gm.handed=true;gm.carrier=by.RB;gm.ball={held:by.RB};by.RB.anim='carry';liveCall('hand',by.RB);}
  stepTrick(dt);
  if(gm.throwing&&t>=gm.throwing.at){const r=gm.throwing.rec;gm.throwing=null;releaseBall(r);}
  if(!run&&gm.carrier===qb&&qb.z>los+0.4&&!gm.scr){gm.scr=true;gm.throwing=null;qb.anim='carry';}
  const car=gm.carrier,b=gm.ball;
  if(car&&!car.bkw&&car.team===(gm.poss==='U'?'U':'A')&&zx(car,'break')&&car.z>los+5){car.bkw=true;car.max*=1.12;flash('Breakaway! '+car.rp.n+' finds another gear');}
  const mode=b.fly&&!b.lat?'air':(!run&&car===qb&&!gm.scr?'pocket':'run');gm.mode=mode;
  const tgt=car||(b.lat?b.target:qb),hx=gm.hole?gm.hole.x:gm.bx,prot=(run&&car&&car.z<los+1)?gm.hole:tgt,tr=gm.trick&&!gm.trick.done?gm.trick:null;
  for(const e of E){if(e.side!=='O'||e.down)continue;
    if(e===car){if(e.drag)dragStep(e,dt);else if(tr&&e===by.RB){if(play.flea)seek(e,gm.bx+0.3,los-0.6,e.max*0.55,dt);else seek(e,gm.bx+play.aim,los-1.6,e.max*0.75,dt);}
      else if((uo||gm.two)&&!(gm.pro&&(e.rp.id!==gm.pro.id||window.__auto)))control(e,dt,mode);else if(mode==='pocket')aiQB(e,dt);else{aiRun(e,dt);aiLateral(e);}if(gm.phase!=='live')return;continue;}
    if(b.lat&&e===b.target){seek(e,b.land.x,b.land.z,e.max,dt);e.anim='catch';continue;}
    if(e===qb){if(tr&&play.flea)seek(e,gm.bx,los-6.5,e.max*0.6,dt);else accel(e,0,0,dt);continue;}
    if(tr&&play.rev&&e===tr.w){const rb=by.RB;if(t<0.75)seek(e,gm.bx+3,los-3.4,e.max,dt);else seek(e,rb.x-0.6,rb.z-1.1,e.max,dt);continue;}
    if(e===by.RB&&run&&!gm.handed){const fk=play.counter&&t<0.3?-Math.sign(play.aim)*2.5:0;
      if(play.toss)seek(e,gm.bx+play.aim*0.7,e.z+0.5,e.max*0.9,dt);else seek(e,gm.bx+play.aim*0.4+fk,los-2.2,e.max*0.85,dt);continue;}
    if(e===by.RB&&play.pa&&t<0.7){seek(e,gm.bx+play.aim*0.4,los-2,e.max*0.85,dt);continue;}
    if(mode==='air'&&e===b.target){seek(e,b.land.x,b.land.z,e.max,dt);if(b.T-b.t<0.35)e.anim='catch';continue;}
    if(gm.pro&&e.rp.id===gm.pro.id&&(mode==='pocket'||mode==='air')&&!window.__auto&&!tr){const [ix,iz,l]=userInput('U');if(l>0.1&&gm.t>0.2)e.free=true;if(e.free){if(l<0.1)accel(e,0,0,dt);else accel(e,ix*e.max*0.97,iz*e.max*0.97,dt);e.face=qb;continue;}}
    if(e.route&&(mode!=='run'||tr)){runRoute(e,dt);continue;}
    doBlock(e,dt,prot);}
  for(const d of E){if(d.side!=='D'||d.down)continue;
    if(d===gm.ctl&&(!uo||gm.two)){userDefend(d,dt);if(gm.phase!=='live')return;continue;}
    if(d.stun>t){accel(d,0,0,dt);continue;}
    if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;continue;}
    if(d.eng){if(t>=d.shedAt||d.eng.down){if(d.xfShed&&t<d.engT+1.1){d.xfShed=false;flash('Unstoppable! '+d.rp.n+' beats the block');}d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}
      else{const g=car||qb,bl=d.eng;if(run&&!gm.scr&&isOL(bl)&&g.z<d.z+1)accel(d,(d.x>=hx?1:-1)*0.9,1.5+(bl.rp.ovr-d.rp.ovr)*0.02,dt);else seek(d,g.x,g.z,(isOL(bl)||bl.role==='TE')?(run?0.9:1.3)+(d.rp.ovr-70)*0.025:d.max*0.55,dt);
        d.anim='block';d.face=bl;if(mode==='run'&&car)tryTackle(d,car);if(gm.phase!=='live')return;continue;}}
    d.anim='idle';const rusher=d.role[0]==='D'||d.blitz||(d.crash&&(run||t<0.9));
    if(mode==='pocket'){
      if(rusher){seek(d,qb.x,qb.z,d.max*(d.blitz?(uo?0.8+0.06*dk():0.97):uo?0.97:1),dt);tryTackle(d,qb);}
      else if(d.bite>t){seek(d,d.x,los+2,d.max*0.55,dt);d.face=qb;}
      else if(d.cover)cover(d,dt);else if(d.dz)deepZone(d,dt);else if(d.zn)zoneCover(d,dt);else{seek(d,d.x,los+4.5,d.max*0.6,dt);d.face=qb;}}
    else if(mode==='air'){const near=Math.hypot(d.x-b.land.x,d.z-b.land.z),hawk=zx(d,'hawk')||zx(d,'lurker');
      if(rusher)accel(d,0,0,dt);
      else if(t>=gm.thrownAt+(hawk?0:d.react)&&(d.cover===b.target||(d.dz&&near<(hawk?24:19))||(d.zn&&near<13)||near<4.5))seek(d,b.land.x,b.land.z,d.max*(d.dz?1.05:1),dt);
      else if(d.cover)cover(d,dt);else if(d.dz)deepZone(d,dt);else if(d.zn)zoneCover(d,dt);else accel(d,0,0,dt);}
    else{const read=(run&&!gm.caught)?0.72+(90-d.rp.ovr)/100+(play.draw?0.45:0)+(play.counter?0.2:0):0;
      if(tr&&(d.cover||d.dz)){if(d.cover)cover(d,dt);else deepZone(d,dt);}
      else if(!rusher&&t<read){if(d.cover)cover(d,dt);else accel(d,0,0,dt);}
      else{pursue(d,tgt,dt,tgt.z>los+10?1.04:1);if(car)tryTackle(d,car);}}
    if(gm.phase!=='live')return;}
  integrate(dt);separate();
  if(b.fly){b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.t>=b.T){if(b.lat)resolveLat();else resolvePass();}}
  const c=gm.carrier;
  if(gm.phase==='live'&&c){if(c.z<-9.5)c.z=-9.5;if(gm.mode==='run')roomCheck(c,1,gm.pos);if(c.z>=100&&Math.abs(c.x)<=FW)endPlay('td',100);else if(Math.abs(c.x)>FW)endPlay('oob',c.z);}}
function stepDead(dt){gm.deadT+=dt;const b=gm.ball,ce=gm.cele;for(const e of gm.ents)if(!e.down)accel(e,0,0,dt);integrate(dt);
  if(b&&b.fly&&b.y>0.12){b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.y<=0.12){b.y=0.12;b.vx=b.vz=0;b.vy=0;b.spin=false;}}
  if(ce&&ce.spike&&gm.now-ce.e.animT>0.5){ce.spike=false;const e=ce.e;gm.ball={fly:true,spin:true,x:e.x+0.3,y:1.2,z:e.z+0.4,vx:rnd(-1,1),vy:-9,vz:rnd(0.5,2),g:20,t:0,T:99,land:{x:e.x,z:e.z}};}
  if(gm.zmsg&&gm.deadT>1.0&&gm.deadT<8){flash(gm.zmsg);gm.zmsg='';gm.zext=1.3;}
  const lim=(ce?(ce.picked?3.2:5):gm.after&&gm.after.td?2.8:1.7)+(gm.zext||0);
  if(gm.deadT>lim){gm.zext=0;gm.zmsg='';afterPlay();}}

// ----- kickoffs and returns -----
function kickoff(kicker,onside){const R=kicker==='U'?'A':'U';gm.conv=false;gm.kanim=null;
  if(gm.q===5)return startDrive(R,25);
  if(kicker==='A'&&!gm.two&&!gm.drill&&gm.q===4&&gm.them<gm.us&&gm.us-gm.them<=16&&gm.clock<300)onside=true;
  if(kicker==='U'&&gm.pro&&gm.q===4&&gm.us<gm.them&&gm.them-gm.us<=16&&gm.clock<300)onside=true;
  const live=gm.pro?false:gm.drill?true:gm.two?!!S.koRet:R==='A'?gm.playDef&&S.koRet:!!S.koRet;
  if(!onside&&!live&&kicker==='U'&&!gm.two&&!gm.pro&&gm.q===4&&gm.us<gm.them&&!gm.koAsk){gm.koAsk=true;gm.phase='kochoice';renderPanel();return;}gm.koAsk=false;
  if(onside&&!live){const got=Math.random()<0.15,KT=kicker==='U'?gm.U:gm.O;tick(4);showCard('Onside kick',[got?KT.name+' recover the onside kick!':KT.name+' try an onside kick, but it\'s recovered by the other team.'],'Continue',()=>proceed({change:true,to:got?kicker:R,next:got?46:54}));return;}
  if(!onside&&!live&&!gm.drill&&!gm.pro&&(kicker==='U'||gm.two))return koMeterStart(kicker,R,false);
  if(!onside){if(gm.two&&!live)return startDrive(R,rint(23,36));if(R==='A'&&!live)return give('A',rint(23,36));if(R==='U'&&!live)return startDrive('U',30);}
  gm.poss=R;FLIP=R==='A'&&!gm.two;gm.camSnap=true;gm.ko=true;gm.pos=35;gm.down=1;gm.toGo=10;gm.bx=0;gm.flag=null;gm.cele=null;
  const uo=R==='U',Lr=uo?gm.LU:gm.LO,Lk=uo?gm.LO:gm.LU,kr=uo?gm.kitU:gm.kitO,kk=uo?gm.kitO:gm.kitU,tr=uo?'U':'A',tk=uo?'A':'U',E=[],by={};
  gm.ents=E;gm.by=by;gm.elig=[];gm.runPath=null;gm.play={t:'ko',n:'Kickoff',f:'gun'};
  const add=(side,role,rp,x,z)=>{const e=mkEnt(side,side==='O'?tr:tk,role,rp,x,z,side==='O'?kr:kk,'s2');E.push(e);by[role]=e;return e;};
  const fast=[Lr.RB,...Lr.WR,...Lr.CB].sort((a,b)=>b.spd-a.spd),krp=(uo?gm.U:gm.O).roster.find(x=>x.kr&&!x.inj),retp=krp||fast[0];add('O','RET',retp,0,4);
  [Lr.TE,...Lr.LB,...Lr.S,...fast].filter(x=>x.id!==retp.id).slice(0,10).forEach((p,i)=>{const row=i<5?0:i<8?1:2,e=add('O','B'+i,p,row===0?(i-2)*9:row===1?(i-6)*12:(i-8.5)*14,row===0?52:row===1?38:22);e.hx=e.x*0.75;e.hz=row===0?36:row===1?29:20;});
  [...Lk.LB,...Lk.S,...Lk.CB,...Lk.WR].slice(0,10).forEach((p,i)=>add('D','C'+i,p,(i-4.5)*5.2,65.5));add('D','KK',Lk.K,0.8,67.5);
  gm.ctl=uo&&!gm.two?null:by.C4;gm.ctl2=null;gm.onside=!!onside;gm.loose=null;gm.carrier=null;gm.ball={still:true,x:0,y:0.2,z:65,vx:0,vz:-1};gm.phase='presnap';renderPanel();flash(onside?'Onside kick':'Kickoff');}
function snapKO(){hush();gm.lcAny=gm.lcCatch=gm.lcRoom=gm.lcGoal=false;gm.phase='live';gm.t=0;gm.mode='run';gm.tkBy=null;gm.thrownAt=null;gm.caught=false;gm.hole=null;const k=gm.by.KK,ret=gm.by.RET;recStart();
  if(gm.onside){k.anim='kickleg';k.animT=gm.now;gm.ball=onsideBall();gm.loose={why:'onside',from:null,t0:0,team:null};gm.mode='loose';gm.carrier=null;for(const e of gm.ents){e.rr=rnd(0.05,0.35);e.route=null;}
    const nu=gm.ents.filter(e=>e.team==='U'&&e.role!=='KK').sort((a,b)=>Math.hypot(a.x,a.z-54)-Math.hypot(b.x,b.z-54))[0];gm.ctl=window.__auto?null:nu;gm.ctl2=gm.two?gm.ents.filter(e=>e.team==='A'&&e.role!=='KK').sort((a,b)=>Math.hypot(a.x,a.z-54)-Math.hypot(b.x,b.z-54))[0]:null;
    tick(4);say([[0,'Here\'s the onside kick!',2]]);renderPanel();return;}
  const kp=gm.koPow;gm.koPow=null;const land={x:rnd(-9,9),z:kp!=null?65-(38+kp*34)+rnd(-1.5,1.5):rnd(1,7)},T=kp!=null?2.6+kp*1.0:3.3,x0=0,z0=65,y0=0.2,g=10.7;k.anim='kickleg';k.animT=gm.now;gm.tbk=false;
  gm.ball={fly:true,ko:true,spin:true,x:x0,y:y0,z:z0,t:0,T,land,target:ret,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.3-y0)/T+0.5*g*T,g};gm.carrier=null;tick(6);renderPanel();}
function stepKO(dt){if(gm.loose)return stepLoose(dt);gm.t+=dt;const t=gm.t,E=gm.ents,b=gm.ball,ret=gm.by.RET,car=gm.carrier,uo=uoff();
  for(const e of E)e.face=null;
  for(const e of E){if(e.side!=='O'||e.down)continue;
    if(e===ret){if(car===ret){if(e.drag)dragStep(e,dt);else if(uo||gm.two)control(e,dt,'run');else aiRun(e,dt);}
      else{seek(e,b.land.x,b.land.z,e.max,dt);if(b.T-b.t<0.4)e.anim='catch';e.face={x:e.x,z:e.z+10};}
      if(gm.phase!=='live')return;continue;}
    if(!car&&t<2.4){seek(e,e.hx,e.hz,e.max*0.7,dt);e.face={x:e.x,z:e.z+10};continue;}
    doBlock(e,dt,ret);}
  for(const d of E){if(d.side!=='D'||d.down)continue;
    if(d.role==='KK'){if(t>0.5)seek(d,0,52,d.max*0.5,dt);else if(t>0.15)seek(d,0,64.5,d.max,dt);continue;}
    if(t<0.3){accel(d,0,0,dt);continue;}
    if(d===gm.ctl&&(!uo||gm.two)){userDefend(d,dt);if(gm.phase!=='live')return;continue;}
    if(d.stun>t){accel(d,0,0,dt);continue;}
    if(d.wrap){const w=d.wrap;seek(d,w.x,w.z,w.max*0.5,dt);d.anim='block';d.face=w;continue;}
    if(d.eng){if(t>=d.shedAt||d.eng.down){d.eng.beat=t+1.2;d.eng=null;d.freeUntil=t+3;}else{accel(d,0,0,dt);d.anim='block';d.face=d.eng;if(car)tryTackle(d,car);if(gm.phase!=='live')return;continue;}}
    d.anim='idle';if(car){pursue(d,car,dt);tryTackle(d,car);}else seek(d,b.land.x+(d.x-b.land.x)*0.3,b.land.z+7,d.max*0.96,dt);
    if(gm.phase!=='live')return;}
  integrate(dt);separate();
  if(b.fly){b.t+=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;b.vy-=b.g*dt;if(b.t>=b.T){ret.x=ret.x*0.3+b.land.x*0.7;ret.z=ret.z*0.3+b.land.z*0.7;ret.anim='carry';gm.carrier=ret;gm.ball={held:ret};
    if(b.land.z<-0.5&&!(uo||gm.two)&&Math.random()<0.85){gm.tbk=true;ret.anim='idle';return endPlay('tackle',30);}}}
  const c=gm.carrier;if(gm.phase==='live'&&c){roomCheck(c,1,Math.max(c.z0k||(c.z0k=c.z),0));if(c.z>=100&&Math.abs(c.x)<=FW)endPlay('td',100);else if(Math.abs(c.x)>FW)endPlay('oob',c.z);}}

// ----- field goals and extra points, with the kick shown on the field -----
function fgDist(){return Math.round(100-gm.pos+17);}
function setKickFormation(los){const bx=gm.bx,uo=uoff(),Lo=uo?gm.LU:gm.LO,Ld=uo?gm.LO:gm.LU,ko=uo?gm.kitU:gm.kitO,kd=uo?gm.kitO:gm.kitU,to=uo?'U':'A',td=uo?'A':'U',E=[],by={};
  gm.ents=E;gm.by=by;gm.elig=[];gm.runPath=null;gm.carrier=null;gm.ctl=null;gm.pos=los;gm.kz=los-7;gm.ko=false;
  const add=(side,role,rp,x,z,st)=>{const e=mkEnt(side,side==='O'?to:td,role,rp,x,z,side==='O'?ko:kd,st);E.push(e);by[role]=e;return e;};
  [...Lo.OL,Lo.TE,Lo.WR[2]].forEach((p,i)=>add('O','K'+i,p,bx+(i-3)*1.4,los-0.7,'s3'));add('O','W1',Lo.WR[0],bx-5.6,los-1.3,'s2');add('O','W2',Lo.WR[1],bx+5.6,los-1.3,'s2');
  const h=add('O','HOLD',Lo.QB,bx+0.7,los-7,'s2');h.anim='hold';h.dir=-1.57;add('O','KK',Lo.K,bx-1.5,los-9.4,'s2');
  [...Ld.DL,...Ld.LB].forEach((p,i)=>add('D','R'+i,p,bx+(i-3)*1.4,los+0.9,'s3'));[...Ld.CB,...Ld.S].forEach((p,i)=>add('D','S'+i,p,bx+(i-1.5)*5,los+(i===1||i===2?5:1.2),'s2'));
  gm.ball={still:true,x:bx,y:0.16,z:gm.kz,vx:0,vz:1};}
function tryFG(xp){if(!gm||!(uoff()||gm.two)||(!xp&&gm.phase!=='huddle'))return;const d=xp?33:fgDist(),K=(uoff()?gm.LU:gm.LO).K,w=gm.wx||{};FLIP=false;gm.camSnap=true;setKickFormation(xp?85:gm.pos);gm.phase='kick';
  gm.kick={side:gm.poss,xp:!!xp,dist:d,tol:clamp((0.62-(d-20)*0.011+(K.ovr-75)*0.005+(zx({zone:true,rp:K},'clutch')?0.2:zx({zone:true,rp:K},'leg')?Math.max(0.03,(d-30)*0.012):zx({zone:true,rp:K},'ice')?(gm.q>=4?0.32:0.04):0)-0.04*dk())*(w.sky==='snow'?0.88:1)*(1-(w.wind||0)*0.012),0.08,0.88),bias:(w.wdir||1)*(w.wind||0)*0.012,t:0,m:-1};renderPanel();}
function kickNow(){const k=gm&&gm.kick;if(!k||gm.phase!=='kick')return;gm.kick=null;startKickAnim(k.side||'U',k.xp,k.dist,Math.abs(k.m-(k.bias||0))<=k.tol,k.m-(k.bias||0));}
function aiKick(xp,side){side=side||'A';const d=xp?33:fgDist(),w=gm.wx||{},K=(side==='U'?gm.LU:gm.LO).K,good=Math.random()<clamp(0.95-(d-20)*0.012+(K.ovr-75)*0.004,0.2,0.98)*(1-(w.wind||0)*0.008)*(w.sky==='snow'?0.92:1);gm.poss=side;FLIP=false;gm.camSnap=true;setKickFormation(xp?85:gm.pos);
  startKickAnim(side,xp,d,good,good?rnd(-0.5,0.5):pick([-1,1])*rnd(0.7,1));}
function startKickAnim(side,xp,dist,good,m){gm.phase='kanim';recStart();const kk=gm.by.KK;kk.anim='kickleg';kk.animT=gm.now;
  gm.kanim={side,xp,dist,good,t:0,T:1.25+dist*0.013,xT:gm.bx+(good?m*2.1:(m>=0?1:-1)*(4.2+Math.abs(m)*2.5)),sp:gm.pos,launched:false,done:false};renderPanel();}
function stepKickAnim(dt){const k=gm.kanim,b=gm.ball,kk=gm.by.KK,t0=0.42;k.t+=dt;
  if(k.t<t0)seek(kk,b.x-0.25,b.z-0.6,kk.max*0.8,dt);else accel(kk,0,0,dt);integrate(dt);
  if(k.t>=t0&&!k.launched){k.launched=true;const g=10.7,dz=110-b.z,yT=k.good?rnd(5,8.5):rnd(4,8);gm.ball={fly:true,spin:true,x:b.x,y:0.3,z:b.z,vx:(k.xT-b.x)/k.T,vz:dz/k.T,vy:(yT-0.3)/k.T+0.5*g*k.T,g,t:0,T:99,land:{x:k.xT,z:110}};
    for(const e of gm.ents)if(e.side==='D'&&e.role[0]==='R'){e.vz=-2.5;e.anim='block';}}
  const c=gm.ball;if(c.fly&&c.y>0.12){c.x+=c.vx*dt;c.z+=c.vz*dt;c.y+=c.vy*dt;c.vy-=c.g*dt;if(c.y<=0.12){c.y=0.12;c.vx=c.vz=c.vy=0;c.spin=false;}}
  if(k.launched)for(const e of gm.ents)if(e.side==='D')accel(e,0,0,dt);
  if(k.t>=t0+k.T&&!k.done){k.done=true;gm.lastRes={fg:1,good:k.good};if(k.good&&!k.xp&&k.dist>=45)recMark(k.dist+'-yard field goal',3);if(k.good)addScore(k.side,k.xp?1:3);flash(k.good?(k.xp?'Extra point is good':k.dist+'-yard field goal is good'):'No good');say([[0,k.good?(k.xp?'The extra point is good.':'The kick is up. And it\'s good, from '+k.dist+' yards!'):'The kick is up. No good! He pushed it wide.',k.xp?0:1],k.xp?null:[1,scoreLine()+'.']]);if(!k.xp)cheer(((k.side==='U')===gm.userHome)===k.good?0.7:0.12);}
  if(k.t>=t0+k.T+1.2){gm.kanim=null;const other=k.side==='U'?'A':'U';
    if(k.xp)return proceed({ko:k.side});
    tick(5);gm.after=k.good?{ko:k.side,fg:true}:{change:true,to:other,next:Math.max(20,100-k.sp)};afterPlay();}}
// After a touchdown: kick for one or run a play for two.
function startPat(side){gm.poss=side;gm.conv=false;gm.cele=null;
  if(side==='U'&&gm.pro){const d2=gm.us-gm.them;if(!(gm.q>=4&&(d2===-2||d2===-5||d2===1)))return aiKick(true,'U');if(gm.pro.side==='O')return setConv('U');
    const ok=Math.random()<0.45;if(ok)gm.us+=2;return showCard('Two-point try',[gm.U.name+(ok?' go for two and get it.':' go for two and are stopped short.')],'Continue',()=>proceed({ko:'U'}));}
  if(side==='U'||gm.two){gm.phase='pat';renderPanel();return;}
  const diff=gm.them-gm.us;if(!((gm.q>=4&&(diff===-2||diff===-5||diff===1))||Math.random()<0.03))return aiKick(true);
  if(gm.playDef)return setConv('A');
  const ok=Math.random()<0.45;if(ok)gm.them+=2;showCard('Two-point try',[gm.O.name+(ok?' convert for two.':' are stopped short.')],'Continue',()=>proceed({ko:'A'}));}
function setConv(side){gm.poss=side;FLIP=side==='A'&&!gm.two;gm.camSnap=true;gm.ko=false;gm.pos=98;gm.down=1;gm.toGo=2;gm.bx=0;gm.conv=true;setHuddle();flash('Two-point try');}
function patPick(two){if(!gm||gm.phase!=='pat')return;if(two)setConv(gm.poss);else tryFG(true);}
function celebrate(i){const ce=gm&&gm.cele;if(!ce||ce.picked||gm.phase!=='dead')return;ce.picked=true;ce.e.anim='c'+i;ce.e.animT=gm.now;ce.spike=i===0;gm.deadT=0.8;renderPanel();}

// ----- X-Factor zones -----
function zoneUp(e,need){if(!e||!e.rp.xf||e.rp.pos==='OL'||e.rp.pos==='K')return;const z=gm.zone[e.rp.id]||(gm.zone[e.rp.id]={c:0,on:false,n:e.rp.n,team:e.team});if(z.on)return;if(++z.c>=need){z.on=true;e.zone=true;gm.zmsg='X-Factor on: '+e.rp.n+' · '+xfName(e.rp);}}
function zoneOut(e){if(!e||!e.rp.xf||e.rp.pos==='OL'||e.rp.pos==='K')return;const z=gm.zone[e.rp.id];if(z){z.c=0;z.on=false;}}

// ----- flags -----
function applyPenalty(pen,who){const uo=uoff(),T=pen.off?(uo?gm.U:gm.O):(uo?gm.O:gm.U),los=gm.pos;let y=pen.y||0,txt,fd=false;
  gm.phase='dead';gm.deadT=0;gm.throwing=null;gm.cele=null;gm.run=false;
  if(pen.spot){y=pen.spot-los;gm.pos=pen.spot;gm.down=1;gm.toGo=Math.min(10,100-gm.pos);fd=true;}
  else if(pen.off){y=Math.min(y,Math.max(1,Math.floor(los/2)));gm.pos=los-y;gm.toGo+=y;}
  else{y=Math.min(y,Math.max(1,Math.ceil((100-los)/2)));gm.pos=Math.min(99,los+y);gm.toGo-=y;if(pen.auto||gm.toGo<=0){gm.down=1;gm.toGo=Math.min(10,100-gm.pos);fd=true;}}
  txt='Flag: '+pen.n+(who?' on #'+who.num:'')+', '+T.name+' · '+y+' yards'+(fd?' · First down':pen.pre?'':' · Replay the down');
  const fx=who?who.x:gm.bx+rnd(-8,8),fz=pen.spot||(who?who.z:los+rnd(-1,5));gm.flag={x:clamp(fx+rnd(-1.5,1.5),-25,25),z:fz+rnd(-1,1),t:gm.now};
  if(!pen.pre)tick(5);gm.tkBy=null;gm.after={};gm.msg=txt;flash(txt);say([[0,'We\'ve got a flag on the play. '+pen.n+', on '+T.name+'. That\'s '+y+' yards.']]);renderPanel();}
// ----- the broadcast booth: spoken play-by-play and captions -----
const BOOTH=['Ray Calloway','Tony Mercer'],ORD=['first','second','third','fourth','fifth','sixth','seventh','eighth'];let voices=null,capT=0;
// Voices come from the browser. Rank them so the most human-sounding ones are used first.
const VBAD=/Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|\bFred\b|Ralph|Junior|Kathy|Eddy|\bFlo\b|Grandma|Grandpa|\bReed\b|Rocko|Sandy|Shelley|eSpeak|Deranged|Hysterical|Pipe|Princess/i,
  VMALE=/\b(Guy|Davis|Andrew|Brian|Christopher|Eric|Roger|Steffan|Tony|Jason|Ryan|Thomas|William|Daniel|Alex|Evan|Nathan|Tom|Aaron|Arthur|Oliver|Gordon|David|Mark|George|James|Male)\b/i;
function vScore(x){const n=x.name;let s=0;if(/Natural|Neural/i.test(n))s+=60;if(/Premium/i.test(n))s+=50;if(/Enhanced/i.test(n))s+=40;if(/Siri/i.test(n))s+=35;if(/Online/i.test(n))s+=15;if(/^Google/i.test(n))s+=22;
  if(/en[-_]US/i.test(x.lang))s+=12;else if(/en[-_]GB/i.test(x.lang))s+=6;if(VMALE.test(n))s+=14;if(/Compact/i.test(n))s-=20;if(VBAD.test(n))s-=200;return s;}
function voiceList(){try{const all=speechSynthesis.getVoices(),w=S&&S.voice||[],en=all.filter(x=>/^en/i.test(x.lang)),use=(en.length?en:all).filter(x=>!VBAD.test(x.name)||w.includes(x.name));return use.sort((a,b)=>vScore(b)-vScore(a));}catch(e){return [];}}
function pickVoices(){const v=voiceList();if(!v.length)return;const w=S.voice||[],a=v.find(x=>x.name===w[0])||v[0],b=v.find(x=>x.name===w[1])||v.find(x=>x.name!==a.name)||a;voices=[a,b];}
// Speaks lines as [speaker, text, energy]. Each sentence is its own breath, and big plays are called faster and higher.
function speak(lines,keep){if(!window.speechSynthesis)return;try{if(!keep)speechSynthesis.cancel();if(!voices)pickVoices();const sp=[0.86,1,1.15][S.vspd==null?1:S.vspd],same=voices&&voices[0]===voices[1];
  for(const l of lines){const e=l[2]||0;for(const part of l[1].replace(/([.!?])\s+/g,'$1|').split('|')){if(!part)continue;const u=new SpeechSynthesisUtterance(part);if(voices){u.voice=voices[l[0]];u.lang=voices[l[0]].lang;}
    u.rate=(l[0]?0.98:1.08)*(1+0.08*e)*sp*(1+(Math.random()-0.5)*0.06);u.pitch=(same?(l[0]?0.8:1.05):1)+0.05*e+(Math.random()-0.5)*0.06;u.volume=1;speechSynthesis.speak(u);}}}catch(e){}}
function testVoices(){voices=null;speak([[0,'Touchdown, '+S.teams[S.user].name+'! What a throw!',2],[1,'That\'s his third catch today, and he\'s already up to 88 yards.']]);}
function say(lines,keep,nocap){if(!S.talk||!lines)return;lines=lines.filter(l=>l&&l[1]);if(!lines.length)return;
  const el=document.getElementById('cap'),voice=S.talk>=2&&!!window.speechSynthesis&&voiceList().length>0;if(el&&!nocap&&(S.talk<3||!voice)){el.innerHTML=lines.map(l=>'<b>'+BOOTH[l[0]].split(' ')[0]+':</b> '+esc(l[1])).join('<br>');el.hidden=false;capT=2.5+lines.reduce((n,l)=>n+l[1].length,0)*0.055;}
  if(S.talk>=2)speak(lines,keep);}
function hush(){try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}}
// ----- the crowd: a low murmur that swells on big plays -----
let AC=null,cBed=null,cRoar=null,cT=0;
function crowdStart(){if(S.crowd===false)return;try{if(!AC){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;AC=new A();const n=AC.sampleRate*4,F=AC.sampleRate>>1,x=new Float32Array(n+F);
    let b0=0,b1=0,b2=0;for(let i=0;i<n+F;i++){const w=Math.random()*2-1;b0=0.99765*b0+w*0.099046;b1=0.963*b1+w*0.2965164;b2=0.57*b2+w*1.0526913;x[i]=(b0+b1+b2+w*0.1848)*0.2;}
    const buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++){const t=i/F;d[i]=i<F?x[i]*t+x[n+i]*(1-t):x[i];}
    const src=AC.createBufferSource();src.buffer=buf;src.loop=true;const mk=(f,q)=>{const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;const g=AC.createGain();g.gain.value=0;src.connect(bp);bp.connect(g);g.connect(AC.destination);return g;};
    cBed=mk(760,0.45);cRoar=mk(1350,0.55);src.start();}
  AC.resume();cT=0;}catch(e){}}
function crowdStop(){try{if(!AC)return;const t=AC.currentTime;cBed.gain.cancelScheduledValues(t);cRoar.gain.cancelScheduledValues(t);cBed.gain.setTargetAtTime(0,t,0.25);cRoar.gain.setTargetAtTime(0,t,0.25);setTimeout(()=>{try{if(!gm&&AC)AC.suspend();}catch(e){}},1500);}catch(e){}}
function cheer(k){try{if(!AC||S.crowd===false||!gm)return;const t=AC.currentTime,g=cRoar.gain;g.cancelScheduledValues(t);g.setTargetAtTime(0.5*k,t,0.1);g.setTargetAtTime(0,t+0.8+1.4*k,0.8);}catch(e){}}
function crowdMood(dt){cT-=dt;if(cT>0||!AC||!cBed||!gm)return;cT=0.5+Math.random()*0.9;try{const homeD=uoff()!==gm.userHome,loud=homeD&&gm.down>=3&&(gm.phase==='huddle'||gm.phase==='presnap');
  cBed.gain.setTargetAtTime(S.crowd===false?0:(0.07+Math.random()*0.035)*(loud?2.1:1),AC.currentTime,0.45);}catch(e){}}
function scoreLine(){const a=gm.us,b=gm.them;return a===b?pick(['We\'re all tied up at '+a,'It\'s tied at '+a]):(a>b?gm.U.name+' '+a+', '+gm.O.name+' '+b:gm.O.name+' '+b+', '+gm.U.name+' '+a);}
// per-player numbers for this game
function PS(e){const id=e.rp.id;return gm.ps[id]||(gm.ps[id]={n:e.rp.n,pos:e.rp.pos,team:e.team,att:0,cmp:0,py:0,ptd:0,pint:0,car:0,ry:0,rec:0,recy:0,td:0,tk:0,sk:0,int:0});}
function spotWords(z){z=Math.round(z);const uo=uoff(),PT=uo?gm.U:gm.O,DT=uo?gm.O:gm.U;return z===50?'midfield':z<50?'the '+PT.name+' '+z:'the '+DT.name+' '+(100-z);}
// Calls made while the ball is live, the way a play-by-play voice follows the action.
function liveCall(k,e){if(!S.talk||!gm)return;const n=e&&e.rp?e.rp.n:'',qn=gm.by.QB?gm.by.QB.rp.n:'';let s='',en=1;
  if(k==='hand'){if(Math.random()<0.4)return;s=pick(['Handoff, '+n+'.','Give to '+n+'.',n+' takes the handoff.']);}
  else if(k==='throw'){const deep=gm.airYds>=17;if(!deep&&Math.random()<0.65)return;s=deep?pick([qn+' goes deep...','Deep shot for '+n+'...',qn+' lets it fly...']):pick([qn+' throws...','Looking for '+n+'...']);en=deep?2:1;}
  else if(k==='catch'){s=pick(['Caught by '+n+'!',n+' makes the catch!',n+' hauls it in!']);en=gm.airYds>=17?2:1;}
  else if(k==='room'){gm.lcRoom=true;s=pick([n+' has room!','He\'s got daylight!',n+' breaks into the open!','Look out, '+n+' is loose!']);en=2;}
  else if(k==='goal'){gm.lcGoal=true;s=pick(['He\'s at the 20... the 15... the 10...','He could go all the way!','Nobody\'s going to catch him!']);en=2;}
  if(!s)return;gm.lcAny=true;if(k==='catch')gm.lcCatch=true;say([[0,s,en]]);}
// Big-play check: a runner past the second level with nobody close.
function roomCheck(c,dir,z0){if(!c||c.down||gm.lcGoal)return;const ahead=(c.z-z0)*dir;
  if(!gm.lcRoom){if(ahead<12)return;for(const d of gm.ents)if(d.side!==c.side&&!d.down&&d.stun<=gm.t&&dist(d,c)<4.5)return;liveCall('room',c);}
  else if((dir>0&&c.z>=80)||(dir<0&&c.z<=20))liveCall('goal',c);}
// The call of the play: Ray has the action, Tony adds a number or a reaction, and the crowd answers.
function callIt(kind,gain,fd,c,tk,passed,note){const qb=gm.by.QB,L=[],uo=uoff(),T=uo?gm.U:gm.O,nm=e=>e.rp.n,r=Math.random(),g=gain,lc=gm.lcCatch,rm=gm.lcRoom;let good=0;
  const first=()=>{if(fd&&g<20)L.push([0,pick(['First down, '+T.name+'.','That\'ll move the chains.','And that\'s a first down.'])]);},spot=spotWords(gm.pos);
  if(kind==='td'){good=2;L.push([0,pick(['Touchdown, '+T.name+'!','He\'s in! Touchdown, '+T.name+'!','Touchdown!']),2]);
    if(c&&!rm)L.push([0,passed&&gm.caught?nm(qb)+' to '+nm(c)+(g>1?', '+g+' yards for the score.':' for the score.'):nm(c)+(g>12?' goes '+g+' yards to the house.':g>1?' punches it in from '+g+' yards out.':' punches it in.'),1]);
    L.push([1,rm&&c?pick(['Nobody was going to catch '+nm(c)+'. '+g+' yards!','What a play. '+g+' yards, and he made it look easy.']):pick([scoreLine()+', with the try coming up.','Great execution. '+scoreLine()+'.'])]);}
  else if(kind==='int'){good=-2;const d=gm.intBy,ry=gm.retYds||0;L.push([0,ry>=10&&d?pick([nm(d)+' brings it back '+ry+' yards!','And '+nm(d)+' returns it '+ry+' yards!']):gm.lcAny?pick(['And he\'s brought down right there.','He doesn\'t get much on the return.']):pick(['Picked off!','Intercepted!'])+(d?' '+nm(d)+' with the interception.':''),ry>=20?2:1]);
    L.push([1,pick([nm(qb)+' would love to have that one back.','He never saw him.','You can\'t make that throw in this league.','He stared his receiver down the whole way.','That\'s a game-changing play right there.'])]);}
  else if(kind==='sack'){good=-1;const s=tk?PS(tk).sk:0;L.push([0,pick([nm(qb)+' is under pressure, and he\'s down!','Sack! '+nm(qb)+' goes down.',nm(qb)+' has nowhere to go. Sacked!'])+' '+(tk?nm(tk)+' gets him for':'That\'s')+' a loss of '+(-g)+'.',1]);
    L.push([1,s>=2?'That\'s sack number '+s+' today for '+nm(tk)+'.':pick(['The protection just broke down.','He held that ball too long.','That\'s a drive killer.','They brought more than the line could block.','Look at the speed off the edge.'])]);}
  else if(kind==='inc'){const t=gm.ball&&gm.ball.target,pb=/Broken up by #(\d+)/.exec(note||''),dr=/Drop/.test(note||'');good=pb?-1:0;
    L.push([0,pb?pick(['Knocked away by number '+pb[1]+'!','Broken up! Number '+pb[1]+' gets a hand on it.']):dr?pick(['Dropped!'+(t?' '+nm(t)+' had it in his hands.':''),'Off his hands. Incomplete.']):pick([nm(qb)+' throws'+(t?' for '+nm(t):'')+', incomplete.','Incomplete'+(t?', intended for '+nm(t)+'.':'.'),'Overthrown. Incomplete.']),pb?1:0]);
    if(pb&&r<0.5)L.push([1,pick(['Great coverage right there.','He played the ball perfectly.','That\'s textbook.'])]);else if(dr&&r<0.5)L.push([1,pick(['He\'s got to make that catch.','That one hit him right in the hands.'])]);}
  else if(passed&&gm.caught&&c){const s=PS(c),qs=PS(qb);good=g>=20?2:fd?1:0;
    if(lc)L.push([0,(kind==='oob'?pick(['Pushed out at '+spot+'.','He steps out at '+spot+'.']):rm?pick(['Finally brought down at '+spot+'!','Dragged down at '+spot+'!']):pick(['Brought down at '+spot+'.','Tackled at '+spot+'.']))+' '+(g>0?'A gain of '+g:'No gain')+(fd?', and a first down.':'.'),g>=20?2:1]);
    else{L.push([0,g>=20?pick([nm(qb)+' going deep. '+nm(c)+' has got it! '+g+' yards!',nm(c)+' is wide open, and '+nm(qb)+' finds him for '+g+'!']):g>=8?pick([nm(qb)+' fires over the middle. Caught by '+nm(c)+' for '+g+'.',nm(qb)+' finds '+nm(c)+' for '+g+'.']):g>0?pick([nm(qb)+', quick throw to '+nm(c)+' for '+g+'.','Short pass to '+nm(c)+', a gain of '+g+'.']):'Complete to '+nm(c)+', but he\'s dropped for '+(g<0?'a loss of '+(-g):'no gain')+'.',g>=20?2:g>=8?1:0]);first();}
    if(gm.bigHit&&tk&&r<0.4)L.push([1,pick(['What a hit by '+nm(tk)+'!','Oh, '+nm(tk)+' laid the wood on that one.','You could hear that one up here in the booth.'])]);
    else if(s.rec>=3&&r<0.5)L.push([1,'That\'s catch number '+s.rec+' for '+nm(c)+'. He\'s up to '+s.recy+' yards.']);
    else if(qs.att>=6&&r<0.45)L.push([1,nm(qb)+' is now '+qs.cmp+' of '+qs.att+' for '+qs.py+' yards.'+(qs.cmp/qs.att>=0.7?' He\'s dealing.':'')]);
    else if(g>=20)L.push([1,pick(['That\'s a big-time throw.','Look at the separation he got.','You can\'t leave him that open.','He put that right on the money.'])]);}
  else if(c){const s=PS(c),scr=c===qb;good=g>=15?2:fd?1:g<=0?-1:0;
    if(rm)L.push([0,pick(['Finally brought down at '+spot+'! What a run, '+g+' yards!','Dragged down at '+spot+'. '+g+' yards on the play!']),2]);
    else{L.push([0,g>=15?pick([nm(c)+' breaks loose! '+g+' yards!',nm(c)+' finds a hole, and he\'s gone for '+g+'!']):g>0&&scr?pick([nm(c)+' keeps it himself for '+g+'.',nm(c)+' takes off and gets '+g+'.']):g>=6?pick([nm(c)+' finds a crease for '+g+'.',nm(c)+' bounces it outside for '+g+'.','Nice run by '+nm(c)+', a gain of '+g+'.']):g>0?pick([nm(c)+' up the middle for '+g+'.',nm(c)+' picks up '+g+'.',nm(c)+' gets '+g+' on the carry.','Brought down at '+spot+'. A gain of '+g+'.']):g===0?pick([nm(c)+' is stuffed at the line.','Nothing there for '+nm(c)+'. No gain.']):pick([nm(c)+' is hit in the backfield! A loss of '+(-g)+'.',nm(c)+' is dropped for a loss of '+(-g)+'.']),g>=15?2:g>=6||g<0?1:0]);first();}
    if(gm.bigHit&&tk&&r<0.4)L.push([1,pick(['What a hit by '+nm(tk)+'!','Oh, '+nm(tk)+' laid the wood on that one.','You could hear that one up here in the booth.'])]);
    else if(g>=15)L.push([1,pick(['The line opened up a huge lane.','Great blocking up front.','One cut and he was gone.','You can\'t teach that kind of speed.'])]);
    else if(s.car>=4&&r<0.5)L.push([1,'That\'s '+s.car+' carries for '+s.ry+' yards for '+nm(c)+'.']);
    else if(g<=0&&tk)L.push([1,pick([nm(tk)+' was waiting for him.',nm(tk)+' shot the gap and blew that play up.'])]);}
  if(gm.zmsg&&L.length<3)L.push([1,gm.zmsg.replace('X-Factor on: ','').split(' · ')[0]+' is in the zone now. Watch out.']);
  if(kind!=='td'&&kind!=='int'&&L.length<3){const tg=gm.toGo,goal=gm.pos+tg>=100,ds=goal?'goal':tg<=1?'short':tg>=10?'long':String(tg);
    if(gm.down>4)L.push([1,pick(['And the defense gets the stop.','They hold on fourth down.'])]);else if(gm.down===4)L.push([0,'Fourth down coming up.']);else if(gm.down===3)L.push([0,'Third and '+ds+'.']);
    else if(gm.down===1&&gm.pos>=80&&gm.pos-g<80)L.push([1,'They\'re in the red zone now.']);}
  const k=(uo===gm.userHome)?good:-good;if(k>=2)cheer(1);else if(k===1)cheer(0.45);else if(k<=-2)cheer(0.12);
  say(L.filter(x=>x[1]).slice(0,3),gm.lcAny);}
// ----- stadium introduction before kickoff -----
// ===== Pregame show: a flyover, the visitors walk out, then the home team's own entrance =====
const INTRO_FX={ARI:[['fire','smoke'],'Fire shoots out of the tunnel and the desert crowd is on its feet.'],ATL:[['lights','smoke','fire'],'The lights go down and the dome glows red and black.'],
  BAL:[['flag','fireworks','drum'],'The flag leads them out, and the brass band is rolling.'],BUF:[['fire','fireworks'],'Through the fire, and this crowd has been tailgating since sunrise.'],
  CAR:[['drum','smoke'],'The drumline pounds as they come out of the smoke.'],CHI:[['flag','smoke'],'No frills here. They jog out into the cold to a wall of noise.'],
  CIN:[['towels','smoke'],'Orange towels everywhere, and the stripes come out of the smoke.','#FB4F14'],CLE:[['fire','chant'],'The bleachers behind the end zone bark them onto the field.'],
  DAL:[['flag','fireworks','lights'],'The giant board lights up the dome as they run out under the star.'],DEN:[['fire','smoke'],'A wall of orange, and the thin air does the rest.'],
  DET:[['lights','smoke'],'The dome goes dark, a roar shakes the speakers, and out they come.'],GB:[['flag','chant'],'Out of the old tunnel and onto the frozen tundra.'],
  HOU:[['fire','fireworks'],'Fireworks under the roof and fire from the tunnel.'],IND:[['lights','smoke'],'Blue smoke, a light show, and they come running.'],
  JAX:[['fire','fireworks'],'Teal smoke, fire, and the pools in the end zone are packed.'],KC:[['drum','fireworks'],'A special guest bangs the big drum, and the loudest crowd in football answers.'],
  LV:[['lights','fire','smoke'],'The dome goes black, the torch flares, and they come out of the dark.'],LAC:[['lights','fireworks'],'Lightning bolts on every screen as they sprint out.'],
  LAR:[['lights','fireworks'],'A light show under the roof, and here they come.'],MIA:[['fire','confetti'],'Fire, music, and the Florida sun.'],
  MIN:[['horn','lights','drum'],'A legend sounds the horn, and the whole building answers with the thunder clap.'],NE:[['cannon','flag'],'The minutemen fire their muskets in the end zone, and out they come.'],
  NO:[['smoke','fireworks','lights'],'The band plays them in, and the dome is shaking.'],NYG:[['flag','smoke'],'Big blue smoke and a wall of noise.'],
  NYJ:[['fire','chant'],'The crowd spells it out, letter by letter, as they take the field.'],PHI:[['fire','flag'],'The fight song rings out, and the whole stadium sings along.'],
  PIT:[['towels','smoke'],'Sixty thousand gold towels spinning over their heads.','#FFB612'],SF:[['fire','confetti'],'Gold confetti, fire, and the faithful are on their feet.'],
  SEA:[['flag','drum'],'A local legend raises the flag, and the crowd shakes the building.'],TB:[['cannon','fireworks'],'The ship fires its cannons and they storm out of the tunnel.'],
  TEN:[['fire','smoke'],'Fire, smoke, and a sea of blue.'],WAS:[['flag','drum'],'The band strikes up the fight song as they take the field.']};
function introCfg(H){const c=INTRO_FX[H.abbr];if(c&&!H.lvl)return {fx:c[0],line:c[1],tow:c[2]||null};
  if(H.lvl==='hs')return {fx:['banner','drum'],line:'The band plays, the cheerleaders hold up the banner, and they bust right through it.'};
  if(H.lvl==='col')return {fx:['flag','drum','fireworks','smoke'],line:'The band, the flags, and a stadium full of students losing their minds.'};return {fx:['fire','smoke'],line:'Fire and smoke as they take the field.'};}
const IT={fly:6.5,away:13,home:29,end:31.5};
function introRoster(T){const L=T===gm.U?gm.LU:gm.LO;return [L.QB,L.RB,...(L.WR||[]).slice(0,3),L.TE,...(L.OL||[]).slice(0,3),...(L.DL||[]).slice(0,2),...(L.LB||[]).slice(0,2),...(L.CB||[]).slice(0,2),(L.S||[])[0]].filter(Boolean);}
function introEnt(T,rp,x,z){const e=mkEnt('O',T===gm.U?'U':'A','IN',rp,x,z,T===gm.U?gm.kitU:gm.kitO,null);e.z=z;e.dir=Math.PI;e.go=1e9;e.path=[];e.pi=0;e.end='idle';return e;}
function startIntro(){gm.phase='intro';const H=gm.home,V=gm.userHome?gm.O:gm.U,cfg=introCfg(H);gm.intro={t:0,cfg,shot:0,V,H};gm.fx=[];gm.emit=[];gm.ents=[];FLIP=false;
  // Visitors: out of the corner tunnel, a walk, then a jog to their sideline.
  const vs=V===gm.U?-1:1,vx=vs*22;introRoster(V).forEach((rp,i)=>{const e=introEnt(V,rp,vx+rnd(-0.8,0.8),121+i*0.9);e.go=IT.fly+0.4+i*0.32;e.walk=7;
    e.path=[[vx,111],[vs*25,104],[vs*29.4,40+((i*7)%23)+rnd(-0.6,0.6)]];e.end=pick(['clap','hype','wave','idle','clap']);e.faceX=0;gm.ents.push(e);});
  // Home: burst out of the tunnel together and gather at the 20 to jump.
  const hr=introRoster(H),n=hr.length;hr.forEach((rp,i)=>{const e=introEnt(H,rp,rnd(-1.2,1.2),121+i*0.7),a=i/n*6.2832;e.go=IT.away+2.6+i*0.17;e.walk=0;
    e.path=[[rnd(-1.5,1.5),108],[Math.cos(a)*2.6,80+Math.sin(a)*2.6]];e.end='jump';e.faceX=0;e.faceZ=80;gm.ents.push(e);});
  if(cfg.fx.includes('flag')&&gm.ents.length){const fe=gm.ents[gm.ents.length-n];fe.flag=true;}
  introCard(1);document.getElementById('cap').hidden=true;capT=0;renderPanel();
  const st=stadOf(H);say([[0,'Welcome to '+stadName(H)+'. '+st[4]],[0,'Hello everybody, I\'m '+BOOTH[0]+', alongside '+BOOTH[1]+'. '+V.name+' visit '+H.name+(gm.wx.night?' tonight. ':' today. ')+weatherWords(gm.wx)+'.']],false,true);}
function introCard(k){const I=gm.intro,H=I.H,V=I.V,st=stadOf(H),el=document.getElementById('intro');let h='';
  if(k===1)h='<p class="eyebrow">Welcome to</p><h2>'+esc(stadName(H))+'</h2><p class="sub">'+esc(H.name)+' · '+ROOF[st[0]]+' · '+st[3]+',000 seats</p><p class="x">'+esc(st[4])+'</p><p class="x">'+esc(weatherWords(gm.wx))+(gm.wx.night?' · Night game':'')+'</p>';
  else if(k===2)h='<p class="eyebrow">The visitors</p><h2>'+esc(V.name)+'</h2><p class="sub">'+V.w+'-'+V.l+' · '+ratings(V).ovr+' overall</p>';
  else if(k===3)h='<p class="eyebrow">Now taking the field</p><h2>'+esc(H.name)+'</h2><p class="sub">'+H.w+'-'+H.l+' · '+ratings(H).ovr+' overall</p><p class="x">'+esc(I.cfg.line)+'</p>';
  else{const caps=gm.U.roster.filter(x=>x.cap).map(x=>x.n),xs=[...gm.U.roster,...gm.O.roster].filter(x=>x.xf).sort((a,b)=>b.ovr-a.ovr).slice(0,4).map(x=>x.n+' ('+xfName(x)+')');
    h='<p class="eyebrow">Today\'s matchup</p><h2>'+esc(V.name)+' at '+esc(H.name)+'</h2><p class="sub">'+V.w+'-'+V.l+' at '+H.w+'-'+H.l+'</p>'+(caps.length?'<p class="x">Your captains: '+caps.map(esc).join(', ')+'</p>':'')+(xs.length?'<p class="x">X-Factors to watch: '+xs.map(esc).join(', ')+'</p>':'');}
  el.innerHTML=h;el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function camLook(x,y,z,tx,ty,tz){cam.x=x;cam.y=y;cam.z=z;cam.yaw=Math.atan2(tx-x,tz-z);cam.pitch=Math.atan2(y-ty,Math.hypot(tx-x,tz-z));}
const ease=u=>{u=clamp(u,0,1);return u*u*(3-2*u);},lerp=(a,b,u)=>a+(b-a)*u;
function stepIntro(dt){const I=gm.intro,t0=I.t;I.t+=dt;const t=I.t,cfg=I.cfg,fx=cfg.fx,H=I.H,V=I.V,at=x=>t0<x&&t>=x;
  // ----- cameras -----
  if(t<IT.fly){const u=ease(t/IT.fly);camLook(lerp(-30,-12,u),lerp(46,15,u),lerp(-46,10,u),lerp(0,0,u),0,lerp(55,72,u));}
  else if(t<IT.away){const u=ease((t-IT.fly)/(IT.away-IT.fly)),vs=V===gm.U?-1:1;camLook(vs*lerp(4,10,u),lerp(5.5,7,u),lerp(96,84,u),vs*lerp(21,27,u),1.4,lerp(116,96,u));}
  else if(t<IT.away+5.2){const u=ease((t-IT.away)/5.2);camLook(lerp(2.5,0.8,u),lerp(2.6,3.4,u),lerp(99,96,u),0,2.4,118);}
  else if(t<IT.away+10){const u=ease((t-IT.away-5.2)/4.8);let cx=0,cz=0,n=0;for(const e of gm.ents)if(e.team===(H===gm.U?'U':'A')&&e.go<t){cx+=e.x;cz+=e.z;n++;}if(n){cx/=n;cz/=n;}else cz=110;
    camLook(lerp(0.8,9,u),lerp(3.4,6,u),lerp(96,66,u),cx,1.2,cz);}
  else if(t<IT.home){const a=(t-IT.away-10)*0.32;camLook(Math.sin(a)*11,4.2,80-Math.cos(a)*11,0,1.3,80);}
  else{const u=ease((t-IT.home)/(IT.end-IT.home));camLook(lerp(Math.sin((IT.home-IT.away-10)*0.32)*11,0,u),lerp(4.2,13,u),lerp(80-Math.cos((IT.home-IT.away-10)*0.32)*11,30,u),0,0,lerp(80,62,u));}
  // ----- story beats -----
  if(at(IT.fly)){introCard(2);say([[0,'Here come the visitors. The '+V.name+' take the field.'],[1,V.w+V.l?'They come in at '+V.w+' and '+V.l+'.':'They\'ve had a good week of practice.']],false,true);cheer(0.25);}
  if(at(IT.away)){introCard(3);say([[0,'And now, the home team. Here come the '+H.name+'!',2],[1,cfg.line]],false,true);
    if(fx.includes('smoke')||fx.includes('lights')||H.lvl!=='hs')gm.emit.push({k:'smoke',x:0,z:117,t1:IT.away+7,col:fx.includes('smoke')?H.c1:'#d8dde3'});
    if(fx.includes('horn'))sfx('horn');if(fx.includes('chant'))for(let k=0;k<4;k++)setTimeout(()=>cheer(0.7),k*700);if(fx.includes('towels'))gm.towel=I.cfg.tow||H.c2;}
  if(fx.includes('drum')&&t>IT.away&&t<IT.away+4.5&&Math.floor(t0*2.2)!==Math.floor(t*2.2))sfx('drum');
  if(fx.includes('lights'))gm.dim=t>IT.away&&t<IT.away+2.8?1:t>IT.away+2.8&&t<IT.away+3.6?(Math.random()<0.5?0.2:1):0;
  if(at(IT.away+2.5)){cheer(1);if(fx.includes('fire')){gm.emit.push({k:'fire',x:-4.2,z:111.5,t1:IT.away+5},{k:'fire',x:4.2,z:111.5,t1:IT.away+5});sfx('fire');}
    if(fx.includes('cannon'))for(let k=0;k<3;k++)setTimeout(()=>{if(!gm||!gm.fx)return;sfx('boom');for(const x of [-30,30])for(let j=0;j<10;j++)gm.fx.push({k:'s',x:x+rnd(-1,1),y:9+rnd(0,1),z:127,vx:rnd(-1,1),vy:rnd(0.5,2),vz:rnd(-2,0),r:rnd(0.8,1.6),life:0,max:rnd(2,3),col:'#e9ecef'});},k*650);
    if(fx.includes('confetti'))gm.emit.push({k:'conf',x:0,z:96,t1:IT.home});}
  if(fx.includes('fireworks')&&t>IT.away+2.6&&t<IT.away+9&&Math.random()<dt*2.2)gm.fx.push({k:'rk',x:rnd(-30,30),y:20,z:rnd(126,140),vx:rnd(-2,2),vy:rnd(24,30),vz:0,life:0,max:rnd(0.9,1.3),col:pick([H.c1,H.c2,'#ffffff','#ffd34d'])});
  if(at(IT.away+10.2)){say([[1,pick(['Listen to this place.','You can feel the energy in here.','This crowd is ready.'])]],false,true);cheer(0.8);}
  if(at(IT.home)){introCard(4);gm.towel=null;}
  // ----- people -----
  for(const e of gm.ents){if(t<e.go){e.vx=e.vz=0;continue;}if(e.pi<e.path.length){const w=e.path[e.pi],dx=w[0]-e.x,dz=w[1]-e.z,l=Math.hypot(dx,dz);
      if(l<0.5){e.pi++;if(e.pi>=e.path.length){e.anim=e.end;e.animT=gm.now;e.face={x:e.faceX||0,z:e.faceZ!=null?e.faceZ:e.z};}continue;}
      const sp=(t-e.go)<(e.walk?e.walk/2.2:0)?2.2:e.team===(H===gm.U?'U':'A')?6.6:5;accel(e,dx/l*sp,dz/l*sp,dt);}
    else accel(e,0,0,dt);e.x+=e.vx*dt;e.z+=e.vz*dt;}
  if(gm.banner==null&&fx.includes('banner'))gm.banner={z:108.5,torn:0};if(gm.banner&&!gm.banner.torn)for(const e of gm.ents)if(e.go<t&&Math.abs(e.z-gm.banner.z)<0.6&&Math.abs(e.x)<4.5){gm.banner.torn=gm.now;sfx('rip');cheer(1);}
  // ----- particles -----
  for(const m of gm.emit){if(t>m.t1)continue;if(m.k==='smoke'&&Math.random()<dt*11)gm.fx.push({k:'s',x:m.x+rnd(-3.5,3.5),y:rnd(0.3,1.6),z:m.z+rnd(-5,3),vx:rnd(-1.2,1.2),vy:rnd(0.2,0.7),vz:rnd(-2.2,-0.6),r:rnd(0.8,1.4),life:0,max:rnd(2.2,3.4),col:m.col});
    if(m.k==='fire')for(let j=0;j<3;j++)gm.fx.push({k:'f',x:m.x+rnd(-0.3,0.3),y:0.3,z:m.z+rnd(-0.3,0.3),vx:rnd(-0.6,0.6),vy:rnd(9,14),vz:rnd(-0.6,0.6),r:rnd(0.35,0.6),life:0,max:rnd(0.35,0.6)});
    if(m.k==='conf'&&Math.random()<dt*60)gm.fx.push({k:'c',x:rnd(-14,14),y:rnd(14,20),z:m.z+rnd(-14,14),vx:rnd(-0.6,0.6),vy:rnd(-2.2,-1.2),vz:rnd(-0.6,0.6),r:0.18,life:0,max:9,col:pick([H.c1,H.c2,'#ffffff','#ffd34d'])});}
  const out=[];for(const p of gm.fx){p.life+=dt;if(p.life>p.max){if(p.k==='rk'){sfx('pop');for(let j=0;j<46;j++){const a=Math.random()*6.2832,b=Math.random()*3.1416,v=rnd(7,11);out.push({k:'w',x:p.x,y:p.y,z:p.z,vx:Math.cos(a)*Math.sin(b)*v,vy:Math.cos(b)*v,vz:Math.sin(a)*Math.sin(b)*v,r:0.32,life:0,max:rnd(1.1,1.6),col:p.col});}gm.flashT=gm.now+0.6;}continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.k==='s'){p.r+=dt*1.1;p.vy*=1-dt*0.5;p.vz*=1-dt*0.6;}else if(p.k==='f'){p.vy*=1-dt*2;p.r+=dt*0.8;}else if(p.k==='w'){p.vy-=9*dt;p.vx*=1-dt*0.9;p.vz*=1-dt*0.9;}else if(p.k==='rk'){p.vy-=12*dt;}
    else if(p.k==='c'){p.x+=Math.sin(gm.now*3+p.max)*dt;if(p.y<0.05){p.y=0.05;p.vy=0;p.vx=p.vz=0;}}out.push(p);}
  gm.fx=out.length>900?out.slice(-900):out;
  if(t>IT.end)endIntro();}
function endIntro(){if(!gm||gm.phase!=='intro')return;document.getElementById('intro').hidden=true;gm.intro=null;gm.ents=[];gm.fx=[];gm.emit=[];gm.towel=null;gm.dim=0;gm.banner=null;cam.x=0;cam.y=10.5;cam.yaw=0;cam.pitch=0.36;startToss(false);}
// Little synthesized sounds for the pregame: drums, the horn, fireworks, fire, cannons, the banner.
function sfx(k){try{if(!AC||S.crowd===false)return;const t=AC.currentTime,g=AC.createGain();g.connect(AC.destination);
  const noise=(dur,f,type)=>{const n=Math.floor(AC.sampleRate*dur),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=AC.createBufferSource();s.buffer=b;const fl=AC.createBiquadFilter();fl.type=type||'lowpass';fl.frequency.value=f;s.connect(fl);fl.connect(g);s.start(t);};
  if(k==='drum'){const o=AC.createOscillator();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(48,t+0.3);o.connect(g);g.gain.setValueAtTime(0.55,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.45);o.start(t);o.stop(t+0.5);}
  else if(k==='horn'){for(const f of [73,110,146]){const o=AC.createOscillator(),lp=AC.createBiquadFilter();o.type='sawtooth';o.frequency.setValueAtTime(f*0.94,t);o.frequency.linearRampToValueAtTime(f,t+0.5);lp.type='lowpass';lp.frequency.value=700;o.connect(lp);lp.connect(g);o.start(t);o.stop(t+3.2);}
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.12,t+0.45);g.gain.setValueAtTime(0.12,t+2.4);g.gain.exponentialRampToValueAtTime(0.0001,t+3.1);}
  else if(k==='boom'){g.gain.value=0.9;noise(1.1,260);}else if(k==='pop'){g.gain.value=0.35;noise(0.7,900);}else if(k==='fire'){g.gain.value=0.35;noise(1.6,1400,'bandpass');}else if(k==='rip'){g.gain.value=0.3;noise(0.35,2500,'highpass');}}catch(e){}}
// ----- flags: you accept or decline when the other team commits the foul -----
function penCalc(pen,pos,down,toGo){if(pen.spot)return {pos:pen.spot,down:1,toGo:Math.min(10,100-pen.spot)};
  if(pen.off){const y=Math.min(pen.y,Math.max(1,Math.floor(pos/2)));return {pos:pos-y,down,toGo:toGo+y};}
  const y=Math.min(pen.y,Math.max(1,Math.ceil((100-pos)/2))),q=Math.min(99,pos+y),tg=toGo-y;return (pen.auto||tg<=0)?{pos:q,down:1,toGo:Math.min(10,100-q)}:{pos:q,down,toGo:tg};}
function downText(d,tg,pos){const uo=uoff(),PT=uo?gm.U:gm.O,DT=uo?gm.O:gm.U;return ['1st','2nd','3rd','4th'][Math.min(3,d-1)]+' & '+(pos+tg>=100?'Goal':tg)+' at '+(pos===50?'midfield':'the '+(pos<50?PT.abbr+' '+pos:DT.abbr+' '+(100-pos)));}
function flagPick(acc){const f=gm&&gm.pend;if(!f||gm.phase!=='flag')return;gm.pend=null;
  if(acc){const s=f.snap;gm.pos=s.pos;gm.down=s.down;gm.toGo=s.toGo;gm.bx=s.bx;gm.us=s.us;gm.them=s.them;gm.clock=s.clock;gm.exp=s.exp;gm.st=s.st;gm.zone=s.zone;gm.ps=s.ps;gm.cele=null;gm.after=null;applyPenalty(f.pen,f.who);}
  else{flash('Penalty declined');say([[0,'The penalty is declined. The play stands.']]);gm.phase='dead';gm.deadT=99;renderPanel();}}
// A foul on this play, and whether the team it helps would want it enforced.
function rollFoul(kind,z){if(gm.conv||gm.ko||gm.q===5||gm.drill||gm.fumRet)return null;const los=gm.pos,r=Math.random(),gain=(kind==='inc'||kind==='int')?0:(kind==='td'?100:Math.min(99,Math.round(z)))-los,E=gm.ents,D=E.filter(e=>e.side==='D');
  if(r<0.016)return {pen:{off:true,n:'Holding',y:10},who:pick(E.filter(isOL)),want:kind!=='int'&&gain>0};
  if(r<0.03)return {pen:{off:false,n:'Defensive holding',y:5,auto:true},who:pick(D.filter(e=>e.role[0]!=='D')),want:!(kind==='td'||gain>=Math.max(5,gm.toGo))};
  if(kind==='inc'&&gm.pbu&&r<0.12){const sp=clamp(Math.round(gm.ball.land.z),los+1,99);if(sp>=los+4)return {pen:{off:false,n:'Pass interference',spot:sp,auto:true},who:pick(D.filter(e=>e.role[0]==='C')),want:true};}
  if(gm.thrownAt!=null&&r>0.994)return {pen:{off:false,n:'Roughing the passer',y:15,auto:true},who:pick(D.filter(e=>e.role[0]==='D')),want:kind!=='td'&&gain<15};
  return null;}

// ----- coin toss, play clock, timeouts, kneel downs -----
const PCR=3; // play-clock seconds that pass for each real second
function startToss(ot){const userCalls=!gm.userHome||gm.two;gm.phase='toss';gm.toss={ot:!!ot,step:'call',side:Math.random()<0.5?'H':'T',text:'',win:null};
  if(!userCalls){tossResult(Math.random()<0.5?'H':'T');return;}
  renderPanel();say([[0,(ot?'We\'re headed to overtime! ':'')+'The captains are out at midfield for the coin toss. '+gm.U.name+', the visitors, will make the call.']]);}
function tossResult(call){const T=gm.toss,cn=c=>c==='H'?'heads':'tails',callerU=!gm.userHome&&!gm.two;T.win=gm.two?((call===T.side)?'A':'U'):((call===T.side)===callerU)?'U':'A';
  T.text=(callerU?'You call ':gm.O.name+' call ')+cn(call)+'. It\'s '+cn(T.side)+'.';
  if(gm.two){T.step='choose';flash((T.win==='U'?gm.U:gm.O).name+' win the toss');say([[0,'It\'s '+cn(T.side)+'. '+(T.win==='U'?gm.U:gm.O).name+' win the toss.']]);}
  else if(T.win==='U'){T.step='choose';flash('You win the toss');say([[0,'It\'s '+cn(T.side)+'. '+gm.U.name+' win the toss.']]);}
  else{T.step='done';flash(gm.O.name+' win the toss');say([[0,'It\'s '+cn(T.side)+'. '+gm.O.name+' win the toss, and they\'ll '+(T.ot?'take the ball.':'receive.')]]);}
  renderPanel();}
function tossCall(heads){const T=gm&&gm.toss;if(!T||gm.phase!=='toss'||T.step!=='call')return;tossResult(heads?'H':'T');}
function tossPick(recv){const T=gm&&gm.toss;if(!T||gm.phase!=='toss'||T.step==='call')return;const W=T.win||'U',O2=W==='U'?'A':'U',r=T.step==='choose'?(recv?W:O2):'A';gm.toss=null;gm.recv1=r;
  if(T.ot)return give(r,25);kickoff(r==='U'?'A':'U');}
function qWords(){return gm.q===2?'half':gm.q===4?'game':'quarter';}
function useTimeout(side){if(!gm||!gm.to||gm.to[side]<=0||(gm.phase!=='huddle'&&gm.phase!=='presnap')||gm.ko||gm.conv)return false;
  gm.to[side]--;const wasRun=gm.run,T=side==='U'?gm.U:gm.O,n=gm.to[side];gm.run=false;gm.pc=40;gm.preT=0;
  flash('Timeout, '+T.name+' · '+(n?n+' left':'none left'));
  say([[0,'Timeout, '+T.name+'.'+(wasRun&&gm.q!==5?' That stops the clock with '+fmtClock(gm.clock)+' to go in the '+qWords()+'.':'')],[1,n===0?'That was their last one.':'They\'ve got '+(n===1?'one':'two')+' left.']]);renderPanel();return true;}
function aiTimeoutCheck(){if(gm.two||gm.drill||!gm.run||gm.q===5||!(gm.q===2||gm.q===4)||gm.clock>75||gm.to.A<=0)return;const lead=gm.them-gm.us;
  if(gm.poss==='A'){if(gm.q===2||lead<=0)useTimeout('A');}else if(gm.q===4&&lead<0&&lead>=-16)useTimeout('A');}
function kneel(){if(!gm||gm.phase!=='huddle'||!(uoff()||gm.two)||gm.conv)return;const qb=gm.by.QB;if(qb){qb.anim='hold';qb.animT=gm.now;}
  gm.phase='dead';gm.deadT=0;gm.cele=null;gm.pos=Math.max(1,gm.pos-1);gm.toGo++;gm.down++;
  const after=gm.down>4?{change:true,to:'A',next:clamp(100-gm.pos,1,99)}:{};tick(2);gm.run=!after.change&&!gm.exp;gm.after=after;
  gm.msg='Kneel down'+(after.change?' · Turnover on downs':'');flash(gm.msg);say([[0,pick([gm.LU.QB.n+' takes a knee.','And '+gm.LU.QB.n+' kneels it down.','Victory formation, and '+gm.LU.QB.n+' takes the knee.'])]]);renderPanel();}
const canKneel=()=>gm&&(uoff()||gm.two)&&!gm.conv&&((gm.q===2&&gm.clock<=120)||(gm.q===4&&(uoff()?gm.us>gm.them:gm.them>gm.us)&&gm.clock<=150));
// The play clock runs between plays, and the game clock with it after a play that ends in bounds.
function clockStep(real){const ph=gm.phase;if((ph!=='huddle'&&ph!=='presnap')||gm.ko||gm.conv||gm.pc==null)return;const d=real*PCR;gm.pc-=d;
  if(gm.run&&gm.q!==5){gm.clock-=d*(hurryOn()?0.45:1);if(gm.clock<=0){gm.clock=0;gm.exp=true;gm.run=false;gm.pc=null;flash('End of the '+['','1st','2nd','3rd','4th'][gm.q]+' quarter');if(!nextQuarter())setHuddle();return;}}
  if(gm.pro&&ph==='presnap'&&uoff()&&gm.pro.pos!=='QB'&&gm.pc<=6){snap();return;}
  if(uoff()||gm.two){if(gm.pc<=0){gm.pc=null;gm.run=false;applyPenalty({off:true,n:'Delay of game',y:5,pre:true},null);}}
  else if(ph==='presnap'){gm.preT=(gm.preT||0)+real;if(gm.pc<=gm.aiSnapAt&&gm.preT>1.3)snap();}
  else if(gm.pc<=gm.aiSnapAt+3)callDef(DCALLS.indexOf(gm.sugD[0]));}
// A whole possession played out in a few lines, for the "Sim drive" button.
function simDrive(){if(!gm||gm.phase!=='huddle'||gm.conv||gm.ko)return;const uo=uoff(),side=gm.poss,other=uo?'A':'U',OT=uo?gm.U:gm.O,DT=uo?gm.O:gm.U,L=uo?gm.LU:gm.LO,st=gm.st,
  diff=ratings(OT).off-ratings(DT).def+(uo?-1.5:1.5)*dk(),recv=[...L.WR,L.WR[0],L.TE,L.RB];let plays=0,res=null,yds=0,used=0,kd=0,sc=null,thr=false;const ps=rp=>PS({rp,team:side});
  hush();gm.run=false;
  while(!res&&plays<30){
    if(gm.q!==5&&gm.clock<=0){if(gm.q===2||gm.q===4){res='clock';break;}gm.q++;gm.clock=gm.QL;gm.exp=false;}
    if(gm.down===4){const d=fgDist(),goal=gm.pos+gm.toGo>=100,behind=uo?gm.us<gm.them:gm.them<gm.us;
      if(!((gm.toGo<=1&&gm.pos>=40)||(goal&&gm.toGo<=2)||(gm.q===4&&behind&&gm.clock<150&&d>50))){
        if(d<=52){kd=d;res=Math.random()<clamp(0.95-(d-20)*0.012+(L.K.ovr-75)*0.004,0.2,0.98)?'fg':'fgmiss';tick(5);used+=5;}else res='punt';break;}}
    plays++;const pass=Math.random()<(gm.toGo>=7?0.66:gm.toGo<=2?0.3:0.52),r=Math.random();let g=0,inc=false,oob=false;thr=pass;
    if(pass){const Q=ps(L.QB);Q.att++;if(uo)st.att++;const pInt=clamp(0.024-diff*0.0007,0.008,0.05),pSack=clamp(0.06-diff*0.001,0.03,0.1),pInc=clamp(0.35-diff*0.004-(gm.pro&&uo?0.08:0),0.2,0.5);
      if(r<pInt){Q.pint++;if(uo)st.int++;else st.dInt++;res='int';break;}
      else if(r<pInt+pSack){g=-rint(3,9);if(uo)st.sk++;else st.dSk++;}
      else if(r<pInt+pSack+pInc)inc=true;
      else{g=Math.max(-2,Math.round(5.5+diff*0.1+(gm.pro&&uo?1.6:0)+gauss()*5+(Math.random()<0.13?rnd(12,40):0)));sc=pick(recv);const R=ps(sc);Q.cmp++;R.rec++;if(uo)st.cmp++;
        g=Math.min(g,100-gm.pos);Q.py+=g;R.recy+=g;if(uo)st.yds+=g;oob=Math.random()<0.25;}}
    else{if(r<0.011){res='fum';break;}sc=L.RB;g=Math.min(100-gm.pos,Math.round(3.6+diff*0.06+(gm.pro&&uo?0.9:0)+gauss()*3.2+(Math.random()<0.07?rnd(8,35):0)));const R=ps(sc);R.car++;R.ry+=g;if(uo)st.rush+=g;oob=Math.random()<0.1;}
    if(!uo)st.dYds+=g;const t=inc?6:oob?8:rint(26,38);tick(t);used+=t;yds+=g;
    if(gm.pos+g>=100){res='td';if(thr){ps(L.QB).ptd++;if(uo)st.td++;}if(sc)ps(sc).td++;break;}
    if(gm.pos+g<=0){res='safety';break;}
    gm.pos+=g;if(inc)gm.down++;else if(g>=gm.toGo){gm.down=1;gm.toGo=Math.min(10,100-gm.pos);}else{gm.down++;gm.toGo-=g;}
    if(gm.down>4){res='downs';break;}}
  const ON=uo?'You':gm.O.name,head=plays+(plays===1?' play, ':' plays, ')+yds+(Math.abs(yds)===1?' yard':' yards')+(gm.q!==5?', '+fmtClock(used)+' off the clock':'');let after={},line='';
  if(res==='td'){addScore(side,6);after={td:true};line='Touchdown'+(sc?', '+sc.n+(thr?' on the catch.':' on the run.'):'.');say([[0,'Touchdown, '+OT.name+'!',2],[1,'That\'s a '+plays+'-play drive, '+yds+' yards.']]);cheer(side==='U'===gm.userHome?1:0.15);}
  else if(res==='fg'){addScore(side,3);after={ko:side,fg:true};line=kd+'-yard field goal is good.';}
  else if(res==='fgmiss'){after={change:true,to:other,next:Math.max(20,100-gm.pos)};line=kd+'-yard field goal is no good.';}
  else if(res==='punt'){const net=rint(36,50),land=gm.pos+net,s=land>=100?20:clamp(100-land,3,60);after={change:true,to:other,next:s};line=(uo?'You punt. ':gm.O.name+' punt. ')+(uo?gm.O.name+' start at their own '+s+'.':'You start at your own '+s+'.');tick(8);}
  else if(res==='int'||res==='fum'){const n=clamp(100-(gm.pos+(res==='int'?rint(4,18):0))+rint(0,15),1,99),D=uo?gm.LO:gm.LU,who=pick([...D.LB,...D.CB,...D.S]);after={change:true,to:other,next:n};line=(res==='int'?'Intercepted by ':'Fumble, recovered by ')+who.n+'.';}
  else if(res==='downs'){after={change:true,to:other,next:clamp(100-gm.pos,1,99)};line='Stopped on downs.';}
  else if(res==='safety'){addScore(other,2);after={ko:side};line='Safety.';}
  else line='The clock runs out.';
  if(after.td&&gm.q!==5)line+=' '+(uo?'Now the try.':'');
  showCard((uo?'Your':gm.O.name)+' drive',[head,line,gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them],'Continue',()=>{gm.after=after;gm.pend=null;afterPlay();});}
// ----- laterals: pitch the ball backward to a teammate -----
function latTargets(c){return gm.ents.filter(e=>e.side===c.side&&e!==c&&!e.down&&!isOL(e)&&e.role!=='KK'&&e.z<=c.z+0.3&&dist(e,c)<9.5);}
function lateral(c,to){if(!c||!to||gm.phase!=='live'||gm.ball.fly)return false;const d=dist(c,to),T=Math.max(0.28,d/14),land=predictPos(to,T);land.z=Math.min(land.z,c.z);
  const bad=Math.random()<0.07||gm.ents.some(x=>x.side!==c.side&&!x.down&&dist(x,c)<1.2&&Math.random()<0.35),sig=bad?2.4:0.3;land.x+=gauss()*sig;land.z+=gauss()*sig*0.6;
  const g=10.7,x0=c.x,z0=c.z,y0=1.2;gm.ball={fly:true,lat:true,x:x0,y:y0,z:z0,t:0,T,land,target:to,from:c,vx:(land.x-x0)/T,vz:(land.z-z0)/T,vy:(1.2-y0)/T+0.5*g*T,g};
  gm.carrier=null;c.anim='throw';c.animT=gm.t;gm.lats=(gm.lats||0)+1;gm.lcAny=true;say([[0,pick(['He pitches it!','A lateral!','He tosses it back!']),2]]);return true;}
function userLateral(team){const c=gm&&gm.carrier;if(!c||gm.pro&&c.rp.id!==gm.pro.id||gm.phase!=='live'||c.team!==(team||'U')||gm.ko||gm.ret||gm.loose||(c===gm.by.QB&&gm.mode==='pocket'))return;
  const L=latTargets(c);if(!L.length){flash('Nobody behind you to pitch to');return;}
  L.sort((a,b)=>(openness(b)-dist(b,c)*0.15)-(openness(a)-dist(a,c)*0.15));lateral(c,L[0]);}
function resolveLat(){const b=gm.ball,to=b.target,L=b.land,dR=Math.hypot(to.x-L.x,to.z-L.z);let dD=99;for(const x of gm.ents)if(x.side!==to.side&&!x.down){const dd=Math.hypot(x.x-L.x,x.z-L.z);if(dd<dD)dD=dd;}
  if(dR<=1.4&&Math.random()<(dD<1?0.6:0.93)){to.x=to.x*0.5+L.x*0.5;to.z=to.z*0.5+L.z*0.5;to.anim='carry';gm.carrier=to;gm.ball={held:to};gm.mode='run';if(gm.trick&&to===gm.by.QB){gm.trick.done=true;to.anim='idle';}return;}
  startLoose(L.x,L.z,b.from,null,'lat');}
// The computer pitches it around on a last play when it is behind.
function aiLateral(c){if(gm.two||c.team!=='A'||gm.ko||gm.ret||gm.ball.fly||(gm.lats||0)>=3)return;const last=(gm.q===4||gm.q===5)&&gm.clock<=6&&gm.them<gm.us;const hook=gm.play.hook&&gm.caught&&!gm.lats&&gm.t-(gm.catchT||0)>0.3;
  if(!last&&!hook)return;let nd=99;for(const d of gm.ents)if(d.side!==c.side&&!d.down)nd=Math.min(nd,dist(d,c));if(!hook&&nd>1.8)return;const L=latTargets(c);if(L.length&&Math.random()<(hook?1:0.04))lateral(c,pick(L));}
// ----- fumbles and loose balls -----
function fumbleCheck(c,d,big,sack){if(gm.ko||gm.conv||gm.ret||gm.loose||gm.drill&&gm.drill.kind==='kick')return false;const w=gm.wx||{};
  let p=(sack?0.06:big?0.045:0.009)*(w.sky==='rain'?1.5:w.sky==='snow'?1.4:1)*(c.zone&&c.rp.pos==='RB'?0.3:1)*(zx(d,'strip')?4:zx(d,'hammer')?3:1)*(c.team==='U'&&!gm.two?[0.6,0.85,1,1.1,1.2][S.diff]:1);
  if(Math.random()>=p)return false;startLoose(c.x,c.z+0.4,c,d,'fum');return true;}
function startLoose(x,z,from,forcer,why){const t=gm.t;gm.loose={why,from:from||null,forcer:forcer||null,t0:t,team:from?from.team:null};gm.carrier=null;gm.mode='loose';gm.throwing=null;
  gm.ball={loose:true,spin:true,x,y:0.8,z,vx:rnd(-3,3)+(from?from.vx*0.3:0),vz:rnd(-3,3)+(from?from.vz*0.3:0),vy:rnd(2.5,4.5)};
  for(const e of gm.ents){e.eng=null;e.blk=null;e.wrap=null;e.lunge=0;e.drag=null;e.cover=null;e.zn=null;e.dz=null;e.route=null;e.blitz=false;e.crash=false;e.bite=0;e.rr=t+rnd(0.12,0.45);}
  const near=team=>gm.ents.filter(e=>e.team===team&&!e.down).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0]||null;
  gm.ctl=window.__auto?null:gm.pro?proEnt():near('U');gm.ctl2=gm.two?near('A'):null;
  if(why!=='onside'){flash(why==='lat'?'Loose ball!':'Fumble!');say([[0,why==='lat'?'It\'s on the ground! Loose ball!':'Fumble! The ball is loose!',2]]);cheer(0.6);if(from)PS(from).fum=(PS(from).fum||0)+1;}renderPanel();}
const ctlOf=team=>gm.ctl&&gm.ctl.team===team?gm.ctl:gm.ctl2&&gm.ctl2.team===team?gm.ctl2:null;
function stepLoose(dt){gm.t+=dt;const t=gm.t,b=gm.ball,E=gm.ents,L=gm.loose,ons=L.why==='onside';
  b.vy-=20*dt;b.x+=b.vx*dt;b.z+=b.vz*dt;b.y+=b.vy*dt;
  if(b.y<=0.15){b.y=0.15;const kp=ons?0.85:0.6;if(Math.abs(b.vy)>1.5){b.vy=Math.abs(b.vy)*0.42;b.vx=b.vx*kp+rnd(-2.5,2.5);b.vz=b.vz*kp+rnd(-2.5,2.5);}else{b.vy=0;const f=Math.max(0,1-(ons?1.2:3)*dt);b.vx*=f;b.vz*=f;}}
  for(const e of E){e.face=null;if(e.down||e.role==='KK'&&ons&&t<0.6)continue;const mine=e===gm.ctl||e===gm.ctl2;
    if(mine&&e.stun<=t){const [ix,iz,l]=userInput(e.team);if(l<0.1)accel(e,0,0,dt);else accel(e,ix*e.max,iz*e.max,dt);}
    else if(t<e.rr||e.stun>t)accel(e,0,0,dt);
    else seek(e,b.x+b.vx*0.25,b.z+b.vz*0.25,e.max*(isOL(e)?0.85:1),dt);
    e.anim=Math.hypot(e.x-b.x,e.z-b.z)<1.6?'dive':'idle';
    const legal=!(ons&&e.side==='D'&&b.z>55);
    if(legal&&b.y<0.75&&Math.hypot(e.x-b.x,e.z-b.z)<0.8&&(e.recCd||0)<t){e.recCd=t+0.3;if(Math.random()<(ons?(e.side==='D'?0.75:0.16):1)*(mine?0.5:0.38)/(ons?0.38:1)){recoverLoose(e);return;}b.vx+=rnd(-3,3);b.vz+=rnd(-3,3);b.vy=2;}}
  integrate(dt);separate();
  if(Math.abs(b.x)>FW||b.z>110||b.z<-10)looseOut();}
function recoverLoose(e){const L=gm.loose,b=gm.ball;gm.loose=null;e.anim='down';e.down=true;e.fallAmt=1;e.fallDir=1;e.vx*=0.3;e.vz*=0.3;gm.ball={held:e};gm.carrier=e;
  const T=e.team==='U'?gm.U:gm.O;flash((L.why==='onside'?'Onside kick! ':'')+'Recovered by '+T.name);
  if(L.why==='onside'){gm.onsideRec=e.side==='D'?e.team:null;return endPlay('tackle',e.z);}
  if(e.side==='O'){if(L.from)PS(e).fr=(PS(e).fr||0)+1;say([[0,'And '+e.rp.n+' falls on it! '+T.name+' keep the ball.',1]],true);return endPlay('fumrec',e.z);}
  PS(e).fr=(PS(e).fr||0)+1;gm.fumRet=true;e.down=false;e.anim='carry';say([[0,e.rp.n+' scoops it up!',2]],true);startReturn(e,e.z,true);}
function looseOut(){const b=gm.ball,L=gm.loose;gm.loose=null;b.vx=b.vz=0;
  if(L.why==='onside'){gm.onsideRec=null;return endPlay('tackle',clamp(b.z,1,99));}
  if(b.z>=100){gm.fumRet=true;gm.retYds=0;flash('Out of the end zone. Touchback');return endPlay('int',110);}
  if(b.z<=0)return endPlay('tackle',0);flash('Out of bounds. '+(uoff()?gm.U.name:gm.O.name)+' keep it');endPlay('fumrec',b.z);}
// ----- kickoff power meter: stop it at the right moment for a long kick -----
function koMeterStart(kicker,R,live){gm.phase='kometer';gm.kom={t:0,v:0,kicker,R,live};renderPanel();}
function koMeterHit(){const k=gm&&gm.kom;if(!k||gm.phase!=='kometer')return;const p=k.v,yds=Math.round(38+p*34),KT=k.kicker==='U'?gm.U:gm.O;gm.kom=null;
  say([[0,p>0.85?'He booms it deep!':p<0.4?'It\'s a short, low kick.':'A good, solid kick.',p>0.85?1:0]]);
  if(k.live){gm.koPow=p;gm.phase='presnap';return snapKO();}
  const land=65-yds;let spot,txt;if(land<=-1&&Math.random()<0.9){spot=30;txt=yds+'-yard kickoff · Touchback';}else{spot=clamp(Math.max(land,0)+rint(12,26),10,50);txt=yds+'-yard kickoff · Returned to the '+(spot<=50?spot:100-spot);}
  tick(5);flash(txt);if(gm.two)return startDrive(k.R,spot);return give(k.R,spot);}
// ----- onside kicks -----
function onsideBall(){const s=Math.random()<0.5?-1:1;return {loose:true,spin:true,x:rnd(-2,2),y:0.3,z:65,vx:s*rnd(3,7),vz:-rnd(8.5,11),vy:rnd(3,7)};}
// ----- tricks: flea flicker, reverse -----
function stepTrick(dt){const tr=gm.trick,by=gm.by,t=gm.t,los=gm.pos,p=gm.play;if(!tr||tr.done)return false;
  if(p.flea){const rb=by.RB;if(!gm.handed&&t>=0.42){gm.handed=true;gm.carrier=rb;gm.ball={held:rb};rb.anim='carry';liveCall('hand',rb);}
    if(gm.handed&&gm.carrier===rb&&!gm.ball.fly&&t>=1.15&&!rb.down){lateral(rb,by.QB);tr.pitched=true;}
    return false;}
  if(p.rev){const rb=by.RB,w=tr.w;if(gm.carrier===rb&&!rb.down&&!tr.done&&t>0.85&&dist(w,rb)<1.7){gm.carrier=w;gm.ball={held:w};w.anim='carry';rb.anim='idle';tr.done=true;for(const d of gm.ents)if(d.side==='D'&&!d.eng&&dist(d,w)>5&&Math.random()<0.75){d.stun=Math.max(d.stun,t+rnd(0.3,0.7));}say([[0,'Reverse! '+w.rp.n+' has it!',2]]);}}
  return false;}
// ----- audibles, hot routes, hurry-up and spikes -----
const HOT=[['Go','go'],['Slant','slant'],['Out','out'],['In','in5'],['Curl','curl'],['Flat','tflat'],['Block',null]];
function audible(p){if(!gm||gm.phase!=='presnap'||!(uoff()||gm.two)||gm.ko||!p)return;const dc=gm.defCall;gm.recent=[p.n,...gm.recent].slice(0,3);setFormation(p,dc);gm.aud=null;flash('Audible: '+p.n);say([[1,pick(['He\'s changing the play at the line.','Audible! He saw something he didn\'t like.'])]]);renderPanel();}
function hotRoute(key,ri){if(!gm||gm.phase!=='presnap'||gm.ko)return;const e=gm.elig.find(x=>x.key===key)||gm.hotPool&&gm.hotPool.find(x=>x.key===key);if(!e)return;const r=HOT[ri];if(!r)return;
  if(!r[1]){e.route=null;gm.elig=gm.elig.filter(x=>x!==e);flash('#'+e.num+' stays in to block');}
  else{let rt=r[1];if(rt==='tflat'&&(e.role==='RB'||e.role==='WR3'&&FORMS[gm.play.f].fb))rt='rflat';e.route=buildRoute(e,RT[rt]);if(!gm.elig.includes(e))gm.elig.push(e);flash('Hot route: #'+e.num+' '+r[0].toLowerCase());}
  gm.aud=null;gm.audK=null;renderPanel();}
function spike(){if(!gm||(gm.phase!=='huddle'&&gm.phase!=='presnap')||!(uoff()||gm.two)||gm.conv||gm.ko||!gm.run||gm.down>=4)return;const qb=gm.by.QB;if(qb){qb.anim='throw';qb.animT=gm.t;}
  gm.phase='dead';gm.deadT=0;gm.cele=null;gm.down++;tick(1);gm.run=false;gm.after={};gm.msg='Spike · Clock stopped';flash(gm.msg);say([[0,'He spikes it to stop the clock.']]);gm.st.att+=uoff()?1:0;renderPanel();}
function toggleHurry(){if(!gm)return;gm.hurry=!gm.hurry;flash(gm.hurry?'Hurry-up offense':'Back to a normal pace');if(gm.hurry)say([[1,'They\'re going no-huddle. Picking up the pace.']]);renderPanel();}
const hurryOn=()=>gm&&(uoff()?gm.hurry:gm.two?gm.hurry:gm.aiHurry);
// ----- instant replay: every play is recorded and can be watched again -----
const PKEYS=['lean','lTh','rTh','lKn','rKn','lArm','rArm','lEl','rEl','fall','hop','spread','roll'],RS=18;
function recStart(){recFinish();gm.rec={ents:gm.ents,frames:[],flip:FLIP,pos:gm.pos,toGo:gm.toGo,poss:gm.poss,conv:gm.conv,ko:gm.ko,kz:gm.kz,bx:gm.bx,hl:null,title:''};}
function recFrame(){const r=gm.rec;if(!r||r.frames.length>900||r.ents!==gm.ents)return;const E=r.ents,a=new Float32Array(E.length*RS+9);let i=0;
  for(const e of E){a[i++]=e.x;a[i++]=e.y||0;a[i++]=e.z;a[i++]=e.dir;a[i++]=e.fallDir||1;for(const k of PKEYS)a[i++]=e.pose[k];}
  const b=gm.ball;if(b&&b.held){a[i++]=1;a[i++]=E.indexOf(b.held);i+=7;}else if(b){a[i++]=2;a[i++]=-1;a[i++]=b.x;a[i++]=b.y;a[i++]=b.z;a[i++]=b.vx||0;a[i++]=b.vy||0;a[i++]=b.vz||0;a[i++]=b.spin?1:0;}
  r.frames.push({t:gm.now,a});}
// Keeps the best plays for the highlight reel.
function recMark(title,score){if(!gm.rec)return;gm.rec.title=title;gm.rec.hl=Math.max(gm.rec.hl||0,score);}
// Credit on a recorded play for the players who made it, so a player's own plays can be found later.
function recCred(e,score,t){const r=gm.rec;if(!r||!e||!e.rp)return;const c=r.cred||(r.cred={}),o=c[e.rp.id];if(!o||o.s<score)c[e.rp.id]={s:score,t};}
function recFinish(){const r=gm.rec;if(!r)return;gm.rec=null;if(r.frames.length<10||(!r.hl&&!r.cred))return;r.frames=r.frames.filter((f,i)=>i%2===0);r.q=gm.q;
  if(r.hl)gm.hls=(gm.hls||[]).concat(r).sort((a,b)=>b.hl-a.hl).slice(0,8);
  if(r.cred){const P=gm.pclips||(gm.pclips=[]);P.push(r);const mx=x=>Math.max(...Object.values(x.cred).map(o=>o.s));if(P.length>18){P.sort((a,b)=>mx(b)-mx(a));P.length=18;P.sort((a,b)=>a.frames[0].t-b.frames[0].t);}}}
const ANGLES=['Broadcast','Sideline','Sky cam','Reverse angle'];
function startReplay(list,feat){if(!gm||!list.length)return;const ph=gm.phase;if(ph!=='dead'&&ph!=='card')return;
  gm.rp={feat:feat||null,list,i:0,t:0,spd:1,ang:0,paused:false,from:ph,saved:{ents:gm.ents,ball:gm.ball,flag:gm.flag,pos:gm.pos,toGo:gm.toGo,poss:gm.poss,conv:gm.conv,ko:gm.ko,kz:gm.kz,bx:gm.bx,flip:FLIP,kanim:gm.kanim,cele:gm.cele}};
  gm.phase='replay';hush();flashT=0;document.getElementById('flash').classList.remove('on');capT=0;document.getElementById('cap').hidden=true;rpLoad();renderPanel();}
function rpLoad(){const R=gm.rp,r=R.list[R.i];R.t=r.frames[0].t;gm.ents=r.ents;gm.pos=r.pos;gm.toGo=r.toGo;gm.poss=r.poss;gm.conv=r.conv;gm.ko=r.ko;gm.kz=r.kz;gm.bx=r.bx;gm.flag=null;gm.kanim=null;FLIP=r.flip;gm.camSnap=true;
  if(R.feat){featCard(R.feat,R.i);flash(R.feat.n);}else if(R.list.length>1)flash(r.title||'Highlight');if(R.list.length>1)renderPanel();}
function rpApply(f){const E=gm.ents,a=f.a;let i=0;for(const e of E){e.x=a[i++];e.y=a[i++];e.z=a[i++];e.dir=a[i++];e.fallDir=a[i++];for(const k of PKEYS)e.pose[k]=a[i++];}
  if(a[i]===1)gm.ball={held:E[a[i+1]]};else if(a[i]===2)gm.ball={x:a[i+2],y:a[i+3],z:a[i+4],vx:a[i+5],vy:a[i+6],vz:a[i+7],spin:a[i+8]>0};else gm.ball=null;}
function stepReplay(real){const R=gm.rp,r=R.list[R.i],F=r.frames;if(!R.paused)R.t+=real*R.spd;let k=0;while(k<F.length-1&&F[k+1].t<=R.t)k++;rpApply(F[k]);
  if(R.t>F[F.length-1].t+0.8){if(R.i<R.list.length-1){R.i++;rpLoad();}else if(R.list.length===1&&!R.feat){R.t=F[0].t;}else endReplay();}}
function endReplay(){const R=gm&&gm.rp;if(!R)return;const s=R.saved;gm.ents=s.ents;gm.ball=s.ball;gm.flag=s.flag;gm.pos=s.pos;gm.toGo=s.toGo;gm.poss=s.poss;gm.conv=s.conv;gm.ko=s.ko;gm.kz=s.kz;gm.bx=s.bx;FLIP=s.flip;gm.kanim=s.kanim;gm.cele=s.cele;
  if(R.feat)document.getElementById('intro').hidden=true;gm.phase=R.from;gm.rp=null;cam.yaw=0;gm.camSnap=true;if(gm.phase==='dead')gm.deadT=Math.min(gm.deadT,0.6);renderPanel();}
function rpCam(dt){const R=gm.rp,b=gm.ball;let fx=0,fz=gm.pos;if(b&&b.held){fx=b.held.x;fz=b.held.z;}else if(b){fx=b.x;fz=b.z;}
  const X=RX(fx),Z=RZ(fz),k=gm.camSnap?1:1-Math.exp(-dt*5);gm.camSnap=false;let tx,ty,tz,tp,yw;
  if(R.ang===1){tx=-31;ty=8.5;tz=Z;tp=0.2;yw=Math.PI/2;}else if(R.ang===2){tx=X*0.6;ty=30;tz=Z-15;tp=1.0;yw=0;}else if(R.ang===3){tx=X*0.7;ty=8.5;tz=Z+14;tp=0.3;yw=Math.PI;}else{tx=X*0.7;ty=10.5;tz=Z-15.5;tp=0.36;yw=0;}
  if(gm.camSnap!==false||Math.abs((cam.yaw||0)-yw)>0.01){cam.yaw=yw;cam.x=tx;cam.y=ty;cam.z=tz;cam.pitch=tp;return;}
  cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;cam.z+=(tz-cam.z)*k;cam.pitch+=(tp-cam.pitch)*k;}
// ----- practice drills -----
const DRILLS={pass:['Passing','Six throws against a live defense. Complete passes to score.',6],def:['Defense','Six snaps on defense. Give up as few yards as you can.',6],kick:['Kicking','Five field goals from longer and longer distances.',5],ret:['Returns','Three kickoff returns. Average starting spot counts.',3]};
function startDrill(kind){const opp=pick(S.teams.filter(t=>t.id!==S.user));startGame(opp,true,'H','A',{drill:{kind,n:0,reps:DRILLS[kind][2],score:0,yds:0,log:[]}});}
function drillNext(){const D=gm.drill;gm.after=null;gm.flag=null;gm.cele=null;if(D.n>=D.reps)return drillEnd();
  if(D.kind==='pass')startDrive('U',30);else if(D.kind==='def')startDrive('A',30);
  else if(D.kind==='kick'){const dist=[30,38,44,49,54][D.n]||45;gm.wx={sky:'clear',wind:rint(0,14),wdir:Math.random()<0.5?-1:1};gm.poss='U';gm.pos=100-(dist-17);gm.down=4;gm.toGo=10;gm.phase='huddle';tryFG(false);}
  else kickoff('A');}
function drillAfter(){const D=gm.drill,r=gm.lastRes||{};gm.lastRes=null;let line='';
  if(D.kind==='pass'){if(r.caught){D.score++;D.yds+=Math.max(0,r.gain||0);line='Complete, '+(r.gain||0)+' yards';}else line=r.int?'Intercepted':'Incomplete';}
  else if(D.kind==='def'){const y=r.td?25:Math.max(0,r.gain||0);D.yds+=y;line=r.td?'Touchdown allowed':y+' yards allowed';}
  else if(D.kind==='kick'){if(r.good)D.score++;line=r.good?'Good':'No good';}
  else{const s=r.td?100:r.spot||20;D.yds+=s;line=r.td?'Return touchdown!':'Returned to the '+s;}
  D.log.push(line);D.n++;drillNext();}
function drillEnd(){const D=gm.drill,k=D.kind;let tp=0,sum='';
  if(k==='pass'){sum=D.score+' of '+D.reps+' complete, '+D.yds+' yards';tp=D.score>=5?2:D.score>=3?1:0;}
  else if(k==='def'){sum=D.yds+' yards allowed in '+D.reps+' snaps';tp=D.yds<=15?2:D.yds<=35?1:0;}
  else if(k==='kick'){sum=D.score+' of '+D.reps+' field goals';tp=D.score>=4?2:D.score>=3?1:0;}
  else{const avg=Math.round(D.yds/D.reps);sum='Average start at the '+(avg>=100?'end zone':avg+'-yard line');tp=avg>=32?2:avg>=26?1:0;}
  const got=tp?drillReward(k,tp):0,lines=[sum,...D.log.map((l,i)=>'Rep '+(i+1)+': '+l),tp?(got?'+'+got+' training point'+(got>1?'s':''):'You already earned this drill\'s points this week.'):'Not enough for training points this time.'];
  showCard(DRILLS[k][0]+' drill complete',lines,'Back to team',finishDrill);}
function finishDrill(){hush();gm=null;crowdStop();FLIP=false;cam.yaw=0;hideGame();render();}
// ----- downs, scoring, clock -----
function tick(sec){if(gm.q===5||gm.drill)return;gm.clock-=sec;if(gm.clock<=0){gm.clock=0;gm.exp=true;}}
function addScore(side,pts){if(side==='U')gm.us+=pts;else gm.them+=pts;}
function endPlay(kind,z,note){if(gm.phase!=='live')return;const uo=uoff(),other=uo?'A':'U',c=gm.carrier;
  if(gm.ko){gm.phase='dead';gm.deadT=0;let txt;
    if(gm.onside){const kt=gm.onsideRec,z0=clamp(Math.round(z),1,99),RT=gm.poss==='U'?gm.U:gm.O;gm.onside=false;gm.onsideRec=null;
      if(kt){const KT=kt==='U'?gm.U:gm.O;gm.after={change:true,to:kt,next:100-z0};txt='Onside kick recovered by '+KT.name+'!';say([[0,'They got it! '+KT.name+' recover the onside kick!',2]]);cheer((kt==='U')===gm.userHome?1:0.15);recMark(txt,4);}
      else{gm.after={change:true,to:gm.poss,next:z0};txt='Onside kick recovered by '+RT.name;say([[0,RT.name+' fall on it. The onside kick fails.']]);}
      gm.tkBy=null;gm.msg=txt;flash(txt);renderPanel();return;}
    if(kind==='td'){gm.lastRes={ko:1,td:1};recMark('Kick return touchdown',5);recCred(c,7,'Kick return touchdown');addScore(gm.poss,6);txt=uo?'Kick return touchdown!':'Kick return touchdown '+gm.O.name;gm.after={td:true};for(const e of gm.ents)if(e.side==='O'&&!e.down&&e!==c)e.anim='cele';if(uo&&!gm.pro)gm.cele={e:c,picked:false};else{c.anim='c'+rint(1,3);c.animT=gm.now;}}
    else{const s=gm.tbk?30:clamp(Math.round(z),1,99);txt=gm.tbk?'Touchback':'Returned to the '+(s<=50?s:100-s)+'-yard line'+(gm.injNote?' · '+gm.injNote.n+' is hurt':'');gm.after={change:true,to:gm.poss,next:s};gm.lastRes={ko:1,spot:s};if(s>=45){recMark('Big kick return',3);recCred(c,3,'Big kick return');}if(c)say([[0,pick([c.rp.n+' brings the kickoff out to the '+(s<=50?s:100-s)+'.',c.rp.n+' with the return, and he\'s brought down at the '+(s<=50?s:100-s)+'.'])]]);}
    gm.tkBy=null;gm.msg=txt;flash(txt);injSay();renderPanel();return;}
  if(gm.conv){gm.phase='dead';gm.deadT=0;gm.throwing=null;const ok=kind==='td';if(ok){addScore(gm.poss,2);for(const e of gm.ents)if(e.side==='O'&&!e.down)e.anim='cele';}
    gm.conv=false;gm.tkBy=null;gm.after={ko:gm.poss};gm.msg=ok?'Two-point try is good':'Two-point try fails';flash(gm.msg);renderPanel();return;}
  if(kind==='pick6'){gm.phase='dead';gm.deadT=0;gm.throwing=null;const d=gm.intBy||c,by=gm.by,st=gm.st,ry=gm.ret?Math.round(gm.ret.z0):0;gm.ret=null;gm.run=false;
    const fr=gm.fumRet;if(!fr){if(uo)st.int++;else st.dInt++;PS(by.QB).pint++;if(d)PS(d).int++;}else{if(uo)st.fl=(st.fl||0)+1;else st.dfr=(st.dfr||0)+1;}if(d)PS(d).td++;gm.fumRet=false;zoneOut(by.QB);zoneUp(d,1);addScore(other,6);gm.poss=other;gm.after={td:true};gm.tkBy=null;gm.lastRes={int:1,td:1};
    for(const e of gm.ents)if(e.side==='D'&&!e.down&&e!==d)e.anim='cele';if(d){if(d.team==='U'&&(!gm.pro||d.rp.id===gm.pro.id))gm.cele={e:d,picked:false};else{d.anim='c'+rint(1,3);d.animT=gm.now;}}
    const DT=d&&d.team==='U'?gm.U:gm.O;gm.msg=(fr?'Scoop and score! ':'Pick six! ')+DT.name+' score';flash(gm.msg);recMark(gm.msg,6);recCred(d,7+ry/12,(fr?'Scoop and score, ':'Pick six, ')+ry+' yards');cheer((d&&d.team==='U')===gm.userHome?1:0.15);
    say([[0,'He\'s got blockers! He\'s going all the way!',2],[0,'Touchdown, '+DT.name+'! '+(fr?'Scoop and score!':'It\'s a pick six!'),2],[1,(d?d.rp.n+' takes it '+ry+' yards the other way. ':'')+scoreLine()+'.']]);renderPanel();return;}
  if(kind==='int'){gm.retYds=gm.ret?Math.max(0,Math.round(gm.ret.z0-z)):0;gm.ret=null;}
  const foul=rollFoul(kind,z),ub=!!foul&&(gm.two||(foul.pen.off?!uo:uo));if(foul&&!ub&&foul.want)return applyPenalty(foul.pen,foul.who);
  const snap0=ub?{pos:gm.pos,down:gm.down,toGo:gm.toGo,bx:gm.bx,us:gm.us,them:gm.them,clock:gm.clock,exp:gm.exp,st:Object.assign({},gm.st),zone:JSON.parse(JSON.stringify(gm.zone)),ps:JSON.parse(JSON.stringify(gm.ps))}:null;
  gm.phase='dead';gm.deadT=0;gm.throwing=null;
  const los=gm.pos,st=gm.st,passed=gm.thrownAt!=null,by=gm.by,tk=gm.tkBy;
  let txt='',after={},run=18,cg=0,cfd=false;
  if(kind==='inc'){txt=note;gm.down++;run=5;}
  else if(kind==='int'&&gm.fumRet){const NT=(other==='U'?gm.U:gm.O).name;txt=(gm.two?'Fumble recovered by '+NT:uo?'Fumble! '+NT+' recover':'Fumble! Your ball')+(gm.retYds>=5?' · '+gm.retYds+'-yard return':'');gm.fumRet=false;if(uo)st.fl=(st.fl||0)+1;else st.dfr=(st.dfr||0)+1;after={change:true,to:other,next:z>=100?20:clamp(Math.round(100-z),1,99)};recMark(txt,4);}
  else if(kind==='int'){txt=(gm.xfNote||'')+(gm.two?'Intercepted by '+(other==='U'?gm.U:gm.O).name:uo?'Intercepted!':'Interception! Your ball')+(gm.retYds>=5?' · '+gm.retYds+'-yard return':'');gm.xfNote='';if(uo)st.int++;else st.dInt++;after={change:true,to:other,next:z>=100?20:clamp(Math.round(100-z),1,99)};run=6;zoneOut(by.QB);zoneUp(gm.intBy,1);PS(by.QB).pint++;if(gm.intBy)PS(gm.intBy).int++;recMark(txt,4);recCred(gm.intBy,5,'Interception'+(gm.retYds>=5?', '+gm.retYds+'-yard return':''));}
  else{const td=kind==='td'||(kind==='fumrec'&&z>=100),zr=td?100:Math.min(99,Math.round(z)),gain=zr-los;cg=gain;
    if(kind==='sack'){if(tk){PS(tk).sk++;PS(tk).tk++;}}else if(kind!=='fumrec'){if(passed&&gm.caught&&c){PS(by.QB).py+=gain;PS(c).recy+=gain;if(td){PS(by.QB).ptd++;PS(c).td++;}}else if(c){const s=PS(c);s.car++;s.ry+=gain;if(td)s.td++;}if(tk)PS(tk).tk++;}
    if(uo){if(kind==='sack')st.sk++;else if(passed)st.yds+=gain;else st.rush+=gain;if(td&&passed)st.td++;}
    else{if(kind==='sack')st.dSk++;st.dYds+=gain;}
    if(kind==='sack')recCred(tk,3.5,'Sack, '+(-gain)+'-yard loss');
    else if(kind!=='fumrec'&&passed&&gm.caught&&c){if(gain>=8||td)recCred(c,gain/7+(td?3.5:0),(td?'Touchdown catch, ':'Catch for ')+gain+(td?' yards':' yards'));if(gain>=15||td)recCred(by.QB,gain/10+(td?3:0),(td?'Touchdown pass, ':'Completion for ')+gain+' yards');}
    else if(kind!=='fumrec'&&c){if(gain>=7||td)recCred(c,gain/6+(td?3.5:0),(td?'Touchdown run, ':'Run for ')+gain+' yards');if(tk&&gain<=0)recCred(tk,2,'Tackle for a loss');}
    if(kind==='sack'){zoneOut(by.QB);zoneUp(tk,1);}
    else{if(gm.caught){zoneUp(by.QB,2);zoneUp(c,2);}else if(c&&c.rp.pos==='RB'){if(gain>=4)zoneUp(c,2);else if(gain<=-2)zoneOut(c);}
      if(tk)zoneUp(tk,tk.rp.pos==='DL'?(gain<=0?1:3):2);}
    if(td||gain>=20)for(const e of gm.ents)if(e.side==='D')zoneOut(e);
    if(td){addScore(gm.poss,6);txt=(kind==='fumrec'?'Fumble recovered in the end zone! ':'')+(gm.two?'Touchdown '+(uo?gm.U:gm.O).name:uo?'Touchdown!':'Touchdown '+gm.O.name);after={td:true};run=6;recMark(txt,5);
      for(const e of gm.ents)if(e.side==='O'&&!e.down&&e!==c)e.anim='cele';
      if(c){if(uo&&(!gm.pro||c.rp.id===gm.pro.id))gm.cele={e:c,picked:false};else{c.anim='c'+rint(1,3);c.animT=gm.now;}}}
    else if(zr<=0){addScore(other,2);txt='Safety';after={ko:gm.poss};}
    else{gm.pos=zr;if(c)gm.bx=clamp(c.x,-3.1,3.1);
      if(gain>=gm.toGo){gm.down=1;gm.toGo=Math.min(10,100-zr);cfd=true;txt=(gain>=0?'+':'')+gain+' yards · First down';}
      else{gm.down++;gm.toGo-=gain;txt=kind==='sack'?'Sacked · '+gain+' yards':gain===0?'No gain':(gain>0?'+':'')+gain+' yard'+(Math.abs(gain)===1?'':'s');}
      if(gm.bigHit)txt='Big hit! '+txt;if(kind==='fumrec')txt='Fumble, recovered by the offense · '+txt;else if(gain>=20)recMark(txt,2+gain/20);else if(kind==='sack'&&!uo)recMark('Sack! '+txt,2);
      if(kind==='oob')run=6;}}
  if(gm.injNote)txt+=' · '+gm.injNote.n+' is hurt';
  callIt(kind,cg,cfd,c,tk,passed,note);injSay();gm.bigHit=false;
  if(foul){const FT=foul.pen.off?(uo?gm.U:gm.O):(uo?gm.O:gm.U),w=foul.who;gm.flag={x:clamp((w?w.x:gm.bx)+rnd(-1.5,1.5),-25,25),z:(foul.pen.spot||(w?w.z:los))+rnd(-1,1),t:gm.now};
    if(ub){gm.pend={pen:foul.pen,who:w,snap:snap0};txt+=' · Flag on '+FT.name;}else txt+=' · '+foul.pen.n+' on '+FT.name+', declined';}
  if(!after.td&&!after.ko&&!after.change&&gm.down>4){after={change:true,to:other,next:clamp(100-gm.pos,1,99)};txt+=uo?' · Turnover on downs':' · Stopped on downs';}
  gm.run=(kind==='tackle'||kind==='sack')&&!after.td&&!after.ko&&!after.change;gm.tkBy=null;tick(Math.min(8,gm.t)+(gm.run?(hurryOn()?2:7):0));if(gm.exp)gm.run=false;
  gm.lastRes={kind,gain:cg,caught:gm.caught&&kind!=='int'&&kind!=='inc',td:!!after.td,int:kind==='int'};gm.after=after;gm.msg=txt;flash(txt);renderPanel();}
function ydName(pos){return pos<50?'your own '+pos:pos===50?'midfield':'the '+gm.O.name+' '+(100-pos);}
function showCard(title,lines,btn,fn){gm.phase='card';gm.card={title,lines,btn,fn};renderPanel();}
function cardGo(){if(!gm||!gm.card)return;const fn=gm.card.fn;gm.card=null;fn();}
function nextQuarter(){if(!gm.exp)return false;if(gm.q===2){halftime();return true;}if(gm.q===4){endReg();return true;}gm.q++;gm.clock=gm.QL;gm.exp=false;say([[0,'That\'s the end of the '+ORD[gm.q-2]+' quarter. '+scoreLine()+'.']],true);return false;}
function give(side,pos){gm.ko=false;if(side==='A'&&!gm.playDef)return oppDrive(pos);startDrive(side,pos);}
function proceed(a){if(nextQuarter())return;if(a.ko)return kickoff(a.ko);if(a.change)return give(a.to,a.next);setHuddle();}
function afterPlay(){if(gm.pend){gm.phase='flag';renderPanel();return;}if(gm.drill){recFinish();return drillAfter();}const a=gm.after||{};gm.after=null;gm.flag=null;
  if(gm.q===5){if(a.td||a.fg||a.ko)return finalCard();if(a.change)return give(a.to,a.next);return setHuddle();}
  if(a.td)return startPat(gm.poss);
  proceed(a);}
// ----- halftime: the player of the half and his best plays -----
function perfScore(s){const g=k=>s[k]||0;return g('py')/25+g('ptd')*4-g('pint')*3+g('ry')/10+g('recy')/10+g('rec')*0.5+g('td')*6+g('tk')+g('sk')*3+g('int')*5+g('pd')*1.5+g('fr')*3-(g('fum')||0)*2;}
function topPlayers(){const out={U:null,A:null};for(const id in gm.ps){const s=gm.ps[id],v=perfScore(s),t=s.team==='U'?'U':'A';if(v>=3&&(!out[t]||v>out[t].v))out[t]={id:+id,s,v};}return out;}
function featOf(x){if(!x)return null;const T=x.s.team==='U'?gm.U:gm.O,rp=T.roster.find(p=>p.id===x.id)||{num:'',n:x.s.n,pos:x.s.pos};
  const clips=(gm.pclips||[]).filter(r=>r.cred&&r.cred[x.id]).sort((a,b)=>b.cred[x.id].s-a.cred[x.id].s).slice(0,3).sort((a,b)=>a.frames[0].t-b.frames[0].t);
  return {id:x.id,n:x.s.n,num:rp.num,pos:x.s.pos,team:T,line:proLine(x.s,x.s.pos),clips,v:x.v};}
function featCard(F,k){const el=document.getElementById('intro'),r=F.clips[k],c=r&&r.cred[F.id];
  el.innerHTML='<p class="eyebrow">Player of the half</p><h2>'+esc(F.n)+'</h2><p class="sub">#'+F.num+' · '+F.pos+' · '+esc(F.team.name)+'</p><p class="x">'+esc(F.line)+'</p>'+(c?'<p class="x"><b>Play '+(k+1)+' of '+F.clips.length+':</b> '+esc(c.t)+'</p>':'');
  el.hidden=false;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function featShow(){const F=gm&&gm.card&&gm.card.feat;if(!F||!F.clips.length||gm.phase!=='card')return;startReplay(F.clips,F);
  say([[0,'Our player of the half: '+F.n+'. Let\'s take a look.'],[1,pick(['He\'s been everywhere in this one.','He\'s the reason this game looks the way it does.','You have to account for him on every snap.','What a first half he\'s had.'])]],false,true);}
function halftime(){recFinish();gm.q=3;gm.clock=gm.QL;gm.exp=false;gm.run=false;gm.to={U:3,A:3};const tp=topPlayers(),best=tp.U&&tp.A?(tp.U.v>=tp.A.v?tp.U:tp.A):tp.U||tp.A,F=featOf(best),other=best===tp.U?tp.A:tp.U;
  {const st=gm.st;say([[0,'And that\'ll take us to halftime. '+scoreLine()+'.'],[1,F?F.n+' has been the story so far: '+F.line+'.':gm.LU.QB.n+' is '+st.cmp+' of '+st.att+' for '+Math.round(st.yds)+' yards at the break.']],true);}
  const L=[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them];if(F)L.push('Player of the half: '+F.n+' (#'+F.num+', '+F.pos+', '+F.team.name+'). '+F.line+'.');if(other){const o=featOf(other);L.push('Top for '+o.team.name+': '+o.n+' ('+o.pos+'). '+o.line+'.');}
  L.push(gm.recv1==='U'?'You kick off to start the second half.':'You receive the second-half kickoff.');
  showCard('Halftime',L,'Start second half',()=>kickoff(gm.recv1==='U'?'U':'A'));gm.card.feat=F;renderPanel();if(F&&F.clips.length)setTimeout(()=>{if(gm&&gm.card&&gm.card.feat===F&&gm.phase==='card'&&!window.__auto)featShow();},1200);}
function endReg(){if(gm.us===gm.them){gm.q=5;gm.exp=false;gm.run=false;gm.to={U:2,A:2};showCard('Overtime',['Tied at '+gm.us+'. Sudden death: the first team to score wins.','A coin toss decides who gets the ball first.'],'To the coin toss',()=>startToss(true));}else finalCard();}
function finalCard(){recFinish();if(gm.two)return finalTwo();if(gm.pro)return proFinal();if(gm.quick){say([[0,'And that\'s the ball game! '+scoreLine()+'.',1]],true);showCard(gm.us>gm.them?'You win':gm.us<gm.them?'You lose':'It\'s a tie',[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,'Quick game: it doesn\'t count toward a season.'],'Back to menu',finishTwo);gm.card.final=true;renderPanel();return;}const st=gm.st,lines=[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,
  gm.LU.QB.n+': '+st.cmp+' of '+st.att+', '+Math.round(st.yds)+' yards, '+st.td+' TD, '+st.int+' INT','Rushing: '+Math.round(st.rush)+' yards · Sacks taken: '+st.sk];
  const inj=gm.injLog.filter(x=>x.team==='U');if(inj.length)lines.push('Injured: '+inj.map(x=>x.n+' ('+x.pos+', out '+x.wk+(x.wk===1?' week':' weeks')+')').join(', '));
  if(gm.playDef)lines.push('Defense: '+Math.round(st.dYds)+' yards allowed · '+st.dSk+' sacks · '+st.dInt+' interceptions');
  say([[0,'And that\'s the ball game! Your final: '+scoreLine()+'.',1],[1,gm.us>gm.them?gm.U.name+' earned that one.':gm.O.name+' were the better team today.']],true);
  showCard(gm.us>gm.them?'You win':'You lose',lines,'Back to team',finishGame);gm.card.final=true;renderPanel();}
function finalTwo(){const w=gm.us===gm.them?null:gm.us>gm.them?gm.U:gm.O;say([[0,'And that\'s the ball game! '+scoreLine()+'.',1]],true);
  showCard(w?w.name+' win':'It\'s a tie',[gm.U.name+' (Player 1) '+gm.us+', '+gm.O.name+' (Player 2) '+gm.them],'Back to menu',finishTwo);gm.card.final=true;renderPanel();}
function finishTwo(){hush();document.getElementById('cap').hidden=true;document.getElementById('intro').hidden=true;gm=null;crowdStop();FLIP=false;cam.yaw=0;hideGame();render();}
function finishRoad(){const us=gm.us,them=gm.them,pr=gm.proRes;hush();document.getElementById('cap').hidden=true;document.getElementById('intro').hidden=true;gm=null;crowdStop();FLIP=false;hideGame();
  if(pr)proApply(pr);roadResult(us,them,pr?pr.s:null);render();}
function finishGame(){if(gm.road)return finishRoad();const us=gm.us,them=gm.them,pr=gm.proRes;for(const x of gm.injLog)if(x.team==='U')S.news.unshift('Injury: '+x.n+' ('+x.pos+') is out '+x.wk+(x.wk===1?' week.':' weeks.'));
  for(const id in gm.ps){const q=gm.ps[id];if(q.team!=='U')continue;const s=S.pst[id]||(S.pst[id]={n:q.n,pos:q.pos});s.n=q.n;for(const k of ['att','cmp','py','ptd','pint','car','ry','rec','recy','td','tk','sk','int','pd','fr'])s[k]=(s[k]||0)+(q[k]||0);}
  hush();document.getElementById('cap').hidden=true;document.getElementById('intro').hidden=true;gm=null;crowdStop();FLIP=false;hideGame();if(pr&&isPro())proApply(pr);finishUserGame(us,them);render();}
// The other team's fourth-down choice when you are playing defense.
function aiFourth(){if(gm.down!==4)return false;const d=fgDist(),O=gm.O,sp=gm.pos;
  if(d<=53){aiKick(false);return true;}
  if(gm.toGo<=2&&sp>=50)return false;
  if(gm.playDef&&gm.toGo<=6&&Math.random()<0.04){gm.aiFake=PB.find(p=>p.n==='Fake Punt');return false;}
  const net=rint(36,50),land=sp+net,s=land>=100?20:clamp(100-land,3,60);tick(8);
  showCard(O.name+' punt',[net+'-yard punt. You start at '+ydName(s)+'.'],'Continue',()=>proceed({change:true,to:'U',next:s}));return true;}
// Simulated drive, used when "play defense" is turned off.
function oppDrive(s){const O=gm.O,diff=ratings(O).off-ratings(gm.U).def,lines=[];let next=25;s=clamp(s,1,99);gm.poss='A';
  if(gm.q!==5&&gm.clock<18){gm.clock=0;gm.exp=true;lines.push(O.name+' run out the clock.');}
  else{let pTD=clamp(0.27+diff*0.011+(s-25)*0.006+0.04*dk(),0.06,0.8)*(gm.pro?0.85:1);const pFG=clamp(0.14+(s-25)*0.004,0.08,0.3),pTO=clamp(0.13-diff*0.003,0.05,0.22);
    const plays=rint(3,11);let time=plays*rint(7,11);if(gm.q!==5&&time>gm.clock+10){time=gm.clock;pTD*=0.6;}
    const x=Math.random();
    if(x<pTD){const pat=Math.random()<0.95;gm.them+=pat?7:6;lines.push(O.name+' drive '+(100-s)+' yards in '+plays+' plays. Touchdown'+(pat?'.':', but the extra point is no good.'));next=-1;}
    else if(x<pTD+pFG){gm.them+=3;lines.push(O.name+' move into range and hit a '+rint(24,49)+'-yard field goal.');next=-1;}
    else if(x<pTD+pFG+pTO){const y=clamp(s+rint(2,35),5,95),who=pick([...gm.LU.DL,...gm.LU.LB,...gm.LU.CB,...gm.LU.S]);next=100-y;lines.push('Turnover! '+who.n+' ('+who.pos+') takes the ball away.');}
    else{const y=clamp(s+rint(3,30),10,70),land=y+rint(36,50);next=land>=100?20:clamp(100-land,5,45);lines.push(O.name+' go '+(y-s)+' yards and punt.');}
    tick(time);}
  const over=gm.exp&&(gm.q===4||gm.q===2),otWin=gm.q===5&&next<0;
  if(!over&&!otWin)lines.push(next<0?'They kick off to you.':'You take over at '+ydName(next)+'.');
  showCard(O.name+' possession',lines,otWin?'See final score':'Continue',()=>otWin?finalCard():proceed(next<0?{ko:'A'}:{change:true,to:'U',next}));}
function punt(){if(!gm||gm.phase!=='huddle'||!(uoff()||gm.two))return;const net=rint(36,50)+Math.round((gm.wx.wind||0)*(Math.random()-0.5)*0.4),land=gm.pos+net,s=land>=100?20:clamp(100-land,3,60),other=gm.poss==='U'?'A':'U',OT=other==='U'?gm.U:gm.O;tick(8);
  showCard('Punt',[net+'-yard punt. '+OT.name+' start at their own '+s+'.'],'Continue',()=>proceed({change:true,to:other,next:s}));}
function simRest(){if(!gm||gm.drill||(gm.card&&gm.card.final))return;const f=gm.q>=5?0:((4-gm.q)*gm.QL+gm.clock)/(4*gm.QL),r=simGame(gm.U,gm.O);
  const sc=x=>{const v=x*f,td=Math.floor(v/7);return td*7+(v-td*7>=3.5?3:0);};gm.us+=sc(r[0]);gm.them+=sc(r[1]);
  if(gm.us===gm.them){if(Math.random()<0.5)gm.us+=3;else gm.them+=3;}gm.q=4;gm.clock=0;gm.exp=false;gm.kick=null;gm.kanim=null;gm.pend=null;gm.intro=null;document.getElementById('intro').hidden=true;cam.y=10.5;cam.pitch=0.36;finalCard();}

// ----- body motion -----
function updPose(e,dt){const p=e.pose,sp=Math.hypot(e.vx,e.vz),t=gm.t,now=gm.now,ph=gm.phase;
  const T={lean:0.05,lTh:0.05,rTh:0.05,lKn:0.1,rKn:0.1,lArm:0.1,rArm:0.1,lEl:0.25,rEl:0.25,fall:0,hop:0,spread:0.12,roll:0};
  const pre=ph==='presnap'||ph==='huddle'||ph==='kick'||ph==='card'||ph==='pat'||(ph==='kanim'&&!gm.kanim.launched);
  const fwd=e.vx*Math.sin(e.dir)+e.vz*Math.cos(e.dir);
  if(sp>0.6&&!e.down){e.ph+=sp*dt*1.75*(e.lk?e.lk.gait:1);const a=Math.min(1,sp/6.5),s=Math.sin(e.ph),c=Math.cos(e.ph);
    if(fwd<-0.8){T.lTh=s*0.45*a-0.1;T.rTh=-s*0.45*a-0.1;T.lKn=a*(0.35+0.4*Math.max(0,c));T.rKn=a*(0.35+0.4*Math.max(0,-c));T.lArm=-s*0.35;T.rArm=s*0.35;T.lEl=T.rEl=1.1;T.lean=0.12;}
    else{T.lTh=s*(0.6+0.45*a)+0.18*a;T.rTh=-s*(0.6+0.45*a)+0.18*a;T.lKn=a*(0.2+1.35*Math.max(0,c+0.25));T.rKn=a*(0.2+1.35*Math.max(0,-c+0.25));
      T.lArm=-s*(0.5+0.5*a);T.rArm=s*(0.5+0.5*a);T.lEl=T.rEl=0.5+1.05*a;T.lean=0.08+0.26*a;T.hop=Math.abs(c)*0.07*a;}
    let av=e.dir-e.pdir;while(av>Math.PI)av-=2*Math.PI;while(av<-Math.PI)av+=2*Math.PI;T.roll=clamp(-av/Math.max(dt,0.004)*sp*0.004,-0.28,0.28);}
  else if(pre){if(e.stance==='s3'){T.lean=0.95;T.lTh=T.rTh=0.8;T.lKn=T.rKn=1.35;T.rArm=1.15;T.rEl=0;T.lArm=0.5;T.lEl=1.0;}
    else if(e.stance==='s2'){T.lean=0.32;T.lTh=T.rTh=0.38;T.lKn=T.rKn=0.62;T.lArm=T.rArm=0.25;T.lEl=T.rEl=0.9;}
    else{T.lean=0.12;T.lTh=T.rTh=0.15;T.lKn=T.rKn=0.28;T.lArm=T.rArm=0.7;T.lEl=T.rEl=1.25;}}
  if(sp<=0.6&&!pre&&!e.down&&e.lk){const b=Math.sin(now*1.7+e.lk.bp);T.lean+=0.035*b;T.lArm+=0.05*b;T.rArm+=0.05*b;if(e.lk.hips&&ph==='dead'&&(!e.anim||e.anim==='idle')){T.lArm=T.rArm=0.25;T.lEl=T.rEl=1.9;T.spread=0.6;}}
  e.pdir=e.dir;if(e.stumble>t&&!e.down)T.lean=0.7;if(e.spin>t&&!e.down){T.lArm=1.3;T.lEl=0.5;T.lean=0.3;T.spread=0.35;}
  const an=e.anim,u=now-e.animT;
  if(an==='block'){T.lean=0.28;T.lArm=T.rArm=1.5;T.lEl=T.rEl=0.25;if(sp<=0.6){T.lTh=T.rTh=0.35;T.lKn=T.rKn=0.6;}}
  else if(an==='throw'){const v=(t-e.animT)/0.36;if(v>1.4)e.anim='idle';else{const w=Math.min(1,v/0.55),f=clamp((v-0.55)/0.45,0,1);T.rArm=v<0.55?1.2+2.5*w:3.7-2.7*f;T.rEl=v<0.55?1.4:0.2;T.lArm=0.9;T.lEl=0.8;T.lean=0.1;}}
  else if(an==='catch'){T.lArm=T.rArm=2.3;T.lEl=T.rEl=0.35;}
  else if(an==='carry'){T.rArm=0.55;T.rEl=1.9;}
  else if(an==='hold'){T.lean=0.55;T.lTh=1.5;T.lKn=1.6;T.rTh=0.2;T.rKn=1.7;T.lArm=T.rArm=1.0;T.lEl=T.rEl=0.3;}
  else if(an==='kickleg'){const v=u/0.5;if(v<0.84)T.rTh=-0.7;else if(v<1.5){T.rTh=1.6;T.rKn=0.05;T.lean=-0.12;T.lArm=1.2;T.hop=0.06;}else e.anim='idle';}
  else if(an==='down'){const q=e.spl||[2.2,2.2,0.2,0.2,0.3,0.1];T.fall=e.fallAmt;T.roll=e.rollT*1.35;T.lArm=q[0];T.rArm=q[1];T.lEl=q[2];T.rEl=q[3];T.lTh=q[4]*0.5;T.rTh=q[5]*0.3;T.lKn=q[4];T.rKn=q[5];T.lean=0;}
  else if(an==='dive'){T.fall=e.down?(e.fallAmt||0.92):0.92;T.roll=e.down?e.rollT:0;T.lArm=T.rArm=2.2;T.lEl=T.rEl=0.1;T.lean=0;T.lTh=T.rTh=0.1;T.lKn=T.rKn=0.15;}
  else if(an==='jump'){const w=Math.max(0,Math.sin(now*6.8));T.hop=w*0.6;T.lArm=T.rArm=2.5+w*0.5;T.lEl=T.rEl=0.35;T.lTh=T.rTh=0.4*(1-w);T.lKn=T.rKn=0.9*(1-w);T.spread=0.22;T.lean=0.1*(1-w);}
  else if(an==='hype'){const w=Math.sin(now*10+e.ph);T.lArm=T.rArm=1.3+w*0.7;T.lEl=T.rEl=1.6;T.lean=0.25;T.lTh=T.rTh=0.4;T.lKn=T.rKn=0.7;T.hop=Math.abs(w)*0.05;}
  else if(an==='wave'){T.rArm=2.9;T.rEl=0.25+0.35*Math.sin(now*9+e.ph);T.spread=0.25;}
  else if(an==='clap'){const w=Math.sin(now*14+e.ph);T.lArm=T.rArm=1.45;T.lEl=T.rEl=1.1;T.spread=0.04+0.24*Math.max(0,w);}
  else if(an==='cele'){T.lArm=T.rArm=3.0;T.lEl=T.rEl=0.1;T.lean=-0.05;T.hop=Math.abs(Math.sin(now*9+e.ph))*0.4;T.spread=0.3;}
  else if(an==='c0'){if(u<0.5){T.rArm=3.1;T.rEl=0.1;T.lean=-0.15;}else if(u<0.9){T.rArm=0.5;T.rEl=0;T.lean=0.55;}else{T.lArm=T.rArm=1.5;T.lEl=T.rEl=2.2;T.spread=1.0;T.lean=-0.12;T.hop=Math.abs(Math.sin(now*7))*0.12;}}
  else if(an==='c1'){const w=Math.sin(now*8);T.lArm=1.9+w*0.9;T.rArm=1.9-w*0.9;T.lEl=T.rEl=0.9;T.spread=0.5;T.lean=0.1*Math.sin(now*4);T.hop=Math.abs(w)*0.18;T.lTh=0.25*w;T.rTh=-0.25*w;T.lKn=T.rKn=0.4;e.dir+=dt*3.2;}
  else if(an==='c2'){T.lArm=T.rArm=1.5;T.lEl=T.rEl=2.3;T.spread=1.05;T.lean=-0.16;T.lTh=T.rTh=0.3;T.lKn=T.rKn=0.5;T.hop=Math.abs(Math.sin(now*5))*0.08;}
  else if(an==='c3'){T.rArm=3.1;T.rEl=0;T.lArm=0.3;T.lean=-0.2;T.lTh=0.9;T.lKn=1.5;T.rKn=1.2;T.rTh=-0.1;}
  if(an==='dive'&&!e.down&&e.stun<=t&&!e.lunge)e.anim='idle';
  const k=1-Math.exp(-dt*18),kf=1-Math.exp(-dt*10);
  for(const key in T){if(key==='fall')p.fall+=(T.fall-p.fall)*kf;else if(key==='roll')p.roll+=(T.roll-p.roll)*kf;else if(key==='hop')p.hop=T.hop;else p[key]+=(T[key]-p[key])*k;}
  if(e.down)return;
  if(e.spin>t){e.dir+=dt*15;return;}
  let want=e.dir;if(e.face)want=Math.atan2(e.face.x-e.x,e.face.z-e.z);else if(sp>1)want=Math.atan2(e.vx,e.vz);
  let dd=want-e.dir;while(dd>Math.PI)dd-=2*Math.PI;while(dd<-Math.PI)dd+=2*Math.PI;e.dir+=dd*(1-Math.exp(-dt*12));}
function updCam(dt){if(gm.phase==='intro')return;cam.yaw=0;const uo=uoff()||gm.two;let fx=gm.bx,fz=uo?gm.pos-5:gm.pos+5,back=uo?15.5:19;const b=gm.ball,c=gm.ctl,ph=gm.phase;
  if(ph==='intro')return;if(ph==='pat'){gm.camSnap=false;return;}
  let yT=10.5,pT=0.36;if((ph==='huddle'||ph==='presnap')&&!gm.ko){yT=12;pT=0.39;back+=1.5;fx*=0.6;if(uo)fz+=2.5;}
  if(ph==='kick'||ph==='kanim'){fx=gm.bx;fz=gm.kz+2;back=15;}
  else if(gm.ko){const r=gm.by.RET,car=gm.carrier;if(uo){fx=r.x;fz=r.z;back=14;}else{fx=c?c.x:0;fz=Math.max(c&&!c.down?c.z:0,car?car.z:0,ph==='presnap'?66:0)-3;back=15;}}
  else if(ph==='live'||ph==='dead'){
    if(b&&b.fly&&b.land){fx=uo?b.x:b.land.x;fz=uo?Math.max(gm.by.QB?gm.by.QB.z:b.z,b.z-4):b.land.z;back=uo?15.5:17;}
    else if(!uo&&!gm.two&&gm.mode==='pocket'&&ph==='live'&&c){fx=c.x*0.6;fz=(c.z+gm.pos+5)/2;}
    else if(b&&b.loose){fx=b.x;fz=b.z;back=15;}
    else if(b&&b.held){fx=b.held.x;fz=b.held.z;if(!uo)back=16;}else if(gm.cele){fx=gm.cele.e.x;fz=gm.cele.e.z;back=11;}else if(gm.focus){fx=gm.focus.x;fz=gm.focus.z;}}
  const k=gm.camSnap?1:1-Math.exp(-dt*4.5);gm.camSnap=false;cam.x+=(RX(fx)*0.7-cam.x)*k;cam.z+=(RZ(fz)-back-cam.z)*k;cam.y+=(yT-cam.y)*k;cam.pitch+=(pT-cam.pitch)*k;}

// ----- frame loop, HUD, input -----
function flash(t){const el=document.getElementById('flash');el.textContent=t;el.classList.add('on');flashT=1.9;}
function fmtClock(s){s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function whoTag(e,pre){const rp=e.rp,T=e.team==='U'?gm.U:gm.O;return sw(T)+' '+(pre||'')+'<b>#'+e.num+' '+esc(rp.n)+'</b> <span>'+rp.pos+' · '+rp.ovr+' OVR</span>'+(rp.xf?' <em class="xf'+(e.zone?'':' off')+'">X</em> <span>'+xfName(rp)+(e.zone?' is on':'')+'</span>':'');}
function updHud(){const g=gm;if(g.drill){const D=g.drill,s='<div class="mid"><b>'+DRILLS[D.kind][0]+' drill</b><span>Rep '+Math.min(D.n+1,D.reps)+' of '+D.reps+' · '+(D.kind==='pass'?D.score+' complete':D.kind==='def'?D.yds+' yards allowed':D.kind==='kick'?D.score+' made':'Average start '+(D.n?Math.round(D.yds/D.n):'-'))+'</span></div><button class="btn ghost sm" data-a="drillQuit">Quit drill</button>';if(s!==hudStr){hudStr=s;document.getElementById('bug').innerHTML=s;}}else updBug(g);updWho(g);}
function updBug(gm0){const g=gm0,A=g.userHome?g.O:g.U,Hm=g.home,as=g.userHome?g.them:g.us,hs=g.userHome?g.us:g.them,uo=g.poss==='U',PT=uo?g.U:g.O,DT=uo?g.O:g.U;
  const ord=['1st','2nd','3rd','4th'][Math.min(3,g.down-1)],goal=g.pos+g.toGo>=100;
  const spot=g.pos===50?'Midfield':(g.pos<50?PT.abbr+' '+g.pos:DT.abbr+' '+(100-g.pos)),dot='<em class="poss" title="Has the ball"></em>';
  const sit=g.ko?'Kickoff':g.conv?'Two-point try':(g.kanim||g.kick)?((g.kanim||g.kick).xp?'Extra point':(g.kanim||g.kick).dist+'-yard field goal'):g.phase==='pat'?'After the touchdown':ord+' &amp; '+(goal?'Goal':g.toGo)+' · '+spot;
  const tol=n=>'<span class="tol" title="Timeouts left">'+[0,1,2].map(i=>'<s'+(i<n?'':' class="off"')+'></s>').join('')+'</span>',tA=g.to?(A===g.U?g.to.U:g.to.A):0,tH=g.to?(Hm===g.U?g.to.U:g.to.A):0,pcOn=(g.phase==='huddle'||g.phase==='presnap')&&!g.ko&&!g.conv&&g.pc!=null,pcs=pcOn?Math.max(0,Math.ceil(g.pc)):0;
  const s=`<div class="tm">${sw(A)}<b>${A.abbr}</b>${tol(tA)}${PT===A?dot:''}<i>${as}</i></div><div class="mid"><b>${g.q>=5?'OT':'Q'+g.q+' '+fmtClock(g.clock)}${g.run&&g.q!==5&&pcOn?'<em class="run" title="Clock running"></em>':''}${pcOn?'<em class="pc'+(pcs<=10?' low':'')+'">:'+String(pcs).padStart(2,'0')+'</em>':''}</b><span>${sit}</span></div><div class="tm"><i>${hs}</i>${PT===Hm?dot:''}${tol(tH)}<b>${Hm.abbr}</b>${sw(Hm)}</div>${g.flag?'<span class="flagchip">Flag</span>':''}${g.phase==='replay'?'<span class="flagchip rp">Replay</span>':''}${wxChip(g)}${g.phase==='replay'?'':'<button class="btn ghost sm" data-a="simRest">Sim<span class="wide"> rest</span></button>'}`;
  if(s!==hudStr){hudStr=s;document.getElementById('bug').innerHTML=s;}}
function wxChip(g){const w=g.wx;if(!w||w.indoor||(w.sky==='clear'&&w.wind<10))return '';return '<span class="wxchip">'+(w.sky==='snow'?'Snow':w.sky==='rain'?'Rain':'Wind')+(w.wind>=6?' · '+w.wind+' mph':'')+'</span>';}
function updWho(g){if(g.pro){const pe=proEnt(),k=g.phase+'|'+(!!pe&&g.carrier===pe)+'|'+(!!pe&&g.ctl===pe)+'|'+!!g.ret+'|'+!!(g.ball&&g.ball.fly&&g.ball.target===pe);if(k!==g.pk){g.pk=k;if(g.phase==='live')renderPanel();}}
  // who has the ball
  let w='';const b=g.ball;
  if(g.phase==='live'||g.phase==='dead'){if(b&&b.loose)w='<b>Loose ball!</b> <span>Get to it</span>';else if(b&&b.fly&&b.lat&&b.target)w=whoTag(b.target,'Pitch to ');else if(b&&b.fly&&b.target&&!b.ko)w=whoTag(b.target,'Pass to ');else{const c=g.carrier||(b&&b.held);if(c&&c.rp)w=whoTag(c);}}
  const zl=[];for(const id in g.zone){const z=g.zone[id];if(z.on)zl.push(esc(z.n));}
  if(zl.length)w+=(w?'<br>':'')+'<span class="zl"><em class="xf">X</em> In the zone: '+zl.join(', ')+'</span>';
  if(g.pro&&g.ps[g.pro.id]&&g.phase!=='live')w+=(w?'<br>':'')+'<span class="zl"><b>You</b> · '+esc(proLine(g.ps[g.pro.id],g.pro.pos))+'</span>';
  if(w!==whoStr){whoStr=w;const el=document.getElementById('who');el.innerHTML=w;el.hidden=!w;}}
function frame(ts){if(!gm){rafOn=false;return;}const real=Math.min(0.05,(ts-lastTs)/1000||0.016);lastTs=ts;const dt=real*(SPEED_X[S.speed]||1);
  const n=Math.max(1,Math.ceil(dt/0.0167)),h=dt/n;
  if(gm.phase==='replay'){stepReplay(real);rpCam(real);updHud();renderGame();requestAnimationFrame(frame);return;}
  for(let i=0;i<n&&gm;i++){gm.now+=h;const ph=gm.phase;if(ph==='live'){if(gm.ko)stepKO(h);else stepLive(h);}else if(ph==='dead')stepDead(h);else if(ph==='kanim')stepKickAnim(h);if(!gm)break;for(const e of gm.ents)updPose(e,h);}
  if(!gm){rafOn=false;return;}
  {const p2=gm.phase;if(gm.rec&&(p2==='live'||p2==='kanim'||(p2==='dead'&&gm.deadT<1.4)))recFrame();}
  if(gm.kom){const k=gm.kom;k.t+=real;k.v=(1-Math.cos(k.t*2.9))/2;const mk=document.getElementById('kmk');if(mk)mk.style.left=(k.v*100)+'%';}
  if(gm.kick){const k=gm.kick;k.t+=real;k.m=Math.sin(k.t*(2.6+k.dist*0.035)-1.57);const mk=document.getElementById('kmk');if(mk)mk.style.left=((k.m+1)*50)+'%';}
  if(flashT>0){flashT-=real;if(flashT<=0)document.getElementById('flash').classList.remove('on');}
  if(capT>0){capT-=real;if(capT<=0)document.getElementById('cap').hidden=true;}
  if(gm.phase==='intro')stepIntro(real);if(!gm){rafOn=false;return;}crowdMood(real);clockStep(real);if(!gm){rafOn=false;return;}
  updCam(real);updHud();renderGame();requestAnimationFrame(frame);}
function fitCanvas(){if(!cv)return;const st=document.getElementById('stage');DPR=Math.min(2,window.devicePixelRatio||1);W=Math.max(2,Math.round(st.clientWidth*DPR));H=Math.max(2,Math.round(st.clientHeight*DPR));if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}}
function showGame(){document.getElementById('game').hidden=false;hudStr='';whoStr='x';fitCanvas();if(!rafOn){rafOn=true;lastTs=performance.now();requestAnimationFrame(frame);}}
function hideGame(){document.getElementById('game').hidden=true;}
function setKeys(){const k=inp.k;inp.kx=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0);inp.kz=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0);
  inp.p1x=(k.KeyD?1:0)-(k.KeyA?1:0);inp.p1z=(k.KeyW?1:0)-(k.KeyS?1:0);inp.p2x=(k.ArrowRight?1:0)-(k.ArrowLeft?1:0);inp.p2z=(k.ArrowUp?1:0)-(k.ArrowDown?1:0);}
function initInput(){cv=document.getElementById('cv');ctx=cv.getContext('2d');
  if(window.ResizeObserver)new ResizeObserver(fitCanvas).observe(document.getElementById('stage'));addEventListener('resize',fitCanvas);
  addEventListener('keydown',ev=>{if(!gm)return;const c=ev.code,ph=gm.phase,tg=ev.target;if(tg&&tg.tagName&&/INPUT|SELECT|TEXTAREA/.test(tg.tagName))return;
    if(c==='Space'||c==='Tab'||c.startsWith('Arrow')||(gm.two&&(c==='Enter'||c==='Slash'||c==='Quote'||c==='Semicolon')))ev.preventDefault();inp.k[c]=true;setKeys();if(ev.repeat)return;
    if(ph==='replay'){const R=gm.rp;if(c==='Space'){R.paused=!R.paused;renderPanel();}else if(c==='KeyC'){R.ang=(R.ang+1)%ANGLES.length;gm.camSnap=true;renderPanel();}else if(c==='KeyS'){R.spd=R.spd===1?0.35:1;renderPanel();}
      else if(c==='KeyR'){R.t=R.list[R.i].frames[0].t;}else if(c==='KeyN'&&R.i<R.list.length-1){R.i++;rpLoad();}else if(c==='Escape'||c==='Enter'||c==='KeyX')endReplay();return;}
    // In two-player games the right side of the keyboard belongs to player 2.
    let me='U',k=c;
    if(gm.two){const P2={Enter:'Space',NumpadEnter:'Space',Slash:'KeyE',ShiftRight:'KeyE',Period:'KeyQ',Semicolon:'KeyG',KeyP:'KeyT',Digit6:'Digit1',Digit7:'Digit2',Digit8:'Digit3',Digit9:'Digit4',Digit0:'Digit5',Numpad1:'Digit1',Numpad2:'Digit2',Numpad3:'Digit3',Numpad4:'Digit4',Numpad5:'Digit5'};
      if(P2[c]){me='A';k=P2[c];}else if(c==='KeyL'||c.startsWith('Arrow'))return;}
    const offTeam=gm.poss,defTeam=offTeam==='U'?'A':'U';
    if(k==='Space'){if(ph==='presnap'){if(!gm.two||gm.ko||offTeam===me)snap();}
      else if(ph==='live'){const cb=gm.carrier;if(cb&&cb.team===me)juke(me);else dive(me);}
      else if(ph==='kick'){if(!gm.two||gm.kick.side===me)kickNow();}else if(ph==='kometer'){if(!gm.two||gm.kom.kicker===me)koMeterHit();}else if(ph==='dead'){if(!gm.cele||gm.cele.picked)gm.deadT=9;}else if(ph==='card')cardGo();else if(ph==='intro')endIntro();
      else if(ph==='toss'&&gm.toss.step==='done')tossPick(false);else if(ph==='kochoice')kickoff('U',false);}
    else if(k==='KeyT'){if(ph==='huddle'||ph==='presnap')useTimeout(me);}
    else if((k==='KeyE'||k==='KeyF')&&ph==='live'&&gm.carrier&&gm.carrier.team===me)spin(me);
    else if(k==='KeyG'||(k==='KeyL'&&!gm.two)){if(ph==='live')userLateral(me);}
    else if(k==='KeyR'){if(ph==='dead'&&gm.rec&&gm.rec.frames.length>5)startReplay([gm.rec]);else if(ph==='huddle'&&gm.lastPlay&&(gm.two?gm.hs==='O'&&offTeam===me:uoff()))callPlay(gm.lastPlay);}
    else if(k==='KeyK'){if(!gm.two||offTeam===me)spike();}
    else if(k==='KeyH'){if((ph==='huddle'||ph==='presnap')&&(uoff()||gm.two))toggleHurry();}
    else if(k==='Tab'||k==='KeyQ'||k==='KeyE'){if(ph==='huddle'){const off=gm.two?gm.hs==='O':uoff();const ids=GROUPS.map(x=>x[0]).filter(x=>off||x==='S'||x==='Q');const i=ids.indexOf(gm.tab);setTab(ids[(i+(k==='KeyQ'?ids.length-1:1))%ids.length]);}else switchCtl(me);}
    else if(/^(Digit|Numpad)[1-9]$/.test(k)){const n=+k.slice(-1);
      if(ph==='huddle'){const L=listed();if(n<=L.length){if(gm.two){const who=gm.hs==='O'?offTeam:defTeam;if(who!==me)return;if(gm.hs==='O')callPlay(L[n-1]);else callDef(L[n-1]);}else if(uoff())callPlay(L[n-1]);else callDef(L[n-1]);}}
      else if(ph==='presnap'&&gm.aud&&(!gm.two||offTeam===me)){if(gm.aud==='list'){const p=gm.audList&&gm.audList[n-1];if(p)audible(p);}else if(gm.aud==='hot'){if(gm.audK==null){if(gm.elig.some(e=>e.key===n)||gm.hotPool&&gm.hotPool.some(e=>e.key===n)){gm.audK=n;renderPanel();}}else if(n<=HOT.length)hotRoute(gm.audK,n-1);}}
      else if(ph==='pat'){if(n<=2&&(!gm.two||gm.poss===me))patPick(n===2);}
      else if(ph==='flag'){if(n<=2)flagPick(n===1);}
      else if(ph==='kochoice'){if(n===1)kickoff('U',false);else if(n===2)kickoff('U',true);}
      else if(ph==='toss'){if(n<=2){if(gm.toss.step==='call')tossCall(n===1);else if(!gm.two||gm.toss.win===me)tossPick(n===1);}}
      else if(ph==='dead'&&gm.cele&&!gm.cele.picked){if(n<=CELES.length&&gm.cele.e.team===me)celebrate(n-1);}
      else if(ph==='live'&&!gm.ko&&(gm.two?offTeam===me:uoff()&&(!gm.pro||gm.pro.pos==='QB'))){const r=gm.elig.find(e=>e.key===n);if(r)throwTo(r);}}});
  addEventListener('keyup',ev=>{inp.k[ev.code]=false;setKeys();});
  addEventListener('blur',()=>{inp.k={};setKeys();});
  const startStick=ev=>{inp.stick={id:ev.pointerId,x:ev.clientX,y:ev.clientY};inp.sx=inp.sz=0;};
  const pt=ev=>{const r=cv.getBoundingClientRect();return [(ev.clientX-r.left)*DPR,(ev.clientY-r.top)*DPR];};
  cv.addEventListener('pointerdown',ev=>{if(!gm)return;ev.preventDefault();const p=pt(ev),ph=gm.phase;
    if(ph==='intro'){endIntro();return;}
    if(ph==='replay'){gm.rp.paused=!gm.rp.paused;renderPanel();return;}
    if(ph==='kometer'){koMeterHit();return;}
    if(ph==='presnap'){snap();return;}
    if(ph==='dead'){if(!gm.cele||gm.cele.picked)gm.deadT=9;return;}
    if(ph!=='live')return;
    if((uoff()||gm.two)&&gm.mode==='pocket'&&!gm.ko&&(!gm.pro||gm.pro.pos==='QB')){let best=null,bd=52*DPR;for(const e of gm.elig){if(e.sx==null)continue;const d=Math.hypot(e.sx-p[0],e.sy-p[1]);if(d<bd){bd=d;best=e;}}if(best){throwTo(best);return;}}
    if(ev.pointerType==='mouse'){const cb=gm.carrier;if(cb&&cb.team==='U'){if(gm.mode==='run')juke();}else dive();return;}
    startStick(ev);});
  addEventListener('pointermove',ev=>{const s=inp.stick;if(!s||s.id!==ev.pointerId)return;inp.sx=clamp((ev.clientX-s.x)/44,-1,1);inp.sz=clamp(-(ev.clientY-s.y)/44,-1,1);});
  const up=ev=>{if(inp.stick&&inp.stick.id===ev.pointerId){inp.stick=null;inp.sx=inp.sz=0;}};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);
  document.getElementById('panel').addEventListener('pointerdown',ev=>{if(!gm||gm.phase!=='live'||ev.pointerType==='mouse'||ev.target.closest('button'))return;ev.preventDefault();startStick(ev);});}

// ===== Be a Pro on the field =====
function proEnt(){if(!gm||!gm.pro)return null;for(const e of gm.ents)if(e.team==='U'&&e.rp.id===gm.pro.id)return e;return null;}
const PRO_ROLE={RB:'RB',WR:'WR1',TE:'TE'};
// Called when a huddle starts: the coach calls the play, or the drive is played out for you.
function proHuddle(){const P=gm.pro,uo=uoff();
  if(!uo){if(P.side==='D')return callDef(DCALLS.indexOf(gm.sugD[0]));return;}
  if(P.side==='D')return simDrive();
  if(P.pos==='QB')return;
  const d=fgDist(),behind=gm.us<gm.them,lead=gm.us-gm.them;
  if(canKneel()&&gm.q===4&&lead>0&&gm.clock<=(5-gm.down)*40-5){if(gm.run){gm.clock=Math.max(0,gm.clock-38);if(gm.clock<=0)gm.exp=true;}return kneel();}
  if(!gm.conv&&gm.q!==5&&(gm.q===2||(gm.q===4&&lead>=-3&&lead<=0))&&gm.clock<=12&&d<=54)return aiKick(false,'U');
  if(!gm.conv&&gm.down===4){const goal=gm.pos+gm.toGo>=100;
    if(gm.q===5){if(d<=52)return aiKick(false,'U');}
    else if(!((gm.toGo<=1&&gm.pos>=45)||(goal&&gm.toGo<=2)||(gm.q===4&&behind&&gm.clock<180&&(lead<-3||d>52)))){if(d<=52)return aiKick(false,'U');return punt();}}
  const sit=situation(),role=PRO_ROLE[P.pos];let pp=P.pos==='RB'?0.5:0.72;if(sit==='long'||sit==='hurry')pp=0.85;else if(sit==='short'||sit==='goal')pp-=0.15;
  const want=Math.random()<pp?'pass':'run',c=pickPlays(sit,10).filter(p=>p.g!=='T'&&!p.fake&&!p.sneak);
  let pool=c.filter(p=>p.t===want);if(!pool.length)pool=c.length?c:PB.filter(p=>p.t===want&&p.g!=='T'&&!p.fake);
  if(want==='pass'){const mine=pool.filter(p=>p.r&&p.r[role]);if(mine.length&&Math.random()<0.8)pool=mine;}
  callPlay(pool[0]);}
function proJob(g){const pe=proEnt(),pl=g.play;if(!pe)return '';
  if(!uoff()){const a=(DEF[g.defCall]||{})[pe.role];if(!a||a[0]==='r'||pe.role.startsWith('DL'))return 'Get after the quarterback. Beat your blocker, or stop the run at the line.';
    if(a[0]==='m')return 'Man coverage: stay with #'+(g.by[a[1]]?g.by[a[1]].num:'')+' wherever he goes.';if(a[0]==='d')return 'Play deep. Keep everything in front of you.';if(a[0]==='z')return 'Drop into your zone and break on the throw.';return 'Attack the line. Stop the run.';}
  if(pl.t==='run')return pe===g.by.RB?'You get the handoff. Follow the orange path, then make a move.':'Block for the runner. He follows the orange path.';
  if(pe.route)return pe===g.by.QB?'':'Your route is in gold. It runs itself, or steer with '+(coarse?'a drag':'WASD')+' to break free. Get open and the quarterback looks your way; after the catch, it\'s yours.';
  return pe===g.by.QB?'':'Stay in and block for the quarterback.';}
function proFinal(){const s=gm.ps[gm.pro.id]||{},win=gm.us>gm.them,goals=(S.pro.goals||[]).map(g=>({t:g.t,ok:goalMet(g,s)})),met=goals.filter(g=>g.ok).length,xp=Math.round(proXP(s,gm.pro.pos,win,met)*(gm.road?0.75:1));
  gm.proRes={s,xp,met,goals,res:(win?'Won ':gm.us===gm.them?'Tied ':'Lost ')+gm.us+'-'+gm.them};
  say([[0,'And that\'s the ball game! '+scoreLine()+'.',1],[1,win?gm.U.name+' get the win.':gm.O.name+' were the better team today.']],true);
  showCard(win?'You win':gm.us<gm.them?'You lose':'It\'s a tie',[gm.U.name+' '+gm.us+', '+gm.O.name+' '+gm.them,'Your game: '+proLine(s,gm.pro.pos),...goals.map(g=>(g.ok?'✓ ':'✗ ')+g.t),'+'+xp+' XP'+(win?' (including the win bonus)':'')],'Back to your career',finishGame);gm.card.final=true;renderPanel();}
