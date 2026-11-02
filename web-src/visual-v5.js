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
