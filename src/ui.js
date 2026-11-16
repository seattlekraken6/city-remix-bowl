// ===== menus =====
const $=s=>document.querySelector(s);
const KEY='cityGridiron.v2';
const UI={tab:'home',rf:'ALL',sel:null,edMsg:'',setup:null,dpos:'ALL',tr:{team:-1,give:[],get:[],gk:[],tk:[],msg:'',ok:false},confirmNew:false};
const coarse=window.matchMedia&&matchMedia('(pointer:coarse)').matches;
function save(){if(!S||S.user<0)return;S.nid=NID;try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function load(){try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(o&&o.v===2&&o.teams&&o.teams.length===32&&o.user>=0){S=o;NID=S.nid||1;return true;}}}catch(e){}return false;}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sw=(T,c)=>`<span class="sw${c?' '+c:''}" style="--a:${T.c1};--b:${T.c2}"></span>`;
const byId=(T,id)=>T.roster.find(p=>p.id===id);
const pkById=id=>S.picks.find(k=>k.id===id);
const posRank=p=>POS_ORDER.indexOf(p.pos)*1000-p.ovr;
const xfTag=p=>p.xf?' <span class="xf" title="X-Factor: '+XF[p.pos][0]+'">X</span>':'';
const phaseName=()=>S.phase==='regular'?'Week '+(S.week+1):S.phase==='playoffs'?roundName():S.phase==='draft'?S.draft.yr+' draft':S.phase==='preseason'?'Preseason':'Offseason';

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
function settingsRow(){return `<div class="row set"><label for="setDiff">Difficulty</label><select id="setDiff">${DIFFS.map((d,i)=>`<option value="${i}"${S.diff===i?' selected':''}>${d}</option>`).join('')}</select>
  <label for="setDef">Defense</label><select id="setDef"><option value="1"${S.playDef?' selected':''}>I play defense</option><option value="0"${S.playDef?'':' selected'}>Simulate defense</option></select></div>`;}
function setupCard(lab){const su=UI.setup,U=S.teams[S.user],O=S.teams[su.opp],rival=U.conf===O.conf&&U.div===O.div;
  const clash=colDist(UNI[U.abbr][su.uU][0],UNI[O.abbr][su.uO][0])<110;
  return `<section class="card hero"><p class="eyebrow">${lab} · ${su.home?'Home':'Away'}${rival?' · Division rivalry game':''}</p><h2>Pick the uniforms</h2>
  <div class="unis">${uniPicker(U,su.uU,'U')}${uniPicker(O,su.uO,'O')}</div>${clash?'<p class="bad">These two jerseys look alike. Pick a different one for either team.</p>':''}
  ${settingsRow()}<div class="row"><button class="btn" data-a="kickoff">Kick off</button><button class="btn ghost" data-a="setupBack">Back</button></div></section>`;}

// ----- home -----
function assetLine(T,ids,kids){return ids.map(id=>byId(T,id)).map(p=>`<b>${p.pos} ${esc(p.n)}</b>${xfTag(p)} <span class="muted">${p.ovr} overall, age ${p.age}</span>`).concat(kids.map(id=>`<b>${pickName(pkById(id))} pick</b>`)).join(', ');}
function offerCard(){const o=S.offer;if(!o||!tradesOpen())return '';const T=S.teams[o.team],U=S.teams[S.user];
  if(o.give.some(id=>!byId(U,id))||o.get.some(id=>!byId(T,id))||o.giveK.some(id=>!pkById(id)||pkById(id).own!==U.id)||o.getK.some(id=>!pkById(id)||pkById(id).own!==T.id)){S.offer=null;return '';}
  return `<section class="card"><p class="eyebrow">Trade offer from ${T.name}</p><p>They send ${assetLine(T,o.get,o.getK)}</p><p>They want ${assetLine(U,o.give,o.giveK)}</p><div class="row"><button class="btn sm" data-a="offerYes">Accept</button><button class="btn ghost sm" data-a="offerNo">Decline</button></div></section>`;}
