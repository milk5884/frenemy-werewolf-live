function appScreen(state, opts={}){
  const me=state.player || {};
  const phase=phaseLabels[state.phase]||state.phase;
  const status=me.alive===false?'脱落済み':'参加中';
  const theme=state.theme?.title;
  const role=me.roleLabel||roleMeta[me.role]?.label||'';
  const roleHtml=me.role?`${roleIcon(me.role)} ${esc(role)}`:'';
  return `<section class="app-screen ${opts.tone?`app-screen-${opts.tone}`:''}">
    <div class="app-screen-head">
      <div><div class="app-overline">${esc(opts.kicker||phase)}</div><h1>${esc(opts.title||phase)}</h1>${opts.subtitle?`<p>${esc(opts.subtitle)}</p>`:''}</div>
      <div class="app-round-badge">R${Number(state.roundIndex||0)+1}</div>
    </div>
    ${theme?`<div class="app-theme-chip"><span>テーマ</span><b>${esc(theme)}</b></div>`:''}
    ${opts.body||''}
    <div class="app-player-strip"><span>${esc(me.name||'')}</span><span>${roleHtml}</span><span>${esc(status)}</span></div>
  </section>`;
}
function waitCard(title,text='',icon='⏳'){
  return `<div class="app-message"><div class="app-message-icon">${esc(icon)}</div><h2>${esc(title)}</h2>${text?`<p>${esc(text)}</p>`:''}</div>`;
}
function actionPanel(inner){return `<div class="app-action-panel">${inner}</div>`;}
function selectOptions(casts,selected){return casts.map(c=>`<option value="${c.id}"${selectedAttr(c.id,selected)}>${esc(c.name)}</option>`).join('');}
function alivePlayers(state){return state.roster.filter(c=>c.alive);}
function playerPhaseHtml(state){
  const me=state.player; const dead=!me.alive;
  const seerDraft=getDraft(state,'seer');
  const finalDraft=getDraft(state,'final');
  const attackDraft=getDraft(state,'attack');
  const suspectDraft=getDraft(state,'suspect');
  if(state.phase==='lobby'){
    if(!state.surveySubmitted){
      return appScreen(state,{kicker:'PLAYER SURVEY',title:`${me.name}さんの事前アンケート`,subtitle:'各テーマでTOP3を選ぶと、ゲーム開始準備が進みます。',tone:'survey',body:`${playerSurveyHtml(state)}`});
    }
    return appScreen(state,{kicker:'READY',title:'準備完了',subtitle:`出演者アンケート ${state.playerSurveyCount||0} / ${state.roster.length}`,tone:'ready',body:waitCard('開始までお待ちください','ホストがアンケートを確定するとゲームが始まります。','✓')});
  }
  if(state.phase==='roleReveal'){
    if(!me.roleSeen){
      return appScreen(state,{kicker:'SECRET ROLE',title:'役職確認',subtitle:'周りから画面が見えないことを確認してください。',tone:'secret',body:actionPanel(`<div class="role-card app-role-lock"><span class="role-icon large locked-card"><span>?</span></span><h2>あなたの役職</h2><p>この情報は自分だけが確認します。</p><button class="big full" id="revealRole">役職を見る</button></div>`)});
    }
    return appScreen(state,{kicker:'ROLE CONFIRMED',title:'役職を確認しました',subtitle:'開始までそのままお待ちください。',tone:'ready',body:`<div class="app-role-card">${roleIcon(me.role,'large')}<div class="app-overline">YOUR ROLE</div><h2>${esc(me.roleLabel)}</h2><p>${esc((roleMeta[me.role]||{}).desc||'')}</p>${me.role==='frenemy'&&state.frenemyPartners?.length?`<div class="app-info-line"><span>仲間</span><b>${state.frenemyPartners.map(x=>esc(x.name)).join(' / ')}</b></div>`:''}</div>`});
  }
  if(state.phase==='gameOver'){
    return appScreen(state,{kicker:'GAME OVER',title:'役職公開',tone:'result',body:`<div class="app-reveal-list">${state.roster.map(c=>{const r=roleMeta[c.role]||roleMeta.citizen;return `<div class="app-reveal-row ${c.alive?'':'dead'}"><span>${esc(c.name)}</span><b>${roleIcon(c.role)} ${esc(c.roleLabel||r.label)}</b></div>`}).join('')}</div>`});
  }
  let body='';
  if(state.phase==='theme'){
    body=waitCard('テーマを確認','このあと秘密情報と能力確認へ進みます。','☀️');
    return appScreen(state,{kicker:'NEW ROUND',title:'朝が来ました',subtitle:'新しいラウンドの開始です。',tone:'day',body});
  }
  if(state.phase==='frenemyInfo'){
    if(me.role==='frenemy'&&me.alive){
      body=`<div class="app-target-card"><span>今回落とすターゲット</span><h2>${esc(state.frenemyTarget||'—')}</h2><p>脱落者を除いた現在1位です。</p></div>`;
      return appScreen(state,{kicker:'FRENEMY ONLY',title:'秘密情報',subtitle:'この画面はフレネミーだけに表示されています。',tone:'secret',body});
    }
    return appScreen(state,{kicker:'SECRET CHECK',title:'待機中',subtitle:'秘密情報の確認が行われています。',tone:'wait',body:waitCard('あなたに新しい情報はありません','次のフェーズまでお待ちください。','…')});
  }
  if(state.phase==='seer'){
    if(me.role==='seer'&&me.alive){
      if(state.seerCheck){
        body=`<div class="app-target-card"><span>占い結果</span><h2>${esc(state.seerCheck.targetName)}</h2><p>事前アンケート ${state.seerCheck.rank}位</p></div>`;
        return appScreen(state,{kicker:'FORTUNE RESULT',title:'占い結果',subtitle:'この情報を話すか隠すかは自由です。',tone:'secret',body});
      }
      body=actionPanel(`<label class="app-select-label">占う人物<select id="seerTarget"><option value="">選択してください</option>${selectOptions(state.roster,seerDraft)}</select></label><button class="big full" id="seerBtn">この人を占う</button>`);
      return appScreen(state,{kicker:'FORTUNE TELLER',title:'1人を占う',subtitle:'議論前に、1人の事前順位を確認できます。',tone:'action',body});
    }
    return appScreen(state,{kicker:'FORTUNE TIME',title:'占いの時間',subtitle:dead?'脱落中のため参加できません。':'占い師が確認しています。',tone:'wait',body:waitCard('確認中','次のフェーズまでお待ちください。','🔮')});
  }
  if(state.phase==='discussion'){
    const left=state.timerEndsAt?Math.max(0,(state.timerEndsAt-Date.now())/1000):0;
    const skipText=`${state.discussionSkipCount||0} / ${alivePlayers(state).length}`;
    const skipButton=dead?`<button class="secondary full" disabled>脱落中</button>`:state.discussionSkipped?`<button class="secondary full" disabled>スキップ送信済み</button>`:`<button class="secondary full" id="discussionSkipBtn">議論をスキップ</button>`;
    body=`<div class="app-timer-card"><span>残り時間</span><div class="timer" data-timer-end="${state.timerEndsAt||0}">${fmtTime(left)}</div></div><div class="app-two-stack">${me.role==='frenemy'&&state.frenemyTarget?`<div class="app-mini-secret"><span>ターゲット</span><b>${esc(state.frenemyTarget)}</b></div>`:''}${me.role==='seer'&&state.seerCheck?`<div class="app-mini-secret"><span>占い結果</span><b>${esc(state.seerCheck.targetName)}：${state.seerCheck.rank}位</b></div>`:''}</div>${actionPanel(`<div class="app-info-line"><span>スキップ</span><b>${esc(skipText)}</b></div>${skipButton}`)}`;
    return appScreen(state,{kicker:'DISCUSSION',title:'議論タイム',subtitle:'誰がランキングを動かしているか話し合いましょう。',tone:'talk',body});
  }
  if(state.phase==='finalVote'){
    if(dead) return appScreen(state,{kicker:'RANKING VOTE',title:'ランキング投票',subtitle:'脱落中のため投票権はありません。',tone:'wait',body:waitCard('投票待機','結果をお待ちください。','🗳️')});
    if(state.votedFinal) return appScreen(state,{kicker:'VOTED',title:'投票完了',subtitle:'全員の投票が終わるまでお待ちください。',tone:'ready',body:waitCard('送信しました','投票内容は反映されています。','✓')});
    body=actionPanel(`<label class="app-select-label">1位だと思う人物<select id="finalTarget"><option value="">選択してください</option>${selectOptions(alivePlayers(state),finalDraft)}</select></label><button class="big full" id="finalVoteBtn">投票を確定</button>`);
    return appScreen(state,{kicker:'RANKING VOTE',title:'1位を選ぶ',subtitle:'今回のテーマで一番当てはまる人物を選んでください。',tone:'action',body});
  }
  if(state.phase==='result'&&state.roundResult){
    const rr=state.roundResult; const success=rr.success;
    body=`<div class="app-result-hero ${success?'bad':'good'}"><span>${success?'😈':'🛡️'}</span><h2>${success?'フレネミー成功':'フレネミー失敗'}</h2><p>ターゲット：${esc(rr.officialTopName||'—')}</p></div>${voteResultTable(rr)}`;
    return appScreen(state,{kicker:'ROUND RESULT',title:'結果発表',subtitle:`最終投票1位：${rr.winnerNames.map(esc).join(' / ')||'—'}`,tone:'result',body});
  }
  if(state.phase==='attack'){
    if(me.role==='frenemy'&&me.alive){
      if(state.attacked) return appScreen(state,{kicker:'NIGHT ACTION',title:'襲撃先を選択済み',subtitle:'仲間の選択を待っています。',tone:'ready',body:waitCard('選択済み','襲撃先が一致すると成立します。','🌙')});
      const partners=new Set((state.frenemyPartners||[]).map(x=>x.id));
      const targets=state.roster.filter(c=>c.alive&&c.id!==me.id&&!partners.has(c.id));
      body=actionPanel(`<label class="app-select-label">襲撃する人物<select id="attackTarget"><option value="">選択してください</option>${selectOptions(targets,attackDraft)}</select></label><button class="danger big full" id="attackBtn">襲撃先を決定</button>`);
      return appScreen(state,{kicker:'NIGHT ACTION',title:'夜の行動',subtitle:'襲撃先を選んでください。',tone:'secret',body});
    }
    return appScreen(state,{kicker:'NIGHT',title:'夜になりました',subtitle:'フレネミーが行動しています。',tone:'wait',body:waitCard('夜の時間','結果までお待ちください。','🌙')});
  }
  if(state.phase==='suspectVote'){
    const dawnText=state.latestAttack?.name?`${state.latestAttack.name} が襲撃されました。`:'襲撃結果を確認してください。';
    if(dead) return appScreen(state,{kicker:'FRENEMY VOTE',title:'フレネミー投票',subtitle:'脱落中のため投票できません。',tone:'wait',body:waitCard('投票待機',dawnText,'🌅')});
    if(state.votedSuspect) return appScreen(state,{kicker:'VOTED',title:'投票完了',subtitle:'結果をお待ちください。',tone:'ready',body:waitCard('送信しました',dawnText,'✓')});
    const targets=alivePlayers(state).filter(c=>c.id!==me.id);
    body=actionPanel(`<div class="app-info-line"><span>夜明け</span><b>${esc(dawnText)}</b></div><label class="app-select-label">怪しい人物<select id="suspectTarget"><option value="">選択してください</option>${selectOptions(targets,suspectDraft)}</select></label><button class="big full" id="suspectBtn">投票する</button>`);
    return appScreen(state,{kicker:'FRENEMY VOTE',title:'怪しい人物を選ぶ',subtitle:'ランキングを操作していたと思う人物に投票してください。',tone:'action',body});
  }
  if(state.phase==='roundEnd'){
    const text=state.latestElimination?.name?`${state.latestElimination.name} が追放されました。`:'次のラウンドへ進みます。';
    return appScreen(state,{kicker:'ROUND END',title:'ラウンド終了',subtitle:text,tone:'wait',body:waitCard('次のラウンドへ',text,'📣')});
  }
  return appScreen(state,{title:'待機中',subtitle:'進行をお待ちください。',tone:'wait',body:waitCard('待機中','','…')});
}
function sceneCard(icon,title,text){return `<section class="scene-card"><div class="scene-icon">${icon}</div><div><div class="kicker">SCENE</div><h2>${esc(title)}</h2><p>${esc(text||'')}</p></div></section>`;}
function voteResultTable(rr){
  const rows=(rr.voteRows||[]).filter(r=>r.count>0);
  if(!rows.length)return `<div class="empty">投票結果がありません</div>`;
  const max=Math.max(...rows.map(r=>r.count));
  return `<div class="vote-table app-vote-table">${rows.map((r,i)=>`<div class="vote-row ${r.count===max?'top':''}"><span>${i+1}位 ${esc(r.name)}</span><b>${r.count}票</b></div>`).join('')}</div>`;
}
function playerSurveyHtml(state){
  return `<div class="app-survey-list">${state.themes.map(t=>`<section class="card player-survey-theme app-survey-card" data-theme="${t.id}"><div class="app-overline">QUESTION</div><h2>${esc(t.title)}</h2>${[1,2,3].map(n=>`<label class="app-select-label">${n}位<select data-rank="${n}"><option value="">選択してください</option>${state.roster.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>`).join('')}</section>`).join('')}</div><section class="card app-action-panel"><p class="muted">各テーマで1〜3位を重複なしで選んでください。</p><button class="big full" id="playerSurveyBtn">送信して待機</button></section>`;
}
