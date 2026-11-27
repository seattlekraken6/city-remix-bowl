'use strict';
// ===== helpers =====
const rnd=(a,b)=>a+Math.random()*(b-a);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function gauss(){let u=0;for(let i=0;i<6;i++)u+=Math.random();return (u-3)/0.7071;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// ===== league data: real cities and colors, no logos =====
const TEAM_DEFS=[
['BUF','Buffalo','#00338D','#C60C30','A','East'],['MIA','Miami','#008E97','#FC4C02','A','East'],
['NE','New England','#002244','#C60C30','A','East'],['NYJ','New York J','#125740','#FFFFFF','A','East'],
['BAL','Baltimore','#241773','#9E7C0C','A','North'],['CIN','Cincinnati','#FB4F14','#000000','A','North'],
['CLE','Cleveland','#311D00','#FF3C00','A','North'],['PIT','Pittsburgh','#101820','#FFB612','A','North'],
['HOU','Houston','#03202F','#A71930','A','South'],['IND','Indianapolis','#002C5F','#A2AAAD','A','South'],
['JAX','Jacksonville','#006778','#D7A22A','A','South'],['TEN','Tennessee','#0C2340','#4B92DB','A','South'],
['DEN','Denver','#FB4F14','#002244','A','West'],['KC','Kansas City','#E31837','#FFB81C','A','West'],
['LV','Las Vegas','#000000','#A5ACAF','A','West'],['LAC','Los Angeles C','#0080C6','#FFC20E','A','West'],
['DAL','Dallas','#003594','#869397','N','East'],['NYG','New York G','#0B2265','#A71930','N','East'],
['PHI','Philadelphia','#004C54','#A5ACAF','N','East'],['WAS','Washington','#5A1414','#FFB612','N','East'],
['CHI','Chicago','#0B162A','#C83803','N','North'],['DET','Detroit','#0076B6','#B0B7BC','N','North'],
['GB','Green Bay','#203731','#FFB612','N','North'],['MIN','Minnesota','#4F2683','#FFC62F','N','North'],
['ATL','Atlanta','#A71930','#000000','N','South'],['CAR','Carolina','#0085CA','#101820','N','South'],
['NO','New Orleans','#101820','#D3BC8D','N','South'],['TB','Tampa Bay','#D50A0A','#34302B','N','South'],
['ARI','Arizona','#97233F','#FFB612','N','West'],['LAR','Los Angeles R','#003594','#FFD100','N','West'],
['SF','San Francisco','#AA0000','#B3995D','N','West'],['SEA','Seattle','#002244','#69BE28','N','West']];
const CONF={A:'American',N:'National'},DIVS=['East','North','South','West'];
const FIRST=['James','Marcus','Tyler','Devin','Jalen','Caleb','Andre','Isaiah','Malik','Trevor','Darius','Cole','Xavier','Jordan','Elijah','Micah','Derrick','Brandon','Chris','Aaron','Nate','Kyle','Jamal','Terrence','Grant','Logan','Mason','Hunter','Dante','Corey','Zach','Tre','Omar','Luis','Mateo','Diego','Kai','Noah','Ethan','Owen','Jaylen','Deshawn','Rashad','Quincy','Miles','Jonah','Silas','Reggie','Tavon','Bryce','Colton','Wyatt','Emeka','Kofi','Sione','Tevita','Keanu','Javier','Rico','Dominic','Theo','Amari','Ezra','Roman','Desmond','Lamar','Cedric','Marquez','Antwan','Gavin','Brody','Landon','Rashard','Tyrell','Isaac','Dillon','Kendall','Jaden','Myles','Darnell','Keon','Trey','Shane','Garrett','Damon','Elias','Jace','Vincent','Tobias','Levi','Andre','Khalil','Zion','Malachi','Kobe','Cam','Brett','Darian','Nico','Ty'];
const LAST=['Brooks','Hayes','Bennett','Coleman','Foster','Griffin','Harper','Jennings','Keller','Lawson','Mercer','Nolan','Owens','Pierce','Quinn','Reeves','Sutton','Tate','Underwood','Vaughn','Abbott','Barnes','Castillo','Dawson','Ellis','Holloway','Ingram','Knox','Monroe','Nash','Osei','Paige','Rhodes','Salazar','Thorne','Upton','Vega','Whitaker','Yates','Zamora','Ashford','Blackwood','Calloway','Delgado','Easton','Fontaine','Gallagher','Hendrix','Irving','Jacobsen','Kimball','Langford','Maddox','Navarro','Okafor','Radford','Stanton','Tolliver','Usher','Valdez','Winslow','Yarbrough','Adeyemi','Boateng','Cortez','Dunmore','Everett','Garza','Hollis','Iverson','Jarrett','Kane','Lockhart','Mosley','Nwosu','Ortega','Pruitt','Rollins','Sandoval','Tuilagi','Fonoti','Mahoe','Kealoha','Whitlock','Bellamy','Marchetti','Lindqvist','Achebe','Duvall','Sterling','Ambrose','Bridgewater','Carrow','Dempsey','Eldridge','Faircloth','Gaines','Halstead','Kirkland','Lomax','McCray','Norwood','Oakes','Prescott','Ridley','Shelton','Truitt','Varner','Wexford','Ainsworth','Banks','Crenshaw','Dorsey','Embry','Fulton','Gentry','Hardaway','Kinsley','Lyle','Merriweather','Northcutt','Pembrook','Royster','Satterfield','Tillman','Wadley','Akins','Battle','Cashwell','Darby','Ferrell','Greer','Hightower','Jessup','Kitchens','Ledbetter','Manigault','Oduya','Petty','Renfro','Strickland','Tubbs','Vick','Womack'];
const POS_ORDER=['QB','RB','WR','TE','OL','DL','LB','CB','S','K'];
const ROSTER_N={QB:2,RB:2,WR:4,TE:2,OL:6,DL:5,LB:4,CB:3,S:3,K:1};
const START_N={QB:1,RB:1,WR:3,TE:1,OL:5,DL:4,LB:3,CB:2,S:2,K:1};
const POS_SPD={QB:66,RB:86,WR:88,TE:77,OL:54,DL:66,LB:76,CB:88,S:85,K:55};
const POS_VAL={QB:1.7,RB:0.85,WR:1.05,TE:0.8,OL:0.9,DL:1.0,LB:0.85,CB:1.0,S:0.85,K:0.3};
const NUM_R={QB:[[1,19]],RB:[[20,39]],WR:[[80,89],[10,19]],TE:[[80,89]],OL:[[60,79]],DL:[[90,99],[50,59]],LB:[[40,59]],CB:[[20,39]],S:[[20,49]],K:[[1,9]]};
const TRADE_DEADLINE=9,ROSTER_MAX=38,ROUNDS=3,XF_OVR=95;
const DIFFS=['Rookie','Pro','All-Pro','Legend','Hall of Fame'];
const SPEEDS=['Normal','Fast','Turbo'],SPEED_X=[1,1.25,1.5];
const UNI_NAMES={H:'Home',A:'Away',X:'Alternate',R:'Rivalry'};
// Potential tiers: how fast a young player improves each offseason.
const DEV={F:'Franchise',E:'Elite',S:'Star',N:'Normal'},DEV_GROW={N:1,S:2,E:3,F:4};
// X-Factor abilities. Linemen and kickers are always on; everyone else has to get "in the zone" during a game.
// Three X-Factors per position. A player holds one; the key is stored on the player (p.xf).
const XFS={QB:[['gun','Gunslinger','Bullet passes that stay accurate under pressure.'],['dime','Dime Dropper','Deep balls land right on target, and his receivers win the contested catch.'],['escape','Escape Artist','Slips the first sack attempt and is faster on the move.']],
  RB:[['wreck','Wrecking Ball','Breaks the first tackle on every carry and runs faster.'],['ankle','Ankle Breaker','His jukes and spins almost always work, and they recharge twice as fast.'],['break','Breakaway','Hits another gear once he gets past the line. Nobody catches him from behind.']],
  WR:[['hands','Sure Hands','Catches anything he can reach and cannot be intercepted.'],['deep','Deep Threat','Faster on his routes and gets extra separation from his defender.'],['yac','YAC Machine','Breaks the first tackle after the catch and bursts upfield.']],
  TE:[['mismatch','Mismatch','Catches anything he can reach and breaks the first tackle.'],['wall','Road Block','His blocks hold far longer.'],['seam','Seam Stretcher','Faster on his routes and wins almost every contested catch.']],
  OL:[['anchor','Anchor','Cannot be beaten for the first 3.5 seconds of a pass.'],['grader','Road Grader','On running plays his blocks hold twice as long.'],['mauler','Mauler','Every block he makes lasts longer.']],
  DL:[['unstop','Unstoppable','Beats any block within a second.'],['speed','Speed Rusher','Explodes off the snap and closes faster than anyone.'],['strip','Strip Sack','His sacks and tackles knock the ball loose far more often.']],
  LB:[['enforcer','Enforcer','His tackles are never broken.'],['lurker','Lurker','Jumps throws in front of him and intercepts far more.'],['blitz','Blitz Master','Faster to the ball and sheds blocks quickly.']],
  CB:[['lock','Lockdown','Blankets his receiver.'],['pick','Pick Artist','Turns contested throws into interceptions.'],['press','Press Man','Jams his receiver at the line and is faster in coverage.']],
  S:[['hawk','Ball Hawk','Breaks on every throw and intercepts far more.'],['hammer','Hammer','Big hits break up passes and jar the ball loose.'],['closer','Closer','Faster in pursuit, and his tackles are never broken.']],
  K:[['clutch','Clutch','A much wider field goal target.'],['leg','Big Leg','Long field goals get much easier.'],['ice','Ice Veins','A huge target in the fourth quarter and overtime.']]};
const XFON={QB:'Turns on after 2 completions.',RB:'Turns on after 2 runs of 4+ yards.',WR:'Turns on after 2 catches.',TE:'Turns on after 2 catches.',OL:'Always on.',DL:'Turns on after a sack or tackle for loss.',LB:'Turns on after 2 tackles.',CB:'Turns on after a pass breakup, an interception or 2 tackles.',S:'Turns on after a breakup, an interception or 2 tackles.',K:'Always on.'};
const xfKey=p=>!p||!p.xf||!XFS[p.pos]?null:typeof p.xf==='string'?p.xf:XFS[p.pos][0][0];
const xfInfo=p=>{const k=xfKey(p);return k?XFS[p.pos].find(x=>x[0]===k)||XFS[p.pos][0]:null;};
const xfName=p=>{const x=xfInfo(p);return x?x[1]:'';},xfDesc=p=>{const x=xfInfo(p);return x?x[2]+' '+XFON[p.pos]:'';};
const xfRand=pos=>pick(XFS[pos])[0];

// Each home stadium: roof (O open, C open with canopies, D dome, T translucent roof), seat color, landmark, capacity in thousands, and what makes it itself.
const STAD={
BUF:['C','#1f4fa8','none',62,'A brand-new open-air bowl with a canopy built to hold the noise in and keep the lake wind out.'],
MIA:['C','#0f8f98','palm',65,'A white canopy shades the home crowd while the Florida sun bakes the visiting sideline.'],
NE:['O','#16305e','light',65,'A lighthouse stands over the open north end.'],
NYJ:['O','#6b7178','none',82,'The biggest building in the league: four decks of gray seats that take on the colors of whoever is home.'],
NYG:['O','#6b7178','none',82,'The biggest building in the league: four decks of gray seats that take on the colors of whoever is home.'],
BAL:['O','#3b2a8c','sky',71,'Purple seats, a loud brass band, and the downtown skyline beyond the open corners.'],
CIN:['O','#33363b','water',65,'An open-cornered bowl on the riverfront.'],
CLE:['O','#c2410c','water',67,'Right on the lakefront, where the wind off the water is part of the defense.'],
PIT:['O','#e0ae1c','water',68,'Gold seats and an open south end that looks out over the rivers.'],
HOU:['D','#a8223a','none',72,'The first retractable roof in the league, usually shut against the heat.'],
IND:['D','#1f4f9c','win',67,'A brick fieldhouse with a huge window framing downtown.'],
JAX:['O','#0f8a96','palm',68,'Teal seats, giant video boards, and swimming pools in the north end.'],
TEN:['O','#2f6fb5','water',69,'An open bowl on the east bank of the river, facing downtown.'],
DEN:['O','#d9571c','mtn',76,'A mile above sea level, with the Rockies beyond the upper deck.'],
KC:['O','#cf1c35','none',76,'A sea of red, and the loudest outdoor crowd ever measured.'],
LV:['D','#1b1d20','torch',65,'A black dome just off the Strip, with a giant torch in the end zone.'],
LAC:['T','#1c4fa8','board',70,'A translucent roof, open sides, and a two-sided video board hanging over the whole field.'],
LAR:['T','#2456b8','board',70,'A translucent roof, open sides, and a two-sided video board hanging over the whole field.'],
DAL:['D','#1d3f8a','board',80,'A giant dome with a video board that stretches from one 20-yard line to the other.'],
PHI:['O','#0f5d57','sky',70,'Open corners, a skyline view, and the toughest crowd in the sport.'],
WAS:['O','#7a1f25','none',63,'A classic bowl in burgundy and gold.'],
CHI:['O','#1a2238','col',62,'Stone colonnades from 1924 rise behind a modern seating bowl by the lake.'],
DET:['D','#0a6fb0','none',65,'A downtown dome built into an old brick warehouse.'],
GB:['O','#27513d','none',81,'A plain bowl of metal benches in the smallest city in the league, and the coldest.'],
MIN:['T','#5b2f9a','win',67,'A sharp-angled glass roof and giant pivoting doors that open onto the skyline.'],
ATL:['D','#a71930','halo',71,'A pinwheel roof and a video board that runs in a full ring above the field.'],
CAR:['O','#1b8bd0','sky',74,'An open bowl uptown with bright blue seats.'],
NO:['D','#2a2620','none',73,'The original dome, and still one of the loudest rooms in sports.'],
TB:['O','#c0161b','ship',69,'A full-size pirate ship in the north end zone fires its cannons after every score.'],
ARI:['D','#a0263f','none',63,'A silver dome in the desert, with a grass field that rolls outside to grow in the sun.'],
SF:['O','#b3181c','none',68,'Red seats in the sun and a wall of suites down one side.'],
SEA:['C','#1d3a63','sky',69,'Twin roof arches trap the noise, and the open north end looks out at downtown.']};
const ROOF={O:'open air',C:'open air under a canopy',D:'indoors',T:'under a translucent roof'};
const stadName=T=>T.stadN||T.name.replace(/ [A-Z]$/,'')+' Stadium',uniOf=T=>T.uni||UNI[T.abbr];

let S=null,NID=1;
const dk=()=>S?[-0.6,0.6,1.4,2.2,3][S.diff]||0:0; // difficulty lean: Rookie, Pro, All-Pro, Legend, Hall of Fame

function numFor(pos,taken){const R=NUM_R[pos];for(let i=0;i<60;i++){const r=pick(R),n=rint(r[0],r[1]);if(!taken.has(n)){taken.add(n);return n;}}for(let n=1;n<100;n++)if(!taken.has(n)){taken.add(n);return n;}return 0;}
const spdFor=(pos,ovr)=>clamp(Math.round(POS_SPD[pos]+(ovr-76)*0.3+rnd(-3,3)),40,99);
function devFor(ovr,age,badge){if(badge===1)return 'F';if(badge===2)return 'E';if(ovr>=90)return 'E';if(ovr>=80||(age<=25&&ovr>=76))return 'S';return 'N';}
const potFor=p=>p.age<=25?clamp(p.ovr+(26-p.age)*DEV_GROW[p.dev]+rint(-1,1),p.ovr,99):p.ovr;
function mkPlayer(pos,ovr,age,taken,dev){ovr=clamp(Math.round(ovr),50,99);if(!dev){const r=Math.random();dev=r<0.04?'E':r<0.3?'S':'N';}
  const p={id:NID++,n:pick(FIRST)+' '+pick(LAST),pos,age,ovr,dev,pot:ovr,spd:spdFor(pos,ovr),num:taken?numFor(pos,taken):0,xf:false};p.pot=potFor(p);return p;}
function mkPicks(yr){return [...Array(32).keys()].flatMap(t=>[1,2,3].map(rd=>({id:S.pid++,yr,rd,orig:t,own:t})));}
const FA_BAG=POS_ORDER.flatMap(pos=>Array(ROSTER_N[pos]).fill(pos));
function genFA(n){const out=[];for(let i=0;i<n;i++){const pos=pick(FA_BAG);out.push(mkPlayer(pos,clamp(66+gauss()*5+(Math.random()<0.08?8:0),58,86),rint(23,33),null));}return out;}

// ----- player names: real or made up -----
// One choice for every mode, kept in the browser. Real-roster players carry both names (fn sound-alike, mn made up) so the switch can flip back and forth.
const NAMES_KEY='cityGridiron.names';
function namePref(){try{return localStorage.getItem(NAMES_KEY)==='real'?'real':'fake';}catch(e){return 'fake';}}
function nameChosen(){try{return !!localStorage.getItem(NAMES_KEY);}catch(e){return false;}}
function setNamePref(m){try{localStorage.setItem(NAMES_KEY,m==='real'?'real':'fake');}catch(e){}}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function fakeFor(full,used){for(let k=0;k<60;k++){const h=hashStr(full+'#'+k),n=FIRST[h%FIRST.length]+' '+LAST[(h>>>12)%LAST.length];if(!used.has(n)){used.add(n);return n;}}return pick(FIRST)+' '+pick(LAST);}
function allPlayers(){const a=[];if(!S)return a;for(const T of S.teams)a.push(...T.roster);if(S.fa)a.push(...S.fa);if(S.draft&&S.draft.pool)a.push(...S.draft.pool);return a;}
let REAL_IX=null;
function realIx(){if(REAL_IX)return REAL_IX;REAL_IX={};for(const t in REAL)REAL[t].forEach((r,i)=>{const k=r[0]+'|'+r[1];(REAL_IX[k]=REAL_IX[k]||[]).push([r[3],REALS[t][i]]);});return REAL_IX;}
// Older saves only have the short names ("Patty M"); find each one's full name once.
function ensureNames(){const ps=allPlayers(),used=new Set();
  if(S.nv!==2){const hx={};for(const t in REALH)REALH[t].forEach((h,i)=>hx[h]=REALS[t][i]);for(const p of ps)if(p.fn&&hx[hashStr(p.fn)])p.fn=hx[hashStr(p.fn)];S.nv=2;}
  for(const p of ps){if(p.fn===undefined){const c=realIx()[p.n+'|'+p.pos];p.fn=c?((c.find(x=>x[0]===p.num)||c[0])[1]):null;}}
  for(const p of ps){if(!p.fn)used.add(p.n);else if(p.mn)used.add(p.mn);}
  for(const p of ps)if(p.fn&&!p.mn)p.mn=fakeFor(p.fn,used);}
function applyNames(walk){if(!S)return;ensureNames();const real=namePref()==='real',ren={};
  for(const p of allPlayers())if(p.fn){const t=real?p.fn:p.mn;if(p.n!==t){ren[p.n]=t;p.n=t;}}
  const keys=Object.keys(ren).filter(k=>k.length>2);if(walk===false||!keys.length)return;
  const re=new RegExp("(?<![\\w'])("+keys.sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+")(?![\\w'])",'g');
  const fix=(o,d)=>{if(!o||typeof o!=='object'||d>9)return;for(const k in o){if(k==='fn'||k==='mn'||k==='n'&&o.fn)continue;const v=o[k];if(typeof v==='string'){if(v.length>2&&re.test(v)){re.lastIndex=0;o[k]=v.replace(re,m=>ren[m]||m);}re.lastIndex=0;}else if(v&&typeof v==='object')fix(v,d+1);}};
  fix(S,0);}
function newLeague(){NID=1;
  const teams=TEAM_DEFS.map((d,i)=>{const taken=new Set(),roster=[];
    REAL[d[0]].forEach((r,ri)=>{let num=r[3];if(taken.has(num))num=numFor(r[1],taken);else taken.add(num);
      const p={id:NID++,n:r[0],pos:r[1],age:r[5],ovr:r[2],dev:devFor(r[2],r[5],r[4]),pot:r[2],spd:spdFor(r[1],r[2]),num,xf:r[4]===1?XFS[r[1]][NID%3][0]:false,rk:r[5]<=22?2026:0};p.pot=potFor(p);p.leg=Math.round(Math.max(0,r[5]-22)*Math.max(0,r[2]-82)/6*10)/10;p.fn=REALS[d[0]][ri];roster.push(p);});
    for(const pos of POS_ORDER)while(roster.filter(p=>p.pos===pos).length<ROSTER_N[pos])roster.push(mkPlayer(pos,rnd(60,67),rint(22,25),taken));
    return {id:i,abbr:d[0],name:d[1],c1:d[2],c2:d[3],conf:d[4],div:d[5],roster,w:0,l:0,pf:0,pa:0};});
  S={v:6,nv:2,qlen:4,rec:{s:{},c:{}},hof:[],hist:[],drill:null,gpU:0,talk:2,pst:{},awards:null,season:2026,week:0,user:-1,teams,schedule:[],phase:'regular',po:null,picks:[],pid:1,news:[],offer:null,nid:NID,champ:null,last:'',diff:1,playDef:true,speed:1,koRet:true,tp:12,draft:null,myPicks:[],fa:[],rank:{}};
  S.picks=[...mkPicks(2027),...mkPicks(2028)];S.fa=genFA(60);applyNames(false);computeRanks(false);S.schedule=makeSchedule(S.season);return S;}
// Brings a save from the previous version up to date.
// v6: one of three X-Factors per position instead of a yes/no flag.
function fixXF(o,d){if(!o||typeof o!=='object'||d>6)return;if(Array.isArray(o)){for(const x of o)fixXF(x,d+1);return;}if(o.xf===true&&o.pos&&XFS[o.pos])o.xf=XFS[o.pos][(o.id||0)%3][0];for(const k in o)if(o[k]&&typeof o[k]==='object')fixXF(o[k],d+1);}
function migrate(){if(S.v<4)migrate4();if(S.v<5){S.qlen=S.qlen||4;S.rec=S.rec||{s:{},c:{}};S.hof=S.hof||[];S.hist=S.hist||[];S.gpU=S.gpU||0;
  for(const T of S.teams)for(const p of T.roster)if(p.leg==null)p.leg=Math.round(Math.max(0,p.age-(S.season-2026)-22)*Math.max(0,p.ovr-82)/6*10)/10;S.v=5;}
  if(S.v<6){fixXF(S,0);S.v=6;}}
function migrate4(){if(S.talk==null)S.talk=2;if(!S.pst)S.pst={};if(S.season===2026)for(const T of S.teams)for(const q of T.roster)if(q.rk==null&&q.age<=22)q.rk=2026;if(S.v>=3){S.v=4;return;}
  for(const T of S.teams)for(const p of T.roster)if(!p.dev){p.dev=devFor(p.ovr,p.age,p.xf?1:0);if(p.dev==='N'&&p.pot-p.ovr>=8)p.dev='S';}
  if(S.draft)for(const p of S.draft.pool)if(!p.dev)p.dev=p.pot-p.ovr>=11?'E':p.pot-p.ovr>=6?'S':'N';
  if(!S.fa)S.fa=genFA(60);if(S.speed==null)S.speed=1;if(S.koRet==null)S.koRet=true;if(!S.rank){S.rank={};computeRanks(false);}S.v=4;}

// ===== depth chart and ratings =====
function starters(T,pos){return T.roster.filter(p=>p.pos===pos).sort((a,b)=>(a.inj?1:0)-(b.inj?1:0)||(b.pro?1:0)-(a.pro?1:0)||b.ovr-a.ovr).slice(0,START_N[pos]);}
// A starter on a simulated team gets hurt for a few weeks.
function simInjury(T){const c=T.roster.filter(p=>p.pos!=='K'&&p.pos!=='P'&&!p.inj&&!p.pro&&isStarter(T,p));if(!c.length)return;const p=pick(c),wk=pick([1,1,1,2,2,3,4,6]);p.inj=wk;
  if(T.id===S.user)S.news.unshift('Injury: '+p.n+' ('+p.pos+') is out '+wk+(wk===1?' week.':' weeks.'));}
function isStarter(T,p){return starters(T,p.pos).includes(p);}
function ratings(T){const avg=pos=>{const a=starters(T,pos);return a.reduce((x,p)=>x+p.ovr+(p.xf?2:0)+(p.cap?1:0),0)/(a.length||1);};
  const off=(avg('QB')*3+avg('RB')+avg('WR')*2.5+avg('TE')*0.7+avg('OL')*2.8)/10;
  const def=(avg('DL')*3+avg('LB')*2.2+avg('CB')*2.6+avg('S')*2.2)/10;
  return {off:Math.round(off),def:Math.round(def),ovr:Math.round((off+def)/2)};}
function checkXF(T,p){if(!p.xf&&!p.pro&&p.ovr>=XF_OVR){p.xf=xfRand(p.pos);if(T.id===S.user)S.news.unshift(p.n+' ('+p.pos+') earned an X-Factor: '+xfName(p)+'.');}}

// ===== schedule: 17 games in 18 weeks. Each division rival twice, one bye per team. =====
const cmpTeams=(a,b)=>(b.w/((b.w+b.l)||1))-(a.w/((a.w+a.l)||1))||(b.pf-b.pa)-(a.pf-a.pa)||a.id-b.id;
function computeRanks(byRecord){for(const c of ['A','N'])for(const d of DIVS){const ts=S.teams.filter(t=>t.conf===c&&t.div===d);
  if(byRecord)ts.sort(cmpTeams);else ts.sort((a,b)=>ratings(b).ovr-ratings(a).ovr||a.id-b.id);ts.forEach((t,i)=>{S.rank[t.id]=i;});}}
function byeMatch(win,cap){const used=new Array(32).fill(false),cnt=win.map(()=>0),res=[];let iters=0;
  const opts=t=>{const o=[];win.forEach((r,ri)=>{if(cnt[ri]>=cap)return;const gme=r.g.find(x=>x.h===t||x.a===t);if(gme&&!used[gme.h]&&!used[gme.a])o.push([ri,gme]);});return o;};
  function rec(){if(++iters>2500)return false;let bo=null;for(let t=0;t<32;t++){if(used[t])continue;const o=opts(t);if(!o.length)return false;if(!bo||o.length<bo.length)bo=o;}
    if(!bo)return true;shuffle(bo);for(const [ri,gme] of bo){used[gme.h]=used[gme.a]=true;cnt[ri]++;res.push([ri,gme]);if(rec())return true;res.pop();cnt[ri]--;used[gme.h]=used[gme.a]=false;}return false;}
  return rec()?res:null;}
function makeSchedule(yr){const D={};for(const c of ['A','N'])DIVS.forEach((d,i)=>{D[c+i]=S.teams.filter(t=>t.conf===c&&t.div===d).sort((a,b)=>S.rank[a.id]-S.rank[b.id]).map(t=>t.id);});
  const g=(h,a)=>({h,a,hs:null,as:null}),R=[],RR=[[[0,1],[2,3]],[[0,2],[1,3]],[[0,3],[1,2]]],IP=RR[yr%3];
  // division rivals, home and away
  for(let leg=0;leg<2;leg++)for(const r of RR){const wk=[];for(const k in D){const T=D[k];for(const [i,j] of r)wk.push(leg?g(T[j],T[i]):g(T[i],T[j]));}R.push({div:1,g:wk});}
  // every team of one other division in the same conference
  for(let r=0;r<4;r++){const wk=[];for(const c of ['A','N'])for(const [x,y] of IP)for(let i=0;i<4;i++){const a=D[c+x][i],b=D[c+y][(i+r)%4];wk.push(((i%2)^(r<2?0:1))?g(a,b):g(b,a));}R.push({g:wk});}
  // every team of one division in the other conference
  for(let r=0;r<4;r++){const wk=[];for(let i=0;i<4;i++)for(let k=0;k<4;k++){const a=D['A'+i][k],b=D['N'+(i+yr)%4][(k+r)%4];wk.push(((k%2)^(r<2?0:1))?g(a,b):g(b,a));}R.push({g:wk});}
  // the teams that finished in the same place in the two remaining divisions of the conference
  for(let r=0;r<2;r++){const wk=[];for(const c of ['A','N'])for(let k=0;k<4;k++){const X=D[c+IP[0][0]][k],Y=D[c+IP[0][1]][k],Z=D[c+IP[1][0]][k],W=D[c+IP[1][1]][k];if(r===0)wk.push(g(X,Z),g(Y,W));else wk.push(g(W,X),g(Z,Y));}R.push({g:wk});}
  // a 17th game against a same-place team from the other conference
  {const wk=[];for(let i=0;i<4;i++)for(let k=0;k<4;k++){const a=D['A'+i][k],b=D['N'+(i+yr+2)%4][k];wk.push(yr%2?g(a,b):g(b,a));}R.push({g:wk});}
  const div=shuffle(R.filter(r=>r.div)),last=div.pop(),order=shuffle(div.concat(R.filter(r=>!r.div))).concat([last]);
  // byes: pull team-disjoint games out of weeks 5-13 and play them together in a makeup week
  const win=order.slice(4,13),M=byeMatch(win,3)||byeMatch(win,4)||byeMatch(win,6)||byeMatch(win,16);
  for(const [ri,gme] of M)win[ri].g.splice(win[ri].g.indexOf(gme),1);
  return [...order.slice(0,13),{g:M.map(x=>x[1])},...order.slice(13)].map(r=>r.g);}
function simGame(H,A){const rh=ratings(H),ra=ratings(A);
  const f=(o,d,hf)=>{const x=Math.max(0,21+(o-d)*0.6+hf+gauss()*8);const td=Math.floor(x/7);return td*7+Math.min(2,Math.round((x-td*7)/3))*3;};
  let hs=f(rh.off,ra.def,1.5),as=f(ra.off,rh.def,0);if(hs===as){if(Math.random()<0.5)hs+=3;else as+=3;}return [hs,as];}
function currentGames(){if(S.phase==='regular')return S.schedule[S.week]||[];if(S.phase==='playoffs')return S.po.games;return [];}
function userMatch(){return currentGames().find(g=>(g.h===S.user||g.a===S.user)&&g.hs==null)||null;}
function roundName(){if(!S.po)return '';const n=S.po.alive.A.length+S.po.alive.N.length;return n>=14?'Wild Card round':n>=8?'Divisional round':n>=4?'Conference finals':'Gridiron Bowl';}
// Playoff field: four division winners seeded 1-4 by record, then three wild cards seeded 5-7.
function seedsFor(c){const ts=S.teams.filter(t=>t.conf===c);const dw=DIVS.map(d=>ts.filter(t=>t.div===d).sort(cmpTeams)[0]).sort(cmpTeams);
  const rest=ts.filter(t=>!dw.includes(t)).sort(cmpTeams);return {div:dw,wc:rest.slice(0,3),hunt:rest.slice(3,6)};}
function startPlayoffs(){S.phase='playoffs';S.offer=null;const seeds={};computeRanks(true);
  for(const c of ['A','N']){const s=seedsFor(c);seeds[c]=[...s.div,...s.wc].map(t=>t.id);}
  S.po={seeds,alive:{A:seeds.A.slice(),N:seeds.N.slice()},games:[],log:[]};
  const U=S.teams[S.user],seed=seeds[U.conf].indexOf(S.user);
  S.news.unshift(seed>=0?'You made the playoffs as the '+CONF[U.conf]+' No. '+(seed+1)+' seed'+(seed<4?' (division winner).':' (wild card).'):'You missed the playoffs at '+U.w+'-'+U.l+'.');
  buildRound();}
function buildRound(){const po=S.po;po.games=[];const A=po.alive.A,N=po.alive.N;
  if(A.length===1&&N.length===1){po.games.push({h:A[0],a:N[0],hs:null,as:null,conf:'F'});return;}
  for(const c of ['A','N']){const L=po.alive[c],pool=L.length===7?L.slice(1):L.slice();
    for(let i=0;i<pool.length/2;i++)po.games.push({h:pool[i],a:pool[pool.length-1-i],hs:null,as:null,conf:c});}}
function finishRound(){const po=S.po,losers=po.games.map(g=>g.hs>g.as?g.a:g.h);
  po.log.push({name:roundName(),games:po.games.map(g=>({h:g.h,a:g.a,hs:g.hs,as:g.as}))});
  const fin=po.games.length===1&&po.games[0].conf==='F',g0=po.games[0];
  for(const c of ['A','N'])po.alive[c]=po.alive[c].filter(id=>!losers.includes(id));
  if(fin){S.champ=g0.hs>g0.as?g0.h:g0.a;S.phase='offseason';po.games=[];recordSeason();computeAwards();S.hist=S.hist||[];S.hist.unshift({y:S.season,champ:S.champ,ru:g0.hs>g0.as?g0.a:g0.h,sc:Math.max(g0.hs,g0.as)+'-'+Math.min(g0.hs,g0.as),mvp:S.awards&&S.awards.list[0]?S.awards.list[0].n+' ('+S.teams[S.awards.list[0].team].abbr+')':''});S.news.unshift(S.teams[S.champ].name+' win the '+S.season+' Gridiron Bowl.');}
  else buildRound();}
function completeStep(played){const games=currentGames(),reg=S.phase==='regular';
  for(const g of games)if(g.hs==null){const r=simGame(S.teams[g.h],S.teams[g.a]);g.hs=r[0];g.as=r[1];}
  for(const T of S.teams)for(const p of T.roster)if(p.inj){p.inj--;if(!p.inj){delete p.inj;if(T.id===S.user)S.news.unshift(p.n+' ('+p.pos+') is healthy again.');}}
  for(const g of games)for(const id of [g.h,g.a])if(!(id===S.user&&played)&&Math.random()<0.28)simInjury(S.teams[id]);
  const ug=games.find(g=>g.h===S.user||g.a===S.user);
  if(ug){const home=ug.h===S.user,us=home?ug.hs:ug.as,th=home?ug.as:ug.hs,opp=S.teams[home?ug.a:ug.h],won=us>th;
    const tp=(played?(won?5:3):(won?2:1))+(reg?0:2);if(S.mode!=='pro')S.tp+=tp;
    S.last=(reg?'Week '+(S.week+1):roundName())+': '+(won?'Won ':'Lost ')+us+'-'+th+(home?' vs ':' at ')+opp.name+(S.mode==='pro'?'':' (+'+tp+' training points)');S.news.unshift(S.last);}
  else if(reg)S.news.unshift('Week '+(S.week+1)+': bye week.');
  if(reg){
    for(const g of games){const H=S.teams[g.h],A=S.teams[g.a];H.pf+=g.hs;H.pa+=g.as;A.pf+=g.as;A.pa+=g.hs;if(g.hs>g.as){H.w++;A.l++;}else{A.w++;H.l++;}}
    S.week++;if(window.TNTBridge)TNTBridge.season(S.week,S.schedule.length);if(Math.random()<0.35)aiSignings(1,pick(S.teams));
    if(S.week>=S.schedule.length)startPlayoffs();else if(S.week<TRADE_DEADLINE)makeOffer();else{if(S.week===TRADE_DEADLINE)S.news.unshift('The trade deadline has passed. Trades reopen in the offseason.');S.offer=null;}}
  else finishRound();
  if(S.news.length>16)S.news.length=16;save();}
function finishUserGame(us,them){if(S.phase==='regular')S.gpU=(S.gpU||0)+1;const m=userMatch();if(m){const home=m.h===S.user;m.hs=home?us:them;m.as=home?them:us;}completeStep(true);}

// ===== end-of-season awards =====
function statLine(p,T){const o=Math.max(0,p.ovr-68),w=T.w,r=Math.round,f=x=>r(x).toLocaleString('en-US'),s=p.ss;
  if(s){if(p.pos==='QB')return f(s.py||0)+' yards, '+(s.ptd||0)+' touchdowns';if(p.pos==='RB')return f(s.ry||0)+' rushing yards, '+(s.td||0)+' touchdowns';if(p.pos==='WR'||p.pos==='TE')return (s.rec||0)+' catches, '+f(s.recy||0)+' yards'+(s.td?', '+s.td+' touchdowns':'');
    if(p.pos==='DL')return (s.sk||0)+' sacks, '+(s.tk||0)+' tackles';if(p.pos==='LB')return (s.tk||0)+' tackles, '+(s.sk||0)+' sacks';if(p.pos==='CB'||p.pos==='S')return (s.int||0)+' interceptions, '+(s.pd||0)+' passes defended';if(p.pos==='K')return (s.fgm||0)+' of '+(s.fga||0)+' field goals';}
  if(p.pos==='QB')return f(2700+o*58+w*40)+' yards, '+r(13+o*0.85+w*0.55)+' touchdowns';
  if(p.pos==='RB')return f(620+o*36+w*12)+' rushing yards, '+r(3+o*0.42)+' touchdowns';
  if(p.pos==='WR')return r(50+o*2.1)+' catches, '+f(560+o*37)+' yards, '+r(2+o*0.4)+' touchdowns';
  if(p.pos==='TE')return r(38+o*2)+' catches, '+f(380+o*30)+' yards';
  if(p.pos==='DL')return (3+o*0.52).toFixed(1)+' sacks, '+r(28+o*1.3)+' tackles';
  if(p.pos==='LB')return r(78+o*2.6)+' tackles, '+(1+o*0.18).toFixed(1)+' sacks';
  if(p.pos==='CB'||p.pos==='S')return r(1+o*0.2)+' interceptions, '+r(6+o*0.45)+' passes defended';
  if(p.pos==='K')return r(80+o*0.6)+'% on field goals';return 'anchored the line';}
function computeAwards(){const yr=S.season,all=[],rooks=[];
  for(const T of S.teams)for(const p of T.roster){const x={p,T,v:p.ovr+T.w*0.8+(p.xf?2:0)+rnd(-2,2)+(p.pro?proBonus():0)};if(isStarter(T,p))all.push(x);if(p.rk===yr)rooks.push(x);}
  const top=(arr,f,adj)=>arr.filter(f).map(x=>({p:x.p,T:x.T,s:x.v+(adj?adj(x):0)})).sort((a,b)=>b.s-a.s)[0];
  const off=x=>['QB','RB','WR','TE'].includes(x.p.pos),def=x=>['DL','LB','CB','S'].includes(x.p.pos);
  const mvp=top(all,off,x=>x.p.pos==='QB'?5+x.T.w*0.5:0);
  const pairs=[['Most Valuable Player','MVP',mvp],['Offensive Player of the Year','Offensive Player of the Year',top(all,x=>off(x)&&x.p.pos!=='QB'&&x.p!==mvp.p)],['Defensive Player of the Year','Defensive Player of the Year',top(all,def)],
    ['Offensive Rookie of the Year','Offensive Rookie of the Year',top(rooks,off)],['Defensive Rookie of the Year','Defensive Rookie of the Year',top(rooks,def)]];
  const list=[];for(const [t,short,w] of pairs){if(!w)continue;const p=w.p;list.push({t,n:p.n,pos:p.pos,team:w.T.id,line:statLine(p,w.T)});p.aw=(p.aw||[]).concat(yr+' '+short);
    if(w.T.id===S.user){if(S.mode==='pro'){if(p.pro)S.news.unshift('You won '+t+'!');}else{S.tp+=5;S.news.unshift(p.n+' won '+t+'! (+5 training points)');}}}
  const pro=[];for(const [pos,n] of [['QB',1],['RB',1],['WR',2],['TE',1],['OL',2],['DL',2],['LB',2],['CB',2],['S',1],['K',1]]){
    for(const x of all.filter(y=>y.p.pos===pos).sort((a,b)=>b.v-a.v).slice(0,n)){pro.push({pos,n:x.p.n,team:x.T.id});x.p.aw=(x.p.aw||[]).concat(yr+' All-Pro');if(x.T.id===S.user){if(S.mode==='pro'){if(x.p.pro)S.news.unshift('You were named All-Pro.');}else{S.tp+=2;S.news.unshift(x.p.n+' was named All-Pro. (+2 training points)');}}}}
  S.awards={yr,list,pro};}
// ===== weather for a home game: roof, season week and city decide it =====
const COLD=['BUF','NE','NYJ','NYG','CLE','PIT','CIN','BAL','CHI','GB','DEN','KC','PHI','WAS'],WINDY=['BUF','CHI','CLE','NE','NYJ','NYG','GB'];
function gameWeather(H){const st=H.stad||STAD[H.abbr]||['O'],late=S.phase==='playoffs'||S.week>=11,night=Math.random()<(S.phase==='playoffs'?0.45:0.3);
  if(st[0]==='D'||st[0]==='T')return {sky:'clear',wind:0,wdir:1,night,indoor:true};
  let sky='clear';const r=Math.random();
  if(COLD.includes(H.abbr)&&r<(late?0.3:S.week>=8?0.08:0))sky='snow';
  else if(Math.random()<(H.abbr==='SEA'?0.32:H.abbr==='MIA'||H.abbr==='TB'||H.abbr==='JAX'?0.16:0.11))sky='rain';
  const wind=Math.round(rint(0,9)+(WINDY.includes(H.abbr)?rint(0,10):0)+(sky!=='clear'?rint(0,5):0));
  return {sky,wind,wdir:Math.random()<0.5?-1:1,night,indoor:false};}
function weatherWords(w){if(w.indoor)return 'Indoors, so the weather won\'t matter';const s=w.sky==='snow'?'Snow is coming down':w.sky==='rain'?'It\'s raining':w.night?'A clear night':'Clear skies';return s+(w.wind>=12?', and the wind is gusting at '+w.wind+' miles an hour':w.wind>=6?', with a '+w.wind+' mile-an-hour wind':'');}
// ===== season stats, records and the Hall of Fame =====
const r1=x=>Math.round(x*10)/10,nn=x=>Math.max(0,Math.round(x));
// Season numbers for players in simulated games, scaled by rating, team record and role.
function modelStats(p,T,share){const o=Math.max(0,p.ovr-68),w=T.w,f=share*(isStarter(T,p)?1:0.12),g=()=>gauss();let s={};
  if(p.pos==='QB'){const att=520+o*3+g()*25;s={att:att,cmp:att*clamp(0.6+o*0.004+g()*0.015,0.5,0.75),py:2700+o*58+w*40+g()*250,ptd:13+o*0.85+w*0.55+g()*3,pint:clamp(15-o*0.3+g()*2.5,2,25),car:40+Math.random()*30,ry:150+o*4+g()*60};}
  else if(p.pos==='RB')s={car:180+o*6+g()*20,ry:620+o*36+w*12+g()*120,td:3+o*0.42+g()*2,rec:25+o*0.8,recy:200+o*7};
  else if(p.pos==='WR')s={rec:50+o*2.1+g()*8,recy:560+o*37+g()*120,td:2+o*0.4+g()*2};
  else if(p.pos==='TE')s={rec:38+o*2+g()*6,recy:380+o*30+g()*90,td:2+o*0.3+g()*1.5};
  else if(p.pos==='DL')s={tk:28+o*1.3+g()*5,sk:2+o*0.4+g()*1.5};
  else if(p.pos==='LB')s={tk:78+o*2.6+g()*10,sk:1+o*0.18+g(),int:clamp(o*0.08+g()*0.8,0,6)};
  else if(p.pos==='CB'||p.pos==='S')s={tk:45+o+g()*8,int:clamp(1+o*0.2+g()*1.2,0,12),pd:6+o*0.45+g()*2};
  else if(p.pos==='K'){const a=28+g()*4;s={fga:a,fgm:a*clamp(0.8+o*0.006+g()*0.03,0.6,0.98)};}
  const out={};for(const k in s){const v=s[k]*(p.pos==='K'?share:f);out[k]=k==='sk'?Math.max(0,r1(v)):nn(v);}return out;}
const STATK=['att','cmp','py','ptd','pint','car','ry','td','rec','recy','tk','sk','int','pd','fga','fgm','fum','fr'];
function seasonStats(T,p){const real=T.id===S.user?S.pst[p.id]:null,played=T.id===S.user?(S.gpU||0):0,share=clamp((17-played)/17,0,1),m=modelStats(p,T,share),out={};
  for(const k of STATK){const v=(m[k]||0)+(real&&real[k]?real[k]:0)+(k==='td'&&real?(real.ptd?0:0):0);if(v)out[k]=k==='sk'?r1(v):Math.round(v);}
  if(p.pos==='QB'&&real){out.td=out.td||0;}return out;}
const REC_KEYS=[['py','Passing yards','QB'],['ptd','Passing touchdowns','QB'],['ry','Rushing yards','RB'],['recy','Receiving yards',''],['rec','Catches',''],['sk','Sacks',''],['int','Interceptions',''],['tk','Tackles','']];
function careerOf(p){const c={};for(const h of p.hist||[])for(const k in h.s)c[k]=(c[k]||0)+h.s[k];if(c.sk)c.sk=r1(c.sk);return c;}
// Writes every player's season into his history and updates league records.
function recordSeason(){const yr=S.season;S.rec=S.rec||{s:{},c:{}};S.rec.s=S.rec.s||{};S.rec.c=S.rec.c||{};
  for(const T of S.teams)for(const p of T.roster){const s=seasonStats(T,p);p.ss=s;p.hist=(p.hist||[]).concat({y:yr,t:T.abbr,o:p.ovr,s}).slice(-20);
    for(const [k] of REC_KEYS){const v=s[k]||0,cur=S.rec.s[k];if(v>0&&(!cur||v>cur.v))S.rec.s[k]={v,n:p.n,pos:p.pos,t:T.abbr,y:yr};
      const cv=careerOf(p)[k]||0,cc=S.rec.c[k];if(cv>0&&(!cc||cv>cc.v))S.rec.c[k]={v:cv,n:p.n,pos:p.pos,t:T.abbr,y:yr};}}}
function careerLine(p){const c=careerOf(p),f=x=>Math.round(x).toLocaleString('en-US'),n=(p.hist||[]).length;let s;
  if(p.pos==='QB')s=f(c.py||0)+' passing yards, '+(c.ptd||0)+' touchdowns';else if(p.pos==='RB')s=f(c.ry||0)+' rushing yards, '+(c.td||0)+' touchdowns';
  else if(p.pos==='WR'||p.pos==='TE')s=(c.rec||0)+' catches, '+f(c.recy||0)+' yards';else if(p.pos==='DL')s=(c.sk||0)+' sacks';else if(p.pos==='LB')s=f(c.tk||0)+' tackles, '+(c.sk||0)+' sacks';
  else if(p.pos==='CB'||p.pos==='S')s=(c.int||0)+' interceptions';else if(p.pos==='K')s=(c.fgm||0)+' field goals';else s='anchored the line';
  return s+(n?' in '+n+(n===1?' season':' seasons')+' tracked':'');}
function hofScore(p){let sc=p.leg||0;for(const a of p.aw||[]){if(/MVP/.test(a))sc+=4;else if(/Player of the Year/.test(a))sc+=3;else if(/Rookie/.test(a))sc+=1;else if(/All-Pro/.test(a))sc+=0.75;}
  const c=careerOf(p),n=(p.hist||[]).length,pk=Math.max(p.ovr,...(p.hist||[]).map(h=>h.o));
  if(p.pos==='QB'){if((c.py||0)>=45000)sc+=3;if((c.ptd||0)>=320)sc+=2;}else if(p.pos==='RB'){if((c.ry||0)>=10000)sc+=3;}else if(p.pos==='WR'){if((c.recy||0)>=11000)sc+=3;}
  else if(p.pos==='TE'){if((c.recy||0)>=8000)sc+=3;}else if(p.pos==='DL'){if((c.sk||0)>=110)sc+=3;}else if(p.pos==='LB'){if((c.tk||0)>=1300)sc+=2;}else if(p.pos==='CB'||p.pos==='S'){if((c.int||0)>=50)sc+=3;}
  const big={QB:['py',60000],RB:['ry',14000],WR:['recy',15000],TE:['recy',11000],DL:['sk',150],LB:['tk',1800],CB:['int',70],S:['int',70]}[p.pos];if(big&&(c[big[0]]||0)>=big[1])sc+=3;
  if(S.rec&&S.rec.c&&Object.values(S.rec.c).some(r=>r&&r.n===p.n&&r.pos===p.pos))sc+=4;
  if(n>=10)sc+=1;if(n>=15)sc+=1;if(pk>=93)sc+=2;return sc;}
function retireCheck(T,p){S.hof=S.hof||[];if(hofScore(p)<12)return;const yrs=(p.hist||[]).map(h=>h.y),teams=[...new Set((p.hist||[]).map(h=>h.t).concat(T.abbr))];
  S.hof.unshift({n:p.n,pos:p.pos,y:S.season+1,yrs:yrs.length?Math.min(...yrs)+'–'+Math.max(...yrs):'',teams,line:careerLine(p),aw:(p.aw||[]).length,user:T.id===S.user});
  S.news.unshift(p.n+' ('+p.pos+') retired and goes into the Hall of Fame.');}
// ===== practice drills: each one pays training points once per week =====
const drillKey=()=>S.season+'-'+S.phase+'-'+S.week;
function drillDone(kind){return !!(S.drill&&S.drill.key===drillKey()&&S.drill.done[kind]);}
function drillReward(kind,tp){if(drillDone(kind))return 0;if(!S.drill||S.drill.key!==drillKey())S.drill={key:drillKey(),done:{}};S.drill.done[kind]=true;S.tp+=tp;save();return tp;}
// ===== captains and the kick returner =====
function toggleCaptain(p){const U=S.teams[S.user];if(p.cap){p.cap=false;save();return '';}if(U.roster.filter(x=>x.cap).length>=4)return 'You already have 4 captains. Remove one first.';p.cap=true;save();return '';}
function setReturner(p){for(const x of S.teams[S.user].roster)x.kr=false;p.kr=true;save();}

// ===== free agents =====
const signCost=p=>p.ovr<68?1:p.ovr<74?2:p.ovr<79?4:p.ovr<84?7:p.ovr<89?11:16;
function toFA(p){p.num=0;p.cap=p.kr=false;S.fa.push(p);}
function trimFA(){S.fa.sort((a,b)=>b.ovr-a.ovr);if(S.fa.length>90)S.fa.length=90;}
function signFA(p){const U=S.teams[S.user],c=signCost(p);if(U.roster.length>=ROSTER_MAX)return 'Your roster is full at '+ROSTER_MAX+'. Release someone first.';if(S.tp<c)return 'Not enough training points.';
  S.tp-=c;S.fa.splice(S.fa.indexOf(p),1);p.num=numFor(p.pos,new Set(U.roster.map(x=>x.num)));U.roster.push(p);S.news.unshift('Signed free agent '+p.pos+' '+p.n+' ('+p.ovr+' overall).');save();return '';}
// Other teams sign a free agent when he would start for them.
function aiSignings(maxPer,only){for(const T of only?[only]:S.teams){if(T.id===S.user&&S.mode!=='pro')continue;let n=0;
    for(const pos of shuffle(POS_ORDER.slice())){if(n>=maxPer||T.roster.length>=ROSTER_MAX)break;const best=S.fa.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr)[0];
      if(best&&best.ovr>=lowestStarter(T,pos,[])+3){S.fa.splice(S.fa.indexOf(best),1);best.num=numFor(pos,new Set(T.roster.map(x=>x.num)));T.roster.push(best);n++;}}
    trimRoster(T,36);}}

