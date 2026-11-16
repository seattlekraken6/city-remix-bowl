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
const FIRST=['James','Marcus','Tyler','Devin','Jalen','Caleb','Andre','Isaiah','Malik','Trevor','Darius','Cole','Xavier','Jordan','Elijah','Micah','Derrick','Brandon','Chris','Aaron','Nate','Kyle','Jamal','Terrence','Grant','Logan','Mason','Hunter','Dante','Corey','Zach','Tre','Omar','Luis','Mateo','Diego','Kai','Noah','Ethan','Owen','Jaylen','Deshawn','Rashad','Quincy','Miles','Jonah','Silas','Reggie','Tavon','Bryce','Colton','Wyatt','Emeka','Kofi','Sione','Tevita','Keanu','Javier','Rico','Dominic','Theo','Amari','Ezra','Roman'];
const LAST=['Brooks','Hayes','Bennett','Coleman','Foster','Griffin','Harper','Jennings','Keller','Lawson','Mercer','Nolan','Owens','Pierce','Quinn','Reeves','Sutton','Tate','Underwood','Vaughn','Abbott','Barnes','Castillo','Dawson','Ellis','Holloway','Ingram','Knox','Monroe','Nash','Osei','Paige','Rhodes','Salazar','Thorne','Upton','Vega','Whitaker','Yates','Zamora','Ashford','Blackwood','Calloway','Delgado','Easton','Fontaine','Gallagher','Hendrix','Irving','Jacobsen','Kimball','Langford','Maddox','Navarro','Okafor','Radford','Stanton','Tolliver','Usher','Valdez','Winslow','Yarbrough','Adeyemi','Boateng','Cortez','Dunmore','Everett','Garza','Hollis','Iverson','Jarrett','Kane','Lockhart','Mosley','Nwosu','Ortega','Pruitt','Rollins','Sandoval','Tuilagi','Fonoti','Mahoe','Kealoha','Whitlock','Bellamy','Marchetti','Lindqvist','Achebe','Duvall','Sterling'];
const POS_ORDER=['QB','RB','WR','TE','OL','DL','LB','CB','S','K'];
const ROSTER_N={QB:2,RB:2,WR:4,TE:2,OL:6,DL:5,LB:4,CB:3,S:3,K:1};
const START_N={QB:1,RB:1,WR:3,TE:1,OL:5,DL:4,LB:3,CB:2,S:2,K:1};
const POS_SPD={QB:66,RB:86,WR:88,TE:77,OL:54,DL:66,LB:76,CB:88,S:85,K:55};
const POS_VAL={QB:1.7,RB:0.85,WR:1.05,TE:0.8,OL:0.9,DL:1.0,LB:0.85,CB:1.0,S:0.85,K:0.3};
const NUM_R={QB:[[1,19]],RB:[[20,39]],WR:[[80,89],[10,19]],TE:[[80,89]],OL:[[60,79]],DL:[[90,99],[50,59]],LB:[[40,59]],CB:[[20,39]],S:[[20,49]],K:[[1,9]]};
const TRADE_DEADLINE=9,ROSTER_MAX=38,ROUNDS=3,XF_OVR=95;
const DIFFS=['Rookie','Pro','All-Pro','Legend'];
const UNI_NAMES={H:'Home',A:'Away',X:'Alternate',R:'Rivalry'};
// X-Factor abilities. Linemen are always on; everyone else has to get "in the zone" during a game.
const XF={QB:['Gunslinger','Faster, more accurate throws. In the zone after 3 completions.'],RB:['Wrecking Ball','Breaks more tackles. In the zone after 2 runs of 5+ yards.'],
  WR:['Sure Hands','Wins contested catches. In the zone after 2 catches.'],TE:['Mismatch','Wins contested catches. In the zone after 2 catches.'],OL:['Anchor','Holds blocks longer. Always on.'],
  DL:['Unstoppable','Sheds blocks faster. In the zone after a sack or tackle for loss.'],LB:['Enforcer','Tackles are rarely broken. In the zone after 2 tackles.'],
  CB:['Lockdown','Tighter coverage. In the zone after 2 stops.'],S:['Ball Hawk','More interceptions. In the zone after 2 stops.'],K:['Clutch','A wider field goal target. Always on.']};

