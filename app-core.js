const app = document.getElementById('app');
const toast = document.getElementById('toast');
const qs = new URLSearchParams(location.search);
const mode = qs.get('mode') || 'home';
const roomCode = (qs.get('room') || '').toUpperCase();
const clientSlot = (qs.get('slot') || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,40);
const fixedCastId = (qs.get('cast') || '').replace(/[^a-zA-Z0-9_-]/g,'').slice(0,80);
const storageSuffix = clientSlot ? `_${clientSlot}` : '';

const phaseLabels = {
  lobby:'準備', roleReveal:'役職確認', theme:'テーマ発表', frenemyInfo:'フレネミー情報',
  seer:'占い', discussion:'議論', finalVote:'ランキング投票', result:'結果発表', attack:'襲撃',
  suspectVote:'フレネミー投票', roundEnd:'ラウンド終了', gameOver:'ゲーム終了'
};
const roleMeta = {
  citizen:{label:'市民',emoji:'🙂',symbol:'人',cls:'role-citizen',desc:'会話から、ランキングを意図的に動かしているフレネミーを見抜いてください。'},
  frenemy:{label:'フレネミー',emoji:'😈',symbol:'狼',cls:'role-frenemy',desc:'毎ラウンド知らされる「視聴者1位」を、会話だけで1位から落としてください。'},
  seer:{label:'占い師',emoji:'🔮',symbol:'占',cls:'role-seer',desc:'毎ラウンド、議論前に1人だけ指定し、その人の事前アンケート順位を知れます。'},
  madman:{label:'狂人',emoji:'🤡',symbol:'狂',cls:'role-madman',desc:'フレネミー陣営です。ただしフレネミーも事前1位も知りません。会話から味方を推理してください。'}
};

let pollHandle = null;
let shareBase = `${location.protocol}//${location.host}`;
let lastHostSig = '';
let setupOpen = false;
let editingSetup = false;
let lastSceneKey = '';

