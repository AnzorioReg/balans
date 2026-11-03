/* DASHBOARD_V14 */
(function(){
function recordDate(r){
 if(!r)return 'Дата не указана';
 const day=String(r.day||'');
 if(/^\d{4}-\d{2}-\d{2}$/.test(day)){
  const d=new Date(day+'T12:00:00');if(Number.isFinite(d.getTime())&&d.getFullYear()===Number(day.slice(0,4))&&d.getMonth()+1===Number(day.slice(5,7))&&d.getDate()===Number(day.slice(8,10)))return d.toLocaleDateString('ru-RU');
 }
 const raw=r.ts??r.startTime??r.time??r.date;
 if(raw!==undefined&&raw!==null&&raw!==''){
  const value=typeof raw==='number'?(raw<100000000000?raw*1000:raw):raw;
  const d=new Date(value);if(Number.isFinite(d.getTime()))return d.toLocaleDateString('ru-RU')+' '+d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 }
 const text=String(r.d||'').trim();
 if(text&&!['undefined','null','Invalid Date'].includes(text))return text;
 return 'Дата не указана';
}
window.balansRecordDate=recordDate;
const configs={steps:{key:'steps',title:'Цель по шагам в день',unit:'шагов',min:1,max:100000,step:1},sleep:{key:'sleep',title:'Цель по продолжительности сна в сутки',unit:'часов',min:.1,max:24,step:.1},water:{key:'water',title:'Цель по воде в день',unit:'мл',min:1,max:20000,step:1},activeCalories:{key:'active',title:'Цель по активным калориям в день',unit:'ккал',min:1,max:20000,step:1},exercise:{key:'exercise',title:'Цель по активным минутам в день',unit:'мин',min:1,max:1440,step:1},distance:{key:'distance',title:'Цель по расстоянию в день',unit:'км',min:.1,max:1000,step:.1},floors:{key:'floors',title:'Цель по этажам в день',unit:'этажей',min:1,max:1000,step:1},mindfulness:{key:'mindfulness',title:'Цель по осознанным практикам в день',unit:'мин',min:1,max:1440,step:1}};
if(typeof metricGoal==='function'){const previousGoal=metricGoal;metricGoal=function(m){const c=configs[m.id];return c&&GOAL[c.key]>0?GOAL[c.key]:previousGoal(m);};}
if(!(Number(GOAL.exercise)>0)){GOAL.exercise=60;saveP();}
window.balansMetricGoalHTML=function(m){
 const c=configs[m.id];if(!c)return '';
 const value=GOAL[c.key];
 return '<section class="card metric-goal-editor" style="margin-top:16px"><form id="metricGoalForm" data-metric-id="'+m.id+'"><label class="field"><span>'+esc(c.title)+'</span><input name="goal" type="text" inputmode="decimal" required value="'+(Number.isFinite(value)?value:'')+'" aria-label="'+esc(c.title)+'"><small>'+esc(c.unit)+' · в сутки</small></label><p class="foot" role="status" data-goal-status></p><button class="btn" type="submit" style="margin-top:8px">Сохранить цель</button></form></section>';
};
MPAGES.profile.r=function(){const p=state.prof;return '<form id="profileV14"><div class="lbl2">О себе</div><div class="card"><label class="field">Имя<input name="name" maxlength="24" value="'+esc(p.name||'')+'"></label><label class="field">Пол<select name="sex" style="padding:12px;background:var(--surface2);color:var(--text);border:1px solid var(--line);border-radius:12px"><option value="">Не указан</option><option value="m" '+(p.sex==='m'?'selected':'')+'>Мужской</option><option value="f" '+(p.sex==='f'?'selected':'')+'>Женский</option></select></label><label class="field">Год рождения<input name="year" inputmode="numeric" maxlength="4" value="'+esc(p.year||'')+'"></label><p class="foot" role="status" data-profile-status></p><button class="btn" type="submit" style="margin-top:14px">Сохранить</button></div></form>';};
document.addEventListener('submit',e=>{
 const form=e.target;if(form.id==='metricGoalForm'){
  e.preventDefault();e.stopImmediatePropagation();
  const c=configs[form.dataset.metricId],value=Number(form.elements.goal.value.trim().replace(',','.').replace(/\s/g,''));
  const status=form.querySelector('[data-goal-status]');
  if(!c||!Number.isFinite(value)||value<c.min||value>c.max||(c.step===1&&!Number.isInteger(value))){status.textContent=c?'Введите число от '+c.min+' до '+c.max+' '+c.unit:'Недопустимая цель';return;}
  GOAL[c.key]=Math.round(value*10)/10;saveP();renderAll();
  document.querySelector('#sheet')?._draw?.();removeDynamicsLinks();
  const current=document.querySelector('#metricGoalForm [data-goal-status]');if(current)current.textContent='Цель сохранена';return;
 }
 if(form.id==='profileV14'){
  e.preventDefault();e.stopImmediatePropagation();const data=new FormData(form),year=String(data.get('year')||'').trim();
  if(year&&(!/^\d{4}$/.test(year)||+year<1900||+year>new Date().getFullYear())){form.querySelector('[data-profile-status]').textContent='Проверьте год рождения';return;}
  state.prof.name=String(data.get('name')||'').trim()||'Без имени';state.prof.sex=String(data.get('sex')||'');state.prof.year=year;saveP();renderAll();rerender();document.querySelector('[data-profile-status]')?.append('Профиль сохранён');
 }
},true);
function removeDynamicsLinks(){document.querySelectorAll('[data-tab="dynamics"],[data-go="dynamics"],[data-dyn]').forEach(n=>n.remove());}
removeDynamicsLinks();
renderDynamics=function(){};renderHeat=function(){};
document.querySelector('#v-dynamics')?.remove();
const tabBefore=setTab;
setTab=function(t){removeDynamicsLinks();return tabBefore(t==='dynamics'?'overview':t);};
const goBefore=go;
go=function(k){state.stack=state.stack.filter(x=>x!=='dynamics');return goBefore(k==='dynamics'?'overview':k);};
if(state.tab==='dynamics')state.tab='overview';
const nav=document.querySelector('#tabbar');if(nav)nav.style.gridTemplateColumns='repeat(3,minmax(0,1fr))';
const metricBefore=openMetric;
openMetric=function(id){const result=metricBefore(id);removeDynamicsLinks();return result;};
let cleanupQueued=false;
new MutationObserver(()=>{if(cleanupQueued)return;cleanupQueued=true;queueMicrotask(()=>{cleanupQueued=false;removeDynamicsLinks();});}).observe(document.body,{childList:true,subtree:true});
window.BalansDashboardV14={recordDate,goalConfig:id=>configs[id]||null};
})();
