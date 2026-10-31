/* 依連續練習狀態呈現逐步豐富的花園書房。 */
let heatEvents;

// Landmark coordinates are measured against each illustration, not the viewport.
// This keeps the book target and day-seven lantern glow attached to the artwork
// when object-fit: cover crops the image on different screens.
const HEAT_LANDMARKS={
  desktop:{book:{x:.502,y:.671,w:.105,h:.085},lamp:{x:.633,y:.579,size:.14},wall:{x:.5,y:.30,w:.37}},
  mobile:{book:{x:.504,y:.537,w:.19,h:.072},lamp:{x:.666,y:.484,size:.25},wall:{x:.5,y:.22,w:.37}}
};

function positionHeatLandmarks(backdrop,stage){
  const img=backdrop.querySelector('img');
  if(!img?.naturalWidth||!img?.naturalHeight)return;
  const bounds=backdrop.getBoundingClientRect();
  const vw=bounds.width,vh=bounds.height;
  const scale=Math.max(vw/img.naturalWidth,vh/img.naturalHeight);
  const renderedWidth=img.naturalWidth*scale,renderedHeight=img.naturalHeight*scale;
  const cropX=bounds.left+(vw-renderedWidth)/2,cropY=bounds.top+(vh-renderedHeight)/2;
  const isMobile=window.matchMedia('(max-width: 700px)').matches;
  const points=HEAT_LANDMARKS[isMobile?'mobile':'desktop'];
  const book=stage.querySelector('.heat-book');
  const setBox=(el,point,width,height)=>{
    el.style.left=`${cropX+renderedWidth*point.x}px`;
    el.style.top=`${cropY+renderedHeight*point.y}px`;
    el.style.width=`${renderedWidth*width}px`;
    el.style.height=`${renderedHeight*height}px`;
  };
  setBox(book,points.book,points.book.w,points.book.h);
  book.style.transform='translate(-50%,-50%)';
  const words=stage.querySelector('.heat-words');
  words.style.left=`${cropX+renderedWidth*points.wall.x}px`;
  words.style.top=`${cropY+renderedHeight*points.wall.y}px`;
  words.style.width=`${Math.min(renderedWidth*points.wall.w,vw-28)}px`;
  const glow=stage.querySelector('.heat-lamp-glow');
  if(glow){
    const size=renderedWidth*points.lamp.size;
    glow.style.left=`${cropX+renderedWidth*points.lamp.x}px`;
    glow.style.top=`${cropY+renderedHeight*points.lamp.y}px`;
    glow.style.width=`${size}px`;glow.style.height=`${size}px`;
  }
}

function effectiveHeatDay(){
  const today=dayNum(),last=Number.isInteger(ST.lastDay)?ST.lastDay:null;
  const recorded=Math.min(7,Math.max(1,Number(ST.streak)||1));
  const missed=last===null?0:Math.max(0,today-last-1);
  return Math.max(1,Math.min(7,recorded-missed));
}

function wordsForHeatBook(){
  const ids=Object.keys(ST.cards);
  if(ids.length>=ALL.length)return shuffle(ALL).slice(0,5);
  return ids.map((id,index)=>({word:BY[id],rank:Number(ST.cards[id].learnedAt)||index}))
    .filter(x=>x.word).sort((a,b)=>b.rank-a.rank).slice(0,5).map(x=>x.word);
}

function renderHeat(){
  if(heatEvents)heatEvents.abort();
  heatEvents=new AbortController();
  const day=effectiveHeatDay(),words=wordsForHeatBook(),allLearned=Object.keys(ST.cards).length>=ALL.length;
  document.querySelector('.heat-backdrop')?.remove();
  const backdrop=document.createElement('picture');backdrop.className='heat-backdrop';backdrop.setAttribute('aria-hidden','true');
  backdrop.innerHTML=`<source media="(max-width: 700px)" srcset="icons/heat-day-${day}-mobile.jpg"><img src="icons/heat-day-${day}.jpg" alt="">`;
  document.body.prepend(backdrop);
  const list=words.map(w=>`<li><span class="he" lang="he">${w.h}</span><span class="heat-word-note"><b>${short(w)}</b><small>${w.t}</small></span></li>`).join('');
  view.innerHTML=`<div class="heat-stage" aria-label="連續練習第 ${day} 天的花園書房">
    ${day===7?'<div class="heat-lamp-glow" aria-hidden="true"></div>':''}
    <button id="heat-book" class="heat-book" type="button" aria-label="查看${allLearned?'隨機':'最近學會的'}希伯來單詞" aria-expanded="false" aria-controls="heat-words"><span class="sr-only">打開桌上的書</span></button>
    <section id="heat-words" class="heat-words" aria-label="${allLearned?'隨機單詞':'最近學會的單詞'}" hidden>
      <h2>${allLearned?'隨機翻到的詞':'最近學會的詞'}</h2>
      ${list?`<ol>${list}</ol>`:'<p class="heat-empty">先完成一輪練習，最近學會的單詞就會收進這本書。</p>'}
    </section>
  </div>`;

  const stage=$('.heat-stage'),book=$('#heat-book'),panel=$('#heat-words'),signal=heatEvents.signal;
  const alignLandmarks=()=>positionHeatLandmarks(backdrop,stage);
  const backgroundImage=backdrop.querySelector('img');
  backgroundImage.addEventListener('load',alignLandmarks,{signal});
  window.addEventListener('resize',alignLandmarks,{signal});
  window.visualViewport?.addEventListener('resize',alignLandmarks,{signal});
  if(backgroundImage.complete)alignLandmarks();
  let openTimer=0,closeTimer=0,pinned=false;
  const show=()=>{
    clearTimeout(openTimer);clearTimeout(closeTimer);panel.hidden=false;
    requestAnimationFrame(()=>panel.classList.add('is-visible'));
    book.setAttribute('aria-expanded','true');
  };
  const hide=()=>{
    clearTimeout(openTimer);clearTimeout(closeTimer);panel.classList.remove('is-visible');
    book.setAttribute('aria-expanded','false');
    closeTimer=setTimeout(()=>{if(!panel.classList.contains('is-visible'))panel.hidden=true},260);
  };
  const canHover=window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(canHover){
    book.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){clearTimeout(closeTimer);openTimer=setTimeout(show,300)}},{signal});
    book.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!pinned)hide()},{signal});
  }
  book.addEventListener('focus',()=>{if(!pinned)openTimer=setTimeout(show,300)},{signal});
  book.addEventListener('blur',()=>{if(!pinned)hide()},{signal});
  book.addEventListener('click',()=>{
    if(canHover){
      pinned=!pinned;
      if(pinned)show();else hide();
    }else{
      pinned=false;
      if(panel.hidden||!panel.classList.contains('is-visible'))show();else hide();
    }
  },{signal});
  document.addEventListener('pointerdown',e=>{if(!stage.contains(e.target)&&(!canHover||!pinned))hide()},{signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){pinned=false;hide()}},{signal});
}
