/* METRICS_V15 */
(function(){
const daily=new Set(['steps','distance','activeCalories','totalCalories','exercise','floors','elevation','water','nutrition']);
function rowDay(r){if(/^\d{4}-\d{2}-\d{2}$/.test(r.day||''))return r.day;const t=recordTimestamp(r);return Number.isFinite(t)?localDay(t):null;}
function latest(rows){return rows.filter(r=>Number.isFinite(r.v)).reduce((a,b)=>!a||(recordTimestamp(b)||0)>=(recordTimestamp(a)||0)?b:a,null);}
function record(m,day){
 if(day>dashboardToday())return null;
 if(daily.has(m.id)){
  const aggregate=latest((state.deviceData?.[m.id]||[]).filter(r=>r.day===day));
  if(aggregate)return aggregate;
  const manual=latest((state.manual[m.id]?.rec||[]).filter(r=>rowDay(r)===day));
  if(manual)return manual;
  return latest((state.bleData?.[m.id]||[]).filter(r=>r.day===day));
 }
 return latest(recs(m).filter(r=>rowDay(r)===day));
}
function current(m){
 if(daily.has(m.id)){const r=record(m,dashboardToday());return r?r.v:demoOn()&&m.has?m.base:NaN;}
 const r=latest(recs(m));return r?r.v:demoOn()&&m.has?m.base:NaN;
}
function goal(m){const key=window.BalansDashboardV14?.goalConfig(m.id)?.key||({steps:'steps',sleep:'sleep',water:'water',activeCalories:'active',exercise:'exercise',distance:'distance',floors:'floors',mindfulness:'mindfulness'})[m.id];const v=key?Number(GOAL[key]):NaN;return v>0?v:null;}
function valueForDay(m,day){const r=record(m,day);return r?r.v:NaN;}
function activity(day){return state.top.items.slice(0,3).map(id=>byId[id]).filter(Boolean).map(m=>{const value=day?valueForDay(m,day):daily.has(m.id)?current(m):valueForDay(m,dashboardToday()),target=goal(m);return {m,value,goal:target,p:Number.isFinite(value)&&target?Math.max(0,Math.min(1,value/target)):0,c:cv(m),noGoal:!target};});}
window.BalansMetricsV15={current,record,goal,activity,valueForDay};
dashboardCurrent=function(m){return daily.has(m.id)?current(m):valueForDay(m,dashboardToday());};
showCur=function(m){const value=current(m),r=daily.has(m.id)?record(m,dashboardToday()):latest(recs(m));return show(m,value,r?.lo);};
const beforeRecords=metricRecords;
metricRecords=function(m,period='week',prev=false){const result=beforeRecords(m,period,prev);if(!daily.has(m.id))return result;return [...new Set(result.map(rowDay).filter(Boolean))].map(day=>record(m,day)).filter(Boolean);};
const beforeCfg=topCfgSheet;
topCfgSheet=function(anchor){beforeCfg(anchor);const pop=document.querySelector('#dashboardPopover');if(!pop)return;pop.querySelector('.hero-palette-options')?.remove();pop.querySelector('.hero-style-options')?.insertAdjacentHTML('afterend','<p class="pop-foot">Цвета фигуры совпадают с цветами показателей. Три полосы показывают первые три выбранных показателя в указанном порядке.</p>');};
const beforeBadge=dashboardGoalBadge;
dashboardGoalBadge=function(x,px,py,small){const html=beforeBadge(x,px,py,small);if(!x.noGoal||small)return html;return html.replace('<circle','<title>'+esc(x.m.name)+': цель не предусмотрена</title><circle');};
let lastAttempt=0;
function refreshToday(){if(document.hidden||!state.hc.on||healthBusy||!window.BalansHealth?.syncRange)return;const now=Date.now();if(now-lastAttempt<60000||now-(state.healthInfo.at||0)<60000)return;lastAttempt=now;try{window.BalansHealth.syncRange(2);}catch(e){window.onNativeStatus?.('Не удалось обновить Health Connect: '+e.message);}}
document.addEventListener('visibilitychange',refreshToday);window.addEventListener('focus',refreshToday);setInterval(refreshToday,60000);
})();
