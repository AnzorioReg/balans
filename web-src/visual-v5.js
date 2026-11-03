/* V5: restrained visual system and a compact, truthful source screen. */
(function(){
const added=[['premium-line','Премиум · линия'],['premium-round','Премиум · пластика'],['premium-solid','Премиум · силуэт']];
ICON_STYLES.splice(0,ICON_STYLES.length,...ICON_STYLES.filter(x=>['outline','emoji','soft'].includes(x[0])),...added);
const wanted=window.balansV5Icon||state.iconSet;delete window.balansV5Icon;state.iconSet=ICON_STYLES.some(x=>x[0]===wanted)?wanted:'outline';LS.set('balans2.iconSet',state.iconSet);
const target=document.querySelector('symbol')?.parentNode;if(!target)throw new Error('SVG symbols missing');
for(const [name,g]of Object.entries(HEALTH_GLYPHS)){
 document.getElementById(semanticGlyph(name,'outline'))?.querySelectorAll('[stroke-width]').forEach(p=>p.setAttribute('stroke-width','1.35'));
 for(const [id]of added){const s=document.createElementNS('http://www.w3.org/2000/svg','symbol');s.id=semanticGlyph(name,id);s.setAttribute('viewBox','0 0 24 24');
 s.innerHTML=id==='premium-solid'?'<g fill="currentColor" stroke="none">'+(g.solid||'')+'</g>'+(g.cut?'<g fill="none" stroke="var(--glyph-cut,var(--surface))" stroke-width="1.5" stroke-linecap="round">'+g.cut+'</g>':'')+(g.extra?'<g fill="none" stroke="currentColor" stroke-width="1.6">'+g.extra+'</g>':''):'<g fill="none" stroke="currentColor" stroke-width="'+(id==='premium-line'?1.25:1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+g.outline+'</g>';target.appendChild(s);}
}
const dark=[['batch14','Премиум · исходная','#070b12','#5fe3c8','#5aa9ff'],['sapphire','Сапфир','#080e18','#83b5ff','#a99dff'],['iris','Ирис','#100e18','#c0a9ff','#8cdbe3'],['ice','Лёд','#0a1118','#9bddeb','#87afff'],['silver','Серебро','#0c1118','#d4deee','#84b3e5'],['gold','Шампань','#11110f','#e6c88f','#9fb8db'],['rose','Розовый кварц','#141016','#e5afc5','#b1bfff'],['ocean','Морской бриз','#080f15','#83cbdf','#a6c5ff'],['mint','Нефритовый свет','#0b1210','#8ed6bf','#b7b7ed'],['indigo','Индиго','#0c0f19','#a7b9ff','#d9b0df']];
PALS.dark.splice(0,PALS.dark.length,...dark.map(([id,n,bg,a,b])=>['luxe-'+id,n,bg,b,a]));
let css='';for(const [id,n,bg,a,b]of dark){if(id==='batch14')continue;css+=`html[data-theme=dark][data-pal="luxe-${id}"]{--bg:${bg};--surface:color-mix(in srgb,${bg} 90%,#637384);--surface2:color-mix(in srgb,${bg} 82%,#637384);--surface3:color-mix(in srgb,${bg} 70%,#637384);--accent:${a};--accent-ink:#09141a;--text:#f2f6fb;--muted:#b6c3cf;--faint:#9aaaba;--line:#243141;--luxe-second:${b};--r-lg:22px;--shadow-card:0 14px 38px #00000045;--nav-one:${a};--nav-two:${b};--nav-three:color-mix(in srgb,${a} 45%,${b});--luxe-glow:radial-gradient(ellipse at 90% 0%,color-mix(in srgb,${a} 9%,transparent),transparent 62%),radial-gradient(ellipse at 0% 30%,color-mix(in srgb,${b} 7%,transparent),transparent 65%),${bg};}`;}
if(!PALS.dark.some(x=>x[0]===state.pal.dark)){state.pal.dark='luxe-batch14';LS.set('balans2.pal',state.pal);}
css+=`html[data-icon-set=emoji] #groups .ic svg{width:24px;height:24px}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) #moreList .item:nth-child(3n+1) .ic{color:var(--nav-one)}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) #moreList .item:nth-child(3n+2) .ic{color:var(--nav-two)}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) #moreList .item:nth-child(3n) .ic{color:var(--nav-three)}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) .tabbar button:nth-child(3n+1) .i{color:var(--nav-one)}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) .tabbar button:nth-child(3n+2) .i{color:var(--nav-two)}
html[data-theme=dark][data-pal^=luxe-]:not([data-pal=luxe-batch14]) .tabbar button:nth-child(3n) .i{color:var(--nav-three)}
.ble-status{font-size:14px;line-height:1.4;margin:12px 0}.source-issue{font-size:13px;line-height:1.45}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
for(const group of MORE)group[1]=group[1].filter(x=>x[0]!=='manual');
function transformPage(key,change){const before=MPAGES[key].r;MPAGES[key].r=function(){const box=document.createElement('div');box.innerHTML=before.call(this);change(box);return box.innerHTML;};}
transformPage('export',box=>box.querySelector('[data-x=csv]')?.remove());
transformPage('privacy',box=>{for(const h of box.querySelectorAll('.lbl2'))if(h.textContent.trim()==='Доступ к данным'){const next=h.nextElementSibling;if(next?.querySelector('[data-go=sources]'))next.remove();h.remove();}});
const oldVisualPrefs=renderVisualPreferences;renderVisualPreferences=function(){const node=oldVisualPrefs();for(const h of node.querySelectorAll('.lbl2'))if(/Наборы значков|Наборы карточек/.test(h.textContent))h.textContent='Значки';return node;};
const isNotice=text=>/сохранена последняя точка часа|в сессиях с более чем 200 фазами/.test(text);
function classify(info){const warnings=info.warnings||[];return {...info,warnings:warnings.filter(x=>!isNotice(x)),notices:[...(info.notices||[]),...warnings.filter(isNotice)]};}
state.healthInfo=classify(state.healthInfo);
const healthBefore=window.onHealthEvent;window.onHealthEvent=function(ev){const clean=ev.type==='synced'?classify(ev):ev;healthBefore(clean);if(ev.type==='synced'){state.healthInfo.notices=clean.notices;LS.set('balans2.healthInfo',state.healthInfo);}};
renderHC=function(){const el=document.querySelector('#hcCard');if(!el)return;const h=state.healthInfo,issues=h.warnings||[];
 el.innerHTML='<div class="item"><span class="ic">'+ic('i-plug')+'</span><span class="t"><b>Health Connect</b><small>'+(state.hc.on?'Подключён':'Не подключён')+'</small></span></div><p role="status">'+esc(healthBusy?'Синхронизация…':healthMessage||(h.at?'Обновлено '+new Date(h.at).toLocaleString('ru-RU'):'Разрешите чтение данных и истории'))+'</p><div class="btnrow"><button class="btn" data-native="hc-connect" '+(healthBusy?'disabled':'')+'>'+(state.hc.on?'Изменить разрешения':'Подключить')+'</button><button class="btn ghost" data-native="hc-sync" '+(healthBusy?'disabled':'')+'>Синхронизировать</button></div><div class="btnrow"><button class="btn ghost" data-native="hc-settings">Настройки Health Connect</button>'+(state.hc.on?'<button class="btn ghost" data-native="hc-disconnect">Отключить</button>':'')+(healthInstall?'<button class="btn ghost" data-native="hc-install">Установить</button>':'')+'</div>'+(issues.length?'<details class="source-issue"><summary>Ограничения доступа или чтения</summary><p>'+issues.map(esc).join('<br>')+'</p></details>':'');};
renderSrcList=function(){const el=document.querySelector('#srcCard');if(!el)return;
 const button=(action,text,disabled=false,extra='')=>'<button class="btn ghost" data-native="'+action+'" '+extra+' '+(disabled?'disabled':'')+'>'+text+'</button>';
 const busy=bleState.connected||bleState.connecting;
 el.innerHTML='<div class="card ble-card"><b>Приборы по Bluetooth</b><div class="btnrow">'+button('ble-scan',bleState.scanning?'Поиск…':'Найти прибор',busy)+button('ble-stop','Остановить')+button('ble-scan-all','Расширенный поиск',busy)+'</div><div class="lbl2">Сохранённые приборы</div>'+state.savedDevices.map(d=>'<div class="item ble-device-row is-saved"><span class="t"><b>'+esc(d.name)+'</b></span>'+button('ble-connect','Подключить',busy,'data-address="'+esc(d.address)+'"')+'<button class="xbtn" data-native="ble-forget" data-address="'+esc(d.address)+'" aria-label="Забыть прибор">×</button></div>').join('')+'<label class="frow"><span class="k">Автоподключение</span><input type="checkbox" id="bleAuto" '+(state.bleAuto?'checked':'')+' aria-label="Автоподключение"></label><p class="ble-status" id="bleStatus" role="status">'+esc(bleState.message)+'</p><div id="bleDevices">'+Object.values(bleState.devices).map(d=>'<div class="item ble-device-row"><span class="t"><b>'+esc(d.name||'BLE-прибор')+'</b></span>'+button('ble-connect','Подключить',false,'data-address="'+esc(d.address)+'"')+'</div>').join('')+'</div>'+(bleState.connected?button('ble-disconnect','Отключить прибор'):'')+(bleState.last?'<p class="ble-status">'+esc(bleState.last)+'</p>':'')+'</div>';};
renderSources=function(){const view=document.querySelector('#v-sources');if(!view)return;view.querySelector('#srcF')?.remove();view.querySelector('#srcList')?.remove();for(const node of [...view.children])if(node.classList.contains('card')&&!node.id)node.remove();renderHC();renderSrcList();};
visualPrefs();
})();

/* V6: compact strips, safer launcher picker, list polish and interface fixes. */
(function(){
const css=`
html[data-icon-set=emoji] #groups .ic svg{width:20px!important;height:20px!important}
#hcCard .btnrow .btn[data-native=hc-sync]{white-space:nowrap;font-size:13px;padding:0 10px;min-width:0}
.activity-glyph[data-hero-style=heart] path{stroke-width:13!important}
.activity-glyph[data-hero-style=heart] path[data-part=track-outline]{stroke-width:15!important;opacity:.13!important}
.lst{display:flex;flex-direction:column;gap:3px;border-radius:18px;overflow:visible}
.lst .lr{border:1px solid color-mix(in srgb,var(--c) 14%,var(--line));border-radius:14px;background:linear-gradient(90deg,color-mix(in srgb,var(--c) 9%,transparent),transparent 72%);min-height:50px}
.dashboard-pick-done{font-size:0!important;color:var(--muted)!important}
.dashboard-pick-done::after{content:'Выбрать все';font-size:12px;font-weight:600}
.activity-metrics[data-layout=soft] .metric-ring svg circle{stroke-width:4!important}
.activity-metrics[data-layout=soft] button{background:color-mix(in srgb,var(--tc) 6%,var(--surface));border:1px solid color-mix(in srgb,var(--tc) 16%,var(--line));border-radius:16px}
.activity-metrics[data-layout=thin] .metric-ring svg circle{stroke-width:2.5!important}
.activity-metrics[data-layout=thin] .metric-ring{width:calc(30px * var(--ms));height:calc(30px * var(--ms))}
.activity-metrics[data-layout=duo] .metric-ring{display:none!important}
.activity-metrics[data-layout=duo] .metric-dot{width:26px;height:6px;border-radius:6px;background:var(--tc)}
.activity-metrics[data-layout=duo] b{font-size:calc(17px * var(--ms))}
.activity-metrics[data-layout=micro] .metric-ring{width:calc(24px * var(--ms));height:calc(24px * var(--ms))}
.activity-metrics[data-layout=micro] .metric-ring em svg{width:11px;height:11px}
.activity-metrics[data-layout=micro] b{font-size:calc(13px * var(--ms))}
.activity-metrics[data-layout=micro] .metric-copy>span{font-size:calc(8px * var(--ms))}
`;
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:css}));
const drop=['premium-line','premium-round'];
for(let i=ICON_STYLES.length-1;i>=0;i--)if(drop.includes(ICON_STYLES[i][0]))ICON_STYLES.splice(i,1);
if(drop.includes(state.iconSet)){state.iconSet='outline';LS.set('balans2.iconSet','outline')}
if(!HERO_PALETTES.some(x=>x[0]==='pulse'))HERO_PALETTES.push(['pulse','Пульс',['#ff3d81','#ffd166','#4cc9f0']]);
const layouts=[['inline','Кольца в строку'],['soft','Мягкие кольца'],['thin','Тонкие кольца'],['duo','Точка и число'],['micro','Микро']];
HERO_LAYOUTS.splice(0,HERO_LAYOUTS.length,...layouts);
if(!layouts.some(x=>x[0]===state.top.layout))state.top.layout='inline';
LS.set('balans2.top',state.top);
document.addEventListener('input',e=>{const r=e.target;if(r.tagName==='INPUT'&&r.type==='range'&&Number(r.min)>=100)r.min=60;},true);
let lastTrigger=null;
new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes)if(n.nodeType===1&&n.classList?.contains('dashboard-popover'))n.dataset.trigger=lastTrigger||'';}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('pointerdown',e=>{const d=e.target.closest('.dots[data-dashboard]');if(d)lastTrigger=d.dataset.dashboard;},true);
document.addEventListener('click',e=>{const d=e.target.closest('.dots[data-dashboard]');if(!d)return;const pop=[...document.querySelectorAll('.dashboard-popover')].find(p=>p.dataset.trigger===d.dataset.dashboard);if(pop){e.stopPropagation();e.preventDefault();pop.remove();document.querySelector('.scrim.on')?.classList.remove('on');}},true);
const SAFE=new Set(['balance','heart','pulse','ecg','run']);
document.addEventListener('click',e=>{const b=e.target.closest('.avp[data-id],.avp[data-icon],[data-launcher-id]');if(!b)return;const id=b.dataset.id||b.dataset.icon||b.dataset.launcherId;if(id&&!SAFE.has(id)){e.preventDefault();e.stopPropagation();const t=document.createElement('div');t.textContent='Этот вариант значка пока недоступен: выберите один из базовых пяти.';t.style.cssText='position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:#222c39;color:#fff;padding:10px 14px;border-radius:12px;z-index:99;font-size:13px';document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}},true);
})();

/* V7: restore dashboard menu, broaden launcher guard, thicken heart strokes. */
(function(){
document.head.appendChild(Object.assign(document.createElement('style'),{textContent:`
.activity-glyph[data-hero-style=heart] path{stroke-width:18!important}
.activity-glyph[data-hero-style=heart] path[data-part=track-outline]{stroke-width:20!important;opacity:.12!important}
`}));
setInterval(()=>{document.querySelectorAll('.dashboard-popover').forEach(p=>p.removeAttribute('data-trigger'))},50);
const SAFE=new Set(['balance','heart','pulse','ecg','run']);
const pickId=b=>b.dataset.appIcon||b.dataset.identity||b.dataset.iconId||b.dataset.launcher||b.dataset.id||b.dataset.icon;
document.addEventListener('click',e=>{const b=e.target.closest('[data-app-icon],[data-identity],[data-icon-id],[data-launcher],.avp');if(!b)return;const id=pickId(b);if(id&&!SAFE.has(id)){e.preventDefault();e.stopPropagation();if(typeof toast==='function')toast('Значок недоступен','Этот вариант требует обновления Android-части','i-info');}},true);
})();
