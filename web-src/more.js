/* ===== Раздел «Ещё»: рабочие страницы ===== */
(function(){const st=document.createElement('style');st.textContent=`
.pg-intro{color:var(--muted);font-size:var(--fs-s);margin:0 2px 12px;line-height:1.5}
.frow{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-size:var(--fs-m)}
.frow:last-child{border-bottom:0}.frow .k{flex:1}.frow .k small{display:block;color:var(--muted);font-size:var(--fs-xs);margin-top:2px}
.frow input,.frow select{font:inherit;color:var(--text);background:var(--surface2);border:1px solid var(--line);border-radius:10px;padding:8px 10px;width:118px;text-align:right}
.frow input:focus,.field textarea:focus,.field select:focus{outline:2px solid var(--accent);border-color:transparent}
.field textarea,.field select{font:inherit;font-size:var(--fs-m);color:var(--text);background:var(--surface2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;width:100%;resize:vertical}
.seg2{display:flex;gap:4px;padding:4px;border-radius:12px;background:var(--surface2);border:1px solid var(--line)}
.seg2 button{flex:1;min-height:36px;border-radius:9px;font-size:var(--fs-s);font-weight:600;color:var(--muted)}
.seg2 button.on{background:var(--accent);color:var(--accent-ink)}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.tag{padding:6px 11px;border-radius:99px;font-size:var(--fs-xs);font-weight:700;border:1px solid var(--line);color:var(--muted);background:var(--surface2)}
.tag.on{color:#0b0f15;background:var(--tc);border-color:var(--tc)}
.tagv{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;color:#0b0f15;background:var(--tc);margin-right:6px}
.ent{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);align-items:flex-start}
.ent:last-child{border-bottom:0}.ent .b{flex:1;font-size:var(--fs-m);line-height:1.45}.ent .b small{display:block;color:var(--muted);font-size:var(--fs-xs);margin-top:3px}
.xbtn{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:var(--faint);border:1px solid var(--line);flex:none;font-size:18px;line-height:1}
.xbtn:hover{color:var(--c-heart);border-color:var(--c-heart)}
.dgrp{font-size:var(--fs-xs);font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin:16px 4px 8px}
.mhd{display:flex;align-items:center;gap:10px;margin-bottom:4px}.mhd .dotc{width:12px;height:12px;border-radius:50%;background:var(--c)}
.mhd b{flex:1}.mini-btn{font-size:var(--fs-s);font-weight:700;color:var(--accent);min-height:32px;padding:0 6px}
.rem{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--line)}.rem:last-child{border-bottom:0}
.rem .tm{font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;min-width:66px}.rem .b{flex:1;min-width:0}.rem .b small{display:block;color:var(--muted);font-size:var(--fs-xs)}
.rem.off .tm,.rem.off .b{opacity:.45}
.days{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;margin-top:8px}
.days button{min-height:38px;border-radius:10px;border:1px solid var(--line);font-size:var(--fs-s);font-weight:700;color:var(--muted);background:var(--surface2)}
.days button.on{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.btnrow{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.btn.danger{background:color-mix(in srgb,var(--c-heart) 16%,transparent);color:var(--c-heart);border:1px solid color-mix(in srgb,var(--c-heart) 40%,transparent)}
.btn.wide{width:100%;margin-top:10px}
.rtab{width:100%;border-collapse:collapse;font-size:var(--fs-s)}
.rtab th{text-align:left;color:var(--muted);font-weight:600;font-size:var(--fs-xs);padding:6px 4px;border-bottom:1px solid var(--line)}
.rtab td{padding:9px 4px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}.rtab tr:last-child td{border-bottom:0}
.rtab td:first-child{font-weight:600}.rtab .tr-up{color:var(--c-food)}.rtab .tr-dn{color:var(--c-heart)}
.hcstat{display:flex;align-items:center;gap:8px;font-size:var(--fs-s);color:var(--muted);margin-top:10px}
.hcstat i{width:9px;height:9px;border-radius:50%;background:var(--c-food);box-shadow:0 0 0 4px color-mix(in srgb,var(--c-food) 25%,transparent)}
.hcstat.off i{background:var(--faint);box-shadow:none}
.toast{position:absolute;left:14px;right:14px;top:46px;z-index:40;background:var(--surface2);border:1px solid var(--line);border-radius:16px;padding:12px 14px;display:flex;gap:12px;align-items:center;box-shadow:0 14px 40px #0006;transform:translateY(calc(-100% - 60px));opacity:0;visibility:hidden;transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .25s,visibility 0s .4s;font-size:var(--fs-s)}
.toast.on{transform:none;opacity:1;visibility:visible;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s,visibility 0s}
.toast .ic{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--accent);color:var(--accent-ink);flex:none}
.toast b{display:block;font-size:var(--fs-m)}.toast small{color:var(--muted)}
.lock{position:absolute;inset:0;z-index:50;background:var(--bg);display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px}
.lock.on{display:flex}.lock h3{margin:0;font-size:var(--fs-xl)}.lock p{margin:0;color:var(--muted);font-size:var(--fs-s)}
.pdots{display:flex;gap:14px}.pdots i{width:14px;height:14px;border-radius:50%;border:2px solid var(--muted)}.pdots i.f{background:var(--accent);border-color:var(--accent)}
.pdots.err{animation:shake .35s}@keyframes shake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
.kpad{display:grid;grid-template-columns:repeat(3,72px);gap:14px}
.kpad button{height:72px;border-radius:50%;background:var(--surface2);border:1px solid var(--line);font-size:26px;font-weight:600;color:var(--text)}
.kpad button.nb{background:none;border:0;font-size:var(--fs-s);color:var(--muted)}
.faq details{border-bottom:1px solid var(--line);padding:4px 0}.faq details:last-child{border-bottom:0}
.faq summary{list-style:none;cursor:pointer;padding:12px 0;font-weight:600;display:flex;justify-content:space-between;gap:10px}
.faq summary::-webkit-details-marker{display:none}.faq summary::after{content:'+';color:var(--accent);font-size:20px;line-height:1}
.faq details[open] summary::after{content:'−'}.faq p{margin:0 0 12px;color:var(--muted);font-size:var(--fs-s);line-height:1.55}
.avbig{width:72px;height:72px;border-radius:50%;display:grid;place-items:center;font-size:30px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--accent),var(--c-sleep));margin:0 auto 8px}
`;document.head.appendChild(st)})();

