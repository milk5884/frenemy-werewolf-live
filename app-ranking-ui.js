// One optional, public results card shared by performer and host screens.
// The server only includes rankingReveal after voting and when the host enables it.
function rankingRevealHtml(reveal){
  if(!reveal?.rows?.length)return '';
  return `<section class="ranking-reveal" aria-label="事前アンケートの全ランキング">
    <div class="ranking-reveal-head">
      <div><span class="ranking-reveal-kicker">OFFICIAL RANKING</span><h3>正解ランキング発表</h3>
      <p>事前アンケートの集計結果（脱落者を含む）</p></div>
      <span class="ranking-reveal-total">全${reveal.rows.length}人</span>
    </div>
    <ol class="ranking-reveal-list">
      ${reveal.rows.map((r,i)=>`<li class="ranking-reveal-row ${r.rank===1?'first':''} ${!r.alive?'eliminated':''}">
        <span class="ranking-reveal-place ${r.rank<=3?'medal':''}">${r.rank===1?'♛ 1位':r.rank+'位'}</span>
        <span class="ranking-reveal-person"><strong>${esc(r.name)}</strong>${!r.alive?'<small>脱落</small>':''}</span>
        <span class="ranking-reveal-score">${Number(r.points)||0}<small>pt</small></span>
      </li>`).join('')}
    </ol>
    <p class="ranking-reveal-note">同点・同率の場合は同じ順位で表示されます。</p>
  </section>`;
}
const fwPlayerBeforeRankingReveal=playerPhaseHtml;
playerPhaseHtml=function(state){
  const html=fwPlayerBeforeRankingReveal(state);
  if(state.phase!=='result'||!state.rankingReveal?.rows?.length)return html;
  return html.replace(/<\/section>\s*$/,rankingRevealHtml(state.rankingReveal)+'</section>');
};
