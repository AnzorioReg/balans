/* Refined appearance: source records only; no synthetic health data. */
(function(){
const palettes={dark:[['premium-onyx','Оникс · золото','#101216','#1b1f25','#282e36','#3a424c','#e5bd78'],['premium-ocean','Глубокий океан','#081620','#102632','#193543','#294957','#79d8e3'],['premium-jade','Нефрит','#0c1714','#152821','#203c31','#305244','#a9d9b7'],['premium-wine','Бордо · медь','#1c1118','#2e1d28','#402b37','#573c49','#efb59d'],['premium-slate','Платина','#111923','#1d2936','#2a3949','#3b4c5e','#b9d0e8']],light:[['premium-ivory','Слоновая кость','#f5f1e9','#fffdf8','#eee6d9','#ded2be','#76531b'],['premium-porcelain','Фарфор','#f0f5f8','#ffffff','#e3edf2','#cedde5','#245d78'],['premium-sage','Шалфей','#f0f5ef','#fcfffb','#e2ebdf','#cadbc7','#386044'],['premium-silk','Розовый шёлк','#f8f0f1','#fffafb','#f0e1e4','#dfc9cf','#894459'],['premium-linen','Лён','#f5f2ed','#fffefa','#eae4db','#d8cdbf','#6e5942']]};
let css='';for(const [mode,items]of Object.entries(palettes))for(const [id,name,bg,s1,s2,s3,a]of items){if(!PALS[mode].some(x=>x[0]===id))PALS[mode].push([id,name,bg,s3,a]);css+=`[data-theme="${mode}"][data-pal="${id}"]{--bg:${bg};--surface:${s1};--surface2:${s2};--surface3:${s3};--line:${s3};--accent:${a};--text:${mode==='dark'?'#f3f4f6':'#20262c'};--muted:${mode==='dark'?'#c0c6ce':'#52606b'};--faint:${mode==='dark'?'#a5b0bc':'#616d78'};--accent-ink:${mode==='dark'?'#101216':'#ffffff'}}`;}
if(LS.get('balans2.premiumDefaultsV2',false)!==true){state.pal.dark='premium-onyx';state.pal.light='premium-ivory';LS.set('balans2.pal',state.pal);LS.set('balans2.premiumDefaultsV2',true);}
const chartSets=[['atelier','Ателье','Столбцы активности и точные линии измерений'],['ribbon','Лента','Заливка динамики и округлённые столбцы'],['stems','Маркеры','Значения с чёткими опорными линиями'],['mosaic','Мозаика записей','Одна ячейка на показанную запись, цвет по её значению']];
for(const item of chartSets)if(!VISUAL_STYLES.some(x=>x[0]===item[0]))VISUAL_STYLES.push(item);
const savedChart=LS.get('balans2.chartSet','signature');if(VISUAL_STYLES.some(x=>x[0]===savedChart))state.chartSet=savedChart;
if(!ICON_STYLES.some(x=>x[0]===state.iconSet)){state.iconSet='outline';LS.set('balans2.iconSet','outline');}
LS.set('balans2.cardSkin','original');delete document.documentElement.dataset.cardSkin;
const renderBase=renderRealVisual;
renderRealVisual=function(m,w,h,inputRows,mini=true,variant=state.chartSet){
 if(!chartSets.some(x=>x[0]===variant))return renderBase(m,w,h,inputRows,mini,variant);
 const all=(inputRows||[]).filter(r=>Number.isFinite(r?.v));
 if(!all.length)return renderBase(m,w,h,all,mini,'signature');
 const rows=visualRecordSubset(all,mini?20:80),vals=rows.flatMap(r=>Number.isFinite(r.lo)?[r.v,r.lo]:[r.v]);
 w=Math.max(24,Number(w)||120);h=Math.max(18,Number(h)||44);
 const additive=DAILY_METRICS.has(m.id),zero=additive&&variant!=='mosaic';
 let min=Math.min(...vals),max=Math.max(...vals);if(zero)min=Math.min(0,min);
 if(min===max){const p=Math.max(.1,Math.abs(max)*.05);min-=zero?0:p;max+=p;}
 const pad=mini?3:20,base=h-pad,range=max-min;
 const y=v=>pad+(h-2*pad)*(1-(v-min)/range);
 const times=rows.map(recordTimestamp),validTime=times.every(Number.isFinite)&&Math.max(...times)>Math.min(...times),t0=Math.min(...times),t1=Math.max(...times);
 const x=(r,i)=>validTime?pad+(w-2*pad)*(times[i]-t0)/(t1-t0):rows.length===1?w/2:pad+(w-2*pad)*i/(rows.length-1);
 const color=cv(m),tip=r=>`<title>${esc(show(m,r.v,r.lo)+' '+m.unit+' · '+actualDate(r))}</title>`;
 let body='';const pts=rows.map((r,i)=>[x(r,i),y(r.v)]),path=pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
 if(!mini){for(const v of [min,(min+max)/2,max])body+=`<line x1="${pad}" x2="${w-pad}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text x="2" y="${y(v)-2}" fill="var(--muted)" font-size="9">${esc(fmt(v,m.dec))}</text>`;}
 if(variant==='mosaic'){
  const cols=Math.min(rows.length,Math.max(1,Math.ceil(Math.sqrt(rows.length*w/h)))),nr=Math.ceil(rows.length/cols),cw=w/cols,ch=h/nr;
  rows.forEach((r,i)=>{body+=`<rect x="${i%cols*cw+1}" y="${Math.floor(i/cols)*ch+1}" width="${Math.max(.2,cw-2)}" height="${Math.max(.2,ch-2)}" rx="2" fill="${color}" fill-opacity="${.25+.75*(r.v-min)/range}">${tip(r)}</rect>`;});
 }else if(m.id==='bp'){
  rows.forEach((r,i)=>{const xx=x(r,i);body+=Number.isFinite(r.lo)?`<line x1="${xx}" x2="${xx}" y1="${y(r.v)}" y2="${y(r.lo)}" stroke="${color}" stroke-width="2"/>`:'';for(const v of [r.v,r.lo].filter(Number.isFinite))body+=`<circle cx="${xx}" cy="${y(v)}" r="2.3" fill="${color}">${tip(r)}</circle>`;});
 }else if(variant==='stems'||additive){
  const bw=Math.max(.5,Math.min(14,(w-2*pad)/rows.length*.6));
  rows.forEach((r,i)=>{const xx=x(r,i),yy=y(r.v),z=y(zero?0:min);body+=variant==='stems'?`<line x1="${xx}" x2="${xx}" y1="${z}" y2="${yy}" stroke="${color}" stroke-opacity=".4"/><circle cx="${xx}" cy="${yy}" r="${mini?2:3.5}" fill="${color}">${tip(r)}</circle>`:`<rect x="${Math.max(0,Math.min(w-bw,xx-bw/2))}" y="${Math.min(yy,z)}" width="${bw}" height="${Math.max(0,Math.abs(z-yy))}" rx="${variant==='ribbon'?bw/2:1}" fill="${color}" opacity="${.45+.55*(i+1)/rows.length}">${tip(r)}</rect>`;});
 }else{
  if(variant==='ribbon')body+=`<path d="${path}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="${color}" opacity=".16"/>`;
  body+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/>`;
  rows.forEach((r,i)=>body+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="${i===rows.length-1?3:1.6}" fill="${color}">${tip(r)}</circle>`);
 }
 return `<svg class="real-visual" data-refined-chart="${variant}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(m.name+' · '+m.unit+' · показано '+rows.length+' из '+all.length+' записей; шкала '+fmt(min,m.dec)+'–'+fmt(max,m.dec))}">${body}</svg>`;
};
const style=document.createElement('style');style.textContent=css+`
.rp-fold{margin:8px 0;border:1px solid var(--line);border-radius:15px;background:var(--surface)}
.rp-fold>summary{padding:13px 12px;cursor:pointer;font-size:13px;font-weight:650;list-style:none;display:flex;justify-content:space-between;gap:10px}
.rp-fold>summary::after{content:'+';color:var(--accent)}.rp-fold[open]>summary::after{content:'−'}
.rp-content{padding:0 10px 10px}.rp-content>.lbl2:first-child{display:none}
#v-themes .pals{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#v-themes .pal{padding:8px;border:1px solid var(--line);border-radius:12px;text-align:left;font-size:11px}
#v-themes .pal.on{border-color:var(--accent)}#v-themes .psw{height:52px!important}
#v-themes .themes{gap:8px}#v-themes .th{border-radius:12px}
`;document.head.appendChild(style);
const previousThemes=renderThemes;
renderThemes=function(){
 const view=document.querySelector('#v-themes');if(!view)return;
 const open=new Set([...view.querySelectorAll('.rp-fold[open]')].map(d=>d.dataset.rpKey));
 view.querySelectorAll('.rp-fold').forEach(d=>{if(/Графики|диаграммы/.test(d.dataset.rpKey||''))d.remove();else d.replaceWith(...d.querySelector('.rp-content').childNodes);});
 previousThemes();
 for(const id of ['layPick','topPick','cardSkinPreferences']){const n=document.getElementById(id);if(n){if(n.previousElementSibling?.classList.contains('lbl2'))n.previousElementSibling.remove();n.remove();}}
 const fold=(name,nodes,key)=>{nodes=nodes.filter(Boolean);if(!nodes.length)return;const d=document.createElement('details');d.className='rp-fold';d.dataset.rpKey=key;d.open=open.has(key);const hd=document.createElement('summary');hd.textContent=name;const content=document.createElement('div');content.className='rp-content';nodes[0].before(d);d.append(hd,content);content.append(...nodes);return d;};
 const themeNodes=[...view.children].filter(n=>n.classList.contains('themes')||['palDark','palLight'].includes(n.id)||n.classList.contains('lbl2')&&/Ночные темы|Дневные темы/.test(n.textContent));
 fold('Темы · тёмные и светлые',themeNodes,'themes');
 const levels=view.querySelector('.appearance-levels');if(levels){const heading=levels.previousElementSibling;fold('Яркость и контраст',[heading?.classList.contains('lbl2')?heading:null,levels],'levels');}
 for(const heading of [...view.querySelectorAll('.lbl2')]){if(heading.closest('.rp-fold'))continue;const nodes=[heading];let n=heading.nextSibling;while(n&&!(n.nodeType===1&&(n.classList.contains('lbl2')||n.classList.contains('rp-fold')||n.tagName==='SECTION'))){nodes.push(n);n=n.nextSibling;}if(nodes.length<2)continue;const name=heading.textContent;const d=fold(name,nodes,name);if(d&&/Графики|диаграммы/.test(name))view.appendChild(d);}
};
visualPrefs();
})();
