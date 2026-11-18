// ===== menus =====
const $=s=>document.querySelector(s);
const KEY='cityGridiron.v2';
const UI={tab:'home',rf:'ALL',rv:'team',sel:null,edMsg:'',faMsg:'',setup:null,dpos:'ALL',tr:{team:-1,give:[],get:[],gk:[],tk:[],msg:'',ok:false},confirmNew:false};
const coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function save(){if(!S||S.user<0)return;S.nid=NID;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(o&&(o.v>=2&&o.v<=4)&&o.teams&&o.teams.length===32&&o.user>=0){S=o;NID=S.nid||1;if(S.v<4){migrate();save();}return true;}}}catch(e){}return false;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sw=(T,c)=>`<span class="sw${c?' '+c:''}" style="--a:${T.c1};--b:${T.c2}"></span>`;
const byId=(T,id)=>T.roster.find(p=>p.id===id);
const pkById=id=>S.picks.find(k=>k.id===id);
const posRank=p=>POS_ORDER.indexOf(p.pos)*1000-p.ovr;
const xfTag=p=>p.xf?' <span class="xf" title="X-Factor: '+XF[p.pos][0]+'">X</span>':'';
const devTag=p=>`<span class="dev d${p.dev}">${DEV[p.dev]}</span>`;
const phaseName=()=>S.phase==='regular'?'Week '+(S.week+1):S.phase==='playoffs'?roundName():S.phase==='draft'?S.draft.yr+' draft':S.phase==='preseason'?'Preseason':'Offseason';
const FILT={ALL:POS_ORDER,OFF:['QB','RB','WR','TE','OL'],DEF:['DL','LB','CB','S'],K:['K']};

function render(){if(!S||S.user<0){renderPick();return;}const U=S.teams[S.user];
  $('#top').innerHTML=`<div class="who">${sw(U,'lg')}<div><h1>${U.name}</h1><div class="meta">${S.season} · ${phaseName()} · ${U.w}-${U.l}</div></div></div><div class="stat">${S.tp}<small>Training points</small></div>`;
  $('#tabs').hidden=false;$('#tabs').innerHTML=[['home',S.phase==='draft'?'Draft':'Home'],['roster','Roster'],['trade','Trades'],['league','League']].map(t=>`<button data-a="tab" data-t="${t[0]}" class="${UI.tab===t[0]?'on':''}">${t[1]}</button>`).join('');
  ({home:vHome,roster:vRoster,trade:vTrade,league:vLeague})[UI.tab]();}
function renderPick(){if(!S)newLeague();
  $('#top').innerHTML='<div class="who"><div><h1>City Gridiron</h1><div class="meta">Pick a city to run</div></div></div>';$('#tabs').hidden=true;
  let h='<div class="wrap"><section class="card hero"><p class="eyebrow">New franchise</p><h2>Thirty-two cities. One trophy.</h2><p class="muted">Call the plays, throw the passes, play defense, and trade players and draft picks to build a winner.</p></section>';
  for(const c of ['A','N']){h+=`<section><h3>${CONF[c]} conference</h3><div class="pick">`;
    for(const d of DIVS)for(const T of S.teams.filter(t=>t.conf===c&&t.div===d)){const r=ratings(T);h+=`<button data-a="pick" data-id="${T.id}">${sw(T)}<span><b>${T.name}</b><small>${d} · ${r.ovr} overall</small></span></button>`;}
    h+='</div></section>';}
  $('#view').innerHTML=h+'</div>';}
function teamBlock(T,r){return `<div class="tb">${sw(T,'lg')}<div><b>${T.name}</b><span>${T.w}-${T.l}</span><div class="chips"><span class="chip">OFF ${r.off}</span><span class="chip">DEF ${r.def}</span></div></div></div>`;}

// ----- uniforms -----
function uniSvg(T,key){const u=UNI[T.abbr][key];return `<svg viewBox="0 0 44 70" aria-hidden="true"><rect x="14" y="44" width="16" height="16" fill="${u[2]}" stroke="#0006" stroke-width=".6"/><rect x="15" y="60" width="5" height="8" fill="${lum(u[0])>0.8?u[4]:u[0]}"/><rect x="24" y="60" width="5" height="8" fill="${lum(u[0])>0.8?u[4]:u[0]}"/>
  <path d="M4 18h36v10h-6v17H10V28H4z" fill="${u[0]}" stroke="#0006" stroke-width=".6"/><rect x="4" y="24" width="6" height="3" fill="${u[4]}"/><rect x="34" y="24" width="6" height="3" fill="${u[4]}"/>
  <text x="22" y="39" text-anchor="middle" font-size="13" font-weight="700" font-family="Barlow Condensed,Arial Narrow,sans-serif" fill="${u[1]}">12</text>
  <rect x="13" y="2" width="18" height="15" rx="6" fill="${u[3]}" stroke="#0006" stroke-width=".6"/><rect x="21" y="2" width="2" height="15" fill="${u[4]}"/><rect x="17" y="12" width="10" height="3.5" fill="#22262b"/></svg>`;}
function fixClash(T,key,other){const j=UNI[other.T.abbr][other.key][0];if(colDist(UNI[T.abbr][key][0],j)>=110)return key;
  let best=key,bd=-1;for(const k of ['A','H','X','R']){const d=colDist(UNI[T.abbr][k][0],j);if(d>bd){bd=d;best=k;}}return best;}
function openSetup(){const m=userMatch();if(!m)return;const home=m.h===S.user,U=S.teams[S.user],O=S.teams[home?m.a:m.h];
  const uU=home?'H':fixClash(U,'A',{T:O,key:'H'});UI.setup={home,opp:O.id,uU,uO:fixClash(O,home?'A':'H',{T:U,key:uU})};}
function uniPicker(T,cur,side){return `<div class="unicol"><h3>${T.name}</h3><div class="unirow">`+['H','A','X','R'].map(k=>`<button class="uni${cur===k?' on':''}" data-a="uni" data-s="${side}" data-k="${k}" aria-pressed="${cur===k}">${uniSvg(T,k)}<span>${UNI_NAMES[k]}</span></button>`).join('')+'</div></div>';}
function settingsRow(){const sel=(id,lab,opts,cur)=>`<span class="setp"><label for="${id}">${lab}</label><select id="${id}">${opts.map((o,i)=>`<option value="${i}"${cur===i?' selected':''}>${o}</option>`).join('')}</select></span>`;
  return '<div class="row set">'+sel('setDiff','Difficulty',DIFFS,S.diff)+sel('setSpeed','Game speed',SPEEDS,S.speed)+sel('setDef','Defense',['Simulate defense','I play defense'],S.playDef?1:0)+sel('setKo','Kickoffs',['Skip returns','Play returns'],S.koRet?1:0)+sel('setTalk','Broadcast crew',['Off','Captions only','Voice and captions','Voice only'],S.talk)+'</div>';}
