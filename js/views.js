/* ===== 詞牆 ===== */
let wallQ='',wallLimit=240;
function wall(){
  const t=dayNum(),F=['全部','待複習','多義詞','虛詞','動詞','名詞','形容詞','數字','專有名詞'];
  const counts=[0,0,0,0,0,0];ALL.forEach(w=>{const c=ST.cards[w.id];counts[c?c.box:0]++});
  const learned=Object.keys(ST.cards).length;
  const strip=h=>h.replace(/[\u0591-\u05C7]/g,'');
  let list=ALL;
  if(wallFilter==='待複習')list=ALL.filter(w=>ST.cards[w.id]&&ST.cards[w.id].due<=t);
  else if(wallFilter==='多義詞')list=ALL.filter(w=>w.s.length>=2);
  else if(wallFilter!=='全部')list=ALL.filter(w=>POS[w.pos]===wallFilter);
  const q=wallQ.trim().toLowerCase();
  if(q)list=list.filter(w=>strip(w.h).includes(q)||w.t.toLowerCase().includes(q)||w.zh.includes(q)||w.en.toLowerCase().includes(q)||w.s.some(x=>x[0].includes(q)||x[1].toLowerCase().includes(q)));
  const shown=list.slice(0,wallLimit);
  view.innerHTML=`<div class="card stack"><div><h2>詞牆</h2><p class="muted">已學 ${learned} / ${ALL.length}。顏色越深代表越熟，金色是熟練，金框是今天該複習。點一個詞可看詳情與全部義項。</p></div>
    <div class="sum" role="img" aria-label="熟練度分佈">${counts.map((n,b)=>n?`<i style="width:${n/ALL.length*100}%;background:${b===0?'var(--line)':b===5?'var(--gold)':`color-mix(in srgb,var(--accent) ${b*18}%,var(--surface))`}"></i>`:'').join('')}</div>
    <input id="wq" class="search" type="search" placeholder="搜尋：希伯來文、音譯、中文或英文" value="${wallQ.replace(/"/g,'&quot;')}"></div>
    <div class="filters">${F.map(f=>`<button class="f" data-f="${f}" aria-pressed="${f===wallFilter}">${f}</button>`).join('')}</div>
    <div class="wall">${shown.map(w=>{const c=ST.cards[w.id];return `<button class="w ${c?'learned':''} b${c?c.box:0} ${c&&c.due<=t?'due':''}" data-w="${w.id}"><span class="he" lang="he">${w.h}</span><small>${c?short(w):'未學'}</small></button>`}).join('')||'<p class="muted">沒有符合的詞。</p>'}</div>
    ${list.length>shown.length?`<button class="btn ghost" id="more">再顯示 ${Math.min(240,list.length-shown.length)} 個（還有 ${list.length-shown.length} 個）</button>`:''}`;
  view.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{wallFilter=b.dataset.f;wallLimit=240;wall()});
  view.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>sheet(b.dataset.w));
  const mo=$('#more');if(mo)mo.onclick=()=>{wallLimit+=240;wall()};
  const wq=$('#wq');let tm;wq.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{wallQ=wq.value;wallLimit=240;const p=wq.selectionStart;wall();const n=$('#wq');n.focus();n.setSelectionRange(p,p)},250)};
}
function sheet(id){
  const w=BY[id],c=ST.cards[id],el=document.createElement('div');el.className='sheet';
  el.innerHTML=`<div class="scroll-dialog" role="dialog" aria-label="${w.t}"><div class="scroll-content">${wordCard(w,c?`<p class="muted" style="margin-top:12px">熟練度 ${c.box}/5 · 答對 ${c.right} 次 · 答錯 ${c.wrong} 次</p>`:'<p class="muted" style="margin-top:12px">尚未學到，會在之後的新詞中出現。</p>')}
    <button class="btn ghost" style="margin-top:12px" id="cl">關閉</button></div></div>`;
  el.onclick=e=>{if(e.target===el)el.remove()};
  document.body.appendChild(el);bindSay(el);$('#cl').onclick=()=>el.remove();$('#cl').focus();
}
/* ===== 進度與設定 ===== */
function more(){
  const learned=Object.keys(ST.cards).length,m=Object.values(ST.cards).filter(c=>c.box>=5).length;
  view.innerHTML=`<div class="card stack"><h2>進度</h2>
    <div class="row" style="gap:8px"><span class="chip">已學 <b>${learned}/${ALL.length}</b></span><span class="chip">熟練 <b>${m}</b></span>
    <span class="chip">完成輪數 <b>${ST.sessions||0}</b></span><span class="chip">最高連對 <b>${ST.bestCombo||0}</b></span></div></div>
    <div class="card stack"><h3>設定</h3>
      <label class="row" style="align-items:center;gap:10px"><input type="checkbox" id="snd" ${ST.sound?'checked':''}> 答題音效</label>
    </div>
    <div class="card stack"><h3>備份與還原</h3>
      <p class="muted">進度存在這個瀏覽器裡（含每天的練習紀錄）。手機和電腦的進度各自獨立，要換裝置或清除瀏覽資料前，請先匯出備份檔，再到另一邊匯入。${ST.lastExport?'上次匯出：'+new Date(ST.lastExport).toLocaleDateString('zh-TW'):''}</p>
      <div class="row"><button class="btn small" id="dl">匯出備份檔</button>
        <label class="btn small ghost file-label">選擇備份檔匯入<input type="file" id="fi" accept=".json,application/json"></label></div>
      <div class="seg">匯入方式：
        <button class="f" data-mode="merge" aria-pressed="true">合併（保留兩邊較高的進度）</button>
        <button class="f" data-mode="replace" aria-pressed="false">覆蓋（以備份為準）</button></div>
      <details><summary class="muted">改用文字複製貼上</summary>
        <textarea id="bk" aria-label="進度備份文字" style="margin-top:8px"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn small ghost" id="cp">複製</button><button class="btn small ghost" id="im">貼上後匯入</button></div></details>
      <p class="muted" id="msg" role="status"></p></div>
    <div class="card stack"><h3>重新開始</h3><button class="btn small ghost" id="rs">清除全部進度</button></div>
    <div class="card"><h3>關於這份詞表</h3><p class="muted">共 ${ALL.length} 個詞，涵蓋虛詞、動詞、名詞、形容詞、數字和專有名詞（專有名詞附英文名）。新詞按頻率級由高到低出現。動詞以 Qal 三單陽性完成式為字典形，主要用於其他詞幹的動詞會標明詞幹。「多義」欄列出常見義項，依常見度排序。記憶鉤子以詞源和同源詞為主，少數是諧音聯想；專有名詞的字面意思是傳統解釋。詞表由人工整理，拼寫與釋義請在查經時對照詞典（如 BDB、HALOT）。</p></div>`;
  $('#bk').value=exportJSON();
  $('#snd').onchange=e=>{ST.sound=e.target.checked;save()};
  let mode='merge';
  view.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;view.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  const doImport=text=>{
    try{
      const inc=parseBackup(text);
      ST=mode==='merge'?mergeState(ST,inc):inc;
      save();header();more();
      $('#msg').textContent='已匯入（'+(mode==='merge'?'合併':'覆蓋')+'）。目前已學 '+Object.keys(ST.cards).length+' 個詞。';
    }catch(e){$('#msg').textContent='這不是有效的備份內容，請確認是從本 app 匯出的檔案或文字。'}
  };
  $('#dl').onclick=()=>{downloadBackup();$('#msg').textContent='已產生備份檔，請在下載資料夾找到它。';};
  $('#fi').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>doImport(String(r.result));r.onerror=()=>{$('#msg').textContent='讀不到這個檔案。'};r.readAsText(f)};
  $('#cp').onclick=async()=>{try{await navigator.clipboard.writeText($('#bk').value);ST.lastExport=Date.now();save();$('#msg').textContent='已複製。'}catch(e){$('#bk').select();$('#msg').textContent='請手動複製已選取的文字。'}};
  $('#im').onclick=()=>doImport($('#bk').value);
  let armed=false;
  $('#rs').onclick=()=>{if(!armed){armed=true;$('#rs').textContent='再按一次確認清除';return}ST=blank();save();S=null;header();setTab('today')};
}
/* ===== 分頁設定 =====
   導覽列由這份清單產生。新增頁面：寫一個 render 函式，在這裡加一行即可。 */
