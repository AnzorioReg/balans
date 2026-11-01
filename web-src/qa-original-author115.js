// Source-vs-restored author-design comparison. Fixtures live ONLY in this test.
// Run after python3 build.py: node qa-original-author115.js
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({channel:'chromium',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await p.evaluate(()=>{
  state.deviceData={};state.manual={};state.fold=[];state.chartSet='signature';
  const fractions=[.91,1.03,.96,1.06,.98,1.01,1];
  for(const m of M)state.deviceData[m.id]=fractions.map((f,i)=>{
   const ts=Date.now()-(6-i)*86400000,day=localDay(ts);
   return {id:`isolated-original-${m.id}-${i}`,ts,d:day,v:Number(m.base)*f,source:'Isolated QA fixture',
    ...(m.id==='bp'?{lo:78+i}:{}),...(DAILY_METRICS.has(m.id)?{day}:{})};
  });
  renderAll();setTab('overview');
 });
 const checks=await p.evaluate(()=>{
  let cases=0;
  for(const m of M)for(const mini of [true,false])for(const mode of ['empty','zero','one','many']){
   const rows=mode==='empty'?[]:mode==='zero'?[{v:0,ts:Date.now(),day:localDay()}]:mode==='one'?[recs(m).at(-1)]:recs(m);
   const source=originalAuthorVisual(m,mini?120:340,mini?44:170,rows,mini);
   if(/NaN|Infinity|undefined/.test(source))throw Error(`${m.id}/${mini}/${mode}: invalid SVG`);
   const doc=new DOMParser().parseFromString(source,'image/svg+xml');
   if(doc.querySelector('parsererror'))throw Error(`${m.id}: malformed SVG`);
   if(doc.documentElement.getAttribute('data-design')!=='original-'+m.id)throw Error('Not original author design');
   if(doc.querySelector('.metric-design,[data-secondary-history]'))throw Error('MD fallback not allowed');
   for(const e of doc.querySelectorAll('[width],[height],[r],[rx]'))for(const a of ['width','height','r','rx']){
    if(e.hasAttribute(a)&&Number(e.getAttribute(a))<0)throw Error(`Negative dimension ${m.id}`);
   }
   cases++;
  }
  const make=(id,rows,mini=false)=>new DOMParser().parseFromString(originalAuthorVisual(byId[id],340,170,rows,mini),'image/svg+xml');
  const ts=Date.now(),record={v:123,ts};
  // One systolic-only record is a point, never a synthesized lower endpoint.
  if(make('bp',[record]).querySelector('rect'))throw Error('Invented diastolic range');
  if(!make('bp',[{...record,lo:77}]).querySelector('rect'))throw Error('Actual diastolic ignored');
  const phases=[{kind:'deep',start:ts-7*3600000,end:ts-5*3600000},{kind:'light',start:ts-5*3600000,end:ts}];
  const actual=make('sleep',[{v:7,ts,stages:phases}]);
  if(actual.querySelectorAll('rect').length!==2)throw Error('Actual sleep-stage count not retained');
  if(!actual.documentElement.outerHTML.includes('#4c3df0'))throw Error('Original sleep palette lost');
  const noPhases=make('sleep',[{v:7,ts}]);
  if(noPhases.querySelectorAll('rect').length!==1)throw Error('Invented sleep phases');
  const hrv=make('hrv',recs(byId.hrv),true);
  if(hrv.querySelectorAll('rect').length!==7)throw Error('Synthetic HRV amplitudes');
  const heart=make('heart',recs(byId.heart),true);
  if(heart.querySelector('.ecg'))throw Error('Synthetic ECG');
  const energy=make('nutrition',recs(byId.nutrition));
  if(/Белки|Углеводы|Жиры/.test(energy.documentElement.textContent))throw Error('Invented macro split');
  const stale=originalAuthorVisual(byId.activeCalories,120,56,[{v:500,day:'2001-01-01',ts}],true);
  if(/stroke-dasharray=/.test(stale))throw Error('Yesterday counted as today');
  // Original callback counts must sample the WHOLE real period, not its oldest half.
  const dense=Array.from({length:31},(_,i)=>({v:i===30?1000:0,ts:ts-(30-i)*86400000}));
  for(const id of ['totalCalories','floors','elevation','nutrition','mindfulness','bmr','bodyFat','leanMass','boneMass']){
   const doc=make(id,dense,true);
   if(!doc.documentElement.textContent.includes('1 000')&&!doc.documentElement.textContent.includes('1000')){
    throw Error('Latest dense observation omitted: '+id);
   }
  }
  for(const id of ['speed','bodyWater','skinTemperature']){
   const doc=new DOMParser().parseFromString(originalAuthorVisual(byId[id],120,44,dense,true),'image/svg+xml');
   if(Number(doc.querySelector('circle').getAttribute('cy'))!==8)throw Error('Newest line sample omitted: '+id);
  }
  return {cases,designs:M.map(m=>m.id),demo:demoOn()};
 });
 assert.equal(checks.cases,256);assert.equal(checks.demo,false);
 // A separate JS realm runs the UNCHANGED legacy files for visual reference.
 const bundle=await p.evaluate(()=>{
  const functions={};
  for(const name of ['fmt','avg','cv','rng','scale','axes','path','chartBar','chartLine']){
   functions[name]=eval(name).toString();
  }
  return {functions,M,CATS,GOAL,records:state.deviceData,
   variables:Object.fromEntries(['--bg','--surface','--surface3','--text','--muted','--faint','--line',...Object.values(CATS).map(c=>c.c)]
    .map(name=>[name,getComputedStyle(document.documentElement).getPropertyValue(name)]))};
 });
 const ref=await context.newPage();ref.on('pageerror',e=>errors.push('Reference: '+e.message));
 await ref.setContent('<html><head></head><body></body></html>');
 const bootstrap=`
  const M=${JSON.stringify(bundle.M)},CATS=${JSON.stringify(bundle.CATS)},GOAL=${JSON.stringify(bundle.GOAL)};
  const RECORDS=${JSON.stringify(bundle.records)},W=340,H=170,PL=34,PR=8,PT=10,PB=24;let sparkN=0;
  ${Object.entries(bundle.functions).map(([name,code])=>`const ${name}=${code};`).join('\n')}
  const recs=m=>RECORDS[m.id],series=m=>recs(m).map(r=>r.v),cur=m=>recs(m).at(-1).v;
  const hasHistory=m=>true,demoOn=()=>true;
  const labels=()=>RECORDS.steps.map(r=>new Date(r.ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit'}));
  const svg=b=>'<svg viewBox="0 0 340 170">'+b+'</svg>';
  const drawChart=(m,period)=>{const v=series(m),lb=labels();return{svg:(m.chart==='bar'?chartBar:chartLine)(m,v,null,lb),v}};
 `;
 await ref.addScriptTag({content:bootstrap+'\n'+fs.readFileSync(path.join(__dirname,'viz.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'viz2.js'),'utf8')});
 const legacy=await ref.evaluate(()=>Object.fromEntries(M.map(m=>[m.id,{mini:vizMini(m,180,64),big:vizBig(m,'week').svg}])));
 const restored=await p.evaluate(()=>Object.fromEntries(M.map(m=>[m.id,{mini:originalAuthorVisual(m,180,64,recs(m),true),big:originalAuthorVisual(m,340,170,recs(m),false)}])));
 const cssVariables=Object.entries(bundle.variables).map(([n,v])=>`${n}:${v};`).join('');
 const art=await context.newPage();
 await art.setViewportSize({width:1530,height:1120});
 await art.setContent(`<html><head><style>
  :root{${cssVariables}}*{box-sizing:border-box}body{margin:0;padding:18px;background:var(--bg);color:var(--text);font:13px system-ui}
  h1{font-size:22px;margin:0 0 5px}p{color:var(--muted);margin:0 0 16px;font-size:12px}
  #comparison{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
  article{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:14px}
  h2{font-size:16px;margin:0 0 8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .label{font-size:11px;color:var(--muted);margin-bottom:8px}
  .mini{height:64px;width:180px;margin:0 0 9px}.big{height:170px;width:340px}
  svg{width:100%;height:100%;display:block}
 </style></head><body><h1>Исходные авторские графики и восстановленная версия 1.15</h1>
 <p>Одинаковые изолированные тестовые записи. Слева неизменённые viz.js/viz2.js; справа реальные записи без выдуманных ЭКГ, фаз, норм и макросов.</p><main id="comparison"></main></body></html>`);
 const groups=[
  ['steps','distance','activeCalories','exercise','heart','restingHeart'],
  ['bp','spo2','hrv','weight','sleep','water'],
  bundle.M.slice(0,6).map(m=>m.id),
  bundle.M.slice(6,12).map(m=>m.id)
 ];
 const files=['ui115-original-compare-core-a.png','ui115-original-compare-core-b.png','ui115-original-compare-first6.png','ui115-original-compare-next6.png'];
 for(let k=0;k<groups.length;k++){
  await art.evaluate(({ids,M,legacy,restored})=>{
   // Prefix only IDs, not reference geometry: legacy viz2 reused gradient IDs.
   const scoped=(svg,prefix)=>svg.replace(/\bid="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`);
   document.querySelector('#comparison').innerHTML=ids.map(id=>{
    const m=M.find(m=>m.id===id);
    return `<article><h2>${m.name} · ${m.unit}</h2><div class="pair">${[['Исходный код',legacy[id],'old'],['Восстановлено',restored[id],'restored']].map(([label,svgs,prefix])=>`<div><div class="label">${label}</div><div class="mini">${scoped(svgs.mini,prefix+id+'mini')}</div><div class="big">${scoped(svgs.big,prefix+id+'big')}</div></div>`).join('')}</div></article>`;
   }).join('');
  },{ids:groups[k],M:bundle.M,legacy,restored});
  await art.screenshot({path:path.join(__dirname,files[k]),fullPage:true});
 }
 // Real short taps exercise the full renderer, not direct-only API tests.
 for(const id of [...groups[0],...groups[1]]){
  await p.locator(`#groups [data-metric="${id}"]`).click();
  await p.locator('#sheet.on #dchart svg.original-author').waitFor();
  assert.equal(await p.locator('#dchart svg.original-author').getAttribute('data-design'),'original-'+id);
  await p.locator('#sheet [data-close]').click();await p.waitForTimeout(310);
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,cases:checks.cases,actualCardTaps:12,unchangedReferenceFiles:['viz.js','viz2.js'],screenshots:files,errors},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
