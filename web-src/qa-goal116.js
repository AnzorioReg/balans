// Actual UI/form regression for progressively available goal/body/food data.
// node qa-goal116.js [--built] (default stages ONLY current plan.js in memory).
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 let html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
 if(!process.argv.includes('--built')){
  const start=html.indexOf('/* ===== Вкладка «Цель»: тело, план, тренировки, скидки, подписка ===== */');
  const end=html.indexOf('/* ===== Главный экран: верхний блок, свернутые карточки, свайпы ===== */',start);
  assert.ok(start>=0&&end>start,'Plan/UI build markers must exist');
  html=html.slice(0,start)+fs.readFileSync(path.join(__dirname,'plan.js'),'utf8')+'\n'+html.slice(end);
 }
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html)});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({channel:'chromium',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);
 await p.evaluate(()=>{
  state.prof={name:'QA',sex:'',height:'',year:'',goals:{steps:10000,sleep:8,water:2000,active:600}};
  state.body=[];state.manual={};state.deviceData={};state.goal={type:'lose',start:null,startD:null};
  state.stack=[];state.page=null;renderAll();setTab('goal');
 });
 let checks=0;
 async function clean(where){
  assert.equal(await p.locator(where).evaluate(el=>/NaN|Infinity|undefined/.test(el.innerHTML)),false,where+' has invalid numeric markup');
  checks++;
 }
 async function body(){
  await p.evaluate(()=>go('gbody'));await p.locator('#v-page svg[aria-label="Силуэт с замерами"]').waitFor();
  await p.locator('#screen').evaluate(el=>el.scrollTop=0);
  await clean('#v-page');
 }
 async function food(){await p.evaluate(()=>go('gfood'));await p.locator('#screen').evaluate(el=>el.scrollTop=0);await clean('#v-page')}
 // Empty, weight-only and profile-only must retain the ORIGINAL silhouette/navigation.
 assert.equal(await p.locator('#v-goal [data-go=gbody] svg[aria-label="Силуэт с замерами"]').count(),1);
 await clean('#v-goal');await body();await food();
 await p.evaluate(()=>{state.deviceData.weight=[{id:'native-weight-only',v:80,ts:Date.now(),source:'Health Connect'}];renderAll();setTab('goal')});
 assert.equal(await p.evaluate('bodyCalc().w'),80);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().prot)'),true);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().bmi)'),false);
 await clean('#v-goal');await body();await food();
 await p.evaluate(()=>{state.deviceData={};renderAll();go('profile')});
 await p.locator('#fProf [name=name]').fill('Проверка цели');
 await p.locator('#fProf [name=year]').fill('1988');
 await p.locator('#fProf [name=height]').fill('178');
 await p.locator('#fProf [data-x=sex][data-a=m]').click();
 await p.locator('#fProf button[type=submit]').click();
 assert.equal(await p.evaluate('bodyCalc().profileReady'),true);
 await p.evaluate(()=>setTab('goal'));await clean('#v-goal');
 await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-goal-profile-only.png')});await body();await food();
 assert.equal(await p.locator('#v-page').getByText('Базовый обмен',{exact:true}).count(),1);
 await p.evaluate(()=>{
  state.deviceData.weight=[{id:'native-real-weight',v:80,ts:Date.now()-1000,source:'Health Connect'}];
  renderAll();setTab('goal');
 });
 assert.equal(await p.evaluate('bodyCalc().bmi'),80/(1.78**2));
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().bmr)'),true);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),false);
 assert.equal(await p.evaluate('bodyCalc().foodReady'),false);
 await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-goal-profile-native-weight.png')});
 await body();await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-body-profile-native-weight.png')});
 await food();assert.ok((await p.locator('#v-page').innerText()).includes('история шагов'));
 await p.evaluate(()=>{
  const ts=Date.now();state.deviceData.steps=[{id:'actual-steps',v:8300,ts,day:localDay(ts),source:'Health Connect'}];
  renderAll();setTab('goal');
 });
 assert.equal(await p.evaluate('bodyCalc().foodReady'),true,'Food must NOT need circumferences');
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),false);
 await food();await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-food-profile-native-weight-steps.png')});
 // Submit partial measurements through the actual form. No autofilled old readings.
 async function measure(values){
  await body();await p.locator('#v-page [data-y=measure]').first().click();
  await p.locator('#fMeas').waitFor();
  for(const field of ['w','neck','chest','biceps','waist','hip','thigh']){
   assert.equal(await p.locator(`#fMeas [name=${field}]`).inputValue(),'','Old reading must be placeholder only');
   assert.equal(await p.locator(`#fMeas [name=${field}]`).getAttribute('required'),null);
  }
  for(const [key,value] of Object.entries(values))await p.locator(`#fMeas [name=${key}]`).fill(String(value));
  await p.locator('#fMeas button[type=submit]').click();
  await p.locator('#sheet.on').waitFor({state:'hidden'});
  await p.waitForTimeout(310);
 }
 const yesterday=await p.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return localDay(d.getTime())});
 const today=await p.evaluate('localDay()');
 await measure({d:yesterday,waist:94});
 assert.equal(await p.evaluate('recs(byId.weight).length'),1,'Circumference must not create weight');
 assert.equal(await p.evaluate('state.body[0].w===undefined'),true);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),false);
 await measure({neck:'40,0'});
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),true,'Only required male girths needed');
 assert.equal(await p.evaluate('bodyCalc().B.dates.waist'),yesterday);
 assert.equal(await p.evaluate('bodyCalc().B.dates.neck'),today);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().B.chest)'),false);
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().target)'),true);
 await body();
 assert.ok((await p.locator('[data-measure-value=waist]').innerText()).includes(await p.evaluate(day=>planDate(day),yesterday)));
 await p.locator('[data-y=sil][data-a=slim]').click();
 assert.equal(await p.evaluate('state.sil'),'slim');
 await p.locator('#screen').evaluate(el=>el.scrollTop=0);
 await p.waitForTimeout(350);await p.screenshot({path:path.join(__dirname,'ui116-body-partial-actual-girths.png')});
 await p.evaluate(()=>{state.prof.sex='f';saveP();renderAll();go('gbody')});
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),false,'Female needs hip, but not all six girths');
 await measure({hip:102});
 assert.equal(await p.evaluate('Number.isFinite(bodyCalc().fat)'),true);
 await measure({w:'79,5'});
 assert.equal(await p.evaluate('bodyCalc().w'),79.5);
 assert.equal(await p.evaluate('recs(byId.weight).length'),2);
 const weightId=await p.evaluate('recs(byId.weight).at(-1).id');
 assert.ok(weightId.startsWith('measure-'));
 await p.evaluate(()=>setTab('goal'));
 await p.locator('#gNum').fill('75');
 await p.locator('#gNum').press('Tab');
 assert.equal(await p.evaluate('state.goal.target'),75);
 await clean('#v-goal');
 // A later native weight must not be masked by merely updating another field today.
 await p.evaluate(()=>{
  state.deviceData.weight.push({id:'later-native-weight',v:78.8,ts:Date.now(),source:'Health Connect'});
  LS.set('balans2.deviceData',state.deviceData);renderAll();
 });
 await measure({chest:98});
 assert.equal(await p.evaluate('bodyCalc().w'),78.8,'Old same-day weight field must keep its original timestamp');
 assert.equal(await p.evaluate('recs(byId.weight).length'),3);
 assert.equal(await p.evaluate('bodyCalc().B.dates.waist'),yesterday);
 await p.reload();
 assert.equal(await p.evaluate('bodyCalc().w'),78.8);
 assert.equal(await p.evaluate('bodyCalc().B.dates.waist'),yesterday);
 assert.equal(await p.evaluate('state.sil'),'slim');
 assert.ok(await p.evaluate(id=>recs(byId.weight).some(r=>r.id===id),weightId));
 await body();await p.locator('#v-page [data-y=measure]').first().click();
 const count=await p.evaluate('state.body.length');
 await p.locator('#fMeas button[type=submit]').click();
 assert.ok((await p.locator('#measError').innerText()).includes('хотя бы одно'));
 await p.locator('#fMeas [name=waist]').fill('999');
 await p.locator('#fMeas button[type=submit]').click();
 assert.equal(await p.evaluate('state.body.length'),count);
 await p.locator('#sheet [data-close]').click();await p.waitForTimeout(310);
 // Native composition/BMR is usable independently of the profile or girths.
 await p.evaluate(()=>{
  const ts=Date.now();state.prof.sex='';state.prof.height='';state.prof.year='';state.body=[];state.manual={};state.deviceData={
   weight:[{v:75,ts}],bodyFat:[{v:21,ts}],leanMass:[{v:59.25,ts}],bmr:[{v:1700,ts}],steps:[{v:8000,ts,day:localDay()}]};
  renderAll();setTab('goal');
 });
 assert.equal(await p.evaluate('bodyCalc().fat'),21);
 assert.equal(await p.evaluate('bodyCalc().lean'),59.25);
 assert.equal(await p.evaluate('bodyCalc().bmr'),1700);
 assert.equal(await p.evaluate('bodyCalc().foodReady'),true);
 await clean('#v-goal');await body();await food();
 const matrix=await p.evaluate(()=>{
  let cases=0;
  for(const type of ['lose','mass','relief','keep'])for(const mode of ['empty','profile','weight','partial','full','nativeComposition']){
   const ts=Date.now(),d=localDay();
   state.prof.sex=mode==='empty'||mode==='weight'?'':'m';
   state.prof.height=mode==='empty'||mode==='weight'?'':178;
   state.prof.year=mode==='empty'||mode==='weight'?'':'1988';
   state.goal={type,start:null,startD:null};state.manual={};state.body=[];state.deviceData={};
   if(['weight','partial','full','nativeComposition'].includes(mode))state.deviceData.weight=[{v:80,ts}];
   if(['partial','full'].includes(mode))state.body=[{d,ts,waist:94,neck:40}];
   if(mode==='full')state.deviceData.steps=[{v:8000,ts,day:d}];
   if(mode==='nativeComposition')Object.assign(state.deviceData,{bodyFat:[{v:21,ts}],leanMass:[{v:63.2,ts}],bmr:[{v:1720,ts}]});
   renderGoal();
   const pages=[$('#v-goal').innerHTML,MPAGES.gbody.r(),MPAGES.gfood.r()];
   for(const content of pages){
    if(/NaN|Infinity|undefined/.test(content))throw Error(`${type}/${mode}: invalid markup`);
    const doc=new DOMParser().parseFromString(content,'text/html');
    for(const svg of doc.querySelectorAll('svg'))if(/NaN|Infinity|undefined/.test(svg.outerHTML))throw Error('Invalid SVG');
    cases++;
   }
  }
  for(const weight of [5,500]){
   state.deviceData={weight:[{v:weight,ts:Date.now()}]};state.body=[];state.goal={type:'lose',start:null,startD:null};
   renderGoal();const range=$('#gRange');
   if(!range||Number(range.max)<Number(range.min))throw Error('Inverted goal range at '+weight);
  }
  return cases;
 });
 assert.equal(matrix,72);
 for(const width of [320,375,412]){
  await p.setViewportSize({width,height:844});
  for(const page of ['goal','gbody','gfood']){
   await p.evaluate(page=>go(page),page);
   await clean(page==='goal'?'#v-goal':'#v-page');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${page}/${width} overflow`);
  }
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,checks,matrixPages:matrix,scenarios:['empty','weight only','actual profile form','profile + native weight','steps without girths','partial male/female girths','mixed field dates','actual weight entry','target input','newer native weight','reload persistence','invalid partial form','native composition/BMR without profile'],screenshots:['ui116-goal-profile-only.png','ui116-goal-profile-native-weight.png','ui116-body-profile-native-weight.png','ui116-food-profile-native-weight-steps.png','ui116-body-partial-actual-girths.png'],errors},null,2));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
