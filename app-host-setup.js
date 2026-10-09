function getHostToken(){ return qs.get('token') || localStorage.getItem(`fw_host_${roomCode}`) || ''; }
function hostUrl(path){ return `/api/rooms/${roomCode}/host${path||''}?token=${encodeURIComponent(getHostToken())}`; }
function makeDefaultRoster(){return ['Aさん','Bさん','Cさん','Dさん','Eさん','Fさん'].map((name,i)=>({id:`c_${Date.now()}_${i}`,name}));}
function makeDefaultThemes(){return ['一番リーダーっぽい人','一番秘密を隠していそうな人','一番最後まで生き残りそうな人'].map((title,i)=>({id:`t_${Date.now()}_${i}`,title}));}
function openSetupFrom(state){
  setupOpen=true;
  editingSetup=true;
  const roster = state.roster?.length ? state.roster.map(c=>({id:c.id,name:c.name})) : makeDefaultRoster();
  const themes = state.themes?.length ? state.themes.map(t=>({id:t.id,title:t.title})) : makeDefaultThemes();
  const rc = state.roleCounts || {frenemy:2,seer:1,madman:1};
  app.innerHTML=shell(`
    <section class="hero compact"><div class="eyebrow">ROOM ${esc(roomCode)}</div><h1>ゲーム設定</h1><p>出演者・役職数・事前アンケート用テーマを設定します。</p></section>
    <div class="grid setup-grid">
      <section class="card setup-section setup-wide"><h2>出演者</h2><p class="muted">5人以上必要です。ホストが出演者として入る場合も、ここに名前を入れてください。</p><div id="rosterEdit" class="setup-list">${roster.map((c,i)=>setupEditRow('出演者',c.id,c.name,`出演者 ${i+1}`)).join('')}</div><button class="secondary full" id="addRoster">＋ 出演者を追加</button></section>
      <section class="card setup-section setup-side"><h2>役職数</h2><p class="muted">合計が出演者数未満になるようにしてください。残りは市民になります。</p><div class="role-count-grid"><label class="role-count-card"><span>フレネミー</span><input id="rcF" type="number" min="1" value="${Number(rc.frenemy||1)}"></label><label class="role-count-card"><span>占い師</span><input id="rcS" type="number" min="0" value="${Number(rc.seer||0)}"></label><label class="role-count-card"><span>狂人</span><input id="rcM" type="number" min="0" value="${Number(rc.madman||0)}"></label></div><label class="setup-field">議論時間（秒）<input id="discussionSec" type="number" min="60" step="30" value="${Number(state.discussionSeconds||300)}"></label></section>
      <section class="card setup-section setup-full"><h2>テーマ</h2><p class="muted">出演者アンケートで「このテーマなら誰が1位か」を選ぶお題です。</p><div id="themeEdit" class="setup-list theme-list">${themes.map((t,i)=>setupEditRow('テーマ',t.id,t.title,`テーマ ${i+1}`)).join('')}</div><button class="secondary full" id="addTheme">＋ テーマを追加</button></section>
      <section class="card setup-actions"><button class="big full" id="saveSetup">設定を保存</button><button class="ghost full" id="cancelSetup">戻る</button></section>
    </div>`, `<div class="room-code">${esc(roomCode)}</div>`);
  document.getElementById('addRoster').onclick=()=>{document.getElementById('rosterEdit').insertAdjacentHTML('beforeend',setupEditRow('出演者',`c_${Date.now()}`,'','出演者'));bindSetupDelete();};
  document.getElementById('addTheme').onclick=()=>{document.getElementById('themeEdit').insertAdjacentHTML('beforeend',setupEditRow('テーマ',`t_${Date.now()}`,'','テーマ'));bindSetupDelete();};
  document.getElementById('cancelSetup').onclick=()=>{setupOpen=false;editingSetup=false;lastHostSig='';startHost();};
  document.getElementById('saveSetup').onclick=async()=>{
    const roster=[...document.querySelectorAll('#rosterEdit input')].map((x,i)=>({id:x.dataset.id||`c_${i}`,name:x.value.trim()})).filter(x=>x.name);
    const themes=[...document.querySelectorAll('#themeEdit input')].map((x,i)=>({id:x.dataset.id||`t_${i}`,title:x.value.trim()})).filter(x=>x.title);
    if(roster.length<5)return notify('出演者は5人以上にしてください'); if(themes.length<1)return notify('テーマを1つ以上入れてください');
    const roleCounts={frenemy:Number(document.getElementById('rcF').value||1),seer:Number(document.getElementById('rcS').value||0),madman:Number(document.getElementById('rcM').value||0)};
    try{await api(hostUrl('/setup'),{method:'POST',body:JSON.stringify({roster,themes,roleCounts,discussionSeconds:Number(document.getElementById('discussionSec').value||300)})});setupOpen=false;editingSetup=false;lastHostSig='';await startHost();}catch(e){notify(e.message)}
  };
  bindSetupDelete();
}
function setupEditRow(kind,id,value,placeholder){
  return `<div class="setup-edit-row"><label><span>${esc(kind)}</span><input value="${esc(value)}" data-id="${esc(id)}" placeholder="${esc(placeholder)}"></label><button class="ghost small del-row" type="button">削除</button></div>`;
}
function bindSetupDelete(){document.querySelectorAll('.del-row').forEach(b=>b.onclick=()=>b.closest('.setup-edit-row,.edit-row').remove());}
