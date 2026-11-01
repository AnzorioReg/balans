const {chromium}=require('playwright'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const b=await chromium.launch({channel:'chromium',headless:true});
 const c=await b.newContext({viewport:{width:375,height:812},timezoneId:'Europe/Moscow'});
 await c.addInitScript(()=>{
  window.hcCalls=[];window.BalansHealth=Object.fromEntries(['status','sync','connect','disconnect','settings','install','requestHistory'].map(k=>[k,()=>hcCalls.push(k)]));
  if(!localStorage.getItem('qa116seed')){localStorage.setItem('balans2.top',JSON.stringify({style:'none',items:['steps','water','heart']}));localStorage.setItem('qa116seed','1')}
 });
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url=pathToFileURL(path.join(__dirname,'index.html')).href;
 await p.goto(url);await p.evaluate(()=>healthCacheReady);
 const visibility=()=>p.evaluate(()=>[!!$('#topBlock .activity-main'),!!$('#topBlock .activity-metrics')]);
 assert.deepEqual(await visibility(),[false,false],'Legacy hidden block migrates without losing restore access');
 async function topToggle(key){
  if(!await p.locator('#dashboardPopover').count())await p.locator('#topBlock .dots').click();
  await p.locator(`[data-dashboard=visibility][data-value=${key}]`).click();
 }
 await topToggle('showFigure');assert.deepEqual(await visibility(),[true,false]);
 await topToggle('showMetrics');assert.deepEqual(await visibility(),[true,true]);
 await topToggle('showFigure');assert.deepEqual(await visibility(),[false,true]);
 await topToggle('showMetrics');assert.deepEqual(await visibility(),[false,false]);
 await p.reload();await p.evaluate(()=>healthCacheReady);assert.deepEqual(await visibility(),[false,false]);
 await p.locator('#topBlock .dots').click();await p.locator('[data-dashboard=style][data-value=tracks]').click();
 assert.deepEqual(await visibility(),[true,false],'Selecting style explicitly restores figure');
 await p.evaluate(()=>{closeDashboardPopover();go('themes')});
 await p.locator('[data-topvisibility=showMetrics]').click();assert.deepEqual(await visibility(),[true,true]);
 await p.locator('[data-topvisibility=showFigure]').click();assert.deepEqual(await visibility(),[false,true]);
 await p.locator('[data-topset=heart]').click();assert.deepEqual(await visibility(),[true,true]);
 await p.evaluate(async()=>{
  state.manual={};state.deviceData={steps:[],heart:[]};
  for(let i=0;i<400;i++){
   const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-399+i);const ts=d.getTime();
   state.deviceData.steps.push({ts,day:localDay(ts),v:1000+i*10,source:'com.test'});
   state.deviceData.heart.push({ts,v:60+i/20,source:'com.test'},{ts:ts+30000,v:62+i/20,source:'com.test'});
  }
  state.healthInfo={granted:['android.permission.health.READ_STEPS','android.permission.health.READ_HEART_RATE'],at:Date.now(),warnings:[]};
  state.hc.on=true;state.metric='steps';state.fold=[];state.period='week';renderAll();await persistHealthCache();setTab('dynamics');
 });
 const observed={};
 for(const [period,days]of [['day',1],['week',7],['month',30],['6m',183],['year',366]]){
  await p.locator(`[data-period="${period}"]`).click();
  const data=await p.evaluate(()=>{
   const raw=metricRecords(byId.steps,state.period),plots=metricChartRecords(byId.steps,state.period);
   return {raw:raw.length,plotted:plots.length,sum:raw.reduce((s,r)=>s+r.v,0),chartSum:plots.reduce((s,r)=>s+r.v*(r.sampleCount||1),0),coverage:$('#dynCard .period-coverage').textContent,big:$('#dynCard .big').textContent,svg:$('#dynCard .chart').innerHTML};
  });
  assert.equal(data.raw,days);assert.ok(Math.abs(data.sum-data.chartSum)<1e-6,'Daily averages must preserve all actual days and not double-count snapshots');
  assert.match(data.coverage,new RegExp('записей: '+days));observed[period]=data;
 }
 assert.notEqual(observed.week.big,observed.month.big);assert.notEqual(observed.month.svg,observed.year.svg);
 assert.ok(observed.year.plotted<=13&&observed.year.plotted>=12);
 await p.screenshot({path:path.join(__dirname,'ui116-dynamics.png')});
 assert.equal(await p.locator('#heat .heat-day').count(),28);
 assert.match(await p.locator('#heat i').last().getAttribute('title'),/показателей с записями: 2/);
 await p.locator('#heat .heat-day').first().click();
 assert.match(await p.locator('#heatDetails').innerText(),/2 показателей · 3 записей/);
 assert.equal(await p.locator('#heatDetails [data-metric]').count(),2);
 await p.locator('#heatDetails [data-metric=heart]').click();
 const cardStats={};
 for(const period of ['week','month','6m','year']){
  await p.locator(`#sheet [data-sp="${period}"]`).click();
  assert.equal(await p.locator('#sheet [data-selected-period]').getAttribute('data-selected-period'),period);
  cardStats[period]=await p.locator('#sheet .period-coverage').innerText();
 }
 assert.notEqual(cardStats.week,cardStats.year);
 await p.locator('#sheet [data-close]').click();
 await p.evaluate(()=>{state.diary=[{id:1,d:localDay(),t:'within116',tags:[]},{id:2,d:'2020-01-01',t:'outside116',tags:[]}];$('#screen').scrollTop=0});
 await p.waitForTimeout(220);await p.locator('[data-period=month]').click();await p.locator('#dynamicsReport').click();
 assert.equal(await p.evaluate('state.tab'),'dynamics');assert.equal(await p.evaluate('state.rperiod'),'month');
 assert.match(await p.locator('#pBody').innerText(),/within116/);assert.doesNotMatch(await p.locator('#pBody').innerText(),/outside116/);
 assert.ok(await p.evaluate(()=>reportText().includes('within116')&&!reportText().includes('outside116')));
 assert.ok(await p.evaluate(()=>reportHTML().includes('within116')&&!reportHTML().includes('outside116')));
 await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-report.png')});
 await p.locator('[data-x=rper][data-a="6m"]').click();assert.equal(await p.evaluate('reportRows()[0].days'),183);
 assert.equal(await p.evaluate("MORE.flatMap(g=>g[1]).filter(x=>x[0]==='report').length"),0);
 // Scrolling must not alter layout dimensions or rebuild metric DOM.
 await p.evaluate(()=>{setTab('overview');window.scrollMutations=[];window.cardMutations=0;
  new MutationObserver(ms=>scrollMutations.push(...ms.map(m=>m.attributeName))).observe($('#screen'),{attributes:true,attributeFilter:['style']});
  new MutationObserver(ms=>cardMutations+=ms.length).observe($('#groups'),{childList:true,subtree:true});
 });
 const session=await c.newCDPSession(p);await session.send('Emulation.setCPUThrottlingRate',{rate:4});
 const padding=await p.locator('#screen').evaluate(el=>getComputedStyle(el).paddingBottom);
 const height=await p.locator('#screen').evaluate(el=>el.scrollHeight);
 for(const y of [200,400,600,800,600,400,200,0]){
  await p.locator('#screen').evaluate((el,y)=>el.scrollTop=y,y);await p.waitForTimeout(35);
 }
 assert.equal(await p.locator('#screen').evaluate(el=>getComputedStyle(el).paddingBottom),padding);
 assert.equal(await p.locator('#screen').evaluate(el=>el.scrollHeight),height);
 assert.equal(await p.evaluate('scrollMutations.length'),0);assert.equal(await p.evaluate('cardMutations'),0);
 await session.send('Emulation.setCPUThrottlingRate',{rate:1});
 // A partial range sync must not erase older history or a failed metric.
 await p.evaluate(async()=>{
  const end=Date.now(),start=periodWindow('month').start,rows=state.deviceData.steps.slice(-7);
  await onHealthEvent({type:'synced',records:{steps:rows},granted:state.healthInfo.granted,at:end,warnings:[],
   successfulMetricIds:['steps'],failedMetricIds:['heart'],truncatedMetricIds:[],range:{queriedStart:start,queriedEnd:end,requestedDays:30}});
 });
 assert.equal(await p.evaluate('state.deviceData.steps.length'),377);
 assert.equal(await p.evaluate('state.deviceData.heart.length'),800);
 await p.evaluate(async()=>{await onHealthEvent({type:'permissions',granted:state.healthInfo.granted});go('sources')});await p.locator('[data-native=hc-history]').click();
 assert.equal(await p.evaluate("hcCalls.filter(x=>x==='requestHistory').length"),1);
 assert.equal(await p.evaluate('hcCalls.includes(undefined)'),false);
 await p.reload();await p.evaluate(()=>healthCacheReady);
 assert.equal(await p.evaluate('state.deviceData.steps.length'),377);
 assert.equal(await p.evaluate('state.deviceData.heart.length'),800);
 await p.evaluate(async()=>{await onHealthEvent({type:'permissions',granted:['android.permission.health.READ_STEPS']})});
 assert.equal(await p.evaluate('state.deviceData.heart'),undefined);
 await p.reload();await p.evaluate(()=>healthCacheReady);
 assert.equal(await p.evaluate('state.deviceData.heart'),undefined,'Revoked data cannot return from disk');
 // >5MB snapshot round-trip without localStorage quota or loss.
 const large=await p.evaluate(async()=>{
  const ts=Date.now()-60000;
  state.deviceData={weight:Array.from({length:6000},(_,i)=>({ts:ts-i*60000,v:80+i/10000,source:'test',metadata:'x'.repeat(1000)})).reverse()};
  state.healthInfo={granted:['android.permission.health.READ_WEIGHT'],at:Date.now(),warnings:[]};
  const size=JSON.stringify(state.deviceData).length,saved=await persistHealthCache();return {size,saved,legacy:localStorage.getItem('balans2.deviceData')};
 });
 assert.ok(large.size>6e6);assert.equal(large.saved,true);assert.equal(large.legacy,null);
 await p.reload();await p.evaluate(()=>healthCacheReady);assert.equal(await p.evaluate('state.deviceData.weight.length'),6000);
 await p.evaluate(()=>go('export'));
 const snapshot=await p.evaluate(()=>{const data={'balans2.deviceData':state.deviceData};return validateBackup({app:'Баланс',v:1,date:new Date().toISOString(),data})});
 assert.equal(snapshot,true);
 const downloadPromise=p.waitForEvent('download');await p.locator('[data-x=backup]').click();
 const download=await downloadPromise,backupBytes=fs.readFileSync(await download.path());
 assert.equal(JSON.parse(backupBytes.toString()).data['balans2.deviceData'].weight.length,6000);
 await p.evaluate(async()=>{state.deviceData={};await persistHealthCache()});
 await p.locator('#restoreIn').setInputFiles({name:'backup116.json',mimeType:'application/json',buffer:backupBytes});
 await p.locator('#sheet [data-x=confirm]').waitFor();
 await Promise.all([p.waitForEvent('load'),p.locator('#sheet [data-x=confirm]').click()]);
 await p.evaluate(()=>healthCacheReady);assert.equal(await p.evaluate('state.deviceData.weight.length'),6000);
 await p.evaluate(()=>go('privacy'));await p.locator('[data-x=wipeAll]').click();
 await Promise.all([p.waitForEvent('load'),p.locator('#sheet [data-x=confirm]').click()]);
 await p.evaluate(()=>healthCacheReady);assert.equal(await p.evaluate('Object.keys(state.deviceData).length'),0);
 for(const width of [375,412,1280]){
  await p.setViewportSize({width,height:900});await p.evaluate(()=>setTab('dynamics'));
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS116: independent visibility/restore/persistence; all periods and truthful buckets; labelled heat/calendar taps; moved report/filtered diary; invariant scroll layout CPU4x; bounded sync merge; async >6MB cache/reload/revocation/delete; responsive/no JS errors.',JSON.stringify(Object.fromEntries(Object.entries(observed).map(([k,v])=>[k,{records:v.raw,buckets:v.plotted}]))));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
