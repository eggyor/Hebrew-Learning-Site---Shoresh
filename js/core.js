/* ===== 資料 ===== */
const ALL0=RAW.map(r=>({id:r[0],h:r[1],t:r[2],zh:r[3],en:r[4],pos:r[5],root:r[6],hook:r[7],s:r[8]||[],tier:r[9]||2}));
const short=w=>{
  let z=w.zh.replace(/[（(][^）)]*[）)]/g,'').split(/[；，：]/).map(x=>x.trim()).filter(Boolean)[0]||w.en||w.zh;
  if(z.length>14)z=z.slice(0,14)+'…';
  return w.pos==='專'?z+' '+w.en.split(/[,;(]/)[0].trim():z;
};
const senseShort=x=>x[0].split(/[；，]/)[0].trim();
const ALL=(()=>{
  const pat=['動','名','動','名','虛','動','名','形','專','數'],res=[];
  [1,2,3].forEach(t=>{
    const g={};ALL0.filter(w=>w.tier===t).forEach(w=>(g[w.pos]=g[w.pos]||[]).push(w));
    const n=ALL0.filter(w=>w.tier===t).length;let c=0;
    while(c<n){for(const p of pat){if(g[p]&&g[p].length){res.push(g[p].shift());c++}}}
  });
  return res;
})();
const BY={};ALL.forEach(w=>BY[w.id]=w);
const ROOTS={};ALL.forEach(w=>{if(w.root){(ROOTS[w.root]=ROOTS[w.root]||[]).push(w)}});
const INTERVALS=[0,1,2,4,8,16];
const POS={虛:'虛詞',動:'動詞',名:'名詞',形:'形容詞',數:'數字',專:'專有名詞'};

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const $=s=>document.querySelector(s);
const view=$('#view');

/* ===== 聲音與回饋 ===== */
let AC=null;
function beep(freqs,dur=0.09){
  if(!ST.sound)return;
  try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    let t=AC.currentTime;
    freqs.forEach(f=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.15,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+.02);t+=dur*.8});}catch(e){}
}
const sOK=()=>beep([660,880]),sBAD=()=>beep([220,180],.14),sWIN=()=>beep([523,659,784,1047],.12);
function floatGain(txt){const d=document.createElement('div');d.className='gain';d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),950)}
function confetti(n=40){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const cols=['#1E56A0','#F2B94B','#4CC38A','#F07A7A','#6FA6F0'];
  for(let i=0;i<n;i++){const s=document.createElement('span');s.className='conf';
    s.style.left=Math.random()*100+'vw';s.style.background=cols[i%cols.length];
    s.style.setProperty('--dx',(Math.random()*160-80)+'px');s.style.animationDelay=Math.random()*.4+'s';
    document.body.appendChild(s);setTimeout(()=>s.remove(),2200)}
}
function speak(w){
  try{if(!('speechSynthesis' in window))return;speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(w.h.replace(/[֑-֯]/g,''));u.lang='he-IL';u.rate=.8;speechSynthesis.speak(u)}catch(e){}
}
function header(){$('#sXp').textContent=ST.xp;$('#sStreak').textContent=ST.streak}

/* ===== 卡片零件 ===== */
function famHTML(w){
  const f=(w.root&&ROOTS[w.root]||[]).filter(x=>x.id!==w.id).slice(0,7);
  if(!f.length)return '';
  return `<div class="fam"><span>同詞根 ${w.root.split('').join(' ')}</span>${f.map(x=>`<span class="he" title="${x.zh}">${x.h}</span>`).join('')}<span>${f.map(x=>short(x)).join('、')}</span></div>`;
}
function sensesHTML(w){
  if(!w.s||w.s.length<2)return '';
  return `<div class="senses"><small>多義 · ${w.s.length} 個常見義項</small><ol>${w.s.map(x=>`<li><b>${x[0]}</b> <span>${x[1]}</span></li>`).join('')}</ol></div>`;
}
function wordCard(w,extra=''){
  const canSpeak='speechSynthesis' in window,long=w.zh.length>16;
  return `<div class="card">
    <div class="he bigword" lang="he">${w.h}</div>
    <div class="tr">${w.t}</div>
    ${canSpeak?`<button class="speak" data-say="${w.id}">發音</button>`:''}
    <div class="mean" ${long?'style="font-size:18px"':''}>${w.zh}</div>
    <div class="en">${w.en} <span class="pos">${POS[w.pos]}</span></div>
    ${sensesHTML(w)}
    ${w.hook?`<div class="hook"><small>記憶鉤子</small>${w.hook}</div>`:''}
    ${famHTML(w)}${extra}</div>`;
}
function bindSay(root){root.querySelectorAll('[data-say]').forEach(b=>b.onclick=()=>speak(BY[b.dataset.say]))}