// ===== offseason: aging, draft, new season =====
function agePlayer(p){p.age++;const d=p.dev,a=p.age;let c;
  if(a<=25)c=rint(DEV_GROW[d]-1,DEV_GROW[d]+1);else if(a<=29)c=d==='F'?rint(0,3):d==='E'?rint(0,2):d==='S'?rint(-1,2):rint(-1,1);
  else if(a<=32)c=d==='F'?rint(-2,1):d==='E'?rint(-2,0):rint(-3,0);else c=d==='F'||d==='E'?rint(-4,0):rint(-5,-1);
  p.ovr=clamp(p.ovr+c,50,99);p.pot=a<=25?Math.max(p.pot,p.ovr):p.ovr;if(a>=30)p.spd=Math.max(40,p.spd-1);
  return (a>=36&&Math.random()<0.6)||(a>=32&&p.ovr<68)||a>=40||(p.pos!=='K'&&p.pos!=='QB'&&a>=34&&Math.random()<0.5);}
function draftOrder(){const rank=S.teams.slice().sort(cmpTeams).reverse().map(t=>t.id);if(S.champ!=null){rank.splice(rank.indexOf(S.champ),1);rank.push(S.champ);}
  return S.picks.filter(k=>k.yr===S.season+1).sort((a,b)=>a.rd-b.rd||rank.indexOf(a.orig)-rank.indexOf(b.orig)).map(k=>k.id);}
