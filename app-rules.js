function ruleModalHtml(){
  return `<div class="rules-modal-backdrop" id="rulesModal" role="dialog" aria-modal="true" aria-label="ルール">
    <div class="rules-modal">
      <div class="rules-modal-head">
        <div><span>RULE BOOK</span><h2>フレネミー人狼のルール</h2></div>
        <button class="rules-close" id="rulesClose" aria-label="閉じる">×</button>
      </div>
      <div class="rules-modal-body">
        <section class="rules-block main-rule">
          <h3>ゲームの目的</h3>
          <p>みんなでテーマに沿って話し合い、最終的に「一番○○な人」を投票で決めます。ただし、会話の中にはランキングをこっそり操作しようとするフレネミーが紛れています。</p>
        </section>
        <section class="rules-grid">
          <div class="rules-block"><b>市民陣営</b><p>フレネミーを見抜いて追放する。ランキングを正しく守る。</p></div>
          <div class="rules-block"><b>フレネミー陣営</b><p>事前アンケート1位を、会話で最終投票1位から落とす。</p></div>
        </section>
        <section class="rules-block">
          <h3>ラウンドの流れ</h3>
          <ol class="rules-steps">
            <li><span>1</span><p><b>テーマ発表</b> 今回の質問テーマを確認します。</p></li>
            <li><span>2</span><p><b>秘密情報</b> フレネミーだけが現在1位を確認します。</p></li>
            <li><span>3</span><p><b>占い</b> 占い師は1人の事前順位を確認できます。</p></li>
            <li><span>4</span><p><b>議論</b> 誰が本心で、誰が操作しているか話し合います。</p></li>
            <li><span>5</span><p><b>ランキング投票</b> テーマに一番当てはまる人へ投票します。</p></li>
            <li><span>6</span><p><b>結果</b> 事前1位が落ちたらフレネミー成功です。</p></li>
            <li><span>7</span><p><b>追放投票</b> 怪しい人を投票で追放します。</p></li>
          </ol>
        </section>
        <section class="rules-block">
          <h3>役職</h3>
          <div class="rules-roles">
            <div><strong>市民</strong><small>特殊能力なし。議論と投票で見抜く。</small></div>
            <div><strong>フレネミー</strong><small>現在1位を知り、その人を1位から落とす。</small></div>
            <div><strong>占い師</strong><small>毎ラウンド1人の事前順位を確認できる。</small></div>
            <div><strong>狂人</strong><small>フレネミー陣営。ただし秘密情報は知らない。</small></div>
          </div>
        </section>
        <section class="rules-block">
          <h3>勝利条件</h3>
          <p><b>市民陣営：</b>フレネミーを全員追放すると勝利。</p>
          <p><b>フレネミー陣営：</b>生存中のフレネミー＋狂人が、市民側人数以上になると勝利。</p>
        </section>
      </div>
    </div>
  </div>`;
}
function openRules(){
  if(document.getElementById('rulesModal'))return;
  document.body.insertAdjacentHTML('beforeend',ruleModalHtml());
  const modal=document.getElementById('rulesModal');
  const close=()=>modal?.remove();
  document.getElementById('rulesClose')?.addEventListener('click',close);
  modal?.addEventListener('click',e=>{if(e.target===modal)close();});
  const onKey=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',onKey);}};
  document.addEventListener('keydown',onKey);
}
function installRulesButton(){
  if(document.getElementById('rulesFloatingButton'))return;
  const btn=document.createElement('button');
  btn.id='rulesFloatingButton';
  btn.className='rules-floating-button';
  btn.type='button';
  btn.setAttribute('aria-label','ルールを確認');
  btn.innerHTML='<span>?</span><b>RULE</b>';
  btn.addEventListener('click',openRules);
  document.body.appendChild(btn);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRulesButton);else installRulesButton();