let S=null,NID=1;
const dk=()=>S?[-1,0,0.7,1.4][S.diff]:0; // difficulty lean: Rookie, Pro, All-Pro, Legend

function numFor(pos,taken){const R=NUM_R[pos];for(let i=0;i<60;i++){const r=pick(R),n=rint(r[0],r[1]);if(!taken.has(n)){taken.add(n);return n;}}for(let n=1;n<100;n++)if(!taken.has(n)){taken.add(n);return n;}return 0;}
const spdFor=(pos,ovr)=>clamp(Math.round(POS_SPD[pos]+(ovr-76)*0.3+rnd(-3,3)),40,99);
function mkPlayer(pos,ovr,age,taken){ovr=clamp(Math.round(ovr),50,99);
  return {id:NID++,n:pick(FIRST)+' '+pick(LAST),pos,age,ovr,pot:clamp(ovr+(age<=25?rint(0,9):0),ovr,99),spd:spdFor(pos,ovr),num:taken?numFor(pos,taken):0,xf:false};}
function mkPicks(yr){return S_teamsIds().flatMap(t=>[1,2,3].map(rd=>({id:S.pid++,yr,rd,orig:t,own:t})));}
const S_teamsIds=()=>[...Array(32).keys()];

function newLeague(){NID=1;
  const teams=TEAM_DEFS.map((d,i)=>{const taken=new Set(),roster=[];
    for(const r of REAL[d[0]]){let num=r[3];if(taken.has(num))num=numFor(r[1],taken);else taken.add(num);
      roster.push({id:NID++,n:r[0],pos:r[1],age:r[5],ovr:r[2],pot:r[5]<=25?clamp(r[2]+rint(0,7),r[2],99):r[2],spd:spdFor(r[1],r[2]),num,xf:!!r[4]});}
    for(const pos of POS_ORDER)while(roster.filter(p=>p.pos===pos).length<ROSTER_N[pos])roster.push(mkPlayer(pos,rnd(60,67),rint(22,25),taken));
    return {id:i,abbr:d[0],name:d[1],c1:d[2],c2:d[3],conf:d[4],div:d[5],roster,w:0,l:0,pf:0,pa:0};});
  S={v:2,season:2026,week:0,user:-1,teams,schedule:makeSchedule(),phase:'regular',po:null,picks:[],pid:1,news:[],offer:null,nid:NID,champ:null,last:'',diff:1,playDef:true,tp:12,draft:null,myPicks:[]};
  S.picks=[...mkPicks(2027),...mkPicks(2028)];return S;}

// ===== depth chart and ratings =====
function starters(T,pos){return T.roster.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr).slice(0,START_N[pos]);}
function isStarter(T,p){return starters(T,p.pos).includes(p);}
function ratings(T){const avg=pos=>{const a=starters(T,pos);return a.reduce((x,p)=>x+p.ovr+(p.xf?2:0),0)/(a.length||1);};
  const off=(avg('QB')*3+avg('RB')+avg('WR')*2.5+avg('TE')*0.7+avg('OL')*2.8)/10;
  const def=(avg('DL')*3+avg('LB')*2.2+avg('CB')*2.6+avg('S')*2.2)/10;
  return {off:Math.round(off),def:Math.round(def),ovr:Math.round((off+def)/2)};}
function checkXF(T,p){if(!p.xf&&p.ovr>=XF_OVR){p.xf=true;if(T.id===S.user)S.news.unshift(p.n+' ('+p.pos+') earned an X-Factor: '+XF[p.pos][0]+'.');}}

