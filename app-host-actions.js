async function startHost(){
  if(!roomCode||!getHostToken()) return renderHome();
  await resolveShareBase();
  async function tick(){
    if(editingSetup) return;
    try{
      const state=await api(hostUrl(''));
      hideConnectionBanner();
      const sig=JSON.stringify({phase:state.phase,round:state.roundIndex,roster:state.roster,themes:state.themes,survey:state.surveyCount,final:state.finalVotes,suspect:state.suspectVotes,night:state.attackVotes,result:state.roundResult,timer:state.timerEndsAt,started:state.started});
      if(sig!==lastHostSig || document.querySelector('[data-timer-end]')){
        lastHostSig=sig;
        app.innerHTML=shell(hostDashboard(state),`<div class="room-code">${esc(state.code)}</div>`);
        bindHost(state);
      }
    }catch(e){showConnectionBanner(e.message);}
  }
  await tick(); clearInterval(pollHandle); pollHandle=setInterval(tick,2500);
}
function bindHost(state){
  const copyJoin=document.getElementById('copyJoin'); if(copyJoin)copyJoin.onclick=()=>copyText(`${currentBaseUrl()}/?mode=join&room=${state.code}`);
  const copySurvey=document.getElementById('copySurvey'); if(copySurvey)copySurvey.onclick=()=>copyText(`${currentBaseUrl()}/?mode=survey&room=${state.code}&key=${state.surveyKey}`);
  const openTest=document.getElementById('openTestView'); if(openTest)openTest.onclick=()=>window.open(`/?mode=test&room=${state.code}&token=${encodeURIComponent(getHostToken())}`,'_blank');
  const edit=document.getElementById('editSetup'); if(edit)edit.onclick=()=>openSetupFrom(state);
  const fin=document.getElementById('finalizeSurvey'); if(fin)fin.onclick=async()=>{try{await api(hostUrl('/finalize-survey'),{method:'POST',body:'{}'});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
  const start=document.getElementById('startGame'); if(start)start.onclick=async()=>{try{await api(hostUrl('/start'),{method:'POST',body:'{}'});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
  document.querySelectorAll('.phaseBtn').forEach(b=>b.onclick=async()=>{try{await api(hostUrl('/phase'),{method:'POST',body:JSON.stringify({phase:b.dataset.phase})});lastHostSig='';await startHost();}catch(e){notify(e.message)}});
  const night=document.getElementById('resolveAttack'); if(night)night.onclick=async()=>{try{await api(hostUrl('/resolve-attack'),{method:'POST',body:'{}'});await api(hostUrl('/phase'),{method:'POST',body:JSON.stringify({phase:'suspectVote'})});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
  const sus=document.getElementById('resolveSuspect'); if(sus)sus.onclick=async()=>{try{const counts=tally(state.suspectVotes);const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];if(!top)return notify('投票がありません');await api(hostUrl('/eliminate'),{method:'POST',body:JSON.stringify({castId:top[0]})});await api(hostUrl('/phase'),{method:'POST',body:JSON.stringify({phase:'roundEnd'})});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
  const next=document.getElementById('nextRound'); if(next)next.onclick=async()=>{try{await api(hostUrl('/next-round'),{method:'POST',body:JSON.stringify({force:true})});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
  const reset=document.getElementById('resetGame'); if(reset)reset.onclick=async()=>{if(!confirm('ゲームをリセットしますか？'))return;try{await api(hostUrl('/reset'),{method:'POST',body:'{}'});lastHostSig='';await startHost();}catch(e){notify(e.message)}};
}
async function renderSurvey(){
  const key=qs.get('key')||'';
  let deviceId=localStorage.getItem(surveyDeviceKey()); if(!deviceId){deviceId=`d_${Date.now()}_${Math.random().toString(16).slice(2)}`;localStorage.setItem(surveyDeviceKey(),deviceId);}
  try{
    const state=await api(`/api/rooms/${roomCode}/survey?key=${encodeURIComponent(key)}`);
    const submitted=localStorage.getItem(surveyDoneKey(key));
    if(submitted){app.innerHTML=shell(`<section class="card center"><div class="metric good">回答済み</div><p>ご協力ありがとうございました。</p></section>`);return;}
    app.innerHTML=shell(`<section class="hero compact"><div class="eyebrow">AUDIENCE SURVEY${clientSlot?` / ${esc(clientSlot)}`:''}</div><h1>${esc(state.title)}</h1><p>各テーマでTOP3を選んでください。同じ人は重複選択できません。</p></section><section class="card"><label>ニックネーム<input id="surveyName" placeholder="任意"></label></section>${state.themes.map(t=>`<section class="card survey-theme" data-theme="${t.id}"><h2>${esc(t.title)}</h2>${[1,2,3].map(n=>`<label>${n}位<select data-rank="${n}"><option value="">選択してください</option>${state.roster.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></label>`).join('')}</section>`).join('')}<section class="card"><button class="big full" id="submitSurvey">回答を送信</button></section>`, `<div class="room-code">${esc(roomCode)}</div>`);
    document.getElementById('submitSurvey').onclick=async()=>{
      const votes={}; for(const sec of document.querySelectorAll('.survey-theme')) votes[sec.dataset.theme]=[...sec.querySelectorAll('select')].map(s=>s.value);
      try{await api(`/api/rooms/${roomCode}/survey?key=${encodeURIComponent(key)}`,{method:'POST',body:JSON.stringify({deviceId,nickname:document.getElementById('surveyName').value,votes})});localStorage.setItem(surveyDoneKey(key),'1');app.innerHTML=shell(`<section class="card center"><div class="metric good">送信完了</div><p>回答ありがとうございました。</p></section>`);}catch(e){notify(e.message)}
    };
  }catch(e){app.innerHTML=shell(`<section class="card center"><h2>アンケートを開けません</h2><p>${esc(e.message)}</p></section>`);}
}