function startDraft(){S.offer=null;
  for(const T of S.teams){const keep=[];
    for(const p of T.roster){if(agePlayer(p)&&!p.pro){if(T.id===S.user)S.news.unshift(p.n+' ('+p.pos+', '+p.ovr+') retired.');retireCheck(T,p);}else{checkXF(T,p);keep.push(p);}}
    T.roster=keep;
    // some veterans hit the open market
    if(T.id!==S.user&&Math.random()<0.45){const c=T.roster.filter(p=>p.age>=28&&p.ovr>=70&&!(p.pos==='QB'&&isStarter(T,p))&&T.roster.filter(x=>x.pos===p.pos).length>START_N[p.pos]);if(c.length){const p=pick(c);T.roster.splice(T.roster.indexOf(p),1);toFA(p);}}}
  S.fa=S.fa.filter(p=>!agePlayer(p)&&p.ovr>=58);
  const n=32*ROUNDS+34,pool=[];for(let i=0;i<n;i++){const pos=pick(FA_BAG);if(pos==='K'&&Math.random()<0.6){i--;continue;}
    const r=Math.random(),dev=i<8?(r<0.25?'F':r<0.65?'E':'S'):i<32?(r<0.05?'F':r<0.3?'E':r<0.75?'S':'N'):(r<0.05?'E':r<0.35?'S':'N');
    const np=mkPlayer(pos,clamp(79-i*0.15+gauss()*2.4,56,84),rint(21,23),null,dev);np.rk=S.season+1;pool.push(np);}
  pool.sort((a,b)=>b.ovr-a.ovr);S.myPicks=[];
  S.draft={yr:S.season+1,order:draftOrder(),i:0,pool,log:[]};S.phase='draft';if(!S.draft.order.length)endDraft();save();}
