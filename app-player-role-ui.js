function fwRoleOptions(state,excludeIds=[]){
  const ex=new Set(excludeIds.filter(Boolean));
  return state.roster.filter(c=>c.alive&&!ex.has(c.id)).map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}
function fwRoleScreen(state,{tone='action',title,subtitle,icon='✦',body=''}){
  const theme=state.theme;
  return `<section class="app-screen app-screen-${tone}">
    <div class="app-screen-head"><div><div class="app-overline">ROUND ${state.roundIndex+1} · ${esc(phaseLabels[state.phase]||state.phase)}</div><h1>${esc(title)}</h1><p>${esc(subtitle||'')}</p></div><div class="app-round-badge">${esc(icon)}</div></div>
    ${theme?`<div class="app-theme-chip"><span>今回のテーマ</span><b>${esc(theme.title)}</b></div>`:''}
    ${body}
    <div class="app-player-strip"><span>${roleIcon(state.player.role)} ${esc(state.player.name)}</span><span>${esc(state.player.roleLabel||'')}</span></div>
  </section>`;
}

const fwBasePlayerPhaseHtml=playerPhaseHtml;
playerPhaseHtml=function(state){
  const me=state.player;
  if(state.phase==='seer'&&me.role==='seer'&&me.alive&&state.seerCheck){
    return fwRoleScreen(state,{tone:'secret',icon:'🔮',title:'占い結果',subtitle:'対象の事前順位と、占いで見えた役職です。なりすましは市民のように見えます。',body:`
      <div class="app-target-card"><div class="app-overline">FORTUNE RESULT</div><h2>${esc(state.seerCheck.targetName)}</h2><p>事前 ${state.seerCheck.rank}位 / 見えた役職：${esc(state.seerCheck.seenRoleLabel||'—')}</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>占い済み</button></div>`});
  }
  if(state.phase==='seer'&&me.role==='comparer'&&me.alive){
    if(state.compareCheck){
      return fwRoleScreen(state,{tone:'secret',icon:'⚖️',title:'比較結果',subtitle:'2人のうち、事前アンケート順位が上だった人です。',body:`
        <div class="app-target-card"><div class="app-overline">HIGHER RANK</div><h2>${esc(state.compareCheck.higherName||'—')}</h2><p>${esc(state.compareCheck.leftName)}：${state.compareCheck.leftRank}位 / ${esc(state.compareCheck.rightName)}：${state.compareCheck.rightRank}位</p></div>
        <div class="app-action-panel"><button class="secondary full" disabled>比較済み</button></div>`});
    }
    return fwRoleScreen(state,{tone:'action',icon:'⚖️',title:'2人を比較する',subtitle:'議論前に、どちらが事前順位で上か確認できます。',body:`
      <div class="app-action-panel">
        <label class="app-select-label">1人目<select id="compareLeft"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <label class="app-select-label">2人目<select id="compareRight"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <button class="big full" id="compareBtn">この2人を比較する</button>
      </div>`});
  }
  if(state.phase==='attack'&&me.role==='knight'&&me.alive){
    if(state.guarded){
      return fwRoleScreen(state,{tone:'wait',icon:'🛡️',title:'護衛済み',subtitle:'フレネミーの襲撃結果を待っています。護衛先が襲撃先と一致すると襲撃を防ぎます。',body:`<div class="app-message"><div class="app-message-icon">🛡️</div><h2>守りを固めました</h2><p>他の夜行動が終わるまで待機してください。</p></div>`});
    }
    return fwRoleScreen(state,{tone:'action',icon:'🛡️',title:'護衛する人物',subtitle:'夜に1人を守れます。襲撃先と一致すれば、その人は脱落しません。',body:`
      <div class="app-action-panel">
        <label class="app-select-label">護衛先<select id="guardTarget"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <button class="big full" id="guardBtn">この人を護衛する</button>
      </div>`});
  }
  if(state.phase==='roundEnd'&&me.role==='medium'&&state.mediumInfo){
    return fwRoleScreen(state,{tone:'secret',icon:'🕯️',title:'霊媒結果',subtitle:'直近で追放された人の正体です。次の議論に活かしてください。',body:`
      <div class="app-target-card"><div class="app-overline">LAST ELIMINATED</div><h2>${esc(state.mediumInfo.name)}</h2><p>${esc(state.mediumInfo.roleLabel)} / ${state.mediumInfo.isFrenemySide?'フレネミー陣営':'市民陣営'}</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>次のラウンドを待機</button></div>`});
  }
  const html=fwBasePlayerPhaseHtml(state);
  if(state.phase==='finalVote'&&me.role==='mounter'&&!state.votedFinal){
    return html.replace('<div class="app-action-panel">','<div class="app-mini-secret"><span>マウンター能力</span><b>あなたのランキング投票は2票分として集計されます。</b></div><div class="app-action-panel">');
  }
  if(state.phase==='finalVote'&&me.role==='narcissist'&&!state.votedFinal){
    return html.replace('<div class="app-action-panel">','<div class="app-mini-secret"><span>ナルシスト能力</span><b>自分に投票すると特殊表示されます。</b></div><div class="app-action-panel">');
  }
  return html;
};
