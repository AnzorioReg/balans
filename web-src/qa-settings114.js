const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true,channel:'chromium'});
 const p=await b.newPage({viewport:{width:375,height:812}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('file://'+__dirname+'/index.html');
 await p.getByRole('button',{name:'Ещё',exact:true}).click();
 await p.locator('[data-go=themes]').click();
 for(const mode of ['dark','light']){
  await p.locator(`[data-theme-set=${mode}]`).click();
  assert.equal(await p.locator('[data-theme-set].on').getAttribute('data-theme-set'),mode);
  const choices=await p.locator(`#pal${mode==='dark'?'Dark':'Light'} [data-pal-set]`).evaluateAll(es=>es.map(e=>e.dataset.palSet));
  for(const choice of choices){
   await p.locator(`[data-pal-set="${choice}"]`).click();
   assert.equal(await p.locator('[data-pal-set].on').getAttribute('data-pal-set'),choice);
   assert.equal(await p.locator('html').getAttribute('data-pal'),choice.split(':')[1]);
  }
 }
 for(const layout of ['list','tiles','grid3']){
  await p.locator(`#layPick [data-lay=${layout}]`).click();
  assert.equal(await p.locator('#layPick .on').getAttribute('data-lay'),layout);
  assert.equal(await p.evaluate('state.layout'),layout);
 }
 for(const shape of ['heart','tracks','orbit','bloom','diamond','infinity','hex','sun']){
  await p.locator(`#topPick [data-topset=${shape}]`).click();
  assert.equal(await p.locator('#topPick .on').getAttribute('data-topset'),shape);
  assert.equal(await p.evaluate('state.top.style'),shape);
 }
 await p.locator('#topPick [data-topvisibility=showFigure]').click();
 await p.locator('#topPick [data-topvisibility=showMetrics]').click();
 assert.deepEqual(await p.evaluate('[state.top.showFigure,state.top.showMetrics]'),[false,false]);
 for(const key of ['contrast','brightness']){
  for(const value of [0,25,50,75,100]){
   await p.locator('#'+key+'Range').fill(String(value));
   assert.equal(await p.evaluate(key=>state[key],key),value);
   assert.match(await p.locator('#'+key+'Value').innerText(),new RegExp(value+'%'));
  }
  await p.locator(`[data-dashboard=appearance-step][data-key=${key}][data-value="-5"]`).click();
  assert.equal(await p.evaluate(key=>state[key],key),95);
 }
 await p.locator('[data-dashboard=appearance-reset]').click();
 assert.deepEqual(await p.evaluate('[state.contrast,state.brightness]'),[50,50]);
 const before=await p.evaluate('state.anim');
 await p.locator('#animSw').click();assert.notEqual(await p.evaluate('state.anim'),before);
 const switched=await p.evaluate('state.anim');
 await p.reload();await p.evaluate(()=>go('themes'));
 assert.equal(await p.evaluate('state.anim'),switched);
 assert.deepEqual(await p.evaluate('[state.contrast,state.brightness,state.layout,state.top.style,state.top.showFigure,state.top.showMetrics]'),[50,50,'grid3','sun',false,false]);
 await p.locator('[data-theme-set=dark]').click();
 await p.locator('[data-pal-set="dark:graphite"]').click();
 await p.locator('#topPick [data-topset=heart]').click();
 await p.locator('#topPick [data-topvisibility=showMetrics]').click();
 await p.waitForTimeout(300);
 await p.locator('#screen').evaluate(e=>e.scrollTop=0);
 await p.screenshot({path:__dirname+'/qa114-appearance-compact.png'});
 // Broad horizontal geometry, all principal pages. Scrolling chip strips are intentional.
 const pages=['sources','profile','manual','diary','remind','export','report','privacy','help','themes','gbody','gfood','gtrain','gloyal'];
 let screens=0;
 for(const width of [320,375,412]){
  await p.setViewportSize({width,height:915});
  for(const page of pages){
   await p.evaluate(page=>go(page),page);await p.waitForTimeout(80);
   assert.equal(await p.locator('.view.on').count(),1,`${page} must actually open a view`);
   const issues=await p.locator('.view.on .card,.view.on .subhead,.view.on input:not([type=hidden]),.view.on button,.view.on .appearance-levels,.view.on .visual-choice').evaluateAll(es=>es.filter(e=>{
    if(!e.getClientRects().length)return false;
    for(let a=e.parentElement;a&&!a.classList.contains('view');a=a.parentElement){
     if(['auto','scroll'].includes(getComputedStyle(a).overflowX)&&a.scrollWidth>a.clientWidth+1)return false;
    }
    return true;
   }).map(e=>{
    const r=e.getBoundingClientRect();return {tag:e.tagName,cls:e.className,left:r.left,right:r.right,w:innerWidth};
   }).filter(r=>r.left<-.5||r.right>r.w+.5));
   assert.deepEqual(issues,[],`${page} at ${width}`);screens++;
  }
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,themeClicks:22,heroClicks:9,layoutClicks:3,levelInputs:10,geometryScreens:screens,errors},null,2));
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