const curPick=()=>S.draft?S.picks.find(k=>k.id===S.draft.order[S.draft.i]):null;
function aiPick(T){let best=null,bs=-1e9;
  for(const p of S.draft.pool){const have=T.roster.filter(x=>x.pos===p.pos),top=have.reduce((m,x)=>Math.max(m,x.ovr),0);
    let sc=p.ovr+(p.pot-p.ovr)*0.35+(have.length<ROSTER_N[p.pos]?4:0)+(p.ovr>top-3?2:0)+rnd(-1.5,1.5);
    if(p.pos==='QB'&&top>=80)sc-=6;if(p.pos==='K')sc-=have.length?8:2;if(sc>bs){bs=sc;best=p;}}
  return best;}
function makePick(p){const D=S.draft,pk=curPick(),T=S.teams[pk.own];D.pool.splice(D.pool.indexOf(p),1);
  p.num=numFor(p.pos,new Set(T.roster.map(x=>x.num)));T.roster.push(p);
  D.log.unshift({rd:pk.rd,no:D.i+1,team:T.id,n:p.n,pos:p.pos,ovr:p.ovr});
  if(T.id===S.user){S.myPicks.push('Round '+pk.rd+': '+p.pos+' '+p.n+' ('+p.ovr+' overall, '+DEV[p.dev]+')');}
  D.i++;if(D.i>=D.order.length)endDraft();else save();}
