/* 啟動 */
buildNav();header();
{const h=location.hash.slice(1);setTab(TABS.some(x=>x.id===h)?h:'today')}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}
