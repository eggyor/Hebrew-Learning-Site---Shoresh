/* 【預留】首頁美化的位置。
   首頁最上方有一個 <section id="hero-slot">，內容就是這個函式回傳的 HTML。
   想改版時只要改這裡（與 css/hero.css），不用動其他檔案。
   可用的資料：ST.streak（連續天數）、ST.xp、Object.keys(ST.cards).length（已學詞數）、ALL.length（總詞數）。 */
function renderHero(){
  return `<div class="hero-default card"><div class="he" lang="he">שָׁלוֹם</div><p class="muted">今天也認幾個詞。</p></div>`;
}
