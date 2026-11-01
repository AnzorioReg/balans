// Contract/visual regression with isolated fixture data, not device certification.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chromium'});
 const context=await browser.newContext({viewport:{width:412,height:915}});
 await context.addInitScript(()=>{
  window.calls=[];
  window.BalansHealth=Object.fromEntries(['status','connect','sync','disconnect','settings','install','openSource'].map(a=>[a,(...v)=>calls.push([a,...v])]));
  window.BalansBle=Object.fromEntries(['scan','scanAll','connect','disconnect','stop'].map(a=>[a,(...v)=>calls.push(['ble-'+a,...v])]));
  window.BalansAppearance={status(){},setIcon(id){calls.push(['icon',id]);onAppearanceEvent({id})},setSystemBars(...v){calls.push(['bars',...v])}};
  window.BalansReminders=Object.fromEntries(['sync','requestPermission','test','clear'].map(a=>[a,(...v)=>calls.push(['rem-'+a,...v])]));
 });
 const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'index.html')).href);
 await p.waitForTimeout(600);
 assert.equal(await p.evaluate('AV().length'),0);
 assert.equal(await p.evaluate('state.diary.length'),0);
 assert.equal(await p.evaluate('state.rem.length'),0);
 assert.equal(await p.evaluate('demoOn()'),false);
 assert.equal(await p.locator('[data-x=demoTog]').count(),0);
 await p.evaluate(()=>{go('themes')});
 assert.equal(await p.locator('[data-app-icon]').count(),10);
 assert.deepEqual(await p.evaluate('[PALS.dark.length,PALS.light.length]'),[10,10]);
 for(const id of await p.evaluate('APP_IDENTITIES.map(i=>i.id)')){
  await p.locator(`[data-app-icon="${id}"]`).click();
  assert.equal(await p.evaluate('state.appIcon'),id);
 }
 for(const mode of ['dark','light']){
  await p.evaluate(mode=>{state.theme=mode;applyTheme()},mode);
  for(const id of await p.evaluate(mode=>PALS[mode].map(i=>i[0]),mode)){
   await p.evaluate(({mode,id})=>{state.pal[mode]=id;applyTheme()},{mode,id});
   assert.ok(await p.evaluate(()=>/^#[\da-f]{6}$/i.test(calls.filter(c=>c[0]==='bars').at(-1)[2])));
  }
 }
 await p.evaluate(()=>{
  state.theme='dark';state.pal.dark='cobalt';applyTheme();
  window.makeFixture=(n=7)=>Object.fromEntries(M.map(m=>[m.id,Array.from({length:n},(_,i)=>{
   const ts=Date.now()-(n-i-1)*86400000;
   return {id:m.id+':'+i,ts,d:localDay(ts),v:Math.round((Number(m.base)||20)*(1+i*.01)*100)/100,
    ...(m.id==='bp'?{lo:80+i}:{}),...(DAILY_METRICS.has(m.id)?{day:localDay(ts)}:{}),source:'fixture.test'};
  })]));
  state.fold=[];state.manual={};state.deviceData=makeFixture();renderAll();setTab('overview');
 });
 const ids=await p.evaluate('M.map(m=>m.id)');
 for(const count of [0,1,7]){
  await p.evaluate(count=>{state.deviceData=makeFixture(count);renderAll()},count);
  for(const style of ['signature','aurora','capsule','points']){
   await p.evaluate(style=>{state.chartSet=style;metricViewsRefresh()},style);
   for(const id of ids){
    await p.evaluate(id=>openMetric(id),id);
    const bad=await p.locator('#sheet').evaluate(e=>/NaN|Infinity|undefined/.test(e.innerHTML));
    assert.equal(bad,false,`${count} records ${style}/${id}`);
    assert.equal(await p.locator('#sheet [data-y=cfold]').count(),0);
    await p.evaluate(()=>closeSheet());
   }
  }
 }
 await p.evaluate(()=>{state.deviceData=makeFixture(7);state.chartSet='signature';renderAll();setTab('overview')});
 for(const icon of ['classic','outline','soft','duo']){
  await p.evaluate(icon=>{state.iconSet=icon;metricViewsRefresh()},icon);
  assert.ok(await p.evaluate(()=>[...document.querySelectorAll('#groups .ic use')].every(u=>document.getElementById(u.getAttribute('href').slice(1)))));
 }
 await p.evaluate(()=>{state.fold=['heart'];renderGroups()});
 await p.evaluate(()=>openAdd());
 assert.ok(await p.locator('#sheet [data-y=unfold][data-a=heart]').count());
 await p.evaluate(()=>closeSheet());
 await p.evaluate(()=>{
  const now=Date.now(),y=now-86400000;
  state.deviceData.steps=[{id:'old',v:9999,ts:y,d:localDay(y),day:localDay(y)}];
  renderAll();
 });
 assert.equal(await p.evaluate('showCur(byId.steps)'),'—');
 await p.evaluate(()=>{state.deviceData.steps=[...state.deviceData.steps,{id:'today',v:1234,ts:Date.now(),day:localDay(),d:localDay()}];renderAll()});
 assert.equal(await p.evaluate('actualLatest(byId.steps)'),1234);
 await p.evaluate(()=>go('sources'));
 await p.locator('.sources-fold summary').click();
 await p.waitForTimeout(50);
 assert.equal(await p.evaluate('state.sourceListOpen'),true);
 await p.evaluate(()=>onBleEvent({type:'device',address:'00:00:00:00:00:00',name:'Random',supportedAdvertised:false,connectable:true}));
 assert.equal(await p.evaluate("!!bleState.devices['00:00:00:00:00:00']"),false);
 await p.evaluate(()=>onBleEvent({type:'device',address:'AA:BB:CC:DD:EE:FF',name:'Health scale',supportedAdvertised:true,connectable:true,rssi:-60}));
 await p.waitForTimeout(220);
 assert.ok((await p.locator('#bleDevices').innerText()).includes('Health scale'));
 await p.evaluate(()=>onBleEvent({type:'status',state:'ready',address:'AA:BB:CC:DD:EE:FF',name:'Health scale',supportedProfiles:['weight']}));
 assert.equal(await p.evaluate('state.savedDevices.length'),1);
 await p.evaluate(()=>onBleEvent({type:'status',state:'disconnected',message:'Отключён'}));
 await p.locator('#bleAuto').check();
 assert.ok(await p.evaluate("calls.some(c=>c[0]==='ble-connect'&&c[1]==='AA:BB:CC:DD:EE:FF')"));
 await p.evaluate(()=>go('remind'));
 await p.locator('[data-x=remNew]').click();
 await p.locator('#fRem input[name=t]').fill('Проверка расписания');
 await p.locator('#fRem input[name=tm]').fill('13:45');
 await p.locator('#fRem button[type=submit]').click();
 await p.waitForTimeout(30);
 assert.equal(await p.evaluate('state.rem.length'),1);
 assert.ok(await p.evaluate("calls.some(c=>c[0]==='rem-sync'&&JSON.parse(c[1]).length===1)"));
 assert.ok(await p.evaluate("calls.some(c=>c[0]==='rem-requestPermission')"));
 await p.locator('[data-x=remTest]').click();
 assert.ok(await p.evaluate("calls.some(c=>c[0]==='rem-test')"));
 await p.evaluate(()=>{state.fold=[];state.theme='dark';state.pal.dark='cobalt';state.chartSet='signature';state.iconSet='duo';state.top.style='heart';state.top.layout='inline';applyTheme();renderAll();setTab('overview')});
 await p.waitForTimeout(300);
 await p.screenshot({path:require('node:path').join(__dirname,'qa113-overview.png')});
 await p.evaluate(()=>go('themes'));
 await p.screenshot({path:require('node:path').join(__dirname,'qa113-appearance.png'),fullPage:true});
 await p.evaluate(()=>{state.theme='light';state.pal.light='peach';applyTheme();setTab('overview')});
 await p.waitForTimeout(250);
 await p.screenshot({path:require('node:path').join(__dirname,'qa113-light.png')});
 assert.deepEqual(errors,[]);
 console.log('PASS: 384 metric detail cases (32×4×3), four icon sets, real current-day totals, 20 palettes,10 launcher choices, filtered/saved/autoconnect BLE contracts, native reminder contracts; no JS errors. Hardware not tested.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
