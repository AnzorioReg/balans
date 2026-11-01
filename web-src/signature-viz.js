/* Original metric-specific visual language, with measured values only. */
Object.assign(PAL,{
 totalCalories:['#ffb547','#ff5e27'],floors:['#50f5ac','#05cbb7'],elevation:['#a4ff2f','#29e8a4'],
 speed:['#0ff4d4','#02abff'],resp:['#ff9dc8','#fe55ac'],height:['#ffc94e','#ff8e35'],
 bodyFat:['#ffc048','#ff5f72'],leanMass:['#ffbd48','#ff7748'],bodyWater:['#55eaff','#1685ff'],
 boneMass:['#ffe08a','#fbad39'],nutrition:['#b8ff34','#14dba0'],temp:['#ffcc38','#ff6448'],
 skinTemperature:['#ffad6c','#ff4a7e'],glucose:['#ffc843','#ff6830'],mindfulness:['#ce9bff','#895bff'],
 vo2:['#ffb548','#ff764d'],bmr:['#ffbd55','#ff6a36'],power:['#ff4da1','#c15cff'],
 cadence:['#fb4aa0','#ff824e'],cyclingCadence:['#e968ff','#9a68ff']
});
function signatureVisual(m,w,h,rows,mini){
 const last=rows.at(-1),P=chartColors(m),g=uid('signature'),color=P[0],other=P.at(-1),compact=h<48;
 const defs=`<defs>${lg(g,P,false)}<linearGradient id="${g}v" x1="0" y1="1" x2="0" y2="0">${P.map((c,i)=>`<stop offset="${i/Math.max(1,P.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
 const finish=(body,kind)=>visualSVG(w,h,defs+body,m.name+': '+show(m,last.v,last.lo)).replace('class="real-visual"',`class="real-visual signature-${kind}" data-design="${kind}"`);
 const glyph=(name,x,y,size,c=color)=>`<svg x="${x-size/2}" y="${y-size/2}" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${c}"><use href="#${semanticGlyph(name,'classic')}"/></svg>`;
 const label=(x,y,t,size=12)=>`<text x="${x}" y="${y}" text-anchor="middle" fill="var(--text)" font-size="${size}" font-weight="800">${esc(String(t))}</text>`;
 const ring=(percent,r,cx,cy,stroke=7)=>{const C=2*Math.PI*r,p=Math.max(0,Math.min(1,percent));return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-opacity=".18" stroke-width="${stroke}"/>${p>0?`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${g})" stroke-width="${stroke}" stroke-dasharray="${p*C} ${C}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>`:''}`};
 const current=DAILY_METRICS.has(m.id)?actualLatest(m):last.v;
 const observations=visualRecordSubset(rows,mini?14:60),values=observations.map(r=>r.v);
 const history=(variant='aurora')=>renderTrendVisual(m,w,h,rows,mini,variant);
 // Percent rings are percentages supplied by the source, not synthetic parts.
 if(['spo2','bodyFat'].includes(m.id)){
  if(!mini)return history('aurora');
  const r=Math.max(5,Math.min(w*.26,h*.44)-3),cx=w/2,cy=h/2;
  return finish(ring(last.v/100,r,cx,cy,Math.max(4,r*.22))+glyph(METRIC_GLYPH_MAP[m.id],cx,cy,Math.max(9,r*.9)),m.id==='spo2'?'oxygen-ring':m.id==='bodyFat'?'fat-ring':'water-ring');
 }
 if(m.id==='activeCalories'&&mini){
  const goal=GOAL.active,p=Number.isFinite(current)?Math.min(1,Math.max(0,current/goal)):0;
  const r=Math.max(5,Math.min(w*.4,h*.83)-3),cx=w/2,cy=h-4,C=Math.PI*r,sw=Math.max(4,Math.min(8,r*.23));
  const path=`M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}`;
  return finish(`<path d="${path}" fill="none" stroke="${color}" stroke-opacity=".2" stroke-width="${sw}" stroke-linecap="round"/>${p?`<path d="${path}" fill="none" stroke="url(#${g})" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${p*C} ${C}"/>`:''}${glyph('flame',cx,cy-r*.25,Math.max(9,r*.5),other)}`,'energy-gauge');
 }
 if(m.id==='water'&&mini){
  const p=Number.isFinite(current)?Math.min(1,Math.max(0,current/GOAL.water)):0;
  const gw=Math.min(w*.4,h*.7),gh=h-5,x=w/2-gw/2,y=2,level=y+gh*(1-p),clip=uid('liquid');
  return finish(`<defs><clipPath id="${clip}"><path d="M${x} ${y}h${gw}l-${gw*.08} ${gh}h-${gw*.84}Z"/></clipPath></defs><path d="M${x} ${y}h${gw}l-${gw*.08} ${gh}h-${gw*.84}Z" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-width="1.8"/><g clip-path="url(#${clip})">${p?`<path d="M${x-2} ${level}Q${x+gw*.25} ${level-3} ${x+gw*.5} ${level}T${x+gw+2} ${level}V${h+3}H${x-2}Z" fill="url(#${g}v)"/>`:''}</g>${glyph('water',w/2,h/2,Math.max(9,Math.min(14,h*.35)),p>.6?'var(--surface)':color)}`,'water-glass');
 }
 if(m.id==='nutrition'&&mini){
  // Segments mean calorie totals on actual recorded dates, never invented macros.
  const daily=new Map();rows.forEach(r=>daily.set(r.day||localDay(recordTimestamp(r)),r));
  const dates=[...daily.values()].slice(-7),total=dates.reduce((s,r)=>s+Math.max(0,r.v),0);
  const r=Math.max(5,Math.min(w,h)*.44-2),cx=w/2,cy=h/2,C=2*Math.PI*r;
  let offset=0;let b='';
  dates.forEach((r0,i)=>{const fraction=total>0?Math.max(0,r0.v)/total:0,len=Math.max(0,fraction*C-2);b+=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${[color,other,'#eaff76','#46fbd7'][i%4]}" stroke-width="${Math.max(4,r*.3)}" stroke-dasharray="${len} ${C}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${actualDate(r0)}: ${r0.v} ккал</title></circle>`;offset+=fraction*C});
  return finish(b+glyph('meal',cx,cy,Math.max(10,r*.95)),'nutrition-donut');
 }
 if(m.id==='sleep'){
  const stages=stageVisual(last,w,h);
  if(stages&&(!mini||h>=48))return finish(stages,'sleep-stages');
  // Each capsule is the actual duration of one saved night, not a fake stage.
  if(!mini)return history('capsule');
  const bw=(w-6)/Math.max(1,Math.min(7,values.length)),mx=Math.max(1,...values);
  let b='';values.slice(-7).forEach((v,i)=>{const hh=Math.max(2,v/mx*(h-7));b+=`<rect x="${3+bw*i+bw*.16}" y="${h-3-hh}" width="${bw*.65}" height="${hh}" rx="${Math.min(5,bw*.3)}" fill="${['#bd9dff','#9270ff','#6e61ff'][i%3]}"/>`});
  return finish(b,'sleep-nights');
 }
 if(m.id==='temp'&&mini){
  const lo=Math.min(35,...values),hi=Math.max(41,...values),p=Math.min(1,Math.max(0,(last.v-lo)/(hi-lo)));
  const cx=w/2,r=Math.max(3,Math.min(6,h*.14)),top=2,bottom=h-r-2,stemW=r*.8;
  return finish(`<rect x="${cx-stemW}" y="${top}" width="${stemW*2}" height="${bottom-top}" rx="${stemW}" fill="${color}" fill-opacity=".2"/><rect x="${cx-stemW*.65}" y="${bottom-(bottom-top)*p}" width="${stemW*1.3}" height="${(bottom-top)*p}" rx="${stemW*.65}" fill="url(#${g}v)"/><circle cx="${cx}" cy="${bottom}" r="${r}" fill="${other}"/>`,'temperature-tube');
 }
 if(['glucose','vo2'].includes(m.id)&&mini){
  const lo=Math.min(...values),hi=Math.max(...values),p=hi>lo?(last.v-lo)/(hi-lo):.5;
  const y=h*.6,sw=Math.max(5,h*.2),left=7,right=w-7;
  return finish(`<path d="M${left} ${y}H${right}" stroke="url(#${g})" stroke-width="${sw}" stroke-linecap="round"/><circle cx="${left+(right-left)*p}" cy="${y}" r="${sw*.85}" fill="var(--surface)" stroke="${other}" stroke-width="2.5"/>${glyph(METRIC_GLYPH_MAP[m.id],w/2,h*.17,Math.min(12,h*.32))}`,m.id+'-observed-range');
 }
 if(m.id==='power'&&mini){
  const max=Math.max(1,...values),p=Math.max(0,Math.min(1,last.v/max)),cx=w/2,size=h-2,clip=uid('power');
  return finish(`<defs><clipPath id="${clip}"><path d="M${cx+size*.1} 1 ${cx-size*.35} ${h*.58}H${cx-size*.02}L${cx-size*.1} ${h-1} ${cx+size*.35} ${h*.38}H${cx+size*.03}Z"/></clipPath></defs><g clip-path="url(#${clip})"><rect x="${cx-size}" y="0" width="${size*2}" height="${h}" fill="${color}" opacity=".2"/><rect x="${cx-size}" y="${h*(1-p)}" width="${size*2}" height="${h*p}" fill="url(#${g}v)"/></g>`,'power-bolt');
 }
 if(m.id==='cyclingCadence'&&mini){
  const r=Math.max(5,Math.min(w,h)*.44-2),cx=w/2,cy=h/2,max=Math.max(1,...values),N=Math.min(10,observations.length);
  let b='';observations.slice(-N).forEach((r0,i)=>{const a=(-Math.PI/2)+(i/N)*Math.PI*2,rad=r*(.6+.4*Math.max(0,r0.v)/max);b+=`<path d="M${cx+Math.cos(a)*r*.4} ${cy+Math.sin(a)*r*.4}L${cx+Math.cos(a)*rad} ${cy+Math.sin(a)*rad}" stroke="${i%2?other:color}" stroke-width="${Math.max(3,r*.2)}" stroke-linecap="round"/>`});
  return finish(b+glyph('cycle',cx,cy,Math.max(9,r*.8)),'cadence-wheel');
 }
 if(m.id==='mindfulness'&&mini){
  const cx=w/2,cy=h/2,r=Math.max(3,Math.min(w,h)*.42),max=Math.max(1,...values),n=Math.min(7,values.length);
  let b='';values.slice(-n).forEach((v,i)=>{const a=360*i/n,len=r*(.45+.55*Math.max(0,v)/max);b+=`<ellipse cx="${cx}" cy="${cy-len*.36}" rx="${Math.max(2,r*.23)}" ry="${len*.6}" transform="rotate(${a} ${cx} ${cy})" fill="${i%2?other:color}" fill-opacity=".85"/>`});
  return finish(b+`<circle cx="${cx}" cy="${cy}" r="${r*.24}" fill="var(--surface)"/>`,'mindful-petals');
 }
 if(m.id==='boneMass'&&mini){
  const mx=Math.max(1,...values),step=(w-8)/Math.max(1,values.length);
  return finish(values.map((v,i)=>{const x=4+(i+.5)*step,y=h-4-(h-10)*v/mx;return `<path d="M${x} ${h-4}V${y}" stroke="${color}" stroke-opacity=".5" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${Math.max(2,Math.min(4,step*.25))}" fill="${other}"/>`}).join(''),'bone-lollipops');
 }
 const barIds=new Set(['steps','totalCalories','floors','elevation','exercise','leanMass','bmr']);
 const result=history(barIds.has(m.id)?'capsule':'aurora');
 // Keep each metric's original colour and time-series identity, with only real points.
 return result.replace('class="real-visual"',`class="real-visual signature-history" data-design="${m.id}-history"`);
}
function emptyMetricVisual(m,w,h){
 const p=chartColors(m),cx=w/2,cy=h/2,r=Math.max(4,Math.min(w,h)*.39);
 const frame=['water','temp'].includes(m.id)
  ?`<rect x="${cx-r*.65}" y="${cy-r}" width="${r*1.3}" height="${r*2}" rx="${r*.35}" fill="none" stroke="${p[0]}" stroke-opacity=".4" stroke-width="2"/>`
  :`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p[0]}" stroke-opacity=".32" stroke-width="3" stroke-dasharray="2 4"/>`;
 const size=Math.max(9,r*1.15);
 return visualSVG(w,h,frame+`<svg x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" viewBox="0 0 24 24" style="color:${p[0]}"><use href="#${metricGlyph(m)}"/></svg>`,m.name+': нет измерений').replace('class="real-visual"','class="real-visual empty-metric" data-empty="true"');
}
function renderRealVisual(m,w,h,rows,mini=true,variant=state.chartSet){
 if(variant==='signature'&&typeof originalAuthorVisual==='function')return originalAuthorVisual(m,w,h,rows,mini);
 if(typeof metricDesignVisual==='function')return metricDesignVisual(m,w,h,rows,mini,variant);
 if(!rows.length&&mini)return emptyMetricVisual(m,w,h);
 return variant==='signature'&&rows.length?signatureVisual(m,w,h,rows,mini):renderTrendVisual(m,w,h,rows,mini,variant);
}
