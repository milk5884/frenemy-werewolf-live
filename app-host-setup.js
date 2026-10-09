function getHostToken(){ return qs.get('token') || localStorage.getItem(`fw_host_${roomCode}`) || ''; }
function hostUrl(path){ return `/api/rooms/${roomCode}/host${path||''}?token=${encodeURIComponent(getHostToken())}`; }
function makeDefaultRoster(){return ['Aさん','Bさん','Cさん','Dさん','Eさん','Fさん'].map((name,i)=>({id:`c_${Date.now()}_${i}`,name}));}
function recommendedThemeCount(playerCount){
  const n=Number(playerCount||0);
  if(n<=5)return 2;
  if(n<=6)return 3;
  if(n<=8)return 4;
  if(n<=10)return 5;
  return 6;
}
function makeDefaultThemes(){return pickThemeBank({categories:['本性','友情','ネタ'],intensities:['SAFE','SPICY'],count:recommendedThemeCount(6)}).map((title,i)=>({id:`t_${Date.now()}_${i}`,title}));}

const THEME_CATEGORIES=['恋愛','本性','友情','裏切り','仕事','未来','日常','学校','ネタ'];
const THEME_INTENSITIES=['SAFE','SPICY','CHAOS'];
const THEME_BANK=[
  {cat:'恋愛',level:'SAFE',text:'一番モテそうな人'},
  {cat:'恋愛',level:'SAFE',text:'一番デートの店選びがうまそうな人'},
  {cat:'恋愛',level:'SAFE',text:'一番恋愛相談に乗ってくれそうな人'},
  {cat:'恋愛',level:'SAFE',text:'一番告白されたらちゃんと返事しそうな人'},
  {cat:'恋愛',level:'SPICY',text:'一番好きな人の前でキャラが変わりそうな人'},
  {cat:'恋愛',level:'SPICY',text:'一番元恋人に未練がありそうな人'},
  {cat:'恋愛',level:'SPICY',text:'一番恋愛で駆け引きしそうな人'},
  {cat:'恋愛',level:'SPICY',text:'一番実は重そうな人'},
  {cat:'恋愛',level:'CHAOS',text:'一番恋愛トラブルを起こしそうな人'},
  {cat:'恋愛',level:'CHAOS',text:'一番浮気を見抜くのが早そうな人'},
  {cat:'恋愛',level:'CHAOS',text:'一番修羅場で冷静そうな人'},
  {cat:'恋愛',level:'CHAOS',text:'一番恋愛で人を振り回しそうな人'},

  {cat:'本性',level:'SAFE',text:'一番リーダーっぽい人'},
  {cat:'本性',level:'SAFE',text:'一番信頼できそうな人'},
  {cat:'本性',level:'SAFE',text:'一番空気を読めそうな人'},
  {cat:'本性',level:'SAFE',text:'一番約束を守りそうな人'},
  {cat:'本性',level:'SPICY',text:'一番秘密を隠していそうな人'},
  {cat:'本性',level:'SPICY',text:'一番腹黒そうな人'},
  {cat:'本性',level:'SPICY',text:'一番裏で計算していそうな人'},
  {cat:'本性',level:'SPICY',text:'一番本音と建前を使い分けそうな人'},
  {cat:'本性',level:'CHAOS',text:'一番人を操るのがうまそうな人'},
  {cat:'本性',level:'CHAOS',text:'一番敵に回すと怖そうな人'},
  {cat:'本性',level:'CHAOS',text:'一番笑顔で裏切りそうな人'},
  {cat:'本性',level:'CHAOS',text:'一番最終的に全部持っていきそうな人'},

  {cat:'友情',level:'SAFE',text:'一番友達思いな人'},
  {cat:'友情',level:'SAFE',text:'一番困った時に助けてくれそうな人'},
  {cat:'友情',level:'SAFE',text:'一番グループの潤滑油になりそうな人'},
  {cat:'友情',level:'SAFE',text:'一番長く付き合える友達になりそうな人'},
  {cat:'友情',level:'SPICY',text:'一番友達の秘密を知っていそうな人'},
  {cat:'友情',level:'SPICY',text:'一番グループ内の力関係を見抜いていそうな人'},
  {cat:'友情',level:'SPICY',text:'一番親友を独占しそうな人'},
  {cat:'友情',level:'SPICY',text:'一番人間関係の相談を受けていそうな人'},
  {cat:'友情',level:'CHAOS',text:'一番友情より勝利を選びそうな人'},
  {cat:'友情',level:'CHAOS',text:'一番仲間割れの原因になりそうな人'},
  {cat:'友情',level:'CHAOS',text:'一番友情を武器にしそうな人'},
  {cat:'友情',level:'CHAOS',text:'一番最後に親友を裏切りそうな人'},

  {cat:'裏切り',level:'SAFE',text:'一番秘密を守れそうな人'},
  {cat:'裏切り',level:'SAFE',text:'一番嘘をつくのが苦手そうな人'},
  {cat:'裏切り',level:'SAFE',text:'一番正直そうな人'},
  {cat:'裏切り',level:'SAFE',text:'一番疑われても落ち着いていそうな人'},
  {cat:'裏切り',level:'SPICY',text:'一番嘘がうまそうな人'},
  {cat:'裏切り',level:'SPICY',text:'一番バレないように立ち回れそうな人'},
  {cat:'裏切り',level:'SPICY',text:'一番都合よく味方を変えそうな人'},
  {cat:'裏切り',level:'SPICY',text:'一番人を疑わせるのがうまそうな人'},
  {cat:'裏切り',level:'CHAOS',text:'一番完全犯罪を考えそうな人'},
  {cat:'裏切り',level:'CHAOS',text:'一番裏切っても許されそうな人'},
  {cat:'裏切り',level:'CHAOS',text:'一番最後まで黒幕だと気づかれなさそうな人'},
  {cat:'裏切り',level:'CHAOS',text:'一番平然と嘘泣きできそうな人'},

  {cat:'仕事',level:'SAFE',text:'一番仕事ができそうな人'},
  {cat:'仕事',level:'SAFE',text:'一番上司に好かれそうな人'},
  {cat:'仕事',level:'SAFE',text:'一番チームをまとめられそうな人'},
  {cat:'仕事',level:'SAFE',text:'一番締切を守りそうな人'},
  {cat:'仕事',level:'SPICY',text:'一番出世しそうな人'},
  {cat:'仕事',level:'SPICY',text:'一番会議でうまく立ち回りそうな人'},
  {cat:'仕事',level:'SPICY',text:'一番裏で根回ししていそうな人'},
  {cat:'仕事',level:'SPICY',text:'一番転職で成功しそうな人'},
  {cat:'仕事',level:'CHAOS',text:'一番会社を乗っ取りそうな人'},
  {cat:'仕事',level:'CHAOS',text:'一番トラブルを部下に押し付けそうな人'},
  {cat:'仕事',level:'CHAOS',text:'一番ブラック企業でも生き残りそうな人'},
  {cat:'仕事',level:'CHAOS',text:'一番社内政治が強そうな人'},

  {cat:'未来',level:'SAFE',text:'一番将来成功しそうな人'},
  {cat:'未来',level:'SAFE',text:'一番幸せな家庭を作りそうな人'},
  {cat:'未来',level:'SAFE',text:'一番有名になりそうな人'},
  {cat:'未来',level:'SAFE',text:'一番老後が楽しそうな人'},
  {cat:'未来',level:'SPICY',text:'一番10年後に別人になっていそうな人'},
  {cat:'未来',level:'SPICY',text:'一番急に海外移住しそうな人'},
  {cat:'未来',level:'SPICY',text:'一番謎の成功をしていそうな人'},
  {cat:'未来',level:'SPICY',text:'一番昔の自分を黒歴史扱いしそうな人'},
  {cat:'未来',level:'CHAOS',text:'一番人生がドラマ化されそうな人'},
  {cat:'未来',level:'CHAOS',text:'一番急に億万長者になりそうな人'},
  {cat:'未来',level:'CHAOS',text:'一番未来で伝説になっていそうな人'},
  {cat:'未来',level:'CHAOS',text:'一番最終回で主人公になりそうな人'},

  {cat:'日常',level:'SAFE',text:'一番料理がうまそうな人'},
  {cat:'日常',level:'SAFE',text:'一番部屋がきれいそうな人'},
  {cat:'日常',level:'SAFE',text:'一番朝に強そうな人'},
  {cat:'日常',level:'SAFE',text:'一番旅行計画がうまそうな人'},
  {cat:'日常',level:'SPICY',text:'一番部屋に謎の物が多そうな人'},
  {cat:'日常',level:'SPICY',text:'一番スマホの中身を見られたくなさそうな人'},
  {cat:'日常',level:'SPICY',text:'一番休日の過ごし方が意外そうな人'},
  {cat:'日常',level:'SPICY',text:'一番急な誘いに乗りそうな人'},
  {cat:'日常',level:'CHAOS',text:'一番財布をなくしそうな人'},
  {cat:'日常',level:'CHAOS',text:'一番寝坊で全部を台無しにしそうな人'},
  {cat:'日常',level:'CHAOS',text:'一番意味不明な買い物をしそうな人'},
  {cat:'日常',level:'CHAOS',text:'一番日常がすでに事件っぽい人'},

  {cat:'学校',level:'SAFE',text:'一番学級委員っぽい人'},
  {cat:'学校',level:'SAFE',text:'一番先生に好かれそうな人'},
  {cat:'学校',level:'SAFE',text:'一番ノートがきれいそうな人'},
  {cat:'学校',level:'SAFE',text:'一番文化祭で活躍しそうな人'},
  {cat:'学校',level:'SPICY',text:'一番授業中に別のことを考えていそうな人'},
  {cat:'学校',level:'SPICY',text:'一番校則ギリギリを攻めそうな人'},
  {cat:'学校',level:'SPICY',text:'一番裏で人気がありそうな人'},
  {cat:'学校',level:'SPICY',text:'一番卒業後に一番変わりそうな人'},
  {cat:'学校',level:'CHAOS',text:'一番学校中の噂を知っていそうな人'},
  {cat:'学校',level:'CHAOS',text:'一番先生を論破しそうな人'},
  {cat:'学校',level:'CHAOS',text:'一番漫画みたいな事件に巻き込まれそうな人'},
  {cat:'学校',level:'CHAOS',text:'一番裏番長っぽい人'},

  {cat:'ネタ',level:'SAFE',text:'一番動物に好かれそうな人'},
  {cat:'ネタ',level:'SAFE',text:'一番宝くじが当たりそうな人'},
  {cat:'ネタ',level:'SAFE',text:'一番道に迷わなさそうな人'},
  {cat:'ネタ',level:'SAFE',text:'一番無人島で生き残りそうな人'},
  {cat:'ネタ',level:'SPICY',text:'一番変なあだ名をつけられそうな人'},
  {cat:'ネタ',level:'SPICY',text:'一番SNSでバズりそうな人'},
  {cat:'ネタ',level:'SPICY',text:'一番ラスボスの側近っぽい人'},
  {cat:'ネタ',level:'SPICY',text:'一番謎の才能を隠していそうな人'},
  {cat:'ネタ',level:'CHAOS',text:'一番ゾンビ映画で最初に騒ぎそうな人'},
  {cat:'ネタ',level:'CHAOS',text:'一番異世界転生で王になりそうな人'},
  {cat:'ネタ',level:'CHAOS',text:'一番ドッキリを仕掛けられても気づかなさそうな人'},
  {cat:'ネタ',level:'CHAOS',text:'一番最終話で急に裏切りそうな人'}
];

