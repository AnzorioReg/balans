const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'chromium',headless:true});
 const c=await b.newContext({viewport:{width:390,height:844}});
 const p=await c.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+__dirname+'/index.html');
 await p.evaluate(()=>{
  state.deviceData={};state.manual={};state.fold=[];state.top.items=['steps','exercise','activeCalories','water'];
  for(const m of M)state.deviceData[m.id]=Array.from({length:7},(_,i)=>{
   const ts=Date.now()-(6-i)*86400000,day=localDay(ts);
   return {id:`actual-${m.id}-${i}`,ts,d:day,v:(Number(m.base)||20)*(1+i*.015),
    ...(m.id==='bp'?{lo:80+i}:{}),...(DAILY_METRICS.has(m.id)?{day}:{}),source:'fixture.real'};
  });
  LS.set('balans2.deviceData',state.deviceData);LS.set('balans2.manual',{});
  renderAll();go('themes');
 });
 let previous='';
 for(const id of ['signature','aurora','capsule','points']){
  await p.locator(`[data-visual-set="${id}"]`).click();
  assert.equal(await p.locator(`[data-visual-set="${id}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[data-visual-set].on').count(),1);
  assert.equal(await p.locator('[data-visual-set].on').getAttribute('data-visual-set'),id);
  const svg=await p.evaluate(()=>vizMini(byId.water,120,44).replace(/actual\d+|signature\d+/g,'id'));
  assert.notEqual(svg,previous);previous=svg;
  assert.equal(await p.evaluate('LS.get("balans2.chartSet")'),id);
 }
 for(const id of ['classic','outline','soft','duo']){
  await p.locator(`button[data-icon-set="${id}"]`).click();
  assert.equal(await p.locator(`button[data-icon-set="${id}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await p.locator('[data-icon-set].on').count(),1);
  assert.ok(await p.evaluate(id=>[...document.querySelectorAll('#groups .ic use')].every(u=>u.getAttribute('href').startsWith('#health-'+id+'-')),id));
  assert.equal(await p.evaluate('LS.get("balans2.iconSet")'),id);
 }
 await p.reload();await p.evaluate(()=>go('themes'));
 assert.equal(await p.locator('[data-icon-set].on').getAttribute('data-icon-set'),'duo');
 assert.equal(await p.locator('[data-visual-set].on').getAttribute('data-visual-set'),'points');
 await p.locator('[data-visual-set=signature]').click();
 await p.locator('button[data-icon-set=classic]').click();
 await p.screenshot({path:__dirname+'/qa114-choices.png'});
 await p.evaluate(()=>setTab('overview'));
 await p.waitForTimeout(400);
 await p.screenshot({path:__dirname+'/qa114-overview.png'});
 const designs=await p.evaluate(()=>Object.fromEntries(M.map(m=>[m.id,renderRealVisual(m,120,44,recs(m),true).match(/data-design="([^"]+)"/)?.[1]])));
 assert.equal(new Set(Object.values(designs)).size,32);
 assert.equal(await p.locator('#v-overview').getByText('Показываются только показатели').count(),0);
 const semanticCount=await p.evaluate(()=>new Set(M.map(m=>mic(m))).size);
 assert.ok(semanticCount>=29);
 // Exact screenshot name, plus an extreme name, in saved and discovered lists.
 await p.evaluate(()=>{
  state.savedDevices=[{address:'00:5F:BF:A5:21:E2',name:'BLESmart_00000244005FBFA521E2',supportedProfiles:['weight']}];
  bleState.devices={'00:5F:BF:A5:21:E2':{address:'00:5F:BF:A5:21:E2',name:'BLESmart_00000244005FBFA521E2',rssi:-60},
  '01:02:03:04:05:06':{address:'01:02:03:04:05:06',name:'ОченьДлинноеИмяПрибораБезПробелов'.repeat(7),rssi:-45}};
  go('sources');renderSrcList();
 });
 let cases=0;
 for(const width of [320,360,375,412]){
  await p.setViewportSize({width,height:915});
  for(const scale of [1,1.3,1.6,2]){
   await p.evaluate(scale=>{
    document.getElementById('textScaleFixture')?.remove();
    if(scale!==1){
     const style=document.createElement('style');style.id='textScaleFixture';
     style.textContent=`.ble-card{font-size:${15*scale}px}.ble-card .t>b{font-size:${14*scale}px}.ble-card .t>small,.ble-card .foot,.ble-card .frow small{font-size:${12*scale}px}.ble-card .btn{font-size:${13*scale}px}`;
     document.head.append(style);
    }
   },scale);
   const overflow=await p.locator('.ble-device-row').evaluateAll(rows=>rows.flatMap(row=>{
    const r=row.getBoundingClientRect();
    return [...row.children].map(el=>{const q=el.getBoundingClientRect();return {text:el.textContent,left:q.left,right:q.right,rowLeft:r.left,rowRight:r.right,width:innerWidth}})
    .filter(q=>q.left<q.rowLeft-1||q.right>q.rowRight+1||q.left<0||q.right>q.width+1);
   }));
   assert.deepEqual(overflow,[],`BLE overflow at ${width}/${scale}`);
   assert.equal(await p.locator('#bleAuto').evaluate(e=>e.getBoundingClientRect().width),22);
   cases++;
  }
 }
 await p.evaluate(()=>document.getElementById('textScaleFixture')?.remove());
 await p.setViewportSize({width:375,height:812});
 await p.locator('.ble-card').screenshot({path:__dirname+'/qa114-bluetooth.png'});
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,actualSelectionClicks:8,designs:32,semanticGlyphs:semanticCount,overflowCases:cases,errors},null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
