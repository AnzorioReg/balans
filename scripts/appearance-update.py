from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

icons=Path('web-src/icon-collections.js').read_text(encoding='utf-8')
match=re.search(r'const identities=(\[.*\]);',icons)
if not match:
    raise RuntimeError('Missing identity catalog')
identities=json.loads(match.group(1))
ids=[item['id'] for item in identities]
assert len(ids)==5 and ids[0]=='balance' and len(set(ids))==5
module="window.balansPendingIconSet=LS.get('balans2.iconSet','outline');\n"+Path('web-src/refined-appearance.js').read_text(encoding='utf-8')+'\n'+icons
for name in ['web-src/index.html','app/src/main/assets/index.html']:
    path=Path(name)
    text=path.read_text(encoding='utf-8')
    marker='ensureDemo();applyTheme();'
    if marker not in text:
        raise RuntimeError('Startup marker missing: '+name)
    if '/* REFINED_APPEARANCE_V2 */' in text:
        start=text.index('/* REFINED_APPEARANCE_V2 */')
        end=text.index(marker,start)
        text=text[:start]+text[end:]
    text=text.replace(marker,'/* REFINED_APPEARANCE_V2 */\n'+module+'\n'+marker,1)
    text=text.replace("layout:LS.get('balans2.layout','list')","layout:LS.get('balans2.layout','grid3')")
    text=text.replace("includes(state.layout))state.layout='list'","includes(state.layout))state.layout='grid3'")
    path.write_text(text,encoding='utf-8')

android='http://schemas.android.com/apk/res/android'
a='{'+android+'}'
ET.register_namespace('android',android)
ET.register_namespace('tools','http://schemas.android.com/tools')
manifest=Path('app/src/main/AndroidManifest.xml')
tree=ET.parse(manifest)
app=tree.getroot().find('application')
if app is None:
    raise RuntimeError('Application missing')
app.set(a+'icon','@mipmap/logo_balance')
app.set(a+'roundIcon','@mipmap/logo_balance')
legacy=[]
for alias in app.findall('activity-alias'):
    name=alias.get(a+'name','')
    if '.Launcher_' not in name:
        continue
    key=name.split('.Launcher_',1)[1]
    legacy.append(key)
    alias.set(a+'enabled','true' if key=='balance' else 'false')
for item in identities[1:]:
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
    for index,path_data in enumerate(item['paths']):
        ET.SubElement(vector,'path',{a+'fillColor':item['colors'][index%len(item['colors'])],a+'pathData':path_data})
    output=Path('app/src/main/res/drawable/logo_'+key+'.xml')
    output.parent.mkdir(parents=True,exist_ok=True)
    ET.ElementTree(vector).write(output,encoding='utf-8',xml_declaration=True)
ET.indent(tree,space='    ')
tree.write(manifest,encoding='utf-8',xml_declaration=True)

bridge=Path('app/src/main/java/com/anzor/balans/AppearanceBridge.java')
text=bridge.read_text(encoding='utf-8')
all_ids=list(dict.fromkeys(legacy+ids))
array=lambda values:','.join(json.dumps(x) for x in values)
text,count=re.subn(r'private static final String\[\] ICONS=\{[^}]+\};', 'private static final String[] ICONS={'+array(ids)+'};',text)
assert count==1
if 'private static final String[] ALL_ICONS=' not in text:
    text=text.replace('private static final String[] ICONS=', 'private static final String[] ALL_ICONS={'+array(all_ids)+'};\n    private static final String[] ICONS=',1)
text=text.replace('for (String other : ICONS)', 'for (String other : ALL_ICONS)')
text=text.replace('getString("launcherIcon","heart")','getString("launcherIcon","balance")')
text=text.replace('callback(id,"");', 'if (!activity.getPreferences(0).getBoolean("iconCatalogV2",false) || !Arrays.asList(ICONS).contains(id)) setIcon("balance");\n        else callback(id,"");',1) if 'getBoolean("iconCatalogV2",false)' not in text else text
text=text.replace('putString("launcherIcon",id).apply()', 'putString("launcherIcon",id).putBoolean("iconCatalogV2",true).apply()')
bridge.write_text(text,encoding='utf-8')
print('Installed 6 icon sets; 5 launcher identities; legacy aliases retained for safe upgrades.')
