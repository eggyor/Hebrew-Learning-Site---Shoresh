/* ===== 出題 ===== */
let S=null,tab='today',wallFilter='全部';
const sessionInProgress=()=>Boolean(S&&!S.done&&S.i<S.q.length);
window.addEventListener('beforeunload',e=>{
  if(!sessionInProgress())return;
  e.preventDefault();e.returnValue='';
});
const cluster=h=>h.match(/[א-ת][֑-ׇ]*/g)||[];
function weakest(n){return Object.keys(ST.cards).sort((a,b)=>ST.cards[a].box-ST.cards[b].box||Math.random()-.5).slice(0,n)}
function dueIds(){const t=dayNum();return Object.keys(ST.cards).filter(id=>ST.cards[id].due<=t).sort((a,b)=>ST.cards[a].box-ST.cards[b].box)}
function newIds(n){return ALL.filter(w=>!ST.cards[w.id]).slice(0,n).map(w=>w.id)}
function typeFor(id){
  const w=BY[id],b=ST.cards[id]?ST.cards[id].box:0,t3=cluster(w.h).length>=3;
  if(b<=1)return 'mc'; if(b===2)return 'rc';
  if(b===3)return t3?'tile':'rc';
  const p=['tile','rc','mc'].filter(x=>x!=='tile'||t3);
  if(w.s.length>=2&&Math.random()<.4)return 'sn';
  return p[Math.floor(Math.random()*p.length)];
}
function startSession(mode){
  const news=mode==='practice'?[]:newIds(ST.perSession);
  let rev=shuffle(mode==='practice'?weakest(10):dueIds().slice(0,8));
  const q=[];
  rev.forEach(id=>q.push({id,type:typeFor(id)}));
  news.forEach((id,i)=>{q.push({id,type:'intro'});if(i>0)q.push({id:news[i-1],type:'mc'})});
  if(news.length){
    q.push({id:news[news.length-1],type:'mc'});
    shuffle(news).forEach(id=>q.push({id,type:'rc'}));
    shuffle(news.filter(id=>BY[id].s.length>=2)).slice(0,2).forEach(id=>q.push({id,type:'sn'}));
    news.filter(id=>cluster(BY[id].h).length>=3).slice(0,2).forEach(id=>q.push({id,type:'tile'}));
  }
  const mids=shuffle(news.concat(rev)).slice(0,5);
  if(mids.length>=4)q.push({type:'match',ids:mids});
  S={q,i:0,right:0,wrong:0,combo:0,maxCombo:0,xp:0,missed:new Set(),learned:news.length,mastered:0,timer:null,mode,requeued:{}};
  renderToday();
}
function opts(id,key,n=4){
  const w=BY[id];
  let pool=ALL.filter(x=>x.id!==id&&(key==='zh'?short(x)!==short(w):x[key]!==w[key]));
  const same=shuffle(pool.filter(x=>x.pos===w.pos)),rest=shuffle(pool.filter(x=>x.pos!==w.pos));
  const pick=[],kf=x=>key==='zh'?short(x):x[key],seen=new Set([kf(w)]);
  for(const x of same.concat(rest)){if(pick.length>=n-1)break;if(!seen.has(kf(x))){seen.add(kf(x));pick.push(x)}}
  return shuffle(pick.concat(w));
}
function shell(inner){
  const bars=S.q.map((t,i)=>`<i class="${i<S.i?(t.res===0?'no':'ok'):i===S.i?'cur':''}"></i>`).join('');
  return `<div class="prog" aria-label="進度 ${S.i+1}/${S.q.length}">${bars}</div>
    <div class="combo" id="combo">${S.combo>=2?`連對 ${S.combo}`:' '}</div>${inner}`;
}
function renderToday(){
  clearTimeout(S&&S.timer);
  if(!S||S.i>=S.q.length&&!S.done){return home()}
  if(S.done)return summary();
  const t=S.q[S.i];
  ({intro:rIntro,mc:rChoice,rc:rChoice,sn:rSense,tile:rTile,match:rMatch})[t.type](t);
}
/* 首頁上方的提醒：存檔失敗、或很久沒備份。 */
function notices(){
  let h='';
  if(!storageOK)h+='<div class="banner" role="alert">這個瀏覽器無法儲存進度（可能是無痕模式）。請到「進度」頁匯出備份，否則關掉頁面就會消失。</div>';
  else if(Object.keys(ST.cards).length>=20){
    const days=ST.lastExport?(Date.now()-ST.lastExport)/864e5:Infinity;
    if(days>14)h+='<div class="banner"><span>'+(ST.lastExport?'已超過 2 週沒有備份進度':'還沒備份過進度')+'，建議現在匯出一份。</span><button id="goBackup">前往備份</button></div>';
  }
  return h;
}
function home(){
  header();
  const due=dueIds().length,left=ALL.length-Object.keys(ST.cards).length,n=Math.min(ST.perSession,left);
  const learned=Object.keys(ST.cards).length,mastered=Object.values(ST.cards).filter(c=>c.box>=5).length;
  const nothing=!due&&!n;
  view.innerHTML=`<section id="hero-slot" data-slot="hero">${renderHero()}</section>${notices()}<div class="card stack">
    <div><h2>${nothing?'今天的都完成了':'今日闖關'}</h2>
    <p class="muted">每一輪約 3 分鐘，每個詞會用不同方式出現。答錯的詞會自動再出現。</p></div>
    <div class="row" style="gap:8px">
      <span class="chip">待複習 <b>${due}</b></span><span class="chip">新詞 <b>${n}</b></span>
      <span class="chip">已學 <b>${learned}/${ALL.length}</b></span><span class="chip">熟練 <b>${mastered}</b></span></div>
    ${nothing?'':`<button class="btn" id="go">開始</button>`}
    ${learned?`<button class="btn ghost" id="prac">加強練習：最弱的 10 個詞</button>`:''}
    <div class="muted">每輪新詞數：
      ${[3,5,8].map(k=>`<button class="f" data-per="${k}" aria-pressed="${ST.perSession===k}">${k}</button>`).join(' ')}</div></div>`;
  const gb=$('#goBackup');if(gb)gb.onclick=()=>setTab('more');
  const g=$('#go');if(g)g.onclick=()=>startSession('daily');
  const p=$('#prac');if(p)p.onclick=()=>startSession('practice');
  view.querySelectorAll('[data-per]').forEach(b=>b.onclick=()=>{ST.perSession=+b.dataset.per;save();home()});
}
function rIntro(t){
  const w=BY[t.id];
  view.innerHTML=shell(wordCard(w)+`<button class="btn" id="ok">記住了，下一個</button>`);
  bindSay(view);
  $('#ok').onclick=()=>{
    if(!ST.cards[w.id])ST.cards[w.id]={box:0,due:dayNum(),right:0,wrong:0,learnedAt:Date.now()};
    t.res=1;logActivity({a:1,r:1});save();sOK();next();
  };
}
function stillPending(id){return S.q.slice(S.i+1).some(t=>t.id===id||(t.ids&&t.ids.includes(id)&&false))}
function answer(t,ok){
  const id=t.id,c=ST.cards[id];t.res=ok?1:0;
  let gain=0;
  if(ok){
    S.right++;S.combo++;S.maxCombo=Math.max(S.maxCombo,S.combo);
    gain=10+Math.min(S.combo,10);S.xp+=gain;ST.xp+=gain;
    if(c){c.right++;
      if(!stillPending(id)&&!S.missed.has(id)){
        const before=c.box;c.box=Math.min(5,c.box+1);c.due=dayNum()+INTERVALS[c.box];
        if(before<5&&c.box===5){S.mastered++;setTimeout(()=>{floatGain('熟練！');confetti(24);sWIN()},500)}
      }}
    sOK();floatGain('+'+gain);
  }else{
    S.wrong++;S.combo=0;sBAD();
    if(c){c.wrong++;if(!S.missed.has(id)){c.box=c.box>0?Math.max(1,c.box-2):0;c.due=dayNum()}}
    S.missed.add(id);
    S.requeued[id]=(S.requeued[id]||0)+1;
    if(S.requeued[id]<=2){S.q.splice(Math.min(S.q.length,S.i+4),0,{id,type:t.type==='mc'?'rc':'mc'})}
  }
  ST.bestCombo=Math.max(ST.bestCombo||0,S.maxCombo);
  logActivity({a:1,r:ok?1:0,xp:gain});
  save();header();
  const cb=$('#combo');if(cb){cb.textContent=S.combo>=2?`連對 ${S.combo}`:' ';if(S.combo>=2){cb.classList.remove('pop');void cb.offsetWidth;cb.classList.add('pop')}}
  return gain;
}
function afterAnswer(t,ok,gain,mount){
  const w=BY[t.id];
  const fb=document.createElement('div');
  if(ok){
    fb.className='fb good';fb.innerHTML=`答對了　+${gain}　<span style="font-weight:400;color:var(--ink)">${w.hook.split('。')[0]}。</span>`;
    mount.appendChild(fb);
    S.timer=setTimeout(next,1500);
    const b=document.createElement('button');b.className='btn ghost';b.style.marginTop='10px';b.textContent='繼續';b.onclick=next;mount.appendChild(b);
  }else{
    fb.className='fb bad';fb.innerHTML=`<b class="he" style="font-size:26px" lang="he">${w.h}</b> <span class="tr" style="display:inline;margin-left:8px">${w.t}</span>
      <div style="font-size:18px;font-weight:700">${w.zh}</div><div class="hook" style="margin-top:8px"><small>記憶鉤子</small>${w.hook}</div>${famHTML(w)}
      <p class="muted" style="margin-top:8px">這個詞稍後會再出現。</p>`;
    mount.appendChild(fb);
    const b=document.createElement('button');b.className='btn';b.style.marginTop='10px';b.textContent='看懂了，繼續';b.onclick=next;mount.appendChild(b);
    b.focus();
  }
}
function next(){clearTimeout(S.timer);S.i++;if(S.i>=S.q.length){finish();}else renderToday()}
function rChoice(t){
  const w=BY[t.id],fwd=t.type==='mc';
  const o=opts(t.id,fwd?'zh':'h');
  view.innerHTML=shell(`<div class="card">
    <div class="q-label">${fwd?'這個詞是什麼意思':'哪一個是這個詞'}</div>
    ${fwd?`<div class="he bigword" lang="he">${w.h}</div><div class="tr">${w.t}</div>`:`<div class="mean" style="margin:12px 0 0">${w.zh}</div><div class="en">${w.en}</div>`}
    <div class="opts" id="opts">${o.map(x=>`<button class="opt ${fwd?'':'he'}" data-id="${x.id}" ${fwd?'':'lang="he"'}>${fwd?short(x):x.h}</button>`).join('')}</div>
    <div id="fbm"></div></div>`);
  view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.id===t.id;
    view.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.id===t.id)x.classList.add('right')});
    if(!ok)b.classList.add('wrong');
    const g=answer(t,ok);afterAnswer(t,ok,g,$('#fbm'));
  });
}
function rSense(t){
  const w=BY[t.id],own=new Set(w.s.map(senseShort));
  const good=shuffle(w.s.slice(1))[0],gtxt=senseShort(good);
  const pool=shuffle(ALL.filter(x=>x.id!==w.id&&x.s.length&&x.pos===w.pos)).concat(shuffle(ALL.filter(x=>x.id!==w.id)));
  const ds=[];const seen=new Set([gtxt,...own]);
  for(const x of pool){const c=senseShort(x.s.length?shuffle(x.s)[0]:[short(x)]);if(c&&!seen.has(c)){seen.add(c);ds.push(c)}if(ds.length>=3)break}
  const o=shuffle([gtxt,...ds]);
  view.innerHTML=shell(`<div class="card">
    <div class="q-label">一字多義</div>
    <div class="he bigword" lang="he">${w.h}</div><div class="tr">${w.t}</div>
    <div class="mean" style="font-size:19px;margin-top:10px">除了「${senseShort(w.s[0])}」，這個詞還能是什麼意思？</div>
    <div class="opts" id="opts">${o.map(x=>`<button class="opt" data-v="${x.replace(/"/g,'&quot;')}">${x}</button>`).join('')}</div>
    <div id="fbm"></div></div>`);
  view.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const ok=b.dataset.v===gtxt;
    view.querySelectorAll('.opt').forEach(x=>{x.disabled=true;if(x.dataset.v===gtxt)x.classList.add('right')});
    if(!ok)b.classList.add('wrong');
    const g=answer(t,ok);
    afterAnswer(t,ok,g,$('#fbm'));
    if(ok){const d=document.createElement('div');d.innerHTML=sensesHTML(w);$('#fbm').insertBefore(d,$('#fbm').firstChild.nextSibling)}
  });
}
function rTile(t){
  const w=BY[t.id],cl=cluster(w.h),pool=shuffle(cl.map((c,i)=>({c,i})));
  let slots=Array(cl.length).fill(null);
  view.innerHTML=shell(`<div class="card">
    <div class="q-label">照順序拼出這個詞（由右到左）</div>
    <div class="mean" style="margin:12px 0 0">${w.zh}</div><div class="tr">${w.t}</div>
    <div class="slots" id="slots" lang="he"></div><div class="pool" id="pool" lang="he"></div><div id="fbm"></div></div>`);
  const draw=()=>{
    $('#slots').innerHTML=slots.map((s,i)=>`<button class="slot he ${s?'filled':''}" data-s="${i}">${s?s.c:''}</button>`).join('');
    $('#pool').innerHTML=pool.map(p=>`<button class="tile he" data-p="${p.i}" ${slots.some(s=>s&&s.i===p.i)?'disabled':''}>${p.c}</button>`).join('');
    $('#pool').querySelectorAll('.tile').forEach(b=>b.onclick=()=>{
      const k=slots.indexOf(null);if(k<0)return;slots[k]=pool.find(p=>p.i===+b.dataset.p);draw();
      if(slots.every(Boolean))check();
    });
    $('#slots').querySelectorAll('.slot').forEach(b=>b.onclick=()=>{if(!done){slots[+b.dataset.s]=null;draw()}});
  };
  let done=false;
  const check=()=>{
    done=true;const ok=slots.map(s=>s.c).join('')===cl.join('');
    $('#pool').querySelectorAll('button').forEach(b=>b.disabled=true);
    $('#slots').querySelectorAll('.slot').forEach(b=>b.style.borderColor=ok?'var(--good)':'var(--bad)');
    const g=answer(t,ok);afterAnswer(t,ok,g,$('#fbm'));
  };
  draw();
}
function rMatch(t){
  const ws=t.ids.map(id=>BY[id]);let sel=null,left=ws.length,miss=0;
  const L=shuffle(ws),R=shuffle(ws);
  view.innerHTML=shell(`<div class="card"><div class="q-label">連連看：點一個希伯來字，再點它的意思</div>
    <div class="match"><div class="col" lang="he">${L.map(w=>`<button class="m he" data-k="h" data-id="${w.id}">${w.h}</button>`).join('')}</div>
    <div class="col">${R.map(w=>`<button class="m" data-k="z" data-id="${w.id}">${short(w)}</button>`).join('')}</div></div><div id="fbm"></div></div>`);
  view.querySelectorAll('.m').forEach(b=>b.onclick=()=>{
    if(b.classList.contains('done'))return;
    if(!sel||sel.dataset.k===b.dataset.k){view.querySelectorAll('.m.sel').forEach(x=>x.classList.remove('sel'));sel=b;b.classList.add('sel');return}
    const ok=sel.dataset.id===b.dataset.id,a=sel;sel=null;a.classList.remove('sel');
    if(ok){[a,b].forEach(x=>x.classList.add('done'));left--;S.combo++;S.xp+=5;ST.xp+=5;logActivity({a:1,r:1,xp:5});sOK();header();
      if(!left){t.res=miss?0:1;if(miss===0){S.right++}save();
        const f=document.createElement('div');f.className='fb good';f.textContent=miss?`完成，錯了 ${miss} 次`:'全部配對成功！';$('#fbm').appendChild(f);
        S.timer=setTimeout(next,1300);const nb=document.createElement('button');nb.className='btn ghost';nb.style.marginTop='10px';nb.textContent='繼續';nb.onclick=next;$('#fbm').appendChild(nb)}}
    else{miss++;S.combo=0;logActivity({a:1});sBAD();[a,b].forEach(x=>{x.classList.add('bad');setTimeout(()=>x.classList.remove('bad'),400)})}
  });
}
function finish(){
  S.done=true;ST.sessions=(ST.sessions||0)+1;
  const t=dayNum();
  if(ST.lastDay!==t){ST.streak=(ST.lastDay===t-1)?ST.streak+1:1;ST.lastDay=t}
  ST.xp+=20;S.xp+=20;logActivity({s:1,xp:20});save();header();sWIN();confetti(50);summary();
}
function summary(){
  const tot=S.right+S.wrong,acc=tot?Math.round(S.right/tot*100):100,stars=acc>=90?3:acc>=70?2:1;
  view.innerHTML=`<div class="card stack"><div class="stars" aria-label="${stars} 顆星">${'★'.repeat(stars)}<span style="opacity:.25">${'★'.repeat(3-stars)}</span></div>
    <h2 style="text-align:center">這一輪完成</h2>
    <div class="row" style="justify-content:center;gap:8px">
      <span class="chip">答對率 <b>${acc}%</b></span><span class="chip">最高連對 <b>${S.maxCombo}</b></span>
      <span class="chip">XP <b>+${S.xp}</b></span>${S.learned?`<span class="chip">新詞 <b>${S.learned}</b></span>`:''}${S.mastered?`<span class="chip">新熟練 <b>${S.mastered}</b></span>`:''}</div>
    <p class="muted" style="text-align:center">今天已連續學習 ${ST.streak} 天。${S.missed.size?`有 ${S.missed.size} 個詞答錯過，系統會讓它們更常出現。`:'全部一次答對！'}</p>
    <button class="btn" id="again">${newIds(1).length?'再來一輪':'回到首頁'}</button>
    <button class="btn ghost" id="toWall">看詞牆</button></div>`;
  $('#again').onclick=()=>{S=null;newIds(1).length||dueIds().length?startSession('daily'):home()};
  $('#toWall').onclick=()=>{S=null;setTab('wall')};
}
