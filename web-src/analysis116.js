/* Period-aware analysis. Raw records remain the source of statistics and exports.
   Plot buckets never invent zeroes for missing dates or extrapolate history. */
function periodWindow(p,previous=false){
 const now=new Date(),days={day:1,week:7,month:30,'6m':183,year:366,all:36500}[p]||7;
 const end=previous?new Date(now.getFullYear(),now.getMonth(),now.getDate()-(days-1)).getTime()-1:Date.now();
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(previous?2*days-1:days-1)).getTime();
 return {start,end};
}
const periodDate=ts=>new Date(ts).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'});
const legendBefore116=bigLegend;
bigLegend=function(m,p){
 if(!p)return legendBefore116(m);
 if(m.id==='sleep')return metricChartRecords(m,p).at(-1)?.stages?.length?legendBefore116(m):'';
 if(m.id==='bp')return '<span>Средние верхнего и нижнего давления рассчитаны по переданным значениям каждого типа. Отсутствующее нижнее не вычисляется.</span>';
 return legendBefore116(m);
};
function periodLower(m,p){
 const a=metricRecords(m,p).map(r=>r.lo).filter(Number.isFinite);
 return a.length?avg(a):undefined;
}
function chartBucket(p){return p==='year'||p==='all'?'month':p==='6m'?'week':p==='day'?'hour':'day'}
const chartPeriodCache=new Map();
function metricChartRecords(m,p,previous=false){
 const rows=metricRecords(m,p,previous),key=m.id+':'+p+':'+previous,old=chartPeriodCache.get(key);
 if(old?.rows===rows)return old.result;
 const resolution=chartBucket(p),buckets=new Map();
 for(const r of rows){
  const d=new Date(recordTimestamp(r));
  if(resolution==='month')d.setDate(1);
  if(resolution==='week')d.setDate(d.getDate()-(d.getDay()+6)%7);
  if(resolution==='hour')d.setMinutes(0,0,0);else d.setHours(0,0,0,0);
  const k=d.getTime();if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(r);
 }
 const result=[...buckets.entries()].sort((a,b)=>a[0]-b[0]).map(([start,rs])=>{
  if(rs.length===1)return rs[0];
  // Keep daily-goal charts in daily units, even on a month/week scale.
  // Distance alone uses interval totals for its original cumulative route.
  const lo=rs.map(r=>r.lo).filter(Number.isFinite),sum=m.id==='distance';
  const out={...rs.at(-1),v:sum?rs.reduce((s,r)=>s+r.v,0):avg(rs.map(r=>r.v)),
   bucketStart:start,bucketEnd:recordTimestamp(rs.at(-1)),sampleCount:rs.length,
   aggregate:sum?'sum':'mean'};
  if(lo.length)out.lo=avg(lo);else delete out.lo;
  // A multi-session average has no single actual sleep-stage timeline.
  if(m.id==='sleep'){delete out.stages;delete out.sleepKind}
  return out;
 });
 chartPeriodCache.set(key,{rows,result});return result;
}
function periodCoverage(m,p){
 const rows=metricRecords(m,p),resolution=chartBucket(p);
 if(!rows.length)return 'За выбранный период нет сохранённых измерений.';
 const days=new Set(rows.map(r=>r.day||localDay(recordTimestamp(r)))).size;
 const scale={hour:'по часам',day:'по дням',week:'по неделям',month:'по месяцам'}[resolution];
 const operation=m.id==='distance'?'суммы':DAILY_METRICS.has(m.id)?'среднее за учтённый день':'средние измерений';
 return `${periodDate(recordTimestamp(rows[0]))} – ${periodDate(recordTimestamp(rows.at(-1)))} · записей: ${rows.length}, дней с данными: ${days} · график: ${operation} ${scale}. Пропуски не считаются нулём.`;
}
function periodChange(m,p){
 const a=metricRecords(m,p).map(r=>r.v),b=metricRecords(m,p,true).map(r=>r.v);
 if(!a.length||!b.length)return {text:'Нет данных для сравнения с предыдущим периодом',short:'—',cls:''};
 const before=avg(b),current=avg(a);
 if(before===0)return {text:'Предыдущее среднее равно нулю; процент не рассчитывается',short:'—',cls:''};
 const d=(current-before)/Math.abs(before)*100,short=Math.abs(d)<.5?'≈':(d>0?'+':'−')+fmt(Math.abs(d),1)+'%';
 return {text:`${short} к среднему предыдущего периода · записей: ${b.length}`,short,cls:d>0?'tr-up':d<0?'tr-dn':''};
}
drawChart=function(m,p,compare=false){
 const raw=metricRecords(m,p),previous=compare?metricRecords(m,p,true):null;
 let svg=renderRealVisual(m,W,H,metricChartRecords(m,p),false);
 if(previous)svg=`<div class="chart-comparison"><div><small>Текущий период</small>${svg}</div><div><small>Предыдущий период</small>${renderRealVisual(m,W,H,metricChartRecords(m,p,true),false)}</div></div>`;
 return {svg:`<div data-chart-period="${p}" data-chart-bucket="${chartBucket(p)}">${svg}</div>`,v:raw.map(r=>r.v),p:previous?.map(r=>r.v)||null,noSel:true};
};
renderDynamics=function(){
 renderHeat();
 $('#periods').innerHTML=PERIODS.map(([k,l])=>`<button data-period="${k}" class="${state.period===k?'on':''}">${l}</button>`).join('');
 let report=$('#dynamicsReport');
 if(!report){report=document.createElement('button');report.id='dynamicsReport';report.className='btn ghost dynamics-report';report.dataset.openReport='';$('#periods').after(report)}
 report.innerHTML=ic('i-file')+'Отчёт о показателях';
 if(!avail(byId[state.metric])){if(!AV().length){$('#cats').innerHTML='';$('#dynCard').innerHTML='<div class="emptybox">Нет сохранённых показателей.<button class="btn" data-act="add">Добавить показатель</button></div>';$('#picker').innerHTML='<span class="t">Выберите показатель после добавления данных</span>';return}state.metric=AV()[0].id}
 const cs=Object.keys(CATS).filter(c=>AV().some(m=>m.cat===c));if(!cs.includes(state.cat))state.cat='Все';
 $('#cats').innerHTML=['Все',...cs].map(c=>`<button class="chip ${state.cat===c?'on':''}" data-cat="${c}">${c}</button>`).join('');
 const m=byId[state.metric],canCmp=['bar','line'].includes(m.chart),r=drawChart(m,state.period,state.cmp&&canCmp);
 $('#picker').style.setProperty('--c',cv(m));$('#dynCard').style.setProperty('--c',cv(m));
 $('#picker').innerHTML=`<span class="ic">${ic(mic(m))}</span><span class="t"><small>Показатель · ${m.cat}</small><b>${esc(m.name)}</b></span>${ic('i-down','i chev')}`;
 const sum=DAILY_METRICS.has(m.id)&&state.period==='day',v=r.v;
 const big=v.length?(sum?v.reduce((a,b)=>a+b,0):avg(v)):NaN;
 $('#dynCard').innerHTML=`
 <div class="period-caption">${sum?'Всего за день':'Среднее за выбранный период'}</div>
 <div class="big num">${show(m,big,periodLower(m,state.period))}${m.id!=='sleep'?`<small>${m.unit}</small>`:''}</div>
 <p class="period-coverage">${esc(periodCoverage(m,state.period))}</p>
 <div class="delta">${esc(periodChange(m,state.period).text)}</div>
 <div class="chart">${r.svg}</div><div class="legend">${bigLegend(m,state.period)}</div>
 <div class="stats">${metricSummary(m,state.period).map(([a,b])=>`<div class="stat"><small>${a}</small><b class="num">${b}</b></div>`).join('')}</div>
 ${canCmp?`<button class="toggle" data-act="cmp" aria-pressed="${state.cmp}"><span>Сравнить с предыдущим периодом</span><span class="sw ${state.cmp?'on':''}"></span></button>`:''}`;
};

