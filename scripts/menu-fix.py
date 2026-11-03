import subprocess
from pathlib import Path

base_source = subprocess.run(['git','show','f59ed378f119e8011698009bc2e92e6cd382b534:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(base_source,'heart-v12-base.py','exec'),globals())
new_module = Path('web-src/dashboard-v13.js').read_text(encoding='utf-8')
for name in ['web-src/index.html','app/src/main/assets/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 marker = 'ensureDemo();applyTheme();'
 assert text.count(marker)==1
 assert '/* DASHBOARD_V13 */' not in text
 text = text.replace(marker,new_module+'\n'+marker,1)
 p.write_text(text,encoding='utf-8')
check = Path('scripts/menu-check.cjs')
text = check.read_text(encoding='utf-8')
anchor = '   await page.close();'
assert text.count(anchor)==1
extra = '''
   await page.evaluate(()=>{
    const api=window.BalansDashboardV13;
    if(!api||api.layouts().join(',')!=='inline,thin,capsules,arcs,segments,type')throw new Error('Six dashboard layouts required');
    topCfgSheet(document.querySelector('#topBlock .dots'));
    const pop=document.querySelector('#dashboardPopover');
    if(pop.querySelector('[data-dashboard=appearance],.metric-order-row'))throw new Error('Obsolete menu controls remain');
    for(const id of ['temp','restingHeart','hrv','weight'])if(pop.querySelector('[data-dashboard=metric][data-value="'+id+'"]'))throw new Error('Forbidden top metric '+id);
    if(pop.querySelectorAll('[data-reorder]').length!==state.top.items.length)throw new Error('Drag ordering missing');
    closeDashboardPopover();
    const before=state.top.style;
    for(const [style]of HERO_STYLES){
     state.top.style=style;
     const node=document.createElement('div');node.innerHTML=activityGlyph(style,false,ACTIVITY().map(x=>({...x,p:.4})));document.body.appendChild(node);
     const progress=[...node.querySelectorAll('path[data-fill-direction="badge-right"]')];
     if(progress.length!==3)throw new Error('Progress origins missing: '+style);
     for(const p of progress){const a=p.getPointAtLength(0),b=p.getPointAtLength(2),m=p.getCTM();if(new DOMPoint(b.x,b.y).matrixTransform(m).x<new DOMPoint(a.x,a.y).matrixTransform(m).x-.1)throw new Error('Progress goes left: '+style);}
     node.remove();
    }
    state.top.style=before;
    activityDetails();
    if(document.querySelectorAll('[data-hero-day]').length!==7)throw new Error('Seven day selector missing');
    if(document.querySelectorAll('.hero-week-summary>div').length!==state.top.items.length)throw new Error('Week metrics mismatch');
    if(document.querySelectorAll('.hero-explanation').length!==state.top.items.length)throw new Error('Week explanations missing');
    const previous=document.querySelector('[data-hero-day]:not([disabled])');previous.click();
    if(!previous.dataset.heroDay)throw new Error('Day selection missing');
    closeSheet();renderTopBlock();
   });
'''
check.write_text(text.replace(anchor,extra+anchor,1),encoding='utf-8')
print('Dashboard V13 applied: rightward progress, six layouts, drag ordering and real week detail.')
