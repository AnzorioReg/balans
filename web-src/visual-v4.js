/* Focused V4 adjustment: four card sets, original soft/duo, quiet borders. */
(function(){
const allowed=['outline','emoji','soft','duo'];
const entries=new Map(ICON_STYLES.map(x=>[x[0],x]));
ICON_STYLES.splice(0,ICON_STYLES.length,...allowed.map(x=>entries.get(x)).filter(Boolean));
if(!allowed.includes(state.iconSet)){state.iconSet='emoji';LS.set('balans2.iconSet',state.iconSet);}
for(const [name,g]of Object.entries(HEALTH_GLYPHS)){
 const symbol=document.getElementById(semanticGlyph(name,'soft'));if(!symbol)continue;
 const stroke=body=>'<g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+body+'</g>';
 const filled='<g stroke="none" fill="currentColor">'+(g.solid||'')+'</g>'+(g.cut?'<g fill="none" stroke="var(--glyph-cut,var(--surface))" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+g.cut+'</g>':'')+(g.extra?stroke(g.extra):'');
 symbol.innerHTML='<circle cx="12" cy="12" r="12" fill="currentColor" opacity=".16"/><g transform="translate(3 3) scale(.75)">'+filled+'</g>';
}
const style=document.createElement('style');style.textContent=`
html[data-icon-set="emoji"] #groups .ic svg{width:26px;height:26px}
html[data-icon-set="soft"] #groups .ic svg,html[data-icon-set="duo"] #groups .ic svg{width:24px;height:24px}
html[data-icon-set="soft"] #groups [data-metric] .ic,html[data-icon-set="soft"] #groups .g3 .ic,html[data-icon-set="soft"] #groups .fold .ic{border-radius:50%;background:color-mix(in srgb,var(--c) 20%,var(--surface))!important;color:var(--c)!important}
html[data-icon-set="duo"] #groups [data-metric] .ic,html[data-icon-set="duo"] #groups .g3 .ic,html[data-icon-set="duo"] #groups .fold .ic{background:linear-gradient(135deg,color-mix(in srgb,var(--c) 22%,var(--surface)),color-mix(in srgb,var(--c) 8%,var(--surface)))!important;color:var(--c)!important;border:1px solid color-mix(in srgb,var(--c) 50%,var(--line))!important}
html[data-theme="dark"][data-pal^="luxe-"]{--line:#243141}
html[data-theme="light"][data-pal^="luxe-"]{--line:#dde3ea}
`;document.head.appendChild(style);visualPrefs();
})();
