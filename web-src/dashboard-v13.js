/* DASHBOARD_V13 */
(function(){
const forbidden=new Set(['temp','skinTemperature','restingHeart','hrv','weight']);
const layouts=[['inline','Кольца в строку'],['thin','Тонкие кольца'],['capsules','Капсулы'],['arcs','Дуги'],['segments','Сегменты'],['type','Типографика']];
HERO_LAYOUTS.splice(0,HERO_LAYOUTS.length,...layouts);
function migrate(){
 state.top.items=[...new Set(state.top.items||[])].filter(id=>byId[id]&&!forbidden.has(id));
 if(!state.top.items.length)state.top.items=['activeCalories','steps','exercise'];
 if(!layouts.some(x=>x[0]===state.top.layout))state.top.layout='inline';
 saveTop();
}
migrate();
const css=document.createElement('style');css.textContent=`
.hero-reorder{display:flex;gap:6px;overflow-x:auto;padding:8px 1px 13px;touch-action:pan-y}
.hero-reorder button{flex:1 0 65px;min-width:0;max-width:105px;min-height:58px;border:1px solid var(--line);border-radius:12px;background:var(--surface);font-size:11px;padding:7px 3px;touch-action:none;user-select:none}
.hero-reorder button.active{outline:2px solid var(--accent);background:var(--surface3)}
.hero-reorder button:before{content:'⠿';display:block;color:var(--muted);font-size:17px}
.activity-metrics[data-layout=capsules] button{position:relative;overflow:hidden;border-radius:18px;background:var(--surface);border:1px solid var(--line);padding:10px 4px 14px}
.activity-metrics[data-layout=capsules] button:after{content:'';position:absolute;left:0;bottom:0;height:4px;width:var(--done);background:var(--tc)}
.hero-arc{width:52px;height:29px;margin:2px auto 5px;overflow:visible}
.hero-segments{display:flex;gap:2px;width:100%;height:13px;margin:6px 0 9px}
.hero-segments i{flex:1;border-radius:2px;background:var(--surface3)}
.hero-segments i.on{background:var(--tc)}
.activity-metrics[data-layout=type] button{position:relative;border-left:3px solid var(--surface3);padding-left:8px;align-items:flex-start;text-align:left;border-radius:0}
.activity-metrics[data-layout=type] button:before{content:'';position:absolute;bottom:0;left:-3px;width:3px;height:var(--done);background:var(--tc)}
.activity-metrics[data-layout=type] b{color:var(--tc);font-weight:750;font-size:calc(24px * var(--ms))}
.activity-metrics[data-layout=type] .metric-copy{align-items:flex-start}
.activity-metrics[data-layout=thin] .metric-ring circle{stroke-width:2.5!important}
.activity-metrics[data-layout=thin] .metric-ring{width:34px;height:34px}
.hero-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.hero-week button{min-width:0;border:1px solid transparent;border-radius:10px;padding:5px 0;color:var(--muted);font-size:11px;background:var(--surface)}
.hero-week button.on{border-color:var(--accent);color:var(--text);background:var(--surface2)}
.hero-week button:disabled{opacity:.35}
.hero-week .activity-glyph{width:100%!important;height:auto!important;filter:none}
.hero-week-figure{display:grid;place-items:center;padding:12px 0}
.hero-week-figure .activity-glyph{width:180px!important;height:180px!important;max-width:65vw;filter:none}
.hero-week-summary{display:grid;grid-template-columns:repeat(var(--count),minmax(0,1fr));gap:6px;margin-bottom:12px}
.hero-week-summary>div{min-width:0;text-align:center;padding:8px 2px;background:var(--surface);border-radius:10px}
.hero-week-summary b{display:block;font-size:16px;overflow-wrap:anywhere}
.hero-week-summary small{font-size:11px;color:var(--muted)}
.hero-explanation{padding:12px;border:1px solid var(--line);border-radius:14px;margin:9px 0;background:var(--surface)}
.hero-explanation p{margin:6px 0;font-size:13px;color:var(--muted)}
#sheet:has(.hero-week){max-height:94%;padding-bottom:24px}
`;document.head.appendChild(css);
const rawGlyph=activityGlyph,cache=new Map();
function alignGlyph(html,activity){
 const key=state.top.style+'|'+html;
 if(cache.has(key))return cache.get(key);
 const host=document.createElement('div');host.style.cssText='position:fixed;left:-10000px;top:0;width:280px;visibility:hidden;pointer-events:none';host.innerHTML=html;document.body.appendChild(host);
 try{
 const svg=host.querySelector('svg.activity-glyph');if(!svg)return html;
 const root=svg.getCTM();if(!root)return html;
 for(const p of svg.querySelectorAll('path[data-goal]')){
  const x=activity.find(x=>x.m.id===p.dataset.goal);if(!x)continue;
  const badge=svg.querySelector('g.hero-goal-badge[data-goal="'+p.dataset.goal+'"]');if(!badge)continue;
  const L=p.getTotalLength();if(!(L>0))continue;
  const matrix=root.inverse().multiply(p.getCTM());
  const origin=new DOMPoint(0,0).matrixTransform(root.inverse().multiply(badge.getCTM()));
  const n=640,local=[],world=[];
  for(let j=0;j<=n;j++){const q=p.getPointAtLength(j*L/n);local.push(q);world.push(new DOMPoint(q.x,q.y).matrixTransform(matrix));}
  let start=0,best=Infinity;
  for(let j=0;j<n;j++){const q=world[j],d=(q.x-origin.x)**2+(q.y-origin.y)**2;if(d<best){best=d;start=j;}}
  const closed=Math.hypot(world[0].x-world[n].x,world[0].y-world[n].y)<2;
  let direction=1;
  if(closed){const f=world[(start+4)%n],r=world[(start-4+n)%n];direction=f.x>=r.x?1:-1;}
  else if(start>n/2)direction=-1;
  const route=[];
  const count=closed?n:(direction>0?n-start:start);
  for(let j=0;j<=count;j++){const index=closed?(start+direction*j+n*2)%n:start+direction*j;route.push(local[index]);}
  if(!route.length)continue;
  p.setAttribute('d','M'+route.map(q=>q.x.toFixed(3)+' '+q.y.toFixed(3)).join(' L')+(closed?' Z':''));
  p.setAttribute('pathLength','100');p.setAttribute('stroke-dasharray',(Math.max(0,Math.min(1,x.p))*100)+' 100');
  p.dataset.fillDirection='badge-right';
  const q=world[start];badge.setAttribute('transform','translate('+q.x+' '+q.y+')');
 }
 const result=svg.outerHTML;if(cache.size>100)cache.clear();cache.set(key,result);return result;
 }finally{host.remove();}
}
activityGlyph=function(style,small=false,a=ACTIVITY()){
 const html=rawGlyph(style,small,a);return small?html:alignGlyph(html,a);
};
const originalTop=renderTopBlock;
function goalFor(m){return ({activeCalories:GOAL.active,steps:GOAL.steps,exercise:60,sleep:GOAL.sleep,water:GOAL.water})[m.id]||0;}
renderTopBlock=function(){
 originalTop();const strip=document.querySelector('#topBlock .activity-metrics');if(!strip)return;
 const layout=state.top.layout;
 for(const button of strip.querySelectorAll('button[data-metric]')){
  const m=byId[button.dataset.metric],v=dashboardCurrent(m),goal=goalFor(m),p=Number.isFinite(v)&&goal>0?Math.max(0,Math.min(1,v/goal)):0,c=getComputedStyle(button).getPropertyValue('--tc').trim()||cv(m);
  button.style.setProperty('--done',(p*100)+'%');
  if(layout==='thin'&&!button.querySelector('.metric-ring')){
   button.querySelector('.metric-semantic')?.remove();button.insertAdjacentHTML('afterbegin','<span class="metric-ring">'+ringSvg2(p,c)+'<em>'+ic(dashboardGoalGlyph(m))+'</em></span>');
  }
  if(layout==='arcs'){
   button.querySelector('.metric-semantic')?.remove();button.insertAdjacentHTML('afterbegin','<svg class="hero-arc" viewBox="0 0 60 34"><path d="M5 29 A25 25 0 0 1 55 29" fill="none" stroke="var(--surface3)" stroke-width="5"/><path d="M5 29 A25 25 0 0 1 55 29" fill="none" stroke="'+c+'" stroke-width="5" pathLength="100" stroke-dasharray="'+(p*100)+' 100"/></svg>');
  }
  if(layout==='segments')button.insertAdjacentHTML('afterbegin','<span class="hero-segments">'+Array.from({length:10},(_,i)=>'<i class="'+(i<p*10?'on':'')+'"></i>').join('')+'</span>');
 }
};
const originalCfg=topCfgSheet;
topCfgSheet=function(anchor){
 originalCfg(anchor);const pop=document.querySelector('#dashboardPopover');if(!pop)return;
 pop.querySelector('[data-dashboard=appearance]')?.remove();
 for(const button of pop.querySelectorAll('[data-dashboard=metric]'))if(forbidden.has(button.dataset.value))button.remove();
 const heading=[...pop.querySelectorAll('.pop-label')].find(n=>n.textContent==='Порядок показателей');
 pop.querySelectorAll('.metric-order-row').forEach(n=>n.remove());
 const order=document.createElement('div');order.className='hero-reorder';order.setAttribute('aria-label','Порядок показателей слева направо');
 order.innerHTML=state.top.items.map(id=>'<button type="button" data-reorder="'+id+'" aria-label="Переместить '+esc(byId[id].name)+'">'+esc(dashboardMetricLabel(byId[id]))+'</button>').join('');
 heading?.after(order);
 let drag=null;
 order.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-reorder]');if(!b)return;drag={id:b.dataset.reorder,x:e.clientX,y:e.clientY,moved:false};b.classList.add('active');b.setPointerCapture(e.pointerId);e.preventDefault();});
 order.addEventListener('pointermove',e=>{
  if(!drag)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;
  const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-reorder]');if(!drag.moved||!target||!order.contains(target)||target.dataset.reorder===drag.id)return;
  const from=state.top.items.indexOf(drag.id),to=state.top.items.indexOf(target.dataset.reorder);state.top.items.splice(to,0,state.top.items.splice(from,1)[0]);
  state.top.items.forEach(id=>order.appendChild(order.querySelector('[data-reorder="'+id+'"]')));saveTop();renderTopBlock();
 });
 const end=()=>{drag=null;order.querySelectorAll('.active').forEach(n=>n.classList.remove('active'));};
 order.addEventListener('pointerup',end);order.addEventListener('pointercancel',end);
 order.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const b=e.target.closest('[data-reorder]');if(!b)return;e.preventDefault();const i=state.top.items.indexOf(b.dataset.reorder),j=i+(e.key==='ArrowLeft'?-1:1);if(j<0||j>=state.top.items.length)return;[state.top.items[i],state.top.items[j]]=[state.top.items[j],state.top.items[i]];saveTop();renderTopBlock();topCfgSheet();document.querySelector('[data-reorder="'+b.dataset.reorder+'"]')?.focus();});
};
const originalSet=topSet;
topSet=function(k,v){if(k==='item'&&forbidden.has(v))return;return originalSet(k,v);};
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function days(){const first=new Date();first.setHours(12,0,0,0);first.setDate(first.getDate()-(first.getDay()+6)%7);return Array.from({length:7},(_,i)=>{const d=new Date(first);d.setDate(d.getDate()+i);return iso(d);});}
function dayValue(m,day){
 if(day>dashboardToday())return NaN;
 const records=recs(m).filter(r=>{if(r.day)return r.day===day;const t=recordTimestamp(r);return Number.isFinite(t)&&iso(new Date(t))===day;});
 if(records.length){const v=records.at(-1).v;return Number.isFinite(v)?v:NaN;}
 return NaN;
}
function dayActivity(day){return ACTIVITY().map(x=>{const value=dayValue(x.m,day);return {...x,value,p:Number.isFinite(value)&&x.goal>0?Math.max(0,Math.min(1,value/x.goal)):0};});}
function mini(day){const box=document.createElement('div');box.innerHTML=activityGlyph(state.top.style,false,dayActivity(day));box.querySelectorAll('.hero-goal-badge').forEach(n=>n.remove());box.querySelector('svg')?.classList.add('small');return box.innerHTML;}
const explanations={steps:'Количество шагов за выбранный день.',activeCalories:'Энергия, потраченная на физическую активность за выбранный день.',exercise:'Продолжительность активных занятий за выбранный день.',distance:'Пройденное расстояние за выбранный день.',sleep:'Продолжительность сна в сохранённой записи за выбранный день.',water:'Объём воды в сохранённой записи за выбранный день.',heart:'Частота пульса в последней сохранённой записи выбранного дня.',spo2:'Насыщение крови кислородом в сохранённой записи выбранного дня.',bp:'Артериальное давление в сохранённой записи выбранного дня.',glucose:'Уровень глюкозы в сохранённой записи выбранного дня.'};
let selectedDay=dashboardToday();
function weekBody(){
 const all=days(),metrics=state.top.items.map(id=>byId[id]).filter(Boolean),values=metrics.map(m=>{const value=dayValue(m,selectedDay),goal=goalFor(m);return {m,value,goal,text:Number.isFinite(value)?show(m,value):'Нет данных'};});
 return '<div class="hero-week">'+all.map((day,i)=>'<button data-hero-day="'+day+'" class="'+(day===selectedDay?'on':'')+'" '+(day>dashboardToday()?'disabled':'')+' aria-pressed="'+(day===selectedDay)+'">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'][i]+mini(day)+'<span>'+Number(day.slice(-2))+'</span></button>').join('')+'</div><div class="hero-week-figure">'+activityGlyph(state.top.style,false,dayActivity(selectedDay))+'</div><p class="pop-foot">'+esc(new Date(selectedDay+'T12:00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'}))+'</p><div class="hero-week-summary" style="--count:'+metrics.length+'">'+values.map(x=>'<div><small>'+esc(dashboardMetricLabel(x.m))+'</small><b>'+esc(x.text)+'</b><small>'+esc(x.m.unit)+(x.goal?' · цель '+fmt(x.goal):'')+'</small></div>').join('')+'</div>'+values.map(x=>'<section class="hero-explanation"><b>'+esc(x.m.name)+'</b><p>'+esc(explanations[x.m.id]||'Сохранённый показатель за выбранный день.')+'</p><p>'+esc(x.text)+' '+(Number.isFinite(x.value)?esc(x.m.unit):'')+(x.goal&&Number.isFinite(x.value)?' · '+Math.round(x.value/x.goal*100)+'% от текущей цели':'')+'</p></section>').join('')+'<p class="pop-foot">Показаны сохранённые дневные значения или последняя запись за день. Отсутствующие данные не подставляются. Цели используются из текущих настроек.</p>';
}
activityDetails=function(){closeDashboardPopover();selectedDay=dashboardToday();sheet(sheetHd('Активность за неделю','Выберите день')+'<div id="heroWeekBody">'+weekBody()+'</div>');};
document.addEventListener('click',e=>{const b=e.target.closest('[data-hero-day]');if(!b||b.disabled)return;e.preventDefault();e.stopImmediatePropagation();selectedDay=b.dataset.heroDay;document.querySelector('#heroWeekBody').innerHTML=weekBody();},true);
window.BalansDashboardV13={dayValue,dayActivity,layouts:()=>HERO_LAYOUTS.map(x=>x[0])};
})();
