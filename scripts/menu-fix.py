import re
import subprocess
from pathlib import Path

base=subprocess.run(['git','show','944a571dda4c1c0ce8596ac0d43e28deeb423fa5:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(base,'heart-and-menu-base.py','exec'),{})
old='M140 246 C111 222 25 164 25 96 C25 35 96 19 140 68 C184 19 255 35 255 96 C255 164 169 222 140 246 Z'
new='M175 307.5 C138.75 277.5 31.25 205 31.25 120 C31.25 43.75 120 23.75 175 85 C230 23.75 318.75 43.75 318.75 120 C318.75 205 211.25 277.5 175 307.5 Z'
for name in ['app/src/main/assets/index.html','web-src/index.html']:
 p=Path(name)
 text=p.read_text(encoding='utf-8')
 start=text.index('/* PARALLEL_HEART_V9 */')
 end=text.index('ensureDemo();applyTheme();',start)
 heart=text[start:end]
 assert old in heart
 heart=heart.replace(old,new,1).replace('width="280" height="280"','width="350" height="350"').replace('viewBox="0 0 280 280"','viewBox="0 0 350 350"')
 heart=heart.replace('stroke-width:140!important','stroke-width:200!important')
 heart=heart.replace('dashboardGoalBadge(x,140,246-','dashboardGoalBadge(x,175,307.5-')
 heart+=chr(10)+"if(!LS.get('balans2.heartVolumeV10',false)){state.top.size=Math.min(350,Math.round((Number(state.top.size)||220)*1.25));saveTop();LS.set('balans2.heartVolumeV10',true);}"+chr(10)

 def scaled_heart(d,factor):
  cx,cy=175.0,165.625
  def pair(m):
   x,y=float(m.group(1)),float(m.group(2))
   return f'{cx+(x-cx)*factor:.2f} {cy+(y-cy)*factor:.2f}'
  return re.sub(r'(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)',pair,d)

 contours=list(re.finditer(r'd="([^"]*C[^"]*Z)"',heart))
 assert len(contours)==3, f'Expected three heart contours, found {len(contours)}'
 for match,factor in reversed(list(zip(contours,(1.0,0.78,0.58))))[1:]:
  heart=heart[:match.start(1)]+scaled_heart(match.group(1),factor)+heart[match.end(1):]

 text=text[:start]+heart+text[end:]
 lines=text.splitlines()
 blocked=[line for line in lines if 'SAFE.has(id)' in line and "document.addEventListener('click'" in line]
 assert len(blocked)==2, 'Expected two obsolete icon guards'
 text=chr(10).join(line for line in lines if line not in blocked)+chr(10)
 text=text.replace('id="heroSizeRange" type="range" min="140" max="280"','id="heroSizeRange" type="range" min="140" max="350"')
 p.write_text(text,encoding='utf-8')
check=Path('scripts/menu-check.cjs')
text=check.read_text(encoding='utf-8')
anchor='   await page.close();'
extra=r'''
   await page.evaluate(()=>{
    window.__requestedIcon=null;
    window.BalansAppearance={setIcon(id){window.__requestedIcon=id;},status(){},setSystemBars(){}};
    go('themes');
    const buttons=[...document.querySelectorAll('[data-app-icon]')];
    const choice=buttons.find(b=>b.dataset.appIcon!=='balance');
    if(!choice)throw new Error('Launcher choices missing');
    choice.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    if(window.__requestedIcon!==choice.dataset.appIcon)throw new Error('Launcher choice blocked before native bridge');
   });
'''
assert text.count(anchor)==1
check.write_text(text.replace(anchor,extra+anchor,1),encoding='utf-8')