function setupCard(lab){const su=UI.setup,U=S.teams[S.user],O=S.teams[su.opp],rival=U.conf===O.conf&&U.div===O.div;
  const clash=colDist(UNI[U.abbr][su.uU][0],UNI[O.abbr][su.uO][0])<110;
  return `<section class="card hero"><p class="eyebrow">${lab} · ${su.home?'Home':'Away'}${rival?' · Division rivalry game':''}</p><h2>Pick the uniforms</h2>
  <div class="unis">${uniPicker(U,su.uU,'U')}${uniPicker(O,su.uO,'O')}</div>${clash?'<p class="bad">These two jerseys look alike. Pick a different one for either team.</p>':''}
  ${settingsRow()}<div class="row"><button class="btn" data-a="kickoff">Kick off</button><button class="btn ghost" data-a="setupBack">Back</button></div></section>`;}

function awardsCard(){const A=S.awards;if(!A)return '';const me=t=>t===S.user?' class="me"':'';
  return `<section class="card"><h3>${A.yr} season awards</h3><ul class="news">${A.list.map(a=>`<li${me(a.team)}><b>${a.t}:</b> ${a.pos} ${esc(a.n)}, ${S.teams[a.team].name} <span class="muted">${a.line}</span></li>`).join('')}</ul><p class="eyebrow">All-Pro team</p><p>${A.pro.map(a=>`<span${me(a.team)}>${a.pos} ${esc(a.n)} <span class="muted">${S.teams[a.team].abbr}</span></span>`).join(' · ')}</p></section>`;}
function leadersCard(){const L=Object.values(S.pst||{});if(!L.length)return '';const top=(k,min)=>L.filter(x=>(x[k]||0)>=min).sort((a,b)=>b[k]-a[k])[0],rows=[];
  let x=top('py',1);if(x)rows.push(`<li><b>Passing:</b> ${esc(x.n)} · ${x.cmp} of ${x.att}, ${x.py} yards, ${x.ptd} touchdowns, ${x.pint} interceptions</li>`);
  x=top('ry',1);if(x)rows.push(`<li><b>Rushing:</b> ${esc(x.n)} · ${x.car} carries, ${x.ry} yards, ${x.td} touchdowns</li>`);
  x=top('recy',1);if(x)rows.push(`<li><b>Receiving:</b> ${esc(x.n)} · ${x.rec} catches, ${x.recy} yards</li>`);
  x=top('tk',1);if(x)rows.push(`<li><b>Tackles:</b> ${esc(x.n)} · ${x.tk}</li>`);x=top('sk',1);if(x)rows.push(`<li><b>Sacks:</b> ${esc(x.n)} · ${x.sk}</li>`);x=top('int',1);if(x)rows.push(`<li><b>Interceptions:</b> ${esc(x.n)} · ${x.int}</li>`);
  return rows.length?`<section class="card"><h3>Your team leaders</h3><p class="muted">From the games you played this season.</p><ul class="news">${rows.join('')}</ul></section>`:'';}
function voiceRow(){const v=voiceList(),cur=S.voice||['',''],lab=x=>esc(x.name.replace(/^(Microsoft|Google|Apple) /,'').replace(/ Online \(Natural\).*/,' (Natural)'))+' · '+esc(/^en/i.test(x.lang)?x.lang.replace('_','-').slice(3):x.lang),
    opt=c=>'<option value="">Best available</option>'+v.map(x=>`<option value="${esc(x.name)}"${x.name===c?' selected':''}>${lab(x)}</option>`).join(''),
    sel=(id,l,c)=>`<span class="setp"><label for="${id}">${l}</label><select id="${id}" class="vsel">${opt(c)}</select></span>`,
    one=(id,l,o,ci)=>`<span class="setp"><label for="${id}">${l}</label><select id="${id}">${o.map((t,i)=>`<option value="${i}"${ci===i?' selected':''}>${t}</option>`).join('')}</select></span>`,
    crowd=one('setCrowd','Crowd noise',['Off','On'],S.crowd===false?0:1);
  if(!v.length)return '<div class="row set">'+crowd+'</div><p class="muted">The announcer voices come from your browser or device. None are available here, so the booth shows captions only.</p>';
  return '<div class="row set">'+sel('setV0','Ray, play-by-play',cur[0])+sel('setV1','Tony, analyst',cur[1])+one('setVspd','Pace',['Relaxed','Normal','Fast'],S.vspd==null?1:S.vspd)+crowd+'<button class="btn ghost sm" data-a="voiceTest">Hear them</button></div><p class="muted">The game picks the most natural voices your browser has, listed best first. The voices themselves come from your browser or device: Microsoft Edge has the most lifelike ones, marked Natural.</p>';}
// ----- home -----
function assetLine(T,ids,kids){return ids.map(id=>byId(T,id)).map(p=>`<b>${p.pos} ${esc(p.n)}</b>${xfTag(p)} <span class="muted">${p.ovr} overall, age ${p.age}</span>`).concat(kids.map(id=>`<b>${pickName(pkById(id))} pick</b>`)).join(', ');}
function offerCard(){const o=S.offer;if(!o||!tradesOpen())return '';const T=S.teams[o.team],U=S.teams[S.user];
  if(o.give.some(id=>!byId(U,id))||o.get.some(id=>!byId(T,id))||o.giveK.some(id=>!pkById(id)||pkById(id).own!==U.id)||o.getK.some(id=>!pkById(id)||pkById(id).own!==T.id)){S.offer=null;return '';}
  return `<section class="card"><p class="eyebrow">Trade offer from ${T.name}</p><p>They send ${assetLine(T,o.get,o.getK)}</p><p>They want ${assetLine(U,o.give,o.giveK)}</p><div class="row"><button class="btn sm" data-a="offerYes">Accept</button><button class="btn ghost sm" data-a="offerNo">Decline</button></div></section>`;}
