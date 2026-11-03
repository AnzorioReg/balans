import re
import subprocess
from pathlib import Path

prior = subprocess.run(['git','show','0f2446c180f2a2469cb639c9ddbcf87b0dc3304a:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(prior,'unique-metric-colors-base.py','exec'),globals())
for name in ['web-src/index.html','app/src/main/assets/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 anchor = 'const cv=m=>`var(${CATS[m.cat].c})`;'
 assert text.count(anchor)==1
 addition = anchor + '\nconst METRIC_COLORS={steps:"var(--c-food)",distance:"var(--c-well)",activeCalories:"var(--c-fit)",totalCalories:"var(--c-body)",exercise:"var(--c-heart)",floors:"var(--c-act)",elevation:"var(--c-fit)",speed:"var(--c-well)",heart:"var(--c-heart)",restingHeart:"var(--c-heart)",bp:"var(--c-heart)",spo2:"var(--c-well)",hrv:"var(--c-heart)",resp:"var(--c-well)",sleep:"var(--c-sleep)",weight:"var(--c-body)",height:"var(--c-body)",bodyFat:"var(--c-body)",leanMass:"var(--c-body)",bodyWater:"var(--c-well)",boneMass:"var(--c-body)",water:"var(--c-well)",nutrition:"var(--c-food)",temp:"var(--c-well)",skinTemperature:"var(--c-well)",glucose:"var(--c-well)",mindfulness:"var(--c-sleep)",vo2:"var(--c-fit)",bmr:"var(--c-body)",power:"var(--c-fit)",cadence:"var(--c-act)",cyclingCadence:"var(--c-fit)",stress:"var(--c-well)",mood:"var(--c-well)"};\nconst metricColor=m=>METRIC_COLORS[m.id]||cv(m);'
 text = text.replace(anchor,addition,1)
 text,count = re.subn(r'const ACTIVITY=\(\)=>window\.BalansMetricsV15\?window\.BalansMetricsV15\.activity\(\):activityBeforeV15\(\);', 'const ACTIVITY=()=>window.BalansMetricsV15?window.BalansMetricsV15.activity():activityBeforeV15();\nconst metricColorBeforeV15=cv;\ncv=m=>metricColor(m);',text,count=1)
 assert count==1
 p.write_text(text,encoding='utf-8')
print('Each metric now has a stable unique color used by cards, charts and hero bands.')
