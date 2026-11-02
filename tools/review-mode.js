/* BALANS_REVIEW_MODE_V2 */
(function(){
  const KEY='balans.reviewMode';
  const on=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
  const set=v=>{try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}};
  const kindOf=m=>{
    const s=((m.id||'')+' '+(m.name||'')).toLowerCase();
    if(/давл|blood pressure|\bbp\b/.test(s))return 'bp';
    if(/сон|sleep/.test(s))return 'sleep';
    if(/пульс|пульса|heart|pulse/.test(s))return 'line';
    if(/шаг|steps/.test(s))return 'bar';
    if(/калор|calor/.test(s))return 'bar';
    if(/вес|weight|масс/.test(s))return 'line';
    if(/кислород|oxygen|spo2/.test(s))return 'line';
    if(/трениров|workout|актив|activity|exercise/.test(s))return 'bar';
    if(/вода|water/.test(s))return 'bar';
    return m.chart==='bar'?'bar':'line';
  };
  const recordsFor=(m,p)=>{
    try{const r=metricRecords(m,p);if(Array.isArray(r)&&r.length)return r}catch(e){}
    if(p==='all'){for(const alt of ['year','6m','month','week','day']){try{const r=metricRecords(m,alt);if(Array.isArray(r)&&r.length)return r}catch(e){}}}
    return [];
  };
  const down=(a,n)=>{if(a.length<=n)return a;const out=[],step=(a.length-1)/(n-1);for(let i=0;i<n;i++)out.push(a[Math.round(i*step)]);return out};
  const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const empty=()=>'<div class="emptybox"><b>Нет данных за период</b><small>Добавь запись или подключи источник — здесь появится динамика.</small></div>';
  const frame=(inner,label)=>'<div data-review="1" data-chart-period="'+esc(label)+'"><div class="legend"><span><i style="background:var(--accent)"></i>'+esc(label)+'</span></div><div class="chart">'+inner+'</div></div>';
  const lineSVG=(vals,color)=>{if(!vals.length)return empty();const v=down(vals,140),w=340,h=130,p=8,mn=Math.min(...v),mx=Math.max(...v),sp=(mx-mn)||1;const pt=v.map((x,i)=>[p+i*(w-2*p)/(Math.max(v.length-1,1)),h-p-(x-mn)/sp*(h-2*p)]);const d=pt.map((x,i)=>(i?'L':'M')+x[0].toFixed(1)+' '+x[1].toFixed(1)).join(' ');return '<svg viewBox="0 0 '+w+' '+h+'"><path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linecap="round"/></svg>'};
  const barSVG=(vals,color)=>{if(!vals.length)return empty();const v=down(vals,40),w=340,h=130,p=8,mx=Math.max(...v,1),bw=(w-2*p)/v.length;const bars=v.map((x,i)=>{const hh=Math.max(2,x/mx*(h-2*p));return '<rect x="'+(p+i*bw+bw*0.12).toFixed(1)+'" y="'+(h-p-hh).toFixed(1)+'" width="'+(bw*0.76).toFixed(1)+'" height="'+hh.toFixed(1)+'" rx="3" fill="'+color+'"/>'}).join('');return '<svg viewBox="0 0 '+w+' '+h+'">'+bars+'</svg>'};
  const bpSVG=rows=>{const sys=rows.map(r=>Number(r.sys??r.hi??r.v)).filter(Number.isFinite),dia=rows.map(r=>Number(r.dia??r.lo??(Number(r.v)/1.4))).filter(Number.isFinite);if(!sys.length)return empty();return lineSVG(sys,'#ff6f91')+'<div class="legend"><span><i style="background:#ff6f91"></i>Верхнее</span><span><i style="background:#59a9ff"></i>Нижнее</span></div>'};
  const render=(m,period)=>{const rows=recordsFor(m,period);if(!rows.length)return{svg:empty(),v:[],p:null,noSel:true};const vals=rows.map(r=>Number(r.v)).filter(Number.isFinite),k=kindOf(m),c='var(--accent)';let inner;if(k==='bp')inner=bpSVG(rows);else if(k==='sleep')inner=barSVG(vals,'#9d8cff');else if(k==='bar')inner=barSVG(vals,c);else inner=lineSVG(vals,c);return{svg:frame(inner,period),v:vals,p:null,noSel:true}};
  const oldDraw=window.drawChart;
  window.drawChart=function(m,period,cmp){if(!on())return oldDraw?oldDraw(m,period,cmp):'';return render(m,period)};
  window.vizBig=function(m,period){return render(m,period)};
  const openPanel=()=>{
    document.querySelectorAll('.balans-review-panel').forEach(x=>x.remove());
    const p=document.createElement('div');p.className='balans-review-panel';
    p.style.cssText='position:fixed;top:76px;right:12px;left:12px;z-index:9999;background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:0 18px 50px #0008';
    p.innerHTML='<b>Режим «Рассмотрение»</b><p class="foot">Новые графики и периоды для всех карточек. Старые графики не изменяются и остаются доступными при выключенном режиме.</p>';
    const main=document.createElement('button');main.className='btn';main.style.cssText='width:100%';main.textContent=on()?'Выключить новые графики':'Включить новые графики';
    main.onclick=()=>{set(!on());p.remove();location.reload()};
    const close=document.createElement('button');close.textContent='Закрыть';close.style.cssText='width:100%;margin-top:8px;min-height:40px;border-radius:12px;background:var(--surface2);color:var(--text)';close.onclick=()=>p.remove();
    p.append(main,close);document.body.append(p);
  };
  const mk=()=>{
    document.querySelectorAll('.balans-review-fab').forEach(x=>x.remove());
    const b=document.createElement('button');b.className='balans-review-fab';b.type='button';b.textContent='Рассмотрение';
    b.style.cssText='position:fixed;top:64px;right:12px;z-index:9998;padding:8px 12px;border-radius:99px;background:var(--surface);border:1px solid var(--line);color:var(--text);font-size:12px;font-weight:700;box-shadow:0 8px 24px #0006';
    b.addEventListener('click',openPanel);document.body.append(b);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mk);else mk();
})();