function vHome(){if(S.phase==='draft')return vDraft();const U=S.teams[S.user],r=ratings(U);let h='<div class="wrap">';
  if(S.phase==='offseason'){const ch=S.teams[S.champ];
    h+=`<section class="card hero"><p class="eyebrow">${S.season} season complete</p><h2>${ch.id===S.user?'You won the Gridiron Bowl':ch.name+' won the Gridiron Bowl'}</h2><p class="muted">Trades and free agency are open. When you start the draft, every player ages a year first: young players improve at a pace set by their potential, veterans decline, and some retire.</p><div class="row"><button class="btn" data-a="startDraft">Start the ${S.season+1} draft</button></div></section>`;}
  else if(S.phase==='preseason'){const over=U.roster.length-ROSTER_MAX;
    h+=`<section class="card hero"><p class="eyebrow">Draft complete</p><h2>Ready for ${S.season+1}</h2><p class="muted">You have ${U.roster.length} players. The limit is ${ROSTER_MAX}. Trades and free agency are open, and undrafted rookies are in the free agent pool.</p>${over>0?`<p class="bad">Release ${over} player${over>1?'s':''} on the Roster tab before the season starts.</p>`:''}<div class="row"><button class="btn" data-a="newSeason"${over>0?' disabled':''}>Start ${S.season+1} season</button></div></section>`;}
  else{const m=userMatch(),lab=S.phase==='regular'?'Week '+(S.week+1)+' of '+S.schedule.length:roundName();
    if(m&&UI.setup)h+=setupCard(lab);
    else if(m){const home=m.h===S.user,opp=S.teams[home?m.a:m.h],rival=U.conf===opp.conf&&U.div===opp.div;
      h+=`<section class="card hero"><p class="eyebrow">${lab} · ${home?'Home':'Away'}${rival?' · Division game':''}</p><div class="match">${teamBlock(U,r)}<span class="vs">${home?'vs':'at'}</span>${teamBlock(opp,ratings(opp))}</div><div class="row"><button class="btn" data-a="play">Play game</button><button class="btn ghost" data-a="sim">Sim game</button></div></section>`;}
    else if(S.phase==='regular')h+=`<section class="card hero"><p class="eyebrow">${lab}</p><h2>Bye week</h2><p class="muted">No game for you this week. The rest of the league plays on.</p><div class="row"><button class="btn" data-a="sim">Continue</button></div></section>`;
    else{const alive=S.po&&(S.po.alive.A.includes(S.user)||S.po.alive.N.includes(S.user));
      h+=`<section class="card hero"><p class="eyebrow">${lab}</p><h2>${alive?'You earned a first-round bye':'Your season is over'}</h2><div class="row"><button class="btn" data-a="sim">${alive?'Continue':'Sim this round'}</button></div></section>`;}}
  h+=offerCard();if(S.phase==='offseason'||S.phase==='preseason')h+=awardsCard();
  if(S.news.length)h+='<section class="card"><h3>News</h3><ul class="news">'+S.news.slice(0,8).map(n=>`<li>${esc(n)}</li>`).join('')+'</ul></section>';
  if(!UI.setup)h+=`<section class="card"><h3>Settings</h3>${settingsRow()}<p class="muted">Rookie is forgiving. Legend makes defenders faster to react, tackles surer, and the other team's quarterback sharper.</p></section><section class="card"><h3>Broadcast sound</h3>${voiceRow()}</section>`;
  h+=`<section class="card"><h3>How to play</h3><ul class="news"><li><b>Offense:</b> the coach suggests plays for the situation, or open the full playbook by type. Snap with <b>Space</b> or a tap, move with <b>WASD</b> or the arrow keys (drag on a phone). Each receiver has his own route color and number; press the number or tap him to throw. <b>Space</b> jukes.</li><li><b>Defense:</b> pick a coverage, then steer the player with the blue marker. Run into the ball carrier to tackle, press <b>Space</b> to dive at him, or press it as a pass arrives to swat it. <b>Q</b> switches to the defender nearest the ball.</li><li><b>After a touchdown:</b> choose a celebration, then kick the extra point or go for two.</li><li><b>X-Factors:</b> stars marked X switch on after a couple of good plays, shown by a gold ring and X. The bar at the bottom of the field shows who has the ball and whether his ability is on.</li><li><b>Clock:</b> after a play that ends in bounds the game clock keeps running while you pick the next play. Snap before the play clock hits zero or it's delay of game. Each team has 3 timeouts per half (press <b>T</b>). <b>Sim drive</b> plays out the rest of a possession for you.</li><li><b>Ball carrier moves:</b> Space jukes, E or F spins. Pick off a pass and you run it back.</li><li><b>Injuries:</b> now and then a player gets hurt and misses a few weeks. His backup starts until he's healthy.</li><li><b>Flags:</b> when the other team commits a foul you choose to accept the yards or decline and keep the play.</li><li><b>Captains and returner:</b> on the Roster tab, tap a player to make him a captain (up to 4, each plays 2 points better) or your kick returner.</li><li><b>Training points:</b> earned every game. Spend them on the Roster tab to raise ratings or sign free agents.</li></ul><div class="row"><button class="btn ghost sm" data-a="newFr">${UI.confirmNew?'Tap again to erase this franchise':'Start a new franchise'}</button></div></section>`;
  $('#view').innerHTML=h+'</div>';}

// ----- roster, free agents and player editor -----
function editor(U){const p=byId(U,UI.sel);if(!p){UI.sel=null;return '';}const c=upgradeCost(p);
  return `<section class="card edit"><div class="row"><h3>${esc(p.n)}</h3><span class="muted">${p.pos} · ${p.ovr} overall · age ${p.age} · speed ${p.spd}</span></div>
  <p>${devTag(p)} potential${p.age<=25?', projected to reach about '+p.pot+' overall':''}. ${p.dev==='F'?'Improves fastest and is cheaper to upgrade.':p.dev==='E'?'Improves quickly each offseason.':p.dev==='S'?'Improves steadily each offseason.':'Improves slowly.'}</p>
  ${p.xf?`<p><span class="xf">X</span> <b>${XF[p.pos][0]}.</b> ${XF[p.pos][1]}</p>`:`<p class="muted">Earns the ${XF[p.pos][0]} X-Factor at ${XF_OVR} overall.</p>`}
  ${p.aw&&p.aw.length?`<p><b>Awards:</b> ${p.aw.slice(-6).map(esc).join(' · ')}</p>`:''}${p.cap?'<p><span class="tag cap">C</span> Team captain: plays 2 points above his rating.</p>':''}${p.inj?'<p><span class="tag inj">Injured</span> Out '+p.inj+(p.inj===1?' more week. A healthy backup starts in his place.':' more weeks. A healthy backup starts in his place.')+'</p>':''}
  <div class="row"><label for="edName">Name</label><input id="edName" value="${esc(p.n)}" maxlength="22" autocomplete="off"><label for="edNum">Number</label><input id="edNum" type="number" min="0" max="99" value="${p.num}" inputmode="numeric"><button class="btn sm" data-a="edSave">Save</button></div>
  <div class="row"><button class="btn sm" data-a="edUp"${c&&S.tp>=c?'':' disabled'}>${c?'Upgrade +1 overall ('+c+' point'+(c>1?'s':'')+')':'Maxed out'}</button><button class="btn ghost sm" data-a="edCap">${p.cap?'Remove captain':'Make captain'}</button>${['RB','WR','CB','S'].includes(p.pos)?`<button class="btn ghost sm" data-a="edKr"${p.kr?' disabled':''}>${p.kr?'Kick returner':'Set as kick returner'}</button>`:''}<button class="btn ghost sm" data-a="edRel">Release</button><button class="btn ghost sm" data-a="edClose">Close</button>${UI.edMsg?`<span class="${UI.edOk?'good':'bad'}">${esc(UI.edMsg)}</span>`:''}</div></section>`;}