function simDraftToUser(){while(S.phase==='draft'&&curPick().own!==S.user)makePick(aiPick(S.teams[curPick().own]));}
function trimRoster(T,max){while(T.roster.length>max){let worst=null;
    for(const p of T.roster){if(p.pro)continue;const c=T.roster.filter(x=>x.pos===p.pos).length;if(c<=ROSTER_N[p.pos])continue;if(!worst||p.ovr<worst.ovr)worst=p;}
    if(!worst)break;T.roster.splice(T.roster.indexOf(worst),1);toFA(worst);}}
function endDraft(){const yr=S.draft.yr;
  for(const p of S.draft.pool.slice(0,30))toFA(p);   // undrafted rookies become free agents
  for(const T of S.teams){const taken=new Set(T.roster.map(p=>p.num));
    for(const pos of POS_ORDER)while(T.roster.filter(p=>p.pos===pos).length<ROSTER_N[pos]){const r=mkPlayer(pos,rnd(58,66),rint(21,23),taken);r.rk=yr;T.roster.push(r);
      if(T.id===S.user)S.news.unshift('Signed undrafted rookie '+r.pos+' '+r.n+' ('+r.ovr+') to fill a roster spot.');}
    if(T.id!==S.user||S.mode==='pro')trimRoster(T,36);}
  trimFA();
  // picks always run two drafts ahead
  S.picks=S.picks.filter(k=>k.yr!==yr).concat(mkPicks(yr+2));
  if(S.myPicks.length)S.news.unshift('Your '+yr+' draft class: '+S.myPicks.join('; ')+'.');
  S.draft=null;S.phase='preseason';save();}
function newSeason(){const U=S.teams[S.user];if(U.roster.length>ROSTER_MAX)return false;for(const T of S.teams)for(const p of T.roster)delete p.inj;
  if(S.po)computeRanks(true);
  aiSignings(2);trimFA();   // the user gets first look at free agents during the preseason
  for(const T of S.teams){T.w=T.l=T.pf=T.pa=0;}
  S.season++;S.week=0;S.phase='regular';S.po=null;S.pst={};S.gpU=0;for(const T of S.teams)for(const p of T.roster)delete p.ss;S.schedule=makeSchedule(S.season);S.offer=null;S.champ=null;S.last='';save();return true;}

// ===== player management =====
function upgradeCost(p){if(p.ovr>=99)return 0;const b=p.ovr<75?1:p.ovr<85?2:p.ovr<92?3:4;return Math.max(1,b-(p.dev==='F'?1:0)-((p.dev==='F'||p.dev==='E')&&b>=3?1:0));}
function upgradePlayer(p){const c=upgradeCost(p);if(!c)return 'Already maxed out.';if(S.tp<c)return 'Not enough training points. Win games to earn more.';
  S.tp-=c;p.ovr++;if(p.pot<p.ovr)p.pot=p.ovr;if(p.ovr%3===0&&p.spd<99)p.spd++;checkXF(S.teams[S.user],p);save();return '';}
function releasePlayer(p){const U=S.teams[S.user];if(U.roster.filter(x=>x.pos===p.pos).length<=START_N[p.pos])return 'You need at least '+START_N[p.pos]+' at '+p.pos+'.';
  U.roster.splice(U.roster.indexOf(p),1);toFA(p);S.news.unshift('Released '+p.pos+' '+p.n+'. He is now a free agent.');save();return '';}
function editPlayer(p,name,num){const U=S.teams[S.user];name=String(name).replace(/[<>]/g,'').trim().slice(0,22);num=Math.round(+num);
  if(!name)return 'Enter a name.';if(!(num>=0&&num<=99))return 'Pick a number from 0 to 99.';
  const clash=U.roster.find(x=>x!==p&&x.num===num);if(clash)return 'No. '+num+' is worn by '+clash.n+'.';
  p.n=name;p.num=num;save();return '';}

// ===== trades: players and draft picks =====
function tradeValue(p){const v=Math.pow(Math.max(0,p.ovr-52)/10,2.5)*POS_VAL[p.pos];const a=p.age;
  let m=a<=23?1.2:a<=25?1.12:a<=27?1.0:a<=29?0.85:a<=31?0.62:a<=33?0.4:0.22;if(a<=25)m+=Math.max(0,p.pot-p.ovr)*0.03;if(a<=27)m+={N:0,S:0.03,E:0.08,F:0.14}[p.dev]||0;if(p.xf)m+=0.08;
  return Math.round(v*m*10)/10;}
const nextDraftYr=()=>S.season+1+(S.phase==='preseason'?1:0);
function strengthRank(id){const key=t=>ratings(t).ovr+(t.w-t.l)*0.7;const arr=S.teams.slice().sort((a,b)=>key(a)-key(b));return arr.findIndex(t=>t.id===id)/31;}
function pickValue(k){let f=1.3-0.6*strengthRank(k.orig),v=[13,6,2.6][k.rd-1];if(k.yr>nextDraftYr()){v*=0.8;f=1+(f-1)*0.5;}return Math.round(v*f*10)/10;}
const pickName=k=>k.yr+' Round '+k.rd+(k.orig!==k.own?' (from '+S.teams[k.orig].name+')':'');
const teamPicks=id=>S.picks.filter(k=>k.own===id).sort((a,b)=>a.yr-b.yr||a.rd-b.rd);
function lowestStarter(T,pos,exclude){const a=T.roster.filter(p=>p.pos===pos&&!exclude.includes(p)).sort((x,y)=>y.ovr-x.ovr),n=START_N[pos];return a.length>=n?a[n-1].ovr:0;}
// How team T sees a deal where it receives players `gets` + picks `getsK` and sends `gives` + `givesK`.
function aiEval(T,gets,gives,getsK,givesK){let gv=0,ov=0;
  for(const p of gets){const low=lowestStarter(T,p.pos,gives);gv+=tradeValue(p)*(p.ovr>low?(p.ovr>low+4?1.3:1.15):0.65);}
  for(const p of gives){let m=isStarter(T,p)?1.12:0.95;if(p.pos==='QB'&&isStarter(T,p)&&p.ovr>=82)m=1.7;ov+=tradeValue(p)*m;}
  for(const k of getsK||[])gv+=pickValue(k);for(const k of givesK||[])ov+=pickValue(k)*1.08;
  return {gv,ov,ratio:ov>0?gv/ov:(gv>0?9:0)};}
