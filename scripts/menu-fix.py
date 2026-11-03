import json
import math
import subprocess
from pathlib import Path

base = subprocess.run(['git', 'show', '944a571dda4c1c0ce8596ac0d43e28deeb423fa5:scripts/menu-fix.py'], check=True, capture_output=True, text=True).stdout
exec(compile(base, 'heart-and-menu-base.py', 'exec'), {})
segments = [((175,307.5),(138.75,277.5),(31.25,205),(31.25,120)),((31.25,120),(31.25,43.75),(120,23.75),(175,85)),((175,85),(230,23.75),(318.75,43.75),(318.75,120)),((318.75,120),(318.75,205),(211.25,277.5),(175,307.5))]
points = []
for segment in segments:
 for j in range(200):
  t = j / 200
  weights = ((1-t)**3, 3*(1-t)**2*t, 3*(1-t)*t*t, t**3)
  x, y = (sum(w*p[k] for w,p in zip(weights,segment)) for k in (0,1))
  points.append((175+(x-175)*.58, 165.625+(y-165.625)*.58))
area = sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))
sign = 1 if area > 0 else -1
normals = []
for a,b in zip(points,points[1:]+points[:1]):
 dx,dy = b[0]-a[0],b[1]-a[1]
 length = math.hypot(dx,dy)
 normals.append((sign*dy/length,-sign*dx/length))
def offset(distance):
 result = []
 for i,(x,y) in enumerate(points):
  a,b = normals[i-1],normals[i]
  denominator = 1+a[0]*b[0]+a[1]*b[1]
  assert denominator > .01, 'Unexpected contour corner'
  result.append((x+distance*(a[0]+b[0])/denominator,y+distance*(a[1]+b[1])/denominator))
 return result
def svg_path(coords):
 return 'M'+' L'.join(f'{x:.4f},{y:.4f}' for x,y in coords)+' Z'
shapes = [offset(34),offset(17),offset(0)]
paths = [svg_path(coords) for coords in shapes]
badge_y = [max(y for x,y in coords) for coords in shapes]
module = '''/* APPROVED_HEART_V11 */
(function(){
 const previous=activityGlyph;
 const paths=PATHS_JSON;
 const badgeY=BADGE_JSON;
 activityGlyph=function(style,small=false,a=ACTIVITY()){
  if(style!=='heart')return previous(style,small,a);
  let body='',badges='';
  a.slice(0,3).forEach((x,i)=>{
   const p=Number.isFinite(x.p)?Math.max(0,Math.min(1,x.p)):0;
   const attributes=' d="'+paths[i]+'" fill="none" stroke="'+x.c+'" stroke-width="13" style="stroke-width:13!important;stroke-linejoin:miter!important" stroke-linejoin="miter" stroke-miterlimit="10"';
   body+='<path data-heart-band="'+i+'"'+attributes+' opacity="'+(small?1:.44)+'"/>';
   if(!small&&p>0)body+='<path'+attributes+' pathLength="100" stroke-dasharray="'+(p*100)+' 100" stroke-linecap="butt" data-goal="'+x.m.id+'"/>';
   if(!small)badges+=dashboardGoalBadge(x,175,badgeY[i],false);
  });
  return '<svg class="activity-glyph '+(small?'small':'')+'" data-hero-style="heart" data-heart-version="11" viewBox="25 15 300 310" aria-hidden="true">'+body+badges+'</svg>';
 };
})();
'''.replace('PATHS_JSON',json.dumps(paths)).replace('BADGE_JSON',json.dumps(badge_y))
for name in ['app/src/main/assets/index.html','web-src/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 start = text.index('/* PARALLEL_HEART_V9 */')
 end = text.index('ensureDemo();applyTheme();',start)
 text = text[:start]+module+'\n'+text[end:]
 lines = text.splitlines()
 blocked = [line for line in lines if 'SAFE.has(id)' in line and "document.addEventListener('click'" in line]
 assert len(blocked)==2, 'Expected two obsolete icon guards'
 text = '\n'.join(line for line in lines if line not in blocked)+'\n'
 p.write_text(text,encoding='utf-8')
check = Path('scripts/menu-check.cjs')
text = check.read_text(encoding='utf-8')
start = text.index("   await page.evaluate(()=>{\n    state.top.style='heart'")
end = text.index('   await page.screenshot',start)
text = text[:start]+'''   await page.evaluate(()=>{
    state.top.style='heart';state.top.showFigure=true;renderTopBlock();
    const svg=document.querySelector('#topBlock svg[data-heart-version="11"]');
    if(!svg)throw new Error('Approved pointed heart missing');
    const bands=[...svg.querySelectorAll('path[data-heart-band]')];
    if(bands.length!==3)throw new Error('Three separate heart contours required');
    if(new Set(bands.map(p=>p.getAttribute('d'))).size!==3)throw new Error('Heart contours overlap');
    for(const p of bands){
     if(getComputedStyle(p).strokeLinejoin!=='miter')throw new Error('Heart tips must remain pointed');
     if(Math.abs(parseFloat(getComputedStyle(p).strokeWidth)-13)>.01)throw new Error('Heart stroke width overridden');
    }
   });
'''+text[end:]
anchor='   await page.close();'
extra='''   await page.evaluate(()=>{
    window.__requestedIcon=null;
    window.BalansAppearance={setIcon(id){window.__requestedIcon=id;},status(){},setSystemBars(){}};
    go('themes');
    const choice=[...document.querySelectorAll('[data-app-icon]')].find(b=>b.dataset.appIcon!=='balance');
    if(!choice)throw new Error('Launcher choices missing');
    choice.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    if(window.__requestedIcon!==choice.dataset.appIcon)throw new Error('Launcher choice blocked before native bridge');
   });
'''
assert text.count(anchor)==1
check.write_text(text.replace(anchor,extra+anchor,1),encoding='utf-8')
print('Approved V11 heart applied: three distinct contours, pointed tips, width 13 and gap 4.')