function esc(v=''){ return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function fmtTime(sec){ sec=Math.max(0,Math.ceil(sec)); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
function notify(msg){ toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),1800); }
function wait(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }
async function api(url,opts={}){
  const method=String(opts.method||'GET').toUpperCase();
  const attempts = opts.retries ?? (method==='GET' ? 3 : 1);
  let lastError;
  for(let i=0;i<attempts;i++){
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), opts.timeout || 8500);
    try{
      const res=await fetch(url,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts,signal:controller.signal});
      let data={}; try{data=await res.json();}catch(_){ }
      if(!res.ok) throw new Error(data.error||`HTTP ${res.status}`);
      return data;
    }catch(e){
      lastError=e;
      if(i<attempts-1) await wait(500*(i+1));
    }finally{ clearTimeout(timeout); }
  }
  throw lastError || new Error('通信に失敗しました');
}
function brandLogo(){
  return `<div class="brand-mark" aria-hidden="true"><span class="brand-mark-main">F</span><span class="brand-mark-cut">×</span></div>`;
}
function roleIcon(role,extra=''){
  const r=roleMeta[role]||roleMeta.citizen;
  return `<span class="role-icon ${r.cls} ${extra}" aria-hidden="true"><span>${esc(r.symbol||r.emoji||'?')}</span></span>`;
}
function phaseProgressHtml(state,compact=false){
  const order=['roleReveal','theme','frenemyInfo','seer','discussion','finalVote','result','attack','suspectVote','roundEnd','gameOver'];
  const active=Math.max(0,order.indexOf(state.phase));
  const visible=compact ? order.filter(p=>p!=='attack'||state.roundResult?.success) : order;
  return `<div class="phase-progress ${compact?'compact':''}">${visible.map(p=>{
    const idx=order.indexOf(p); const cls=idx<active?'done':idx===active?'active':'todo';
    return `<div class="phase-step ${cls}"><span></span><b>${esc(phaseLabels[p]||p)}</b></div>`;
  }).join('')}</div>`;
}
function sceneForState(state){
  if(!state||!state.started)return null;
  const round = Number(state.roundIndex||0)+1;
  if(state.phase==='theme') return {kind:'day', icon:'☀️', title:'朝が来ました', text:`ROUND ${round} が始まります`, tone:'day'};
  if(state.phase==='attack') return {kind:'night', icon:'🌙', title:'夜になりました', text:'フレネミーが襲撃先を選びます', tone:'night'};
  if(state.phase==='suspectVote') return {kind:'dawn', icon:'🌅', title:'夜が明けました', text:state.latestAttack?.name?`${state.latestAttack.name} が襲撃されました`:'襲撃結果を確認してください', tone:'dawn'};
  if(state.phase==='roundEnd') return {kind:'end', icon:'📣', title:'ラウンド終了', text:state.latestElimination?.name?`${state.latestElimination.name} が追放されました`:'次のラウンドへ進みます', tone:'end'};
  if(state.phase==='gameOver') return {kind:'gameover', icon:'🏁', title:'ゲーム終了', text:'すべての結果を確認してください', tone:'end'};
  return null;
}
function maybeShowSceneOverlay(state){
  const scene=sceneForState(state);
  if(!scene)return;
  const key=`${state.code||roomCode}:${state.roundIndex}:${state.phase}:${scene.text}`;
  if(key===lastSceneKey)return;
  lastSceneKey=key;
  const old=document.querySelector('.scene-overlay'); if(old)old.remove();
  const el=document.createElement('div');
  el.className=`scene-overlay scene-overlay-${scene.tone}`;
  el.innerHTML=`<div class="scene-orb">${esc(scene.icon)}</div><div class="scene-overlay-kicker">${esc(scene.kind.toUpperCase())}</div><div class="scene-overlay-title">${esc(scene.title)}</div><div class="scene-overlay-text">${esc(scene.text)}</div>`;
  document.body.appendChild(el);
  setTimeout(()=>el.classList.add('leaving'),2100);
  setTimeout(()=>el.remove(),2850);
}
function showConnectionBanner(msg='通信が不安定です。自動で再接続しています…'){
  let b=document.getElementById('connectionBanner');
  if(!b){b=document.createElement('div');b.id='connectionBanner';b.className='conn-banner';document.body.appendChild(b);}
  b.innerHTML=`<strong>再接続中</strong><span>${esc(msg)}</span>`;
}
function hideConnectionBanner(){ const b=document.getElementById('connectionBanner'); if(b)b.remove(); }
function shell(inner,extra=''){
  return `<div class="shell"><div class="topbar"><div class="brand">${brandLogo()}<div>フレネミー人狼<small>FRENEMY WEREWOLF LIVE</small></div></div>${extra}</div>${inner}<div class="footer-note">フレネミー人狼 LIVE v2.2 / スマホ・PCからオンライン参加できます。</div></div>`;
}
function currentBaseUrl(){ return shareBase; }
async function resolveShareBase(){
  if(!['localhost','127.0.0.1'].includes(location.hostname)) return;
  try{ const info=await api('/api/info'); if(info.lanUrls?.length) shareBase=info.lanUrls[0]; }catch(_){ }
}
function qrImage(url){ return `https://quickchart.io/qr?size=320&margin=1&text=${encodeURIComponent(url)}`; }
async function copyText(t){ try{await navigator.clipboard.writeText(t);notify('URLをコピーしました');}catch(_){prompt('コピーしてください',t);} }
function tally(votes={}){ const c={}; Object.values(votes).forEach(id=>{if(id)c[id]=(c[id]||0)+1}); return c; }
function nameOf(state,id){ return state.roster?.find(x=>x.id===id)?.name || '—'; }
function aliveCount(state){ return state.roster.filter(x=>x.alive).length; }
function roleCountAlive(state,role){ return state.roster.filter(x=>x.alive&&x.role===role).length; }
function playerStorageKey(){ return `fw_player_${roomCode}${storageSuffix}`; }
function surveyDeviceKey(){ return `fw_survey_device_${roomCode}${storageSuffix}`; }
function surveyDoneKey(key){ return `fw_survey_done_${roomCode}_${key}${storageSuffix}`; }