/* Touchable, labelled record coverage, not a medical score. */
let heatSelectedDay=null,heatModel=null;
renderHeat=function(){
 const el=$('#heat');if(!el)return;
 const rows=M.map(m=>recs(m)),today=localDay();
 if(!heatModel||heatModel.day!==today||rows.some((r,i)=>r!==heatModel.rows[i])){
  const dates=Array.from({length:28},(_,i)=>{const d=new Date();d.setDate(d.getDate()-27+i);return localDay(d)});
  const entries=new Map(dates.map(d=>[d,{metrics:new Set(),records:0}]));
  rows.forEach((rs,i)=>{for(const r of rs){if(!Number.isFinite(r.v))continue;const day=r.day||localDay(recordTimestamp(r)),entry=entries.get(day);if(entry){entry.metrics.add(M[i].id);entry.records++}}});
  heatModel={day:today,rows,dates,entries};
 }
 const {dates,entries}=heatModel;
 if(!entries.has(heatSelectedDay))heatSelectedDay=dates.filter(d=>entries.get(d).metrics.size).at(-1)||today;
 el.innerHTML=dates.map(day=>{
  const n=entries.get(day).metrics.size,p=n/M.length,selected=day===heatSelectedDay;
  const title=`${day}: ${n?'показателей с записями: '+n:'нет данных'}`;
  return `<button class="heat-day${selected?' selected':''}" data-heat-day="${day}" aria-pressed="${selected}" aria-label="${title}"><i class="${!n?'':p<.35?'l1':p<.75?'l2':'l3'}" title="${title}"><span>${Number(day.slice(-2))}</span><b>${n||'—'}</b></i></button>`;
 }).join('');
 let detail=$('#heatDetails');
 if(!detail){detail=document.createElement('div');detail.id='heatDetails';detail.setAttribute('aria-live','polite');el.after(detail)}
 const chosen=entries.get(heatSelectedDay),activeDays=dates.filter(d=>entries.get(d).metrics.size).length;
 detail.innerHTML=`<p class="period-coverage">За 28 дней: ${activeDays} дней с записями. В клетке: число и количество показателей.</p><b>${periodDate(new Date(heatSelectedDay+'T12:00:00').getTime())}</b><p>${chosen.metrics.size?`${chosen.metrics.size} показателей · ${chosen.records} записей`:'Нет сохранённых записей за этот день'}</p><div class="heat-metrics">${[...chosen.metrics].map(id=>`<button class="chip" data-metric="${id}">${ic(mic(byId[id]))}${esc(byId[id].name)}</button>`).join('')}</div>`;
};