function rosterIssue(T,out,inn){const r=T.roster.filter(p=>!out.includes(p)).concat(inn);
  if(r.length>ROSTER_MAX)return 'would have more than '+ROSTER_MAX+' players';
  for(const pos of POS_ORDER)if(r.filter(p=>p.pos===pos).length<START_N[pos])return 'would be short at '+pos;return '';}
function fixNums(T){const all=new Set(T.roster.map(p=>p.num)),seen=new Set();
  for(const p of T.roster){if(seen.has(p.num))p.num=numFor(p.pos,all);seen.add(p.num);}}
function assetNames(ps,ks){return ps.map(p=>p.pos+' '+p.n).concat(ks.map(k=>'a '+k.yr+' round '+k.rd+' pick')).join(', ');}
function execTrade(A,aOut,aK,B,bOut,bK){A.roster=A.roster.filter(p=>!aOut.includes(p)).concat(bOut);B.roster=B.roster.filter(p=>!bOut.includes(p)).concat(aOut);
  for(const k of aK)k.own=B.id;for(const k of bK)k.own=A.id;for(const p of aOut.concat(bOut))p.cap=p.kr=false;fixNums(A);fixNums(B);
  S.news.unshift('Trade: '+A.name+' send '+assetNames(aOut,aK)+' to '+B.name+' for '+assetNames(bOut,bK)+'.');save();}
function tradesOpen(){return S.phase==='offseason'||S.phase==='preseason'||(S.phase==='regular'&&S.week<TRADE_DEADLINE);}
function proposeTrade(T,give,get,giveK,getK){const U=S.teams[S.user];
  if(!tradesOpen())return {ok:false,msg:S.phase==='draft'?'Trades are closed during the draft.':'The trade deadline has passed.'};
  if(!(give.length+giveK.length)||!(get.length+getK.length))return {ok:false,msg:'Pick at least one player or pick on each side.'};
  let iss=rosterIssue(U,give,get);if(iss)return {ok:false,msg:'Your team '+iss+'.'};
  iss=rosterIssue(T,get,give);if(iss)return {ok:false,msg:T.name+' '+iss+'.'};
  const ev=aiEval(T,give,get,giveK,getK);
  if(ev.ratio<1.03)return {ok:false,msg:T.name+' say no. '+(ev.ratio<0.7?'They want a lot more back.':'They want a little more value.')};
  execTrade(U,give,giveK,T,get,getK);return {ok:true,msg:'Trade accepted.'};}
function makeOffer(){S.offer=null;if(S.mode==='pro')return;if(Math.random()>0.45)return;const U=S.teams[S.user];
  for(let i=0;i<120;i++){const T=pick(S.teams);if(T.id===S.user)continue;const P=pick(U.roster);if(P.pos==='K'||(P.pos==='QB'&&isStarter(U,P)))continue;const vp=tradeValue(P);if(vp<2.5)continue;
    if(i%3===0){const ks=teamPicks(T.id).filter(k=>{const v=pickValue(k);return v>=vp*0.95&&v<=vp*1.5;});if(!ks.length||rosterIssue(U,[P],[]))continue;
      if(aiEval(T,[P],[],[],[ks[0]]).ratio<1.03)continue;S.offer={team:T.id,give:[P.id],get:[],giveK:[],getK:[ks[0].id]};return;}
    const Q=pick(T.roster);if(Q.pos===P.pos||Q.pos==='K')continue;const vq=tradeValue(Q);if(vq<vp*0.8||vq>vp*1.5)continue;
    if(Q.ovr<lowestStarter(U,Q.pos,[])-1)continue;if(rosterIssue(U,[P],[Q])||rosterIssue(T,[Q],[P]))continue;if(aiEval(T,[P],[Q]).ratio<1.03)continue;
    S.offer={team:T.id,give:[P.id],get:[Q.id],giveK:[],getK:[]};return;}}

// ===== Be a Pro: one player's career =====
const PRO_POS=[['QB','Quarterback','Call the plays, read the defense and throw it.'],['RB','Running back','Take the handoff, find the hole, catch passes out of the backfield.'],['WR','Wide receiver','Run your route, get open, make the catch and go.'],['TE','Tight end','Block, work the middle of the field, make the tough catch.'],['DL','Defensive end','Beat your blocker and get to the quarterback.'],['LB','Linebacker','Read the play, fill the hole, make the tackle.'],['CB','Cornerback','Shadow your receiver and take the ball away.'],['S','Safety','Play center field and clean up every tackle.']];
const PRO_XP=300,proSide=pos=>/^(QB|RB|WR|TE)$/.test(pos)?'O':'D',isPro=()=>!!(S&&S.mode==='pro'&&S.pro);
// [stat, target at 4-minute quarters, text]. A key ending in 0 means "no more than zero".
const PRO_GOALS={QB:[['py',200,'Throw for {n} yards'],['ptd',2,'Throw {n} touchdown passes'],['cmp',16,'Complete {n} passes'],['pint0',0,'Throw no interceptions']],
  RB:[['ry',80,'Run for {n} yards'],['td',1,'Score a touchdown'],['rec',4,'Catch {n} passes'],['car',18,'Get {n} carries']],
  WR:[['rec',3,'Catch {n} passes'],['recy',50,'Gain {n} receiving yards'],['td',1,'Score a touchdown']],
  TE:[['rec',3,'Catch {n} passes'],['recy',35,'Gain {n} receiving yards'],['td',1,'Score a touchdown']],
  DL:[['sk',1,'Get a sack'],['tk',3,'Make {n} tackles']],LB:[['tk',6,'Make {n} tackles'],['sk',1,'Get a sack']],
  CB:[['tk',2,'Make {n} tackles'],['pd',1,'Break up a pass'],['int',1,'Intercept a pass']],S:[['tk',4,'Make {n} tackles'],['pd',1,'Break up a pass'],['int',1,'Intercept a pass']]};
function proP(){if(!isPro())return null;if(S.pro.done)return S.pro.done;if(onRoad())return S.road.team.roster.find(x=>x.id===S.pro.id)||null;for(const T of S.teams){const p=T.roster.find(x=>x.id===S.pro.id);if(p)return p;}return null;}
function newPro(name,pos,num,tid){newLeague();S.mode='pro';const drafted=!(tid>=0&&tid<32);
  if(drafted)tid=pick(S.teams.slice().sort((a,b)=>ratings(a).ovr-ratings(b).ovr).slice(0,8)).id;
  const T=S.teams[tid],taken=new Set(T.roster.map(p=>p.num)),p=mkPlayer(pos,pos==='QB'?70:71,21,null,'S');
  p.n=String(name||'').replace(/[<>]/g,'').trim().slice(0,22)||p.n;num=Math.round(+num);
  if(num>=0&&num<=99&&!isNaN(num)){const o=T.roster.find(x=>x.num===num);if(o)o.num=numFor(o.pos,taken);p.num=num;}else p.num=numFor(pos,taken);
  p.spd=clamp(p.spd+3,40,99);p.pot=Math.max(p.pot,84);p.pro=true;p.rk=S.season;T.roster.push(p);trimRoster(T,ROSTER_MAX);
  S.user=tid;S.playDef=proSide(pos)==='D';S.koRet=false;S.pro={id:p.id,xp:0,sp:1,games:0,start:S.season,goals:null,last:null,done:null,sg:0,sgp:0};proGoals();
  S.news=[(drafted?T.name+' took '+p.n+' in the first round':T.name+' signed rookie '+p.n)+' ('+pos+', #'+p.num+'). Welcome to the league.'];save();return p;}
function proGoals(){const p=proP();if(!p)return;const f=clamp((S.qlen||4)/4,0.5,2)*(onRoad()?(S.road.stage==='hs'?1.3:1.1):1),pool=shuffle(PRO_GOALS[p.pos].slice()).slice(0,2);
  S.pro.goals=pool.map(([k,n,t])=>{const m=n<=1?(n===1&&f>=1.75?2:n):Math.max(1,Math.round(n*f));return {k,n:m,t:t.replace('{n}',m.toLocaleString('en-US'))};});}
function goalMet(g,s){const v=s[g.k.replace(/0$/,'')]||0;return /0$/.test(g.k)?v<=0:v>=g.n;}
function proLine(s,pos){s=s||{};const f=x=>Math.round(x||0),n=(x,w,ws)=>f(x)+' '+(f(x)===1?w:ws||w+'s');
  if(pos==='QB')return f(s.cmp)+'/'+f(s.att)+', '+f(s.py)+' yds, '+f(s.ptd)+' TD'+(s.pint?', '+s.pint+' INT':'')+(s.car?' · '+n(s.car,'run')+', '+f(s.ry)+' yds':'');
  if(pos==='RB')return n(s.car,'carry','carries')+', '+f(s.ry)+' yds'+(s.rec?' · '+s.rec+' rec, '+f(s.recy)+' yds':'')+(s.td?' · '+s.td+' TD':'');
  if(pos==='WR'||pos==='TE')return n(s.rec,'catch','catches')+', '+f(s.recy)+' yds'+(s.td?' · '+s.td+' TD':'')+(s.car?' · '+f(s.ry)+' rush yds':'');
  return n(s.tk,'tackle')+(s.sk?', '+n(s.sk,'sack'):'')+(s.pd?', '+n(s.pd,'pass breakup'):'')+(s.int?', '+s.int+' INT':'')+(s.fr?', '+n(s.fr,'fumble recovery','fumble recoveries'):'')+(s.td?', '+s.td+' TD':'');}
function proXP(s,pos,win,met){s=s||{};const g=k=>s[k]||0;let x;
  if(pos==='QB')x=g('cmp')*3+g('py')/6+g('ptd')*20-g('pint')*12+g('ry')/4+g('td')*20;
  else if(pos==='RB')x=g('ry')/3+g('car')+g('rec')*4+g('recy')/4+g('td')*20;
  else if(pos==='WR'||pos==='TE')x=g('rec')*9+g('recy')/2.5+g('td')*20+g('ry')/4;
  else x=g('tk')*10+g('sk')*25+g('pd')*15+g('int')*35+g('td')*25+g('fr')*15;
  return Math.max(10,Math.round(x))+(win?25:0)+met*50;}
const proCost=p=>p.ovr>=99?0:p.ovr<60?1:p.ovr<85?2:p.ovr<92?3:4,proSpdCost=p=>p.spd>=99?0:p.spd<85?1:p.spd<92?2:3;
function proGain(xp){const P=S.pro,b=P.sp;P.xp+=xp;while(P.xp>=PRO_XP){P.xp-=PRO_XP;P.sp++;}return P.sp-b;}
function proApply(r){const P=S.pro,p=proP();if(!p)return;P.games++;P.sg+=r.met;P.sgp+=r.goals.length;const sp=proGain(r.xp);
  P.last={sim:false,line:proLine(r.s,p.pos),xp:r.xp,met:r.met,goals:r.goals.map(g=>({t:g.t,ok:g.ok})),sp,res:r.res};
  if(sp)S.news.unshift('You earned '+(sp===1?'a skill point':sp+' skill points')+'. Spend '+(sp===1?'it':'them')+' on the Career tab.');proGoals();}
function proSimGame(){const m=userMatch();completeStep(false);const P=S.pro,p=proP();if(!m||m.hs==null||!p)return;const home=m.h===S.user,us=home?m.hs:m.as,th=home?m.as:m.hs,xp=35+(us>th?15:0);
  P.games++;const sp=proGain(xp);P.last={sim:true,xp,sp,res:(us>th?'Won ':'Lost ')+us+'-'+th};proGoals();save();}