function vRoster(){const U=S.teams[S.user],fa=UI.rv==='fa';
  let h='<div class="wrap">'+(fa?'':editor(U))+`<div class="row"><button class="btn ghost sm${fa?'':' sel'}" data-a="rv" data-v="team">My team</button><button class="btn ghost sm${fa?' sel':''}" data-a="rv" data-v="fa">Free agents (${S.fa.length})</button><span class="muted">${U.roster.length} of ${ROSTER_MAX} roster spots used</span></div>`;
  h+='<div class="row">'+[['ALL','Everyone'],['OFF','Offense'],['DEF','Defense'],['K','Kicker']].map(f=>`<button class="btn ghost sm${UI.rf===f[0]?' sel':''}" data-a="rf" data-f="${f[0]}">${f[1]}</button>`).join('')+`<span class="muted">${fa?'Signing costs training points. You have '+S.tp+'.':'Tap a player to edit, upgrade, release, name a captain (up to 4) or choose your kick returner.'}</span>${fa&&UI.faMsg?`<span class="${UI.faOk?'good':'bad'}">${esc(UI.faMsg)}</span>`:''}</div>`;
  if(fa){const list=S.fa.filter(p=>FILT[UI.rf].includes(p.pos)).sort((a,b)=>b.ovr-a.ovr).slice(0,60);
    h+='<div class="card scroll"><table class="tbl"><thead><tr><th></th><th class="l">Free agent</th><th>Pos</th><th>Ovr</th><th class="l">Potential</th><th>Age</th><th>Spd</th><th>Your starter</th></tr></thead><tbody>';
    for(const p of list){const c=signCost(p);h+=`<tr><td class="l"><button class="btn sm" data-a="sign" data-id="${p.id}"${S.tp>=c&&U.roster.length<ROSTER_MAX?'':' disabled'}>Sign · ${c}</button></td><td class="l">${esc(p.n)}${xfTag(p)}</td><td>${p.pos}</td><td class="ovr">${p.ovr}</td><td class="l">${devTag(p)}</td><td>${p.age}</td><td>${p.spd}</td><td>${lowestStarter(U,p.pos,[])}</td></tr>`;}
    if(!list.length)h+='<tr><td class="l" colspan="8">No free agents at this position.</td></tr>';
    h+='</tbody></table></div>';}
  else{const list=U.roster.filter(p=>FILT[UI.rf].includes(p.pos)).sort((a,b)=>posRank(a)-posRank(b));
    h+='<div class="card scroll"><table class="tbl"><thead><tr><th>No.</th><th class="l">Player</th><th>Pos</th><th>Age</th><th>Ovr</th><th class="l">Potential</th><th>Spd</th><th>Trade value</th></tr></thead><tbody>';
    for(const p of list)h+=`<tr class="pl${isStarter(U,p)?' st':''}${UI.sel===p.id?' cur':''}" data-a="sel" data-id="${p.id}" tabindex="0"><td>${p.num}</td><td class="l">${esc(p.n)}${xfTag(p)}${p.cap?' <span class="tag cap">C</span>':''}${p.kr?' <span class="tag">KR</span>':''}${p.inj?' <span class="tag inj">Out '+p.inj+' wk</span>':''}${isStarter(U,p)?' <span class="tag">Starter</span>':''}</td><td>${p.pos}</td><td>${p.age}</td><td class="ovr">${p.ovr}</td><td class="l">${devTag(p)}</td><td>${p.spd}</td><td>${tradeValue(p).toFixed(1)}</td></tr>`;
    h+='</tbody></table></div>';}
  $('#view').innerHTML=h+'</div>';}

// ----- trades -----
function trRow(p,on,act,T){return `<button class="prow${on?' on':''}" data-a="${act}" data-id="${p.id}" aria-pressed="${on}"><span class="pos">${p.pos}</span><span class="nm">${esc(p.n)}${xfTag(p)}${isStarter(T,p)?' <span class="tag">S</span>':''}</span><span class="muted">${p.age}y</span><span class="ovr">${p.ovr}</span><span class="muted">${tradeValue(p).toFixed(1)}</span></button>`;}
function pkRow(k,on,act){return `<button class="prow pk${on?' on':''}" data-a="${act}" data-id="${k.id}" aria-pressed="${on}"><span class="pos">PK</span><span class="nm">${pickName(k)}</span><span class="muted"></span><span class="ovr">R${k.rd}</span><span class="muted">${pickValue(k).toFixed(1)}</span></button>`;}
function vTrade(){const U=S.teams[S.user],tr=UI.tr;if(tr.team<0||tr.team===S.user)tr.team=S.teams.find(t=>t.id!==S.user).id;const T=S.teams[tr.team];
  tr.give=tr.give.filter(id=>byId(U,id));tr.get=tr.get.filter(id=>byId(T,id));tr.gk=tr.gk.filter(id=>pkById(id)&&pkById(id).own===U.id);tr.tk=tr.tk.filter(id=>pkById(id)&&pkById(id).own===T.id);
  const give=tr.give.map(id=>byId(U,id)),get=tr.get.map(id=>byId(T,id)),gk=tr.gk.map(pkById),tk=tr.tk.map(pkById),open=tradesOpen(),nG=give.length+gk.length,nT=get.length+tk.length;
  let h='<div class="wrap">';
  if(!open)h+='<section class="card"><p class="eyebrow">Trading is closed</p><p class="muted">'+(S.phase==='draft'?'Trades reopen when the draft ends.':'The deadline is after week '+TRADE_DEADLINE+'. Trades reopen in the offseason.')+'</p></section>';
  h+=`<div class="row"><label for="trTeam">Trade with</label><select id="trTeam">${S.teams.filter(t=>t.id!==S.user).map(t=>`<option value="${t.id}"${t.id===T.id?' selected':''}>${t.name} (${t.w}-${t.l})</option>`).join('')}</select><span class="muted">Pick up to 5 players or draft picks on each side. The last column is trade value. Picks always run two drafts ahead.</span></div>`;
  const srt=(a,b)=>posRank(a)-posRank(b);
  h+=`<div class="tr-cols"><section class="card"><h3>You send <span class="muted">${nG}/5</span></h3><div class="plist">${teamPicks(U.id).map(k=>pkRow(k,tr.gk.includes(k.id),'trGk')).join('')}${U.roster.slice().sort(srt).map(p=>trRow(p,tr.give.includes(p.id),'trGive',U)).join('')}</div></section><section class="card"><h3>${T.name} send <span class="muted">${nT}/5</span></h3><div class="plist">${teamPicks(T.id).map(k=>pkRow(k,tr.tk.includes(k.id),'trTk')).join('')}${T.roster.slice().sort(srt).map(p=>trRow(p,tr.get.includes(p.id),'trGet',T)).join('')}</div></section></div>`;
  let sum='<p class="muted">Select players or picks to see what they think.</p>';
  if(nG&&nT){const ev=aiEval(T,give,get,gk,tk),ok=ev.ratio>=1.03;
    sum=`<div class="row"><span>${T.name} interest</span><div class="meter${ok?' ok':''}"><i style="width:${Math.round(clamp(ev.ratio/1.03,0.04,1)*100)}%"></i></div><b>${ok?'They would say yes':ev.ratio>0.8?'Close':'Not enough'}</b></div>`;}
  h+=`<section class="card tr-sum">${sum}<div class="row"><button class="btn" data-a="propose"${open&&nG&&nT?'':' disabled'}>Propose trade</button><button class="btn ghost sm" data-a="trClear">Clear</button>${tr.msg?`<span class="${tr.ok?'good':'bad'}">${esc(tr.msg)}</span>`:''}</div></section>`;
  const v=$('#view'),sc=[...v.querySelectorAll('.plist')].map(e=>e.scrollTop),vs=v.scrollTop;v.innerHTML=h+'</div>';
  [...v.querySelectorAll('.plist')].forEach((e,i)=>{e.scrollTop=sc[i]||0;});v.scrollTop=vs;}

