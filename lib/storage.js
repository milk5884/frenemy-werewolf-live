import { get, put } from '@vercel/blob';

const localRooms = globalThis.__FW_LOCAL_ROOMS__ || new Map();
globalThis.__FW_LOCAL_ROOMS__ = localRooms;
const useBlob = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN);
const pathname = code => `frenemy-rooms/${code.toUpperCase()}.json`;

async function streamText(stream){
  if(!stream) return '';
  return await new Response(stream).text();
}

export async function loadRoom(code){
  code=String(code||'').toUpperCase();
  if(!useBlob()){
    const room=localRooms.get(code);
    return room?{room:structuredClone(room),etag:null}:null;
  }
  const result=await get(pathname(code),{access:'private',useCache:false});
  if(!result||result.statusCode===404)return null;
  if(result.statusCode&&result.statusCode!==200)throw new Error(`Storage read failed (${result.statusCode})`);
  const text=await streamText(result.stream || result.body);
  return {room:JSON.parse(text),etag:null};
}

export async function saveRoom(room,etag=null,{create=false}={}){
  if(!useBlob()){
    if(create&&localRooms.has(room.code))return false;
    localRooms.set(room.code,structuredClone(room));
    return true;
  }
  try{
    await put(pathname(room.code),JSON.stringify(room),{
      access:'private',
      contentType:'application/json',
      addRandomSuffix:false,
      allowOverwrite:!create
    });
    return true;
  }catch(e){
    if(create&&(e?.statusCode===409||/already exists|conflict|overwrite/i.test(String(e?.message||''))))return false;
    throw e;
  }
}

export async function createRoomPersisted(factory,maxAttempts=8){
  for(let i=0;i<maxAttempts;i++){
    const room=factory();
    if(await saveRoom(room,null,{create:true}))return room;
  }
  throw new Error('部屋コードの生成に失敗しました');
}

export async function updateRoom(code,mutator,maxAttempts=2){
  let lastError=null;
  for(let i=0;i<maxAttempts;i++){
    const loaded=await loadRoom(code);
    if(!loaded)return null;
    const room=loaded.room;
    const value=await mutator(room);
    try{
      await saveRoom(room,null,{create:false});
      return {room,value};
    }catch(e){
      lastError=e;
      await new Promise(resolve=>setTimeout(resolve,120*(i+1)));
    }
  }
  throw lastError || new Error('保存に失敗しました。もう一度お試しください');
}

export function storageMode(){return useBlob()?'vercel-blob':'memory';}
