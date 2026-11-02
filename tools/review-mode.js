/* BALANS_REVIEW_TAB_V6 */
try{(function(){
  const K={event:'balans.review.healthEvent'};
  const saveEvent=e=>{try{localStorage.setItem(K.event,JSON.stringify({...e,at:Date.now()}))}catch(e2){}};
  const oldHandler=window.onHealthEvent;
  window.onHealthEvent=e=>{try{saveEvent(e)}catch(e2){}if(typeof oldHandler==='function')return oldHandler(e)};
  const recordsFor=(m,p)=>{try{const r=metricRecords(m,p);if(Array.isArray(r)&&r.length)return r}catch(e){}if(p==='all'){for(const alt of ['year','6m','month','week','day']){try{const r=metricRecords(m,alt);if(Array.isArray(r)&&r.length)return r}catch(e){}}}return []};
  if(typeof window.drawChart==='function'){const old=window.drawChart;window.drawChart=function(m,p,c){try{if(p==='all'&&!recordsFor(m,p).length){const r=recordsFor(m,'year');if(r.length)return old(m,'year',c)}return old(m,p,c)}catch(e){return old(m,p,c)}}}
  if(typeof window.vizBig==='function'){window.vizBig=function(m,p){try{if(p==='all'&&!recordsFor(m,p).length){const r=recordsFor(m,'year');if(r.length)return window.drawChart(m,'year')}return window.drawChart(m,p)}catch(e){return window.drawChart(m,p)}}}
  const improveEmpty=()=>{document.querySelectorAll('.emptybox').forEach(x=>{if(x.dataset.reviewEmpty==='1')return;x.dataset.reviewEmpty='1';const b=x.querySelector('b'),s=x.querySelector('small');if(b&&!b.textContent.trim())b.textContent='Нет данных за этот период';if(s&&!s.textContent.trim())s.textContent='Подключи источник или добавь запись — здесь появится динамика.'})};
  new MutationObserver(improveEmpty).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',improveEmpty);window.addEventListener('load',improveEmpty);
  const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const diagHTML=()=>{let e=null;try{e=JSON.parse(localStorage.getItem(K.event)||'null')}catch(x){}
    if(!e)return '<p class="foot">Синхронизация ещё не запускалась.</p>';
    const time=new Date(e.at||Date.now()).toLocaleString('ru-RU');
    const warnings=(e.warnings||[]).slice(0,5);
    const ok=e.type==='synced';
    return '<p class="foot">Последнее событие: <b>'+esc(e.type||'—')+'</b><br>Время: '+esc(time)+'<br>Сообщение: '+esc(e.message||'—')+'</p>'+(warnings.length?'<p class="foot"><b>Предупреждения:</b><br>'+warnings.map(w=>'• '+esc(w)).join('<br>')+'</p>':'')+'<p class="foot">'+(ok?'Данные получены.':'Если ошибка повторяется, открой Health Connect и проверь разрешения.')+'</p>'};
  const tab=()=>{const bar=document.querySelector('#tabbar');if(!bar||document.querySelector('#reviewTab'))return;const b=document.createElement('button');b.id='reviewTab';b.type='button';b.innerHTML='<span>🧪</span><span>На рассмотрении</span>';b.style.cssText='font-size:10px';
    b.onclick=()=>{document.querySelectorAll('#tabbar button').forEach(x=>x.classList.remove('on'));b.classList.add('on');document.querySelectorAll('.view').forEach(v=>v.classList.remove('on'));let v=document.querySelector('#reviewView');if(!v){v=document.createElement('section');v.id='reviewView';v.className='view';document.querySelector('.screen').append(v)}
      v.innerHTML='<div class="top"><h2>На рассмотрении</h2></div><div class="card"><b>Диагностика источников</b><p class="foot">Служебный экран: показывает статус последней синхронизации, предупреждения и ошибки.</p></div><div class="card" id="reviewDiag" style="margin-bottom:10px"><b>Последняя синхронизация</b>'+diagHTML()+'</div><button class="btn ghost" id="reviewRefresh" style="width:100%">Обновить диагностику</button>';
      v.classList.add('on');
      const rf=document.querySelector('#reviewRefresh');if(rf)rf.onclick=()=>{document.querySelector('#reviewDiag').innerHTML='<b>Последняя синхронизация</b>'+diagHTML()}};
    bar.append(b)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tab);else tab();
})();}catch(e){console.error('Review tab disabled',e)}
