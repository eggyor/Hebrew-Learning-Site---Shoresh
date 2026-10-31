/* 讓網頁離線也能開。版本字串改了，舊快取就會被清掉。更新詞表或程式後請把 VERSION 加 1。 */
const VERSION='v35',FILES=['./','index.html','css/style.css','css/hero.css','css/heat.css','js/words.js','js/store.js','js/core.js','js/hero.js','js/heat.js','js/quiz.js','js/views.js','js/app.js','manifest.webmanifest','icons/icon.svg','icons/garden-study-bg-wide.png','icons/button-plaque.png','icons/button-plaque-sand.png','icons/parchment-texture.png','icons/parchment-frame.png','icons/scroll-modal.png','icons/heat-day-1.jpg','icons/heat-day-2.jpg','icons/heat-day-3.jpg','icons/heat-day-4.jpg','icons/heat-day-5.jpg','icons/heat-day-6.jpg','icons/heat-day-7.jpg','icons/heat-day-1-mobile.jpg','icons/heat-day-2-mobile.jpg','icons/heat-day-3-mobile.jpg','icons/heat-day-4-mobile.jpg','icons/heat-day-5-mobile.jpg','icons/heat-day-6-mobile.jpg','icons/heat-day-7-mobile.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin)return;            // 字體等外部資源交給瀏覽器
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)));
});