function vHome(){if(S.phase==='draft')return vDraft();const U=S.teams[S.user],r=ratings(U);let h='<div class="wrap">';
  if(S.phase==='offseason'){const ch=S.teams[S.champ];
    h+=`<section class="card hero"><p class="eyebrow">${S.season} season complete</p><h2>${ch.id===S.user?'You won the Gridiron Bowl':ch.name+' won the Gridiron Bowl'}</h2><p class="muted">Trades are open. When you start the draft, every player ages a year first: young players improve, veterans decline, and some retire.</p><div class="row"><button class="btn" data-a="startDraft">Start the ${S.season+1} draft</button></div></section>`;}
  else if(S.phase==='preseason'){const over=U.roster.length-ROSTER_MAX;
    h+=`<section class="card hero"><p class="eyebrow">Draft complete</p><h2>Ready for ${S.season+1}</h2><p class="muted">You have ${U.roster.length} players. The limit is ${ROSTER_MAX}. Trades are open.</p>${over>0?`<p class="bad">Release ${over} player${over>1?'s':''} on the Roster tab before the season starts.</p>`:''}<div class="row"><button class="btn" data-a="newSeason"${over>0?' disabled':''}>Start ${S.season+1} season</button></div></section>`;}
  else{const m=userMatch(),lab=S.phase==='regular'?'Week '+(S.week+1)+' of '+S.schedule.length:roundName();
    if(m&&UI.setup)h+=setupCard(lab);
    else if(m){const home=m.h===S.user,opp=S.teams[home?m.a:m.h];
      h+=`<section class="card hero"><p class="eyebrow">${lab} · ${home?'Home':'Away'}</p><div class="match">${teamBlock(U,r)}<span class="vs">${home?'vs':'at'}</span>${teamBlock(opp,ratings(opp))}</div><div class="row"><button class="btn" data-a="play">Play game</button><button class="btn ghost" data-a="sim">Sim game</button></div></section>`;}
    else{const alive=S.po&&(S.po.alive.A.includes(S.user)||S.po.alive.N.includes(S.user));
      h+=`<section class="card hero"><p class="eyebrow">${lab}</p><h2>${alive?'You earned a first-round bye':'Your season is over'}</h2><div class="row"><button class="btn" data-a="sim">${alive?'Continue':'Sim this round'}</button></div></section>`;}}
  h+=offerCard();
  if(S.news.length)h+='<section class="card"><h3>News</h3><ul class="news">'+S.news.slice(0,8).map(n=>`<li>${esc(n)}</li>`).join('')+'</ul></section>';
  h+=`<section class="card"><h3>Settings</h3>${settingsRow()}<p class="muted">Rookie is forgiving. Legend makes defenders faster to react, tackles surer, and the other team's quarterback sharper.</p></section>`;
  h+=`<section class="card"><h3>How to play</h3><ul class="news"><li><b>Offense:</b> pick a play, snap with <b>Space</b> or a tap, move with <b>WASD</b> or the arrow keys (drag on a phone). Throw with a receiver's number or by tapping him. Green is open, red is covered. <b>Space</b> jukes.</li><li><b>Defense:</b> pick a call, then steer the player with the blue marker. Run into the ball carrier to tackle, press <b>Space</b> to dive at him, or press it as a pass arrives to swat it. <b>Q</b> switches to the defender nearest the ball.</li><li><b>X-Factors:</b> stars marked X get a boost once they are in the zone, shown by a gold ring.</li><li><b>Training points:</b> earned every game. Spend them on the Roster tab to raise a player's rating.</li></ul><div class="row"><button class="btn ghost sm" data-a="newFr">${UI.confirmNew?'Tap again to erase this franchise':'Start a new franchise'}</button></div></section>`;
  $('#view').innerHTML=h+'</div>';}