// ----- draft room -----
function vDraft(){const D=S.draft,pk=curPick(),T=S.teams[pk.own],mine=pk.own===S.user,U=S.teams[S.user];
  const left=D.order.slice(D.i).map(pkById).filter(k=>k.own===S.user);
  let h=`<div class="wrap"><section class="card hero"><p class="eyebrow">${D.yr} draft · Round ${pk.rd} · Pick ${D.i+1} of ${D.order.length}</p><h2>${mine?'You are on the clock':sw(T)+' '+T.name+' are on the clock'}</h2>
  <p class="muted">${left.length?'Your picks left: '+left.map(k=>'Round '+k.rd+(k.orig!==k.own?' (from '+S.teams[k.orig].name+')':'')).join(', ')+'.':'You have no picks left in this draft.'}</p>
  <div class="row">${mine?'<button class="btn ghost" data-a="draftAuto">Pick the best fit for me</button>':`<button class="btn" data-a="draftSim">${left.length?'Sim to my next pick':'Sim the rest of the draft'}</button>`}</div></section>`;
  if(mine){const F=['ALL',...POS_ORDER],pool=D.pool.filter(p=>UI.dpos==='ALL'||p.pos===UI.dpos).slice(0,40);
    h+='<div class="row">'+F.map(f=>`<button class="btn ghost sm${UI.dpos===f?' sel':''}" data-a="dpos" data-f="${f}">${f==='ALL'?'All':f}</button>`).join('')+'</div>';
    h+='<div class="card scroll"><table class="tbl"><thead><tr><th></th><th class="l">Prospect</th><th>Pos</th><th>Ovr</th><th class="l">Potential</th><th>Age</th><th>Spd</th><th>You have</th></tr></thead><tbody>';
    for(const p of pool){const have=U.roster.filter(x=>x.pos===p.pos);h+=`<tr><td class="l"><button class="btn sm" data-a="draftPick" data-id="${p.id}">Draft</button></td><td class="l">${esc(p.n)}</td><td>${p.pos}</td><td class="ovr">${p.ovr}</td><td class="l">${devTag(p)}</td><td>${p.age}</td><td>${p.spd}</td><td>${have.length} (best ${have.reduce((m,x)=>Math.max(m,x.ovr),0)})</td></tr>`;}
    h+='</tbody></table></div>';}
  if(D.log.length)h+='<section class="card"><h3>Latest picks</h3><ul class="news">'+D.log.slice(0,10).map(l=>`<li>${l.no}. ${sw(S.teams[l.team])} ${S.teams[l.team].name}: <b>${l.pos} ${esc(l.n)}</b> <span class="muted">${l.ovr} overall</span></li>`).join('')+'</ul></section>';
  $('#view').innerHTML=h+'</div>';}

// ----- league -----
function vLeague(){let h='<div class="wrap">';const U=S.teams[S.user];h+=leadersCard();
  if(S.po){h+='<section class="card"><h3>Playoffs</h3>';const line=g=>{const H=S.teams[g.h],A=S.teams[g.a];return `<li>${sw(A)} ${A.name} ${g.as==null?'':g.as} at ${sw(H)} ${H.name} ${g.hs==null?'':g.hs}</li>`;};
    if(S.po.games.length)h+=`<p class="eyebrow">${roundName()}</p><ul class="news">${S.po.games.map(line).join('')}</ul>`;
    for(const r of S.po.log.slice().reverse())h+=`<p class="eyebrow">${r.name}</p><ul class="news">${r.games.map(line).join('')}</ul>`;
    h+='</section>';}
  if(S.phase==='regular'){h+='<section class="card"><h3>Playoff picture</h3><p class="muted">Each conference sends its four division winners (seeds 1 to 4), then the three best remaining records as wild cards (seeds 5 to 7). The top seed gets a bye.</p><div class="tr-cols">';
    for(const c of ['A','N']){const s=seedsFor(c),row=(T,i,lab,cls)=>`<tr class="${T.id===S.user?'me':''} ${cls}"><td>${i}</td><td class="l">${sw(T)} ${T.name}</td><td>${T.w}-${T.l}</td><td class="l muted">${lab}</td></tr>`;
      h+=`<div class="scroll"><table class="tbl"><thead><tr><th>Seed</th><th class="l">${CONF[c]}</th><th>Rec</th><th class="l">In as</th></tr></thead><tbody>`+s.div.map((T,i)=>row(T,i+1,T.div+' winner','')).join('')+s.wc.map((T,i)=>row(T,i+5,'Wild card','')).join('')+s.hunt.map(T=>row(T,'','In the hunt','out')).join('')+'</tbody></table></div>';}
    h+='</div></section>';}
  if(S.phase!=='offseason'&&S.phase!=='preseason')h+=awardsCard();
  for(const c of ['A','N']){h+=`<section class="card scroll"><h3>${CONF[c]} conference</h3><table class="tbl"><thead><tr><th class="l">Team</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>Ovr</th></tr></thead><tbody>`;
    for(const d of DIVS){h+=`<tr class="div"><td class="l" colspan="6">${d}</td></tr>`;
      for(const T of S.teams.filter(t=>t.conf===c&&t.div===d).sort(cmpTeams))h+=`<tr class="${T.id===S.user?'me':''}"><td class="l">${sw(T)} ${T.name}</td><td>${T.w}</td><td>${T.l}</td><td>${T.pf}</td><td>${T.pa}</td><td>${ratings(T).ovr}</td></tr>`;}
    h+='</tbody></table></section>';}
  h+='<section class="card"><h3>Your schedule</h3><p class="muted">Seventeen games in eighteen weeks: each division rival twice, plus one bye.</p><ul class="news">';
  S.schedule.forEach((wk,i)=>{const g=wk.find(x=>x.h===S.user||x.a===S.user);if(!g){h+=`<li>Week ${i+1}: <span class="muted">Bye</span></li>`;return;}const home=g.h===S.user,opp=S.teams[home?g.a:g.h];
    const res=g.hs==null?'':(()=>{const us=home?g.hs:g.as,th=home?g.as:g.hs;return ` <b class="${us>th?'good':'bad'}">${us>th?'W':'L'} ${us}-${th}</b>`;})();
    h+=`<li>Week ${i+1}: ${home?'vs':'at'} ${sw(opp)} ${opp.name}${opp.conf===U.conf&&opp.div===U.div?' <span class="tag">Division</span>':''}${res}</li>`;});
  $('#view').innerHTML=h+'</ul></section></div>';}

