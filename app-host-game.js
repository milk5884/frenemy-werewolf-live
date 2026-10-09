function hostDashboard(state){
  const joinUrl=`${currentBaseUrl()}/?mode=join&room=${state.code}`;
  const surveyUrl=`${currentBaseUrl()}/?mode=survey&room=${state.code}&key=${state.surveyKey}`;
  const startInfo=startRequirementInfo(state);
  const canStart=startInfo.ok;
  const round=state.themes[state.roundIndex];
  return `<div class="grid">
    <section class="hero compact"><div class="eyebrow">ROOM ${esc(state.code)}</div><h1>${esc(state.title)}</h1><p>${esc(phaseLabels[state.phase]||state.phase)} / ROUND ${state.roundIndex+1}</p></section>
    <section class="card third"><h2>参加URL</h2><img class="qr" src="${qrImage(joinUrl)}"><button class="secondary full" id="copyJoin">出演者URLをコピー</button></section>
    <section class="card third"><h2>出演者アンケート</h2><div class="metric">${state.playerSurveyCount||0} / ${state.roster.length}</div><p class="muted">出演者は参加後、自分の端末で事前アンケートに回答します。</p><button class="secondary full" id="copySurvey">外部アンケートURLをコピー</button></section>
    <section class="card third"><h2>進行</h2><div class="metric">${esc(phaseLabels[state.phase]||state.phase)}</div><p>生存 ${aliveCount(state)} / フレネミー ${roleCountAlive(state,'frenemy')}</p><button class="secondary full" id="openTestView">テストビューを開く</button><button class="ghost full" id="editSetup" ${state.started?'disabled':''}>設定を編集</button></section>
    <section style="grid-column:span 12">${phaseProgressHtml(state)}</section>
    <section class="card half"><h2>出演者</h2><div class="list">${state.roster.map(c=>`<div class="row ${c.alive?'':'dead'}"><div>${c.role?roleIcon(c.role):'<span class="role-icon"><span>?</span></span>'} <b>${esc(c.name)}</b><small>${c.joined?'参加済み':'未参加'} ${c.surveySubmitted?' / アンケート済み':' / アンケート未回答'} ${c.roleSeen?' / 役職確認済み':''}</small></div><div>${c.alive?'生存':'脱落'}</div></div>`).join('')}</div></section>
    <section class="card half">${hostPhasePanel(state,canStart,round,startInfo)}</section>
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
  if(state.phase==='theme') return `<h2>テーマ</h2><div class="theme-title">${esc(round?.title||'')}</div><button class="big full phaseBtn" data-phase="frenemyInfo">フレネミー情報へ</button>`;
  if(state.phase==='frenemyInfo') return `<h2>フレネミー情報</h2><p>フレネミーだけが各端末でターゲットを確認します。</p><button class="big full phaseBtn" data-phase="seer">占いへ</button>`;
  if(state.phase==='seer') return `<h2>占い</h2><p>占い師が1人の事前順位を確認します。</p><button class="big full phaseBtn" data-phase="discussion">議論開始</button>`;
  if(state.phase==='discussion') return `<h2>議論</h2><div class="timer" data-timer-end="${state.timerEndsAt||0}">${fmtTime(((state.timerEndsAt||0)-Date.now())/1000)}</div><button class="big full phaseBtn" data-phase="finalVote">最終投票へ</button>`;
  if(state.phase==='finalVote'){const c=Object.keys(state.finalVotes||{}).length;return `<h2>最終投票</h2><div class="metric">${c} / ${aliveCount(state)}票</div>${voteList(state,state.finalVotes)}<button class="big full phaseBtn" data-phase="result">結果発表へ</button>`;}
  if(state.phase==='result'){const r=state.roundResult||{};return `<h2>結果</h2><div class="result-win ${r.success?'bad':'good'}">${r.success?'フレネミー成功':'フレネミー失敗'}</div><p>事前1位：${esc(r.officialTopName||'—')}</p><p>最終1位：${(r.winnerNames||[]).map(esc).join(' / ')||'—'}</p><button class="big full phaseBtn" data-phase="${r.success?'attack':'suspectVote'}">${r.success?'襲撃へ':'フレネミー投票へ'}</button>`;}
  if(state.phase==='attack') return `<h2>襲撃</h2>${voteList(state,state.attackVotes)}<button class="danger big full" id="resolveAttack">襲撃を解決</button>`;
  if(state.phase==='suspectVote'){const c=Object.keys(state.suspectVotes||{}).length;return `<h2>フレネミー投票</h2><div class="metric">${c} / ${aliveCount(state)}票</div>${voteList(state,state.suspectVotes)}<button class="big full" id="resolveSuspect">最多票を追放</button>`;}
  if(state.phase==='roundEnd') return `<h2>ラウンド終了</h2><button class="big full" id="nextRound">次のラウンドへ</button>`;
  if(state.phase==='gameOver') return `<h2>ゲーム終了</h2><button class="ghost full" id="resetGame">リセット</button>`;
  return `<h2>進行中</h2>`;
}
function voteList(state,votes={}){const rows=Object.entries(votes).map(([from,to])=>`<div class="row"><span>${esc(nameOf(state,from))}</span><b>→ ${esc(nameOf(state,to))}</b></div>`);return rows.length?`<div class="list">${rows.join('')}</div>`:`<div class="empty">まだ選択がありません</div>`;}