const DEF_PROF={name:'Анзор',year:'',sex:'m',height:'',goals:{steps:10000,sleep:8,water:2000,active:600}};
Object.assign(state,{
  prof:(()=>{const p=LS.get('balans2.prof',{});return {...DEF_PROF,...p,goals:{...DEF_PROF.goals,...(p.goals||{})}}})(),
  hc:LS.get('balans2.hc',{on:true,perm:{},sync:Date.now()-14*60000}),
  diary:LS.get('balans2.diary',[]),
  rem:LS.get('balans2.rem',[]),
  priv:LS.get('balans2.priv',{pin:'',hideNotif:false,stats:false}),
  rperiod:'week',page:null,lastBackup:LS.get('balans2.backup',null)
});
const SRC_DEF={samsung:{name:'Samsung Health',icon:'S',color:'#76a8ff',on:true,types:'Шаги, сон, пульс, тренировки, состав тела'},
 google:{name:'Google Fit · Fitbit',icon:'G',color:'#79d7a4',on:true,types:'Активность, пульс, сон'},
 garmin:{name:'Garmin Connect',icon:'G',color:'#7cbaff',on:false,types:'Шаги, пульс, тренировки'},
 withings:{name:'Withings',icon:'W',color:'#c1a5ff',on:false,types:'Вес, давление, состав тела'},
 oura:{name:'Oura',icon:'O',color:'#e9bb72',on:false,types:'Сон, пульс, HRV'},
 polar:{name:'Polar Flow',icon:'P',color:'#f28ca8',on:false,types:'Тренировки, пульс'},
 whoop:{name:'WHOOP',icon:'W',color:'#f09a78',on:false,types:'HRV, сон, тренировки'},
 huawei:{name:'Huawei Health',icon:'H',color:'#ff8a4c',on:false,types:'Шаги, сон, пульс'},
 xiaomi:{name:'Xiaomi Mi Fitness',icon:'M',color:'#5aa9ff',on:false,types:'Шаги, пульс, сон'},
 strava:{name:'Strava',icon:'S',color:'#ff9d65',on:false,types:'Велосипед, бег, тренировки'},
 mfp:{name:'MyFitnessPal',icon:'M',color:'#8bd6a2',on:false,types:'Питание, калории'}};
const GOAL=state.prof.goals;
state.srcs=LS.get('balans2.srcs',Object.assign({},SRC_DEF));
function hcOk(m){return state.hc.on&&state.hc.perm[m.id]!==false}
const saveP=()=>{LS.set('balans2.prof',state.prof);LS.set('balans2.hc',state.hc);LS.set('balans2.srcs',state.srcs);LS.set('balans2.diary',state.diary);LS.set('balans2.rem',state.rem);LS.set('balans2.priv',state.priv)};
const TAGS=[['ill','Болезнь','#ff6f91'],['sleep','Сон','#9d8cff'],['sport','Спорт','#3fe0c5'],['stress','Стресс','#ffb84d'],['trip','Поездка','#5aa9ff'],['food','Питание','#5fd97a'],['other','Другое','#9aa7b6']];
const TAGM=Object.fromEntries(TAGS.map(t=>[t[0],t]));
const RPRESET=['Выпить воды','Измерить давление','Взвеситься','Принять витамины','Пора спать','Размяться'];
function dRu(iso){const [y,m,d]=iso.split('-');return `${+d} ${MON[+m-1]} ${y}`}
function ago(ts){const mn=Math.round((Date.now()-ts)/60000);return mn<1?'только что':mn<60?`${mn} мин назад`:mn<1440?`${Math.round(mn/60)} ч назад`:`${Math.round(mn/1440)} дн. назад`}
function daysTxt(ds){if(ds.length===7)return 'каждый день';if(ds.join()==='0,1,2,3,4')return 'по будням';if(ds.join()==='5,6')return 'по выходным';return ds.map(i=>WD[i]).join(', ')}

function toast(title,sub,icon='i-info'){let t=$('#toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';$('#phone').appendChild(t)}
  t.innerHTML=`<span class="ic">${ic(icon)}</span><span><b>${esc(title)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span>`;t.classList.add('on');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('on'),2600)}