// ===== schedule and simulation =====
function makeSchedule(n=32,weeks=17){const ids=[...Array(n).keys()];shuffle(ids);const rounds=[];
  for(let r=0;r<n-1;r++){const g=[];for(let i=0;i<n/2;i++){const a=ids[i],b=ids[n-1-i];g.push(Math.random()<0.5?{h:a,a:b,hs:null,as:null}:{h:b,a:a,hs:null,as:null});}
    rounds.push(g);ids.splice(1,0,ids.pop());}
  shuffle(rounds);return rounds.slice(0,weeks);}
function simGame(H,A){const rh=ratings(H),ra=ratings(A);
  const f=(o,d,hf)=>{const x=Math.max(0,21+(o-d)*0.6+hf+gauss()*8);const td=Math.floor(x/7);return td*7+Math.min(2,Math.round((x-td*7)/3))*3;};
  let hs=f(rh.off,ra.def,1.5),as=f(ra.off,rh.def,0);if(hs===as){if(Math.random()<0.5)hs+=3;else as+=3;}return [hs,as];}
const cmpTeams=(a,b)=>(b.w/((b.w+b.l)||1))-(a.w/((a.w+a.l)||1))||(b.pf-b.pa)-(a.pf-a.pa)||a.id-b.id;
function currentGames(){if(S.phase==='regular')return S.schedule[S.week]||[];if(S.phase==='playoffs')return S.po.games;return [];}
function userMatch(){return currentGames().find(g=>(g.h===S.user||g.a===S.user)&&g.hs==null)||null;}
function roundName(){if(!S.po)return '';const n=S.po.alive.A.length+S.po.alive.N.length;return n>=14?'Wild Card round':n>=8?'Divisional round':n>=4?'Conference finals':'Gridiron Bowl';}
// Playoff field: four division winners seeded 1-4 by record, then three wild cards seeded 5-7.
function seedsFor(c){const ts=S.teams.filter(t=>t.conf===c);const dw=DIVS.map(d=>ts.filter(t=>t.div===d).sort(cmpTeams)[0]).sort(cmpTeams);
  const rest=ts.filter(t=>!dw.includes(t)).sort(cmpTeams);return {div:dw,wc:rest.slice(0,3),hunt:rest.slice(3,6)};}
function startPlayoffs(){S.phase='playoffs';S.offer=null;const seeds={};
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
  if(fin){S.champ=g0.hs>g0.as?g0.h:g0.a;S.phase='offseason';po.games=[];S.news.unshift(S.teams[S.champ].name+' win the '+S.season+' Gridiron Bowl.');}
  else buildRound();}
function completeStep(played){const games=currentGames();
  for(const g of games)if(g.hs==null){const r=simGame(S.teams[g.h],S.teams[g.a]);g.hs=r[0];g.as=r[1];}
  const ug=games.find(g=>g.h===S.user||g.a===S.user);
  if(ug){const home=ug.h===S.user,us=home?ug.hs:ug.as,th=home?ug.as:ug.hs,opp=S.teams[home?ug.a:ug.h],won=us>th;
    const tp=(played?(won?5:3):(won?2:1))+(S.phase==='playoffs'?2:0);S.tp+=tp;
    S.last=(S.phase==='regular'?'Week '+(S.week+1):roundName())+': '+(won?'Won ':'Lost ')+us+'-'+th+(home?' vs ':' at ')+opp.name+' (+'+tp+' training points)';S.news.unshift(S.last);}
  if(S.phase==='regular'){
    for(const g of games){const H=S.teams[g.h],A=S.teams[g.a];H.pf+=g.hs;H.pa+=g.as;A.pf+=g.as;A.pa+=g.hs;if(g.hs>g.as){H.w++;A.l++;}else{A.w++;H.l++;}}
    S.week++;if(S.week>=S.schedule.length)startPlayoffs();else if(S.week<TRADE_DEADLINE)makeOffer();else{if(S.week===TRADE_DEADLINE)S.news.unshift('The trade deadline has passed. Trades reopen in the offseason.');S.offer=null;}}
  else finishRound();
  if(S.news.length>16)S.news.length=16;save();}
