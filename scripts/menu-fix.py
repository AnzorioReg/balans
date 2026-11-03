import subprocess
from pathlib import Path

base='23fa68711fdd1b4334ad389e52cc1b24f2d60332'
for p in ['scripts/menu-fix.py','web-src/index.html','app/src/main/assets/index.html','web-src/refined-appearance.js']:
 Path(p).write_text(subprocess.run(['git','show',f'{base}:{p}'],check=True,capture_output=True,text=True).stdout,encoding='utf-8')
try:
 Path('web-src/metrics-v15.js').write_text(subprocess.run(['git','show',f'{base}:web-src/metrics-v15.js'],check=True,capture_output=True,text=True).stdout,encoding='utf-8')
except subprocess.CalledProcessError:
 Path('web-src/metrics-v15.js').unlink(missing_ok=True)
print('Restored stable interface from 23fa6871, before band color and daily-total changes.')
