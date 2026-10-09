function hostDashboard(state){
  const joinUrl=`${currentBaseUrl()}/?mode=join&room=${state.code}`;
  const hostCast=state.roster[0];
  const hostPlayerUrl=hostCast?`${currentBaseUrl()}/?mode=join&room=${state.code}&slot=host-player&cast=${encodeURIComponent(hostCast.id)}`:`${currentBaseUrl()}/?mode=join&room=${state.code}&slot=host-player`;
  const surveyUrl=`${currentBaseUrl()}/?mode=survey&room=${state.code}&key=${state.surveyKey}`;
  const startInfo=startRequirementInfo(state);
  const canStart=startInfo.ok;
  const round=state.themes[state.roundIndex];
  return `<div class="grid">
    <section class="hero compact"><div class="eyebrow">ROOM ${esc(state.code)}</div><h1>${esc(state.title)}</h1><p>${esc(phaseLabels[state.phase]||state.phase)} / ROUND ${state.roundIndex+1}</p></section>
    <section class="card third"><h2>参加URL</h2><img class="qr" src="${qrImage(joinUrl)}"><button class="secondary full" id="copyJoin">出演者URLをコピー</button></section>
    <section class="card third"><h2>出演者アンケート</h2><div class="metric">${state.playerSurveyCount||0} / ${state.roster.length}</div><p class="muted">出演者は参加後、自分の端末で事前アンケートに回答します。</p><button class="secondary full" id="copySurvey">外部アンケートURLをコピー</button></section>
    <section class="card third"><h2>進行</h2><div class="metric">${esc(phaseLabels[state.phase]||state.phase)}</div><p>生存 ${aliveCount(state)} / フレネミー ${roleCountAlive(state,'frenemy')}</p><div class="start-check ${state.autoAdvance?'good':'bad'}"><b>自動進行 ${state.autoAdvance?'ON':'OFF'}</b><span>${state.autoAdvance?'出演者端末の操作状況だけで進行します。':'手動ボタンで進行します。'}</span></div><button class="${state.autoAdvance?'ghost':'secondary'} full" id="autoAdvanceToggle">自動進行を${state.autoAdvance?'OFF':'ON'}にする</button><button class="ghost full" id="autoStepNow">自動判定を今すぐ実行</button><button class="secondary full" id="openTestView">テストビューを開く</button><button class="ghost full" id="editSetup" ${state.started?'disabled':''}>設定を編集</button></section>
    <section style="grid-column:span 12">${phaseProgressHtml(state)}</section>
    <section class="card half"><h2>出演者</h2><div class="list">${state.roster.map(c=>`<div class="row ${c.alive?'':'dead'}"><div>${c.role?roleIcon(c.role):'<span class="role-icon"><span>?</span></span>'} <b>${esc(c.name)}</b><small>${c.joined?'参加済み':'未参加'} ${c.surveySubmitted?' / アンケート済み':' / アンケート未回答'} ${c.roleSeen?' / 役職確認済み':''}</small></div><div>${c.alive?'生存':'脱落'}</div></div>`).join('')}</div></section>
    <section class="card half">${hostPhasePanel(state,canStart,round,startInfo)}</section>
    <section class="card" style="grid-column:span 12"><div class="host-player-head"><div><h2>ホストも出演者として参加</h2><p class="muted">この枠はホスト専用の出演者端末です。初期状態では ${esc(hostCast?.name||'先頭の出演者')} に固定しています。別の名前で入りたい場合は出演者URLを別窓で開いてください。</p></div><a class="button-link secondary" href="${esc(hostPlayerUrl)}" target="_blank" rel="noopener">別窓で開く</a></div><iframe class="host-player-frame" src="${esc(hostPlayerUrl)}" title="ホスト出演者端末"></iframe></section>
  </div>`;
}
function startRequirementInfo(state){
  const joined=state.roster.filter(c=>c.joined).length;
  const answered=state.playerSurveyCount||0;
  const missing=[];
  if(state.roster.length<5)missing.push(`出演者が不足しています（${state.roster.length}/5人以上）`);
  if(joined<state.roster.length)missing.push(`未参加の出演者がいます（${joined}/${state.roster.length}人参加）`);
  if(answered<state.roster.length)missing.push(`出演者アンケート未回答があります（${answered}/${state.roster.length}人回答）`);
  if(!state.surveyFinalized)missing.push('アンケート結果が未確定です');
  return {ok:!missing.length,joined,answered,missing};
}
function hostPhasePanel(state,canStart,round,startInfo=startRequirementInfo(state)){
  if(state.phase==='lobby') return `<h2>ゲーム開始前</h2><p>出演者が参加後にアンケートへ回答し、ホストが結果確定すると開始できます。</p><button class="secondary full" id="finalizeSurvey" ${(state.playerSurveyCount||0)>=state.roster.length&&state.roster.length?'':'disabled'}>アンケート結果を確定</button><button class="secondary full" id="testReady" ${state.started?'disabled':''}>テスト用：参加＋アンケート確定を一括完了</button><button class="big full" id="startGame" ${canStart?'':'disabled'}>ゲーム開始</button><div class="start-check ${canStart?'good':'bad'}"><b>${canStart?'開始できます':'開始できません'}</b>${canStart?'<span>条件を満たしています。</span>':startInfo.missing.map(x=>`<span>・${esc(x)}</span>`).join('')}</div><div class="small muted">本番条件：全員参加＋出演者全員のアンケート回答＋アンケート確定</div>`;
  if(state.phase==='roleReveal') return `<h2>役職確認</h2><p>各出演者が自分の端末で役職を確認しています。</p><button class="big full phaseBtn" data-phase="theme">テーマ発表へ</button>`;
  if(state.phase==='theme') return `${hostScene('☀️','朝が来ました','新しいラウンドを開始します。')}<h2>テーマ</h2><div class="theme-title">${esc(round?.title||'')}</div><button class="big full phaseBtn" data-phase="frenemyInfo">フレネミー情報へ</button>`;
  if(state.phase==='frenemyInfo') return `<h2>フレネミー情報</h2><p>脱落者を除いた現在1位を、フレネミーの端末だけに表示します。ホスト画面・市民画面には名前を出しません。</p><button class="big full phaseBtn" data-phase="seer">占いへ</button>`;
  if(state.phase==='seer') return `<h2>占い</h2><p>占い師が1人の事前順位を確認します。</p><button class="big full phaseBtn" data-phase="discussion">議論開始</button>`;
  if(state.phase==='discussion') return `${hostScene('🎙️','議論開始','誰がランキングを操作しているのか話し合います。')}<div class="timer" data-timer-end="${state.timerEndsAt||0}">${fmtTime(((state.timerEndsAt||0)-Date.now())/1000)}</div><button class="big full phaseBtn" data-phase="finalVote">最終投票へ</button>`;
  if(state.phase==='finalVote'){const c=Object.keys(state.finalVotes||{}).length;return `<h2>最終投票</h2><div class="metric">${c} / ${aliveCount(state)}票</div>${voteList(state,state.finalVotes)}<button class="big full phaseBtn" data-phase="result">結果発表へ</button>`;}
  if(state.phase==='result'){const r=state.roundResult||{};return `${hostScene(r.success?'😈':'🛡️',r.success?'フレネミー成功':'フレネミー失敗',r.success?'現在1位を最終投票1位から落としました。':'現在1位が最終投票でも守られました。')}<h2>投票結果</h2><p>ターゲット：${esc(r.officialTopName||'—')}</p><p>最終1位：${(r.winnerNames||[]).map(esc).join(' / ')||'—'}</p>${voteResultTable(r)}<button class="big full phaseBtn" data-phase="${r.success?'attack':'suspectVote'}">${r.success?'夜へ：襲撃へ':'朝へ：フレネミー投票へ'}</button>`;}
  if(state.phase==='attack') return `${hostScene('🌙','夜になりました','フレネミーが襲撃先を選びます。')}<h2>襲撃</h2>${voteList(state,state.attackVotes)}<button class="danger big full" id="resolveAttack">襲撃を解決</button>`;
  if(state.phase==='suspectVote'){const c=Object.keys(state.suspectVotes||{}).length;return `${hostScene('🌅','夜が明けました',state.latestAttack?.name?`${state.latestAttack.name} が襲撃されました。`:'襲撃結果を確認します。')}<h2>フレネミー投票</h2><div class="metric">${c} / ${aliveCount(state)}票</div>${voteList(state,state.suspectVotes)}${suspectTallyTable(state)}<button class="big full" id="resolveSuspect">最多票を追放</button>`;}
  if(state.phase==='roundEnd') return `${hostScene('📣','ラウンド終了',state.latestElimination?.name?`${state.latestElimination.name} が追放されました。`:'投票結果を確認しました。')}<h2>次のラウンドへ</h2><button class="big full" id="nextRound">次のラウンドへ</button>`;
  if(state.phase==='gameOver') return `<h2>ゲーム終了</h2><button class="ghost full" id="resetGame">リセット</button>`;
  return `<h2>進行中</h2>`;
}
function hostScene(icon,title,text){return `<div class="scene-card compact-scene"><div class="scene-icon">${icon}</div><div><div class="kicker">SCENE</div><h2>${esc(title)}</h2><p>${esc(text||'')}</p></div></div>`;}
function voteList(state,votes={}){const rows=Object.entries(votes).map(([from,to])=>`<div class="row"><span>${esc(nameOf(state,from))}</span><b>→ ${esc(nameOf(state,to))}</b></div>`);return rows.length?`<div class="list">${rows.join('')}</div>`:`<div class="empty">まだ選択がありません</div>`;}
function voteResultTable(r){
  const rows=(r.voteRows||[]).filter(x=>x.count>0);
  if(!rows.length)return `<div class="empty">投票結果がありません</div>`;
  const max=Math.max(...rows.map(x=>x.count));
  return `<div class="vote-table">${rows.map((x,i)=>`<div class="vote-row ${x.count===max?'top':''}"><span>${i+1}位 ${esc(x.name)}</span><b>${x.count}票</b></div>`).join('')}</div>`;
}
function suspectTallyTable(state){
  const counts=tally(state.suspectVotes||{});
  const rows=state.roster.filter(c=>counts[c.id]).map(c=>({name:c.name,count:counts[c.id]})).sort((a,b)=>b.count-a.count);
  if(!rows.length)return '';
  const max=Math.max(...rows.map(x=>x.count));
  return `<div class="vote-table"><div class="kicker">現在の疑い票</div>${rows.map((x,i)=>`<div class="vote-row ${x.count===max?'top':''}"><span>${i+1}位 ${esc(x.name)}</span><b>${x.count}票</b></div>`).join('')}</div>`;
}