function renderHome(){
  app.innerHTML=shell(`
    <section class="hero"><div class="eyebrow">SOCIAL DEDUCTION × RANKING</div><h1>本当に<br>味方ですか？</h1><p>視聴者が事前に作ったランキング。その1位を、会話だけで引きずり下ろそうとする「フレネミー」が紛れています。</p></section>
    <div class="grid">
      <section class="card half"><div class="kicker">HOST</div><h2>新しいゲームを作る</h2><p>進行役用。部屋を作成して、出演者・テーマ・視聴者アンケートを設定します。</p><button class="big full" id="createRoom">部屋を作成</button></section>
      <section class="card half"><div class="kicker">PLAYER</div><h2>出演者として参加</h2><div class="field"><label>6桁の部屋コード</label><input id="joinCode" maxlength="6" placeholder="ABC123" autocapitalize="characters"></div><button class="secondary big full" id="joinRoom">参加する</button></section>
    </div>`);
  document.getElementById('createRoom').onclick=async()=>{
    try{ const d=await api('/api/rooms',{method:'POST',body:JSON.stringify({title:'フレネミー人狼'})}); localStorage.setItem(`fw_host_${d.code}`,d.hostToken); location.href=`/?mode=host&room=${d.code}&token=${d.hostToken}`; }catch(e){notify(e.message)}
  };
  document.getElementById('joinRoom').onclick=()=>{ const c=document.getElementById('joinCode').value.trim().toUpperCase(); if(c.length<4)return notify('部屋コードを入力してください'); location.href=`/?mode=join&room=${encodeURIComponent(c)}`; };
}

async function joinCast(castId){
  const d=await api(`/api/rooms/${roomCode}/join`,{method:'POST',body:JSON.stringify({castId})});
  localStorage.setItem(playerStorageKey(),d.playerToken);
  return d.playerToken;
}
async function renderJoin(){
  if(!roomCode) return renderHome();
  const saved=localStorage.getItem(playerStorageKey());
  if(saved){ return startPlayer(saved); }
  try{
    const state=await api(`/api/rooms/${roomCode}/public`);
    if(fixedCastId){
      const cast=state.roster.find(x=>x.id===fixedCastId);
      if(!cast)throw new Error('固定された出演者が見つかりません');
      app.innerHTML=shell(`<section class="card center"><div class="kicker">FIXED TEST DEVICE</div><h2>${esc(cast.name)} として参加中</h2><p>このテスト端末を出演者にひも付けています。</p></section>`, `<div class="room-code">${esc(roomCode)}</div>`);
      const token=await joinCast(fixedCastId);
      return startPlayer(token);
    }
    const available=state.roster.filter(x=>!x.joined);
    app.innerHTML=shell(`
      <section class="hero"><div class="eyebrow">ROOM ${esc(roomCode)}${clientSlot?` / ${esc(clientSlot)}`:''}</div><h1>${esc(state.title)}</h1><p>自分の名前を選んで参加してください。役職はゲーム開始後、自分の端末だけに表示されます。</p></section>
      <section class="card"><h2>あなたは誰ですか？</h2>${available.length?`<div class="list">${available.map(c=>`<button class="secondary full joinCast" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`:`<div class="empty">参加できる出演者がありません。ホスト側の設定を確認してください。</div>`}</section>`, `<div class="room-code">${esc(roomCode)}</div>`);
    document.querySelectorAll('.joinCast').forEach(b=>b.onclick=async()=>{
      try{const token=await joinCast(b.dataset.id);startPlayer(token);}catch(e){notify(e.message)}
    });
  }catch(e){ app.innerHTML=shell(`<section class="card"><h2>参加できません</h2><p>${esc(e.message)}</p><a class="button-link secondary" href="/">トップへ</a></section>`); }
}

function roleCard(state){
  const r=roleMeta[state.player.role]||roleMeta.citizen;
  const partner = state.player.role==='frenemy' && state.frenemyPartners?.length ? `<div class="divider"></div><div class="kicker">仲間のフレネミー</div><h3>${state.frenemyPartners.map(x=>esc(x.name)).join(' / ')}</h3>` : '';
  return `<div class="role-card">${roleIcon(state.player.role,'large')}<div class="kicker">YOUR ROLE</div><div class="role-name ${r.cls}">${r.label}</div><p>${r.desc}</p>${partner}</div>`;
}

function draftKey(state,kind){
  const pid=state?.player?.id || 'player';
  return `fw_draft_${roomCode}_${pid}_${kind}_${state?.roundIndex ?? 0}${storageSuffix}`;
}
function getDraft(state,kind){ try{return sessionStorage.getItem(draftKey(state,kind))||'';}catch(_){return '';} }
function setDraft(state,kind,value){ try{value?sessionStorage.setItem(draftKey(state,kind),value):sessionStorage.removeItem(draftKey(state,kind));}catch(_){} }
function clearDraft(state,kind){ setDraft(state,kind,''); }
function selectedAttr(value,current){ return value&&value===current?' selected':''; }
