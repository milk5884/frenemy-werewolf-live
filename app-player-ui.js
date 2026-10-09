function playerPhaseHtml(state){
  const me=state.player; const theme=state.theme;
  if(state.phase==='lobby') return `<section class="card center"><div class="metric">参加完了</div><p>ホストがゲームを開始するまでこの画面のままお待ちください。</p></section>`;
  if(state.phase==='roleReveal'){
    if(!me.roleSeen) return `<section class="card"><div class="role-card"><span class="role-icon large locked-card"><span>?</span></span><div class="kicker">SECRET ROLE</div><div class="role-name locked">フレネミー</div><p>周りから画面が見えないことを確認してください。</p><button class="big" id="revealRole">役職を見る</button></div></section>`;
    return `<section class="card">${roleCard(state)}<div class="center"><p>確認できたら、そのままお待ちください。</p></div></section>`;
  }
  if(state.phase==='gameOver'){
    return `<section class="card center"><div class="kicker">GAME OVER</div><div class="theme-title">役職公開</div><div class="list" style="text-align:left">${state.roster.map(c=>{const r=roleMeta[c.role]||roleMeta.citizen;return `<div class="row"><div class="row-title ${c.alive?'':'dead'}">${esc(c.name)}</div><div class="pill ${r.cls}">${roleIcon(c.role)} ${esc(c.roleLabel||r.label)}</div></div>`}).join('')}</div></section>`;
  }
  const dead=!me.alive;
  const seerDraft=getDraft(state,'seer');
  const finalDraft=getDraft(state,'final');
  const attackDraft=getDraft(state,'attack');
  const suspectDraft=getDraft(state,'suspect');
  let top=`<section class="phase"><div class="kicker">ROUND ${state.roundIndex+1} · ${esc(phaseLabels[state.phase]||state.phase)}</div>${theme?`<div class="theme-title">${esc(theme.title)}</div>`:''}<div class="mini-status"><span>${esc(state.title||'フレネミー人狼')}</span><span>${dead?'脱落済み':'参加中'}</span></div>${dead?`<div class="pill">あなたは脱落済み</div>`:''}</section>`;
  let body='';
  if(state.phase==='theme') body=`<section class="card center"><h2>テーマを確認</h2><p>このあとフレネミー情報、占いの順に進みます。</p></section>`;
  if(state.phase==='frenemyInfo'){
    if(me.role==='frenemy'&&me.alive) body=`<section class="secret center"><div class="kicker">FRENEMY ONLY</div><h2>視聴者ランキング1位</h2><div class="theme-title accent">${esc(state.frenemyTarget||'—')}</div><p>この人物を、最終投票で1位から落としてください。個別ミッションはありません。</p></section>`;
    else body=`<section class="card center"><h2>秘密情報の確認中</h2><p>あなたに新しい情報はありません。</p></section>`;
  }
  if(state.phase==='seer'){
    if(me.role==='seer'&&me.alive){
      if(state.seerCheck) body=`<section class="secret center"><div class="kicker">占い結果</div><div class="theme-title">${esc(state.seerCheck.targetName)}</div><div class="metric">事前 ${state.seerCheck.rank}位</div><p>この情報を公開するか、隠すかは自由です。</p></section>`;
      else body=`<section class="card"><h2>🔮 占う人物を1人選ぶ</h2><p>議論が始まる前に、今回の事前アンケート順位を1人だけ確認できます。</p><div class="field"><select id="seerTarget"><option value="">選択してください</option>${state.roster.map(c=>`<option value="${c.id}"${selectedAttr(c.id,seerDraft)}>${esc(c.name)}</option>`).join('')}</select></div><button class="big full" id="seerBtn">この人を占う</button></section>`;
    }else body=`<section class="card center"><h2>占いの時間</h2><p>${dead?'脱落しているため能力・投票には参加できません。':'占い師が秘密裏に1人を確認しています。'}</p></section>`;
  }
  if(state.phase==='discussion'){
    const left=state.timerEndsAt?Math.max(0,(state.timerEndsAt-Date.now())/1000):0;
    body=`<section class="card center"><div class="kicker">DISCUSSION</div><div class="timer" data-timer-end="${state.timerEndsAt||0}">${fmtTime(left)}</div><p>誰が本心で話していて、誰がランキングを操作しているのか。</p>${me.role==='frenemy'&&state.frenemyTarget?`<div class="secret"><div class="kicker">あなたのターゲット</div><h2>${esc(state.frenemyTarget)}</h2></div>`:''}${me.role==='seer'&&state.seerCheck?`<div class="secret"><div class="kicker">あなたの占い結果</div><h3>${esc(state.seerCheck.targetName)}：事前 ${state.seerCheck.rank}位</h3></div>`:''}</section>`;
  }
  if(state.phase==='finalVote'){
    if(dead) body=`<section class="card center"><h2>ランキング投票</h2><p>脱落しているため投票権はありません。</p></section>`;
    else if(state.votedFinal) body=`<section class="card center"><div class="metric good">投票完了</div><p>全員の投票が終わるまでお待ちください。</p></section>`;
    else body=`<section class="card"><h2>最終投票</h2><p>今回のテーマで「1位」だと思う人物を選んでください。自分への投票も可能です。</p><div class="field"><select id="finalTarget"><option value="">選択してください</option>${state.roster.map(c=>`<option value="${c.id}"${selectedAttr(c.id,finalDraft)}>${esc(c.name)}</option>`).join('')}</select><div class="field-hint">選択中の候補は自動更新が入っても保持されます。</div></div><button class="big full" id="finalVoteBtn">投票を確定</button></section>`;
  }
  if(['result','attack','suspectVote','roundEnd'].includes(state.phase) && state.roundResult){
    const rr=state.roundResult; const success=rr.success;
    body=`<section class="card center"><div class="kicker">ROUND RESULT</div><h2>視聴者事前1位</h2><div class="theme-title">${esc(rr.officialTopName)}</div><p>最終投票1位：${rr.winnerNames.map(esc).join(' / ')||'—'}</p><div class="result-win ${success?'bad':'good'}">${success?'😈 フレネミー成功':'🛡️ フレネミー失敗'}</div></section>`;
  }
  if(state.phase==='attack'){
    if(me.role==='frenemy'&&me.alive){
      if(state.attacked) body+=`<section class="card center"><h2>襲撃先を選択済み</h2><p>もう1人のフレネミーと一致すると襲撃が成立します。</p></section>`;
      else { const partners=new Set((state.frenemyPartners||[]).map(x=>x.id)); const targets=state.roster.filter(c=>c.alive&&c.id!==me.id&&!partners.has(c.id)); body+=`<section class="card"><h2>😈 襲撃する人物</h2><div class="field"><select id="attackTarget"><option value="">選択してください</option>${targets.map(c=>`<option value="${c.id}"${selectedAttr(c.id,attackDraft)}>${esc(c.name)}</option>`).join('')}</select><div class="field-hint">選択中の候補は自動更新が入っても保持されます。</div></div><button class="danger big full" id="attackBtn">襲撃先を決定</button></section>`; }
    } else body+=`<section class="card center"><h2>夜の時間</h2><p>フレネミーが襲撃先を選んでいます。</p></section>`;
  }
  if(state.phase==='suspectVote'){
    if(dead) body+=`<section class="card center"><h2>フレネミー投票</h2><p>脱落しているため投票できません。</p></section>`;
    else if(state.votedSuspect) body+=`<section class="card center"><div class="metric good">投票完了</div><p>結果をお待ちください。</p></section>`;
    else body+=`<section class="card"><h2>一番怪しい人物は？</h2><p>今回の議論で、ランキングを意図的に操作していたと思う人物を選んでください。</p><div class="field"><select id="suspectTarget"><option value="">選択してください</option>${state.roster.filter(c=>c.alive&&c.id!==me.id).map(c=>`<option value="${c.id}"${selectedAttr(c.id,suspectDraft)}>${esc(c.name)}</option>`).join('')}</select><div class="field-hint">選択中の候補は自動更新が入っても保持されます。</div></div><button class="big full" id="suspectBtn">フレネミー投票</button></section>`;
  }
  if(state.phase==='roundEnd') body+=`<section class="card center"><h2>ラウンド終了</h2><p>次のテーマまでお待ちください。</p></section>`;
  return `<div class="grid"><div class="card two-third">${top}</div><div class="card third player-summary"><div class="kicker">YOU</div><h2>${esc(me.name)}</h2><div class="pill">${roleIcon(me.role)} ${esc(me.roleLabel)}</div></div><div style="grid-column:span 12">${phaseProgressHtml(state,true)}</div><div style="grid-column:span 12">${body}</div></div>`;
}

