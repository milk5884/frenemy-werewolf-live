const fwBaseBindPlayer=bindPlayer;
bindPlayer=function(state,token){
  fwBaseBindPlayer(state,token);
  const compare=document.getElementById('compareBtn');
  if(compare)compare.onclick=async()=>{
    const leftId=document.getElementById('compareLeft')?.value;
    const rightId=document.getElementById('compareRight')?.value;
    if(!leftId||!rightId)return notify('比較する2人を選んでください');
    if(leftId===rightId)return notify('別々の2人を選んでください');
    try{
      await api(`/api/rooms/${roomCode}/player/compare?token=${token}`,{method:'POST',body:JSON.stringify({leftId,rightId})});
      await refreshPlayer(token);
    }catch(e){await handlePlayerActionError(e)}
  };
  const spoofer=document.getElementById('spooferBtn');
  if(spoofer)spoofer.onclick=async()=>{
    const leftId=document.getElementById('spooferLeft')?.value;
    const rightId=document.getElementById('spooferRight')?.value;
    if(!leftId||!rightId)return notify('入れ替える2人を選んでください');
    if(leftId===rightId)return notify('別々の2人を選んでください');
    try{
      await api(`/api/rooms/${roomCode}/player/spoofer?token=${token}`,{method:'POST',body:JSON.stringify({leftId,rightId})});
      await refreshPlayer(token);
    }catch(e){await handlePlayerActionError(e)}
  };
  const spooferSkip=document.getElementById('spooferSkipBtn');
  if(spooferSkip)spooferSkip.onclick=async()=>{
    try{
      await api(`/api/rooms/${roomCode}/player/spoofer?token=${token}`,{method:'POST',body:JSON.stringify({skip:true})});
      await refreshPlayer(token);
    }catch(e){await handlePlayerActionError(e)}
  };
  const guard=document.getElementById('guardBtn');
  if(guard)guard.onclick=async()=>{
    const targetId=document.getElementById('guardTarget')?.value;
    if(!targetId)return notify('護衛先を選んでください');
    try{
      await api(`/api/rooms/${roomCode}/player/guard?token=${token}`,{method:'POST',body:JSON.stringify({targetId})});
      await refreshPlayer(token);
    }catch(e){await handlePlayerActionError(e)}
  };
};