// ----- roster and player editor -----
function editor(U){const p=byId(U,UI.sel);if(!p){UI.sel=null;return '';}const c=upgradeCost(p);
  return `<section class="card edit"><div class="row"><h3>${esc(p.n)}</h3><span class="muted">${p.pos} · ${p.ovr} overall · potential ${p.pot} · age ${p.age} · speed ${p.spd}</span></div>
  ${p.xf?`<p><span class="xf">X</span> <b>${XF[p.pos][0]}.</b> ${XF[p.pos][1]}</p>`:`<p class="muted">Reaches X-Factor (${XF[p.pos][0]}) at ${XF_OVR} overall.</p>`}
  <div class="row"><label for="edName">Name</label><input id="edName" value="${esc(p.n)}" maxlength="22" autocomplete="off"><label for="edNum">Number</label><input id="edNum" type="number" min="0" max="99" value="${p.num}" inputmode="numeric"><button class="btn sm" data-a="edSave">Save</button></div>
  <div class="row"><button class="btn sm" data-a="edUp"${c&&S.tp>=c?'':' disabled'}>${c?'Upgrade +1 overall ('+c+' point'+(c>1?'s':'')+')':'Maxed out'}</button><button class="btn ghost sm" data-a="edRel">Release</button><button class="btn ghost sm" data-a="edClose">Close</button>${UI.edMsg?`<span class="${UI.edOk?'good':'bad'}">${esc(UI.edMsg)}</span>`:''}</div></section>`;}
function vRoster(){const U=S.teams[S.user],F={ALL:POS_ORDER,OFF:['QB','RB','WR','TE','OL'],DEF:['DL','LB','CB','S'],K:['K']};
  const list=U.roster.filter(p=>F[UI.rf].includes(p.pos)).sort((a,b)=>posRank(a)-posRank(b));
  let h='<div class="wrap">'+editor(U)+'<div class="row">'+[['ALL','Everyone'],['OFF','Offense'],['DEF','Defense'],['K','Kicker']].map(f=>`<button class="btn ghost sm${UI.rf===f[0]?' sel':''}" data-a="rf" data-f="${f[0]}">${f[1]}</button>`).join('')+`<span class="muted">${U.roster.length} of ${ROSTER_MAX} players · tap a player to edit, upgrade or release</span></div>`;
  h+='<div class="card scroll"><table class="tbl"><thead><tr><th>No.</th><th class="l">Player</th><th>Pos</th><th>Age</th><th>Ovr</th><th>Pot</th><th>Spd</th><th>Trade value</th></tr></thead><tbody>';
  for(const p of list)h+=`<tr class="pl${isStarter(U,p)?' st':''}${UI.sel===p.id?' cur':''}" data-a="sel" data-id="${p.id}" tabindex="0"><td>${p.num}</td><td class="l">${esc(p.n)}${xfTag(p)}${isStarter(U,p)?' <span class="tag">Starter</span>':''}</td><td>${p.pos}</td><td>${p.age}</td><td class="ovr">${p.ovr}</td><td>${p.pot}</td><td>${p.spd}</td><td>${tradeValue(p).toFixed(1)}</td></tr>`;
  $('#view').innerHTML=h+'</tbody></table></div></div>';}

