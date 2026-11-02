from pathlib import Path
module=Path('web-src/refined-appearance.js').read_text(encoding='utf-8')
for name in ['web-src/index.html','app/src/main/assets/index.html']:
    path=Path(name)
    if not path.exists():
        raise RuntimeError('Missing compiled asset: '+name)
    text=path.read_text(encoding='utf-8')
    if '/* REFINED_APPEARANCE_V2 */' not in text:
        marker='ensureDemo();applyTheme();'
        if marker not in text:
            raise RuntimeError('Startup marker missing: '+name)
        text=text.replace(marker,'/* REFINED_APPEARANCE_V2 */\n'+module+'\n'+marker,1)
    text=text.replace("layout:LS.get('balans2.layout','list')","layout:LS.get('balans2.layout','grid3')")
    text=text.replace("includes(state.layout))state.layout='list'","includes(state.layout))state.layout='grid3'")
    path.write_text(text,encoding='utf-8')
