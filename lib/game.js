import crypto from 'node:crypto';

export const ROLE_LABELS = { citizen:'市民', frenemy:'フレネミー', seer:'占い師', madman:'狂人' };
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
export const aliveCast = room => room.roster.filter(c=>c.alive);
export const currentTheme = room => room.themes[room.roundIndex] || null;
export const byCast = (room,castId) => room.roster.find(c=>c.id===castId);
export const joinedByToken = (room,playerToken) => Object.values(room.joins).find(j=>j.token===playerToken);
export const playerSurveyKey = castId => `player_${castId}`;
export const hasPlayerSurvey = (room,castId) => Boolean(room.surveySubmissions?.[playerSurveyKey(castId)]);
export const playerSurveyCount = room => room.roster.filter(c=>hasPlayerSurvey(room,c.id)).length;

export function createRoom(title='フレネミー人狼'){
  const code=newRoomCode();
  return {code,title:String(title||'フレネミー人狼').slice(0,80),hostToken:token(),surveyKey:token(8),createdAt:Date.now(),phase:'lobby',roundIndex:0,discussionSeconds:300,timerEndsAt:null,roleCounts:{frenemy:2,seer:1,madman:1},roster:[],joins:{},themes:[],surveySubmissions:{},surveyFinalized:false,started:false,finalVotes:{},suspectVotes:{},attackVotes:{},seerChecks:{},roundResult:null,history:[]};
}
export function publicRoom(room){
  return { code:room.code,title:room.title,createdAt:room.createdAt,phase:room.phase,roundIndex:room.roundIndex,discussionSeconds:room.discussionSeconds,roster:room.roster.map(c=>({id:c.id,name:c.name,joined:!!room.joins[c.id],alive:c.alive,surveySubmitted:hasPlayerSurvey(room,c.id)})),themes:room.themes.map(t=>({id:t.id,title:t.title})),surveyFinalized:room.surveyFinalized,surveyCount:Object.keys(room.surveySubmissions||{}).length,playerSurveyCount:playerSurveyCount(room) };
}
export function hostView(room){
  return {...publicRoom(room),hostToken:room.hostToken,surveyKey:room.surveyKey,roleCounts:room.roleCounts,timerEndsAt:room.timerEndsAt,themes:room.themes,roster:room.roster.map(c=>({...c,joined:!!room.joins[c.id],surveySubmitted:hasPlayerSurvey(room,c.id),roleSeen:!!room.joins[c.id]?.roleSeen})),finalVotes:room.finalVotes,suspectVotes:room.suspectVotes,attackVotes:room.attackVotes,seerChecks:room.seerChecks,roundResult:room.roundResult,history:room.history,surveyResults:computeSurveyResults(room,false)};
}
export function playerView(room,join){
  const cast=byCast(room,join.castId); const theme=currentTheme(room);
  const out={code:room.code,title:room.title,phase:room.phase,roundIndex:room.roundIndex,theme:theme?{id:theme.id,title:theme.title}:null,themes:room.themes.map(t=>({id:t.id,title:t.title})),surveyFinalized:room.surveyFinalized,surveySubmitted:hasPlayerSurvey(room,cast.id),surveyCount:Object.keys(room.surveySubmissions||{}).length,playerSurveyCount:playerSurveyCount(room),player:{id:cast.id,name:cast.name,alive:cast.alive,role:cast.role,roleLabel:ROLE_LABELS[cast.role],roleSeen:join.roleSeen},roster:room.roster.map(c=>room.phase==='gameOver'?({id:c.id,name:c.name,alive:c.alive,role:c.role,roleLabel:ROLE_LABELS[c.role],surveySubmitted:hasPlayerSurvey(room,c.id)}):({id:c.id,name:c.name,alive:c.alive,surveySubmitted:hasPlayerSurvey(room,c.id)})),timerEndsAt:room.timerEndsAt,discussionSeconds:room.discussionSeconds,votedFinal:!!room.finalVotes[cast.id],votedSuspect:!!room.suspectVotes[cast.id],attacked:!!room.attackVotes[cast.id],roundResult:['result','attack','suspectVote','roundEnd'].includes(room.phase)?room.roundResult:null};
  if(cast.role==='frenemy'){
    out.frenemyPartners=room.roster.filter(c=>c.role==='frenemy'&&c.id!==cast.id).map(c=>({id:c.id,name:c.name,alive:c.alive}));
    if(['frenemyInfo','seer','discussion','finalVote'].includes(room.phase)&&theme?.officialRanking?.length) out.frenemyTarget=byCast(room,theme.officialRanking[0])?.name||null;
    if(room.phase==='attack') out.partnerAttackVotes=Object.entries(room.attackVotes).filter(([cid])=>cid!==cast.id).map(([cid,targetId])=>({from:byCast(room,cid)?.name,target:byCast(room,targetId)?.name}));
  }
  if(cast.role==='seer'){
    const check=room.seerChecks[room.roundIndex];
    if(check&&check.seerId===cast.id) out.seerCheck={targetId:check.targetId,targetName:byCast(room,check.targetId)?.name,rank:check.rank};
  }
  return out;
}
export function computeSurveyResults(room,includeRanking=true){
  const acc={};
  for(const theme of room.themes){
    const stats={}; room.roster.forEach((c,i)=>stats[c.id]={castId:c.id,name:c.name,points:0,first:0,second:0,third:0,order:i});
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
  for(const theme of room.themes){
    const rows=results[theme.id].rows, groups=[];
    for(const row of rows){ const k=`${row.points}|${row.first}|${row.second}|${row.third}`; let g=groups.find(x=>x.key===k); if(!g){g={key:k,rows:[]};groups.push(g);} g.rows.push(row); }
    theme.officialRanking=groups.flatMap(g=>g.rows.length>1?shuffle(g.rows):g.rows).map(r=>r.castId);
  }
  room.surveyFinalized=true;
}
export function tally(votes){ const counts={}; Object.values(votes).forEach(x=>{if(x)counts[x]=(counts[x]||0)+1;}); return counts; }
export function computeRoundResult(room){
  const theme=currentTheme(room); if(!theme?.officialRanking?.length)return null;
  const counts=tally(room.finalVotes), officialTop=theme.officialRanking[0], max=Math.max(0,...Object.values(counts)), officialVotes=counts[officialTop]||0;
  const winners=Object.entries(counts).filter(([,n])=>n===max&&max>0).map(([id])=>id);
  return {officialTop,officialTopName:byCast(room,officialTop)?.name,officialTopVotes:officialVotes,maxVotes:max,winners,winnerNames:winners.map(id=>byCast(room,id)?.name),success:max>officialVotes,counts};
}
export function resetRound(room){room.finalVotes={};room.suspectVotes={};room.attackVotes={};room.roundResult=null;room.timerEndsAt=null;}
export function setPhase(room,phase){room.phase=phase;if(phase==='discussion')room.timerEndsAt=Date.now()+room.discussionSeconds*1000;else if(phase!=='discussion')room.timerEndsAt=null;if(phase==='result')room.roundResult=computeRoundResult(room);}
export function startGame(room){
  const n=room.roster.length, rc=room.roleCounts, special=rc.frenemy+rc.seer+rc.madman;
  if(n<5)throw new Error('出演者は5人以上必要です');
  if(special>=n)throw new Error('市民が1人以上残るように役職数を調整してください');
  if(Object.keys(room.joins).length<n)throw new Error('全出演者が参加してから開始してください');
  if(playerSurveyCount(room)<n)throw new Error('全出演者がアンケートに回答してから開始してください');
  if(!room.surveyFinalized)throw new Error('事前アンケート結果を確定してください');
  const roles=[];for(let i=0;i<rc.frenemy;i++)roles.push('frenemy');for(let i=0;i<rc.seer;i++)roles.push('seer');for(let i=0;i<rc.madman;i++)roles.push('madman');while(roles.length<n)roles.push('citizen');
  const shuffled=shuffle(roles);room.roster.forEach((c,i)=>{c.role=shuffled[i];c.alive=true;});Object.values(room.joins).forEach(j=>j.roleSeen=false);room.roundIndex=0;room.phase='roleReveal';room.seerChecks={};room.history=[];resetRound(room);room.started=true;
}
export function resolveAttack(room){
  const fr=aliveCast(room).filter(c=>c.role==='frenemy'),choices=fr.map(c=>room.attackVotes[c.id]).filter(Boolean);
  if(choices.length!==fr.length)throw new Error('生存中のフレネミー全員が襲撃先を選んでいません'); if(new Set(choices).size!==1)throw new Error('フレネミーの襲撃先が一致していません');
  const victim=byCast(room,choices[0]); if(!victim||!victim.alive||victim.role==='frenemy')throw new Error('無効な襲撃先です'); victim.alive=false; return victim;
}
export function eliminate(room,castId){const c=byCast(room,castId);if(!c||!c.alive)throw new Error('無効な追放対象です');c.alive=false;return c;}
export function maybeGameOver(room){const fr=aliveCast(room).filter(c=>c.role==='frenemy').length,mad=aliveCast(room).filter(c=>c.role==='madman').length,town=aliveCast(room).length-fr-mad;if(fr===0)return{over:true,winner:'市民陣営'};if(fr+mad>=town)return{over:true,winner:'フレネミー陣営'};return{over:false};}