// ----- trades -----
function trRow(p,on,act,T){return `<button class="prow${on?' on':''}" data-a="${act}" data-id="${p.id}" aria-pressed="${on}"><span class="pos">${p.pos}</span><span class="nm">${esc(p.n)}${xfTag(p)}${isStarter(T,p)?' <span class="tag">S</span>':''}</span><span class="muted">${p.age}y</span><span class="ovr">${p.ovr}</span><span class="muted">${tradeValue(p).toFixed(1)}</span></button>`;}
function pkRow(k,on,act){return `<button class="prow pk${on?' on':''}" data-a="${act}" data-id="${k.id}" aria-pressed="${on}"><span class="pos">PK</span><span class="nm">${pickName(k)}</span><span class="muted"></span><span class="ovr">R${k.rd}</span><span class="muted">${pickValue(k).toFixed(1)}</span></button>`;}
function vTrade(){const U=S.teams[S.user],tr=UI.tr;if(tr.team<0||tr.team===S.user)tr.team=S.teams.find(t=>t.id!==S.user).id;const T=S.teams[tr.team];
  tr.give=tr.give.filter(id=>byId(U,id));tr.get=tr.get.filter(id=>byId(T,id));tr.gk=tr.gk.filter(id=>pkById(id)&&pkById(id).own===U.id);tr.tk=tr.tk.filter(id=>pkById(id)&&pkById(id).own===T.id);
  const give=tr.give.map(id=>byId(U,id)),get=tr.get.map(id=>byId(T,id)),gk=tr.gk.map(pkById),tk=tr.tk.map(pkById),open=tradesOpen(),nG=give.length+gk.length,nT=get.length+tk.length;
  let h='<div class="wrap">';
  if(!open)h+='<section class="card"><p class="eyebrow">Trading is closed</p><p class="muted">'+(S.phase==='draft'?'Trades reopen when the draft ends.':'The deadline is after week '+TRADE_DEADLINE+'. Trades reopen in the offseason.')+'</p></section>';
  h+=`<div class="row"><label for="trTeam">Trade with</label><select id="trTeam">${S.teams.filter(t=>t.id!==S.user).map(t=>`<option value="${t.id}"${t.id===T.id?' selected':''}>${t.name} (${t.w}-${t.l})</option>`).join('')}</select><span class="muted">Pick up to 3 players or draft picks on each side. The last column is trade value.</span></div>`;
  const srt=(a,b)=>posRank(a)-posRank(b);
  h+=`<div class="tr-cols"><section class="card"><h3>You send <span class="muted">${nG}/3</span></h3><div class="plist">${teamPicks(U.id).map(k=>pkRow(k,tr.gk.includes(k.id),'trGk')).join('')}${U.roster.slice().sort(srt).map(p=>trRow(p,tr.give.includes(p.id),'trGive',U)).join('')}</div></section><section class="card"><h3>${T.name} send <span class="muted">${nT}/3</span></h3><div class="plist">${teamPicks(T.id).map(k=>pkRow(k,tr.tk.includes(k.id),'trTk')).join('')}${T.roster.slice().sort(srt).map(p=>trRow(p,tr.get.includes(p.id),'trGet',T)).join('')}</div></section></div>`;
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
    h+='<div class="card scroll"><table class="tbl"><thead><tr><th></th><th class="l">Prospect</th><th>Pos</th><th>Ovr</th><th>Pot</th><th>Age</th><th>Spd</th><th>You have</th></tr></thead><tbody>';
    for(const p of pool){const have=U.roster.filter(x=>x.pos===p.pos);h+=`<tr><td class="l"><button class="btn sm" data-a="draftPick" data-id="${p.id}">Draft</button></td><td class="l">${esc(p.n)}</td><td>${p.pos}</td><td class="ovr">${p.ovr}</td><td>${p.pot}</td><td>${p.age}</td><td>${p.spd}</td><td>${have.length} (best ${have.reduce((m,x)=>Math.max(m,x.ovr),0)})</td></tr>`;}
    h+='</tbody></table></div>';}
  if(D.log.length)h+='<section class="card"><h3>Latest picks</h3><ul class="news">'+D.log.slice(0,10).map(l=>`<li>${l.no}. ${sw(S.teams[l.team])} ${S.teams[l.team].name}: <b>${l.pos} ${esc(l.n)}</b> <span class="muted">${l.ovr} overall</span></li>`).join('')+'</ul></section>';
  $('#view').innerHTML=h+'</div>';}

