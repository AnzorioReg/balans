import re
import subprocess
from pathlib import Path

prior = subprocess.run(['git','show','0daca259620cfb55a4534ceb11591bd351b2b0e3:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(prior,'metrics-v15-base.py','exec'),globals())
for name in ['web-src/index.html','app/src/main/assets/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 old = 'stroke="${a[0].c}" opacity="${small?1:.7}"'
 assert text.count(old)==1
 text = text.replace(old,'stroke="${a[i].c}" opacity="${small?1:.7}"',1)
 p.write_text(text,encoding='utf-8')
print('Sun figure rays now use each selected metric color; bands already use each metric card color.')
