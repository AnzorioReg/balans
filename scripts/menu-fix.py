import subprocess
from pathlib import Path
import re

base=subprocess.run(['git','show','7d2079f18d80eaa0e474db1618e497f4dcce1f62:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
assert 'width=18,gap=.65' in base
base=base.replace('width=18,gap=.65','width=22,gap=.65',1)
exec(compile(base,'heart-v9-base.py','exec'),{})
pattern=r'\.activity-glyph\[data-hero-style=heart\] path(?:\[data-part=track-outline\])?\{[^}]*\}'
for name in ['app/src/main/assets/index.html','web-src/index.html']:
 p=Path(name)
 text=p.read_text(encoding='utf-8')
 text,count=re.subn(pattern,'',text)
 assert count>=2, 'Expected legacy heart CSS overrides'
 assert not re.search(pattern,text)
 assert 'width=22,gap=.65' in text
 p.write_text(text,encoding='utf-8')
check=Path('scripts/menu-check.cjs')
text=check.read_text(encoding='utf-8')
anchor="   await page.waitForSelector('#topBlock .dots[data-dashboard=top]');"
extra=r'''
   await page.evaluate(()=>{
    state.top.style='heart';state.top.showFigure=true;renderTopBlock();
    const svg=document.querySelector('#topBlock svg[data-heart-version="9"]');
    if(!svg)throw new Error('New heart missing');
    const masks=[...svg.querySelectorAll('mask path[stroke="black"]')];
    if(masks.length!==5)throw new Error('Expected five inset stroke boundaries');
    for(const p of masks){
     const intended=Number(p.getAttribute('stroke-width'));
     const actual=parseFloat(getComputedStyle(p).strokeWidth);
     if(Math.abs(intended-actual)>.01)throw new Error('Heart mask width overridden: '+actual+' instead of '+intended);
    }
    if(svg.querySelectorAll('g[mask]>path[opacity]').length!==3)throw new Error('Three colored heart bands required');
   });
   await page.screenshot({path:'ui-report/heart-fixed-'+width+'.png'});
'''
assert text.count(anchor)==1
check.write_text(text.replace(anchor,anchor+extra,1),encoding='utf-8')