const TABS=[
  {id:'today',label:'今日',render:()=>renderToday()},
  {id:'wall',label:'詞牆',render:()=>wall()},
  {id:'heat',label:'熱度',render:()=>renderHeat()},
  {id:'more',label:'進度',render:()=>more()}
];
let tabMotionTimer=0;
function setTab(t){
  tab=t;
  if(t==='heat')document.body.dataset.screen='heat';
  else{delete document.body.dataset.screen;document.querySelector('.heat-backdrop')?.remove()}
  document.querySelectorAll('#nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===t?'page':'false'));
  view.classList.remove('tab-switching');
  clearTimeout(tabMotionTimer);
  void view.offsetWidth;
  view.classList.add('tab-switching');
  (TABS.find(x=>x.id===t)||TABS[0]).render();
  const root=document.documentElement,previousBehavior=root.style.scrollBehavior;
  root.style.scrollBehavior='auto';window.scrollTo(0,0);root.style.scrollBehavior=previousBehavior;
  tabMotionTimer=setTimeout(()=>view.classList.remove('tab-switching'),360);
}
function buildNav(){
  const nav=$('#nav');
  nav.innerHTML=TABS.map(x=>`<button data-tab="${x.id}">${x.label}</button>`).join('');
  nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{
    const next=b.dataset.tab;
    if(next!==tab&&sessionInProgress()){
      if(!window.confirm('這一輪答題還沒完成，離開會中止本輪練習。確定要離開嗎？'))return;
      clearTimeout(S.timer);S=null;
    }
    location.hash=next==='today'?'':next;setTab(next);
  });
}