/* One report implementation for screen, text and downloadable HTML. */
const reportPeriodLabel=p=>PERIODS.find(x=>x[0]===p)?.[1]||'Неделя';
function reportDiary(){const w=periodWindow(state.rperiod),start=localDay(w.start),end=localDay(w.end);return state.diary.filter(d=>d.d>=start&&d.d<=end).slice().sort((a,b)=>b.d.localeCompare(a.d))}
function reportLimits(){
 const h=state.healthInfo||{},parts=[];
 if(h.range?.historyLimited)parts.push('Health Connect ограничил доступ к старой истории.');
 if(h.range?.truncated)parts.push('Часть истории усечена лимитом чтения.');
 if(h.warnings?.length)parts.push(`Ограничений последнего чтения: ${h.warnings.length}. Подробности в «Источниках».`);
 if(h.sampling)parts.push('Частые датчики: до одной фактической точки в час за последние 30 дней и в 6 часов за более старые дни. Минимум и максимум относятся к сохранённой выборке.');
 return parts.join(' ');
}
reportRows=function(){return M.filter(m=>metricRecords(m,state.rperiod).length).map(m=>{
 const rows=metricRecords(m,state.rperiod),stats=metricSummary(m,state.rperiod),change=periodChange(m,state.rperiod);
 return {id:m.id,n:m.name,a:stats[0][1]+(m.id==='sleep'?'':' '+m.unit),r:`${stats[1][1]}–${stats[2][1]}`,t:change.short,c:change.cls,count:rows.length,
  days:new Set(rows.map(r=>r.day||localDay(recordTimestamp(r)))).size,
  range:`${periodDate(recordTimestamp(rows[0]))} – ${periodDate(recordTimestamp(rows.at(-1)))}`};
})};
function reportTable(rows){
 return `<div class="report-scroll"><table class="rtab"><thead><tr><th>Показатель / данные</th><th>Среднее</th><th>Мин–макс</th><th>К пред. периоду</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.n)}<small>${r.count} записей · ${r.days} дней<br>${esc(r.range)}</small></td><td data-label="Среднее">${esc(r.a)}</td><td data-label="Мин–макс">${r.r.split('–').map(s=>`<span class="report-number">${esc(s)}</span>`).join(' – ')}</td><td data-label="К пред. периоду">${esc(r.t)}</td></tr>`).join('')||'<tr><td colspan="4">За выбранный период нет сохранённых измерений.</td></tr>'}</tbody></table></div>`;
}
MPAGES.report={t:'Отчёт о показателях',tab:'dynamics',r(){
 const diary=reportDiary(),w=periodWindow(state.rperiod);
 return `<div class="seg report-periods">${PERIODS.map(([k,l])=>`<button data-x="rper" data-a="${k}" class="${state.rperiod===k?'on':''}">${l}</button>`).join('')}</div>
 <div class="card"><b>${reportPeriodLabel(state.rperiod)}</b><p class="period-coverage">${state.rperiod==='all'?'Все сохранённые даты':periodDate(w.start)+' – '+periodDate(w.end)} · ${esc(state.prof.name||'')}</p>${reportLimits()?`<p class="period-coverage">${esc(reportLimits())}</p>`:''}${reportTable(reportRows())}</div>
 ${diary.length?`<div class="card" style="margin-top:10px"><b>Дневник за выбранный период</b>${diary.map(d=>`<div class="drow"><span class="k">${dRu(d.d)}</span><span>${esc(d.t)}</span></div>`).join('')}</div>`:''}
 <div class="btnrow"><button class="btn" data-x="repSave">${ic('i-dl')}Сохранить</button><button class="btn ghost" data-x="repShare">Поделиться</button></div>
 <p class="foot">Среднее, минимум и максимум рассчитаны по фактическим записям; отсутствующие дни не заменяются нулями. Тренд сравнивает средние двух равных по длительности периодов, если есть обе выборки. Дневные итоги не складываются повторно. Не является медицинским заключением.</p>`;
}};
reportText=function(){
 return `Баланс · Отчёт о показателях · ${reportPeriodLabel(state.rperiod)}\n${state.prof.name||''}\n`+
 reportRows().map(r=>`${r.n}: среднее ${r.a}; мин–макс ${r.r}; ${r.count} записей, ${r.days} дней; ${r.range}; к предыдущему периоду ${r.t}`).join('\n')+
 '\n\nДневник:\n'+reportDiary().map(d=>`${dRu(d.d)}: ${d.t}`).join('\n')+
 '\n\n'+reportLimits()+'\nТолько фактические записи, пропуски не считаются нулём. Не является медицинским заключением.';
};
reportHTML=function(){
 const diary=reportDiary();
 return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Отчёт о показателях · Баланс</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:960px;margin:30px auto;padding:16px;color:#18212c}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #ccd2da}small{display:block;color:#566475}.report-scroll{overflow:auto}footer{margin-top:24px;color:#566475}</style></head><body><h1>Отчёт о показателях</h1><p>${esc(state.prof.name||'')} · ${reportPeriodLabel(state.rperiod)} · ${new Date().toLocaleDateString('ru-RU')}</p>${reportTable(reportRows())}${diary.length?`<h2>Дневник за выбранный период</h2>${diary.map(d=>`<p>${dRu(d.d)}: ${esc(d.t)}</p>`).join('')}`:''}<footer>Среднее и диапазон по сохранённым записям. Пропуски не заменены нулями. Сравнение со средним предыдущего равного периода при наличии данных. Источники: разрешённые записи Health Connect, Bluetooth и ручные записи при наличии. Не является медицинским заключением.</footer></body></html>`;
};
for(const group of MORE)group[1]=group[1].filter(x=>x[0]!=='report');
MORE.find(g=>g[0]==='Отчёты и помощь')[0]='Помощь и безопасность';
document.addEventListener('click',e=>{
 const h=e.target.closest('[data-heat-day]');if(h){heatSelectedDay=h.dataset.heatDay;renderHeat();return}
 if(e.target.closest('[data-open-report]')){state.rperiod=state.period;go('report')}
});
const style116=document.createElement('style');
style116.textContent=`
.period-coverage,.period-caption{font-size:var(--fs-xs);color:var(--muted);line-height:1.5;overflow-wrap:anywhere}
.report-number{white-space:nowrap}
@media(max-width:480px){.report-scroll .rtab{display:block;min-width:0;width:100%}.report-scroll thead{display:none}.report-scroll tbody{display:block}.report-scroll tr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 0;border-bottom:1px solid var(--line)}.report-scroll td{display:block;min-width:0;padding:3px 0;border:0;overflow-wrap:anywhere}.report-scroll td:first-child{grid-column:1/-1;font-size:var(--fs-s);font-weight:700}.report-scroll td small{font-weight:400}.report-scroll td[data-label]::before{content:attr(data-label);display:block;font-size:10px;color:var(--muted);margin-bottom:4px}.report-scroll td[colspan]{grid-column:1/-1}}
.dynamics-report{margin:10px 0;width:100%;justify-content:center}.heat-day{padding:0;border:2px solid transparent;border-radius:9px;background:none;color:var(--text);min-width:0}.heat-day.selected{border-color:var(--accent)}.heat i{display:flex;flex-direction:column;justify-content:space-between;padding:4px 5px;font-style:normal;box-sizing:border-box}.heat i span{font-size:10px;opacity:.9}.heat i b{font-size:15px;text-align:right;color:var(--text)}#heatDetails>p{margin:7px 0}.heat-metrics{display:flex;flex-wrap:wrap;gap:5px}.heat-metrics .chip{display:flex;align-items:center;gap:4px;font-size:11px;padding:5px 7px}.heat-metrics .i{width:15px;height:15px}.report-periods{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:12px}.report-scroll{max-width:100%;overflow:auto;overscroll-behavior:contain}.rtab td{vertical-align:top}.rtab small{display:block;font-size:10px;color:var(--muted);line-height:1.4;margin-top:4px}.report-scroll .rtab{min-width:350px}.report-scroll th{white-space:normal}
@media(max-width:480px){.report-scroll table.rtab{min-width:0}}
`;
document.head.appendChild(style116);
