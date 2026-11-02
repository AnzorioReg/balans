/* BALANS_PERIOD_CHART_FIX_V1 */
(function(){
  const bucketLabel=(t,p)=>{const d=new Date(t);
    if(p==='day')return String(d.getHours()).padStart(2,'0')+':00';
    if(p==='week'||p==='month')return d.getDate()+' '+MON[d.getMonth()];
    if(p==='6m')return MON[d.getMonth()];
    return MON[d.getMonth()]+' '+String(d.getFullYear()).slice(2);
  };
  const chartFor=m=>({bar:chartBar,line:chartLine,range:chartRange,sleep:chartSleep,ring:chartRing}[m.chart]);
  drawChart=function(m,period,cmp=false){
    const rows=metricChartRecords(m,period);
    const prev=cmp&&['bar','line'].includes(m.chart)?metricChartRecords(m,period,true):null;
    const v=rows.map(r=>r.v);
    const lb=rows.map(r=>bucketLabel(r.bucketStart??recordTimestamp(r),period));
    const fn=chartFor(m);
    const current=fn(m,v,prev?prev.map(r=>r.v):null,lb);
    let svg=current;
    if(prev){
      const old=fn(m,prev.map(r=>r.v),null,prev.map(r=>bucketLabel(r.bucketStart??recordTimestamp(r),period)));
      svg='<div class="chart-comparison"><div><small>Текущий период</small>'+current+'</div><div><small>Предыдущий период</small>'+old+'</div></div>';
    }
    return {svg:'<div data-chart-period="'+period+'">'+svg+'</div>',v:v,p:prev?prev.map(r=>r.v):null,noSel:true};
  };
  vizBig=function(m,period){return drawChart(m,period,false)};
})();