// ===== in-game panel =====
function playSvg(pl){const F=FORMS[pl.f],y=z=>22-clamp(z,-7,22),roles=['WR1','WR3','TE','RB','WR2','QB'];
  let s='<svg viewBox="-27 -1 54 31" aria-hidden="true"><line x1="-27" x2="27" y1="22" y2="22" class="pl-los"/>';
  for(const x of [-2.9,-1.45,0,1.45,2.9])s+=`<rect x="${x-0.55}" y="${y(-0.7)-0.55}" width="1.1" height="1.1" class="pl-ol"/>`;
  if(pl.t==='pass'){const el=Object.keys(pl.r).filter(k=>pl.r[k]).sort((a,b)=>F[a][0]-F[b][0]);
    for(const k of roles){const f=F[k],i=el.indexOf(k);if(i<0){s+=`<circle cx="${f[0]}" cy="${y(f[1])}" r="1.2" class="pl-dot"/>`;continue;}
      const sg=f[0]<-0.5?-1:1;let pts=f[0]+','+y(f[1]);for(const w of RT[pl.r[k]])pts+=' '+clamp(f[0]+w[0]*sg,-26,26)+','+y(f[1]+w[1]);
      s+=`<polyline points="${pts}" class="pl-rt" style="stroke:${RCOL[i%5]}"/><circle cx="${f[0]}" cy="${y(f[1])}" r="1.5" fill="${RCOL[i%5]}"/>`;}}
  else{const c=pl.sneak?F.QB:F.RB,hx=pl.aim;for(const k of roles){const f=F[k];s+=`<circle cx="${f[0]}" cy="${y(f[1])}" r="1.2" class="pl-dot"/>`;}
    s+=`<polyline points="${c[0]},${y(c[1])} ${pl.sneak?hx+','+y(5):hx*0.4+','+y(-2.2)+' '+hx+','+y(1.5)+' '+(hx+(hx>5?2:hx<-5?-2:0))+','+y(9)}" class="pl-rt" style="stroke:${RCOL[2]}"/>`;}
  return s+'</svg>';}
