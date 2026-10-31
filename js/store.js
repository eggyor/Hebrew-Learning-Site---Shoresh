/* ===== 存檔、備份、活動紀錄 ===== */
const KEY='hebvocab.v1',APP_ID='zigen-garden',SCHEMA=2;
let mem=null,storageOK=true;
function blank(){return{schema:SCHEMA,cards:{},xp:0,streak:0,lastDay:null,perSession:5,sound:true,sessions:0,bestCombo:0,log:{},lastExport:null}}
function normalize(o){
  const s=Object.assign(blank(),o||{});
  if(!s.cards||typeof s.cards!=='object')s.cards={};
  if(!s.log||typeof s.log!=='object')s.log={};
  s.schema=SCHEMA;return s;
}
function load(){try{const s=localStorage.getItem(KEY);if(s)return normalize(JSON.parse(s))}catch(e){}return mem||blank()}
let ST=load();
function save(){mem=ST;try{localStorage.setItem(KEY,JSON.stringify(ST));storageOK=true}catch(e){storageOK=false}}
function dayNum(d=new Date()){return Math.floor(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5)}
function dayKey(d=new Date()){const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())}

/* 每天的練習紀錄：a=作答次數 r=答對次數 xp=得分 s=完成輪數。熱度頁就是讀這份資料。 */
function logActivity({a=0,r=0,xp=0,s=0}={}){
  const k=dayKey(),e=ST.log[k]||(ST.log[k]={a:0,r:0,xp:0,s:0});
  e.a+=a;e.r+=r;e.xp+=xp;e.s+=s;
}
/* 取最近 days 天（含今天），由舊到新；沒練習的日子也會有一筆全 0。 */
function getActivity(days=84){
  const out=[],now=new Date();
  for(let i=days-1;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-i),k=dayKey(d),e=ST.log[k]||{};
    out.push({date:k,a:e.a||0,r:e.r||0,xp:e.xp||0,s:e.s||0});
  }
  return out;
}

/* 備份：匯出成 JSON 檔、從檔案或貼上的文字匯入。匯入可選「合併」或「覆蓋」。 */
function exportJSON(){return JSON.stringify({app:APP_ID,schema:SCHEMA,exportedAt:new Date().toISOString(),data:ST},null,1)}
function parseBackup(text){
  const o=JSON.parse(text);
  const d=(o&&o.app===APP_ID&&o.data)?o.data:o;   // 也接受舊版（只有進度物件）的備份
  if(!d||typeof d.cards!=='object')throw new Error('format');
  return normalize(d);
}
function mergeState(a,b){
  const out=normalize(JSON.parse(JSON.stringify(a)));
  for(const [id,c] of Object.entries(b.cards)){
    const m=out.cards[id];
    if(!m||c.box>m.box||(c.box===m.box&&(c.right+c.wrong)>(m.right+m.wrong)))out.cards[id]=c;
  }
  out.xp=Math.max(a.xp||0,b.xp||0);
  out.bestCombo=Math.max(a.bestCombo||0,b.bestCombo||0);
  out.sessions=Math.max(a.sessions||0,b.sessions||0);
  if((b.lastDay||0)>(a.lastDay||0)){out.streak=b.streak;out.lastDay=b.lastDay}
  for(const [k,y] of Object.entries(b.log)){
    const x=out.log[k];
    out.log[k]=x?{a:Math.max(x.a,y.a),r:Math.max(x.r,y.r),xp:Math.max(x.xp,y.xp),s:Math.max(x.s,y.s)}:y;
  }
  return out;
}
function downloadBackup(){
  const blob=new Blob([exportJSON()],{type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='zigen-garden-backup-'+dayKey()+'.json';
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  ST.lastExport=Date.now();save();
}
/* 請瀏覽器盡量不要自動清掉這個網站的資料（不保證，仍建議定期備份）。 */
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