function sheet(html){const sh=$('#sheet');sh.classList.remove('full');sh.style.removeProperty('--c');sh._draw=null;sh.innerHTML=`<div class="grab"></div>`+html;sh.scrollTop=0;sh.classList.add('on');$('#scrim').classList.add('on');scanAnim()}
const sheetHd=(t,s)=>`<div class="hd"><span class="t"><b>${t}</b>${s?`<small>${s}</small>`:''}</span><button class="iconbtn" data-close aria-label="Закрыть">${ic('i-down')}</button></div>`;
let confirmCb=null;
function confirmSheet(t,txt,btn,cb){confirmCb=cb;sheet(sheetHd(t)+`<p class="pg-intro" style="font-size:var(--fs-m)">${txt}</p><div class="btnrow"><button class="btn ghost" data-close>Отмена</button><button class="btn danger" data-x="confirm">${btn}</button></div>`)}
function download(name,text,type){
  if(window.BalansSave){try{BalansSave.save(name,btoa(unescape(encodeURIComponent(text))),type);return}catch(e){}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- страницы ---------- */
const MPAGES={
 profile:{t:'Профиль',r(){const p=state.prof;return `
  <div style="text-align:center;margin:4px 0 14px"><button class="avbig" style="border:0;padding:0" data-y="avpick">${state.avatar&&AVATARS.some(x=>x.id===state.avatar)?AVATARS.find(x=>x.id===state.avatar).svg:state.avatar&&String(state.avatar).startsWith('data:')?`<img src="${state.avatar}" alt="" style="width:72px;height:72px;border-radius:50%;object-fit:cover">`:`${esc((p.name||'?')[0].toUpperCase())}`}</button><b style="font-size:var(--fs-l)">${esc(p.name||'Без имени')}</b></div>
  <button class="btn ghost wide" style="margin:10px 0 0" data-y="avpick">Изменить аватарку</button>
  <form id="fProf">
  <div class="lbl2">О себе</div>
  <div class="card" style="padding:4px 16px">
   <label class="frow"><span class="k">Имя</span><input name="name" value="${esc(p.name)}" maxlength="24" style="width:160px;text-align:left"></label>
   <label class="frow"><span class="k">Год рождения</span><input name="year" inputmode="numeric" placeholder="1985" value="${esc(p.year)}" maxlength="4"></label>
   <div class="frow"><span class="k">Пол</span><div class="seg2" style="width:170px"><button type="button" data-x="sex" data-a="m" class="${p.sex==='m'?'on':''}">Муж.</button><button type="button" data-x="sex" data-a="f" class="${p.sex==='f'?'on':''}">Жен.</button></div></div>
   <label class="frow"><span class="k">Рост<small>нужен для ИМТ</small></span><input name="height" inputmode="numeric" value="${p.height}"> </label>
  </div>
  <div class="lbl2">Мои цели</div>
  <div class="card" style="padding:4px 16px">
   <label class="frow"><span class="k">Шаги в день</span><input name="steps" inputmode="numeric" value="${p.goals.steps}"></label>
   <label class="frow"><span class="k">Сон<small>часов за ночь</small></span><input name="sleep" inputmode="decimal" value="${fmt(p.goals.sleep,1)}"></label>
   <label class="frow"><span class="k">Вода<small>мл в день</small></span><input name="water" inputmode="numeric" value="${p.goals.water}"></label>
   <label class="frow"><span class="k">Активные калории<small>ккал в день</small></span><input name="active" inputmode="numeric" value="${p.goals.active}"></label>
  </div>
  <button class="btn wide" type="submit">Сохранить</button>
  </form>
  <p class="foot">Цели используются в кольцах на «Обзоре» и на графиках показателей.</p>`}},
 manual:{t:'Ручные записи',r(){const ms=M.filter(m=>state.manual[m.id]);return `
  <p class="pg-intro">Всё, что вы вносите сами. Такие записи помечаются «вручную» и не смешиваются с данными устройств.</p>
  <button class="btn wide" style="margin:0 0 6px" data-act="add">${ic('i-plus')}Новый показатель</button>
  ${ms.length?ms.map(m=>{const r=state.manual[m.id]?.rec||[];return `<div class="card" style="margin-top:10px;--c:${cv(m)}"><div class="mhd"><span class="dotc"></span><b>${esc(m.name)}</b><button class="mini-btn" data-addm="${m.id}">+ запись</button></div>
   ${r.length?r.map((x,i)=>({x,i})).reverse().map(({x,i})=>`<div class="ent"><div class="b"><b class="num">${show(m,x.v,x.lo)}</b> ${m.id==='sleep'?'':m.unit}<small>${esc(x.d)}</small></div><button class="xbtn" data-x="delrec" data-a="${m.id}" data-b="${i}" aria-label="Удалить запись">×</button></div>`).join('')
   :`<p class="pg-intro" style="margin:8px 0 4px">${state.manual[m.id].demo?'Пока показаны демонстрационные значения. Добавьте свою запись — она появится здесь.':'Записей пока нет.'}</p>`}
   <button class="mini-btn" style="color:var(--muted);margin-top:6px" data-metric="${m.id}">Открыть график →</button></div>`}).join('')
  :`<div class="card"><div class="emptybox">Ручных показателей пока нет</div></div>`}`}},
 diary:{t:'Дневник',r(){const g={};state.diary.slice().sort((a,b)=>b.d.localeCompare(a.d)||b.id-a.id).forEach(e=>(g[e.d]??=[]).push(e));return `
  <p class="pg-intro">Отмечайте события — болезнь, перелёт, нагрузку. Потом проще понять, почему скакнул пульс или сон.</p>
  <button class="btn wide" style="margin:0" data-x="diaryNew">${ic('i-plus')}Новая заметка</button>
  ${Object.keys(g).length?Object.entries(g).map(([d,es])=>`<div class="dgrp">${dRu(d)}</div><div class="card" style="padding:2px 16px">${es.map(e=>`<div class="ent"><div class="b">${e.tags.map(t=>`<span class="tagv" style="--tc:${TAGM[t][2]}">${TAGM[t][1]}</span>`).join('')}${e.tags.length?'<br>':''}${esc(e.t)}</div><button class="xbtn" data-x="delnote" data-a="${e.id}" aria-label="Удалить">×</button></div>`).join('')}</div>`).join('')
  :`<div class="card" style="margin-top:12px"><div class="emptybox">Заметок пока нет</div></div>`}`}},
 remind:{t:'Напоминания',r(){return `
  <p class="pg-intro">Ваши напоминания по расписанию. Приложение пришлёт уведомление в выбранное время.</p>
  <div class="card" style="padding:2px 16px">${state.rem.length?state.rem.slice().sort((a,b)=>a.tm.localeCompare(b.tm)).map(r=>`<div class="rem ${r.on?'':'off'}"><span class="tm">${r.tm}</span><span class="b"><b>${esc(r.t)}</b><small>${daysTxt(r.days)}</small></span><button class="sw ${r.on?'on':''}" data-x="remtog" data-a="${r.id}" aria-label="Включить"></button><button class="xbtn" data-x="remedit" data-a="${r.id}" aria-label="Изменить">✎</button></div>`).join(''):'<div class="emptybox">Напоминаний нет</div>'}</div>
  <div class="btnrow"><button class="btn" data-x="remNew">${ic('i-plus')}Добавить</button><button class="btn ghost" data-x="remTest">${ic('i-bell')}Проверить</button></div>
  <p class="foot">Не медицинские советы. Срабатывание зависит от настроек Android.</p>`}},
 export:{t:'Экспорт и копия',r(){const n=M.reduce((a,m)=>a+recs(m).length,0);return `
  <p class="pg-intro">Сохраните свои записи и настройки в файл на телефоне. Из него же можно всё восстановить.</p>
  <div class="card" style="padding:4px 16px">
   <div class="frow"><span class="k">Всего записей</span><b>${n}</b></div>
   <div class="frow"><span class="k">Заметок в дневнике</span><b>${state.diary.length}</b></div>
   <div class="frow"><span class="k">Напоминаний</span><b>${state.rem.length}</b></div>
   <div class="frow"><span class="k">Последняя копия</span><b>${state.lastBackup?ago(state.lastBackup):'ещё не было'}</b></div>
  </div>
  <button class="btn wide" data-x="backup">${ic('i-dl')}Сохранить резервную копию</button>
  <button class="btn ghost wide" data-x="csv">${ic('i-file')}Скачать записи в таблицу (CSV)</button>
  <button class="btn ghost wide" data-x="restore">${ic('i-plug')}Восстановить из файла</button>
  <input type="file" id="restoreIn" accept=".json,application/json" hidden>
  <p class="foot">Копия включает локальные записи здоровья, Bluetooth, дневник и настройки. Храните её осторожно: файл содержит личные данные.</p>`}},
 report:{t:'Отчёт',r(){const rows=reportRows();const P={week:'7 дней',month:'30 дней',year:'12 месяцев'};return `
  <div class="seg2" style="margin-bottom:12px">${Object.entries(P).map(([k,l])=>`<button data-x="rper" data-a="${k}" class="${state.rperiod===k?'on':''}">${l}</button>`).join('')}</div>
  <div class="card">
   <b>Сводка за ${P[state.rperiod]}</b><div style="color:var(--muted);font-size:var(--fs-xs);margin:2px 0 8px">${esc(state.prof.name)} · по ${new Date().toLocaleDateString('ru-RU')} · по сохранённым измерениям</div>
   <table class="rtab"><tr><th>Показатель</th><th>Среднее</th><th>Мин–макс</th><th></th></tr>
   ${rows.map(r=>`<tr><td>${esc(r.n)}</td><td>${r.a}</td><td style="color:var(--muted)">${r.r}</td><td class="${r.c}">${r.t}</td></tr>`).join('')||'<tr><td colspan="4">За выбранный период нет измерений.</td></tr>'}</table>
  </div>
  ${state.diary.length?`<div class="card" style="margin-top:10px"><b>События из дневника</b>${state.diary.slice().sort((a,b)=>b.d.localeCompare(a.d)).slice(0,4).map(e=>`<div class="drow"><span class="k">${dRu(e.d)}</span><span style="text-align:right">${esc(e.t)}</span></div>`).join('')}</div>`:''}
  <div class="btnrow"><button class="btn" data-x="repSave">${ic('i-dl')}Сохранить</button><button class="btn ghost" data-x="repShare">${ic('i-right')}Поделиться</button></div>
  <p class="foot">Отчёт можно открыть на компьютере и распечатать или сохранить в PDF. Это не медицинское заключение.</p>`}},
 privacy:{t:'Конфиденциальность',r(){const p=state.priv;return `
  <div class="card"><div class="note" style="margin:0">${ic('i-shield')}<span>Все данные хранятся только на этом телефоне. Приложение не отправляет их в интернет.</span></div></div>
  <div class="lbl2">Защита</div>
  <div class="card" style="padding:2px 16px">
   <div class="frow"><span class="k">Вход по PIN-коду<small>${p.pin?'включён':'спрашивать код при открытии'}</small></span><button class="sw ${p.pin?'on':''}" data-x="pin" aria-label="PIN-код"></button></div>
   <div class="frow"><span class="k">Скрывать цифры в уведомлениях<small>на экране блокировки</small></span><button class="sw ${p.hideNotif?'on':''}" data-x="ptog" data-a="hideNotif"></button></div>
   <div class="frow"><span class="k">Анонимная статистика сбоев<small>помогает улучшать приложение</small></span><button class="sw ${p.stats?'on':''}" data-x="ptog" data-a="stats"></button></div>
  </div>
  <div class="lbl2">Доступ к данным</div>
  <div class="card list"><button class="item" data-go="sources"><span class="ic">${ic('i-plug')}</span><span class="t"><b>Разрешения Health Connect</b><small>${state.hc.on?'подключено':'отключено'}</small></span>${ic('i-right','i chev')}</button></div>
  <div class="lbl2">Удаление</div>
  <button class="btn danger wide" style="margin-top:0" data-x="wipeManual">Удалить мои записи и дневник</button>
  <button class="btn danger wide" data-native="clear-device-data">Удалить локальные копии данных приборов</button>
  <button class="btn danger wide" data-x="wipeAll">Сбросить приложение полностью</button>
  <p class="foot">Удаление в «Балансе» не трогает данные в Samsung Health и Health Connect.</p>`}},
 help:{t:'Справка',r(){const Q=[
   ['Откуда берутся данные?','Часы, кольца и весы отправляют данные в своё приложение (например, Samsung Health), а оно — в Health Connect. «Баланс» читает их оттуда с вашего разрешения.'],
   ['Почему показателя нет на «Обзоре»?','Показываются только те, по которым есть записи. Если устройство не передаёт показатель — добавьте его вручную через «Добавить показатель».'],
   ['Почему данные обновились не сразу?','Сначала синхронизируется приложение бренда, затем Health Connect. Нажмите «Синхронизировать» в разделе «Источники».'],
   ['Как поменять цели?','«Ещё» → профиль → «Мои цели». Цели сразу используются в кольцах и графиках.'],
   ['Как перенести данные на новый телефон?','«Экспорт и резервная копия» → «Сохранить резервную копию». На новом телефоне — «Восстановить из файла».'],
   ['Это медицинское приложение?','Нет. «Баланс» показывает ваши данные и сравнивает их с вашими же обычными значениями. Решения о здоровье принимайте с врачом.']];return `
  <div class="card faq" style="padding:4px 16px">${Q.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div>
  <div class="card" style="margin-top:12px;padding:4px 16px"><div class="frow"><span class="k">Версия</span><b>1.16</b></div><div class="frow"><span class="k">Показателей в каталоге</span><b>${M.length}</b></div><div class="frow"><span class="k">Сейчас собрано</span><b>${AV().length}</b></div></div>`}}
};
function reportRows(){const p=state.rperiod;return AV().filter(m=>hasHistory(m)&&series(m,p).length).map(m=>{const v=series(m,p),h=Math.floor(v.length/2),a1=avg(v.slice(0,h)),a2=avg(v.slice(h)),d=(a2-a1)/(a1||1)*100;const u=m.id==='sleep'?'':' '+m.unit,stats=metricSummary(m,p);
  return {n:m.name,a:stats[0][1]+u,r:`${stats[1][1]}–${stats[2][1]}`,t:!Number.isFinite(d)?'—':Math.abs(d)<2?'≈':(d>0?'▲':'▼')+Math.round(Math.abs(d))+'%',c:!Number.isFinite(d)||Math.abs(d)<2?'':d>0?'tr-up':'tr-dn'}})}
function renderPage(){const P=MPAGES[state.page];$('#pTitle').textContent=P.t;$('#pBody').innerHTML=P.r()}
function rerender(){if(state.page&&$('#v-page').classList.contains('on'))renderPage()}

document.addEventListener('click',e=>{const t=e.target.closest('[data-y=avpick]');if(t)return avatarSheet()});

/* ---------- Источники: каждый сервис с переключателем ---------- */
function renderSrcList(){const srcIds=Object.keys(state.srcs||{});
  if(!srcIds.length)return;const el=$('#srcCard');if(!el)return;
  el.innerHTML=`<div style="display:flex;align-items:center;gap:10px"><div class="item" style="padding:0;border:0;min-height:0;flex:1"><div class="ic">${ic('i-plug')}</div><div class="t"><b>Источники данных</b><small>${Object.values(state.srcs).filter(x=>x.on).length} из ${srcIds.length} активны</small></div></div><button class="btn ghost" data-x="srcAll">Включить все</button></div>
  <div class="card" style="padding:2px 16px;margin-top:10px">${srcIds.map(id=>{const s=state.srcs[id];return `<div class="frow"><span style="background:${s.color};width:34px;height:34px;border-radius:11px;display:grid;place-items:center;font-size:15px;font-weight:800;color:#fff">${s.icon}</span><span class="k">${esc(s.name)}<small>${esc(s.types)}</small></span><button class="sw ${s.on?'on':''}" data-x="srctog" data-a="${id}"></button></div>`}).join('')}</div>`}

/* ---------- Health Connect ---------- */
function renderHC(){const h=state.hc,ms=M.filter(m=>m.has),on=ms.filter(m=>h.perm[m.id]!==false).length;
 $('#hcCard').innerHTML=`<div style="display:flex;align-items:center;gap:12px"><div class="item" style="padding:0;border:0;min-height:0;flex:1"><div class="ic">${ic('i-plug')}</div><div class="t"><b>Health Connect</b><small>${h.on?'Samsung Health · '+on+' из '+ms.length+' типов':'Главный путь данных на Android'}</small></div></div><span class="badge" style="${h.on?'':'color:var(--muted)'}">${h.on?'подключено':'не подключено'}</span></div>
 <div class="flow"><span>Часы, весы</span>${ic('i-right')}<span>Приложение бренда</span>${ic('i-right')}<span>Health Connect</span>${ic('i-right')}<span class="me">Баланс</span></div>
 ${h.on?`<div class="hcstat"><i></i>Обновлено ${ago(h.sync)}</div><div class="btnrow"><button class="btn" data-x="sync">Синхронизировать</button><button class="btn ghost" data-x="perms">Разрешения</button></div><button class="btn ghost wide" style="color:var(--muted)" data-x="hcOff">Отключить</button>`
 :`<div class="hcstat off"><i></i>Данные с устройств не поступают</div><button class="btn wide" data-x="hcOn">Подключить Health Connect</button>`}`}
function permSheet(){const ms=M;sheet(sheetHd('Разрешения','Что «Баланс» может читать из Health Connect — запрашиваем максимум')+`
<div class="btnrow" style="margin-bottom:8px"><button class="btn" data-x="permall">Разрешить все ${ms.length}</button><button class="btn ghost" data-x="permnone">Снять все</button></div>
<div class="card" style="padding:2px 16px">${ms.map(m=>`<div class="frow" style="--c:${cv(m)}"><span class="dotc" style="width:12px;height:12px;border-radius:50%;background:var(--c)"></span><span class="k">${esc(m.name)}<small>${m.cat}${m.has?'':' · нет данных'}</small></span><button class="sw ${state.hc.perm[m.id]!==false?'on':''}" data-x="perm" data-a="${m.id}"></button></div>`).join('')}</div><p class="foot">Все ${ms.length} типов запрашиваются сразу, чтобы получать максимум данных. Выключенные типы пропадут с «Обзора». Сами данные в Health Connect останутся.</p>`)}

/* ---------- формы ---------- */
let diaryTags=[],remDraft=null;
function diarySheet(){diaryTags=[];sheet(sheetHd('Новая заметка')+`<form id="fDiary"><label class="field">Дата<input name="d" type="date" value="${localDay()}"></label><label class="field">Что произошло<textarea name="t" rows="3" placeholder="Например: перелёт, плохо спал, новая тренировка" required></textarea></label>
 <div class="field" style="margin-top:12px">Метки<div class="tags">${TAGS.map(([k,n,c])=>`<button type="button" class="tag" style="--tc:${c}" data-x="tag" data-a="${k}">${n}</button>`).join('')}</div></div>
 <button class="btn wide" style="margin-top:16px" type="submit">Сохранить</button></form>`);setTimeout(()=>$('#fDiary textarea')?.focus(),300)}
function remSheet(r){remDraft=r?{...r,days:[...r.days]}:{id:0,t:'Выпить воды',tm:'12:00',days:[0,1,2,3,4,5,6],on:true};const d=remDraft;
 sheet(sheetHd(r?'Изменить напоминание':'Новое напоминание')+`<form id="fRem"><div class="tags">${RPRESET.map(p=>`<button type="button" class="tag" style="--tc:var(--accent)" data-x="rpre" data-a="${p}">${p}</button>`).join('')}</div>
 <label class="field">Текст<input name="t" value="${esc(d.t)}" required maxlength="40"></label>
 <label class="field">Время<input name="tm" type="time" value="${d.tm}" required></label>
 <div class="field" style="margin-top:12px">Дни<div class="days" id="remDays">${WD.map((w,i)=>`<button type="button" data-x="rday" data-a="${i}" class="${d.days.includes(i)?'on':''}">${w}</button>`).join('')}</div></div>
 <button class="btn wide" style="margin-top:16px" type="submit">Сохранить</button>${r?`<button class="btn danger wide" type="button" data-x="remdel" data-a="${r.id}">Удалить</button>`:''}</form>`)}
let pinStep=null;
function pinSheet(){pinStep={a:'',b:''};sheet(sheetHd('PIN-код','4 цифры для входа в приложение')+`<form id="fPin"><label class="field">Новый PIN<input name="a" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required autocomplete="off"></label><label class="field">Повторите<input name="b" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" required autocomplete="off"></label><div id="pinErr" style="color:var(--c-heart);font-size:var(--fs-s);min-height:20px;margin-top:8px"></div><button class="btn wide" type="submit">Включить</button></form>`);setTimeout(()=>$('#fPin input')?.focus(),300)}

/* ---------- экран блокировки ---------- */
let pinIn='';
function showLock(){let L=$('#lock');if(!L){L=document.createElement('div');L.id='lock';L.className='lock';$('#phone').appendChild(L)}pinIn='';drawLock();L.classList.add('on')}
function drawLock(err){const L=$('#lock');L.innerHTML=`<div class="avbig" style="margin:0">${esc((state.prof.name||'?')[0].toUpperCase())}</div><h3>Баланс</h3><p>Введите PIN-код</p><div class="pdots ${err?'err':''}">${[0,1,2,3].map(i=>`<i class="${i<pinIn.length?'f':''}"></i>`).join('')}</div>
 <div class="kpad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button data-x="kp" data-a="${n}">${n}</button>`).join('')}<button class="nb" data-x="kpforgot">Забыли?</button><button data-x="kp" data-a="0">0</button><button class="nb" data-x="kpdel">Стереть</button></div>`}

/* ---------- обработчики ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-x]');if(!t)return;const x=t.dataset.x,a=t.dataset.a,b=t.dataset.b;e.stopPropagation();
  const P=state.prof;
  switch(x){
   case 'sex':P.sex=a;t.parentNode.querySelectorAll('button').forEach(z=>z.classList.toggle('on',z===t));return;
   case 'delrec':{const r=state.manual[a].rec[+b];confirmSheet('Удалить запись?',`${esc(byId[a].name)}: ${show(byId[a],r.v,r.lo)} · ${esc(r.d)}`,'Удалить',()=>{state.manual[a].rec.splice(+b,1);saveManual();renderAll();rerender();toast('Запись удалена')});return}
   case 'diaryNew':return diarySheet();
   case 'tag':{const i=diaryTags.indexOf(a);i>=0?diaryTags.splice(i,1):diaryTags.push(a);t.classList.toggle('on');return}
   case 'delnote':confirmSheet('Удалить заметку?',esc(state.diary.find(z=>z.id==a)?.t||''),'Удалить',()=>{state.diary=state.diary.filter(z=>z.id!=a);saveP();rerender();renderMore()});return;
   case 'remNew':return remSheet();
   case 'remedit':return remSheet(state.rem.find(z=>z.id==a));
   case 'remtog':{const r=state.rem.find(z=>z.id==a);r.on=!r.on;saveP();rerender();renderMore();toast(r.on?'Напоминание включено':'Напоминание выключено',`${r.tm} · ${r.t}`,'i-bell');return}
   case 'remdel':confirmSheet('Удалить напоминание?',esc(remDraft.t),'Удалить',()=>{state.rem=state.rem.filter(z=>z.id!=a);saveP();rerender();renderMore()});return;
   case 'rpre':{const f=$('#fRem');f.t.value=a;return}
   case 'rday':{const i=+a,k=remDraft.days.indexOf(i);k>=0?remDraft.days.splice(k,1):remDraft.days.push(i);remDraft.days.sort();t.classList.toggle('on');return}
   case 'remTest':return testNativeReminder();
   case 'backup':{const keys=Object.keys(localStorage).filter(k=>k.startsWith('balans2.')&&k!=='balans2.priv');const o={app:'Баланс',v:1,date:new Date().toISOString(),data:{...Object.fromEntries(keys.map(k=>[k,LS.get(k)])),'balans2.deviceData':state.deviceData,'balans2.healthInfo':state.healthInfo}};
     download('balans-backup-'+localDay()+'.json',JSON.stringify(o,null,1),'application/json');state.lastBackup=Date.now();LS.set('balans2.backup',state.lastBackup);rerender();toast('Копия подготовлена','Файл содержит реальные записи и настройки','i-dl');return}
   case 'csv':{const cell=x=>'"'+String(x??'').replace(/"/g,'""')+'"',row=a=>a.map(cell).join(';'),L=[row(['Показатель','Дата','Значение','Единица','Источник'])];M.forEach(m=>recs(m).forEach(r=>L.push(row([m.name,r.d||actualDate(r),m.id==='bp'?`${r.v}/${Number.isFinite(r.lo)?r.lo:'—'}`:String(r.v).replace('.',','),m.unit,r.source?(r.source.startsWith('Bluetooth')?r.source:'Health Connect · '+r.source):'Вручную']))));
     state.diary.forEach(d=>L.push(row(['Дневник',dRu(d.d),d.t,'',d.tags.map(t=>TAGM[t][1]).join(', ')])));
     download('balans-zapisi.csv','\ufeff'+L.join('\n'),'text/csv');toast('Таблица сохранена',`${L.length-1} строк`,'i-file');return}
   case 'restore':return $('#restoreIn').click();
   case 'rper':state.rperiod=a;return rerender();
   case 'repSave':return download('balans-otchet.html',reportHTML(),'text/html'),toast('Отчёт сохранён','откройте файл и распечатайте в PDF','i-file');
   case 'repShare':{const txt=reportText();if(window.BalansSave?.shareText)window.BalansSave.shareText(txt);else if(navigator.share)navigator.share({title:'Отчёт · Баланс',text:txt}).catch(()=>{});else if(navigator.clipboard)navigator.clipboard.writeText(txt).then(()=>toast('Отчёт скопирован','вставьте в сообщение врачу'),()=>toast('Не удалось скопировать'));else download('balans-report.txt',txt,'text/plain');return}
   case 'pin':if(state.priv.pin){confirmSheet('Выключить PIN-код?','Приложение будет открываться без кода.','Выключить',()=>{state.priv.pin='';saveP();rerender();toast('PIN-код выключен')})}else pinSheet();return;
   case 'ptog':state.priv[a]=!state.priv[a];saveP();return rerender();
   case 'animTog':{state.anim=!(state.anim!==false);LS.set('balans2.anim',state.anim);applyAnim();return rerender();}
   case 'wipeManual':confirmSheet('Удалить ваши записи?','Будут удалены все ручные записи и дневник. Данные устройств останутся.','Удалить',()=>{state.manual={};saveManual();state.diary=[];saveP();renderAll();rerender();toast('Записи удалены')});return;
   case 'wipeAll':confirmSheet('Сбросить приложение?','Удалятся записи, дневник, напоминания, цели и оформление. Отменить будет нельзя.','Сбросить',async()=>{if(!await clearHealthCache())return toast('Не удалось очистить историю','Повторите сброс после перезапуска');window.BalansReminders?.clear();Object.keys(localStorage).filter(k=>k.startsWith('balans2.')).forEach(k=>localStorage.removeItem(k));location.reload()});return;
   case 'confirm':{const cb=confirmCb;confirmCb=null;closeSheet();cb&&cb();return}
   case 'sync':return nativeHealth('sync');
   case 'perms':return permSheet();
   case 'perm':return nativeHealth('connect');
   case 'hcOff':return nativeHealth('disconnect');
   case 'hcOn':return nativeHealth('connect');
   case 'kp':if(pinIn.length<4){pinIn+=a;drawLock();if(pinIn.length===4)setTimeout(()=>{if(pinIn===state.priv.pin){$('#lock').classList.remove('on')}else{pinIn='';drawLock(true)}},150)}return;
   case 'kpdel':pinIn=pinIn.slice(0,-1);return drawLock();
   case 'kpforgot':return toast('Если забыли PIN','PIN можно сбросить через «Сбросить приложение». Локальные данные при этом удаляются.');
  }
},true);
function validateBackup(o){
 if(o?.app!=='Баланс'||!o.data||typeof o.data!=='object'||Array.isArray(o.data))return false;
 const arrays=new Set(['diary','rem','body','fold','pin','pick','cardOrder','savedDevices']);
 for(const [k,v]of Object.entries(o.data)){
  if(!k.startsWith('balans2.'))return false;
  const short=k.slice(8);
  if(arrays.has(short)&&v!==null&&!Array.isArray(v))return false;
  if(['manual','deviceData','bleData','prof','priv','pal','top','goal','wk','cardSize'].includes(short)&&(v===null||typeof v!=='object'||Array.isArray(v)))return false;
  if(['manual','deviceData','bleData'].includes(short))for(const [id,value]of Object.entries(v)){
   if(!byId[id])return false;
   const records=short==='manual'?value?.rec:value;
   if(!Array.isArray(records)||records.length>50000||records.some(r=>!r||!Number.isFinite(r.v)||!Number.isFinite(recordTimestamp(r))))return false;
  }
 }
 return true;
}
document.addEventListener('change',e=>{if(e.target.id!=='restoreIn')return;const f=e.target.files[0];if(!f)return;if(f.size>20*1024*1024)return toast('Файл слишком большой','Максимум 20 МБ');const rd=new FileReader();rd.onload=()=>{try{const o=JSON.parse(rd.result);if(!validateBackup(o))throw 0;
  confirmSheet('Восстановить из копии?',`Копия от ${new Date(o.date).toLocaleString('ru-RU')}. Записи и настройки из файла заменят соответствующие текущие данные.`,'Восстановить',async()=>{let ok=true;Object.entries(o.data).forEach(([k,v])=>{if(k!=='balans2.deviceData'&&!LS.set(k,v))ok=false});if(o.data['balans2.deviceData'])ok=await restoreHealthCache(o.data['balans2.deviceData'],o.data['balans2.healthInfo']||state.healthInfo)&&ok;if(ok)location.reload();else{healthCacheSuspended=false;toast('Копия восстановлена не полностью','Недостаточно места в памяти. Освободите место и повторите восстановление.')}})}catch{toast('Не удалось прочитать копию','Нужен JSON-файл «Баланса» с корректными измерениями.')}};rd.readAsText(f);e.target.value=''});
document.addEventListener('submit',e=>{const id=e.target.id;if(!['fProf','fDiary','fRem','fPin'].includes(id))return;e.preventDefault();const f=new FormData(e.target);const num=x=>parseFloat(String(x).replace(',','.').replace(/\s/g,''));
  if(id==='fProf'){const P=state.prof;P.name=(f.get('name')||'').trim()||'Без имени';P.year=(f.get('year')||'').trim();const h=num(f.get('height'));if(h>80&&h<250)P.height=h;
    [['steps',1000,60000],['sleep',4,12],['water',500,6000],['active',100,3000]].forEach(([k,lo,hi])=>{const v=num(f.get(k));if(isFinite(v)&&v>=lo&&v<=hi)P.goals[k]=v});
    saveP();renderAll();rerender();toast('Профиль сохранён','цели обновлены на «Обзоре»')}
  if(id==='fDiary'){const t=(f.get('t')||'').trim();if(!t)return;state.diary.push({id:Date.now(),d:f.get('d')||localDay(),t,tags:[...diaryTags]});saveP();closeSheet();rerender();renderMore();toast('Заметка добавлена',dRu(f.get('d')||localDay()),'i-book')}
  if(id==='fRem'){if(!remDraft.days.length)return toast('Выберите хотя бы один день');remDraft.t=(f.get('t')||'').trim()||'Напоминание';remDraft.tm=f.get('tm');
    if(remDraft.id){const i=state.rem.findIndex(z=>z.id===remDraft.id);state.rem[i]=remDraft}else{remDraft.id=Date.now();state.rem.push(remDraft)}saveP();closeSheet();rerender();renderMore();toast('Напоминание сохранено',`${remDraft.tm} · ${daysTxt(remDraft.days)}`,'i-bell')}
  if(id==='fPin'){const a=f.get('a'),b=f.get('b');if(!/^\d{4}$/.test(a))return $('#pinErr').textContent='Нужно 4 цифры';if(a!==b)return $('#pinErr').textContent='Коды не совпадают';state.priv.pin=a;saveP();closeSheet();rerender();toast('PIN-код включён','спросим его при следующем открытии','i-shield')}
},true);

/* ---------- профиль на экранах + цели ---------- */
function renderProfileBits(){const n=state.prof.name||'Без имени',av=state.avatar;
  document.querySelectorAll('.avatar').forEach(a=>{a.textContent='';
  if(av&&AVATARS.some(x=>x.id===av)){const A=AVATARS.find(x=>x.id===av);a.innerHTML=A.svg;a.style.background='none';a.style.padding='0'}
  else if(av&&String(av).startsWith('data:')){a.innerHTML=`<img src="${av}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;a.style.background='none';a.style.padding='0'}
  else{a.textContent=n[0].toUpperCase();a.style.background='';a.style.padding=''}});
  const h=$('#v-overview .top h2');if(h)h.textContent='Привет, '+n;const pb=$('#v-more .profile b');if(pb)pb.textContent=n}
