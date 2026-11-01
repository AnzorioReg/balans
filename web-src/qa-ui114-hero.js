// 1.14 hero regression: actual UI taps, semantic SVG symbols, real-record-only fixture.
// Run after python3 build.py: node qa-ui114-hero.js
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chromium'});
 const context=await browser.newContext({viewport:{width:375,height:812}});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);
 await page.evaluate(()=>{
  state.manual={};state.deviceData={};
  for(const m of M){
   state.deviceData[m.id]=Array.from({length:5},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-4+i);
    const day=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const v=({steps:6482,exercise:38,activeCalories:428,water:1800})[m.id]??(Number(m.base)||50);
    return {id:`qa-real-${m.id}-${i}`,d:day,ts:d.getTime(),v:v*(.8+i*.05),source:'Health Connect',...(['steps','exercise','activeCalories','water','distance'].includes(m.id)?{day}:{})};
   });
  }
  state.layout='grid3';LS.set('balans2.layout','grid3');
  LS.set('balans2.deviceData',state.deviceData);LS.set('balans2.manual',{});renderAll();
 });
 await page.waitForTimeout(300);
 assert.equal(await page.evaluate('typeof semanticGlyph'),'function','Build must include the final semantic glyph module.');
 const open=()=>page.getByRole('button',{name:'Настроить верхний блок',exact:true}).click();
 const close=()=>page.locator('#dashboardPopover [data-dashboard=close]').click();
 const overview=async()=>{await page.mouse.move(70,300);await page.mouse.wheel(0,-220);await page.waitForTimeout(300);await page.locator('[data-tab=overview]').click()};
 const noOverflow=async()=>{
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await page.locator('#topBlock').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  assert.ok(await page.locator('.activity-metrics').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 };
 const checkGlyphs=async()=>{
  const expected=await page.evaluate(()=>state.top.items.map(id=>({id,glyph:dashboardGoalGlyph(byId[id])})));
  assert.equal(await page.locator('.activity-metrics [data-semantic-metric]').count(),expected.length);
  for(const {id,glyph}of expected){
   assert.equal(await page.locator(`.activity-metrics [data-semantic-metric="${id}"] use`).getAttribute('href'),'#'+glyph);
   assert.ok(await page.evaluate(g=>!!document.getElementById(g),glyph),`Missing symbol ${glyph}`);
  }
 };
 const shapes=new Set();
 for(const style of ['heart','tracks','orbit','bloom','diamond','infinity','hex','sun']){
  await open();
  const preview=page.locator(`[data-dashboard=style][data-value="${style}"]`);
  assert.equal(await preview.locator(`svg[data-hero-style="${style}"]`).count(),1);
  await preview.click();
  assert.equal(await page.evaluate('state.top.style'),style);
  assert.equal(await page.locator('.activity-main>.activity-glyph').getAttribute('data-hero-style'),style);
  assert.equal(await page.locator('.activity-main .hero-goal-badge').count(),3);
  assert.equal(await page.locator(`[data-dashboard=style][data-value="${style}"]`).getAttribute('aria-pressed'),'true');
  shapes.add(await page.locator('.activity-main>.activity-glyph').innerHTML());
  await close();await checkGlyphs();await noOverflow();
  await page.locator('#topBlock').screenshot({path:path.join(__dirname,`ui114-hero-${style}.png`)});
 }
 assert.equal(shapes.size,8);
 // Palette selection must change actual DOM colors, with persistence, not only selected CSS.
 await open();await page.locator('[data-dashboard=palette][data-value=neon]').click();
 assert.equal(await page.locator('.activity-main [data-part=track]').first().getAttribute('stroke'),'#ff6095');
 await page.locator('[data-dashboard=palette][data-value=energy]').click();
 assert.equal(await page.locator('.activity-main [data-part=track]').first().getAttribute('stroke'),'#ff5a0a');
 await page.locator('[data-dashboard=style][data-value=tracks]').click();
 await page.locator('[data-dashboard=metric][data-value=water]').click();
 await page.locator('#metricSizeRange').focus();await page.keyboard.press('End');
 assert.equal(await page.evaluate('state.top.metricSize'),125);
 for(const layout of ['inline','mini','tiles','capsules','numbers','classic']){
  await page.locator(`[data-dashboard=metric-layout][data-value="${layout}"]`).click();
  assert.equal(await page.evaluate('state.top.layout'),layout);
  await close();await checkGlyphs();await noOverflow();
  await page.locator('#topBlock').screenshot({path:path.join(__dirname,`ui114-metrics-${layout}.png`)});
  await open();
 }
 await page.locator('[data-dashboard=metric-layout][data-value=inline]').click();await close();
 await page.reload();await page.waitForTimeout(300);
 assert.equal(await page.evaluate('state.top.style'),'tracks');
 assert.equal(await page.evaluate('state.top.palette'),'energy');
 assert.equal(await page.evaluate('state.top.items.length'),4);
 await checkGlyphs();await noOverflow();
 await page.screenshot({path:path.join(__dirname,'ui114-bright-dashboard.png')});
 // Real Appearance taps must update the hero and metrics, not just the selected tile.
 for(const variant of ['outline','duo','soft','classic']){
  await open();await page.locator('[data-dashboard=appearance]').click();
  await page.locator(`button[data-icon-set="${variant}"]`).click();
  assert.equal(await page.evaluate('state.iconSet'),variant);
  assert.equal(await page.locator(`button[data-icon-set="${variant}"]`).getAttribute('aria-pressed'),'true');
  await overview();await checkGlyphs();
  const badges=await page.locator('.activity-main .hero-goal-badge use').evaluateAll(us=>us.map(u=>u.getAttribute('href')));
  assert.ok(badges.every(id=>id.startsWith(`#health-${variant}-`)));
 }
 // A clean reference-like triple metric row, still configured via actual controls.
 await open();await page.locator('[data-dashboard=metric][data-value=water]').click();
 await page.locator('#metricSizeRange').focus();
 for(let i=0;i<5;i++)await page.keyboard.press('ArrowLeft');
 assert.equal(await page.evaluate('state.top.metricSize'),100);await close();
 await page.screenshot({path:path.join(__dirname,'ui114-reference-dashboard.png')});
 await open();await page.locator('[data-dashboard=appearance]').click();
 await page.locator('[data-theme-set=light]').click();
 await overview();await noOverflow();await checkGlyphs();
 await page.screenshot({path:path.join(__dirname,'ui114-bright-light.png')});
 // Empty progress remains absent even though colorful category badges remain visible.
 const empty=await browser.newPage({viewport:{width:375,height:812}});
 empty.on('pageerror',e=>errors.push(e.message));await empty.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await empty.waitForTimeout(300);
 assert.ok(await empty.evaluate('ACTIVITY().every(x=>x.p===0&&!Number.isFinite(x.value))'));
 assert.ok(await empty.locator('.activity-main [data-part=progress]').evaluateAll(ps=>ps.every(p=>p.getAttribute('opacity')==='0')));
 assert.equal(await empty.locator('.activity-main .hero-goal-badge').count(),3);
 await empty.screenshot({path:path.join(__dirname,'ui114-bright-empty.png')});
 assert.deepEqual(errors,[]);
 console.log('PASS 1.14 hero: all8 styles real-tapped +8 distinct SVGs; palettes change DOM/persist; semantic glyphs all6 layouts at375px/4metrics/125%; all4 icon sets real-tapped update hero+metrics; light theme; no overflow; actual-only progress; no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
