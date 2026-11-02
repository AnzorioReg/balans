import subprocess
from pathlib import Path

ui=Path('web-src/ui.js').read_text(encoding='utf-8')
tracks=ui.split("if(style==='tracks')",1)[1].split("if(style==='orbit')",1)[0]
assert '107-i*29' in tracks and ',x,25)' in tracks
base=subprocess.run(['git','show','f00029cec2ec0feff08cc8e3b07032170b6bd416:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
base=base.replace('width=22,gap=.65','width=22,gap=4')
exec(compile(base,'heart-working-base.py','exec'),{})
for name in ['app/src/main/assets/index.html','web-src/index.html']:
 p=Path(name)
 text=p.read_text(encoding='utf-8')
 start=text.index('/* PARALLEL_HEART_V9 */')
 end=text.index('ensureDemo();applyTheme();',start)
 heart=text[start:end]
 assert 'width=22,gap=4' in heart
 assert 'stroke-linejoin="round"' in heart
 heart=heart.replace('stroke-linejoin="round"','stroke-linejoin="miter" stroke-miterlimit="10"')
 text=text[:start]+heart+text[end:]
 p.write_text(text,encoding='utf-8')
check=Path('scripts/menu-check.cjs')
text=check.read_text(encoding='utf-8')
needle="     const intended=Number(p.getAttribute('stroke-width'));"
assert text.count(needle)==1
text=text.replace(needle,"     if(getComputedStyle(p).strokeLinejoin!=='miter')throw new Error('Heart joins must be pointed');"+chr(10)+needle,1)
check.write_text(text,encoding='utf-8')