// ----- league -----
function vLeague(){let h='<div class="wrap">';
  if(S.po){h+='<section class="card"><h3>Playoffs</h3>';const line=g=>{const H=S.teams[g.h],A=S.teams[g.a];return `<li>${sw(A)} ${A.name} ${g.as==null?'':g.as} at ${sw(H)} ${H.name} ${g.hs==null?'':g.hs}</li>`;};
    if(S.po.games.length)h+=`<p class="eyebrow">${roundName()}</p><ul class="news">${S.po.games.map(line).join('')}</ul>`;
    for(const r of S.po.log.slice().reverse())h+=`<p class="eyebrow">${r.name}</p><ul class="news">${r.games.map(line).join('')}</ul>`;
    h+='</section>';}
  if(S.phase==='regular'){h+='<section class="card"><h3>Playoff picture</h3><p class="muted">Each conference sends its four division winners (seeds 1 to 4), then the three best remaining records as wild cards (seeds 5 to 7). The top seed gets a bye.</p><div class="tr-cols">';
    for(const c of ['A','N']){const s=seedsFor(c),row=(T,i,lab,cls)=>`<tr class="${T.id===S.user?'me':''} ${cls}"><td>${i}</td><td class="l">${sw(T)} ${T.name}</td><td>${T.w}-${T.l}</td><td class="l muted">${lab}</td></tr>`;
      h+=`<div class="scroll"><table class="tbl"><thead><tr><th>Seed</th><th class="l">${CONF[c]}</th><th>Rec</th><th class="l">In as</th></tr></thead><tbody>`+s.div.map((T,i)=>row(T,i+1,T.div+' winner','')).join('')+s.wc.map((T,i)=>row(T,i+5,'Wild card','')).join('')+s.hunt.map(T=>row(T,'','In the hunt','out')).join('')+'</tbody></table></div>';}
    h+='</div></section>';}
  for(const c of ['A','N']){h+=`<section class="card scroll"><h3>${CONF[c]} conference</h3><table class="tbl"><thead><tr><th class="l">Team</th><th>W</th><th>L</th><th>PF</th><th>PA</th><th>Ovr</th></tr></thead><tbody>`;
    for(const d of DIVS){h+=`<tr class="div"><td class="l" colspan="6">${d}</td></tr>`;
      for(const T of S.teams.filter(t=>t.conf===c&&t.div===d).sort(cmpTeams))h+=`<tr class="${T.id===S.user?'me':''}"><td class="l">${sw(T)} ${T.name}</td><td>${T.w}</td><td>${T.l}</td><td>${T.pf}</td><td>${T.pa}</td><td>${ratings(T).ovr}</td></tr>`;}
    h+='</tbody></table></section>';}
  h+='<section class="card"><h3>Your schedule</h3><ul class="news">';
  S.schedule.forEach((wk,i)=>{const g=wk.find(x=>x.h===S.user||x.a===S.user);if(!g)return;const home=g.h===S.user,opp=S.teams[home?g.a:g.h];
    const res=g.hs==null?'':(()=>{const us=home?g.hs:g.as,th=home?g.as:g.hs;return ` <b class="${us>th?'good':'bad'}">${us>th?'W':'L'} ${us}-${th}</b>`;})();
    h+=`<li>Week ${i+1}: ${home?'vs':'at'} ${sw(opp)} ${opp.name}${res}</li>`;});
  $('#view').innerHTML=h+'</ul></section></div>';}

// ===== in-game panel =====
function playSvg(pl){const X={WR1:-19,WR2:19,WR3:-9.5,TE:4.5,RB:1.8},Z={WR1:0,WR2:0,WR3:0,TE:0,RB:-5},y=z=>22-clamp(z,-6,22);
  let s='<svg viewBox="-27 -1 54 30" aria-hidden="true"><line x1="-27" x2="27" y1="22" y2="22" class="pl-los"/>';
  if(pl.t==='pass'){for(const k in pl.r){const sg=X[k]>=0?1:-1;let pts=X[k]+','+y(Z[k]);for(const w of pl.r[k])pts+=' '+clamp(X[k]+w[0]*sg,-26,26)+','+y(Z[k]+w[1]);
      s+=`<polyline points="${pts}" class="pl-rt"/><circle cx="${X[k]}" cy="${y(Z[k])}" r="1.5" class="pl-dot"/>`;}}
  else{s+=`<polyline points="${pl.toss?'3.6,'+y(-5)+' 12,'+y(-3)+' 17,'+y(9):'1.8,'+y(-5)+' 0.6,'+y(-1)+' 0,'+y(11)}" class="pl-rt"/><circle cx="${pl.toss?3.6:1.8}" cy="${y(-5)}" r="1.5" class="pl-dot"/>`;
    for(const x of [-2.9,-1.45,0,1.45,2.9])s+=`<rect x="${x-0.6}" y="${y(-0.7)-0.6}" width="1.2" height="1.2" class="pl-ol"/>`;}
  return s+'</svg>';}
