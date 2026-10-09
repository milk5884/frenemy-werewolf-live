(async function boot(){
  if(mode==='host'&&roomCode)return startHost();
  if(mode==='join'&&roomCode)return renderJoin();
  if(mode==='survey'&&roomCode)return renderSurvey();
  renderHome();
})();
