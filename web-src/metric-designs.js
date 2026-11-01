/* Metric-specific, bounded SVGs. Shapes are not simulated sensor waveforms.
 * Only finite source rows create marks. Scales are actual observed ranges,
 * configured goals or explicit 0–100 percentages; never clinical "normal" zones.
 * Paint variants preserve the metric's geometry and meaning.
 */
const METRIC_DESIGN_IDS={
 steps:'step-columns',distance:'dated-route',activeCalories:'flame-level',totalCalories:'radiant-energy',
 exercise:'duration-capsules',floors:'floor-staircase',elevation:'elevation-peaks',speed:'speed-dial',
 heart:'measured-heartline',restingHeart:'rest-deviations',bp:'paired-pressure',spo2:'oxygen-percent',
 hrv:'variability-ribbon',resp:'respiratory-ribs',sleep:'recorded-nights',weight:'mass-balance',
 height:'height-ruler',bodyFat:'fat-silhouette',leanMass:'lean-chevrons',bodyWater:'water-mass-drops',
 boneMass:'bone-lengths',water:'hydration-glass',nutrition:'record-energy-plate',temp:'temperature-tube',
 skinTemperature:'signed-skin-deltas',glucose:'glucose-observed-range',mindfulness:'session-petals',
 vo2:'capacity-fan',bmr:'metabolic-coil',power:'power-bolt',cadence:'cadence-footprints',
 cyclingCadence:'pedal-wheel'
};
function mdDate(r){
 const d=r?.day||r?.d;
 if(typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d))return d.slice(8)+'.'+d.slice(5,7);
 const ts=typeof recordTimestamp==='function'?recordTimestamp(r):r?.ts;
 if(!Number.isFinite(ts))return 'Дата не указана';
 const t=new Date(ts);return String(t.getDate()).padStart(2,'0')+'.'+String(t.getMonth()+1).padStart(2,'0');
}
function metricDesignVisual(m,w,h,sourceRows,mini=true,variant=state.chartSet){
 w=Math.max(24,Number(w)||100);h=Math.max(18,Number(h)||44);
 const rows=(Array.isArray(sourceRows)?sourceRows:[]).filter(r=>Number.isFinite(r?.v));
 const last=rows.at(-1),kind=METRIC_DESIGN_IDS[m.id]||'measured-records',P=chartColors(m),c=P[0],c2=P.at(-1);
 const id=uid('metric'),grad='url(#'+id+')',clip=uid('metricClip');
 const sample=visualRecordSubset(rows,mini?10:16),vals=sample.map(r=>r.v);
 const lo=vals.length?Math.min(...vals):0,hi=vals.length?Math.max(...vals):1,peak=Math.max(.000001,...vals.map(v=>Math.abs(v)));
 const aw=mini?w:Math.min(145,w*.44),ah=mini?h:Math.max(56,Math.min(92,h*.54)),cx=aw/2,cy=ah/2;
 const pts=variant==='points',soft=variant==='aurora',solid=variant==='capsule';
 const paint=solid?c:grad,alpha=pts?.75:soft?.85:1,sw=pts?1.8:solid?3.5:2.6;
 const defs=`<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${ah}" x2="${aw}" y2="0"><stop stop-color="${c}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
 const num=v=>Number.isFinite(v)?chartNumber(m,v):'—';
 const label=(x,y,s,size=11,color='var(--text)',anchor='middle')=>`<text x="${x}" y="${y}" font-size="${size}" font-weight="650" fill="${color}" text-anchor="${anchor}">${esc(String(s))}</text>`;
 const tip=r=>`<title>${esc((r.aggregate?(r.aggregate==='sum'?'Сумма за интервал · ':'Среднее за интервал · '):'')+mdDate(r)+': '+show(m,r.v,r.lo))}</title>`;
 const path=(d,stroke=paint,width=sw,fill='none',opacity=1)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}" stroke-linejoin="round" stroke-linecap="round"/>`;
 const circle=(x,y,r,fill=paint,stroke='none',width=1)=>`<circle cx="${x}" cy="${y}" r="${Math.max(0,r)}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
 const rect=(x,y,ww,hh,r=3,fill=paint,opacity=1)=>`<rect x="${x}" y="${y}" width="${Math.max(0,ww)}" height="${Math.max(0,hh)}" rx="${Math.max(0,r)}" fill="${fill}" fill-opacity="${opacity}" ${pts&&opacity>.4?`stroke="${c2}" stroke-width="1"`:''}/>`;
 const glyph=(name,x,y,size,color=c)=>`<svg x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${color}"><use href="#${semanticGlyph(name)}"/></svg>`;
 const polar=(r,a,x=cx,y=cy)=>[x+Math.cos(a*Math.PI/180)*r,y+Math.sin(a*Math.PI/180)*r];
 const arc=(r,start,end,x=cx,y=cy)=>{const a=polar(r,start,x,y),b=polar(r,end,x,y);return `M${a[0]} ${a[1]}A${r} ${r} 0 ${end-start>180?1:0} 1 ${b[0]} ${b[1]}`};
 const bounds=(includeZero=false)=>{
  let mn=includeZero?Math.min(0,lo):lo,mx=includeZero?Math.max(0,hi):hi;
  if(mx===mn){if(includeZero&&mx===0){mn=0;mx=1}else{const pad=Math.max(Math.abs(mx)*.05,m.dec?.1:1);mn-=pad;mx+=pad}}
  return {mn,mx,x:i=>6+(aw-12)*(sample.length<2?.5:i/(sample.length-1)),y:v=>4+(ah-8)*(1-(v-mn)/(mx-mn))};
 };
 const points=(includeZero=false)=>{const b=bounds(includeZero);return sample.map((r,i)=>[b.x(i),b.y(r.v),r])};
 const line=ps=>ps.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' ');
 const progress=(goal)=>{
  if(!last||!Number.isFinite(goal)||goal<=0)return 0;
  if(mini&&!m.historicalView&&DAILY_METRICS.has(m.id)){
   const day=last.day||localDay(recordTimestamp(last));
   if(day!==localDay())return 0;
  }
  return Math.max(0,Math.min(1,last.v/goal));
 };
 const ring=(r,p,x=cx,y=cy,width=6)=>{
  const C=2*Math.PI*r;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${c}" stroke-opacity=".18" stroke-width="${width}"/>`+(p>0?`<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${paint}" stroke-width="${width}" stroke-dasharray="${p*C} ${C}" stroke-linecap="round" transform="rotate(-90 ${x} ${y})"/>`:'');
 };
 const wrap=(body,empty=false)=>`<svg class="real-visual metric-design" data-design="${kind}" data-variant="${esc(variant)}" ${empty?'data-empty="true"':''} viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(m.name+': '+(last?show(m,last.v,last.lo)+' · '+mdDate(last):'нет измерений'))}">${defs}${body}</svg>`;
 if(!last){
  const size=Math.max(12,Math.min(ah*.72,aw*.55));
  let b=`<g opacity=".45">${glyph(METRIC_GLYPH_MAP[m.id]||'heart',cx,cy,size)}${path(`M7 ${ah-3}H${aw-7}`,'var(--line)',1)}</g>`;
  if(!mini)b+=label(aw+16,ah*.45,'—',26,'var(--text)','start')+label(aw+16,ah*.45+20,'Нет измерений',11,'var(--muted)','start');
  return wrap(b,true);
 }
 let b='';
 switch(m.id){
  case 'steps':{
   const max=Math.max(1,...vals),step=(aw-8)/sample.length,bw=Math.min(step*.66,18);
   b+=path(`M4 ${ah-3}H${aw-4}`,'var(--line)',1);
   sample.forEach((r,i)=>{const hh=Math.max(0,r.v)/max*(ah-10),x=4+step*(i+.5);b+=`<g>${tip(r)}${rect(x-bw/2,ah-3-hh,bw,hh,Math.min(3,bw/3),paint,alpha)}${circle(x,ah-3-hh,Math.min(2.4,bw*.2),c2)}</g>`});
   break;
  }
  case 'distance':{
   const ps=points();b+=path(line(ps),paint,sw,'none',.65).replace('<path ','<path stroke-dasharray="3 4" ');
   ps.forEach(([x,y,r],i)=>b+=`<g>${tip(r)}${circle(x,y,i===ps.length-1?4:2.8,'var(--surface)',i===ps.length-1?c2:c,2)}${i===ps.length-1?path(`M${x} ${y-3}v-8h6l-2 3 2 3h-6`,c2,1.4):''}</g>`);
   break;
  }
  case 'activeCalories':{
   const fw=Math.min(aw*.52,ah*.7),x=cx-fw/2,y=2,hh=ah-4;
   const d=`M${cx+fw*.08} ${y}C${cx+fw*.28} ${y+hh*.3} ${cx-fw*.1} ${y+hh*.34} ${cx-fw*.14} ${y+hh*.55}C${x+fw*.12} ${y+hh*.53} ${x+fw*.16} ${y+hh*.35} ${x+fw*.15} ${y+hh*.3}C${x-fw*.15} ${y+hh*.7} ${x} ${y+hh} ${cx} ${y+hh}C${x+fw*1.18} ${y+hh} ${x+fw*1.2} ${y+hh*.45} ${cx+fw*.08} ${y}Z`;
   const p=progress(GOAL.active);
   b+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>${path(d,c,1.6,c,.12)}<g clip-path="url(#${clip})">${rect(x-fw*.5,ah*(1-p),fw*2,ah*p,0,paint,alpha)}</g>`;
   break;
  }
  case 'totalCalories':{
   const r=Math.max(3,Math.min(aw,ah)*.22),outer=Math.min(aw,ah)*.46,n=sample.length;
   b+=circle(cx,cy,r,paint)+glyph('metabolism',cx,cy,r*1.45,'var(--surface)');
   sample.forEach((row,i)=>{const angle=-90+i*360/n,a=polar(r+3,angle),q=polar(r+3+(outer-r-3)*Math.max(0,row.v)/peak,angle);b+=`<g>${tip(row)}${path(`M${a}L${q}`,i%2?c2:paint,Math.max(2,Math.min(7,outer*.18)))}</g>`});
   break;
  }
  case 'exercise':{
   const n=sample.length,step=(ah-6)/n,bh=Math.min(9,step*.62),left=aw*.12;
   sample.forEach((r,i)=>{const y=3+i*step,len=(aw-left-5)*Math.max(0,r.v)/peak;b+=`<g>${tip(r)}${circle(left*.38,y+bh/2,Math.min(2,bh*.3),c2)}${rect(left,y,len,bh,bh/2,paint,alpha)}</g>`});
   break;
  }
  case 'floors':{
   const z=bounds(true),step=(aw-10)/sample.length,base=ah-4;
   let d=`M5 ${base}`;sample.forEach((r,i)=>{const x=5+i*step,y=z.y(r.v);d+=`V${y}H${x+step}`;b+=`<g>${tip(r)}${circle(x+step*.5,y,2,c2)}</g>`});
   b=path(d+`V${base}Z`,'none',0,paint,alpha*.3)+path(d,paint,sw)+b;
   break;
  }
  case 'elevation':{
   const ps=points(true),d=line(ps);b+=path(d+`L${aw-6} ${ah-4}H6Z`,'none',0,paint,alpha*.55)+path(d,paint,sw);
   ps.forEach(([x,y,r])=>b+=`<g>${tip(r)}${path(`M${x-3} ${y+5}L${x} ${y}l3 5`,c2,1.3)}</g>`);
   break;
  }
  case 'speed':{
   const r=Math.max(4,Math.min(aw*.36,ah*.43)),p=Math.max(0,last.v)/peak;
   b+=path(arc(r,-210,30),c,Math.max(3,r*.15),'none',.2);
   if(p>0)b+=path(arc(r,-210,-210+240*p),paint,Math.max(3,r*.15));
   for(let i=0;i<=6;i++){const a=polar(r*.8,-210+i*40),q=polar(r*.91,-210+i*40);b+=path(`M${a}L${q}`,c2,1)}
   const q=polar(r*.74,-210+240*p);b+=path(`M${cx} ${cy}L${q}`,c2,2)+circle(cx,cy,3.5,c);
   if(!mini)b+=label(cx-r,cy+r*.72,'0',8,'var(--muted)')+label(cx+r,cy+r*.72,fmt(peak,m.dec),8,'var(--muted)');
   break;
  }
  case 'heart':{
   const ps=points(),d=line(ps);b+=glyph('heart',aw*.83,ah*.28,ah*.46,c).replace('style="','opacity=".12" style="');
   b+=path(d+`L${ps.at(-1)[0]} ${ah-3}H${ps[0][0]}Z`,'none',0,paint,alpha*.2)+path(d,paint,sw);
   ps.forEach(([x,y,r],i)=>b+=`<g>${tip(r)}${circle(x,y,i===ps.length-1?3:1.7,c2)}</g>`);
   break;
  }
  case 'restingHeart':{
   const mean=rows.reduce((a,r)=>a+r.v,0)/rows.length,range=Math.max(1,...vals.map(v=>Math.abs(v-mean))),step=(aw-10)/sample.length;
   b+=path(`M5 ${cy}H${aw-5}`,c,1,'none',.25);
   sample.forEach((r,i)=>{const x=5+step*(i+.5),y=cy-(r.v-mean)/range*(ah*.35);b+=`<g>${tip(r)}${path(`M${x} ${cy}V${y}`,paint,Math.min(5,step*.3))}${circle(x,y,Math.min(3,step*.25),c2)}</g>`});
   b+=glyph('resting',aw-9,9,15,c2);break;
  }
  case 'bp':{
   const lower=sample.map(r=>r.lo).filter(Number.isFinite),mn=Math.min(...vals,...lower),mx=Math.max(...vals,...lower),span=Math.max(1,mx-mn),step=(aw-10)/sample.length;
   const y=v=>5+(ah-10)*(1-(v-mn)/span);
   sample.forEach((r,i)=>{const x=5+step*(i+.5),top=y(r.v);b+=`<g>${tip(r)}`;
    if(Number.isFinite(r.lo)){const bottom=y(r.lo);b+=path(`M${x} ${top}V${bottom}`,paint,Math.min(5,step*.25))+path(`M${x-3} ${bottom}h6`,c2,1.5)+circle(x,bottom,2.4,c2)}
    b+=circle(x,top,3,c)+path(`M${x-3} ${top}h6`,c,1.5)+'</g>';
   });break;
  }
  case 'spo2':{
   const r=Math.max(4,Math.min(aw,ah)*.38);b+=ring(r,Math.max(0,Math.min(1,last.v/100)),cx,cy,Math.max(3,r*.22));
   b+=label(cx,cy+r*.18,'O₂',Math.max(9,r*.62),c2);break;
  }
  case 'hrv':{
   const ps=points(),d=line(ps);b+=path(d,c,Math.min(14,ah*.28),'none',.12)+path(d,paint,Math.min(7,ah*.15));
   ps.forEach(([x,y,r])=>b+=`<g>${tip(r)}${circle(x,y,2,'var(--surface)',c2,1.2)}</g>`);
   break;
  }
  case 'resp':{
   const n=sample.length,step=(ah-8)/n,mid=aw/2,gap=Math.max(2,aw*.035);
   sample.forEach((r,i)=>{const y=4+step*(i+.5),len=(aw*.4)*Math.max(0,r.v)/peak;b+=`<g>${tip(r)}${path(`M${mid-gap} ${y}h-${len}M${mid+gap} ${y}h${len}`,paint,Math.max(1.5,step*.56))}</g>`});
   b+=path(`M${mid} 2V${ah*.54}M${mid} ${ah*.2}l-${gap*2} 6M${mid} ${ah*.2}l${gap*2} 6`,c2,1.6);break;
  }
  case 'sleep':{
   const stages=!mini||ah>=48?stageVisual(last,aw,ah):null;
   if(stages){b+=stages;break}
   const n=Math.min(7,sample.length),nights=sample.slice(-n),step=(aw-8)/n,max=Math.max(1,...nights.map(r=>r.v));
   nights.forEach((r,i)=>{const x=4+step*(i+.5),ww=step*.62,hh=Math.max(0,r.v)/max*(ah-12),rr=Math.min(ww/2,hh/2),base=ah-4;if(hh>0)b+=`<g>${tip(r)}${path(`M${x-ww/2} ${base}V${base-hh+rr}Q${x-ww/2} ${base-hh} ${x} ${base-hh}Q${x+ww/2} ${base-hh} ${x+ww/2} ${base-hh+rr}V${base}Z`,'none',0,paint,alpha)}</g>`});
   b+=glyph('moon',aw-8,9,14,c2);break;
  }
  case 'weight':{
   const r=Math.max(3,Math.min(aw*.16,ah*.17)),left=cx-aw*.29,right=cx+aw*.29,top=ah*.28,base=ah*.88;
   const prev=rows.length>1?rows.at(-2):null,delta=prev?last.v-prev.v:0,tilt=Math.max(-ah*.1,Math.min(ah*.1,delta/Math.max(1,hi-lo)*ah*.15));
   b+=path(`M${cx} ${top-5}V${base}M${cx-aw*.12} ${base}h${aw*.24}`,c2,2);
   b+=path(`M${left} ${top-tilt}L${right} ${top+tilt}`,paint,3);
   [[left,top-tilt,prev],[right,top+tilt,last]].forEach(([x,y,row])=>{b+=path(`M${x} ${y}v${ah*.3}m-${r} 0q${r} ${r} ${r*2} 0`,paint,1.6);if(row)b+=`<g>${tip(row)}${circle(x,y+ah*.3-r*.35,r*.6,paint)}</g>`});
   break;
  }
  case 'height':{
   const top=4,bottom=ah-4,x=cx,ruler=cx-aw*.18,p=Math.max(0,last.v)/peak,yy=bottom-(bottom-top)*p;
   b+=path(`M${ruler} ${top}V${bottom}`,c,2);
   for(let i=0;i<=8;i++){const y=bottom-(bottom-top)*i/8;b+=path(`M${ruler} ${y}h${i%2?5:9}`,c2,1)}
   b+=path(`M${x} ${bottom}V${yy}M${x-5} ${bottom}h10M${x-5} ${yy}h10`,paint,4)+circle(x,yy,3,c2);
   break;
  }
  case 'bodyFat':{
   const ww=Math.min(aw*.52,ah*.65),x=cx-ww/2,y=3,hh=ah-6;
   const d=`M${x+ww*.12} ${y}Q${cx} ${y+hh*.2} ${x+ww*.88} ${y}L${x+ww} ${y+hh*.3}Q${x+ww*.62} ${y+hh*.52} ${x+ww} ${y+hh*.8}L${x+ww*.78} ${y+hh}Q${cx} ${y+hh*.8} ${x+ww*.22} ${y+hh}L${x} ${y+hh*.8}Q${x+ww*.38} ${y+hh*.52} ${x} ${y+hh*.3}Z`;
   const p=Math.max(0,Math.min(1,last.v/100));
   b+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>${path(d,c,1.8,c,.15)}<g clip-path="url(#${clip})">${rect(x,y+hh*(1-p),ww,hh*p,0,paint,alpha)}</g>`;break;
  }
  case 'leanMass':{
   const step=(aw-8)/sample.length,bw=Math.min(16,step*.7);
   sample.forEach((r,i)=>{const x=4+step*(i+.5),hh=Math.max(0,r.v)/peak*(ah-9),top=ah-4-hh;b+=`<g>${tip(r)}${hh>0?path(`M${x-bw/2} ${ah-4}V${top+Math.min(4,hh/2)}L${x} ${top}l${bw/2} ${Math.min(4,hh/2)}V${ah-4}l-${bw/2} -${Math.min(4,hh/2)}Z`,'none',0,paint,alpha):circle(x,ah-4,1,c)}</g>`});break;
  }
  case 'bodyWater':{
   const z=bounds(true);
   sample.forEach((r,i)=>{const x=z.x(i),y=z.y(r.v),rr=Math.min(4,(aw-8)/sample.length*.28);b+=`<g>${tip(r)}${path(`M${x} ${ah-3}V${y}`,c,1.2,'none',.4)}${path(`M${x} ${y-rr*1.6}C${x-rr*2} ${y} ${x-rr} ${y+rr} ${x} ${y+rr}C${x+rr} ${y+rr} ${x+rr*2} ${y} ${x} ${y-rr*1.6}Z`,'none',0,paint)}</g>`});break;
  }
  case 'boneMass':{
   const step=(ah-6)/sample.length,rr=Math.max(1,Math.min(3,step*.25));
   sample.forEach((r,i)=>{const y=3+step*(i+.5),len=Math.max(0,r.v)/peak*(aw-14),x=(aw-len)/2;b+=`<g>${tip(r)}${path(`M${x} ${y}h${len}`,paint,rr*1.3)}${circle(x,y-rr*.5,rr,c)}${circle(x,y+rr*.5,rr,c)}${circle(x+len,y-rr*.5,rr,c2)}${circle(x+len,y+rr*.5,rr,c2)}</g>`});break;
  }
  case 'water':{
   const ww=Math.min(aw*.45,ah*.65),x=cx-ww/2,y=3,hh=ah-6,p=progress(GOAL.water);
   const d=`M${x} ${y}H${x+ww}L${x+ww*.88} ${y+hh}H${x+ww*.12}Z`;
   b+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>${path(d,c,1.8,c,.1)}<g clip-path="url(#${clip})">${rect(x-1,y+hh*(1-p),ww+2,hh*p,0,paint,alpha)}</g>`;
   for(let i=1;i<4;i++)b+=path(`M${x+ww*.12} ${y+hh*i/4}h${ww*.16}`,c2,1.1);
   break;
  }
  case 'nutrition':{
   const r=Math.max(3,Math.min(aw,ah)*.35),C=2*Math.PI*r,total=rows.reduce((s,r)=>s+Math.max(0,r.v),0);
   // Sampling is not used for proportions: contiguous groups sum actual records.
   const groups=[];for(let i=0;i<Math.min(24,rows.length);i++){const start=Math.floor(i*rows.length/Math.min(24,rows.length)),end=Math.floor((i+1)*rows.length/Math.min(24,rows.length));groups.push({first:rows[start],last:rows[end-1],v:rows.slice(start,end).reduce((s,r)=>s+Math.max(0,r.v),0)})}
   let offset=0;b+=ring(r,0,cx,cy,Math.max(3,r*.34));
   groups.forEach((row,i)=>{const fraction=total?row.v/total:0,len=fraction*C;if(len>0)b+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${i%2?c2:paint}" stroke-width="${Math.max(3,r*.34)}" stroke-dasharray="${Math.max(0,len-Math.min(1.5,len*.12))} ${C}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${esc(mdDate(row.first)+(row.first!==row.last?'–'+mdDate(row.last):'')+': '+fmt(row.v,0)+' ккал')}</title></circle>`;offset+=len});
   b+=glyph('meal',cx,cy,r*.9,c2);break;
  }
  case 'temp':{
   const rr=Math.max(3,Math.min(7,ah*.16)),x=cx,y=4,bottom=ah-rr-2,p=(last.v-(lo-1))/Math.max(1,hi-lo+2),yy=bottom-(bottom-y)*p;
   b+=rect(x-rr*.6,y,rr*1.2,bottom-y,rr*.6,c,.18)+rect(x-rr*.32,yy,rr*.64,bottom-yy,rr*.32,paint,alpha)+circle(x,bottom,rr,paint);
   for(let i=0;i<5;i++)b+=path(`M${x+rr+2} ${y+i*(bottom-y)/5}h${i%2?3:6}`,c2,1);
   break;
  }
  case 'skinTemperature':{
   const max=Math.max(.1,...vals.map(v=>Math.abs(v))),step=(aw-8)/sample.length,bw=Math.min(12,step*.62);
   b+=path(`M4 ${cy}H${aw-4}`,'var(--muted)',1);
   sample.forEach((r,i)=>{const hh=Math.abs(r.v)/max*(ah*.38),x=4+step*(i+.5);b+=`<g>${tip(r)}${rect(x-bw/2,r.v>=0?cy-hh:cy,bw,hh,2,r.v>=0?c:c2,alpha)}${circle(x,r.v>=0?cy-hh:cy+hh,1.6,r.v>=0?c:c2)}</g>`});break;
  }
  case 'glucose':{
   const span=Math.max(.1,hi-lo),n=sample.length;
   b+=path(`M7 ${ah-4}H${aw-7}`,c,2,'none',.25);
   sample.forEach((r,i)=>{const x=7+(aw-14)*(hi===lo?.5:(r.v-lo)/span),y=4+(ah-10)*(i+.5)/n;b+=`<g>${tip(r)}${path(`M${x} ${y}V${ah-4}`,c,1,'none',.14)}${circle(x,y,Math.max(2,Math.min(4,ah/n*.28)),i===n-1?c2:paint)}</g>`});break;
  }
  case 'mindfulness':{
   const r=Math.min(aw,ah)*.42,n=sample.length;
   sample.forEach((row,i)=>{const len=r*Math.max(0,row.v)/peak,rx=Math.max(1,r*.2);if(len>0)b+=`<g>${tip(row)}<ellipse cx="${cx}" cy="${cy-len*.45}" rx="${rx}" ry="${len*.6}" transform="rotate(${i*360/n} ${cx} ${cy})" fill="${i%2?c2:paint}" fill-opacity="${alpha}"/></g>`});
   b+=circle(cx,cy,r*.2,'var(--surface)',c2,1);break;
  }
  case 'vo2':{
   const recent=sample.slice(-5),r=Math.min(aw,ah)*.44,spacing=r/(recent.length+1);
   recent.forEach((row,i)=>{const rr=r-i*spacing,p=Math.max(0,row.v)/peak;b+=`<g>${tip(row)}${path(arc(rr,145,395),c,Math.max(2,spacing*.55),'none',.12)}${p>0?path(arc(rr,145,145+250*p),paint,Math.max(2,spacing*.55)):''}</g>`});break;
  }
  case 'bmr':{
   const recent=sample.slice(-7),step=(ah-8)/Math.max(1,recent.length);
   recent.forEach((r,i)=>{const len=(aw-12)*Math.max(0,r.v)/peak,x=(aw-len)/2,y=4+step*(i+.5),rx=Math.min(4,step*.4,len/3);b+=`<g>${tip(r)}${len>0?path(`M${x+rx} ${y}H${x+len-rx}q${rx} 0 ${rx} ${rx}q0 ${rx} -${rx} ${rx}H${x+rx}`,paint,Math.max(1.5,step*.26)):circle(cx,y,1,c)}</g>`});break;
  }
  case 'power':{
   const size=Math.min(aw*.6,ah*.9),x=cx-size*.5,y=(ah-size)/2,p=Math.max(0,last.v)/peak;
   const d=`M${x+size*.58} ${y}L${x+size*.12} ${y+size*.58}H${x+size*.44}L${x+size*.35} ${y+size}L${x+size*.9} ${y+size*.38}H${x+size*.56}Z`;
   b+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath></defs>${path(d,c,1.5,c,.15)}<g clip-path="url(#${clip})">${rect(x,y+size*(1-p),size,size*p,0,paint,alpha)}</g>`;break;
  }
  case 'cadence':{
   const z=bounds(),size=Math.max(7,Math.min(16,aw/sample.length*.8));
   sample.forEach((r,i)=>{const x=z.x(i),y=z.y(r.v);b+=`<g transform="rotate(${i%2?16:-16} ${x} ${y})">${tip(r)}${glyph('shoe',x,y,size,i%2?c2:c)}</g>`});break;
  }
  case 'cyclingCadence':{
   const r=Math.max(4,Math.min(aw,ah)*.43);b+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="2"/>`;
   sample.forEach((row,i)=>{const angle=-90+i*360/sample.length,a=polar(r*.2,angle),q=polar(r*.2+r*.7*Math.max(0,row.v)/peak,angle);b+=`<g>${tip(row)}${path(`M${a}L${q}`,i%2?c2:paint,Math.max(1.5,r*.09))}</g>`});
   b+=path(`M${cx-r*.35} ${cy+r*.2}L${cx} ${cy}l${r*.35} -${r*.2}m-${r*.08} -2h${r*.2}M${cx-r*.42} ${cy+r*.2+2}h${r*.2}`,c2,2)+circle(cx,cy,2.4,c2);break;
  }
  default:{
   const ps=points();b+=path(line(ps),paint,sw);ps.forEach(([x,y,r])=>b+=`<g>${tip(r)}${circle(x,y,2,c2)}</g>`);
  }
 }
 if(!mini){
  const value=m.id==='bp'&&Number.isFinite(last.lo)?fmt(last.v,0)+'/'+fmt(last.lo,0):num(last.v);
  const x=aw+Math.min(14,w*.04),numSize=Math.max(16,Math.min(26,(w-x)/Math.max(4,value.length)*1.55));
  b+=label(x,ah*.43,value,numSize,'var(--text)','start')+label(x,ah*.43+17,m.unit,10,'var(--muted)','start')+label(x,ah*.43+33,mdDate(last),10,'var(--muted)','start');
  let scale='';
  if(['speed','power','vo2','height'].includes(m.id))scale='По записям: 0–'+fmt(peak,m.dec);
  if(m.id==='activeCalories')scale='Цель: '+fmt(GOAL.active,0)+' ккал';
  if(m.id==='water')scale='Цель: '+fmt(GOAL.water,0)+' мл';
  if(['bodyFat','spo2'].includes(m.id))scale='Шкала: 0–100%';
  if(m.id==='temp')scale='Шкала записей: '+fmt(lo-1,1)+'–'+fmt(hi+1,1)+' °C';
  if(m.id==='nutrition')scale='Доли калорий записей';
  if(m.id==='restingHeart')scale='База: среднее '+fmt(rows.reduce((a,r)=>a+r.v,0)/rows.length,m.dec)+' '+m.unit;
  if(m.id==='weight'&&rows.length>1)scale='Изменение: '+fmt(last.v-rows.at(-2).v,m.dec)+' кг';
  if(m.id==='distance')scale='Диапазон: '+fmt(lo,m.dec)+'–'+fmt(hi,m.dec)+' км';
  if(scale)b+=label(x,ah*.43+46,scale,8,'var(--muted)','start');
  const y=ah+10,hh=Math.max(16,h-y-15);
  const hist=renderTrendVisual(m,w,hh,rows,true,pts?'points':'aurora');
  b+=`<g transform="translate(0 ${y})" data-secondary-history="actual">${hist.slice(hist.indexOf('>')+1,hist.lastIndexOf('</svg>'))}</g>`;
  b+=label(5,h-2,mdDate(rows[0]),8,'var(--muted)','start')+label(w-5,h-2,mdDate(last),8,'var(--muted)','end');
 }
 return wrap(b);
}
