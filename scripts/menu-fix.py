import json
import subprocess
import sys
import tempfile
from pathlib import Path

legacy = subprocess.run(['git','show','1dd8656a5225851cc3a721f1f2b8a6e506a05836:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
package_dir = tempfile.mkdtemp(prefix='balans-heart-geometry-')
subprocess.run([sys.executable,'-m','pip','install','--disable-pip-version-check','--only-binary=:all:','--target',package_dir,'shapely==2.1.2'],check=True)
sys.path.insert(0,package_dir)
from shapely.geometry import Polygon

legacy = legacy.replace('175+(x-175)*.58, 165.625+(y-165.625)*.58','140+(x-175)*.4, 125+(y-165.625)*.4')
start = legacy.index('area = ')
end = legacy.index("module = '''",start)
geometry = '''base_polygon = Polygon(points)
assert base_polygon.is_valid
width, gap = 25, 4
distances = (58,29,0)
shapes = [base_polygon if d==0 else base_polygon.buffer(d,join_style=2,mitre_limit=10) for d in distances]
bands = [base_polygon.buffer(d+width/2,join_style=2,mitre_limit=10).difference(base_polygon.buffer(d-width/2,join_style=2,mitre_limit=10)) for d in distances]
assert all(b.is_valid and not b.is_empty for b in bands)
for i in range(3):
 for j in range(i+1,3):
  assert bands[i].intersection(bands[j]).area < 1e-7, 'Heart bands overlap'
def ring_path(ring):
 return 'M'+' L'.join(f'{x:.4f},{y:.4f}' for x,y in ring.coords)+' Z'
def band_path(shape):
 polygons = [shape] if shape.geom_type=='Polygon' else list(shape.geoms)
 return ' '.join(ring_path(ring) for polygon in polygons for ring in [polygon.exterior,*polygon.interiors])
paths = [ring_path(s.exterior) for s in shapes]
regions = [band_path(b) for b in bands]
badge_y = [max(y for x,y in s.exterior.coords) for s in shapes]
'''
legacy = legacy[:start]+geometry+legacy[end:]
start = legacy.index("module = '''")
end = legacy.index("for name in [",start)
module = '''/* APPROVED_HEART_V12 */
(function(){
 const previous=activityGlyph;
 const paths=PATHS_JSON,regions=REGIONS_JSON,badgeY=BADGE_JSON;
 let serial=0;
 activityGlyph=function(style,small=false,a=ACTIVITY()){
  if(style!=='heart')return previous(style,small,a);
  const id='heart-v12-'+(++serial);
  let defs='',body='',badges='';
  a.slice(0,3).forEach((x,i)=>{
   const clip=id+'-'+i;
   defs+='<clipPath id="'+clip+'" clipPathUnits="userSpaceOnUse"><path d="'+regions[i]+'" clip-rule="evenodd"/></clipPath>';
   body+='<path data-heart-band="'+i+'" d="'+regions[i]+'" fill="'+x.c+'" fill-rule="evenodd" stroke="none" style="stroke-width:25!important;stroke-linejoin:miter!important" opacity="'+(small?1:.44)+'"/>';
   const p=Number.isFinite(x.p)?Math.max(0,Math.min(1,x.p)):0;
   if(!small&&p>0)body+='<path d="'+paths[i]+'" fill="none" stroke="'+x.c+'" style="stroke-width:25!important;stroke-linejoin:miter!important" stroke-miterlimit="10" pathLength="100" stroke-dasharray="'+(p*100)+' 100" stroke-linecap="butt" clip-path="url(#'+clip+')" data-goal="'+x.m.id+'"/>';
   if(!small)badges+=dashboardGoalBadge(x,140,badgeY[i],false);
  });
  return '<svg class="activity-glyph '+(small?'small':'')+'" data-hero-style="heart" data-heart-version="12" viewBox="0 0 280 280" aria-hidden="true"><defs>'+defs+'</defs>'+body+badges+'</svg>';
 };
})();
'''
replacement = 'module = '+repr(module)+".replace('PATHS_JSON',json.dumps(paths)).replace('REGIONS_JSON',json.dumps(regions)).replace('BADGE_JSON',json.dumps(badge_y))\n"
legacy = legacy[:start]+replacement+legacy[end:]
legacy = legacy.replace('data-heart-version="11"','data-heart-version="12"').replace('strokeWidth)-13','strokeWidth)-25')
exec(compile(legacy,'heart-v12-generator.py','exec'),globals())
print('V12: tracks-equivalent width 25, gap 4, valid non-overlapping bands, pointed tips.')
