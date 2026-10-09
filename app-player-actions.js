async function startPlayer(playerToken){
  async function recoverAuthFailure(message){
    clearInterval(pollHandle);
    pollHandle=null;
    localStorage.removeItem(playerStorageKey());
    lastHostSig='';
    notify('参加情報を更新しています');
    await wait(250);
    return renderJoin();
  }
  async function tick(){
    try{
      const state=await api(`/api/rooms/${roomCode}/player?token=${playerToken}`);
      hideConnectionBanner();
      const sig=JSON.stringify({p:state.phase,r:state.roundIndex,me:state.player,rv:state.roundResult,t:state.timerEndsAt,skip:state.discussionSkipCount,skipped:state.discussionSkipped,ff:state.votedFinal,ss:state.votedSuspect,aa:state.attacked,sc:state.seerCheck,survey:state.surveySubmitted,psc:state.playerSurveyCount,la:state.latestAttack,le:state.latestElimination});
      if(sig!==lastHostSig || document.querySelector('[data-timer-end]')){
        lastHostSig=sig;
        app.innerHTML=shell(playerPhaseHtml(state),`<div class="room-code">${esc(roomCode)}</div>`);
        bindPlayer(state,playerToken);
        maybeShowSceneOverlay(state);
      }
    }catch(e){
      if(String(e.message||'').includes('参加認証に失敗しました'))return recoverAuthFailure(e.message);
      showConnectionBanner(e.message);
    }
  }
  await tick(); clearInterval(pollHandle); pollHandle=setInterval(tick,2200);
}
function bindSelectDraft(state,id,kind){
  const el=document.getElementById(id); if(!el)return;
  el.onchange=()=>setDraft(state,kind,el.value);
}
function collectPlayerSurveyVotes(){
  const votes={};
  for(const sec of document.querySelectorAll('.player-survey-theme')){
    votes[sec.dataset.theme]=[...sec.querySelectorAll('select')].map(s=>s.value);
  }
  return votes;
}
function bindPlayer(state,token){
  const survey=document.getElementById('playerSurveyBtn');
  if(survey) survey.onclick=async()=>{
    const votes=collectPlayerSurveyVotes();
    for(const [themeId,arr] of Object.entries(votes)){
      if(arr.length!==3||arr.some(x=>!x)||new Set(arr).size!==3)return notify('各テーマの1〜3位を重複なしで選んでください');
    }
    try{await api(`/api/rooms/${roomCode}/player/survey?token=${token}`,{method:'POST',body:JSON.stringify({votes})});lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}
  };
  const reveal=document.getElementById('revealRole');
  if(reveal) reveal.onclick=async()=>{try{await api(`/api/rooms/${roomCode}/player/role-seen?token=${token}`,{method:'POST',body:'{}'});lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
  bindSelectDraft(state,'seerTarget','seer');
  bindSelectDraft(state,'finalTarget','final');
  bindSelectDraft(state,'attackTarget','attack');
  bindSelectDraft(state,'suspectTarget','suspect');
  const seer=document.getElementById('seerBtn');
  if(seer) seer.onclick=async()=>{const v=document.getElementById('seerTarget').value;if(!v)return notify('占う人物を選んでください');try{await api(`/api/rooms/${roomCode}/player/seer?token=${token}`,{method:'POST',body:JSON.stringify({targetId:v})});clearDraft(state,'seer');lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
  const skip=document.getElementById('discussionSkipBtn');
  if(skip) skip.onclick=async()=>{try{await api(`/api/rooms/${roomCode}/player/discussion-skip?token=${token}`,{method:'POST',body:'{}'});lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
  const final=document.getElementById('finalVoteBtn');
  if(final) final.onclick=async()=>{const v=document.getElementById('finalTarget').value;if(!v)return notify('投票先を選んでください');try{await api(`/api/rooms/${roomCode}/player/final-vote?token=${token}`,{method:'POST',body:JSON.stringify({targetId:v})});clearDraft(state,'final');lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
  const attack=document.getElementById('attackBtn');
  if(attack) attack.onclick=async()=>{const v=document.getElementById('attackTarget').value;if(!v)return notify('襲撃先を選んでください');try{await api(`/api/rooms/${roomCode}/player/attack?token=${token}`,{method:'POST',body:JSON.stringify({targetId:v})});clearDraft(state,'attack');lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
  const suspect=document.getElementById('suspectBtn');
  if(suspect) suspect.onclick=async()=>{const v=document.getElementById('suspectTarget').value;if(!v)return notify('投票先を選んでください');try{await api(`/api/rooms/${roomCode}/player/suspect-vote?token=${token}`,{method:'POST',body:JSON.stringify({targetId:v})});clearDraft(state,'suspect');lastHostSig='';await startPlayer(token);}catch(e){notify(e.message)}};
}
setInterval(()=>document.querySelectorAll('[data-timer-end]').forEach(n=>{const end=Number(n.dataset.timerEnd||0);if(end)n.textContent=fmtTime((end-Date.now())/1000);}),500);
