from pathlib import Path
import re

html=Path('app/src/main/assets/index.html')
s=html.read_text(encoding='utf-8')
s=re.sub(r"document.addEventListener\('click',e=>\{const d=e.target.closest\('\.dots\[data-dashboard\]'\);if\(!d\)return;const pop=.*?\},true\);",'',s)
s=re.sub(r"setInterval\(\(\)=>\{document.querySelectorAll\('\.dashboard-popover'\).*?\},50\);",'',s)
patch=r'''
/* MENU_ROUTING_V8 */
(function(){
 let active=null;
 window.addEventListener('click',function(e){
  const button=e.target.closest?.('.dots[data-dashboard]');
  if(!button||!['top','cards'].includes(button.dataset.dashboard))return;
  e.preventDefault();e.stopImmediatePropagation();
  const action=button.dataset.dashboard;
  if(active===action&&document.getElementById('dashboardPopover')){closeDashboardPopover();active=null;return;}
  closeDashboardPopover();
  if(action==='top'){
   if(document.body.classList.contains('pickmode'))finishDashboardPick();
   topCfgSheet(button);
  }else cardMenu(null,button);
  active=action;
  const p=document.getElementById('dashboardPopover');
  if(!p)throw new Error('Dashboard menu was not created: '+action);
  p.dataset.menuV8=action;
  const frame=document.getElementById('phone').getBoundingClientRect();
  p.style.position='fixed';p.style.zIndex='100';p.style.right='auto';
  p.style.left=Math.max(frame.left+8,frame.right-p.offsetWidth-8)+'px';
  p.style.top=(action==='top'?frame.top+42:Math.max(frame.top+42,frame.bottom-p.offsetHeight-90))+'px';
  p.style.maxHeight=Math.max(120,frame.height-140)+'px';
  p.style.visibility='visible';p.style.opacity='1';p.style.pointerEvents='auto';
 },true);
})();
'''
assert s.count('ensureDemo();applyTheme();')==1
s=s.replace('ensureDemo();applyTheme();',patch+chr(10)+'ensureDemo();applyTheme();',1)
assert 'MENU_ROUTING_V8' in s
html.write_text(s,encoding='utf-8')
Path('web-src/index.html').write_text(s,encoding='utf-8')
Path('scripts/menu-check.cjs').write_text(r'''
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const width of [360,412]){
   const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
   await page.goto('file://'+path.resolve('app/src/main/assets/index.html'));
   await page.waitForSelector('#topBlock .dots[data-dashboard=top]');
   for(const action of ['top','cards']){
    const trigger=()=>page.locator('.dots[data-dashboard='+action+']');
    await trigger().tap();
    const menu=page.locator('#dashboardPopover');
    await menu.waitFor({state:'visible'});
    assert.equal(await menu.getAttribute('data-menu-v8'),action);
    assert.ok(await menu.locator('button').count()>0);
    await trigger().tap();
    await menu.waitFor({state:'detached'});
   }
   await page.screenshot({path:'ui-report/menu-v8-'+width+'.png'});
   await page.close();
  }
  fs.writeFileSync('ui-report/menu-v8.json',JSON.stringify({passed:true,widths:[360,412]}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
''',encoding='utf-8')
