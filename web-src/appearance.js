/* Appearance is independent of measurement availability. */
const APP_IDENTITIES=__APP_IDENTITIES__;
const EXTRA_THEMES={
 dark:[
 ['ember','Коралловая ночь','#160d12','#21131a','#2c1c25','#3d2934','#ffa891'],
 ['lagoon','Лагуна','#06161b','#0c222a','#122e38','#1b3c48','#65e6f6'],
 ['forest','Лесной свет','#0b1611','#14241a','#1e3023','#2a3f2c','#b6ed7a'],
 ['sakura','Ночная сакура','#180e18','#241624','#311f32','#422a43','#ffa7d3'],
 ['cobalt','Кобальт','#0b1225','#141e36','#1d2a47','#293a5c','#89b8ff']
 ],
 light:[
 ['peach','Персик','#fff2ea','#fffaf6','#f7e9df','#efdbcd','#a43c21'],
 ['pistachio','Фисташка','#f2f7e7','#fcfff6','#e9f0dc','#dce7c9','#456900'],
 ['pearl','Жемчуг','#f3f4fc','#ffffff','#e9ebf8','#dce0f2','#5353b4'],
 ['rose','Розовый кварц','#fff0f4','#fffafd','#f8e4ec','#eed1df','#a52b64'],
 ['aqua','Аквамарин','#eaf8f8','#f8ffff','#dbefef','#c9e4e5','#006e79']
 ]
};
let themeCss='';
Object.entries(EXTRA_THEMES).forEach(([mode,themes])=>themes.forEach(([id,name,bg,surface,surface2,surface3,accent])=>{
 PALS[mode].push([id,name,bg,surface3,accent]);
 themeCss+=`[data-theme="${mode}"][data-pal="${id}"]{--bg:${bg};--surface:${surface};--surface2:${surface2};--surface3:${surface3};--accent:${accent};--accent-ink:${mode==='dark'?'#10131a':'#ffffff'};--line:${mode==='dark'?'#4a4f60':'#b5bdcd'};--text:${mode==='dark'?'#f5f6ff':'#182332'};--muted:${mode==='dark'?'#bdc4d5':'#4c5d70'};--faint:${mode==='dark'?'#a1adbe':'#5f6d7d'}}`;
}));
const appearanceCss=document.createElement('style');
appearanceCss.textContent=themeCss+`
.app-icon-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
.app-icon-choice{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;padding:6px 2px;font-size:12px;line-height:1.2;border:1px solid transparent;border-radius:12px}
.app-icon-choice.on{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 10%,var(--surface))}
.app-icon-choice svg{width:100%;max-width:62px;aspect-ratio:1;border-radius:16px;filter:var(--visual-filter,none)}
.sources-fold{margin:16px 0}.sources-fold>summary{cursor:pointer;font-weight:650;display:flex;gap:8px;align-items:center;min-height:48px;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--surface)}
.sources-fold>summary::before{content:'+';color:var(--accent);font-size:22px}.sources-fold[open]>summary::before{content:'−'}.sources-fold>summary span{margin-left:auto;color:var(--muted)}
.chart-comparison{display:grid;grid-template-columns:1fr 1fr;gap:8px}.chart-comparison>div{min-width:0}.chart-comparison small{display:block;color:var(--muted);font-size:12px;margin-bottom:4px}
button:disabled{opacity:.5;cursor:default}.activity-glyph{filter:var(--visual-filter,none)!important}
#v-themes .lbl2{margin:14px 0 7px;font-size:12px}
#v-themes .pg-intro{font-size:12px;line-height:1.4;margin-bottom:10px}
#v-themes .pals{gap:6px}
#v-themes .pal{font-size:10px;line-height:1.25;min-width:0;overflow-wrap:anywhere}
#v-themes .psw{height:36px!important;border-radius:10px;padding:5px}
#v-themes .lay{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}
#v-themes .lay button{padding:9px 7px;border-radius:10px;min-width:0;font-size:12px;overflow-wrap:anywhere}
#v-themes .lay small{font-size:10px}
#v-themes .visual-choices{gap:6px}
#v-themes .visual-choice{padding:8px;border-radius:11px}
#v-themes .visual-choice b{font-size:12px;padding-right:12px}
#v-themes .visual-choice small{font-size:10px;line-height:1.35;margin-top:3px}
#v-themes .choice-preview{height:28px;margin-bottom:5px;gap:9px}
#v-themes .choice-preview .real-visual{height:28px}
#v-themes .choice-preview>svg.i{width:22px;height:22px}
#v-themes .app-icon-grid{gap:5px}
#v-themes .app-icon-choice{font-size:10px;gap:4px;padding:5px 2px}
#v-themes .app-icon-choice svg{max-width:46px;border-radius:12px}
#v-themes .foot{font-size:11px;line-height:1.4}
.appearance-levels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
#v-themes .appearance-levels .contrast-control{margin:0!important;padding:10px;min-width:0}
#v-themes .appearance-levels .contrast-label{flex-wrap:wrap;gap:3px;margin-bottom:3px;font-size:12px}
#v-themes .appearance-levels output{font-size:10px}
#v-themes .appearance-levels input{height:28px}
#v-themes .appearance-levels .contrast-ends{font-size:10px}
#v-themes .appearance-step-controls{margin-top:4px!important}
#v-themes .appearance-reset{grid-column:1/-1;margin:0;padding:8px;font-size:12px}
@media(max-width:340px){.appearance-levels{grid-template-columns:1fr}}
`;
document.head.appendChild(appearanceCss);
state.appIcon=LS.get('balans2.appIcon','heart');
function identitySVG(item){
 return `<svg viewBox="0 0 108 108" role="img" aria-label="${esc(item.name)}"><rect width="108" height="108" rx="26" fill="#0b0f15"/><g fill="none" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">${item.paths.map((p,i)=>`<path d="${p}" stroke="${item.colors[i%item.colors.length]}"/>`).join('')}</g></svg>`;
}
function renderIdentityPrefs(){
 const node=document.createElement('section');node.id='identityPreferences';
 node.innerHTML=`<div class="lbl2">Иконка приложения</div><div class="app-icon-grid">${APP_IDENTITIES.map(item=>`<button class="app-icon-choice ${state.appIcon===item.id?'on':''}" data-app-icon="${item.id}" aria-pressed="${state.appIcon===item.id}">${identitySVG(item)}<span>${esc(item.name)}</span></button>`).join('')}</div><p class="foot" id="appIconStatus">${window.BalansAppearance?'Выбранный значок появится на рабочем столе. Некоторые оболочки обновляют его не сразу.':'В HTML доступен предпросмотр. Иконка на телефоне меняется в APK.'}</p>`;
 return node;
}
window.onAppearanceEvent=function(ev){
 if(APP_IDENTITIES.some(i=>i.id===ev.id)){state.appIcon=ev.id;LS.set('balans2.appIcon',ev.id)}
 document.querySelectorAll('[data-app-icon]').forEach(b=>{b.classList.toggle('on',b.dataset.appIcon===state.appIcon);b.setAttribute('aria-pressed',String(b.dataset.appIcon===state.appIcon))});
 if(ev.message&&$('#appIconStatus'))$('#appIconStatus').textContent=ev.message;
 const chosen=APP_IDENTITIES.find(i=>i.id===state.appIcon);
 if(chosen)document.querySelector('link[rel=icon]')?.setAttribute('href','data:image/svg+xml,'+encodeURIComponent(identitySVG(chosen)));
};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-app-icon]');if(!b)return;
 if(window.BalansAppearance)window.BalansAppearance.setIcon(b.dataset.appIcon);
 else onAppearanceEvent({id:b.dataset.appIcon,message:'Предпросмотр выбран. Для изменения значка на телефоне используйте APK.'});
});
document.addEventListener('change',e=>{
 if(e.target.id==='bleAuto'){state.bleAuto=e.target.checked;LS.set('balans2.bleAuto',state.bleAuto);if(state.bleAuto)tryBleAuto()}
});
const baseRenderThemes=renderThemes;
renderThemes=function(){
 baseRenderThemes();
 const view=$('#v-themes');if(!view)return;
 view.querySelector('#visualPreferences')?.remove();view.querySelector('#identityPreferences')?.remove();
 view.appendChild(renderVisualPreferences());view.appendChild(renderIdentityPrefs());
 if(!view.querySelector('.appearance-levels')){
  const contrast=view.querySelector('#contrastRange')?.closest('.contrast-control');
  const brightness=view.querySelector('#brightnessRange')?.closest('.contrast-control');
  const reset=view.querySelector('.appearance-reset');
  if(contrast&&brightness){
   const levels=document.createElement('div');levels.className='appearance-levels';
   contrast.before(levels);levels.append(contrast,brightness);if(reset)levels.append(reset);
  }
 }
};
let pendingSystemBars=0,lastSystemBars='';
function updateSystemBars(){
 if(!window.BalansAppearance)return;
 if(pendingSystemBars)return;
 pendingSystemBars=requestAnimationFrame(()=>{
 pendingSystemBars=0;
 const probe=document.createElement('span');probe.style.backgroundColor='var(--bg)';probe.style.display='none';document.body.appendChild(probe);
 // Canvas resolves CSS color-mix to actual sRGB on Android WebView.
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.fillStyle=getComputedStyle(probe).backgroundColor;ctx.fillRect(0,0,1,1);
 const d=ctx.getImageData(0,0,1,1).data,color='#'+[d[0],d[1],d[2]].map(x=>x.toString(16).padStart(2,'0')).join('');probe.remove();
 const key=state.theme+color;
 if(key!==lastSystemBars){lastSystemBars=key;window.BalansAppearance.setSystemBars(state.theme,color)}
 });
}
const themeWithSystemBars=applyTheme;
applyTheme=function(){themeWithSystemBars();updateSystemBars()};
const contrastWithSystemBars=applyContrast;
applyContrast=function(){contrastWithSystemBars();updateSystemBars()};
document.addEventListener('input',e=>{if(['brightnessRange','contrastRange'].includes(e.target.id))requestAnimationFrame(updateSystemBars)});
window.BalansAppearance?.status();