function finishUserGame(us,them){const m=userMatch();if(m){const home=m.h===S.user;m.hs=home?us:them;m.as=home?them:us;}completeStep(true);}

// ===== offseason: aging, draft, new season =====
function draftOrder(){const rank=S.teams.slice().sort(cmpTeams).reverse().map(t=>t.id);if(S.champ!=null){rank.splice(rank.indexOf(S.champ),1);rank.push(S.champ);}
  return S.picks.filter(k=>k.yr===S.season+1).sort((a,b)=>a.rd-b.rd||rank.indexOf(a.orig)-rank.indexOf(b.orig)).map(k=>k.id);}
function startDraft(){S.offer=null;
  for(const T of S.teams){const keep=[];
    for(const p of T.roster){p.age++;let d;
      if(p.age<=25)d=rint(0,Math.max(1,Math.min(4,p.pot-p.ovr+1)));else if(p.age<=29)d=rint(-1,2);else if(p.age<=32)d=rint(-3,0);else d=rint(-5,-1);
      p.ovr=clamp(p.ovr+d,50,99);if(p.pot<p.ovr)p.pot=p.ovr;if(p.age>=30)p.spd=Math.max(40,p.spd-1);
      const retire=(p.age>=36&&Math.random()<0.6)||(p.age>=32&&p.ovr<68)||p.age>=40||(p.pos!=='K'&&p.pos!=='QB'&&p.age>=34&&Math.random()<0.5);
      if(retire){if(T.id===S.user)S.news.unshift(p.n+' ('+p.pos+', '+p.ovr+') retired.');}else{checkXF(T,p);keep.push(p);}}
    T.roster=keep;}
  const n=32*ROUNDS+24,bag=[];for(const pos of POS_ORDER)for(let i=0;i<ROSTER_N[pos];i++)bag.push(pos);
  const pool=[];for(let i=0;i<n;i++){const pos=pick(bag);if(pos==='K'&&Math.random()<0.6){i--;continue;}
    const p=mkPlayer(pos,clamp(79-i*0.15+gauss()*2.4,56,84),rint(21,23),null);p.pot=clamp(p.ovr+rint(3,14),p.ovr,99);pool.push(p);}
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
  if(T.id===S.user){S.myPicks.push('Round '+pk.rd+': '+p.pos+' '+p.n+' ('+p.ovr+' overall)');}
  D.i++;if(D.i>=D.order.length)endDraft();else save();}
function simDraftToUser(){while(S.phase==='draft'&&curPick().own!==S.user)makePick(aiPick(S.teams[curPick().own]));}
function trimRoster(T,max){while(T.roster.length>max){let worst=null;
    for(const p of T.roster){const c=T.roster.filter(x=>x.pos===p.pos).length;if(c<=ROSTER_N[p.pos])continue;if(!worst||p.ovr<worst.ovr)worst=p;}
    if(!worst)break;T.roster.splice(T.roster.indexOf(worst),1);}}
function endDraft(){const yr=S.draft.yr;
  for(const T of S.teams){const taken=new Set(T.roster.map(p=>p.num));
    for(const pos of POS_ORDER)while(T.roster.filter(p=>p.pos===pos).length<ROSTER_N[pos]){const r=mkPlayer(pos,rnd(58,66),rint(21,23),taken);r.pot=clamp(r.ovr+rint(2,10),r.ovr,99);T.roster.push(r);
      if(T.id===S.user)S.news.unshift('Signed undrafted rookie '+r.pos+' '+r.n+' ('+r.ovr+') to fill a roster spot.');}
    if(T.id!==S.user)trimRoster(T,36);}
  S.picks=S.picks.filter(k=>k.yr!==yr).concat(mkPicks(yr+2));
  if(S.myPicks.length)S.news.unshift('Your '+yr+' draft class: '+S.myPicks.join('; ')+'.');
  S.draft=null;S.phase='preseason';save();}
