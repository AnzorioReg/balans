import re
import subprocess
from pathlib import Path

prior = subprocess.run(['git','show','23fa68711fdd1b4334ad389e52cc1b24f2d60332:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(prior,'dashboard-v14-base.py','exec'),globals())
module15 = Path('web-src/metrics-v15.js').read_text(encoding='utf-8')
for name in ['web-src/index.html','app/src/main/assets/index.html']:
 p = Path(name)
 text = p.read_text(encoding='utf-8')
 match = re.search(r'const ACTIVITY=.*?;\n',text)
 assert match, 'Activity binding missing'
 old = match.group(0)
 text = text.replace(old,old.replace('const ACTIVITY=','const activityBeforeV15=',1)+'const ACTIVITY=()=>window.BalansMetricsV15?window.BalansMetricsV15.activity():activityBeforeV15();\n',1)
 match = re.search(r'const cur=m=>.*?;\n',text)
 assert match, 'Current value binding missing'
 old = match.group(0)
 text = text.replace(old,old.replace('const cur=','const currentBeforeV15=',1)+'const cur=m=>window.BalansMetricsV15?window.BalansMetricsV15.current(m):currentBeforeV15(m);\n',1)
 text,count = re.subn(r'function dayValue\(m,day\)\{.*?\n\}', 'function dayValue(m,day){return window.BalansMetricsV15.valueForDay(m,day);}',text,count=1,flags=re.S)
 assert count==1
 text,count = re.subn(r'function dayActivity\(day\)\{[^\n]*\}', 'function dayActivity(day){return window.BalansMetricsV15.activity(day);}',text,count=1)
 assert count==1
 marker = 'ensureDemo();applyTheme();'
 assert text.count(marker)==1
 p.write_text(text.replace(marker,module15+'\n'+marker,1),encoding='utf-8')
health = Path('app/src/main/java/com/anzor/balans/HealthBridge.kt')
text = health.read_text(encoding='utf-8')
needle = 'import androidx.health.connect.client.request.AggregateGroupByPeriodRequest'
assert text.count(needle)==1
text = text.replace(needle,needle+'\nimport androidx.health.connect.client.request.AggregateRequest',1)
needle = '            for (id in listOf("steps", "distance", "activeCalories", "totalCalories", "water","nutrition","exercise","floors","elevation")) {'
assert text.count(needle)==1
native_insert = '''            // Today is read separately: AggregateRequest includes the unfiltered HC total,
            // including supported on-device steps, without adding overlapping sources ourselves.
            val today = end.atZone(zone).toLocalDate()
            val todayStart = maxOf(start,today.atStartOfDay(zone).toInstant())
            if (todayStart < end) {
                fun replaceToday(id: String, value: Double?) {
                    val old = daily.optJSONArray(id) ?: JSONArray()
                    val rows = JSONArray()
                    for (i in 0 until old.length()) {
                        val row = old.getJSONObject(i)
                        if (row.optString("day") != today.toString()) rows.put(row)
                    }
                    if (value != null && value.isFinite()) rows.put(JSONObject()
                        .put("id","day:$today").put("v",value)
                        .put("ts",end.minusMillis(1).toEpochMilli()).put("day",today.toString())
                        .put("source","Health Connect").put("aggregation","aggregate")
                        .put("queryStart",todayStart.toEpochMilli()).put("queryEnd",end.toEpochMilli())
                        .put("timezone",zone.id))
                    daily.put(id,rows)
                }
                try {
                    currentCoroutineContext().ensureActive()
                    val result = hc.aggregate(AggregateRequest(metrics,TimeRangeFilter.between(todayStart,end)))
                    result.dataOrigins.forEach { origins.add(it.packageName) }
                    replaceToday("steps",result[StepsRecord.COUNT_TOTAL]?.toDouble())
                    replaceToday("distance",result[DistanceRecord.DISTANCE_TOTAL]?.inKilometers)
                    replaceToday("activeCalories",result[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories)
                    replaceToday("totalCalories",result[TotalCaloriesBurnedRecord.ENERGY_TOTAL]?.inKilocalories)
                    replaceToday("water",result[HydrationRecord.VOLUME_TOTAL]?.inMilliliters)
                    replaceToday("nutrition",result[NutritionRecord.ENERGY_TOTAL]?.inKilocalories)
                    replaceToday("exercise",result[ExerciseSessionRecord.EXERCISE_DURATION_TOTAL]?.seconds?.div(60.0))
                    replaceToday("floors",result[FloorsClimbedRecord.FLOORS_CLIMBED_TOTAL])
                    replaceToday("elevation",result[ElevationGainedRecord.ELEVATION_GAINED_TOTAL]?.inMeters)
                } catch (e: CancellationException) { throw e }
                catch (e: Exception) {
                    warnings.put("Обновление итогов за сегодня: ${e.localizedMessage}")
                    if (StepsRecord.COUNT_TOTAL in metrics) {
                        try {
                            val result = hc.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL),TimeRangeFilter.between(todayStart,end)))
                            result.dataOrigins.forEach { origins.add(it.packageName) }
                            replaceToday("steps",result[StepsRecord.COUNT_TOTAL]?.toDouble())
                        } catch (cancel: CancellationException) { throw cancel }
                        catch (failure: Exception) { warnings.put("Шаги за сегодня не обновлены: ${failure.localizedMessage}") }
                    }
                }
            }
'''
health.write_text(text.replace(needle,native_insert+needle,1),encoding='utf-8')
check = Path('scripts/menu-check.cjs')
text = check.read_text(encoding='utf-8')
anchor = '   await page.close();'
assert text.count(anchor)==1
extra = '''
   await page.evaluate(()=>{
    const api=window.BalansMetricsV15;
    if(!api)throw new Error('Metrics V15 missing');
    const saved={items:state.top.items,device:state.deviceData,manual:state.manual,ble:state.bleData,steps:GOAL.steps,demo:state.demo};
    try{
     state.demo=false;const day=dashboardToday(),ts=Date.now()-100;
     state.top.items=['steps','bp','heart'];GOAL.steps=10000;
     state.deviceData={steps:[{day,ts:ts-1000,v:5000,source:'Health Connect',id:'day:'+day}],bp:[{ts,v:120,lo:80,source:'test'}],heart:[{ts,v:72,source:'test'}]};
     state.manual={steps:{rec:[{day,ts,v:139}]}};state.bleData={};
     if(cur(byId.steps)!==5000||dashboardCurrent(byId.steps)!==5000)throw new Error('Daily HC total replaced by latest partial record');
     const a=ACTIVITY();
     if(a.map(x=>x.m.id).join(',')!=='steps,bp,heart')throw new Error('Figure ignores selected metrics');
     if(a[0].goal!==10000||a[0].p!==.5)throw new Error('5000 / 10000 must fill exactly half');
     if(a.some(x=>x.c!==cv(x.m)))throw new Error('Figure colors differ from metric colors');
     if(a[1].p!==0||a[1].goal!==null||!a[1].noGoal)throw new Error('Blood pressure must not have invented completion');
     const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
     if(Number.isFinite(api.valueForDay(byId.steps,localDay(yesterday))))throw new Error('Today value copied into missing history');
    }finally{state.top.items=saved.items;state.deviceData=saved.device;state.manual=saved.manual;state.bleData=saved.ble;GOAL.steps=saved.steps;state.demo=saved.demo;}
    renderTopBlock();
   });
'''
check.write_text(text.replace(anchor,extra+anchor,1),encoding='utf-8')
print('V15: unfiltered HC today aggregate; canonical daily totals; selected metric colors and goal ratios.')
