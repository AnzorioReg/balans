/* Large Health Connect history is stored asynchronously, not in 5MB localStorage.
   Backup/restore and explicit reset use the same store. No health data leaves device. */
let healthDBPromise=null,healthCacheError='',healthCacheSuspended=false;
function healthDB(){
 if(healthDBPromise)return healthDBPromise;
 healthDBPromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB)return reject(new Error('Хранилище IndexedDB недоступно'));
  const request=indexedDB.open('balans-health',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('snapshots');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('Не удалось открыть хранилище'));
 });
 return healthDBPromise;
}
async function readHealthCache(){
 const db=await healthDB();return new Promise((resolve,reject)=>{
  const request=db.transaction('snapshots').objectStore('snapshots').get('current');
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
 });
}
async function replaceHealthCache(records,info){
 try{
  const db=await healthDB();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('snapshots','readwrite');
   tx.objectStore('snapshots').put({records,info},'current');
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  localStorage.removeItem('balans2.deviceData');healthCacheError='';return true;
 }catch(e){
  const saved=LS.set('balans2.deviceData',records);
  healthCacheError=saved?'':'Не удалось сохранить историю на устройстве. Освободите место и повторите синхронизацию.';
  if(!saved)toast('История пока только в памяти',healthCacheError);
  return saved;
 }
}
function persistHealthCache(){return healthCacheSuspended?Promise.resolve(false):replaceHealthCache(state.deviceData,state.healthInfo)}
async function restoreHealthCache(records,info){
 healthCacheSuspended=true;
 const saved=await replaceHealthCache(records,info);
 if(!saved)healthCacheSuspended=false;
 return saved;
}
async function clearHealthCache(){
 healthCacheSuspended=true;
 try{
  const db=await healthDB();
  await new Promise((resolve,reject)=>{
   const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').delete('current');
   tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
  localStorage.removeItem('balans2.deviceData');return true;
 }catch(e){healthCacheSuspended=false;if(healthDBPromise)healthCacheError='Не удалось очистить хранилище истории';return !window.indexedDB}
}
const healthCacheReady=(async()=>{
 try{
  const stored=await readHealthCache();
  if(stored?.records&&(stored.info?.at||0)>=(state.healthInfo.at||0)){
   state.deviceData=stored.records;state.healthInfo=stored.info||state.healthInfo;
   refreshDataSections();renderHC();
  }else if(Object.keys(state.deviceData).length)await persistHealthCache();
 }catch(e){/* Existing localStorage snapshot remains a safe compatibility fallback. */}
})();
// Apply initial native permissions after disk load, so revoked types cannot reappear.
const healthEventBeforeCache=window.onHealthEvent;
window.onHealthEvent=ev=>healthCacheReady.then(()=>{
 if(healthCacheSuspended)return;
 healthEventBeforeCache(ev);
 if(['permissions','synced','disconnected'].includes(ev.type))return persistHealthCache();
});
