/* Real native integrations. Browser HTML never simulates a successful connection. */
state.deviceData=LS.get('balans2.deviceData',{});
state.bleData=LS.get('balans2.bleData',{});
state.healthInfo=LS.get('balans2.healthInfo',{granted:[],origins:[],at:0,warnings:[]});
let healthBusy=false,healthMessage='',healthInstall=false;
toast=function(title,sub){
 const view=document.querySelector('.view.on')||document.querySelector('.view.active');
 if(!view)return;
 let el=view.querySelector('.inline-result');
 if(!el){el=document.createElement('p');el.className='foot inline-result';el.setAttribute('role','status');view.appendChild(el)}
 el.textContent=title+(sub?' · '+sub:'');
};
window.onNativeStatus=message=>toast(message);
const bleState={devices:{},message:'Поиск не запущен',connected:false,scanning:false,address:null,last:null,connecting:false};
state.savedDevices=LS.get('balans2.savedDevices',[]);
state.bleAuto=LS.get('balans2.bleAuto',false);
state.sourceListOpen=LS.get('balans2.sourceListOpen',false);
let sourceRenderTimer=0,lastBleAuto=0;
function sourcesVisible(){return $('#v-sources')?.classList.contains('on')||state.page==='sources'}
function scheduleSources(){if(sourceRenderTimer)return;sourceRenderTimer=setTimeout(()=>{sourceRenderTimer=0;if(sourcesVisible())renderSrcList()},180)}
function rememberDevice(ev){
 if(!ev.address)return;
 const item={address:ev.address,name:ev.name||bleState.devices[ev.address]?.name||'Медицинский прибор',profiles:ev.supportedProfiles||[],lastConnected:Date.now()};
 state.savedDevices=[item,...state.savedDevices.filter(d=>d.address!==item.address)].slice(0,20);
 LS.set('balans2.savedDevices',state.savedDevices);
}
function tryBleAuto(){
 if(!state.bleAuto||!window.BalansBle||!state.savedDevices.length||bleState.connected||bleState.connecting||bleState.scanning||Date.now()-lastBleAuto<30000)return;
 lastBleAuto=Date.now();const d=state.savedDevices[0];bleState.address=d.address;bleState.connecting=true;
 try{window.BalansBle.connect(d.address)}catch(e){bleState.connecting=false;bleState.message=e.message}
}
window.onAppForeground=()=>{tryBleAuto()};
setTimeout(()=>tryBleAuto(),700);
const isNative=()=>!!window.BalansHealth;
state.demo=false;LS.set('balans2.demo',false);stripDemo();
if(!LS.get('balans2.native13',false)){
  state.demo=false;LS.set('balans2.demo',false);stripDemo();
  const samples=['Плохо спал, поздно лёг после работы','Длинная прогулка с семьёй, 12 км','Простуда, температура 37,4'];
  state.diary=state.diary.filter(d=>!(samples.includes(d.t)&&[1,2,3].includes(d.id)));
  if(state.rem.length===3&&state.rem.map(r=>r.t).join('|')==='Выпить воды|Измерить давление|Взвеситься')state.rem=[];
  saveP();LS.set('balans2.native13',true);
}
state.hc.on=isNative()&&state.healthInfo.granted.length>0;
const HC_PERMISSION={
 steps:'STEPS',distance:'DISTANCE',activeCalories:'ACTIVE_CALORIES_BURNED',totalCalories:'TOTAL_CALORIES_BURNED',
 exercise:'EXERCISE',floors:'FLOORS_CLIMBED',elevation:'ELEVATION_GAINED',speed:'SPEED',heart:'HEART_RATE',
 restingHeart:'RESTING_HEART_RATE',bp:'BLOOD_PRESSURE',spo2:'OXYGEN_SATURATION',hrv:'HEART_RATE_VARIABILITY',
 resp:'RESPIRATORY_RATE',sleep:'SLEEP',weight:'WEIGHT',height:'HEIGHT',bodyFat:'BODY_FAT',
 leanMass:'LEAN_BODY_MASS',bodyWater:'BODY_WATER_MASS',boneMass:'BONE_MASS',water:'HYDRATION',
 nutrition:'NUTRITION',temp:'BODY_TEMPERATURE',glucose:'BLOOD_GLUCOSE',vo2:'VO2_MAX',
 bmr:'BASAL_METABOLIC_RATE',power:'POWER',cadence:'STEPS',cyclingCadence:'EXERCISE',
 skinTemperature:'SKIN_TEMPERATURE',mindfulness:'MINDFULNESS'
};
function nativeHealth(action){
  if(!isNative())return toast('Доступно в Android-приложении','HTML не может запрашивать данные Health Connect');
  try{window.BalansHealth[action]()}catch(e){healthBusy=false;toast('Не удалось выполнить действие',e.message)}
}
function refreshIntegrations(){renderHC();if(sourcesVisible())renderSrcList();refreshDataSections()}
window.onHealthEvent=function(ev){
 healthMessage=ev.message||'';
 if(ev.type==='progress')healthBusy=true;
 else if(ev.type!=='permissions')healthBusy=false;
 healthInstall=!!ev.install;
 if(ev.granted){
   const permissionChanged=[...ev.granted].sort().join('|')!==[...state.healthInfo.granted].sort().join('|');
   state.healthInfo.granted=ev.granted;
   state.hc.on=ev.granted.length>0;
   if(!state.hc.on){healthBusy=false;state.deviceData={}}
   else if(ev.type==='permissions'){
     const granted=new Set(ev.granted),filtered=Object.fromEntries(Object.entries(state.deviceData).filter(([id])=>granted.has('android.permission.health.READ_'+HC_PERMISSION[id])));
     if(Object.keys(filtered).length!==Object.keys(state.deviceData).length)state.deviceData=filtered;
     if((permissionChanged||Date.now()-(state.healthInfo.at||0)>300000)&&!healthBusy)setTimeout(()=>nativeHealth('sync'),0);
   }
 }
 if(ev.type==='synced'){
   // Replace only successfully queried intervals, retaining cached older history
   // and failed types. Legacy bridges still use complete snapshot replacement.
   const bounded=ev.range&&Array.isArray(ev.successfulMetricIds);
   const granted=new Set(ev.granted||state.healthInfo.granted);
   const next=bounded?Object.fromEntries(Object.entries(state.deviceData).filter(([id])=>granted.has('android.permission.health.READ_'+HC_PERMISSION[id]))):{};
   const successful=new Set(ev.successfulMetricIds||Object.keys(ev.records||{})),truncated=new Set(ev.truncatedMetricIds||[]);
   const start=Number(ev.range?.queriedStart),end=Number(ev.range?.queriedEnd);
   if(bounded)successful.forEach(id=>{
    if(!byId[id])return;
    if(!truncated.has(id)&&Number.isFinite(start)&&Number.isFinite(end))
     next[id]=(next[id]||[]).filter(r=>r.ts<start||r.ts>end);
   });
   Object.entries(ev.records||{}).forEach(([id,rs])=>{
     if(!byId[id]||!Array.isArray(rs))return;
     if(bounded&&!successful.has(id))return;
     const incoming=rs.filter(r=>Number.isFinite(r.v)&&Number.isFinite(r.ts));
     const recordKey=r=>r.id||((r.day||r.ts)+'|'+(r.source||''));
     const merged=new Map((bounded?next[id]||[]:[]).map(r=>[recordKey(r),r]));
     incoming.forEach(r=>merged.set(recordKey(r),r));
     next[id]=[...merged.values()].sort((a,b)=>a.ts-b.ts);
   });
   state.deviceData=next;
   state.healthInfo={granted:ev.granted||[],origins:ev.origins||[],at:ev.at,warnings:ev.warnings||[],range:ev.range||null,perMetricRange:ev.perMetricRange||{},sampling:ev.sampling||null};
   state.hc.on=state.healthInfo.granted.length>0;state.hc.sync=ev.at;
   const ids=Object.keys(next).filter(id=>next[id].length);
   if(Array.isArray(state.fold)){state.fold=state.fold.filter(id=>!ids.includes(id));saveTop()}
   state.demo=false;LS.set('balans2.demo',false);stripDemo();
   if(ev.warnings?.length)healthMessage=`Чтение завершено с ограничениями: ${ev.warnings.length}. Подробности ниже.`;
   toast(ev.warnings?.length?'Чтение завершено с ограничениями':'Синхронизация завершена',ids.length?`Получено показателей: ${ids.length}`:'Доступных записей не получено');
 }
 if(ev.type==='disconnected'){
   state.hc.on=false;state.deviceData={};state.healthInfo={granted:[],origins:[],at:0,warnings:[]};
 }
 if(ev.type==='error'||ev.type==='unavailable')toast('Health Connect',healthMessage);
 LS.set('balans2.healthInfo',state.healthInfo);
 if(ev.type==='progress'){renderHC();return}
 saveP();refreshIntegrations();
};
renderHC=function(){
 const el=$('#hcCard');if(!el)return;
 const h=state.healthInfo,n=Object.values(state.deviceData).filter(x=>x.length).length;
 el.innerHTML=`<div class="item" style="padding:0"><span class="ic">${ic('i-plug')}</span><span class="t"><b>Health Connect</b><small>${state.hc.on?`Разрешено типов: ${h.granted.length} · с данными: ${n}`:'Реальные данные приложений на этом телефоне'}</small></span></div>
 <p class="foot" role="status">${esc(healthBusy?'Синхронизация…':healthMessage||(h.at?'Последнее чтение: '+new Date(h.at).toLocaleString('ru-RU'):'Доступ ещё не проверен'))}</p>
 <div class="btnrow"><button class="btn" data-native="hc-connect" ${healthBusy?'disabled':''}>${state.hc.on?'Изменить разрешения':'Подключить'}</button><button class="btn ghost" data-native="hc-sync" ${healthBusy?'disabled':''}>Синхронизировать</button></div>
 <div class="btnrow" style="margin-top:8px"><button class="btn ghost" data-native="hc-settings">Настройки Health Connect</button>${state.hc.on?'<button class="btn ghost" data-native="hc-disconnect">Отключить</button>':''}${healthInstall?'<button class="btn ghost" data-native="hc-install">Установить</button>':''}</div>
 <p class="foot">Запрашивается история до 366 дней. Фактическая глубина зависит от разрешений Android и записей источника. Сначала разрешите приложению бренда записывать данные в Health Connect. Прямого входа в облачные аккаунты здесь нет.</p>
 ${h.range?`<p class="foot">Запрошено дней: ${h.range.requestedDays||'—'}. ${h.range.historyLimited?'Доступ к старой истории ограничен. ':''}${h.range.availableStart&&h.range.availableEnd?'Получены записи: '+periodDate(h.range.availableStart)+' – '+periodDate(h.range.availableEnd):'Даты полученных записей пока не определены.'}</p>`:''}
 ${state.hc.on&&window.BalansHealth?.requestHistory?'<button class="btn ghost" data-native="hc-history">Разрешить старую историю</button>':''}
 ${h.warnings?.length?`<details><summary>Не все данные прочитаны (${h.warnings.length})</summary><p class="foot">${h.warnings.map(esc).join('<br>')}</p></details>`:''}`;
};
const sourceApps={
 samsung:['com.sec.android.app.shealth'],google:['com.fitbit.FitbitMobile','com.google.android.apps.fitness'],
 garmin:['com.garmin.android.apps.connectmobile'],withings:['com.withings.wiscale2'],oura:['com.ouraring.oura'],
 polar:['fi.polar.polarflow'],whoop:['com.whoop.android'],huawei:['com.huawei.health'],
 xiaomi:['com.xiaomi.wearable'],strava:['com.strava'],mfp:['com.myfitnesspal.android']
};
renderSrcList=function(){
 const el=$('#srcCard');if(!el)return;
 el.innerHTML=`<details class="sources-fold" ${state.sourceListOpen?'open':''}><summary>Приложения-источники <span>${Object.keys(SRC_DEF).length}</span></summary><div class="card list">${Object.entries(SRC_DEF).map(([id,s])=>{
 const found=sourceApps[id]?.some(p=>state.healthInfo.origins.includes(p));
 return `<div class="item"><span class="ic" style="color:${s.color}">${esc(s.icon)}</span><span class="t"><b>${esc(s.name)}</b><small>${found?'Записи получены через Health Connect':'Обмен настраивается в приложении бренда'}</small></span><button class="btn ghost" data-native="source" data-id="${id}">Открыть</button></div>`}).join('')}</div>
 <p class="foot">«Записи получены» означает наличие источника в прочитанных данных. Если сервис не экспортирует данные в Health Connect, нужна отдельная интеграция производителя.</p></details>
 <div class="card ble-card"><b>Приборы по Bluetooth</b><p class="foot">Прямое BLE-подключение: стандартные профили пульса, веса, давления, температуры, SpO₂ и глюкозы. Закрытые протоколы производителей не поддерживаются автоматически.</p>
 <div class="btnrow"><button class="btn" data-native="ble-scan" ${bleState.connected||bleState.connecting?'disabled':''}>${bleState.scanning?'Идёт поиск':'Найти прибор'}</button><button class="btn ghost" data-native="ble-stop">Остановить</button></div>
 <details style="margin-top:12px"><summary>Не нашли свой прибор?</summary><p class="foot">Обычный поиск показывает доступные для подключения устройства с объявленным медицинским профилем. Некоторые приборы не объявляют профиль до подключения; для них есть расширенный поиск. Он не гарантирует совместимость.</p><button class="btn ghost wide" data-native="ble-scan-all" ${bleState.connected||bleState.connecting?'disabled':''}>Расширенный поиск</button></details>
 <div class="lbl2">Сохранённые приборы</div>
 ${state.savedDevices.length?state.savedDevices.map(d=>`<div class="item ble-device-row is-saved"><span class="t"><b>${esc(d.name)}</b><small>${bleState.connected&&bleState.address===d.address?'Подключён':esc(d.address)}</small></span><button class="btn ghost" data-native="ble-connect" data-address="${esc(d.address)}" ${bleState.connecting||bleState.connected?'disabled':''}>Подключить</button><button class="xbtn" data-native="ble-forget" data-address="${esc(d.address)}" aria-label="Забыть прибор">×</button></div>`).join(''):'<p class="foot">Прибор появится здесь после успешного подключения.</p>'}
 <label class="frow"><span class="k">Автоподключение<small>К последнему прибору при открытии приложения; без постоянного поиска в фоне</small></span><input type="checkbox" id="bleAuto" ${state.bleAuto?'checked':''} aria-label="Автоподключение"></label>
 <p class="foot" id="bleStatus" role="status">${esc(bleState.message)}</p><div id="bleDevices">${Object.values(bleState.devices).map(d=>`<div class="item ble-device-row"><span class="t"><b>${esc(d.name||'BLE-прибор')}</b><small>${esc(d.address)} · ${d.rssi} dBm${d.supportedAdvertised?' · медицинский профиль':''}</small></span><button class="btn ghost" data-native="ble-connect" data-address="${esc(d.address)}">Подключить</button></div>`).join('')}</div>
 ${bleState.connected?'<button class="btn ghost wide" data-native="ble-disconnect">Отключить прибор</button>':''}
 ${bleState.last?`<p class="foot">Последнее измерение: ${esc(bleState.last)}</p>`:''}
 <p class="foot">Включите режим передачи измерений на приборе. Совместимость подтверждается при подключении; приложение принимает новые стандартные измерения, а не всю память прибора.</p></div>`;
 el.querySelector('.sources-fold')?.addEventListener('toggle',e=>{state.sourceListOpen=e.target.open;LS.set('balans2.sourceListOpen',state.sourceListOpen)});
};
permSheet=function(){nativeHealth('connect')};
window.onBleEvent=function(ev){
 if(ev.message)bleState.message=ev.message;
 if(ev.type==='device'){
   if(ev.connectable===false||(!ev.supportedAdvertised&&ev.scanMode!=='expanded'))return;
   bleState.devices[ev.address]=ev;scheduleSources();return;
 }
 if(ev.type==='knownDevice')rememberDevice(ev);
 if(ev.type==='status'){
   bleState.scanning=ev.state==='scanning';bleState.connected=ev.state==='ready';
   bleState.connecting=['connecting','discovering','configuring'].includes(ev.state);
   if(ev.state==='ready')rememberDevice({...ev,address:ev.address||bleState.address});
   if(ev.address)bleState.address=ev.address;
 }
 if(ev.type==='error'&&ev.code!=='connection_busy')bleState.connecting=false;
 if(ev.type==='error'&&['connection_timeout','gatt_timeout','gatt_connection','discovery_failed','unsupported','connect_failed','no_accessible_measurements','permission_denied','permission_revoked','bluetooth_disabled','unavailable','bluetooth_error'].includes(ev.code)){bleState.connected=false;bleState.connecting=false}
 if(ev.type==='measurement'){
   const ms=ev.measurements||[],at=Number.isFinite(ev.receivedAt)?ev.receivedAt:Date.now();let bp={};
   const map={heartRate:'heart',weight:'weight',temperature:'temp',spo2:'spo2',glucose:'glucose'};
   const labels=[];
   ms.forEach(m=>{
     if(!Number.isFinite(m.value))return;
     if(m.metric==='systolic'||m.metric==='diastolic'){bp[m.metric]=m.unit==='kPa'?m.value*7.50061683:m.value;return}
     const id=map[m.metric];if(!id)return;
     let v=m.value;
     if(id==='weight'&&m.unit==='lb')v*=0.45359237;
     if(id==='temp'&&m.unit==='degF')v=(v-32)*5/9;
     if(id==='glucose'&&m.unit==='mg/dL')v/=18.01559;
     add(id,v);labels.push(`${byId[id].name}: ${fmt(v,byId[id].dec)}`);
   });
   if(Number.isFinite(bp.systolic)&&Number.isFinite(bp.diastolic)){
     add('bp',bp.systolic,bp.diastolic);labels.push(`Давление: ${Math.round(bp.systolic)}/${Math.round(bp.diastolic)}`);
   }
   function add(id,v,lo){
     const r={id:`ble:${ev.address}:${at}:${id}`,v,ts:at,d:new Date(at).toLocaleDateString('ru-RU'),source:`Bluetooth ${ev.address||''}`};
     if(lo!==undefined)r.lo=lo;
     const a=state.bleData[id]||[];if(!a.some(old=>old.id===r.id))a.push(r);state.bleData[id]=a.slice(-2000);
     if(Array.isArray(state.fold)){state.fold=state.fold.filter(x=>x!==id);saveTop()}
   }
   LS.set('balans2.bleData',state.bleData);bleState.last=labels.join(' · ');
   state.demo=false;LS.set('balans2.demo',false);refreshDataSections();
   if(labels.length)toast('Получено измерение',bleState.last);
 }
 if(ev.type==='error'){bleState.scanning=false;toast('Bluetooth',ev.message)}
 scheduleSources();
};
window.addEventListener('click',e=>{
 const b=e.target.closest('[data-native],[data-x]');if(!b)return;
 const aliases={hcOn:'hc-connect',sync:'hc-sync',perms:'hc-connect',perm:'hc-connect',permall:'hc-connect',permnone:'hc-settings',hcOff:'hc-disconnect',srctog:'hc-settings',srcAll:'hc-connect'};
 const action=b.dataset.native||aliases[b.dataset.x];if(!action)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(action==='clear-device-data'){
   confirmSheet('Удалить локальные копии?','Записи Health Connect и Bluetooth будут удалены только из «Баланса». Оригиналы и разрешения источников останутся.','Удалить',()=>{
     state.deviceData={};state.bleData={};persistHealthCache();LS.set('balans2.bleData',{});
     state.healthInfo.at=0;state.healthInfo.range=null;state.healthInfo.perMetricRange={};LS.set('balans2.healthInfo',state.healthInfo);closeSheet();renderAll();rerender();
   });return;
 }
 const a=action.replace('hc-','');
 if(action.startsWith('hc-')){
   const method={connect:'connect',sync:'sync',settings:'settings',disconnect:'disconnect',install:'install',history:'requestHistory'}[a];
   if(action==='hc-sync'&&healthBusy)return;
   if(action==='hc-sync'&&isNative()){healthBusy=true;healthMessage='Начинаем чтение…';renderHC()}
   nativeHealth(method);return;
 }
 if(action==='source'){
   if(!isNative())return toast('Доступно в APK','Для подключения откройте приложение на телефоне');
   const id=b.dataset.id;window.BalansHealth.openSource(id);return;
 }
 if(action.startsWith('ble-')){
   if(!window.BalansBle)return toast('Bluetooth доступен в APK','HTML не подключает приборы');
   try{
     if(action==='ble-scan'){bleState.devices={};window.BalansBle.scan()}
     if(action==='ble-scan-all'){bleState.devices={};window.BalansBle.scanAll()}
     if(action==='ble-connect'){bleState.address=b.dataset.address;bleState.connecting=true;window.BalansBle.connect(b.dataset.address)}
     if(action==='ble-forget'){state.savedDevices=state.savedDevices.filter(d=>d.address!==b.dataset.address);LS.set('balans2.savedDevices',state.savedDevices);if(bleState.address===b.dataset.address){window.BalansBle.disconnect();bleState.connected=false;bleState.connecting=false}renderSrcList()}
     if(action==='ble-stop')window.BalansBle.stop();
     if(action==='ble-disconnect'){lastBleAuto=Date.now();window.BalansBle.disconnect()}
   }catch(err){toast('Ошибка Bluetooth',err.message)}
 }
},true);
// Stale data must never be silently labeled as measurements from Samsung.
const sourceName=m=>{const r=recs(m).at(-1);return r?(r.source?(r.source.startsWith('Bluetooth')?'Bluetooth':'Health Connect'):'Вручную'):demoOn()?'Демо':'Вручную'};
const oldVizMini=vizMini;
vizMini=function(m,w,h){
 if(demoOn())return oldVizMini(m,w,h);
 const v=series(m,'week').filter(Number.isFinite).slice(-32);
 if(!v.length)return `<svg viewBox="0 0 ${w} ${h}"></svg>`;
 const low=Math.min(...v),range=Math.max(...v)-low||1;
 const pts=v.map((x,i)=>[4+i*(w-8)/Math.max(v.length-1,1),h-4-(x-low)/range*(h-8)]);
 return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Фактические записи"><path d="${pts.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')}" fill="none" stroke="${cv(m)}" stroke-width="2"/>${pts.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="${cv(m)}"/>`).join('')}</svg>`;
};
const oldDrawChart=drawChart;
drawChart=function(m,p,c){
 if(!demoOn()){
   const vs=series(m,p).filter(Number.isFinite).slice(-120);
   if(!vs.length)return {svg:`<svg viewBox="0 0 380 180"><text x="190" y="90" text-anchor="middle" fill="var(--muted)" font-size="14">Нет записей за этот период</text></svg>`,v:[],p:null};
   const low=Math.min(...vs)*.95,high=Math.max(...vs)*1.05;
   const xy=vs.map((v,i)=>[24+(vs.length===1?166:i*332/(vs.length-1)),142-(v-low)/((high-low)||1)*100]);
   let g=`<path d="M24 146H356" stroke="var(--line)" fill="none"/>`;
   if(['bar','sleep','ring'].includes(m.chart)){
     const w=Math.max(1,Math.min(24,300/vs.length));
     g+=xy.map(([x,y])=>`<rect x="${x-w/2}" y="${y}" width="${w}" height="${146-y}" rx="${Math.min(3,w/2)}" fill="${cv(m)}"/>`).join('');
   }else{
     g+=`<path d="${xy.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')}" fill="none" stroke="${cv(m)}" stroke-width="2"/>`;
     g+=xy.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2" fill="${cv(m)}"/>`).join('');
   }
   g+=`<text x="24" y="170" fill="var(--muted)" font-size="12">Фактические записи · ${vs.length}${series(m,p).length>120?' последних':''}</text>`;
   return {svg:`<svg viewBox="0 0 380 180" aria-label="Фактические записи">${g}</svg>`,v:vs,p:null,noSel:true};
 }
 return oldDrawChart(m,p,c);
};
const oldVizBig=vizBig,oldBigLegend=bigLegend,oldDetails=details,oldDeltaChip=deltaChip,oldVsUsual=vsUsual;
vizBig=function(m,p){return demoOn()?oldVizBig(m,p):drawChart(m,p,false)};
bigLegend=function(m){return demoOn()?oldBigLegend(m):''};
details=function(m,v){
 if(demoOn())return oldDetails(m,v);
 const a=v.filter(Number.isFinite);
 if(!a.length)return [];
 return [['Источник последней записи',esc(sourceName(m))],['Всего сохранённых записей',String(recs(m).length)]];
};
deltaChip=function(m){
 if(demoOn())return oldDeltaChip(m);
 const a=recs(m);if(a.length<2)return '';
 const d=a.at(-1).v-a.at(-2).v;
 if(Math.abs(d)<.5/Math.pow(10,m.dec||0))return 'Без заметного изменения';
 return `${d>0?'+':''}${fmt(d,m.dec)} ${esc(m.unit)} к предыдущей записи`;
};
vsUsual=function(m){return demoOn()?oldVsUsual(m):deltaChip(m)};
const oldSpark=spark;
spark=function(m,w=150,h=44){return demoOn()?oldSpark(m,w,h):vizMini(m,w,h)};
const oldMoreBadges=moreBadges;
moreBadges=function(){return {...oldMoreBadges(),sources:state.hc.on?'доступ есть':'не подключено'}};
if(isNative())setTimeout(()=>nativeHealth('status'),300);
const sourceResponsiveStyle=document.createElement('style');
sourceResponsiveStyle.textContent=`
.view,.card,.item,.item>.t,.item>.t>b,.item>.t>small,.frow>.k{min-width:0}
.item>.t>b,.item>.t>small,.foot,.frow>.k{overflow-wrap:anywhere;white-space:normal}
.ble-device-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
.ble-device-row.is-saved{grid-template-columns:minmax(0,1fr) auto 28px}
.ble-device-row>.t{width:auto;min-width:0;overflow-wrap:anywhere}
.ble-device-row>.btn{min-width:0;max-width:100%;white-space:nowrap;overflow-wrap:normal;padding:11px 12px}
.ble-device-row>.xbtn{width:28px;min-width:0;justify-self:end}
.ble-card .frow{align-items:center}.ble-card .frow input[type=checkbox]{width:22px;height:22px;flex:0 0 22px;margin:0;accent-color:var(--accent)}
.ble-card .frow>.k{flex:1}.ble-card .foot{overflow-wrap:anywhere}
#srcCard .item>.btn{flex-shrink:0}
.btnrow{min-width:0;flex-wrap:wrap}.btnrow>.btn{min-width:0;white-space:normal;overflow-wrap:anywhere}
.pinrow>.n{min-width:0;overflow-wrap:anywhere}.pinrow>.num{flex:none}
@media(max-width:480px){.ble-device-row,.ble-device-row.is-saved{grid-template-columns:minmax(0,1fr) 28px}.ble-device-row>.t{grid-column:1/-1}.ble-device-row>.btn{grid-column:1;justify-self:start;max-width:100%}.ble-device-row>.xbtn{grid-column:2}}
`;
document.head.appendChild(sourceResponsiveStyle);