function renderPanel(){const p=$('#panel'),g=gm;if(!g){p.innerHTML='';return;}let h='';const uo=g.poss==='U',kb=t=>coarse?'':` <span class="kbd">${t}</span>`;
  if(g.phase==='huddle'&&uo){const d=fgDist();
    h='<div class="plays">'+PLAYS.map((pl,i)=>`<button class="play" data-a="call" data-i="${i}">${playSvg(pl)}<b><span class="kbd">${i+1}</span>${pl.n}</b><small>${pl.d}</small></button>`).join('')+'</div>';
    const ex=(d<=57?`<button class="btn ghost sm" data-a="fg">Kick field goal (${d} yards)</button>`:'')+(g.down===4&&g.q!==5?'<button class="btn ghost sm" data-a="punt">Punt</button>':'');
    if(ex)h+='<div class="row sp">'+ex+'</div>';h+='<p class="muted tip">Tip: turn your phone sideways for a bigger field.</p>';}
  else if(g.phase==='huddle')h='<div class="plays dcalls">'+DCALLS.map((c,i)=>`<button class="play" data-a="dcall" data-i="${i}"><b><span class="kbd">${i+1}</span>${c.n}</b><small>${c.d}</small></button>`).join('')+'</div><p class="muted sp">'+esc(g.O.name)+' have the ball. Pick a defense.</p>';
  else if(g.phase==='presnap'&&uo)h=`<div class="row"><button class="btn" data-a="snap">Snap${kb('Space')}</button><button class="btn ghost sm" data-a="change">Change play</button><span class="muted">${g.play.t==='pass'?'Throw: '+(coarse?'tap a receiver':'press his number or click him')+'. Green is open.':'You run with the back as soon as he gets the ball.'}</span></div>`;
  else if(g.phase==='presnap')h=`<div class="row"><button class="btn" data-a="snap">Ready${kb('Space')}</button><button class="btn ghost sm" data-a="sw">Switch player${kb('Q')}</button><span class="muted">You control #${g.ctl.num} ${esc(g.ctl.rp.n)} (${g.ctl.rp.pos}), under the blue marker. Call: ${DCALLS[g.dcall].n}.</span></div>`;
  else if(g.phase==='live'&&uo)h=coarse?`<div class="pad"><span class="muted">Drag here or on the field to move.${g.play.t==='pass'?' Tap a receiver to throw.':''}</span><button class="btn" data-a="juke">Juke</button></div>`:`<div class="row"><span class="muted">Move: WASD or arrows. ${g.play.t==='pass'?'Throw: press a receiver\'s number or click him. ':''}Juke: Space.</span></div>`;
  else if(g.phase==='live')h=coarse?`<div class="pad"><span class="muted">Drag to move your defender.</span><span class="row"><button class="btn ghost" data-a="sw">Switch</button><button class="btn" data-a="dive">Tackle</button></span></div>`:`<div class="row"><span class="muted">Move: WASD or arrows. Dive tackle or swat a pass: Space. Switch to the defender nearest the ball: Q.</span></div>`;
  else if(g.phase==='dead')h=`<div class="row"><b class="res">${esc(g.msg)}</b></div>`;
  else if(g.phase==='kick')h=`<div class="row"><b class="res">${g.kick.dist}-yard field goal</b><div class="kick"><span class="zone" style="width:${Math.round(g.kick.tol*100)}%"></span><span class="mk" id="kmk"></span></div><button class="btn" data-a="kick">Kick${kb('Space')}</button></div><p class="muted">Stop the marker inside the green zone.</p>`;
  else if(g.card)h=`<div class="cardp"><h3>${esc(g.card.title)}</h3>${g.card.lines.map(l=>`<p>${esc(l)}</p>`).join('')}<div class="row"><button class="btn" data-a="cont">${g.card.btn}</button></div></div>`;
  p.className=g.phase==='live'?'live':'';p.innerHTML=h;}

