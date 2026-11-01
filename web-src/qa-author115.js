// Isolated regression fixtures. No generated records are shipped in the app.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 const context=await browser.newContext({viewport:{width:375,height:812}});
 await context.addInitScript(()=>{
  if(!localStorage.getItem('qa115-seeded')){
   const ts=Date.now(),d=new Date(ts).toLocaleDateString('en-CA');
   localStorage.setItem('balans2.chartSet',JSON.stringify('points'));
   localStorage.setItem('balans2.manual',JSON.stringify({steps:[{id:'retained-measurement-115',v:4321,ts,d}]}));
   localStorage.setItem('qa115-seeded','true');
  }
 });
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 assert.equal(await p.title(),'Баланс · версия 1.15');
 assert.equal(await p.evaluate('state.chartSet'),'signature');
 assert.equal(await p.evaluate('LS.get("balans2.originalAuthorDesign")'),1);
 assert.equal(await p.evaluate('state.manual.steps[0].v'),4321);
 assert.equal(await p.evaluate('demoOn()'),false);
 assert.equal(await p.evaluate('typeof originalAuthorVisual'),'function');
 await p.evaluate(()=>go('themes'));
 await p.locator('[data-visual-set=points]').click();
 await p.reload();await p.evaluate(()=>go('themes'));
 assert.equal(await p.evaluate('state.chartSet'),'points','Once-only migration must not override later choices');
 assert.equal(await p.locator('[data-visual-set=points]').getAttribute('aria-pressed'),'true');
 assert.equal(await p.evaluate('state.manual.steps[0].id'),'retained-measurement-115');
 await p.locator('[data-visual-set=signature]').click();
 await p.evaluate(()=>{
  state.manual={};state.deviceData={};state.fold=[];state.layout='grid3';
  window.authorFixture=(m,n)=>Array.from({length:n},(_,i)=>{
   const ts=Date.now()-(n-i-1)*86400000,day=localDay(ts);
   return {id:`measurement-${m.id}-${i}`,ts,d:day,v:Number(m.base)*(0.9+(i%7)*0.025),
    ...(m.id==='bp'?{lo:75+i%8}:{}),...(DAILY_METRICS.has(m.id)?{day}:{}),source:'isolated-test'};
  });
  for(const m of M)state.deviceData[m.id]=authorFixture(m,7);
  renderAll();setTab('overview');
 });
 const result=await p.evaluate(()=>{
  let cases=0;
  for(const m of M)for(const n of [0,1,7,100])for(const [w,h,mini] of [[78,24,true],[120,44,true],[172,68,true],[340,170,false]]){
   const svg=renderRealVisual(m,w,h,authorFixture(m,n),mini,'signature');
   if(!svg.includes('original-author'))throw Error(`Not restored: ${m.id}`);
   if(/NaN|Infinity|undefined/.test(svg))throw Error(`Invalid number ${m.id}/${n}/${w}`);
   const doc=new DOMParser().parseFromString(svg,'image/svg+xml');
   if(doc.querySelector('parsererror'))throw Error(`Malformed SVG ${m.id}`);
   for(const el of doc.querySelectorAll('[width],[height],[r],[rx],[ry]'))for(const a of ['width','height','r','rx','ry']){
    const value=el.getAttribute(a);if(value!==null&&Number(value)<0)throw Error(`Negative ${a}: ${m.id}/${n}/${w}`);
   }
   cases++;
  }
  return {cases,manual:state.manual,demo:demoOn()};
 });
 assert.equal(result.cases,512);assert.equal(result.demo,false);
 // Actual card taps and periods must dispatch to the restored FULL renderer.
 for(const id of ['steps','distance','activeCalories','exercise','heart','bp','spo2','weight','water']){
  await p.locator(`#groups [data-metric="${id}"]`).click();
  await p.locator('#sheet.on #dchart svg.original-author').waitFor();
  assert.ok(await p.locator('#sheet.on #dchart').evaluate(el=>!(/NaN|Infinity|undefined/.test(el.innerHTML))));
  await p.locator('#sheet [data-close]').click();await p.waitForTimeout(310);
 }
 await p.evaluate(()=>{state.fold=['water','heart'];renderAll()});
 for(const layout of ['list','tiles','grid3']){
  await p.evaluate(layout=>{state.layout=layout;renderAll()},layout);
  assert.ok(await p.locator('#groups svg.original-author').count()>0);
  assert.equal(await p.locator('#groups svg.metric-design').count(),0);
 }
 for(const width of [320,375,412,1280]){
  await p.setViewportSize({width,height:900});
  for(const mode of ['light','dark']){
   await p.evaluate(mode=>{state.theme=mode;applyTheme()},mode);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}/${mode} document overflow`);
  }
  if(width===375||width===1280){
   await p.evaluate(()=>{state.fold=[];state.layout='grid3';renderAll();document.querySelector('#screen').scrollTop=0});
   await p.waitForTimeout(350);
   await p.screenshot({path:path.join(__dirname,width===375?'author115-mobile.png':'author115-desktop.png')});
  }
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,cases:result.cases,restoredCardTaps:9,migration:'one-time, real records retained',layouts:3,viewports:4,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
