from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

catalog=json.loads(Path('web-src/identity-v3.json').read_text(encoding='utf-8'))
assert len(catalog)==5 and catalog[0]['id']=='balance'
module=Path('web-src/visual-v3.js').read_text(encoding='utf-8').replace('__CATALOG__',json.dumps(catalog,ensure_ascii=False))
for name in ['web-src/index.html','app/src/main/assets/index.html']:
    path=Path(name)
    text=path.read_text(encoding='utf-8')
    marker='ensureDemo();applyTheme();'
    assert marker in text
    if '/* VISUAL_V3 */' not in text:
        snapshot="window.balansV3Icon=LS.get('balans2.iconSet','outline');window.balansV3App=LS.get('balans2.appIcon','balance');\n"
        assert '/* REFINED_APPEARANCE_V2 */' in text
        text=text.replace('/* REFINED_APPEARANCE_V2 */',snapshot+'/* REFINED_APPEARANCE_V2 */',1)
        text=text.replace(marker,'/* VISUAL_V3 */\n'+module+'\n'+marker,1)
    path.write_text(text,encoding='utf-8')
android='http://schemas.android.com/apk/res/android'
a='{'+android+'}'
ET.register_namespace('android',android)
ET.register_namespace('tools','http://schemas.android.com/tools')
manifest=Path('app/src/main/AndroidManifest.xml')
tree=ET.parse(manifest)
app=tree.getroot().find('application')
assert app is not None
for attr in ['icon','roundIcon']:
    app.set(a+attr,'@drawable/logo_balance')
legacy=[]
for alias in app.findall('activity-alias'):
    name=alias.get(a+'name','')
    if '.Launcher_' in name:
        key=name.split('.Launcher_',1)[1]
        legacy.append(key)
        alias.set(a+'enabled','true' if key=='balance' else 'false')
for item in catalog:
    key=item['id']
    alias=next((x for x in app.findall('activity-alias') if x.get(a+'name')=='.Launcher_'+key),None)
    if alias is None:
        alias=ET.SubElement(app,'activity-alias',{a+'name':'.Launcher_'+key,a+'targetActivity':'.MainActivity',a+'enabled':'false',a+'exported':'true',a+'label':'@string/app_name'})
        intent=ET.SubElement(alias,'intent-filter')
        ET.SubElement(intent,'action',{a+'name':'android.intent.action.MAIN'})
        ET.SubElement(intent,'category',{a+'name':'android.intent.category.LAUNCHER'})
    alias.set(a+'icon','@drawable/logo_'+key)
    alias.set(a+'roundIcon','@drawable/logo_'+key)
    vector=ET.Element('vector',{a+'width':'108dp',a+'height':'108dp',a+'viewportWidth':'108',a+'viewportHeight':'108'})
    ET.SubElement(vector,'path',{a+'fillColor':item['background'],a+'pathData':'M26 0H82Q108 0 108 26V82Q108 108 82 108H26Q0 108 0 82V26Q0 0 26 0Z'})
    for i,p in enumerate(item['paths']):
        attrs={a+'pathData':p,a+'fillColor':item['colors'][i%len(item['colors'])] if item.get('filled') else '#00000000'}
        if not item.get('filled'):
            attrs.update({a+'strokeColor':item['colors'][i%len(item['colors'])],a+'strokeWidth':str(item.get('strokeWidth',5.5)),a+'strokeLineCap':'round',a+'strokeLineJoin':'round'})
        ET.SubElement(vector,'path',attrs)
    output=Path('app/src/main/res/drawable/logo_'+key+'.xml')
    ET.ElementTree(vector).write(output,encoding='utf-8',xml_declaration=True)
ET.indent(tree,space='    ')
tree.write(manifest,encoding='utf-8',xml_declaration=True)
bridge=Path('app/src/main/java/com/anzor/balans/AppearanceBridge.java')
text=bridge.read_text(encoding='utf-8')
ids=[x['id'] for x in catalog]
array=lambda xs:','.join(json.dumps(x) for x in xs)
for field,values in [('ICONS',ids),('ALL_ICONS',list(dict.fromkeys(legacy+ids)))]:
    text,count=re.subn(r'private static final String\[\] '+field+r'=\{[^}]+\};','private static final String[] '+field+'={'+array(values)+'};',text)
    assert count==1,field
text=text.replace('iconCatalogV2','iconCatalogV3')
bridge.write_text(text,encoding='utf-8')
test=Path('scripts/ui-smoke.cjs')
text=test.read_text(encoding='utf-8')
text=text.replace("state.icons.length === 9","state.icons.length === 10").replace("ICON_STYLES.length === 9","ICON_STYLES.length === 10").replace('Exactly nine icon sets','Exactly ten icon sets')
text=text.replace("['objects','anatomy','instruments','notation','signage','emoji']","['emoji-sport','emoji-body','emoji-nature','emoji-tools','emoji-life']").replace('All six new sets exist','All five emoji variants exist')
text=text.replace("['atelier','ribbon','stems','mosaic']","['signature','points']")
test.write_text(text,encoding='utf-8')
print('Visual V3 applied: 20 material themes, 10 icon sets, 2 chart sets, 5 health/sport launcher choices.')