// This season so far: the games you played plus an estimate for the ones you simmed.
function proSeasonLine(p,T){if(S.phase==='offseason'||S.phase==='preseason')return statLine(p,T);const real=S.pst[p.id]||{},done=S.phase==='regular'?S.week:17,sims=Math.max(0,Math.min(17,done)-(S.gpU||0)),m=sims?modelStats(p,T,sims/17):{},o={};
  for(const k of STATK){const v=(real[k]||0)+(m[k]||0);if(v)o[k]=v;}return done?proLine(o,p.pos):'No games yet';}
function proBonus(){const P=S.pro;return P&&P.sgp>=4?clamp((P.sg/P.sgp-0.45)*16,-6,9):0;}
function proUpgrade(kind){const p=proP();if(!p||S.pro.done)return 'Your career is over.';
  if(kind==='spd'){const c=proSpdCost(p);if(!c)return 'Speed is maxed out.';if(S.pro.sp<c)return 'You need '+c+' skill point'+(c>1?'s':'')+' for more speed.';S.pro.sp-=c;p.spd++;save();return '';}
  const c=proCost(p);if(!c)return 'Already maxed out.';if(S.pro.sp<c)return 'You need '+c+' skill point'+(c>1?'s':'')+' to raise your overall.';S.pro.sp-=c;p.ovr++;p.pot=Math.max(p.pot,p.ovr);checkXF(S.teams[S.user],p);save();return '';}
// The offseason runs itself: everyone ages, the league drafts, rosters are trimmed, and a new season starts.
function proAdvance(){if(S.phase!=='offseason')return;startDraft();let g=0;while(S.phase==='draft'&&g++<400){const k=curPick();makePick(aiPick(S.teams[k.own]));}
  if(S.phase==='preseason')trimRoster(S.teams[S.user],ROSTER_MAX);const p=proP();if(p&&p.age>=40){proRetire(true);return;}
  S.pro.sg=S.pro.sgp=0;newSeason();proGoals();save();}
function proRetire(forced){const p=proP(),T=S.teams[S.user];if(!p||S.pro.done)return;T.roster.splice(T.roster.indexOf(p),1);
  const before=(S.hof||[]).length;retireCheck(T,p);const hof=(S.hof||[]).length>before;if(hof)S.hof[0].user=true;
  S.pro.done=Object.assign({},p,{team:T.name,hof,retY:S.season});S.news.unshift(p.n+(forced?' retires at 40':' retires')+' after '+(p.hist||[]).length+' seasons.'+(hof?' He goes into the Hall of Fame.':''));
  if(S.phase==='offseason'){S.pro.sg=S.pro.sgp=0;}save();}
const proTradeOpen=()=>S.phase==='offseason'||S.phase==='regular'&&S.week<TRADE_DEADLINE;
// Teams that would start you at your position.
function proSuitors(){const p=proP();if(!p||onRoad())return [];return S.teams.filter(T=>T.id!==S.user).map(T=>({T,s:starters(T,p.pos)[0]})).filter(x=>!x.s||x.s.ovr<=p.ovr+1).sort((a,b)=>ratings(b.T).ovr-ratings(a.T).ovr).slice(0,8).map(x=>x.T);}
function proTrade(tid){const p=proP(),A=S.teams[S.user],B=S.teams[tid];if(!p||!B||B===A||S.pro.done)return 'Pick a different team.';
  if(!proTradeOpen())return 'Trade requests are only granted in the offseason or before the week '+(TRADE_DEADLINE+1)+' trade deadline.';
  if(!proSuitors().includes(B))return B.name+' are not interested right now.';
  A.roster.splice(A.roster.indexOf(p),1);const taken=new Set(B.roster.map(x=>x.num));if(taken.has(p.num))p.num=numFor(p.pos,taken);B.roster.push(p);trimRoster(B,ROSTER_MAX);
  const t=A.roster.filter(x=>x.pos===p.pos).length;if(t<ROSTER_N[p.pos]){const r=mkPlayer(p.pos,rnd(60,66),rint(22,25),new Set(A.roster.map(x=>x.num)));A.roster.push(r);}
  S.user=tid;S.news.unshift('Trade: '+A.name+' send '+p.n+' to '+B.name+'.');save();return '';}

// ----- X-Factors for your pro: unlock with skill points, equip one at a time -----
const PRO_XF_OVR=[78,85,91],PRO_XF_COST=4;
function proXF(k){const p=proP(),P=S.pro;if(!p||P.done)return 'Your career is over.';P.xfs=P.xfs||[];if(!XFS[p.pos].some(x=>x[0]===k))return '';
  if(P.xfs.includes(k)){p.xf=k;save();return '';}const n=P.xfs.length,need=PRO_XF_OVR[n];
  if(p.ovr<need)return 'Your '+['first','second','third'][n]+' X-Factor unlocks at '+need+' overall.';if(P.sp<PRO_XF_COST)return 'You need '+PRO_XF_COST+' skill points to unlock it.';
  P.sp-=PRO_XF_COST;P.xfs.push(k);p.xf=k;S.news.unshift('You unlocked the '+xfName(p)+' X-Factor.');save();return '';}

// ===== Road to the Pros: high school, college, then the draft =====
const onRoad=()=>!!(S&&S.road&&S.road.stage!=='done');
const COLLEGES=[['Alabama','BAMA','#9E1B32','#F2F2F2',10],['Georgia','UGA','#BA0C2F','#111111',10],['Ohio State','OSU','#BB0000','#9AA1A6',10],['Michigan','MICH','#00274C','#FFCB05',9],['Texas','TEX','#BF5700','#F2F2F2',9],['Oregon','ORE','#154733','#FEE123',9],
  ['LSU','LSU','#461D7C','#FDD023',8],['Clemson','CLEM','#F56600','#522D80',8],['Notre Dame','ND','#0C2340','#C99700',8],['Penn State','PSU','#041E42','#F2F2F2',8],['USC','USC','#990000','#FFCC00',8],['Florida State','FSU','#782F40','#CEB888',7],
  ['Oklahoma','OU','#841617','#FDF9D8',7],['Tennessee','TENN','#FF8200','#F2F2F2',7],['Miami','UM','#005030','#F47321',7],['Texas A&M','TAMU','#500000','#F2F2F2',7],['Ole Miss','MISS','#CE1126','#14213D',7],['Florida','UF','#0021A5','#FA4616',6],
  ['Auburn','AUB','#0C2340','#E87722',6],['Wisconsin','WIS','#C5050C','#F2F2F2',6],['Washington','UW','#4B2E83','#B7A57A',6],['Indiana','IU','#990000','#EEEDEB',6],['Utah','UTAH','#CC0000','#F2F2F2',5],['Iowa','IOWA','#111111','#FFCD00',5],
  ['Michigan State','MSU','#18453B','#F2F2F2',5],['UCLA','UCLA','#2D68C4','#F2A900',5],['Kansas State','KSU','#512888','#F2F2F2',5],['Arizona State','ASU','#8C1D40','#FFC627',4],['Boise State','BSU','#0033A0','#D64309',4],['Iowa State','ISU','#C8102E','#F1BE48',4],
  ['Nebraska','NEB','#E41C38','#FDF2D9',4],['Arkansas','ARK','#9D2235','#F2F2F2',4],['Baylor','BAY','#154734','#FFB81C',4],['TCU','TCU','#4D1979','#A3A9AC',4],['Colorado','COLO','#111111','#CFB87C',4],['Virginia Tech','VT','#630031','#CF4420',4],
  ['Pitt','PITT','#003594','#FFB81C',3],['Minnesota','MINN','#7A0019','#FFCC33',3],['Kentucky','UK','#0033A0','#F2F2F2',3],['Stanford','STAN','#8C1515','#F2F2F2',3],['Syracuse','CUSE','#F76900','#000E54',2],['Duke','DUKE','#003087','#F2F2F2',2],
  ['Vanderbilt','VAN','#111111','#CFAE70',2],['Rutgers','RUTG','#CC0033','#111111',2],['Northwestern','NW','#4E2A84','#F2F2F2',2]];
const HS_NAMES=['Central','Lincoln','Westview','Roosevelt','Northside','Eastlake','Jefferson','Valley','Riverside','Kennedy','Madison','Franklin','Hillcrest','Oak Ridge','Summit','Lakeview','Mountain View','Washington','Southside','Ridgeline','Cedar Creek','Pine Grove','Harbor','Granite Bay','Fairview','Liberty','Heritage','Westlake','Canyon','Mesa'];
const HS_COLS=[['#1D4ED8','#F8FAFC'],['#B91C1C','#FDE047'],['#166534','#F8FAFC'],['#7C2D12','#FBBF24'],['#4C1D95','#F8FAFC'],['#0F172A','#F97316'],['#0E7490','#F8FAFC'],['#991B1B','#0F172A'],['#1E3A8A','#FACC15'],['#14532D','#FACC15'],['#6B21A8','#FACC15'],['#111827','#E5E7EB'],['#C2410C','#1F2937'],['#BE123C','#F8FAFC'],['#0369A1','#FBBF24'],['#365314','#E5E7EB']];
const BOWLS=['Citrus Bowl','Sun Bowl','Holiday Bowl','Gator Bowl','Liberty Bowl','Music City Bowl','Alamo Bowl','Las Vegas Bowl'];
const CLASS_YR=['Freshman','Sophomore','Junior','Senior'];
function uniFor(c1,c2){const w='#FFFFFF',k='#141414',d=lum(c1)<0.55;return {H:[c1,d?w:k,lum(c2)>0.85?w:c2,c1,c2],A:[w,c1,lum(c2)>0.85?c1:c2,c1,c2],X:[c2,lum(c2)>0.55?c1:w,c2,c2,c1],R:['#1B1D22',c2,'#1B1D22','#1B1D22',c1]};}
function mkRoadTeam(id,name,abbr,c1,c2,mean,lvl,stadN){const taken=new Set(),roster=[],age=lvl==='hs'?[15,17]:[18,22];
  for(const pos of POS_ORDER)for(let i=0;i<ROSTER_N[pos];i++)roster.push(mkPlayer(pos,mean+(i===0?3:i===1?0:-4)+gauss()*3,rint(age[0],age[1]),taken));
  const hs=lvl==='hs';return {id,abbr,name,c1,c2,roster,w:0,l:0,pf:0,pa:0,lvl,uni:uniFor(c1,c2),stadN:stadN||(hs?name+' Field':name+' Stadium'),
    stad:hs?['O','#6b7280','none',4,'Friday night under the lights: metal bleachers, the band and the whole town in the stands.']:['O',c1,'none',Math.round(mean-8),'A packed college crowd and a marching band that never stops.']};}
function hsTeam(id,name,mean,used){const c=pick(HS_COLS),ab=name.replace(/[^A-Za-z ]/g,'').split(' ').filter(Boolean),abbr=(ab.length>1?ab.map(w=>w[0]).join('').slice(0,3):ab[0].slice(0,4)).toUpperCase();return mkRoadTeam(id,name+(/High$/.test(name)?'':' High'),abbr,c[0],c[1],mean,'hs');}
function colMean(c){return 57+c[4]*1.5;}
function colTeam(id,i,bonus){const c=COLLEGES[i];const T=mkRoadTeam(id,c[0],c[1],c[2],c[3],colMean(c)+(bonus||0),'col');T.ci=i;return T;}
function proIntoTeam(T,p){const same=T.roster.filter(x=>x.pos===p.pos).sort((a,b)=>a.ovr-b.ovr);T.roster.splice(T.roster.indexOf(same[0]),1);const o=T.roster.find(x=>x.num===p.num);if(o)o.num=numFor(o.pos,new Set(T.roster.map(x=>x.num).concat(p.num)));T.roster.push(p);}
function newRoadPro(name,pos,num,hsName){newLeague();S.mode='pro';S.user=0;const hs=(String(hsName||'').replace(/[<>]/g,'').trim().slice(0,24))||pick(HS_NAMES);
  const p=mkPlayer(pos,56,17,null,'S');p.n=String(name||'').replace(/[<>]/g,'').trim().slice(0,22)||p.n;num=Math.round(+num);p.num=num>=0&&num<=99&&!isNaN(num)?num:numFor(pos,new Set());
  p.spd=clamp(p.spd+3,40,99);p.pot=84;p.pro=true;
  S.pro={id:p.id,xp:0,sp:1,games:0,start:S.season,goals:null,last:null,done:null,sg:0,sgp:0,xfs:[]};S.playDef=proSide(pos)==='D';S.koRet=false;
  S.road={stage:'hs',yr:0,hs:hs.replace(/ High$/,'')+' High',car:[],team:null,opps:[],sched:[],wk:0,post:null,sea:null,offers:null,stars:0,draft:null};
  S.road.team=hsTeam(100,S.road.hs,53);proIntoTeam(S.road.team,p);roadNewSeason();
  S.news=['Senior year at '+S.road.hs+'. Scouts will be watching. Play well and the big schools come calling.'];save();return p;}
