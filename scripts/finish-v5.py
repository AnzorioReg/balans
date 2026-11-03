from pathlib import Path
import json
import re

palette=['#00ffd0','#ff407e','#35b6ff']
balance=['M54 30 A24 24 0 1 1 30 54','M54 38 A16 16 0 1 1 38 54','M54 46 A8 8 0 1 1 46 54']
def heart(scale):
    def pair(x,y):
        return f'{54+(x-54)*scale:.2f} {54+(y-54)*scale:.2f}'
    return 'M'+pair(54,88)+'C'+pair(42,78)+' '+pair(20,62)+' '+pair(20,43)+'C'+pair(20,23)+' '+pair(43,19)+' '+pair(54,36)+'C'+pair(65,19)+' '+pair(88,23)+' '+pair(88,43)+'C'+pair(88,62)+' '+pair(66,78)+' '+pair(54,88)+'Z'
bases=[('balance','Баланс',balance,palette,7),('heart4','Сердце',[heart(1),heart(.78),heart(.56)],palette,5.5),('cardio4','Сердце · пульс',[heart(1),'M23 54H37L44 41L54 70L64 35L73 54H85'],palette,5.5),('ecg4','Кардиограмма',['M18 54H34L42 38L53 76L64 27L74 54H90'],['#ff3655'],5)]
variants=[('',None,None),('_ice','Лёд',['#55eaff','#7b94ff','#ff82c4']),('_sun','Солнце',['#ffe16a','#ff6b91','#a18cff']),('_neon','Неон',['#9aff78','#4ee6e1','#c48cff'])]
catalog=[]
for key,name,paths,colors,width in bases:
    for index,(suffix,label,alt) in enumerate(variants):
        chosen=colors if index==0 else alt
        if key=='ecg4':
            chosen=[['#ff3655','#ff5f4b','#ff2965','#ff3348'][index]]
        catalog.append({'id':key+suffix,'name':name+(' · '+label if label else ''),'background':'#071721','colors':chosen,'paths':paths,'strokeWidth':width if index==0 else [0,4.8,4,3.4][index]})
assert len(catalog)==16 and len({x['id'] for x in catalog})==16
Path('web-src/identity-v3.json').write_text(json.dumps(catalog,ensure_ascii=False),encoding='utf-8')
polish=Path('scripts/polish-v3.py').read_text(encoding='utf-8')
assert 'assert len(catalog)==5' in polish
polish=polish.replace('assert len(catalog)==5','assert len(catalog)==16',1)
exec(compile(polish,'scripts/polish-v3.py','exec'))
module=Path('web-src/visual-v5.js').read_text(encoding='utf-8')
for name in ['web-src/index.html','app/src/main/assets/index.html']:
    path=Path(name)
    text=path.read_text(encoding='utf-8')
    marker='ensureDemo();applyTheme();'
    assert marker in text
    if '/* VISUAL_V5 */' not in text:
        text=text.replace('/* REFINED_APPEARANCE_V2 */',"window.balansV5Icon=LS.get('balans2.iconSet','outline');\n/* REFINED_APPEARANCE_V2 */",1)
        text=text.replace(marker,'/* VISUAL_V5 */\n'+module+'\n'+marker,1)
    path.write_text(text,encoding='utf-8')
health=Path('app/src/main/java/com/anzor/balans/HealthBridge.kt')
text=health.read_text(encoding='utf-8')
def replace_once(old,new):
    global text
    assert text.count(old)==1,old
    text=text.replace(old,new,1)
replace_once('val warnings = JSONArray()','val warnings = JSONArray()\n                val notices = JSONArray()')
replace_once('readType(hc, type, start, end, output, origins, warnings)','readType(hc, type, start, end, output, origins, warnings, notices)')
replace_once('out: JSONObject, origins: MutableSet<String>, warnings: JSONArray\n    ): Boolean {','out: JSONObject, origins: MutableSet<String>, warnings: JSONArray, notices: JSONArray\n    ): Boolean {')
replace_once('if (reducedDenseSamples) warnings.put(','if (reducedDenseSamples) notices.put(')
replace_once('if (reducedSleepStages) warnings.put(','if (reducedSleepStages) notices.put(')
replace_once('.put("warnings",warnings)','.put("warnings",warnings).put("notices",notices)')
replace_once('var pages = 0','var pages = 0\n        val seenPageTokens = mutableSetOf<String>()')
replace_once('token = response.pageToken','val nextToken = response.pageToken\n            if (!nextToken.isNullOrEmpty() && !seenPageTokens.add(nextToken)) throw IllegalStateException("Health Connect повторил страницу чтения")\n            token = nextToken')
text,count=re.subn(r'if \(pages >= \d+ && !token.isNullOrEmpty\(\)\) \{ pageLimited = true; break \}', '// Read all pages; repeated tokens are rejected above.',text)
assert count==1
assert 'permissions.add(HealthPermission.PERMISSION_READ_HEALTH_DATA_HISTORY)' in text
health.write_text(text,encoding='utf-8')
test=Path('scripts/ui-smoke.cjs')
text=test.read_text(encoding='utf-8').replace('state.icons.length === 4','state.icons.length === 6').replace('ICON_STYLES.length === 4','ICON_STYLES.length === 6').replace('Exactly four icon sets','Exactly six icon sets')
text=text.replace("['outline','emoji','soft','duo']","['outline','emoji','soft','premium-line','premium-round','premium-solid']")
text=text.replace('state.identities.length === 5','state.identities.length === 16').replace('Exactly five launcher choices','Exactly sixteen launcher choices')
anchor="    check('No JavaScript runtime errors', errors.length === 0);"
extra="""    await page.evaluate(() => renderMore());
    check('Manual settings entry removed', await page.locator('#moreList [data-go=manual]').count() === 0);
    await page.evaluate(() => go('export'));
    check('CSV button removed', await page.locator('#pBody [data-x=csv]').count() === 0);
    await page.evaluate(() => go('privacy'));
    check('Privacy access entry removed', await page.locator('#pBody [data-go=sources]').count() === 0);
    await page.evaluate(() => go('sources'));
    check('Separate history button removed', await page.locator('[data-native=hc-history]').count() === 0);
    check('Source app catalogue removed', await page.locator('#srcCard .sources-fold').count() === 0);
    check('Device catalogue removed', await page.locator('#srcList').count() === 0);
    await page.evaluate(() => go('themes'));
"""
assert anchor in text
text=text.replace(anchor,extra+anchor,1)
test.write_text(text,encoding='utf-8')
print('V5 applied: sixteen launchers, six card sets, compact sources, separate notices; real access and read failures retained.')