function shuffleClient(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function pickThemeBank({categories=THEME_CATEGORIES,intensities=THEME_INTENSITIES,count=3}={}){
  const picked=shuffleClient(THEME_BANK.filter(x=>categories.includes(x.cat)&&intensities.includes(x.level))).slice(0,count);
  return picked.map(x=>x.text);
}
function themeChoiceKey(x){return `${x.cat}|${x.level}|${x.text}`;}
function currentRosterCount(){
  const inputs=[...document.querySelectorAll('#rosterEdit input')];
  return inputs.filter(x=>x.value.trim()).length || inputs.length || 6;
}
function themeCountHintText(count,players=currentRosterCount()){
  return `参加人数 ${players}人に合わせた推奨追加数は ${count}問です。手動変更もできます。`;
}
function updateThemePickRecommendation(force=false){
  const input=document.getElementById('themePickCount');
  const hint=document.getElementById('themePickHint');
  if(!input)return;
  const players=currentRosterCount();
  const rec=recommendedThemeCount(players);
  if(force || input.dataset.touched!=='1') input.value=rec;
  if(hint) hint.textContent=themeCountHintText(input.value,players);
}
function themeBankHtml(recommendedCount=3){
  const cats=THEME_CATEGORIES.map(c=>`<label class="theme-chip"><input type="checkbox" class="themeCat" value="${esc(c)}" checked><span>${esc(c)}</span></label>`).join('');
  const levels=THEME_INTENSITIES.map(l=>`<label class="theme-chip intensity-${l.toLowerCase()}"><input type="checkbox" class="themeLevel" value="${esc(l)}" ${l==='CHAOS'?'':'checked'}><span>${esc(l)}</span></label>`).join('');
  return `<section class="card setup-section setup-full theme-bank"><h2>テーマ候補から選ぶ</h2><p class="muted">カテゴリと刺激度で絞り、使いたいお題を選んでテーマに追加できます。同一ゲーム内では同じテーマを入れない想定です。</p><div class="theme-filter"><div><div class="kicker">カテゴリ</div><div class="theme-chip-row">${cats}</div></div><div><div class="kicker">刺激度</div><div class="theme-chip-row">${levels}</div></div></div><div class="theme-bank-actions"><label class="setup-field small-field">追加数<input id="themePickCount" type="number" min="1" max="12" value="${Number(recommendedCount||3)}"><span id="themePickHint" class="field-hint">${esc(themeCountHintText(recommendedCount||3,6))}</span></label><button class="secondary" id="refreshThemeChoices" type="button">候補を更新</button><button class="secondary" id="addRandomThemes" type="button">ランダム追加</button><button class="big" id="addCheckedThemes" type="button">選択した候補を追加</button></div><div id="themeChoiceList" class="theme-choice-list"></div></section>`;
}
function selectedThemeFilters(){
  const categories=[...document.querySelectorAll('.themeCat:checked')].map(x=>x.value);
  const intensities=[...document.querySelectorAll('.themeLevel:checked')].map(x=>x.value);
  return {categories:categories.length?categories:THEME_CATEGORIES,intensities:intensities.length?intensities:THEME_INTENSITIES};
}
function renderThemeChoices(){
  const box=document.getElementById('themeChoiceList'); if(!box)return;
  const {categories,intensities}=selectedThemeFilters();
  const current=new Set([...document.querySelectorAll('#themeEdit input')].map(x=>x.value.trim()).filter(Boolean));
  const choices=shuffleClient(THEME_BANK.filter(x=>categories.includes(x.cat)&&intensities.includes(x.level)&&!current.has(x.text))).slice(0,30);
  box.innerHTML=choices.length?choices.map(x=>`<label class="theme-choice"><input type="checkbox" value="${esc(x.text)}"><span class="theme-choice-meta">${esc(x.cat)} / ${esc(x.level)}</span><b>${esc(x.text)}</b></label>`).join(''):`<div class="empty">条件に合う未使用テーマがありません。</div>`;
}
function appendTheme(title){
  const v=String(title||'').trim(); if(!v)return false;
  const exists=[...document.querySelectorAll('#themeEdit input')].some(x=>x.value.trim()===v);
  if(exists)return false;
  document.getElementById('themeEdit').insertAdjacentHTML('beforeend',setupEditRow('テーマ',`t_${Date.now()}_${Math.random().toString(16).slice(2)}`,v,'テーマ'));
  bindSetupDelete();
  return true;
}
function addRandomThemesFromBank(){
  updateThemePickRecommendation(false);
  const {categories,intensities}=selectedThemeFilters();
  const count=Math.max(1,Number(document.getElementById('themePickCount')?.value||recommendedThemeCount(currentRosterCount())));
  const current=new Set([...document.querySelectorAll('#themeEdit input')].map(x=>x.value.trim()).filter(Boolean));
  const choices=shuffleClient(THEME_BANK.filter(x=>categories.includes(x.cat)&&intensities.includes(x.level)&&!current.has(x.text))).slice(0,count);
  let n=0; choices.forEach(x=>{if(appendTheme(x.text))n++;});
  notify(`${n}件のテーマを追加しました`);
  renderThemeChoices();
}
function bindThemeBank(){
  document.querySelectorAll('.themeCat,.themeLevel').forEach(x=>x.onchange=renderThemeChoices);
  const refresh=document.getElementById('refreshThemeChoices'); if(refresh)refresh.onclick=renderThemeChoices;
  const random=document.getElementById('addRandomThemes'); if(random)random.onclick=addRandomThemesFromBank;
  const count=document.getElementById('themePickCount'); if(count)count.oninput=()=>{count.dataset.touched='1';updateThemePickRecommendation(false);};
  const checked=document.getElementById('addCheckedThemes'); if(checked)checked.onclick=()=>{
    const selected=[...document.querySelectorAll('#themeChoiceList input:checked')].map(x=>x.value);
    let n=0; selected.forEach(t=>{if(appendTheme(t))n++;});
    notify(`${n}件のテーマを追加しました`);
    renderThemeChoices();
  };
  updateThemePickRecommendation(true);
  renderThemeChoices();
}

function openSetupFrom(state){
  setupOpen=true;
  editingSetup=true;
  const roster = state.roster?.length ? state.roster.map(c=>({id:c.id,name:c.name})) : makeDefaultRoster();
  const themes = state.themes?.length ? state.themes.map(t=>({id:t.id,title:t.title})) : pickThemeBank({categories:['本性','友情','ネタ'],intensities:['SAFE','SPICY'],count:recommendedThemeCount(roster.length)}).map((title,i)=>({id:`t_${Date.now()}_${i}`,title}));
  const rc = state.roleCounts || {frenemy:2,seer:1,madman:1};
  const suggestedThemeCount=recommendedThemeCount(roster.length);
  app.innerHTML=shell(`
    <section class="hero compact"><div class="eyebrow">ROOM ${esc(roomCode)}</div><h1>ゲーム設定</h1><p>出演者・役職数・事前アンケート用テーマを設定します。</p></section>
    <div class="grid setup-grid">
      <section class="card setup-section setup-wide"><h2>出演者</h2><p class="muted">5人以上必要です。ホストが出演者として入る場合も、ここに名前を入れてください。</p><div id="rosterEdit" class="setup-list">${roster.map((c,i)=>setupEditRow('出演者',c.id,c.name,`出演者 ${i+1}`)).join('')}</div><button class="secondary full" id="addRoster">＋ 出演者を追加</button></section>
      <section class="card setup-section setup-side"><h2>役職数</h2><p class="muted">合計が出演者数未満になるようにしてください。残りは市民になります。</p><div class="role-count-grid"><label class="role-count-card"><span>フレネミー</span><input id="rcF" type="number" min="1" value="${Number(rc.frenemy||1)}"></label><label class="role-count-card"><span>占い師</span><input id="rcS" type="number" min="0" value="${Number(rc.seer||0)}"></label><label class="role-count-card"><span>狂人</span><input id="rcM" type="number" min="0" value="${Number(rc.madman||0)}"></label></div><label class="setup-field">議論時間（秒）<input id="discussionSec" type="number" min="60" step="30" value="${Number(state.discussionSeconds||300)}"></label></section>
      ${themeBankHtml(suggestedThemeCount)}
      <section class="card setup-section setup-full"><h2>使用するテーマ</h2><p class="muted">ここに並んだテーマが各ラウンドのお題になります。手入力で追加・編集もできます。</p><div id="themeEdit" class="setup-list theme-list">${themes.map((t,i)=>setupEditRow('テーマ',t.id,t.title,`テーマ ${i+1}`)).join('')}</div><button class="secondary full" id="addTheme">＋ 空のテーマを追加</button></section>
      <section class="card setup-actions"><button class="big full" id="saveSetup">設定を保存</button><button class="ghost full" id="cancelSetup">戻る</button></section>
    </div>`, `<div class="room-code">${esc(roomCode)}</div>`);
  document.getElementById('addRoster').onclick=()=>{document.getElementById('rosterEdit').insertAdjacentHTML('beforeend',setupEditRow('出演者',`c_${Date.now()}`,'','出演者'));bindSetupDelete();updateThemePickRecommendation(false);};
  document.getElementById('addTheme').onclick=()=>{document.getElementById('themeEdit').insertAdjacentHTML('beforeend',setupEditRow('テーマ',`t_${Date.now()}_${Math.random().toString(16).slice(2)}`,'','テーマ'));bindSetupDelete();renderThemeChoices();};
  document.getElementById('cancelSetup').onclick=()=>{setupOpen=false;editingSetup=false;lastHostSig='';startHost();};
  document.getElementById('saveSetup').onclick=async()=>{
    const roster=[...document.querySelectorAll('#rosterEdit input')].map((x,i)=>({id:x.dataset.id||`c_${i}`,name:x.value.trim()})).filter(x=>x.name);
    const themes=[...document.querySelectorAll('#themeEdit input')].map((x,i)=>({id:x.dataset.id||`t_${i}`,title:x.value.trim()})).filter(x=>x.title);
    if(roster.length<5)return notify('出演者は5人以上にしてください'); if(themes.length<1)return notify('テーマを1つ以上入れてください');
    const roleCounts={frenemy:Number(document.getElementById('rcF').value||1),seer:Number(document.getElementById('rcS').value||0),madman:Number(document.getElementById('rcM').value||0)};
    try{await api(hostUrl('/setup'),{method:'POST',body:JSON.stringify({roster,themes,roleCounts,discussionSeconds:Number(document.getElementById('discussionSec').value||300)})});setupOpen=false;editingSetup=false;lastHostSig='';await startHost();}catch(e){notify(e.message)}
  };
  bindSetupDelete();
  bindThemeBank();
}
function setupEditRow(kind,id,value,placeholder){
  return `<div class="setup-edit-row"><label><span>${esc(kind)}</span><input value="${esc(value)}" data-id="${esc(id)}" placeholder="${esc(placeholder)}"></label><button class="ghost small del-row" type="button">削除</button></div>`;
}
function bindSetupDelete(){document.querySelectorAll('.del-row').forEach(b=>b.onclick=()=>{b.closest('.setup-edit-row,.edit-row').remove();renderThemeChoices();updateThemePickRecommendation(false);});}