function roadLabel(){const R=S.road;return R.stage==='hs'?'Senior year · '+R.hs:R.stage==='col'?CLASS_YR[R.yr]+' year · '+COLLEGES[R.ci][0]:R.stage==='offers'?'Recruiting':'NFL Draft';}
function roadNewSeason(){const R=S.road,T=R.team,p=proP(),hs=R.stage==='hs';R.wk=0;R.post=null;R.sea={gp:0,st:{},aw:[],done:false,champ:null};S.pro.sg=S.pro.sgp=0;S.pro.last=null;
  let id=101;T.w=T.l=T.pf=T.pa=0;
  if(hs){const names=shuffle(HS_NAMES.filter(n=>n+' High'!==R.hs)).slice(0,8);R.opps=names.map(n=>hsTeam(id++,n,rnd(49,56)));}
  else{T.roster=colTeam(100,R.ci,0).roster;proIntoTeam(T,p);
    const pool=shuffle(COLLEGES.map((c,i)=>i).filter(i=>i!==R.ci)).sort((a,b)=>Math.abs(COLLEGES[a][4]-COLLEGES[R.ci][4])-Math.abs(COLLEGES[b][4]-COLLEGES[R.ci][4])+rnd(-3,3)).slice(0,10);
    R.opps=shuffle(pool).map(i=>colTeam(id++,i,0));}
  if(hs){T.roster=hsTeam(100,R.hs,53).roster;proIntoTeam(T,p);}
  R.sched=R.opps.map((o,i)=>({o:i,h:i%2===0,r:null}));proGoals();}
function roadMatch(){const R=S.road;if(R.stage!=='hs'&&R.stage!=='col')return null;if(R.wk<R.sched.length){const s=R.sched[R.wk];return {opp:R.opps[s.o],home:s.h,lab:'Week '+(R.wk+1)+' of '+R.sched.length};}
  if(R.post&&!R.post.done)return {opp:R.post.opp,home:true,lab:R.post.names[R.post.r]};return null;}
// Box score for a simmed game, scaled to how good you are compared with your teammates.
function roadSimStats(p,T){const rel=clamp(p.ovr-ratings(T).ovr,-10,15),v=x=>Math.max(0,x*(0.75+Math.random()*0.5)),r=Math.round;
  switch(p.pos){case 'QB':{const att=r(v(28));return {att,cmp:r(att*clamp(0.6+rel*0.006,0.45,0.78)),py:r(v(205+rel*7)),ptd:r(v(1.6+rel*0.07)),pint:r(v(0.9)),car:r(v(4)),ry:r(v(15))};}
    case 'RB':return {car:r(v(18)),ry:r(v(85+rel*4)),td:r(v(0.9+rel*0.04)),rec:r(v(2.5)),recy:r(v(20))};
    case 'WR':return {rec:r(v(4.5+rel*0.12)),recy:r(v(60+rel*3)),td:r(v(0.5+rel*0.03))};case 'TE':return {rec:r(v(3.5+rel*0.08)),recy:r(v(40+rel*2)),td:r(v(0.4))};
    case 'DL':return {tk:r(v(3+rel*0.08)),sk:r(v(0.6+rel*0.04))};case 'LB':return {tk:r(v(6.5+rel*0.15)),sk:r(v(0.4)),int:Math.random()<0.1?1:0};
    default:return {tk:r(v(p.pos==='S'?5:3.5)),pd:r(v(0.8)),int:Math.random()<0.18+rel*0.01?1:0};}}
function addStats(a,b){for(const k in b)if(typeof b[k]==='number'&&STATK.includes(k))a[k]=(a[k]||0)+b[k];}
function roadResult(us,them,stats){const R=S.road,m=roadMatch(),T=R.team,p=proP();if(!m)return;const win=us>them,o=m.opp;
  T.pf+=us;T.pa+=them;o.pf+=them;o.pa+=us;if(win){T.w++;o.l++;}else{T.l++;o.w++;}
  R.sea.gp++;addStats(R.sea.st,stats||roadSimStats(p,T));
  const tag=(win?'Won ':'Lost ')+us+'-'+them+(m.home?' vs ':' at ')+o.name;
  if(R.wk<R.sched.length){R.sched[R.wk].r=[us,them];R.wk++;for(const x of R.opps)if(x!==o){if(Math.random()<clamp(0.5+(ratings(x).ovr-55)*0.04,0.15,0.85))x.w++;else x.l++;}
    S.news.unshift(m.lab+': '+tag+'.');if(R.wk===R.sched.length)roadPostStart();}
  else{const P=R.post;S.news.unshift(P.names[P.r]+': '+tag+'.');if(!win){P.done=true;}else if(P.r===P.names.length-1){P.done=true;R.sea.champ=P.champ;S.news.unshift(P.champ+'!');}else{P.r++;P.opp=roadPostOpp(P.r);}}
  if(!roadMatch())roadEndSeason();S.news=S.news.slice(0,16);save();}
function roadPostStart(){const R=S.road,T=R.team,hs=R.stage==='hs';let names=null,champ='';
  if(hs){if(T.w>=5){names=['State quarterfinal','State semifinal','State championship'];champ='State champions';}}
  else if(T.w>=9){names=['Playoff semifinal','National championship'];champ='National champions';}else if(T.w>=6){const b=pick(BOWLS);names=[b];champ=b+' champions';}
  if(!names){S.news.unshift(hs?'Your team missed the state playoffs.':'No bowl game this year.');return;}
  R.post={names,r:0,done:false,champ,opp:null};R.post.opp=roadPostOpp(0);S.news.unshift((hs?'You made the state playoffs':names.length>1?'You made the College Football Playoff':'Bowl bid: the '+names[0])+'!');}
function roadPostOpp(r){const R=S.road,id=150+r,n=R.post.names.length;if(R.stage==='hs')return hsTeam(id,pick(HS_NAMES.filter(n=>n+' High'!==R.hs)),56+r*1.5);
  const pool=COLLEGES.map((c,i)=>i).filter(i=>i!==R.ci&&(n===1?COLLEGES[i][4]<=7:COLLEGES[i][4]>=8));return colTeam(id,pick(pool),n===1?0:2);}
function roadEndSeason(){const R=S.road,T=R.team,p=proP(),P=S.pro;if(!R.sea||R.sea.done)return;R.sea.done=true;
  const rate=P.sgp>=4?P.sg/P.sgp:null,rel=p.ovr-ratings(T).ovr,sc=rel+(rate!=null?(rate-0.45)*20:0)+T.w*0.4+(R.sea.champ?2:0),hs=R.stage==='hs',aw=R.sea.aw;
  if(hs){if(sc>=19)aw.push('State Player of the Year');if(sc>=13)aw.push('All-State');else if(sc>=8)aw.push('All-District');}
  else{if(sc>=18&&T.w>=9)aw.push(proSide(p.pos)==='O'?'Heisman Trophy':'Defensive Player of the Year');if(sc>=13)aw.push('All-American');else if(sc>=8)aw.push('All-Conference');}
  if(R.sea.champ)aw.unshift(R.sea.champ);
  R.car.push({hs,lab:hs?'Senior · '+R.hs:CLASS_YR[R.yr]+' · '+COLLEGES[R.ci][0],w:T.w,l:T.l,gp:R.sea.gp,st:Object.assign({},R.sea.st),aw:aw.slice(),ovr:p.ovr});
  p.aw=(p.aw||[]).concat(aw.map(a=>(hs?'High school: ':'College: ')+a));
  const g=hs?rint(1,3):rint(2,4);p.age++;p.ovr=clamp(p.ovr+g,50,99);p.pot=Math.max(p.pot,p.ovr);
  S.news.unshift('Season over: '+T.w+'-'+T.l+'. '+(aw.length?'Honors: '+aw.join(', ')+'. ':'')+'You grew '+g+' overall in the offseason.');}
function roadNext(){const R=S.road;if(!R.sea||!R.sea.done)return;
  if(R.stage==='hs'){const bon=R.car.reduce((a,c)=>a+c.aw.reduce((x,w)=>x+(/Player of the Year/.test(w)?4:/All-State/.test(w)?3:/All-District/.test(w)?1:/champ/i.test(w)?2:0),0),0),sc=proP().ovr+bon;
    R.stars=sc>=68?5:sc>=63?4:sc>=59?3:2;const rng={5:[7,10],4:[5,8],3:[3,6],2:[2,4]}[R.stars];
    R.offers=shuffle(COLLEGES.map((c,i)=>i).filter(i=>COLLEGES[i][4]>=rng[0]&&COLLEGES[i][4]<=rng[1])).slice(0,4).sort((a,b)=>COLLEGES[b][4]-COLLEGES[a][4]);R.stage='offers';
    S.news.unshift('Recruiting services rate you a '+R.stars+'-star prospect. '+R.offers.length+' schools have offered you a scholarship.');save();return;}
  if(R.stage==='col'){R.yr++;roadNewSeason();S.news.unshift(CLASS_YR[R.yr]+' year at '+COLLEGES[R.ci][0]+' begins.');save();}}
function roadCommit(i){const R=S.road;if(R.stage!=='offers'||!R.offers.includes(i))return;const p=proP();R.ci=i;R.yr=0;R.stage='col';R.team=colTeam(100,i,0);proIntoTeam(R.team,p);roadNewSeason();
  S.news.unshift('You committed to '+COLLEGES[i][0]+'.');save();}
function roadProjection(){const p=proP(),R=S.road,bon=R.car.filter(c=>!c.hs).reduce((a,c)=>a+c.aw.reduce((x,w)=>x+(/Heisman|Defensive Player/.test(w)?4:/All-American/.test(w)?3:/All-Conference/.test(w)?1:/National champ/.test(w)?1:0),0),0);
  const sc=p.ovr+bon,pk=Math.max(1,Math.round((82-sc)*8));return {sc,pk,txt:pk<=10?'a top-10 pick':pk<=32?'a first-round pick':pk<=64?'a second-round pick':pk<=96?'a third-round pick':'undrafted, but teams will call'};}
function roadDeclare(){const R=S.road;if(R.stage!=='col'||!R.sea||!R.sea.done||R.yr<2)return;R.stage='draft';R.draft=null;S.news.unshift('You declared for the '+S.season+' NFL Draft.');save();}
function roadDraft(){const R=S.road;if(R.stage!=='draft'||R.draft)return;const pr=roadProjection(),order=S.teams.slice().sort((a,b)=>ratings(a).ovr-ratings(b).ovr);
  let pk=clamp(pr.pk+rint(-5,5),1,999);let tid,txt;if(pk<=ROUNDS*32){tid=order[(pk-1)%32].id;txt='Round '+(Math.floor((pk-1)/32)+1)+', pick '+pk;}else{tid=pick(order.slice(0,12)).id;pk=0;txt='Undrafted free agent';}
  R.draft={pick:pk,tid,txt};save();}
function roadToNFL(){const R=S.road;if(R.stage!=='draft'||!R.draft)return;const p=proP(),T=S.teams[R.draft.tid];
  R.team.roster.splice(R.team.roster.indexOf(p),1);const taken=new Set(T.roster.map(x=>x.num));if(taken.has(p.num)){const o=T.roster.find(x=>x.num===p.num);o.num=numFor(o.pos,taken);}
  T.roster.push(p);trimRoster(T,ROSTER_MAX);p.rk=S.season;S.user=T.id;R.stage='done';R.team=null;R.opps=null;R.sched=null;R.post=null;R.sea=null;
  S.pro.sg=S.pro.sgp=0;S.pro.last=null;proGoals();S.news=[(R.draft.pick?T.name+' drafted '+p.n+' ('+R.draft.txt.toLowerCase()+').':p.n+' signed with '+T.name+' as an undrafted free agent.')+' Welcome to the NFL.'];save();}