function newSeason(){const U=S.teams[S.user];if(U.roster.length>ROSTER_MAX)return false;
  for(const T of S.teams){T.w=T.l=T.pf=T.pa=0;}
  S.season++;S.week=0;S.phase='regular';S.po=null;S.schedule=makeSchedule();S.offer=null;S.champ=null;S.last='';save();return true;}

// ===== player management =====
const upgradeCost=p=>p.ovr>=99?0:p.ovr<75?1:p.ovr<85?2:p.ovr<92?3:4;
function upgradePlayer(p){const c=upgradeCost(p);if(!c)return 'Already maxed out.';if(S.tp<c)return 'Not enough training points. Win games to earn more.';
  S.tp-=c;p.ovr++;if(p.pot<p.ovr)p.pot=p.ovr;if(p.ovr%3===0&&p.spd<99)p.spd++;checkXF(S.teams[S.user],p);save();return '';}
function releasePlayer(p){const U=S.teams[S.user];if(U.roster.filter(x=>x.pos===p.pos).length<=START_N[p.pos])return 'You need at least '+START_N[p.pos]+' at '+p.pos+'.';
  U.roster.splice(U.roster.indexOf(p),1);S.news.unshift('Released '+p.pos+' '+p.n+'.');save();return '';}
function editPlayer(p,name,num){const U=S.teams[S.user];name=String(name).replace(/[<>]/g,'').trim().slice(0,22);num=Math.round(+num);
  if(!name)return 'Enter a name.';if(!(num>=0&&num<=99))return 'Pick a number from 0 to 99.';
  const clash=U.roster.find(x=>x!==p&&x.num===num);if(clash)return 'No. '+num+' is worn by '+clash.n+'.';
  p.n=name;p.num=num;save();return '';}

// ===== trades: players and draft picks =====
function tradeValue(p){const v=Math.pow(Math.max(0,p.ovr-52)/10,2.5)*POS_VAL[p.pos];const a=p.age;
  let m=a<=23?1.2:a<=25?1.12:a<=27?1.0:a<=29?0.85:a<=31?0.62:a<=33?0.4:0.22;if(a<=25)m+=Math.max(0,p.pot-p.ovr)*0.03;if(p.xf)m+=0.08;
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
  for(const k of aK)k.own=B.id;for(const k of bK)k.own=A.id;fixNums(A);fixNums(B);
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
function makeOffer(){S.offer=null;if(Math.random()>0.45)return;const U=S.teams[S.user];
  for(let i=0;i<120;i++){const T=pick(S.teams);if(T.id===S.user)continue;const P=pick(U.roster);if(P.pos==='K'||(P.pos==='QB'&&isStarter(U,P)))continue;const vp=tradeValue(P);if(vp<2.5)continue;
    if(i%3===0){const ks=teamPicks(T.id).filter(k=>{const v=pickValue(k);return v>=vp*0.95&&v<=vp*1.5;});if(!ks.length||rosterIssue(U,[P],[]))continue;
      if(aiEval(T,[P],[],[],[ks[0]]).ratio<1.03)continue;S.offer={team:T.id,give:[P.id],get:[],giveK:[],getK:[ks[0].id]};return;}
    const Q=pick(T.roster);if(Q.pos===P.pos||Q.pos==='K')continue;const vq=tradeValue(Q);if(vq<vp*0.8||vq>vp*1.5)continue;
    if(Q.ovr<lowestStarter(U,Q.pos,[])-1)continue;if(rosterIssue(U,[P],[Q])||rosterIssue(T,[Q],[P]))continue;if(aiEval(T,[P],[Q]).ratio<1.03)continue;
    S.offer={team:T.id,give:[P.id],get:[Q.id],giveK:[],getK:[]};return;}}
