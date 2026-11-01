// Isolated browser fixture, never app demo data. Uses original app and real UI clicks.
// python3 build.py && node qa-metric-designs114.js
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await p.evaluate(()=>{
  state.deviceData={};state.manual={};state.fold=[];state.layout='grid3';state.chartSet='aurora';
  const fractions=[.91,1.03,.96,1.06,.98,1.01,1];
  for(const m of M)state.deviceData[m.id]=fractions.map((f,i)=>{
   const ts=Date.now()-(6-i)*86400000,day=localDay(ts);
   return {id:`qa-source-${m.id}-${i}`,ts,d:day,v:Number(m.base)*f,...(m.id==='bp'?{lo:78+i}:{}),...(DAILY_METRICS.has(m.id)?{day}:{}),source:'Test native-record fixture'};
  });
  LS.set('balans2.deviceData',state.deviceData);LS.set('balans2.manual',{});LS.set('balans2.fold',[]);LS.set('balans2.layout','grid3');renderAll();
 });
 await p.waitForTimeout(350);
 assert.equal(await p.evaluate('typeof metricDesignVisual'),'function');
 // Actual first six cards must open the unique FULL diagram, not only a micro design.
 for(const id of ['steps','distance','activeCalories','totalCalories','exercise','floors']){
  await p.locator(`#groups [data-metric="${id}"]`).click();
  await p.locator('#sheet.on #dchart svg.metric-design').waitFor();await p.waitForTimeout(330);
  assert.equal(await p.locator('#dchart svg.metric-design').getAttribute('data-design'),await p.evaluate(id=>METRIC_DESIGN_IDS[id],id));
  assert.equal(await p.locator('#dchart [data-secondary-history=actual]').count(),1);
  await p.locator('#sheet').screenshot({path:path.join(__dirname,`ui114-full-${id}.png`)});
  await p.locator('#sheet [data-close]').click();await p.waitForTimeout(330);
 }
 await collage(true,'ui114-metrics-first6.png');
 await collage(false,'ui114-metrics-all32.png');
 await collage(['resp','boneMass','restingHeart'],'ui114-axis-strokes.png');
 const checks=await p.evaluate(()=>{
  let count=0;const missing=[];
  for(const variant of ['signature','aurora','capsule','points'])for(const m of M)for(const mini of [true,false]){
   for(const mode of ['normal','zero','one','empty']){
    const rows=mode==='normal'?recs(m):mode==='zero'?[{v:0,ts:Date.now(),d:localDay(),day:localDay()}]:mode==='one'?[recs(m).at(-1)]:[];
    const svg=metricDesignVisual(m,mini?120:340,mini?44:170,rows,mini,variant);
    if(/NaN|Infinity|undefined/.test(svg))throw Error(`${m.id}/${variant}/${mini}/${mode}: invalid SVG`);
    const parsed=new DOMParser().parseFromString(svg,'image/svg+xml');
    if(parsed.querySelector('parsererror'))throw Error(`${m.id}: malformed SVG`);
    if(parsed.querySelector('linearGradient').getAttribute('gradientUnits')!=='userSpaceOnUse')throw Error('Axis-aligned strokes require userSpaceOnUse gradients');
    for(const u of parsed.querySelectorAll('use'))if(!document.getElementById(u.getAttribute('href').slice(1)))missing.push(u.getAttribute('href'));
    if(parsed.documentElement.getAttribute('data-design')!==METRIC_DESIGN_IDS[m.id])throw Error('Wrong design');
    if(mode==='empty'&&parsed.documentElement.getAttribute('data-empty')!=='true')throw Error('No-data artwork missing');
    count++;
   }
  }
  // Small sleep phases must not collapse to zero-height lanes; full uses actual phases.
  const ts=Date.now(),night={v:7.75,ts,stages:[{start:ts-7.75*3600000,end:ts-6*3600000,kind:'deep'},{start:ts-6*3600000,end:ts,kind:'light'}]};
  const small=metricDesignVisual(byId.sleep,120,32,[night],true),large=metricDesignVisual(byId.sleep,340,170,[night],false);
  if(small.includes('height="0"'))throw Error('Collapsed sleep stages');
  if(!large.includes('#745bff'))throw Error('Actual deep phase missing');
  // No diastolic may be invented when only systolic exists.
  const bp=metricDesignVisual(byId.bp,340,170,[{v:123,ts}],false);
  if(/123\/\d/.test(bp))throw Error('Invented diastolic');
  // Kg body water must never use a /100 percent ring.
  const bw=metricDesignVisual(byId.bodyWater,340,170,[{v:42.1,ts}],false);
  if(bw.includes('0–100%'))throw Error('Body water percentage fabricated');
  return {count,missing,designs:Object.values(METRIC_DESIGN_IDS)};
 });
 assert.equal(checks.count,1024);assert.deepEqual(checks.missing,[]);assert.equal(new Set(checks.designs).size,32);
 // All four global styles are selected by real clicks. Designs must survive every variant.
 for(const variant of ['signature','aurora','capsule','points']){
  await p.getByRole('button',{name:'Настроить верхний блок',exact:true}).click();
  await p.locator('[data-dashboard=appearance]').click();
  await p.locator(`[data-visual-set="${variant}"]`).click();
  assert.equal(await p.evaluate('state.chartSet'),variant);
  assert.ok(await p.evaluate(()=>M.every(m=>renderRealVisual(m,120,44,recs(m),true).includes(state.chartSet==='signature'?'original-author':`data-design="${METRIC_DESIGN_IDS[m.id]}"`))));
  await p.mouse.move(60,300);await p.mouse.wheel(0,-240);await p.waitForTimeout(300);
  await p.locator('[data-tab=overview]').click();
 }
 // Browser collage of the actual renderer, for geometry review at native SVG dimensions.
 async function collage(firstOnly,file){
  await p.evaluate(firstOnly=>{
   document.querySelector('#metricQACollage')?.remove();
   const host=document.createElement('section');host.id='metricQACollage';host.style.cssText=`position:absolute;left:0;top:0;z-index:9999;width:${firstOnly?790:1130}px;background:var(--bg);padding:18px;display:grid;grid-template-columns:repeat(${firstOnly?2:3},minmax(0,1fr));gap:14px;color:var(--text)`;
   const shown=Array.isArray(firstOnly)?firstOnly.map(id=>byId[id]):firstOnly?M.slice(0,6):M;
   host.innerHTML=shown.map(m=>`<article style="background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px;overflow:hidden"><h3 style="font:650 16px system-ui;margin:0 0 10px">${esc(m.name)} <small style="color:var(--muted)">${esc(m.unit)}</small></h3><div style="height:44px;width:120px;margin:0 0 10px">${metricDesignVisual(m,120,44,recs(m),true,'signature')}</div><div style="height:170px;width:340px;max-width:100%">${metricDesignVisual(m,340,170,recs(m),false,'signature')}</div></article>`).join('');
   document.body.appendChild(host);
  },firstOnly);
  await p.locator('#metricQACollage').screenshot({path:path.join(__dirname,file)});
  await p.evaluate(()=>document.querySelector('#metricQACollage').remove());
 }
 assert.deepEqual(errors,[]);
 console.log(`PASS32 distinct mini+full designs;${checks.count} SVG normal/zero/one/empty+4variants valid;source sleep phases/BP missinglo/kg bodywater safe;all4 styles real-clicked;first6 real card dialogs;no missing symbols/errors.`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