// ===== actions =====
function togAsset(arr,id){const tr=UI.tr,i=arr.indexOf(id),mine=arr===tr.give||arr===tr.gk,n=mine?tr.give.length+tr.gk.length:tr.get.length+tr.tk.length;if(i>=0)arr.splice(i,1);else if(n<3)arr.push(id);tr.msg='';render();}
const ACT={
  pick(d){S.user=+d.id;UI.tab='home';S.news=['Welcome to '+S.teams[S.user].name+'. Trades are open until week '+TRADE_DEADLINE+'. You start with '+S.tp+' training points.'];save();render();},
  tab(d){UI.tab=d.t;UI.confirmNew=false;UI.tr.msg='';UI.edMsg='';render();$('#view').scrollTop=0;},
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
  sel(d){UI.sel=+d.id;UI.edMsg='';render();$('#view').scrollTop=0;},
  edClose(){UI.sel=null;UI.edMsg='';render();},
  edSave(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;const e=editPlayer(p,$('#edName').value,$('#edNum').value);UI.edMsg=e||'Saved.';UI.edOk=!e;render();},
  edUp(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;const e=upgradePlayer(p);UI.edMsg=e||'Upgraded to '+p.ovr+' overall.';UI.edOk=!e;render();},
  edRel(){const p=byId(S.teams[S.user],UI.sel);if(!p)return;if(UI.relId!==p.id){UI.relId=p.id;UI.edMsg='Tap Release again to let him go for good.';UI.edOk=false;render();return;}
    UI.relId=null;const e=releasePlayer(p);if(e){UI.edMsg=e;UI.edOk=false;}else{UI.sel=null;UI.edMsg='';}render();},
  trGive(d){togAsset(UI.tr.give,+d.id);},trGet(d){togAsset(UI.tr.get,+d.id);},trGk(d){togAsset(UI.tr.gk,+d.id);},trTk(d){togAsset(UI.tr.tk,+d.id);},
  trClear(){const tr=UI.tr;tr.give=[];tr.get=[];tr.gk=[];tr.tk=[];tr.msg='';render();},
  propose(){const tr=UI.tr,U=S.teams[S.user],T=S.teams[tr.team];const r=proposeTrade(T,tr.give.map(id=>byId(U,id)),tr.get.map(id=>byId(T,id)),tr.gk.map(pkById),tr.tk.map(pkById));tr.msg=r.msg;tr.ok=r.ok;if(r.ok){tr.give=[];tr.get=[];tr.gk=[];tr.tk=[];}render();},
  offerYes(){const o=S.offer,U=S.teams[S.user],T=S.teams[o.team];const r=proposeTrade(T,o.give.map(id=>byId(U,id)),o.get.map(id=>byId(T,id)),o.giveK.map(pkById),o.getK.map(pkById));S.offer=null;if(!r.ok)S.news.unshift('That offer fell through: '+r.msg);save();render();},
  offerNo(){S.offer=null;save();render();},
  newFr(){if(!UI.confirmNew){UI.confirmNew=true;render();return;}UI.confirmNew=false;try{localStorage.removeItem(KEY);}catch(e){}S=null;UI.sel=null;UI.setup=null;UI.tr={team:-1,give:[],get:[],gk:[],tk:[],msg:'',ok:false};render();},
  call(d){callPlay(+d.i);},dcall(d){callDef(+d.i);},snap(){snap();},change(){if(gm&&gm.phase==='presnap'&&gm.poss==='U')setHuddle();},juke(){juke();},dive(){dive();},sw(){switchCtl();if(gm&&gm.phase==='presnap')renderPanel();},
  cont(){cardGo();},punt(){punt();},fg(){tryFG();},kick(){kickNow();},simRest(){simRest();}};
document.addEventListener('click',ev=>{const el=ev.target.closest('[data-a]');if(!el)return;const f=ACT[el.dataset.a];if(f)f(el.dataset);});
document.addEventListener('keydown',ev=>{if(ev.key!=='Enter')return;const el=ev.target.closest&&ev.target.closest('tr[data-a]');if(el)ACT[el.dataset.a](el.dataset);else if(ev.target.id==='edName'||ev.target.id==='edNum')ACT.edSave();});
document.addEventListener('change',ev=>{const t=ev.target;
  if(t.id==='trTeam'){const tr=UI.tr;tr.team=+t.value;tr.get=[];tr.tk=[];tr.msg='';render();}
  else if(t.id==='setDiff'){S.diff=+t.value;save();}else if(t.id==='setDef'){S.playDef=t.value==='1';save();}});
initInput();load();render();