const tmx=g=>!g.ko&&!g.conv&&g.to&&g.to.U>0?`<button class="btn ghost sm" data-a="timeout">Timeout (${g.to.U})${coarse?'':' <span class="kbd">T</span>'}</button>`:'';
function renderPanel(){const p=$('#panel'),g=gm;if(!g){p.innerHTML='';return;}let h='';const uo=g.poss==='U',kb=t=>coarse?'':` <span class="kbd">${t}</span>`,ph=g.phase;
  if(ph==='huddle'){const L=listed(),sit=SIT_NAME[situation()],tabs=uo?GROUPS:[['S','Coach picks'],['Q','All calls']];
    h='<div class="pbtabs">'+tabs.map(t=>`<button class="${g.tab===t[0]?'on':''}" data-a="pbtab" data-t="${t[0]}">${t[1]}</button>`).join('')+`<span class="muted">${uo?'':esc(g.O.name)+' have the ball · '}${sit}${g.conv?' · Two-point try':''}</span></div>`;
    if(uo){h+='<div class="plays">'+L.map((pl,i)=>`<button class="play" data-a="call" data-i="${i}">${playSvg(pl)}<b><span class="kbd">${i+1}</span>${pl.n}</b><small>${FORMS[pl.f].n} · ${pl.d}</small></button>`).join('')+'</div>';
      const d=fgDist(),ex=g.conv?'':(d<=57?`<button class="btn ghost sm" data-a="fg">Kick field goal (${d} yards)</button>`:'')+(g.down===4&&g.q!==5?'<button class="btn ghost sm" data-a="punt">Punt</button>':'')+(canKneel()?'<button class="btn ghost sm" data-a="kneel">Kneel</button>':'')+tmx(g)+'<button class="btn ghost sm" data-a="simDrive">Sim drive</button>';
      if(ex)h=h.replace('<div class="plays">','<div class="row sp">'+ex+'</div><div class="plays">');h+='<p class="muted tip">Tip: turn your phone sideways for a bigger field.</p>';}
    else h+='<div class="row sp">'+tmx(g)+'<button class="btn ghost sm" data-a="simDrive">Sim drive</button></div><div class="plays dcalls">'+L.map((ci,i)=>`<button class="play" data-a="dcall" data-i="${i}"><b><span class="kbd">${i+1}</span>${DCALLS[ci].n}</b><small>${DCALLS[ci].d}</small></button>`).join('')+'</div>';}
  else if(ph==='presnap'&&g.ko)h=uo?`<div class="row"><button class="btn" data-a="snap">Ready${kb('Space')}</button><span class="muted">${esc(g.O.name)} kick off. Catch it with #${g.by.RET.num} ${esc(g.by.RET.rp.n)} and follow your blockers.</span></div>`:`<div class="row"><button class="btn" data-a="snap">Kick off${kb('Space')}</button><button class="btn ghost sm" data-a="sw">Switch player${kb('Q')}</button><span class="muted">You kick off. Steer the player under the blue marker to the returner.</span></div>`;
  else if(ph==='presnap'&&uo)h=`<div class="row"><button class="btn" data-a="snap">Snap${kb('Space')}</button><button class="btn ghost sm" data-a="change">Change play</button>${tmx(g)}<span class="muted"><b>${g.play.n}</b> · ${g.play.t==='pass'?'Throw: '+(coarse?'tap a receiver':'press his number or click him')+'. Routes match the marker colors.':g.play.sneak?'You carry it with the quarterback.':'Follow the orange path. You take over at the handoff.'}</span></div>`;
  else if(ph==='presnap')h=`<div class="row"><button class="btn" data-a="snap">Ready${kb('Space')}</button><button class="btn ghost sm" data-a="sw">Switch player${kb('Q')}</button>${tmx(g)}<span class="muted">You control #${g.ctl.num} ${esc(g.ctl.rp.n)} (${g.ctl.rp.pos}), under the blue marker. Call: ${DCALLS[g.defCall].n}.</span></div>`;
  else if(ph==='live'&&(g.ret?!!(g.carrier&&g.carrier.team==='U'):uo))h=coarse?`<div class="pad"><span class="muted">${g.ret?'Run it back! Drag to steer.':'Drag here or on the field to move.'+(g.play.t==='pass'?' Tap a receiver to throw.':'')}</span><span class="row"><button class="btn ghost" data-a="spin">Spin</button><button class="btn" data-a="juke">Juke</button></span></div>`:`<div class="row"><span class="muted">${g.ret?'Run it back! ':''}Move: WASD or arrows. ${g.play.t==='pass'&&!g.ret?'Throw: press a receiver\'s number or click him. ':''}Juke: Space. Spin: E or F.</span></div>`;
  else if(ph==='live')h=coarse?`<div class="pad"><span class="muted">Drag to move your defender.</span><span class="row"><button class="btn ghost" data-a="sw">Switch</button><button class="btn" data-a="dive">Tackle</button></span></div>`:`<div class="row"><span class="muted">Move: WASD or arrows. Dive tackle or swat a pass: Space. Switch to the defender nearest the ball: Q.</span></div>`;
  else if(ph==='dead'&&g.cele&&!g.cele.picked)h=`<div class="row"><b class="res">${esc(g.msg)}</b><span class="muted">Celebrate:</span>${CELES.map((c,i)=>`<button class="btn sm" data-a="cele" data-i="${i}"><span class="kbd">${i+1}</span>${c}</button>`).join('')}</div>`;
  else if(ph==='dead')h=`<div class="row"><b class="res">${esc(g.msg)}</b></div>`;
  else if(ph==='toss'){const T=g.toss;
    if(T.step==='call')h=`<div class="row"><b class="res">${T.ot?'Overtime coin toss':'Coin toss'}</b><span class="muted">You're the visitors. Call it in the air:</span><button class="btn" data-a="toss" data-v="1"><span class="kbd">1</span>Heads</button><button class="btn" data-a="toss" data-v="0"><span class="kbd">2</span>Tails</button></div>`;
    else if(T.step==='choose')h=`<div class="row"><b class="res">${esc(T.text)} You win the toss.</b></div><div class="row"><button class="btn" data-a="tossPick" data-v="1"><span class="kbd">1</span>${T.ot?'Take the ball':'Receive the kickoff'}</button><button class="btn ghost" data-a="tossPick" data-v="0"><span class="kbd">2</span>${T.ot?'Start on defense':'Kick off'}</button></div>`;
    else h=`<div class="row"><b class="res">${esc(T.text)} ${esc(g.O.name)} win the toss and ${T.ot?'take the ball':'will receive'}.</b><button class="btn" data-a="tossPick" data-v="0">Continue${kb('Space')}</button></div>`;}
  else if(ph==='intro')h=`<div class="row"><button class="btn" data-a="introSkip">Start the game${kb('Space')}</button><span class="muted">${esc(stadOf(g.home)[4])}${S.talk>=2?' Turn your sound on to hear the booth.':''}</span></div>`;
  else if(ph==='flag'){const f=g.pend,a=penCalc(f.pen,f.snap.pos,f.snap.down,f.snap.toGo);
    h=`<div class="row"><b class="res">Flag: ${f.pen.n} on ${esc(g.O.name)}</b></div><div class="row"><button class="btn" data-a="flag" data-v="1"><span class="kbd">1</span>Accept · ${downText(a.down,a.toGo,a.pos)}</button><button class="btn ghost" data-a="flag" data-v="0"><span class="kbd">2</span>Decline · ${esc(g.msg.split(' · Flag')[0])}</button></div><p class="muted">Accept to take the penalty yards and replay the down. Decline to keep the result of the play.</p>`;}
  else if(ph==='pat')h=`<div class="row"><b class="res">After the touchdown</b><button class="btn" data-a="pat" data-two="0"><span class="kbd">1</span>Kick the extra point</button><button class="btn ghost" data-a="pat" data-two="1"><span class="kbd">2</span>Go for two</button></div><p class="muted">The kick is worth 1 point. A two-point try is one play from the 2-yard line.</p>`;
  else if(ph==='kick')h=`<div class="row"><b class="res">${g.kick.xp?'Extra point':g.kick.dist+'-yard field goal'}</b><div class="kick"><span class="zone" style="width:${Math.round(g.kick.tol*100)}%"></span><span class="mk" id="kmk"></span></div><button class="btn" data-a="kick">Kick${kb('Space')}</button></div><p class="muted">Stop the marker inside the green zone.</p>`;
  else if(ph==='kanim')h=`<div class="row"><b class="res">${g.kanim.xp?'Extra point':g.kanim.dist+'-yard field goal'} · ${g.kanim.side==='U'?esc(g.U.name):esc(g.O.name)}</b></div>`;
  else if(g.card)h=`<div class="cardp"><h3>${esc(g.card.title)}</h3>${g.card.lines.map(l=>`<p>${esc(l)}</p>`).join('')}<div class="row"><button class="btn" data-a="cont">${g.card.btn}</button></div></div>`;
  p.className=ph==='live'?'live':'';p.innerHTML=h;}

