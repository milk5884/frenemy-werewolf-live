// Shared, one-question-at-a-time survey UI for performers and external respondents.
// Saves drafts per respondent and room, so poll refreshes do not erase answers.
const fwSurveyMemory=new Map();
function fwSurveyDraft(state,mode,owner){
  const key='fw_qdraft_'+roomCode+'_'+mode+'_'+owner;
  const signature=JSON.stringify([(state.themes||[]).map(t=>[t.id,t.title]),(state.roster||[]).map(c=>[c.id,c.name])]);
  let flow=fwSurveyMemory.get(key);
  if(!flow){
    try{flow=JSON.parse(localStorage.getItem(key)||'null');}catch(_){flow=null;}
  }
  if(!flow||flow.signature!==signature)flow={signature,page:0,activeRank:0,answers:{},nickname:''};
  if(!flow.answers||typeof flow.answers!=='object')flow.answers={};
  const validIds=new Set((state.roster||[]).map(c=>c.id));
  for(const theme of state.themes||[]){
    const raw=Array.isArray(flow.answers[theme.id])?flow.answers[theme.id]:[];
    const used=new Set();
    flow.answers[theme.id]=[0,1,2].map(i=>{
      const id=raw[i];
      if(!validIds.has(id)||used.has(id))return '';
      used.add(id);
      return id;
    });
  }
  flow.page=Math.max(0,Math.min((state.themes||[]).length,Number(flow.page)||0));
  flow.activeRank=Math.max(0,Math.min(2,Number(flow.activeRank)||0));
  fwSurveyMemory.set(key,flow);
  return {flow,key};
}
function fwSurveySave(key,flow){
  fwSurveyMemory.set(key,flow);
  try{localStorage.setItem(key,JSON.stringify(flow));}catch(_){}
}
function fwSurveyClear(key){
  fwSurveyMemory.delete(key);
  try{localStorage.removeItem(key);}catch(_){}
}
function fwSurveyComplete(arr){
  return Array.isArray(arr)&&arr.length===3&&arr.every(Boolean)&&new Set(arr).size===3;
}
function fwSurveyMarkup(state,flow,mode){
  const themes=state.themes||[],people=state.roster||[];
  const total=themes.length;
  if(!total)return '<div class="fw-survey-empty">アンケートのテーマがまだありません。</div>';
  const finished=themes.filter(t=>fwSurveyComplete(flow.answers[t.id])).length;
  const review=flow.page>=total;
  const progress=review?100:Math.round((finished/total)*100);
  const progressHtml=`<div class="fw-survey-progress-head"><span>事前アンケート</span><span>${review?'回答確認':`QUESTION ${flow.page+1} / ${total}`}</span></div>
    <div class="fw-survey-progress-track" role="progressbar" aria-label="回答済みのテーマ" aria-valuenow="${finished}" aria-valuemin="0" aria-valuemax="${total}"><span style="width:${progress}%"></span></div>
    <div class="fw-survey-progress-caption">${finished} / ${total}問 回答済み · 入力内容は自動保存されます</div>`;
  if(review){
    const summary=themes.map((t,i)=>{
      const choices=flow.answers[t.id]||[];
      return `<button type="button" class="fw-survey-review-row" data-fw-action="edit" data-index="${i}">
        <span class="fw-survey-review-index">${i+1}</span>
        <span class="fw-survey-review-content"><strong>${esc(t.title)}</strong>
        <small>${choices.map((id,r)=>`${r+1}位 ${esc(people.find(p=>p.id===id)?.name||'未回答')}`).join('　/　')}</small></span>
        <span class="fw-survey-review-edit">編集 <span aria-hidden="true">›</span></span>
      </button>`;
    }).join('');
    return `${progressHtml}<div class="fw-survey-question-head"><div class="fw-survey-tag">FINAL CHECK</div><h2>回答を確認</h2><p>順位を修正したい質問はタップしてください。送信後は変更できません。</p></div>
      <div class="fw-survey-review">${summary}</div>
      ${mode==='external'?`<label class="fw-survey-nickname">ニックネーム（任意）<input type="text" data-fw-nickname maxlength="40" value="${esc(flow.nickname||'')}" placeholder="表示名を入力"></label>`:''}
      <div class="fw-survey-controls"><button type="button" class="fw-survey-back secondary" data-fw-action="back">前の質問へ</button>
      <button type="button" class="fw-survey-next" data-fw-action="submit" ${finished===total?'':'disabled'}>回答を送信 <span aria-hidden="true">→</span></button></div>`;
  }
  const theme=themes[flow.page],answers=flow.answers[theme.id]||['','',''];
  const active=flow.activeRank,activeLabel=['1位','2位','3位'][active];
  const rankHtml=[0,1,2].map(r=>{
    const person=people.find(p=>p.id===answers[r]);
    return `<button type="button" class="fw-survey-rank ${r===active?'active':''} ${person?'filled':''}" data-fw-action="rank" data-rank="${r}" aria-pressed="${r===active}">
      <span class="fw-survey-rank-num">${r+1}</span>
      <span class="fw-survey-rank-info"><small>${r+1}位</small><strong>${person?esc(person.name):'ここを選択'}</strong></span>
      <span class="fw-survey-rank-icon" aria-hidden="true">${person?'✓':'＋'}</span>
    </button>`;
  }).join('');
  const choicesHtml=people.map((person,i)=>{
    const chosen=answers.indexOf(person.id),selected=chosen>=0;
    return `<button type="button" class="fw-survey-person ${selected?'chosen':''}" data-fw-action="pick" data-id="${esc(person.id)}" aria-pressed="${selected}">
      <span class="fw-survey-avatar" aria-hidden="true">${esc((person.name||'?').slice(0,1))}</span>
      <span class="fw-survey-person-name">${esc(person.name)}</span>
      <span class="fw-survey-person-mark">${selected?`${chosen+1}位`:'＋'}</span>
    </button>`;
  }).join('');
  return `${progressHtml}
    <div class="fw-survey-question-head"><div class="fw-survey-tag">Q${String(flow.page+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}</div>
      <h2>${esc(theme.title)}</h2><p>当てはまると思う人を、1位から順に選んでください。</p></div>
    <div class="fw-survey-rank-row">${rankHtml}</div>
    <div class="fw-survey-pick-heading"><span>回答者を選択</span><small>現在：${activeLabel}を選択中</small></div>
    <div class="fw-survey-people">${choicesHtml}</div>
    <div class="fw-survey-controls"><button type="button" class="fw-survey-back secondary" data-fw-action="back" ${flow.page===0?'disabled':''}>← 戻る</button>
      <button type="button" class="fw-survey-next" data-fw-action="next" ${fwSurveyComplete(answers)?'':'disabled'}>${flow.page===total-1?'回答を確認':'次の質問へ'} <span aria-hidden="true">→</span></button></div>`;
}
function fwSurveyBind(root,state,opts){
  if(!root)return;
  const {flow,key}=fwSurveyDraft(state,opts.mode,opts.owner);
  const themes=state.themes||[];
  const paint=()=>{root.innerHTML=fwSurveyMarkup(state,flow,opts.mode);};
  root.addEventListener('input',e=>{
    if(e.target.matches('[data-fw-nickname]')){flow.nickname=e.target.value;fwSurveySave(key,flow);}
  });
  root.addEventListener('click',async e=>{
    const btn=e.target.closest('button[data-fw-action]');
    if(!btn||!root.contains(btn)||root.dataset.busy==='1')return;
    const action=btn.dataset.fwAction;
    const theme=themes[flow.page];
    if(action==='rank'&&theme){
      flow.activeRank=Number(btn.dataset.rank)||0;
    }else if(action==='pick'&&theme){
      const arr=flow.answers[theme.id];
      const newId=btn.dataset.id,at=arr.indexOf(newId),dest=flow.activeRank;
      if(at===dest)arr[dest]='';
      else{
        const displaced=arr[dest];
        arr[dest]=newId;
        if(at>=0)arr[at]=displaced||'';
      }
      const empty=arr.findIndex(id=>!id);
      flow.activeRank=empty>=0?empty:dest;
    }else if(action==='next'&&theme){
      if(!fwSurveyComplete(flow.answers[theme.id]))return notify('1位・2位・3位を選んでください');
      flow.page=Math.min(themes.length,flow.page+1);
      const next=themes[flow.page];
      flow.activeRank=next?Math.max(0,flow.answers[next.id].findIndex(id=>!id)):0;
    }else if(action==='back'){
      flow.page=Math.max(0,flow.page-1);
      const prev=themes[flow.page];
      flow.activeRank=prev?Math.max(0,flow.answers[prev.id].findIndex(id=>!id)):0;
    }else if(action==='edit'){
      flow.page=Math.max(0,Math.min(themes.length-1,Number(btn.dataset.index)||0));
      flow.activeRank=0;
    }else if(action==='submit'){
      if(themes.some(t=>!fwSurveyComplete(flow.answers[t.id])))return notify('未回答の質問があります');
      root.dataset.busy='1';btn.disabled=true;
      const votes=Object.fromEntries(themes.map(t=>[t.id,[...flow.answers[t.id]]]));
      try{
        if(opts.mode==='player'){
          await api(`/api/rooms/${roomCode}/player/survey?token=${encodeURIComponent(opts.token)}`,{method:'POST',body:JSON.stringify({votes})});
          fwSurveyClear(key);
          await refreshPlayer(opts.token);
        }else{
          await api(`/api/rooms/${roomCode}/survey?key=${encodeURIComponent(opts.surveyKey)}`,{method:'POST',body:JSON.stringify({deviceId:opts.owner,nickname:flow.nickname||'',votes})});
          try{localStorage.setItem(surveyDoneKey(opts.surveyKey),'1');}catch(_){}
          fwSurveyClear(key);
          app.innerHTML=shell('<section class="card center fw-survey-thanks"><div class="fw-survey-thanks-icon">✓</div><h2>回答を送信しました</h2><p>ご協力ありがとうございました。</p></section>');
        }
      }catch(err){
        root.dataset.busy='0';
        btn.disabled=false;
        if(opts.mode==='player')await handlePlayerActionError(err);else notify(err.message);
      }
      return;
    }else return;
    fwSurveySave(key,flow);
    paint();
    if(['next','back','edit'].includes(action))root.scrollIntoView({block:'start',behavior:'smooth'});
  });
}
playerSurveyHtml=function(state){
  const {flow}=fwSurveyDraft(state,'player',state.player?.id||'unknown');
  return `<div id="fwSurveyWizard" class="fw-survey-wizard">${fwSurveyMarkup(state,flow,'player')}</div>`;
};
const fwSurveyBaseBindPlayer=bindPlayer;
bindPlayer=function(state,token){
  fwSurveyBaseBindPlayer(state,token);
  if(state.phase==='lobby'&&!state.surveySubmitted)
    fwSurveyBind(document.getElementById('fwSurveyWizard'),state,{mode:'player',owner:state.player.id,token});
};
renderSurvey=async function(){
  const surveyKey=qs.get('key')||'';
  let deviceId;
  try{deviceId=localStorage.getItem(surveyDeviceKey());}catch(_){}
  if(!deviceId){
    deviceId='d_'+Date.now()+'_'+Math.random().toString(16).slice(2);
    try{localStorage.setItem(surveyDeviceKey(),deviceId);}catch(_){}
  }
  try{
    const state=await api(`/api/rooms/${roomCode}/survey?key=${encodeURIComponent(surveyKey)}`);
    let submitted;
    try{submitted=localStorage.getItem(surveyDoneKey(surveyKey));}catch(_){}
    if(submitted){app.innerHTML=shell('<section class="card center fw-survey-thanks"><div class="fw-survey-thanks-icon">✓</div><h2>回答済み</h2><p>ご協力ありがとうございました。</p></section>');return;}
    if(state.closed){app.innerHTML=shell('<section class="card center"><h2>回答受付は終了しました</h2><p>アンケートは締め切られています。</p></section>');return;}
    const {flow}=fwSurveyDraft(state,'external',deviceId);
    app.innerHTML=shell(`<section class="fw-survey-intro"><div class="app-overline">FRENEMY SURVEY</div><h1>${esc(state.title)}</h1><p>1問ずつ、1位・2位・3位を選んでください。</p></section>
      <div id="fwSurveyWizard" class="fw-survey-wizard">${fwSurveyMarkup(state,flow,'external')}</div>`,
      `<div class="room-code">${esc(roomCode)}</div>`);
    fwSurveyBind(document.getElementById('fwSurveyWizard'),state,{mode:'external',owner:deviceId,surveyKey});
  }catch(err){app.innerHTML=shell(`<section class="card center"><h2>アンケートを開けません</h2><p>${esc(err.message)}</p></section>`);}
};
