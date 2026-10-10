import crypto from 'node:crypto';

export const ROLE_LABELS = {
  citizen:'市民', frenemy:'フレネミー', seer:'占い師', madman:'狂人',
  knight:'騎士', medium:'霊媒師', comparer:'比較者', narcissist:'ナルシスト',
  mounter:'マウンター', analyst:'アナリスト', coroner:'検死官', spoofer:'工作員'
};
export const ROLE_ORDER = ['frenemy','seer','knight','medium','comparer','analyst','coroner','spoofer','madman','narcissist','mounter'];
export const DEFAULT_ROLE_COUNTS = {frenemy:2,seer:1,madman:1,knight:0,medium:0,comparer:0,analyst:0,coroner:0,spoofer:0,narcissist:0,mounter:0};
export const token = (n=24) => crypto.randomBytes(n).toString('hex');
export const id = (prefix='id') => prefix+'_'+crypto.randomBytes(6).toString('hex');
export function newRoomCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code=''; for(let i=0;i<6;i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}
export function shuffle(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=crypto.randomInt(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export const normalizeRoleCounts = roleCounts => ({...DEFAULT_ROLE_COUNTS,...(roleCounts||{})});
export const aliveCast = room => (room.roster||[]).filter(c=>c.alive);
export const currentTheme = room => room.themes?.[room.roundIndex] || null;
export const byCast = (room,castId) => (room.roster||[]).find(c=>c.id===castId);
export const joinedByToken = (room,playerToken) => Object.values(room.joins||{}).find(j=>j.token===playerToken);
export const playerSurveyKey = castId => `player_${castId}`;
export const hasPlayerSurvey = (room,castId) => Boolean(room.surveySubmissions?.[playerSurveyKey(castId)]);
export const playerSurveyCount = room => (room.roster||[]).filter(c=>hasPlayerSurvey(room,c.id)).length;
export const isFrenemySide = role => ['frenemy','madman','spoofer'].includes(role);
export const isTownRole = role => !isFrenemySide(role);
export const discussionSkipCount = room => aliveCast(room).filter(c=>room.discussionSkips?.[c.id]).length;
export const allAliveSkippedDiscussion = room => {
  const alive=aliveCast(room);
  return alive.length>0 && alive.every(c=>room.discussionSkips?.[c.id]);
};
export function seerRoundChecks(room,roundIndex=room.roundIndex){
  const raw=room.seerChecks?.[roundIndex];
  if(!raw)return {};
  if(raw.seerId)return {[raw.seerId]:raw};
  return raw;
}
export function compareRoundChecks(room,roundIndex=room.roundIndex){
  const raw=room.compareChecks?.[roundIndex];
  if(!raw)return {};
  if(raw.comparerId)return {[raw.comparerId]:raw};
  return raw;
}
export function spooferRoundActions(room,roundIndex=room.roundIndex){
  return room.spooferActions?.[roundIndex] || {};
}
export function spooferUsed(room,spooferId){
  return Object.values(room.spooferActions||{}).some(round=>round?.[spooferId]?.used);
}
export const aliveSeers = room => aliveCast(room).filter(c=>c.role==='seer');
export const aliveComparers = room => aliveCast(room).filter(c=>c.role==='comparer');
export const aliveSpoofersNeedDecision = room => aliveCast(room).filter(c=>c.role==='spoofer'&&!spooferUsed(room,c.id));
export const aliveInfoRoles = room => [...aliveSeers(room),...aliveComparers(room),...aliveSpoofersNeedDecision(room)];
export const seerCheckCount = room => aliveSeers(room).filter(c=>seerRoundChecks(room)[c.id]).length;
export const compareCheckCount = room => aliveComparers(room).filter(c=>compareRoundChecks(room)[c.id]).length;
export const spooferDecisionCount = room => aliveSpoofersNeedDecision(room).filter(c=>spooferRoundActions(room)[c.id]).length;
export const allAliveInfoRolesChecked = room => {
  const seerChecks=seerRoundChecks(room), compareChecks=compareRoundChecks(room), spooferActions=spooferRoundActions(room);
  return aliveSeers(room).every(c=>seerChecks[c.id]) && aliveComparers(room).every(c=>compareChecks[c.id]) && aliveSpoofersNeedDecision(room).every(c=>spooferActions[c.id]);
};
export const aliveKnights = room => aliveCast(room).filter(c=>c.role==='knight');
export const knightGuardCount = room => aliveKnights(room).filter(c=>room.guardVotes?.[c.id]).length;
export function currentTargetId(room){
  const theme=currentTheme(room);
  if(!theme?.officialRanking?.length)return null;
  return theme.officialRanking.find(cid=>byCast(room,cid)?.alive) || theme.officialRanking[0] || null;
}
export function investigationRanking(room,roundIndex=room.roundIndex){
  const theme=room.themes?.[roundIndex];
  const ranking=[...(theme?.officialRanking||[])];
  const actions=room.spooferActions?.[roundIndex]||{};
  for(const action of Object.values(actions)){
    if(!action?.used)continue;
    const a=ranking.indexOf(action.leftId), b=ranking.indexOf(action.rightId);
    if(a>=0&&b>=0)[ranking[a],ranking[b]]=[ranking[b],ranking[a]];
  }
  return ranking;
}
export function trueRankOf(room,castId){
  const rank=(currentTheme(room)?.officialRanking||[]).indexOf(castId)+1;
  return rank>0?rank:null;
}
export function rankOf(room,castId,{aliveOnly=false,roundIndex=room.roundIndex}={}){
  let ranking=investigationRanking(room,roundIndex);
  if(aliveOnly)ranking=ranking.filter(cid=>byCast(room,cid)?.alive);
  const rank=ranking.indexOf(castId)+1;
  return rank>0?rank:null;
}
export function surveyRows(room,roundIndex=room.roundIndex){
  const theme=room.themes?.[roundIndex];
  if(!theme)return [];
  return computeSurveyResults(room,false)[theme.id]?.rows || [];
}
export function surveyRow(room,castId,roundIndex=room.roundIndex){
  return surveyRows(room,roundIndex).find(r=>r.castId===castId) || null;
}
export function surveyScoreKey(room,castId,roundIndex=room.roundIndex){
  const r=surveyRow(room,castId,roundIndex);
  return r?`${r.points}|${r.first}|${r.second}|${r.third}`:'';
}
export function compareInfo(room,leftId,rightId){
  const leftRank=rankOf(room,leftId), rightRank=rankOf(room,rightId);
  if(!leftRank||!rightRank)return null;
  const isTie=surveyScoreKey(room,leftId)===surveyScoreKey(room,rightId);
  const higherId=isTie?null:(leftRank<rightRank?leftId:rightId);
  return {leftId,rightId,leftRank,rightRank,isTie,higherId};
}
export function narcissistInfo(room,castId){
  const rank=rankOf(room,castId,{aliveOnly:true});
  const aliveTotal=investigationRanking(room).filter(cid=>byCast(room,cid)?.alive).length;
  return rank?{rank,aliveTotal,inTop3:rank<=3}:null;
}
export function mounterInfo(room,castId){
  const ranking=investigationRanking(room).filter(cid=>byCast(room,cid)?.alive);
  const idx=ranking.indexOf(castId);
  if(idx<0)return null;
  const lowerIds=ranking.slice(idx+1);
  return {rank:idx+1,lowerIds,lowerNames:lowerIds.map(id=>byCast(room,id)?.name).filter(Boolean),lowerCount:lowerIds.length};
}
export function analystInfo(room){
  const ranking=investigationRanking(room).filter(cid=>byCast(room,cid));
  const firstId=ranking[0], secondId=ranking[1];
  if(!firstId||!secondId)return null;
  const a=surveyRow(room,firstId), b=surveyRow(room,secondId);
  const firstPoints=a?.points||0, secondPoints=b?.points||0;
  return {firstId,secondId,firstName:byCast(room,firstId)?.name,secondName:byCast(room,secondId)?.name,firstPoints,secondPoints,gap:Math.abs(firstPoints-secondPoints)};
}
export function coronerInfo(room){
  const topId=investigationRanking(room)[0];
  if(!topId)return null;
  const top=byCast(room,topId);
  const eliminated=(room.roster||[]).filter(c=>!c.alive);
  const included=eliminated.some(c=>c.id===topId);
  return {initialTopId:topId,initialTopName:top?.name||'—',included,eliminatedCount:eliminated.length};
}
export function latestHistory(room,kind,roundIndex=room.roundIndex){
  return [...(room.history||[])].reverse().find(h=>h.round===roundIndex&&h.kind===kind) || null;
}
export function lastElimination(room){
  return [...(room.history||[])].reverse().find(h=>h.kind==='eliminate') || null;
}
function markPhase(room){room.phaseChangedAt=Date.now();}
function elapsed(room,ms){return Date.now()-(room.phaseChangedAt||room.createdAt||0)>=ms;}

export function createRoom(title='フレネミー人狼'){
  const code=newRoomCode();
  return {code,title:String(title||'フレネミー人狼').slice(0,80),hostToken:token(),surveyKey:token(8),createdAt:Date.now(),phaseChangedAt:Date.now(),autoAdvance:false,phase:'lobby',roundIndex:0,discussionSeconds:300,timerEndsAt:null,roleCounts:{...DEFAULT_ROLE_COUNTS},roster:[],joins:{},themes:[],surveySubmissions:{},surveyFinalized:false,started:false,finalVotes:{},suspectVotes:{},attackVotes:{},guardVotes:{},discussionSkips:{},seerChecks:{},compareChecks:{},spooferActions:{},roundResult:null,history:[]};
}
export function publicRoom(room){
  return { code:room.code,title:room.title,createdAt:room.createdAt,autoAdvance:!!room.autoAdvance,phase:room.phase,roundIndex:room.roundIndex,discussionSeconds:room.discussionSeconds,roster:(room.roster||[]).map(c=>({id:c.id,name:c.name,joined:!!room.joins?.[c.id],alive:c.alive,surveySubmitted:hasPlayerSurvey(room,c.id)})),themes:(room.themes||[]).map(t=>({id:t.id,title:t.title})),surveyFinalized:room.surveyFinalized,surveyCount:Object.keys(room.surveySubmissions||{}).length,playerSurveyCount:playerSurveyCount(room) };
}
export function hostView(room){
  return {...publicRoom(room),hostToken:room.hostToken,surveyKey:room.surveyKey,roleCounts:normalizeRoleCounts(room.roleCounts),timerEndsAt:room.timerEndsAt,phaseChangedAt:room.phaseChangedAt,themes:room.themes||[],roster:(room.roster||[]).map(c=>({...c,roleLabel:ROLE_LABELS[c.role],joined:!!room.joins?.[c.id],surveySubmitted:hasPlayerSurvey(room,c.id),roleSeen:!!room.joins?.[c.id]?.roleSeen})),finalVotes:room.finalVotes||{},suspectVotes:room.suspectVotes||{},attackVotes:room.attackVotes||{},guardVotes:room.guardVotes||{},discussionSkips:room.discussionSkips||{},discussionSkipCount:discussionSkipCount(room),seerChecks:room.seerChecks||{},compareChecks:room.compareChecks||{},spooferActions:room.spooferActions||{},seerCheckCount:seerCheckCount(room),seerAliveCount:aliveSeers(room).length,compareCheckCount:compareCheckCount(room),compareAliveCount:aliveComparers(room).length,spooferDecisionCount:spooferDecisionCount(room),spooferNeedCount:aliveSpoofersNeedDecision(room).length,knightGuardCount:knightGuardCount(room),knightAliveCount:aliveKnights(room).length,roundResult:room.roundResult,history:room.history||[],latestAttack:latestHistory(room,'attack'),latestGuard:latestHistory(room,'guard'),latestElimination:latestHistory(room,'eliminate'),surveyResults:computeSurveyResults(room,false)};
}
export function playerView(room,join){
  const cast=byCast(room,join.castId); const theme=currentTheme(room);
  const out={code:room.code,title:room.title,autoAdvance:!!room.autoAdvance,phase:room.phase,roundIndex:room.roundIndex,theme:theme?{id:theme.id,title:theme.title}:null,themes:(room.themes||[]).map(t=>({id:t.id,title:t.title})),surveyFinalized:room.surveyFinalized,surveySubmitted:hasPlayerSurvey(room,cast.id),surveyCount:Object.keys(room.surveySubmissions||{}).length,playerSurveyCount:playerSurveyCount(room),player:{id:cast.id,name:cast.name,alive:cast.alive,role:cast.role,roleLabel:ROLE_LABELS[cast.role],roleSeen:join.roleSeen},roster:(room.roster||[]).map(c=>room.phase==='gameOver'?({id:c.id,name:c.name,alive:c.alive,role:c.role,roleLabel:ROLE_LABELS[c.role],surveySubmitted:hasPlayerSurvey(room,c.id)}):({id:c.id,name:c.name,alive:c.alive,surveySubmitted:hasPlayerSurvey(room,c.id)})),timerEndsAt:room.timerEndsAt,discussionSeconds:room.discussionSeconds,discussionSkipCount:discussionSkipCount(room),discussionSkipped:!!room.discussionSkips?.[cast.id],votedFinal:!!room.finalVotes?.[cast.id],votedSuspect:!!room.suspectVotes?.[cast.id],attacked:!!room.attackVotes?.[cast.id],guarded:!!room.guardVotes?.[cast.id],latestAttack:latestHistory(room,'attack'),latestGuard:latestHistory(room,'guard'),latestElimination:latestHistory(room,'eliminate'),roundResult:['result','attack','suspectVote','roundEnd'].includes(room.phase)?room.roundResult:null};
  if(cast.role==='frenemy'){
    out.frenemyPartners=(room.roster||[]).filter(c=>c.role==='frenemy'&&c.id!==cast.id).map(c=>({id:c.id,name:c.name,alive:c.alive}));
    const tid=currentTargetId(room);
    if(['frenemyInfo','seer','discussion','finalVote'].includes(room.phase)&&tid) out.frenemyTarget=byCast(room,tid)?.name||null;
    if(room.phase==='attack') out.partnerAttackVotes=Object.entries(room.attackVotes||{}).filter(([cid])=>cid!==cast.id).map(([cid,targetId])=>({from:byCast(room,cid)?.name,target:byCast(room,targetId)?.name}));
  }
  if(cast.role==='seer'){
    const check=seerRoundChecks(room)[cast.id];
    if(check) out.seerCheck={targetId:check.targetId,targetName:byCast(room,check.targetId)?.name,rank:check.rank};
  }
  if(cast.role==='comparer'){
    const check=compareRoundChecks(room)[cast.id];
    if(check) out.compareCheck={...check,leftName:byCast(room,check.leftId)?.name,rightName:byCast(room,check.rightId)?.name,higherName:check.higherId?byCast(room,check.higherId)?.name:null};
  }
  if(cast.role==='narcissist') out.narcissistInfo=narcissistInfo(room,cast.id);
  if(cast.role==='mounter') out.mounterInfo=mounterInfo(room,cast.id);
  if(cast.role==='analyst') out.analystInfo=analystInfo(room);
  if(cast.role==='coroner') out.coronerInfo=coronerInfo(room);
  if(cast.role==='medium'){
    const elim=lastElimination(room);
    if(elim) out.mediumInfo={name:elim.name,role:elim.role,roleLabel:ROLE_LABELS[elim.role],isFrenemySide:isFrenemySide(elim.role)};
  }
  if(cast.role==='spoofer'){
    const action=spooferRoundActions(room)[cast.id];
    out.spooferUsed=spooferUsed(room,cast.id);
    if(action) out.spooferDecision=action.used?{used:true,leftName:byCast(room,action.leftId)?.name,rightName:byCast(room,action.rightId)?.name}:{skip:true};
  }
  if(cast.role==='knight' && room.phase==='attack') out.guardCount=knightGuardCount(room);
  return out;
}
export function computeSurveyResults(room,includeRanking=true){
  const acc={};
  for(const theme of room.themes||[]){
    const stats={}; (room.roster||[]).forEach((c,i)=>stats[c.id]={castId:c.id,name:c.name,points:0,first:0,second:0,third:0,order:i});
    for(const sub of Object.values(room.surveySubmissions||{})){
      const v=sub.votes?.[theme.id]||[];
      if(stats[v[0]]){stats[v[0]].points+=3;stats[v[0]].first++;}
      if(stats[v[1]]){stats[v[1]].points+=2;stats[v[1]].second++;}
      if(stats[v[2]]){stats[v[2]].points+=1;stats[v[2]].third++;}
    }
    const rows=Object.values(stats).sort((a,b)=>b.points-a.points||b.first-a.first||b.second-a.second||b.third-a.third||a.order-b.order);
    acc[theme.id]={themeId:theme.id,title:theme.title,rows};
    if(includeRanking&&theme.officialRanking) acc[theme.id].officialRanking=theme.officialRanking;
  }
  return acc;
}
export function finalizeSurvey(room){
  const results=computeSurveyResults(room,false);
  for(const theme of room.themes||[]){
    const rows=results[theme.id].rows, groups=[];
    for(const row of rows){ const k=`${row.points}|${row.first}|${row.second}|${row.third}`; let g=groups.find(x=>x.key===k); if(!g){g={key:k,rows:[]};groups.push(g);} g.rows.push(row); }
    theme.officialRanking=groups.flatMap(g=>g.rows.length>1?shuffle(g.rows):g.rows).map(r=>r.castId);
  }
  room.surveyFinalized=true;
}
export function tally(votes){ const counts={}; Object.values(votes||{}).forEach(x=>{if(x)counts[x]=(counts[x]||0)+1;}); return counts; }
export function voteRows(room,counts){
  return (room.roster||[]).map((c,i)=>({id:c.id,name:c.name,alive:c.alive,count:counts[c.id]||0,order:i})).sort((a,b)=>b.count-a.count||a.order-b.order);
}
export function computeRoundResult(room){
  const theme=currentTheme(room); if(!theme?.officialRanking?.length)return null;
  const counts=tally(room.finalVotes), officialTop=currentTargetId(room), max=Math.max(0,...Object.values(counts)), officialVotes=counts[officialTop]||0;
  const winners=Object.entries(counts).filter(([,n])=>n===max&&max>0).map(([id])=>id);
  return {officialTop,officialTopName:byCast(room,officialTop)?.name,officialTopVotes:officialVotes,maxVotes:max,winners,winnerNames:winners.map(id=>byCast(room,id)?.name),success:max>officialVotes,counts,voteRows:voteRows(room,counts)};
}
export function resetRound(room){room.finalVotes={};room.suspectVotes={};room.attackVotes={};room.guardVotes={};room.discussionSkips={};room.roundResult=null;room.timerEndsAt=null;}
export function setPhase(room,phase){room.phase=phase;markPhase(room);if(phase==='discussion'){room.timerEndsAt=Date.now()+room.discussionSeconds*1000;room.discussionSkips={};}else if(phase!=='discussion')room.timerEndsAt=null;if(phase==='result')room.roundResult=computeRoundResult(room);}
export function startGame(room){
  room.roleCounts=normalizeRoleCounts(room.roleCounts);
  const n=(room.roster||[]).length, rc=room.roleCounts;
  const special=ROLE_ORDER.reduce((sum,r)=>sum+Number(rc[r]||0),0);
  if(n<5)throw new Error('出演者は5人以上必要です');
  if(special>=n)throw new Error('市民が1人以上残るように役職数を調整してください');
  if(Object.keys(room.joins||{}).length<n)throw new Error('全出演者が参加してから開始してください');
  if(playerSurveyCount(room)<n)throw new Error('全出演者がアンケートに回答してから開始してください');
  if(!room.surveyFinalized)throw new Error('事前アンケート結果を確定してください');
  const roles=[];for(const role of ROLE_ORDER){for(let i=0;i<Number(rc[role]||0);i++)roles.push(role);}while(roles.length<n)roles.push('citizen');
  const shuffled=shuffle(roles);room.roster.forEach((c,i)=>{c.role=shuffled[i];c.alive=true;});Object.values(room.joins||{}).forEach(j=>j.roleSeen=false);room.roundIndex=0;room.phase='roleReveal';markPhase(room);room.seerChecks={};room.compareChecks={};room.spooferActions={};room.history=[];resetRound(room);room.started=true;
}
export function resolveAttack(room){
  const fr=aliveCast(room).filter(c=>c.role==='frenemy'),choices=fr.map(c=>room.attackVotes?.[c.id]).filter(Boolean);
  if(choices.length!==fr.length)throw new Error('生存中のフレネミー全員が襲撃先を選んでいません'); if(new Set(choices).size!==1)throw new Error('フレネミーの襲撃先が一致していません');
  const victim=byCast(room,choices[0]); if(!victim||!victim.alive||victim.role==='frenemy')throw new Error('無効な襲撃先です');
  const guards=Object.entries(room.guardVotes||{}).filter(([,targetId])=>targetId===victim.id).map(([cid])=>byCast(room,cid)).filter(Boolean);
  if(guards.length)return {victim,blocked:true,guardedBy:guards.map(g=>({id:g.id,name:g.name}))};
  victim.alive=false;
  return {victim,blocked:false,guardedBy:[]};
}
export function eliminate(room,castId){const c=byCast(room,castId);if(!c||!c.alive)throw new Error('無効な追放対象です');c.alive=false;return c;}
export function maybeGameOver(room){const fr=aliveCast(room).filter(c=>c.role==='frenemy').length,allies=aliveCast(room).filter(c=>['madman','spoofer'].includes(c.role)).length,town=aliveCast(room).length-fr-allies;if(fr===0)return{over:true,winner:'市民陣営'};if(fr+allies>=town)return{over:true,winner:'フレネミー陣営'};return{over:false};}
export function autoAdvance(room){
  if(!room.autoAdvance||!room.started||room.phase==='gameOver')return false;
  let changed=false;
  const live=()=>aliveCast(room);
  const liveIds=()=>live().map(c=>c.id);
  const liveFrenemies=()=>live().filter(c=>c.role==='frenemy');
  const liveInfo=()=>aliveInfoRoles(room);
  const go=phase=>{setPhase(room,phase);changed=true;};
  for(let guard=0;guard<4;guard++){
    const before=room.phase;
    if(room.phase==='roleReveal'){
      const allSeen=(room.roster||[]).every(c=>room.joins?.[c.id]?.roleSeen);
      if(allSeen&&elapsed(room,800))go('theme');
    }else if(room.phase==='theme'){
      if(elapsed(room,3500))go('frenemyInfo');
    }else if(room.phase==='frenemyInfo'){
      if(elapsed(room,3500))go('seer');
    }else if(room.phase==='seer'){
      const info=liveInfo();
      if(!info.length&&elapsed(room,2200))go('discussion');
      else if(info.length&&allAliveInfoRolesChecked(room))go('discussion');
    }else if(room.phase==='discussion'){
      if(allAliveSkippedDiscussion(room)||room.timerEndsAt&&Date.now()>=room.timerEndsAt)go('finalVote');
    }else if(room.phase==='finalVote'){
      const ids=liveIds();
      if(ids.length&&ids.every(id=>room.finalVotes?.[id])&&elapsed(room,800))go('result');
    }else if(room.phase==='result'){
      if(elapsed(room,5000))go(room.roundResult?.success?'attack':'suspectVote');
    }else if(room.phase==='attack'){
      const fr=liveFrenemies();
      const knights=aliveKnights(room);
      if(fr.length&&fr.every(c=>room.attackVotes?.[c.id])&&knights.every(c=>room.guardVotes?.[c.id])){
        const attack=resolveAttack(room);
        room.history.push({round:room.roundIndex,kind:'attack',castId:attack.victim.id,name:attack.victim.name,blocked:attack.blocked,guardedBy:attack.guardedBy});
        if(attack.blocked)room.history.push({round:room.roundIndex,kind:'guard',castId:attack.victim.id,name:attack.victim.name,guardedBy:attack.guardedBy});
        const game=maybeGameOver(room);
        go(game.over?'gameOver':'suspectVote');
      }
    }else if(room.phase==='suspectVote'){
      const ids=liveIds();
      if(ids.length&&ids.every(id=>room.suspectVotes?.[id])){
        const counts=tally(room.suspectVotes);
        const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]||live().findIndex(c=>c.id===a[0])-live().findIndex(c=>c.id===b[0]))[0];
        if(top){
          const c=eliminate(room,top[0]);
          room.history.push({round:room.roundIndex,kind:'eliminate',castId:c.id,name:c.name,role:c.role});
          const game=maybeGameOver(room);
          go(game.over?'gameOver':'roundEnd');
        }
      }
    }else if(room.phase==='roundEnd'){
      if(elapsed(room,5000)){
        const game=maybeGameOver(room);
        if(game.over)go('gameOver');
        else {room.roundIndex++;resetRound(room);go(room.roundIndex>=room.themes.length?'gameOver':'theme');}
      }
    }
    if(room.phase===before)break;
  }
  return changed;
}
