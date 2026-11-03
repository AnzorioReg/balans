import subprocess
from pathlib import Path

prior = subprocess.run(['git','show','0f2446c180f2a2469cb639c9ddbcf87b0dc3304a:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
Path('scripts/menu-fix.py').write_text(prior,encoding='utf-8')
print('Restored stable menu-fix generator from 0f2446c1; removed metric color regression.')
