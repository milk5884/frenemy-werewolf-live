async function renderTestView(){
  if(!roomCode){
    app.innerHTML=shell(`<section class="card center"><h2>テストビューを開けません</h2><p>room パラメータがありません。</p></section>`);
    return;
  }
  const token = qs.get('token') || localStorage.getItem(`fw_host_${roomCode}`) || '';
  if(!token){
    app.innerHTML=shell(`<section class="card center"><h2>ホストトークンが必要です</h2><p>ホスト画面の「テストビューを開く」から開いてください。</p><p class="muted">形式：?mode=test&room=${esc(roomCode)}&token=...</p></section>`, `<div class="room-code">${esc(roomCode)}</div>`);
    return;
  }
  try{
    const state = await api(`/api/rooms/${roomCode}/host?token=${encodeURIComponent(token)}`);
    const origin = `${location.protocol}//${location.host}`;
    const hostFrame = `${origin}/?mode=host&room=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(token)}&slot=test-host`;
    const surveyFrame = `${origin}/?mode=survey&room=${encodeURIComponent(roomCode)}&key=${encodeURIComponent(state.surveyKey)}&slot=survey-1`;
    const playerFrames = state.roster.map((cast,i)=>({
      title: cast.name,
      slot: `player-${i+1}`,
      url: `${origin}/?mode=join&room=${encodeURIComponent(roomCode)}&slot=player-${i+1}`
    }));
    app.innerHTML = shell(`
      <section class="test-head">
        <div><div class="eyebrow">MULTI DEVICE TEST</div><h1>テストビュー</h1><p>1つの画面でホスト、視聴者アンケート、出演者端末を同時に確認できます。</p></div>
        <div class="test-actions"><button class="secondary" id="reloadFrames">全端末を再読込</button><button class="ghost" id="clearTestStorage">テスト保存を削除</button></div>
      </section>
      <section class="test-guide card">
        <b>検証手順</b>
        <span>1. アンケート端末でTOP3を選んで送信</span>
        <span>2. 各出演者端末で自分の名前をタップ</span>
        <span>3. ホスト端末でアンケート確定 → ゲーム開始</span>
      </section>
      <div class="test-grid">
        ${testFrameHtml('ホスト端末', hostFrame, 'host')}
        ${testFrameHtml('アンケート端末', surveyFrame, 'survey')}
        ${playerFrames.map((p,i)=>testFrameHtml(`出演者 ${i+1}: ${p.title}`, p.url, p.slot)).join('')}
      </div>
    `, `<div class="room-code">${esc(roomCode)}</div>`);
    document.getElementById('reloadFrames').onclick=()=>document.querySelectorAll('.test-frame iframe').forEach(f=>f.contentWindow?.location.reload());
    document.getElementById('clearTestStorage').onclick=()=>{
      const prefixes=[`fw_player_${roomCode}_player-`,`fw_survey_device_${roomCode}_survey-`,`fw_survey_done_${roomCode}_${state.surveyKey}_survey-`,`fw_draft_${roomCode}_`];
      for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(prefixes.some(p=>k.startsWith(p)))localStorage.removeItem(k);}
      for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k.startsWith(`fw_draft_${roomCode}_`))sessionStorage.removeItem(k);}
      notify('テスト用保存を削除しました');
      setTimeout(()=>location.reload(),400);
    };
  }catch(e){
    app.innerHTML=shell(`<section class="card center"><h2>テストビューを開けません</h2><p>${esc(e.message)}</p></section>`, `<div class="room-code">${esc(roomCode)}</div>`);
  }
}
function testFrameHtml(title,url,slot){
  return `<section class="test-frame" data-slot="${esc(slot)}"><div class="test-frame-bar"><b>${esc(title)}</b><a href="${esc(url)}" target="_blank" rel="noopener">別窓</a></div><iframe src="${esc(url)}" title="${esc(title)}"></iframe></section>`;
}
