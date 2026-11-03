import re
import subprocess
from pathlib import Path

previous_source = subprocess.run(['git','show','70f1bee6469b4ff4af5922633a8c71e9038c8426:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(previous_source,'dashboard-v13-base.py','exec'),globals())
module_v14 = Path('web-src/dashboard-v14.js').read_text(encoding='utf-8')
direction_patch = '''
  if(style==='heart'&&closed)direction=-direction;
  if(style==='infinity'&&closed){
   let choice=null;
   for(let j=0;j<n;j++){
    const q=world[j],distance=(q.x-origin.x)**2+(q.y-origin.y)**2;
    if(distance>25)continue;
    for(const dir of [1,-1]){const next=world[(j+dir*4+n)%n];if(next.x>q.x&&next.y<q.y&&(!choice||distance<choice.distance))choice={start:j,direction:dir,distance};}
   }
   if(choice){start=choice.start;direction=choice.direction;}
  }
'''
for name in ['web-src/index.html','app/src/main/assets/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 assert text.count('esc(r.d)')>=1
 text = text.replace('esc(r.d)','esc(balansRecordDate(r))').replace('esc(x.d)','esc(balansRecordDate(x))')
 text = text.replace("+' · '+lr.d", "+' · '+balansRecordDate(lr)")
 text = text.replace('exercise:60','exercise:(GOAL.exercise||60)').replace("['exercise',60]","['exercise',(GOAL.exercise||60)]")
 text = text.replace('water:GOAL.water','water:GOAL.water,distance:GOAL.distance,floors:GOAL.floors,mindfulness:GOAL.mindfulness')
 needle='actions+rl+about+rm;return}'
 assert text.count(needle)==1
 text = text.replace(needle,'actions+rl+about+rm+balansMetricGoalHTML(m);return}',1)
 needle="    const ch=sh.querySelector('#dchart');"
 assert text.count(needle)==1
 text = text.replace(needle,"    sh.insertAdjacentHTML('beforeend',balansMetricGoalHTML(m));\n"+needle,1)
 text = text.replace('function alignGlyph(html,activity){','function alignGlyph(html,activity,style){',1)
 text = text.replace("const key=state.top.style+'|'+html;","const key=style+'|'+html;",1)
 text = text.replace('small?html:alignGlyph(html,a);','small?html:alignGlyph(html,a,style);',1)
 needle='  const route=[];'
 assert text.count(needle)==1
 text = text.replace(needle,direction_patch+needle,1)
 marker='ensureDemo();applyTheme();'
 assert text.count(marker)==1
 text = text.replace(marker,module_v14+'\n'+marker,1)
 text = text.replace('Укажите пол, рост и год рождения в профиле.','Укажите пол и год рождения в профиле; рост — в карточке показателя «Рост».')
 p.write_text(text,encoding='utf-8')
check=Path('scripts/menu-check.cjs')
text=check.read_text(encoding='utf-8')
old="if(new DOMPoint(b.x,b.y).matrixTransform(m).x<new DOMPoint(a.x,a.y).matrixTransform(m).x-.1)"
new="const u=new DOMPoint(a.x,a.y).matrixTransform(m),v=new DOMPoint(b.x,b.y).matrixTransform(m);if(style==='heart'?v.x>u.x+.1:style==='infinity'?(v.x<u.x-.1||v.y>u.y+.1):v.x<u.x-.1)"
assert text.count(old)==1
text=text.replace(old,new,1)
extra = '''
   await page.evaluate(()=>{
    const api=window.BalansDashboardV14;
    if(!api)throw new Error('Dashboard V14 missing');
    if(api.recordDate({day:'2026-11-03',v:123})!=='03.11.2026')throw new Error('Daily record date missing');
    if(api.recordDate({})!=='Дата не указана')throw new Error('Missing date fallback failed');
    if(document.querySelector('[data-tab="dynamics"],#v-dynamics'))throw new Error('Dynamics still visible');
    const profile=document.createElement('div');profile.innerHTML=MPAGES.profile.r();
    if([...profile.querySelectorAll('input,select')].map(n=>n.name).sort().join(',')!=='name,sex,year')throw new Error('Profile must contain only name, sex, year');
    for(const id of ['steps','sleep','water','activeCalories','exercise']){
     openMetric(id);
     if(!document.querySelector('#metricGoalForm'))throw new Error('Goal editor missing: '+id);
     if(document.querySelector('#sheet [data-dyn]'))throw new Error('Old Dynamics link remains');
    }
    for(const id of ['heart','temp','bp'])if(api.goalConfig(id))throw new Error('Inappropriate goal: '+id);
    closeSheet();renderTopBlock();
   });
'''
anchor='   await page.close();'
assert text.count(anchor)==1
check.write_text(text.replace(anchor,extra+anchor,1),encoding='utf-8')
print('Dashboard V14: record dates, metric-specific daily goals, minimal profile, no Dynamics and revised heart/loop direction.')