// ===== actions =====
function togAsset(arr,id){const tr=UI.tr,i=arr.indexOf(id),mine=arr===tr.give||arr===tr.gk,n=mine?tr.give.length+tr.gk.length:tr.get.length+tr.tk.length;if(i>=0)arr.splice(i,1);else if(n<5)arr.push(id);tr.msg='';render();}
const ACT={
  pick(d){S.user=+d.id;UI.tab='home';S.news=['Welcome to '+S.teams[S.user].name+'. Trades are open until week '+TRADE_DEADLINE+'. You start with '+S.tp+' training points.'];save();render();},
  tab(d){UI.tab=d.t;UI.confirmNew=false;UI.tr.msg='';UI.edMsg='';UI.faMsg='';render();$('#view').scrollTop=0;},
  play(){openSetup();render();$('#view').scrollTop=0;},
  setupBack(){UI.setup=null;render();},
  uni(d){if(!UI.setup)return;UI.setup[d.s==='U'?'uU':'uO']=d.k;render();},
  kickoff(){const su=UI.setup;if(!su)return;UI.setup=null;startGame(S.teams[su.opp],su.home,su.uU,su.uO);},
  sim(){UI.setup=null;completeStep(false);render();},
  startDraft(){startDraft();UI.dpos='ALL';render();$('#view').scrollTop=0;},
  draftSim(){simDraftToUser();render();$('#view').scrollTop=0;},
  draftAuto(){if(S.phase==='draft'&&curPick().own===S.user)makePick(aiPick(S.teams[S.user]));render();},
  draftPick(d){if(S.phase!=='draft'||curPick().own!==S.user)return;const p=S.draft.pool.find(x=>x.id===+d.id);if(p)makePick(p);render();$('#view').scrollTop=0;},
  dpos(d){UI.dpos=d.f;render();},
  newSeason(){if(newSeason())render();},
  rf(d){UI.rf=d.f;render();},
  rv(d){UI.rv=d.v;UI.faMsg='';render();},
  sign(d){const p=S.fa.find(x=>x.id===+d.id);if(!p)return;const e=signFA(p);UI.faMsg=e||'Signed '+p.n+'.';UI.faOk=!e;render();},
  sel(d){UI.sel=+d.id;UI.edMsg='';render();$('#view').scrollTop=0;},
  edClose(){UI.sel=null;UI.edMsg='';render();},
  edSave(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;const e=editPlayer(p,$('#edName').value,$('#edNum').value);UI.edMsg=e||'Saved.';UI.edOk=!e;render();},
  edUp(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;const e=upgradePlayer(p);UI.edMsg=e||'Upgraded to '+p.ovr+' overall.';UI.edOk=!e;render();},
  edRel(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;if(UI.relId!==p.id){UI.relId=p.id;UI.edMsg='Tap Release again to let him go to free agency.';UI.edOk=false;render();return;}
    UI.relId=null;const e=releasePlayer(p);if(e){UI.edMsg=e;UI.edOk=false;}else{UI.sel=null;UI.edMsg='';}render();},
  trGive(d){togAsset(UI.tr.give,+d.id);},trGet(d){togAsset(UI.tr.get,+d.id);},trGk(d){togAsset(UI.tr.gk,+d.id);},trTk(d){togAsset(UI.tr.tk,+d.id);},
  trClear(){const tr=UI.tr;tr.give=[];tr.get=[];tr.gk=[];tr.tk=[];tr.msg='';render();},
  propose(){const tr=UI.tr,U=S.teams[S.user],T=S.teams[tr.team];const r=proposeTrade(T,tr.give.map(id=>byId(U,id)),tr.get.map(id=>byId(T,id)),tr.gk.map(pkById),tr.tk.map(pkById));tr.msg=r.msg;tr.ok=r.ok;if(r.ok){tr.give=[];tr.get=[];tr.gk=[];tr.tk=[];}render();},
  offerYes(){const o=S.offer,U=S.teams[S.user],T=S.teams[o.team];const r=proposeTrade(T,o.give.map(id=>byId(U,id)),o.get.map(id=>byId(T,id)),o.giveK.map(pkById),o.getK.map(pkById));S.offer=null;if(!r.ok)S.news.unshift('That offer fell through: '+r.msg);save();render();},
  offerNo(){S.offer=null;save();render();},
  newFr(){if(!UI.confirmNew){UI.confirmNew=true;render();return;}UI.confirmNew=false;try{localStorage.removeItem(KEY);}catch(e){}S=null;UI.sel=null;UI.setup=null;UI.tr={team:-1,give:[],get:[],gk:[],tk:[],msg:'',ok:false};render();},
  pbtab(d){setTab(d.t);},
  call(d){callPlay(listed()[+d.i]);},dcall(d){callDef(listed()[+d.i]);},snap(){snap();},change(){if(gm&&gm.phase==='presnap'&&gm.poss==='U'&&!gm.ko){gm.phase='huddle';renderPanel();}},juke(){juke();},dive(){dive();},sw(){switchCtl();if(gm&&gm.phase==='presnap')renderPanel();},
  pat(d){patPick(d.two==='1');},toss(d){tossCall(d.v==='1');},tossPick(d){tossPick(d.v==='1');},timeout(){useTimeout('U');},spin(){spin();},simDrive(){simDrive();},kneel(){kneel();},flag(d){flagPick(d.v==='1');},introSkip(){endIntro();},voiceTest(){testVoices();},
  edCap(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;const e=toggleCaptain(p);UI.edMsg=e||(p.cap?p.n+' is now a captain.':'Captaincy removed.');UI.edOk=!e;render();},
  edKr(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;setReturner(p);UI.edMsg=p.n+' will return kickoffs.';UI.edOk=true;render();},cele(d){celebrate(+d.i);},
  cont(){cardGo();},punt(){punt();},fg(){tryFG(false);},kick(){kickNow();},simRest(){simRest();}};
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-a]');if(!el)return;const f=ACT[el.dataset.a];if(f)f(el.dataset);});
document.addEventListener('keydown',ev=>{if(ev.key!=='Enter')return;const el=ev.target.closest&&ev.target.closest('tr[data-a]');if(el)ACT[el.dataset.a](el.dataset);else if(ev.target.id==='edName'||ev.target.id==='edNum')ACT.edSave();});
document.addEventListener('change',ev=>{const t=ev.target;
  if(t.id==='trTeam'){const tr=UI.tr;tr.team=+t.value;tr.get=[];tr.tk=[];tr.msg='';render();}
  else if(t.id==='setDiff'){S.diff=+t.value;save();}else if(t.id==='setSpeed'){S.speed=+t.value;save();}else if(t.id==='setDef'){S.playDef=t.value==='1';save();}else if(t.id==='setKo'){S.koRet=t.value==='1';save();}else if(t.id==='setTalk'){S.talk=+t.value;if(S.talk<2)hush();if(S.talk===3){const c=document.getElementById('cap');if(c)c.hidden=true;}save();}
  else if(t.id==='setV0'||t.id==='setV1'){const w=S.voice||['',''];w[t.id==='setV0'?0:1]=t.value;S.voice=w;voices=null;save();testVoices();}else if(t.id==='setVspd'){S.vspd=+t.value;save();testVoices();}else if(t.id==='setCrowd'){S.crowd=t.value==='1';save();}});
initInput();load();render();
try{if(window.speechSynthesis)speechSynthesis.addEventListener('voiceschanged',()=>{voices=null;const a=document.activeElement;if(!gm&&S&&S.user>=0&&UI.tab==='home'&&!UI.setup&&!(a&&/SELECT|INPUT/.test(a.tagName)))render();});}catch(e){}
