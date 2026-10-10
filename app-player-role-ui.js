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
function fwInfoList(items){return `<div class="app-two-stack">${items.map(([k,v])=>`<div class="app-info-line"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>`;}
function fwMini(html){return `<div class="app-mini-secret">${html}</div>`;}

const fwBasePlayerPhaseHtml=playerPhaseHtml;
playerPhaseHtml=function(state){
  const me=state.player;
  const infoPhase=['seer','discussion','finalVote'].includes(state.phase);
  if(state.phase==='seer'&&me.role==='seer'&&me.alive&&state.seerCheck){
    return fwRoleScreen(state,{tone:'secret',icon:'🔮',title:'占い結果',subtitle:'対象の事前アンケート順位です。',body:`
      <div class="app-target-card"><div class="app-overline">FORTUNE RESULT</div><h2>${esc(state.seerCheck.targetName)}</h2><p>調査上の事前順位：${state.seerCheck.rank}位</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>占い済み</button></div>`});
  }
  if(state.phase==='seer'&&me.role==='comparer'&&me.alive){
    if(state.compareCheck){
      const text=state.compareCheck.isTie?'同率':`${state.compareCheck.higherName||'—'} が上`;
      return fwRoleScreen(state,{tone:'secret',icon:'⚖️',title:'比較結果',subtitle:'2人の調査上の順位を比較しました。',body:`
        <div class="app-target-card"><div class="app-overline">COMPARE RESULT</div><h2>${esc(text)}</h2><p>${esc(state.compareCheck.leftName)}：${state.compareCheck.leftRank}位 / ${esc(state.compareCheck.rightName)}：${state.compareCheck.rightRank}位</p></div>
        <div class="app-action-panel"><button class="secondary full" disabled>比較済み</button></div>`});
    }
    return fwRoleScreen(state,{tone:'action',icon:'⚖️',title:'2人を比較する',subtitle:'議論前に、どちらが事前順位で上か、または同率かを確認できます。',body:`
      <div class="app-action-panel">
        <label class="app-select-label">1人目<select id="compareLeft"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <label class="app-select-label">2人目<select id="compareRight"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <button class="big full" id="compareBtn">この2人を比較する</button>
      </div>`});
  }
  if(state.phase==='seer'&&me.role==='spoofer'&&me.alive){
    if(state.spooferUsed&&!state.spooferDecision){
      return fwRoleScreen(state,{tone:'wait',icon:'🎭',title:'工作済み',subtitle:'工作能力は1ゲーム1回だけです。以降は通常通り議論に参加してください。',body:`<div class="app-message"><div class="app-message-icon">🎭</div><h2>使用済み</h2><p>調査用ランキングへの工作はすでに使用されています。</p></div>`});
    }
    if(state.spooferDecision){
      const text=state.spooferDecision.used?`${state.spooferDecision.leftName} と ${state.spooferDecision.rightName} を入れ替えました`:'このラウンドでは使用しません';
      return fwRoleScreen(state,{tone:'secret',icon:'🎭',title:'工作選択済み',subtitle:'この選択は調査用ランキングだけに影響します。真ランキングや勝敗判定は変わりません。',body:`<div class="app-message"><div class="app-message-icon">🎭</div><h2>${esc(text)}</h2><p>他の情報役職の行動を待っています。</p></div>`});
    }
    return fwRoleScreen(state,{tone:'action',icon:'🎭',title:'調査用ランキングを工作',subtitle:'1ゲームに1回だけ、調査用ランキング上の2人を入れ替えられます。使わず温存もできます。',body:`
      <div class="app-action-panel">
        <label class="app-select-label">入れ替える人 A<select id="spooferLeft"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <label class="app-select-label">入れ替える人 B<select id="spooferRight"><option value="">選択してください</option>${fwRoleOptions(state)}</select></label>
        <button class="big full" id="spooferBtn">この2人を入れ替える</button>
        <button class="secondary full" id="spooferSkipBtn">このラウンドでは使わない</button>
      </div>`});
  }
  if(infoPhase&&me.role==='narcissist'&&state.narcissistInfo){
    const info=state.narcissistInfo;
    return fwRoleScreen(state,{tone:'secret',icon:'💖',title:'あなたの現在順位',subtitle:'ナルシストは、自分がどの位置にいるかを確認できます。',body:`
      <div class="app-target-card"><div class="app-overline">MY RANK</div><h2>${info.rank}位</h2><p>${info.inTop3?'TOP3に入っています':'TOP3外です'} / 生存者 ${info.aliveTotal}人中</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>この情報を使って議論してください</button></div>`});
  }
  if(infoPhase&&me.role==='mounter'&&state.mounterInfo){
    const lower=state.mounterInfo.lowerNames?.length?state.mounterInfo.lowerNames.join(' / '):'下位の生存者はいません';
    return fwRoleScreen(state,{tone:'secret',icon:'👑',title:'あなたより下位の人',subtitle:'マウンターは、自分より下にいる生存者を確認できます。',body:`
      <div class="app-target-card"><div class="app-overline">BELOW YOU</div><h2>${state.mounterInfo.lowerCount}人</h2><p>${esc(lower)}</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>この情報を使って議論してください</button></div>`});
  }
  if(infoPhase&&me.role==='analyst'&&state.analystInfo){
    const a=state.analystInfo;
    return fwRoleScreen(state,{tone:'secret',icon:'📊',title:'1位と2位の得点差',subtitle:'アナリストは、調査用ランキング上位2人の点差を確認できます。',body:`
      <div class="app-target-card"><div class="app-overline">POINT GAP</div><h2>${a.gap}点差</h2><p>1位 ${esc(a.firstName)}（${a.firstPoints}点） / 2位 ${esc(a.secondName)}（${a.secondPoints}点）</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>この情報を使って議論してください</button></div>`});
  }
  if(['discussion','finalVote','suspectVote','roundEnd'].includes(state.phase)&&me.role==='coroner'&&state.coronerInfo){
    const c=state.coronerInfo;
    return fwRoleScreen(state,{tone:'secret',icon:'☠️',title:'検死結果',subtitle:'脱落者の中に、調査用ランキングの初期1位が含まれているかを確認できます。',body:`
      <div class="app-target-card"><div class="app-overline">CORONER INFO</div><h2>${c.included?'含まれています':'含まれていません'}</h2><p>調査上の初期1位：${esc(c.initialTopName)} / 脱落者 ${c.eliminatedCount}人</p></div>
      <div class="app-action-panel"><button class="secondary full" disabled>この情報を使って議論してください</button></div>`});
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
  return fwBasePlayerPhaseHtml(state);
};