function moreBadges(){const on=state.rem.filter(r=>r.on).length;return {sources:state.hc.on?'подключено':'выкл.',remind:on?String(on):'',diary:state.diary.length?String(state.diary.length):'',privacy:state.priv.pin?'PIN':''}}
function reportText(){const P={week:'7 дней',month:'30 дней',year:'12 месяцев'};return `Баланс · отчёт за ${P[state.rperiod]} (по ${new Date().toLocaleDateString('ru-RU')})\n${state.prof.name}\n\n`+reportRows().map(r=>`${r.n}: среднее ${r.a}, ${r.r} (${r.t})`).join('\n')+(state.diary.length?'\n\nСобытия:\n'+state.diary.map(d=>`${dRu(d.d)} — ${d.t}`).join('\n'):'')+'\n\nНе является медицинским заключением.'}
function reportHTML(){const P={week:'7 дней',month:'30 дней',year:'12 месяцев'};const p=state.prof;return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Отчёт · Баланс</title><style>body{font:15px/1.5 system-ui,sans-serif;color:#121821;max-width:760px;margin:40px auto;padding:0 20px}h1{margin:0}small{color:#667}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:9px 8px;border-bottom:1px solid #dde3ea}th{color:#667;font-size:13px}.n{font-variant-numeric:tabular-nums}h2{margin-top:28px;font-size:18px}footer{margin-top:30px;color:#889;font-size:12px}</style></head><body>
<h1>Отчёт о показателях</h1><small>${esc(p.name)}${p.year?' · '+esc(p.year)+' г.р.':''} · рост ${p.height} см · период: ${P[state.rperiod]} по ${new Date().toLocaleDateString('ru-RU')}</small>
<table><tr><th>Показатель</th><th>Среднее</th><th>Мин–макс</th><th>Тренд</th></tr>${reportRows().map(r=>`<tr><td>${esc(r.n)}</td><td class="n">${r.a}</td><td class="n">${r.r}</td><td>${r.t}</td></tr>`).join('')}</table>
${state.diary.length?`<h2>События из дневника</h2><table>${state.diary.slice().sort((a,b)=>b.d.localeCompare(a.d)).map(d=>`<tr><td style="width:130px">${dRu(d.d)}</td><td>${esc(d.t)}</td></tr>`).join('')}</table>`:''}
<footer>Источники: ${demoOn()?'демонстрационные данные, ':''}${Object.keys(state.deviceData||{}).length?'Health Connect, ':''}${Object.keys(state.bleData||{}).length?'Bluetooth, ':''}ручные записи при наличии. Сформировано приложением «Баланс». Не является медицинским заключением.</footer></body></html>`}
