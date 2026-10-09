import { URL } from 'node:url';
import { createRoomPersisted, loadRoom, updateRoom, storageMode } from '../lib/storage.js';
import { ROLE_LABELS, token, id, createRoom, publicRoom, hostView, playerView, computeSurveyResults, finalizeSurvey, byCast, joinedByToken, currentTheme, startGame, setPhase, resolveAttack, eliminate, maybeGameOver, resetRound, playerSurveyKey, playerSurveyCount } from '../lib/game.js';

function send(res,status,obj){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store, max-age=0');res.end(JSON.stringify(obj));}
async function body(req){if(req.body&&typeof req.body==='object')return req.body;let d='';for await(const c of req){d+=c;if(d.length>2e6)throw new Error('リクエストが大きすぎます');}return d?JSON.parse(d):{};}
function authHost(room,url){return room&&url.searchParams.get('token')===room.hostToken;}
function apiPathOf(url){const routed=url.pathname==='/api/router'?url.searchParams.get('__path'):'';return routed?`/api/${routed.replace(/^\/+|\/+$/g,'')}`:url.pathname;}
function partsOf(url){return apiPathOf(url).split('/').filter(Boolean);}
function makeDefaultVotes(room,offset=0){
  const ids=room.roster.map(c=>c.id);
  const votes={};
  for(const theme of room.themes){
    votes[theme.id]=[ids[offset%ids.length],ids[(offset+1)%ids.length],ids[(offset+2)%ids.length]].filter(Boolean);
  }
  return votes;
}
function validateSurveyVotes(room,votes){
  for(const theme of room.themes){
    const v=votes?.[theme.id];
    if(!Array.isArray(v)||v.length!==3||new Set(v).size!==3||v.some(cid=>!byCast(room,cid)))throw new Error(`「${theme.title}」のTOP3を重複なしで選んでください`);
  }
}
function ensureTestReady(room){
  if(room.started)throw new Error('ゲーム開始後はテスト準備できません');
  if(room.roster.length<5)throw new Error('出演者は5人以上必要です');
  if(room.themes.length<1)throw new Error('テーマを1つ以上設定してください');
  room.roster.forEach((cast,i)=>{
    if(!room.joins[cast.id])room.joins[cast.id]={castId:cast.id,token:token(),joinedAt:Date.now(),roleSeen:false,testAuto:true};
    const key=playerSurveyKey(cast.id);
    if(!room.surveySubmissions[key])room.surveySubmissions[key]={nickname:cast.name,votes:makeDefaultVotes(room,i),at:Date.now(),castId:cast.id,playerSurvey:true,testAuto:true};
  });
  if(!room.surveyFinalized)finalizeSurvey(room);
}

export default async function handler(req,res){
  const url=new URL(req.url,`https://${req.headers.host||'localhost'}`), apiPath=apiPathOf(url), parts=partsOf(url);
  try{
    if(apiPath==='/api/info'&&req.method==='GET')return send(res,200,{storage:storageMode(),origin:url.origin});
    if(apiPath==='/api/rooms'&&req.method==='POST'){
      const b=await body(req); const room=await createRoomPersisted(()=>createRoom(b.title));
      return send(res,201,{code:room.code,hostToken:room.hostToken,surveyKey:room.surveyKey});
    }
    if(parts[0]!=='api'||parts[1]!=='rooms'||!parts[2])return send(res,404,{error:'APIが見つかりません'});
    const code=parts[2].toUpperCase(), loaded=await loadRoom(code); if(!loaded)return send(res,404,{error:'部屋が見つかりません'}); const room=loaded.room;
    if(parts[3]==='public'&&req.method==='GET')return send(res,200,publicRoom(room));
    if(parts[3]==='host'){
      if(!authHost(room,url))return send(res,403,{error:'ホスト認証に失敗しました'});
      if(parts.length===4&&req.method==='GET')return send(res,200,hostView(room));
      const result=await updateRoom(code,async r=>{
        if(!authHost(r,url))throw Object.assign(new Error('ホスト認証に失敗しました'),{status:403});
        if(parts[4]==='setup'&&req.method==='POST'){
          const b=await body(req);if(r.started)throw new Error('ゲーム開始後は設定変更できません');if(b.title)r.title=String(b.title).trim().slice(0,80)||r.title;
          if(Array.isArray(b.roster))r.roster=b.roster.map((x,i)=>({id:x.id||id('c'),name:String(x.name||`PLAYER ${i+1}`).trim(),alive:true,role:null}));
          if(Array.isArray(b.themes))r.themes=b.themes.map((x,i)=>({id:x.id||id('t'),title:String(x.title||`テーマ ${i+1}`).trim(),officialRanking:null}));
          if(b.roleCounts)r.roleCounts={frenemy:Number(b.roleCounts.frenemy||0),seer:Number(b.roleCounts.seer||0),madman:Number(b.roleCounts.madman||0)};
          if(b.discussionSeconds)r.discussionSeconds=Math.max(60,Number(b.discussionSeconds));for(const cid of Object.keys(r.joins))if(!r.roster.some(c=>c.id===cid))delete r.joins[cid];r.surveySubmissions={};r.surveyFinalized=false;return {view:'host'};
        }
        if(parts[4]==='test-ready'&&req.method==='POST'){ensureTestReady(r);return{view:'host'};}
        if(parts[4]==='finalize-survey'&&req.method==='POST'){
          if(playerSurveyCount(r)<r.roster.length)throw new Error(`出演者アンケートが未回答です（${playerSurveyCount(r)}/${r.roster.length}人）`);
          finalizeSurvey(r);return{view:'host'};
        }
        if(parts[4]==='start'&&req.method==='POST'){startGame(r);return{view:'host'};}
        if(parts[4]==='phase'&&req.method==='POST'){const b=await body(req),allowed=['roleReveal','theme','frenemyInfo','seer','discussion','finalVote','result','attack','suspectVote','roundEnd','gameOver'];if(!allowed.includes(b.phase))throw new Error('無効なフェーズ');setPhase(r,b.phase);return{view:'host'};}
        if(parts[4]==='resolve-attack'&&req.method==='POST'){const victim=resolveAttack(r);r.history.push({round:r.roundIndex,kind:'attack',castId:victim.id,name:victim.name});return{json:{victim:victim.name,game:maybeGameOver(r)}};}
        if(parts[4]==='eliminate'&&req.method==='POST'){const b=await body(req),c=eliminate(r,b.castId);r.history.push({round:r.roundIndex,kind:'eliminate',castId:c.id,name:c.name,role:c.role});return{json:{eliminated:{name:c.name,role:c.role,roleLabel:ROLE_LABELS[c.role]},game:maybeGameOver(r)}};}
        if(parts[4]==='next-round'&&req.method==='POST'){const b=await body(req),game=maybeGameOver(r);if(game.over&&!b.force)throw Object.assign(new Error(`${game.winner}の勝利条件を満たしています`),{extra:{game}});r.roundIndex++;resetRound(r);r.phase=r.roundIndex>=r.themes.length?'gameOver':'theme';return{view:'host'};}
        if(parts[4]==='reset'&&req.method==='POST'){r.phase='lobby';r.started=false;r.roundIndex=0;r.timerEndsAt=null;r.seerChecks={};r.history=[];resetRound(r);r.roster.forEach(c=>{c.role=null;c.alive=true;});Object.values(r.joins).forEach(j=>j.roleSeen=false);return{view:'host'};}
        throw Object.assign(new Error('APIが見つかりません'),{status:404});
      });
      if(!result)return send(res,404,{error:'部屋が見つかりません'}); if(result.value?.json)return send(res,200,result.value.json);return send(res,200,hostView(result.room));
    }
    if(parts[3]==='join'&&req.method==='POST'){
      const b=await body(req);
      const result=await updateRoom(code,r=>{
        const cast=byCast(r,b.castId);
        if(!cast)throw new Error('出演者が見つかりません');
        let j=r.joins[cast.id];
        if(!j){
          j={castId:cast.id,token:token(),joinedAt:Date.now(),roleSeen:false};
          r.joins[cast.id]=j;
        }
        return{json:{playerToken:j.token,castId:cast.id,name:cast.name,alreadyJoined:!!j.joinedAt}};
      });
      return send(res,200,result.value.json);
    }
    if(parts[3]==='player'){
      const ptoken=url.searchParams.get('token'), join=joinedByToken(room,ptoken);if(!join)return send(res,403,{error:'参加認証に失敗しました'});if(parts.length===4&&req.method==='GET')return send(res,200,playerView(room,join));
      const result=await updateRoom(code,async r=>{const j=joinedByToken(r,ptoken);if(!j)throw Object.assign(new Error('参加認証に失敗しました'),{status:403});const cast=byCast(r,j.castId);
        if(parts[4]==='survey'&&req.method==='POST'){
          if(r.started||r.phase!=='lobby')throw new Error('アンケート回答の受付は終了しています');
          const b=await body(req); validateSurveyVotes(r,b.votes);
          r.surveySubmissions[playerSurveyKey(cast.id)]={nickname:cast.name,votes:b.votes,at:Date.now(),castId:cast.id,playerSurvey:true};
          r.surveyFinalized=false;
          return{json:{ok:true,count:Object.keys(r.surveySubmissions).length,playerSurveyCount:playerSurveyCount(r)}};
        }
        if(parts[4]==='role-seen'&&req.method==='POST'){j.roleSeen=true;return{json:{ok:true}};}
        if(parts[4]==='seer'&&req.method==='POST'){if(cast.role!=='seer'||!cast.alive||r.phase!=='seer')throw new Error('現在は占えません');if(r.seerChecks[r.roundIndex])throw new Error('このラウンドではすでに占っています');const b=await body(req),rank=(currentTheme(r).officialRanking||[]).indexOf(b.targetId)+1;if(rank<1)throw new Error('順位が見つかりません');r.seerChecks[r.roundIndex]={seerId:cast.id,targetId:b.targetId,rank};return{json:{targetName:byCast(r,b.targetId)?.name,rank}};}
        if(parts[4]==='final-vote'&&req.method==='POST'){
          if(!cast.alive||r.phase!=='finalVote')throw new Error('現在は最終投票できません');
          const b=await body(req), target=byCast(r,b.targetId);
          if(!target||!target.alive)throw new Error('脱落している人には投票できません');
          r.finalVotes[cast.id]=b.targetId;return{json:{ok:true}};
        }
        if(parts[4]==='suspect-vote'&&req.method==='POST'){if(!cast.alive||r.phase!=='suspectVote')throw new Error('現在はフレネミー投票できません');const b=await body(req);if(b.targetId===cast.id||!byCast(r,b.targetId)?.alive)throw new Error('無効な投票先です');r.suspectVotes[cast.id]=b.targetId;return{json:{ok:true}};}
        if(parts[4]==='attack'&&req.method==='POST'){if(cast.role!=='frenemy'||!cast.alive||r.phase!=='attack')throw new Error('現在は襲撃できません');const b=await body(req),t=byCast(r,b.targetId);if(!t||!t.alive||t.role==='frenemy')throw new Error('無効な襲撃先です');r.attackVotes[cast.id]=b.targetId;return{json:{ok:true}};}
        throw Object.assign(new Error('APIが見つかりません'),{status:404});
      });return send(res,200,result.value.json);
    }
    if(parts[3]==='survey'){
      if(url.searchParams.get('key')!==room.surveyKey)return send(res,403,{error:'アンケートURLが無効です'});
      if(req.method==='GET')return send(res,200,{code:room.code,title:room.title,roster:room.roster.map(c=>({id:c.id,name:c.name})),themes:room.themes.map(t=>({id:t.id,title:t.title})),closed:room.surveyFinalized,count:Object.keys(room.surveySubmissions).length});
      if(req.method==='POST'){
        const b=await body(req);
        const result=await updateRoom(code,r=>{
          if(url.searchParams.get('key')!==r.surveyKey)throw Object.assign(new Error('アンケートURLが無効です'),{status:403});
          if(r.surveyFinalized)throw new Error('このアンケートは締め切られています');
          if(!b.deviceId)throw new Error('端末IDがありません');
          if(r.surveySubmissions[b.deviceId])return{json:{ok:true,count:Object.keys(r.surveySubmissions).length,alreadySubmitted:true}};
          validateSurveyVotes(r,b.votes);
          r.surveySubmissions[b.deviceId]={nickname:String(b.nickname||'').slice(0,40),votes:b.votes,at:Date.now(),externalSurvey:true};
          return{json:{ok:true,count:Object.keys(r.surveySubmissions).length}};
        });
        return send(res,200,result.value.json);
      }
    }
    return send(res,404,{error:'APIが見つかりません'});
  }catch(e){console.error(e);return send(res,e.status||400,{error:e.message||'サーバーエラー',...(e.extra||{})});}
}
