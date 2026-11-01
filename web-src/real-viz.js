/* Shared, data-driven visual language. Styling never enables synthetic samples. */
const DAILY_METRICS=new Set(['steps','distance','activeCalories','totalCalories','exercise','floors','elevation','water','nutrition']);
function localDay(value=Date.now()){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const periodCache=new Map(),visualCache=new Map();
function metricRecords(m,period='week',prev=false){
 const rows=recs(m),key=m.id+':'+period+':'+prev,stamp=Math.floor(Date.now()/30000),old=periodCache.get(key);
 if(old?.rows===rows&&old.stamp===stamp)return old.result;
 const now=new Date(),days={day:1,week:7,month:30,'6m':183,year:366,all:36500}[period]||30;
 let until=Date.now(),since=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(days-1)).getTime();
 if(prev){until=since-1;since=new Date(now.getFullYear(),now.getMonth(),now.getDate()-(2*days-1)).getTime()}
 let result=rows.filter(r=>Number.isFinite(r.v)&&recordTimestamp(r)>=since&&recordTimestamp(r)<=until);
 if(DAILY_METRICS.has(m.id)){
   const daily=new Map();result.forEach(r=>daily.set(r.day||localDay(recordTimestamp(r)),r));result=[...daily.values()];
 }
 periodCache.set(key,{rows,stamp,result});return result;
}
series=function(m,p,prev=false){return metricRecords(m,p,prev).map(r=>r.v)};
const VISUAL_STYLES=[['signature','Авторские','Прежние диаграммы из исходного оформления'],['aurora','Сияние','Градиенты и мягкая заливка'],['capsule','Насыщенные','Чёткие формы и плотный цвет'],['points','Контурные','Яркие контуры и метки']];
const ICON_STYLES=[['classic','Классика'],['outline','Контур'],['soft','Мягкие'],['duo','Два цвета']];
state.chartSet=LS.get('balans2.chartSet','signature');state.iconSet=LS.get('balans2.iconSet','classic');
if(!VISUAL_STYLES.some(x=>x[0]===state.chartSet))state.chartSet='signature';
if(!ICON_STYLES.some(x=>x[0]===state.iconSet))state.iconSet='classic';
if(LS.get('balans2.originalAuthorDesign',0)!==1){
 state.chartSet='signature';LS.set('balans2.chartSet','signature');LS.set('balans2.originalAuthorDesign',1);
}
function visualPrefs(){document.documentElement.dataset.chartSet=state.chartSet;document.documentElement.dataset.iconSet=state.iconSet}
const cardGlyphOriginal=mic;
mic=function(m){const id=cardGlyphOriginal(m);return state.iconSet==='outline'?'o-'+id:state.iconSet==='duo'?'d-'+id:id};
function installCardGlyphs(){
 const holder=document.querySelector('svg[aria-hidden="true"] defs')||document.querySelector('svg defs');
 const symbols=[...document.querySelectorAll('symbol[id^="i-"]')];if(!symbols.length)return;
 const target=holder||symbols[0].parentNode;
 symbols.forEach(s=>{
   for(const prefix of ['o-','d-']){
     const c=s.cloneNode(true);c.id=prefix+s.id;c.setAttribute('stroke-width',prefix==='o-'?'1.35':'2.4');
     c.querySelectorAll('[stroke-width]').forEach(p=>p.setAttribute('stroke-width',prefix==='o-'?'1.35':'2.4'));
     if(prefix==='d-')c.querySelectorAll('path,circle,rect,ellipse').forEach((p,i)=>{if(i%2===0){p.setAttribute('fill','currentColor');p.setAttribute('fill-opacity','.22')}});
     target.appendChild(c);
   }
 });
}
function chartColors(m){return PAL[m.id]||[`var(${CATS[m.cat].c})`,`var(${CATS[m.cat].c})`]}
function metricGoal(m){return {steps:GOAL.steps,water:GOAL.water,sleep:GOAL.sleep,activeCalories:GOAL.active,exercise:60,bodyFat:100,spo2:100}[m.id]}
function chartNumber(m,v){return m.id==='sleep'?fmtSleep(v):fmt(v,m.dec)}
function metricSummary(m,period){
 const rows=metricRecords(m,period),v=rows.map(r=>r.v),lo=rows.map(r=>r.lo).filter(Number.isFinite);
 return [['Среднее',avg],['Минимум',a=>Math.min(...a)],['Максимум',a=>Math.max(...a)]].map(([name,f])=>
  [name,show(m,v.length?f(v):NaN,m.id==='bp'&&lo.length?f(lo):undefined)]);
}
function visualSVG(w,h,b,label){return `<svg class="real-visual" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${b}</svg>`}
function actualDate(r,short=true){const ts=recordTimestamp(r);return Number.isFinite(ts)?new Date(ts).toLocaleDateString('ru-RU',short?{day:'numeric',month:'numeric'}:{day:'numeric',month:'long',...(r.dateOnly?{}:{hour:'2-digit',minute:'2-digit'})}):'Дата не указана'}
function visualRecordSubset(rows,n){if(rows.length<=n)return rows;return Array.from({length:n},(_,i)=>rows[Math.round(i*(rows.length-1)/(n-1))])}
function stageVisual(r,w,h){
 const stages=(r?.stages||[]).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>s.start);
 if(!stages.length)return null;
 const kinds={wake:[0,'#ffbc73'],out:[0,'#ffbc73'],rem:[1,'#69dcff'],light:[2,'#b0a1ff'],deep:[3,'#745bff'],sleep:[2,'#aa96ff'],unknown:[2,'var(--faint)']};
 const start=r.start||stages[0].start,end=r.end||stages.at(-1).end,span=Math.max(1,end-start);
 const top=6,bottom=h-18,row=(bottom-top)/4;
 const body=stages.map(s=>{const [level,color]=kinds[s.kind]||kinds.unknown,x=4+(w-8)*(s.start-start)/span,width=Math.max(.6,(w-8)*(s.end-s.start)/span);return `<rect x="${x}" y="${top+row*level+row*.15}" width="${width}" height="${row*.7}" rx="3" fill="${color}"/>`}).join('');
 const time=t=>new Date(t).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 return body+`<text x="4" y="${h-2}" font-size="10" fill="var(--muted)">${time(start)}</text><text x="${w-4}" y="${h-2}" text-anchor="end" font-size="10" fill="var(--muted)">${time(end)}</text>`;
}
function renderTrendVisual(m,w,h,rows,mini=true,variant=state.chartSet){
 const P=chartColors(m),g=uid('actual'),gradient=lg(g,P,false).replace('<linearGradient ','<linearGradient gradientUnits="userSpaceOnUse" ').replace('x2="1"',`x2="${w}"`),defs=`<defs>${gradient}<linearGradient id="${g}fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${P[0]}" stop-opacity=".42"/><stop offset="1" stop-color="${P.at(-1)}" stop-opacity=".02"/></linearGradient></defs>`;
 const last=rows.at(-1),style=variant;
 if(!last)return visualSVG(w,h,`<path d="M8 ${h/2}H${w-8}" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${w/2}" y="${Math.max(12,h/2-7)}" text-anchor="middle" fill="var(--muted)" font-size="${h<50?9:12}">Нет измерений</text>`,m.name+': нет измерений');
 if(m.id==='sleep'&&style==='signature'){
   const phases=stageVisual(last,w,h);if(phases)return visualSVG(w,h,phases,'Фазы сна из источника');
 }
 let b=defs;
 const goal=metricGoal(m),hasGoal=Number.isFinite(goal)&&goal>0;
 const curValue=DAILY_METRICS.has(m.id)&&((last.day||localDay(recordTimestamp(last)))!==localDay())?NaN:last.v;
 if(mini&&style==='signature'&&['activeCalories','spo2','bodyFat','water'].includes(m.id)&&Number.isFinite(curValue)&&h>35){
   const percent=Math.max(0,Math.min(1,curValue/goal||0));
   if(m.id==='activeCalories'){
     const r=Math.min(w/2-8,h-14),cx=w/2,cy=h-5,length=Math.PI*r;
     b+=`<path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="var(--surface3)" stroke-width="8" stroke-linecap="round"/>`;
     if(percent>0)b+=`<path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="url(#${g})" stroke-width="8" stroke-linecap="round" stroke-dasharray="${length*percent} ${length}"/>`;
     b+=`<text x="${cx}" y="${cy-6}" fill="var(--text)" font-size="${Math.min(16,r*.6)}" font-weight="800" text-anchor="middle">${Math.round(curValue/goal*100)}%</text>`;
   }else if(m.id==='water'){
     const gw=Math.min(40,w*.26),gh=h-10,x=w/2-gw/2,y=5,level=gh*percent;
     b+=`<rect x="${x}" y="${y}" width="${gw}" height="${gh}" rx="10" fill="var(--surface3)"/><rect x="${x}" y="${y+gh-level}" width="${gw}" height="${level}" rx="${Math.min(10,level/2)}" fill="url(#${g})"/><rect x="${x}" y="${y}" width="${gw}" height="${gh}" rx="10" fill="none" stroke="${P[0]}" stroke-width="1.4"/>`;
     if(w>125)b+=`<text x="${x+gw+9}" y="${h*.55}" fill="var(--text)" font-size="14" font-weight="700">${Math.round(curValue/goal*100)}%</text>`;
   }else{
     const r=Math.min(w,h)/2-6,cx=w/2,cy=h/2,C=2*Math.PI*r;
     b+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--surface3)" stroke-width="5"/>`;
     if(percent>0)b+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${g})" stroke-width="5" stroke-linecap="round" stroke-dasharray="${percent*C} ${C}" transform="rotate(-90 ${cx} ${cy})"/>`;
     b+=`<text x="${cx}" y="${cy+4}" text-anchor="middle" fill="var(--text)" font-size="${Math.min(15,r*.7)}" font-weight="800">${fmt(curValue,m.dec)}%</text>`;
   }
   return visualSVG(w,h,b,m.name+': '+chartNumber(m,curValue));
 }
 const reduced=visualRecordSubset(rows,mini?Math.max(2,Math.min(14,Math.floor(w/8))):70),v=reduced.map(r=>r.v);
 const bar=style==='capsule'||style==='signature'&&(['bar','ring'].includes(m.chart)||['sleep','exercise','mindfulness','cadence','cyclingCadence'].includes(m.id));
 const bottoms=m.id==='bp'?reduced.map(r=>r.lo).filter(Number.isFinite):[];
 let mn=bar?Math.min(0,...v):Math.min(...v,...bottoms),mx=Math.max(...v,...bottoms);
 if(!mini&&hasGoal&&['steps','water','activeCalories','sleep'].includes(m.id))mx=Math.max(mx,goal);
 const padding=bar?Math.max(1,Math.abs(mx)*.12):Math.max(m.dec?.2:1,(mx-mn)*.2);
 mx+=padding;if(!bar)mn-=padding;
 const left=mini?5:36,right=mini?5:10,top=mini?5:12,bottom=mini?Math.min(12,h*.2):28;
 const y=x=>top+(h-top-bottom)*(1-(x-mn)/Math.max(.0001,mx-mn)),step=(w-left-right)/Math.max(1,v.length),x=i=>left+step*(i+.5);
 if(!mini){
   [mn,(mn+mx)/2,mx].forEach(t=>{b+=`<path d="M${left} ${y(t)}H${w-right}" fill="none" stroke="var(--line)" stroke-dasharray="3 5"/><text x="${left-5}" y="${y(t)+3}" text-anchor="end" font-size="10" fill="var(--muted)">${fmt(t,m.id==='sleep'?1:m.dec)}</text>`});
 }
 if(hasGoal&&['steps','water','activeCalories','sleep'].includes(m.id)&&goal>=mn&&goal<=mx){
   b+=`<path d="M${left} ${y(goal)}H${w-right}" fill="none" stroke="${P.at(-1)}" stroke-dasharray="3 4" opacity=".7"/>`;
   if(!mini)b+=`<text x="${w-right}" y="${Math.max(11,y(goal)-4)}" text-anchor="end" font-size="10" fill="${P.at(-1)}">цель ${fmt(goal,m.dec)}</text>`;
 }
 if(m.id==='bp'){
   const bw=Math.min(12,step*.5);
   reduced.forEach((r,i)=>{
     if(Number.isFinite(r.lo))b+=`<rect x="${x(i)-bw/2}" y="${Math.min(y(r.v),y(r.lo))}" width="${bw}" height="${Math.max(2,Math.abs(y(r.lo)-y(r.v)))}" rx="${bw/2}" fill="url(#${g})"/><circle cx="${x(i)}" cy="${y(r.lo)}" r="${Math.min(3,bw/3)}" fill="${P.at(-1)}"/>`;
     b+=`<circle cx="${x(i)}" cy="${y(r.v)}" r="${Math.min(4,step*.22)}" fill="${P[0]}"/>`;
   });
 }else if(bar){
   const bw=Math.max(.8,Math.min(mini?25:20,step*.62)),base=y(Math.max(0,mn));
   v.forEach((val,i)=>{const hh=Math.abs(base-y(val));b+=`<rect x="${x(i)-bw/2}" y="${Math.min(base,y(val))}" width="${bw}" height="${Math.max(val===0?1:.7,hh)}" rx="${Math.min(6,bw/2,hh/2)}" fill="url(#${g})" opacity="${i===v.length-1?1:.8}"/>`});
 }else{
   const pts=v.map((val,i)=>[x(i),y(val)]),d=style==='points'?pts.map((p,i)=>`${i?'L':'M'}${p.join(' ')}`).join(' '):smooth(pts);
   if(v.length>1){
     if(style!=='points')b+=`<path d="${d}L${x(v.length-1)} ${h-bottom}L${x(0)} ${h-bottom}Z" fill="url(#${g}fill)"/>`;
     b+=`<path d="${d}" fill="none" stroke="url(#${g})" stroke-width="${mini?2.5:2.8}" stroke-linecap="round" stroke-linejoin="round"/>`;
   }
   pts.forEach(([xx,yy],i)=>{if(style==='points'||v.length<15||i===v.length-1)b+=`<circle cx="${xx}" cy="${yy}" r="${i===v.length-1?3.7:2.2}" fill="${i===v.length-1?P.at(-1):P[0]}" stroke="var(--surface)" stroke-width="1"/>`});
 }
 if(!mini||h>=60){
   const indices=[...new Set([0,Math.floor((reduced.length-1)/2),reduced.length-1])];
   indices.forEach(i=>b+=`<text x="${x(i)}" y="${h-4}" text-anchor="middle" font-size="${mini?9:10}" fill="var(--muted)">${actualDate(reduced[i])}</text>`);
 }
 return visualSVG(w,h,b,`${m.name}: реальные измерения${reduced.length<rows.length?', показана выборка':''}`);
}
vizMini=function(m,w=150,h=44){
 const rows=metricRecords(m,'week'),fallback=rows.length?rows:recs(m).slice(-1);
 const key=m.id+':'+w+':'+h+':'+state.chartSet+':'+JSON.stringify(GOAL),old=visualCache.get(key);
 if(old?.rows===rows&&old.last===fallback.at(-1))return old.svg;
 const value=renderRealVisual(m,w,h,fallback,true);visualCache.set(key,{rows,last:fallback.at(-1),svg:value});return value;
};
drawChart=function(m,p,compare=false){
 const rows=metricRecords(m,p),reduced=visualRecordSubset(rows,70);
 const previous=compare?metricRecords(m,p,true):null;
 let svg=renderRealVisual(m,W,H,rows,false);
 if(previous)svg=`<div class="chart-comparison"><div><small>Текущий период</small>${svg}</div><div><small>Предыдущий период</small>${renderRealVisual(m,W,H,previous,false)}</div></div>`;
 return {svg,v:rows.map(r=>r.v),p:previous?.map(r=>r.v)||null,noSel:true};
};
vizBig=function(m,p){return drawChart(m,p,false)};
spark=function(m,w=150,h=44){return vizMini(m,w,h)};
bigLegend=function(m){
 if(m.id==='sleep'&&recs(m).at(-1)?.stages?.length)return '<span>Фазы из источника: бодрствование, REM, лёгкий и глубокий сон; серый означает неизвестную фазу.</span>';
 if(m.id==='bp')return '<span>Верхнее и нижнее давление из одной записи. Отсутствующее нижнее не вычисляется.</span>';
 return '';
};
details=function(m,v){
 const r=recs(m).at(-1);if(!r)return [];
 const out=[['Источник последней записи',esc(sourceName(m))],['Дата измерения',esc(actualDate(r,false))],['Сохранено записей',String(recs(m).length)]];
 if(m.id==='sleep'&&!r.stages?.length)out.push(['Фазы сна','Источник не передал']);
 if(m.id==='sleep'&&r.sleepKind==='session_less_awake')out.push(['Расчёт','Длительность сессии за вычетом известных пробуждений; не все фазы переданы']);
 if(m.id==='sleep'&&r.stageDetailsTruncated)out.push(['Подробность фаз',`Показаны до 200 участков из ${r.stageCountOriginal}; длительность рассчитана по полной записи`]);
 return out;
};
function actualLatest(m){
 const rows=recs(m),r=rows.at(-1);if(!r)return NaN;
 return DAILY_METRICS.has(m.id)&&(r.day||localDay(recordTimestamp(r)))!==localDay()?NaN:r.v;
}
showCur=function(m){const r=recs(m).at(-1);return show(m,actualLatest(m),r?.lo)};
function metricCaption(m){
 const r=recs(m).at(-1);if(!r)return 'Нет измерений';
 if(DAILY_METRICS.has(m.id)&&!Number.isFinite(actualLatest(m)))return 'Нет данных за сегодня';
 const delta=shortDelta(m);return delta?(delta==='≈'?'Без существенных изменений':delta+' к вашему среднему'):actualDate(r);
}
let dataViewsDirty=false,dataPaintTimer=0;
function refreshDataSections(){
 dataViewsDirty=true;
 if(dataPaintTimer)return;
 dataPaintTimer=setTimeout(()=>{
   dataPaintTimer=0;
   const sh=$('#sheet');
   if(sh?.classList.contains('on')){
     if(sh._draw&&!sh.querySelector('input,textarea')){const top=sh.scrollTop;sh._draw();sh.scrollTop=top}
     return;
   }
   if($('#v-overview').classList.contains('on')){renderTopBlock();renderGroups();scanAnim()}
   if($('#v-dynamics').classList.contains('on'))renderDynamics();
   if($('#v-goal').classList.contains('on'))renderGoal();
 },80);
}
const originalSetTab=setTab;
setTab=function(tab){
 originalSetTab(tab);
 if(dataViewsDirty){if(tab==='overview'){renderTopBlock();renderGroups()}if(tab==='dynamics')renderDynamics();dataViewsDirty=false}
 scanAnim();
};
const closeSheetWithData=closeSheet;
closeSheet=function(){closeSheetWithData();if(dataViewsDirty)refreshDataSections()};
window.onStorageError=function(){
 const parent=document.querySelector('.view.on')||$('#v-overview');if(!parent)return;
 let warning=document.getElementById('storageWarning');
 if(!warning){warning=document.createElement('p');warning.id='storageWarning';warning.className='card';warning.setAttribute('role','alert');warning.style.cssText='padding:12px;border-color:#ffb547;color:var(--text);font-size:13px;line-height:1.5';parent.append(warning)}
 warning.textContent='Не удалось сохранить изменения: недостаточно места в хранилище. Не закрывайте приложение до сохранения резервной копии через «Ещё → Экспорт и копия». Новые записи пока доступны только в текущем сеансе.';
};
const originalOpenAdd=openAdd;
openAdd=function(){
 originalOpenAdd();
 $('#sheet').querySelectorAll('[data-y=unfold]').forEach(button=>{
  const m=byId[button.dataset.a],dot=button.querySelector('.dotc');
  if(dot){dot.className='metric-mini-icon';dot.style.cssText='width:28px;height:30px;display:grid;place-items:center;color:var(--c);flex:none';dot.innerHTML=ic(mic(m))}
  if(recs(m).length){
   const chart=document.createElement('span');chart.style.cssText='width:78px;flex:none';
   chart.innerHTML=vizMini(m,78,32);button.insertBefore(chart,button.querySelector('.num'));
  }
 });
};
function metricViewsRefresh(){
 visualPrefs();visualCache.clear();renderAll();if($('#sheet')?.classList.contains('on')&&$('#sheet')._draw)$('#sheet')._draw();
}
function renderVisualPreferences(){
 const wrap=document.createElement('section');wrap.id='visualPreferences';
 wrap.innerHTML=`<div class="lbl2">Графики и диаграммы</div><div class="visual-choices">${VISUAL_STYLES.map(([id,title,description])=>`<button data-visual-set="${id}" aria-pressed="${state.chartSet===id}" class="visual-choice ${state.chartSet===id?'on':''}"><span class="choice-preview"></span><b>${title}</b><small>${description}</small></button>`).join('')}</div><div class="lbl2">Наборы значков карточек</div><div class="visual-choices">${ICON_STYLES.map(([id,title])=>`<button data-icon-set="${id}" aria-pressed="${state.iconSet===id}" class="visual-choice ${state.iconSet===id?'on':''}"><span class="choice-preview icon-${id}">${ic(semanticGlyph('heart',id))}${ic(semanticGlyph('water',id))}${ic(semanticGlyph('shoe',id))}</span><b>${title}</b></button>`).join('')}</div>`;
 wrap.querySelectorAll('[data-visual-set] .choice-preview').forEach(el=>{
  el.setAttribute('aria-hidden','true');
  el.innerHTML=['steps','water','heart'].map(id=>{
   const m=byId[id],sample=({steps:[2000,5000,3000],water:[600,1200,1800],heart:[68,84,73]})[id];
   const rows=sample.map((v,i)=>({v,ts:Date.now()-(2-i)*86400000,day:localDay(Date.now()-(2-i)*86400000)}));
   const variant=el.parentElement.dataset.visualSet;
   return renderRealVisual(m,variant==='signature'?120:36,variant==='signature'?56:28,rows,true,variant);
  }).join('');
 });
 return wrap;
}
window.addEventListener('click',e=>{
 const b=e.target.closest('button[data-visual-set],button[data-icon-set]');if(!b)return;
 e.preventDefault();e.stopImmediatePropagation();
 const scroll=$('#screen').scrollTop;
 if(b.dataset.visualSet){state.chartSet=b.dataset.visualSet;LS.set('balans2.chartSet',state.chartSet)}
 if(b.dataset.iconSet){state.iconSet=b.dataset.iconSet;LS.set('balans2.iconSet',state.iconSet)}
 metricViewsRefresh();renderThemes();$('#screen').scrollTop=scroll;
},true);
const realVisualCSS=document.createElement('style');
realVisualCSS.textContent=`
.real-visual{display:block;width:100%;height:100%;overflow:visible;filter:var(--visual-filter,none)}
.visual-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.visual-choice{position:relative;border:1px solid var(--line);border-radius:14px;background:var(--surface);padding:12px;text-align:left;min-width:0}
.visual-choice.on{border-color:var(--accent);box-shadow:inset 0 0 0 1px var(--accent)}
.visual-choice.on:after{content:'✓';position:absolute;right:8px;top:6px;color:var(--accent);font-size:18px;font-weight:800}
.visual-choice b,.visual-choice small{display:block}.visual-choice small{font-size:12px;color:var(--muted);margin-top:5px;line-height:1.4}
.choice-preview{display:flex;height:38px;gap:12px;align-items:center;margin-bottom:8px}.choice-preview>svg.i{width:25px;height:25px;color:var(--c-heart)}
.choice-preview .real-visual{height:36px}
[data-icon-set="outline"] .g3 .ic,[data-icon-set="outline"] .fold .ic{background:transparent!important;color:var(--c)!important;border:1px solid var(--c);border-radius:50%}
[data-icon-set="soft"] .g3 .ic,[data-icon-set="soft"] .fold .ic{border-radius:50%;background:color-mix(in srgb,var(--c) 20%,var(--surface))!important;color:var(--c)!important}
[data-icon-set="duo"] .g3 .ic,[data-icon-set="duo"] .fold .ic{background:linear-gradient(135deg,color-mix(in srgb,var(--c) 22%,var(--surface)),color-mix(in srgb,var(--c) 8%,var(--surface)))!important;color:var(--c)!important;border:1px solid color-mix(in srgb,var(--c) 50%,var(--line))}
[data-icon-set="outline"] [data-metric] .ic{background:transparent!important;color:var(--c)!important;border:1px solid var(--c);border-radius:50%}
[data-icon-set="soft"] [data-metric] .ic{border-radius:50%;background:color-mix(in srgb,var(--c) 20%,var(--surface))!important;color:var(--c)!important}
[data-icon-set="duo"] [data-metric] .ic{background:linear-gradient(135deg,color-mix(in srgb,var(--c) 22%,var(--surface)),color-mix(in srgb,var(--c) 8%,var(--surface)))!important;color:var(--c)!important;border:1px solid color-mix(in srgb,var(--c) 50%,var(--line))}
[data-metric] .ic,.fold .ic{filter:var(--visual-filter,none)}.fold{opacity:1!important}
`;
document.head.appendChild(realVisualCSS);installCardGlyphs();visualPrefs();
