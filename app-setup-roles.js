const FW_ROLE_CONFIG=[
  ['frenemy','フレネミー','必須。ランキング1位を落とす'],
  ['seer','占い師','1人の事前順位を見る'],
  ['knight','騎士','夜に1人を護衛する'],
  ['medium','霊媒師','追放者の正体を見る'],
  ['comparer','比較者','2人の順位/同率を比較'],
  ['analyst','アナリスト','1位と2位の得点差を見る'],
  ['coroner','検死官','脱落者に初期1位がいるか見る'],
  ['spoofer','工作員','調査用ランキングを1回だけ偽装'],
  ['madman','狂人','フレネミー陣営の協力者'],
  ['narcissist','ナルシスト','自分の順位/TOP3を知る'],
  ['mounter','マウンター','自分より下位の生存者を知る']
];

const fwBaseOpenSetupFrom=openSetupFrom;
openSetupFrom=function(state){
  fwBaseOpenSetupFrom(state);
  const rc={frenemy:2,seer:1,madman:1,knight:0,medium:0,comparer:0,analyst:0,coroner:0,spoofer:0,narcissist:0,mounter:0,...(state.roleCounts||{})};
  const grid=document.querySelector('.role-count-grid');
  if(grid){
    grid.classList.add('expanded-role-grid');
    grid.innerHTML=FW_ROLE_CONFIG.map(([key,label,desc])=>`<label class="role-count-card expanded"><span>${esc(label)}</span><small>${esc(desc)}</small><input id="rc_${key}" data-role="${key}" type="number" min="${key==='frenemy'?1:0}" value="${Number(rc[key]||0)}"></label>`).join('');
  }
  const save=document.getElementById('saveSetup');
  if(save)save.onclick=async()=>{
    const roster=[...document.querySelectorAll('#rosterEdit input')].map((x,i)=>({id:x.dataset.id||`c_${i}`,name:x.value.trim()})).filter(x=>x.name);
    const themes=[...document.querySelectorAll('#themeEdit input')].map((x,i)=>({id:x.dataset.id||`t_${i}`,title:x.value.trim()})).filter(x=>x.title);
    if(roster.length<5)return notify('出演者は5人以上にしてください');
    if(themes.length<1)return notify('テーマを1つ以上入れてください');
    const roleCounts={};
    FW_ROLE_CONFIG.forEach(([key])=>roleCounts[key]=Number(document.getElementById(`rc_${key}`)?.value||0));
    roleCounts.frenemy=Math.max(1,roleCounts.frenemy||1);
    const total=Object.values(roleCounts).reduce((a,b)=>a+Number(b||0),0);
    if(total>=roster.length)return notify('役職数の合計は出演者数未満にしてください。残りは市民になります。');
    try{
      await api(hostUrl('/setup'),{method:'POST',body:JSON.stringify({roster,themes,roleCounts,discussionSeconds:Number(document.getElementById('discussionSec').value||300)})});
      setupOpen=false;editingSetup=false;lastHostSig='';await startHost();
    }catch(e){notify(e.message)}
  };
};
