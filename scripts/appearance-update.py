from pathlib import Path

extension = r'''
(function(){
const extraIcons=[['boldline','Чёткие'],['badge','Цветные медальоны'],['offset','Двойной контур']];
for(const item of extraIcons)if(!ICON_STYLES.some(x=>x[0]===item[0]))ICON_STYLES.push(item);
const target=document.querySelector('symbol')?.parentNode;
if(target)for(const [name,g] of Object.entries(HEALTH_GLYPHS))for(const [variant] of extraIcons){
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','symbol');
 symbol.id=semanticGlyph(name,variant);symbol.setAttribute('viewBox','0 0 24 24');
 const line='<g fill="none" stroke="currentColor" stroke-width="'+(variant==='boldline'?2.7:1.8)+'" stroke-linecap="round" stroke-linejoin="round">'+g.outline+'</g>';
 symbol.innerHTML=variant==='badge'?'<rect width="24" height="24" rx="7" fill="currentColor" opacity=".18"/><g transform="translate(3 3) scale(.75)">'+line+'</g>':variant==='offset'?'<g transform="translate(1 1)" opacity=".28">'+line+'</g>'+line:line;
 target.appendChild(symbol);
}
const savedIcon=LS.get('balans2.iconSet','classic');
if(ICON_STYLES.some(x=>x[0]===savedIcon))state.iconSet=savedIcon;
state.cardSkin=LS.get('balans2.cardSkin','original');
const applySkin=()=>document.documentElement.dataset.cardSkin=state.cardSkin;
applySkin();visualPrefs();
const css=document.createElement('style');css.textContent=`
.ap-fold{border:1px solid var(--line);border-radius:13px;margin:8px 0;background:var(--surface)}
.ap-fold>summary{cursor:pointer;padding:12px;font-size:13px;font-weight:650}
.ap-fold>.ap-content{padding:0 10px 10px}
[data-card-skin=glass] #groups .t{background:linear-gradient(145deg,color-mix(in srgb,var(--c) 15%,var(--surface)),var(--surface));border-color:color-mix(in srgb,var(--c) 40%,var(--line));box-shadow:inset 0 1px #ffffff18;border-radius:18px}
[data-card-skin=edge] #groups .t{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--c);border-radius:10px}
[data-card-skin=ink] #groups .t{background:color-mix(in srgb,var(--c) 20%,var(--surface));border:2px solid var(--c);border-radius:22px;box-shadow:0 3px 0 color-mix(in srgb,var(--c) 35%,transparent)}
`;document.head.appendChild(css);
const base=renderThemes;
renderThemes=function(){
 const view=document.querySelector('#v-themes');if(!view)return base();
 view.querySelectorAll('.ap-fold').forEach(d=>{const content=d.querySelector('.ap-content');if(content)d.replaceWith(...content.childNodes)});
 view.querySelector('#cardSkinPreferences')?.remove();
 base();
 for(const id of ['layPick','topPick']){const el=document.getElementById(id);if(el){if(el.previousElementSibling?.classList.contains('lbl2'))el.previousElementSibling.remove();el.remove()}}
 const cards=document.createElement('section');cards.id='cardSkinPreferences';cards.innerHTML='<div class="lbl2">Наборы карточек</div><div class="visual-choices">'+[['original','Исходные'],['glass','Цветное стекло'],['edge','Акцентная грань'],['ink','Яркая рамка']].map(([id,name])=>'<button class="visual-choice '+(state.cardSkin===id?'on':'')+'" data-card-skin-choice="'+id+'" aria-pressed="'+(state.cardSkin===id)+'"><b>'+name+'</b></button>').join('')+'</div>';view.appendChild(cards);
 const headings=[...view.querySelectorAll('.lbl2')];
 headings.forEach(h=>{if(h.closest('.ap-fold'))return;const nodes=[];let next=h.nextSibling;while(next&&!(next.nodeType===1&&(next.classList.contains('lbl2')||next.tagName==='SECTION'||next.classList.contains('subhead')))){nodes.push(next);next=next.nextSibling}if(!nodes.length)return;const d=document.createElement('details');d.className='ap-fold';const summary=document.createElement('summary');summary.textContent=h.textContent;const content=document.createElement('div');content.className='ap-content';h.before(d);d.append(summary,content);content.append(...nodes);h.remove()});
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-card-skin-choice]');if(!b)return;state.cardSkin=b.dataset.cardSkinChoice;LS.set('balans2.cardSkin',state.cardSkin);applySkin();renderThemes()});
})();
'''
for name in ['web-src/src.html','web-src/index.html','app/src/main/assets/index.html']:
    path=Path(name)
    if not path.exists():
        continue
    text=path.read_text(encoding='utf-8')
    text=text.replace("layout:LS.get('balans2.layout','list')", "layout:LS.get('balans2.layout','grid3')")
    text=text.replace("includes(state.layout))state.layout='list'", "includes(state.layout))state.layout='grid3'")
    if name.endswith('src.html'):
        path.write_text(text,encoding='utf-8')
        continue
    marker='ensureDemo();applyTheme();'
    if marker not in text:
        raise RuntimeError('Startup marker missing: '+name)
    text=text.replace(marker,extension+'\n'+marker,1)
    path.write_text(text,encoding='utf-8')
