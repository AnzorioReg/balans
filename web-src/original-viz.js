/* Original author designs from viz.js / viz2.js, adapted to supplied records.
 * No generated series, ECG, sleep phases, clinical zones or macro splits.
 * The original palette is copied literally BEFORE later PAL extensions.
 */
const ORIGINAL_AUTHOR_PAL={
 steps:['#3fe0c5','#b6f36b'],distance:['#4fb8ff','#3fe0c5'],activeCalories:['#ffd23f','#ff7a3d','#ff3d6e'],
 exercise:['#ff8a4c','#ff4fa3'],heart:['#ff9a8b','#ff3d6e','#c13dff'],restingHeart:['#ff6f91','#ffb3c6'],
 bp:['#ff4d6d','#7b6cff'],spo2:['#4fd1ff','#3d7bff'],hrv:['#b18cff','#ff6fd8'],
 weight:['#ffd166','#ff8a4c'],sleep:['#9d8cff','#4c3df0'],water:['#7fe3ff','#2f8bff']
};
const ORIGINAL_AUTHOR_PHASES=[['Бодрствование','#ffb066'],['Быстрый','#4fd1ff'],['Лёгкий','#9d8cff'],['Глубокий','#4c3df0']];
const ORIGINAL_AUTHOR_MINI_LIMITS={totalCalories:7,floors:7,elevation:7,nutrition:7,mindfulness:7,bmr:7,speed:7,bodyWater:7,skinTemperature:7,boneMass:7,bodyFat:5,leanMass:6};
function oaDate(r,short=false){
 const ts=recordTimestamp(r);if(!Number.isFinite(ts))return '—';
 const d=new Date(ts);return short?['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]:String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0');
}
function oaStages(r){
 return (r?.stages||[]).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.end>s.start).slice().sort((a,b)=>a.start-b.start);
}
function oaPhase(kind){return ({wake:0,out:0,rem:1,light:2,deep:3})[kind]??-1}
function oaHypnogram(r,w,h,mini){
 const stages=oaStages(r);if(!stages.length)return null;
 const start=Number.isFinite(r.start)?r.start:stages[0].start,end=Number.isFinite(r.end)?r.end:stages.at(-1).end;
 if(!(end>start))return null;
 const top=mini?2:18,bot=mini?12:22,left=mini?0:64,rowH=Math.max(.5,(h-top-bot)/4),X=t=>left+(w-left)*(t-start)/(end-start);
 let b='';if(!mini)ORIGINAL_AUTHOR_PHASES.forEach(([n,c],i)=>b+=`<text x="0" y="${top+rowH*i+rowH/2+4}" font-size="10" fill="${c}">${n==='Бодрствование'?'Пробужд.':n}</text><line x1="${left}" x2="${w}" y1="${top+rowH*i+rowH/2}" y2="${top+rowH*i+rowH/2}" stroke="var(--line)" stroke-dasharray="2 4"/>`);
 let prev=null;
 stages.forEach(s=>{
  const l=oaPhase(s.kind),level=l<0?2:l,x=X(Math.max(start,s.start)),x2=X(Math.min(end,s.end)),yc=top+rowH*level+rowH/2,hh=rowH*.62;
  if(x2<=x)return;
  if(prev&&prev.end===s.start)b+=`<line x1="${x}" x2="${x}" y1="${Math.min(prev.y,yc)}" y2="${Math.max(prev.y,yc)}" stroke="var(--faint)" stroke-opacity=".5" stroke-width="1.2"/>`;
  b+=`<rect x="${x}" y="${yc-hh/2}" width="${Math.max(.2,x2-x-.6)}" height="${hh}" rx="${Math.min(hh/2,4)}" fill="${l<0?'var(--faint)':ORIGINAL_AUTHOR_PHASES[l][1]}"><title>${esc(s.kind||'Неизвестная фаза')}</title></rect>`;
  prev={end:s.end,y:yc};
 });
 const time=t=>new Date(t).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
 b+=`<text x="${left}" y="${h-1}" font-size="${mini?9:10}" fill="var(--faint)">${time(start)}</text><text x="${w}" y="${h-1}" font-size="${mini?9:10}" fill="var(--faint)" text-anchor="end">${time(end)}</text>`;
 if(!mini)[.25,.5,.75].forEach(f=>b+=`<text x="${X(start+(end-start)*f)}" y="${h-1}" font-size="10" fill="var(--faint)" text-anchor="middle">${time(start+(end-start)*f)}</text>`);
 return b;
}
function originalAuthorVisual(m,w,h,inputRows,mini=true){
 w=Math.max(24,Number(w)||120);h=Math.max(18,Number(h)||44);
 const all=(Array.isArray(inputRows)?inputRows:[]).filter(r=>Number.isFinite(r?.v));
 const rows=visualRecordSubset(all,mini?(ORIGINAL_AUTHOR_MINI_LIMITS[m.id]||14):70),v=rows.map(r=>r.v),n=v.length,last=all.at(-1);
 const P=ORIGINAL_AUTHOR_PAL[m.id]||[`var(${CATS[m.cat].c})`,`var(${CATS[m.cat].c})`],g=uid('original');
 const mn=n?Math.min(...v):0,mx=n?Math.max(...v):0,absMax=Math.max(.000001,...v.map(Math.abs));
 const rawMin=all.reduce((a,r)=>Math.min(a,r.v),Infinity),rawMax=all.reduce((a,r)=>Math.max(a,r.v),-Infinity);
 const wrap=(body,design=m.id)=>`<svg class="real-visual original-author" data-design="original-${design}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(m.name+': '+(last?show(m,last.v,last.lo)+' · '+oaDate(last):'нет измерений'))}">${body}</svg>`;
 const grad=(id=g,vertical=true,reverse=false,box=vertical||['activeCalories','glucose','vo2'].includes(m.id))=>`<linearGradient id="${id}" gradientUnits="${box?'objectBoundingBox':'userSpaceOnUse'}" x1="0" y1="${vertical?(box?1:h):0}" x2="${vertical?0:(box?1:w)}" y2="0">${(reverse?P.slice().reverse():P).map((c,i)=>`<stop offset="${i/Math.max(1,P.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
 const text=(x,y,t,extra='')=>`<text x="${x}" y="${y}" font-size="9" fill="var(--faint)" text-anchor="middle" ${extra}>${esc(String(t))}</text>`;
 const title=r=>`<title>${esc((r.aggregate?(r.aggregate==='sum'?'Сумма за интервал · ':'Среднее за интервал · '):'')+oaDate(r)+': '+show(m,r.v,r.lo))}</title>`;
 const labelAt=i=>n<=7||[0,Math.floor((n-1)/2),n-1].includes(i)?oaDate(rows[i],mini&&n<=7):'';
 const padRange=(a,b,pad=.2)=>{const p=(b-a)*pad||Math.max(.1,Math.abs(b)*.02);return [a-p,b+p]};
 const range=padRange(rawMin,rawMax,.1);
 const current=last&&!(mini&&!m.historicalView&&DAILY_METRICS.has(m.id)&&(last.day||localDay(recordTimestamp(last)))!==localDay())?last.v:NaN;
 const pct=goal=>Number.isFinite(current)&&goal>0?Math.max(0,Math.min(1,current/goal)):0;
 const cumulative=new Map();let total=0;
 if(m.id==='distance')all.forEach(r=>{total+=r.v;cumulative.set(r,total)});
 if(!n)return wrap(`<line x1="4" x2="${w-4}" y1="${h/2}" y2="${h/2}" stroke="var(--faint)" stroke-dasharray="3 5"/>${text(w/2,h/2-7,'Нет измерений')}`);
 const miniLine=(values=v,colors=P,angular=true)=>{
  const a=Math.min(...values),z=Math.max(...values),span=z-a||1;
  const pts=values.map((x,i)=>[values.length===1?w/2:6+i*(w-12)/(values.length-1),h-8-(h-16)*(z===a?.5:(x-a)/span)]);
  const d=angular?pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '):smooth(pts);
  return `<defs>${grad(g,false)}</defs><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="3.5" fill="${colors[1]}"/>`;
 };
 const miniBar=(values=v,capsule=false)=>{
  const max=Math.max(.000001,...values)*(capsule?1:1.1),bw=w/(capsule?Math.max(1,values.length):7),base=h-(capsule?6:4);
  return `<defs>${grad(g,false)}</defs>`+values.map((x,i)=>{const hh=Math.max(0,x)/max*(h-(capsule?10:8)),ww=Math.max(.3,bw-2);return `<g>${title(rows[i])}<rect x="${i*bw+1}" y="${base-hh}" width="${ww}" height="${hh}" rx="${capsule?Math.min(ww/2,4):ww/2.4}" fill="${capsule?P[i%2]:`url(#${g})`}" opacity="${i===values.length-1?1:.55}"/></g>`}).join('');
 };
 if(mini){
  switch(m.id){
   case 'steps':{
    const goal=GOAL.steps,max=Math.max(1,goal*1.12,...v),bw=w/n,base=h-12,y=x=>base-(base-6)*x/max,gy=y(goal);
    let b=`<defs>${grad()}</defs>`;
    if(goal>0)b+=`<line x1="0" x2="${w}" y1="${gy}" y2="${gy}" stroke="${P[1]}" stroke-opacity=".7" stroke-dasharray="3 4"/><text x="${w-2}" y="${gy-3}" font-size="9" fill="${P[1]}" text-anchor="end">цель</text>`;
    v.forEach((x,i)=>{const X=i*bw+bw*.2,ww=bw*.6,Y=y(x);b+=`<g>${title(rows[i])}<rect x="${X}" y="${Y}" width="${ww}" height="${Math.max(0,base-Y)}" rx="${ww/2.4}" fill="url(#${g})" opacity="${i===n-1?1:.62}"/>${goal>0&&x>=goal?`<circle cx="${X+ww/2}" cy="${Y-5}" r="2.6" fill="${P[1]}"/>`:''}</g>`+text(X+ww/2,h-1,labelAt(i))});return wrap(b);
   }
   case 'distance':{
    const c=rows.map(r=>cumulative.get(r)),max=Math.max(.000001,total),pts=c.map((x,i)=>[n===1?w/2:8+i*(w-16)/(n-1),h-8-(h-18)*x/max]),d=smooth(pts);
    let b=`<defs>${grad(g,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${P[0]}" stop-opacity=".35"/><stop offset="1" stop-color="${P[0]}" stop-opacity="0"/></linearGradient></defs>`;
    b+=`<path d="${d}L${pts.at(-1)[0]} ${h}L${pts[0][0]} ${h}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="1.2" opacity=".5"/>`;
    pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===n-1?5:2.6}" fill="${i===n-1?P[1]:'var(--surface)'}" stroke="url(#${g})" stroke-width="2">${title(rows[i])}</circle>`);
    if(w>=130)b+=`<text x="${pts.at(-1)[0]-8}" y="${pts.at(-1)[1]+3}" font-size="10" font-weight="700" fill="var(--text)" text-anchor="end">${fmt(total,1)} км по записям</text>`;return wrap(b);
   }
   case 'activeCalories':{
    const goal=GOAL.active,p=pct(goal),r=Math.max(2,Math.min(w/2-8,h-10)),cx=w/2,cy=h-4,L=Math.PI*r,a=Math.PI*(1-p);
    return wrap(`<defs>${grad(g,false)}</defs><path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="var(--surface3)" stroke-width="10" stroke-linecap="round"/>${p>0?`<path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="url(#${g})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${L*p} ${L}"/>`:''}<circle cx="${cx+r*Math.cos(a)}" cy="${cy-r*Math.sin(a)}" r="6" fill="var(--surface)" stroke="${P[2]}" stroke-width="3"/><text x="${cx}" y="${cy-6}" font-size="15" font-weight="800" fill="var(--text)" text-anchor="middle">${Number.isFinite(current)?Math.round(p*100)+'%':'—'}</text><text x="${cx}" y="${cy-r*.55}" font-size="9" fill="var(--muted)" text-anchor="middle">цель ${goal}</text>`);
   }
   case 'exercise':{
    const max=Math.max(.000001,...v),bw=w/n;
    let b=`<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient></defs>`;
    v.forEach((x,i)=>{const cap=Math.max(0,Math.min(bw/2-1,h/2-6)),r=cap*Math.sqrt(Math.max(0,x)/max),cx=i*bw+bw/2,cy=(h-12)/2;b+=`<g>${title(rows[i])}<circle cx="${cx}" cy="${cy}" r="${cap}" fill="var(--surface3)" opacity=".5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" opacity="${i===n-1?1:.75}"/></g>`+text(cx,h-1,labelAt(i))});return wrap(b);
   }
   case 'heart':{
    const [a,z]=padRange(mn,mx,.25),pts=v.map((x,i)=>[n===1?w/2:i*w/(n-1),4+(h-8)*(1-(x-a)/(z-a))]),d=smooth(pts);
    return wrap(`<defs>${grad(g,false)}<filter id="${g}f" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="5" opacity=".45" filter="url(#${g}f)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>${n===1?`<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="3" fill="${P[1]}"/>`:''}`);
   }
   case 'restingHeart':{
    const band=[rawMin,rawMax],[a,z]=padRange(band[0],band[1],.3),y=x=>6+(h-18)*(1-(x-a)/(z-a)),bw=w/n;
    let b=`<rect x="0" y="${y(band[1])}" width="${w}" height="${Math.max(0,y(band[0])-y(band[1]))}" rx="6" fill="${P[0]}" opacity=".16"/>`;
    if(w>=170)b+=`<text x="${w-3}" y="${Math.max(9,y(band[1])-3)}" font-size="9" fill="${P[0]}" text-anchor="end">записи ${fmt(band[0])}–${fmt(band[1])}</text>`;
    const pts=v.map((x,i)=>[i*bw+bw/2,y(x)]);b+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ')}" fill="none" stroke="${P[0]}" stroke-opacity=".35" stroke-width="1.5"/>`;
    pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===n-1?5.5:3.8}" fill="${i===n-1?P[0]:P[1]}" stroke="var(--surface)" stroke-width="1.5">${title(rows[i])}</circle>`+text(p[0],h-1,labelAt(i)));return wrap(b);
   }
   case 'bp':{
    const dia=rows.map(r=>r.lo).filter(Number.isFinite),[a,z]=padRange(Math.min(...v,...dia),Math.max(...v,...dia),.15),y=x=>4+(h-16)*(1-(x-a)/(z-a)),bw=w/n;
    let b=`<defs>${grad(g,true,true)}</defs>`;rows.forEach((r,i)=>{const cx=i*bw+bw/2,ww=Math.min(12,bw*.45),yt=y(r.v);
     if(Number.isFinite(r.lo)){const top=Math.min(yt,y(r.lo)),hh=Math.abs(y(r.lo)-yt),rr=Math.max(.5,Math.min(ww/2,hh/2)-1);b+=`<g>${title(r)}<rect x="${cx-ww/2}" y="${top}" width="${ww}" height="${hh}" rx="${Math.min(ww/2,hh/2)}" fill="url(#${g})" opacity="${i===n-1?1:.7}"/><circle cx="${cx}" cy="${top+rr}" r="${rr}" fill="#fff" opacity=".85"/><circle cx="${cx}" cy="${top+hh-rr}" r="${rr}" fill="#fff" opacity=".85"/></g>`}
     else b+=`<circle cx="${cx}" cy="${yt}" r="${Math.min(4,ww/2)}" fill="${P[0]}">${title(r)}</circle>`;
     b+=text(cx,h-1,labelAt(i));
    });return wrap(b);
   }
   case 'spo2':{
    const val=last.v,N=36,r=Math.max(2,Math.min(w,h)/2-4),cx=w/2,cy=h/2,on=Math.round(N*Math.max(0,Math.min(1,val/100)));
    let b=`<defs>${grad(g,false)}</defs>`;for(let i=0;i<N;i++){const a=-Math.PI/2+i/N*2*Math.PI,r1=Math.max(0,r-7);b+=`<line x1="${cx+r1*Math.cos(a)}" y1="${cy+r1*Math.sin(a)}" x2="${cx+r*Math.cos(a)}" y2="${cy+r*Math.sin(a)}" stroke="${i<on?(i<on/2?P[0]:P[1]):'var(--surface3)'}" stroke-width="3" stroke-linecap="round"/>`}
    return wrap(b+`<text x="${cx}" y="${cy+5}" font-size="${Math.max(8,r*.5)}" font-weight="800" fill="var(--text)" text-anchor="middle">${fmt(val,m.dec)}%</text>`);
   }
   case 'hrv':{
    const cy=h/2,bw=w/n;let b=`<defs>${grad(g,false)}</defs>`;
    v.forEach((x,i)=>{const a=Math.max(0,x)/absMax*(h/2-3);b+=`<rect x="${i*bw+bw/2-Math.min(3,bw*.5)/2}" y="${cy-a}" width="${Math.min(3,bw*.5)}" height="${2*a}" rx="1.5" fill="url(#${g})" opacity="${.45+.55*(i+1)/n}">${title(rows[i])}</rect>`});return wrap(b);
   }
   case 'sleep':{
    const phases=oaHypnogram(last,w,h,true);return wrap(phases||miniBar(v,true));
   }
   case 'weight':{
    const a=mn-.3,z=mx+.3,pts=v.map((x,i)=>[n===1?w/2:6+i*(w-12)/(n-1),6+(h-18)*(1-(x-a)/(z-a))]),d=smooth(pts);
    let b=`<defs>${grad(g,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${P[0]}" stop-opacity=".4"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${pts.at(-1)[0]} ${h-10}L${pts[0][0]} ${h-10}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3" stroke-linecap="round"/>`;
    const iMin=v.indexOf(mn),iMax=v.indexOf(mx);
    [[iMin,'мин'],[iMax,'макс']].forEach(([i,l])=>b+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="3.5" fill="var(--surface)" stroke="${P[1]}" stroke-width="2"/>${h>=55?`<text x="${pts[i][0]}" y="${pts[i][1]+(l==='мин'?14:-7)}" font-size="9" fill="var(--muted)" text-anchor="middle">${fmt(v[i],1)}</text>`:''}`);
    b+=`<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="${P[1]}"/>`;pts.forEach((p,i)=>b+=text(p[0],h-1,labelAt(i)));return wrap(b);
   }
   case 'water':{
    const p=pct(GOAL.water),gw=Math.min(54,h*.8),gh=h-6,gx=6,gy=3,fy=gy+gh*(1-p),cups=Math.max(1,Math.ceil(GOAL.water/250)),cx0=gx+gw+12,cols=w-cx0>=cups*4+(cups-1)*4?cups:Math.min(4,cups),nr=Math.ceil(cups/cols),cw=Math.max(2,Math.min(22,(w-cx0-(cols-1)*4)/cols,(h-6)/(nr*1.45))),ch=cw*1.25;
    let b=`<defs>${grad(g,true,true)}<clipPath id="${g}c"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12"/></clipPath></defs><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="var(--surface3)" opacity=".6"/><g clip-path="url(#${g}c)">${p>0?`<path d="M${gx-gw} ${fy}q${gw/4} -6 ${gw/2} 0t${gw/2} 0t${gw/2} 0t${gw/2} 0t${gw/2} 0V${gy+gh}H${gx-gw}Z" fill="url(#${g})"/>`:''}</g><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="none" stroke="${P[0]}" stroke-opacity=".6" stroke-width="1.5"/><text x="${gx+gw/2}" y="${gy+gh/2+5}" font-size="13" font-weight="800" fill="var(--text)" text-anchor="middle">${Number.isFinite(current)?Math.round(p*100)+'%':'—'}</text>`;
    const amount=Number.isFinite(current)?Math.max(0,current)/250:0;
    for(let i=0;i<cups;i++){const x=cx0+(i%cols)*(cw+4),y=(h-nr*(ch+3))/2+Math.floor(i/cols)*(ch+3),fraction=Math.max(0,Math.min(1,amount-i)),d=`M${x} ${y}H${x+cw}L${x+cw*.85} ${y+ch}H${x+cw*.15}Z`;b+=`<path d="${d}" fill="${fraction>0?`url(#${g})`:'none'}" fill-opacity="${fraction}" stroke="${fraction>0?P[1]:'var(--line)'}" stroke-width="1.5" stroke-linejoin="round"/>`}
    if(h>=65&&w>=210)b+=`<text x="${cx0}" y="${h-2}" font-size="10" fill="var(--muted)">${fmt(amount,1)} экв. стаканов по 250 мл</text>`;return wrap(b);
   }
   // Registered callbacks in viz2.js, with the same geometry and original colors.
   case 'totalCalories':case 'floors':case 'elevation':case 'nutrition':case 'mindfulness':case 'bmr':return wrap(miniBar(v.slice(0,7)));
   case 'speed':case 'bodyWater':case 'skinTemperature':return wrap(miniLine(v.slice(0,7)));
   case 'resp':return wrap(miniLine(v,P,false));
   case 'cadence':case 'cyclingCadence':return wrap(miniLine(v,P,true));
   case 'height':return wrap(`<line x1="6" y1="${h*.3}" x2="${w-6}" y2="${h*.3}" stroke="${P[0]}" stroke-width="3" stroke-linecap="round"/>`);
   case 'leanMass':return wrap(miniBar(v.slice(0,6),true));
   case 'boneMass':{
    const values=v.slice(0,7),a=Math.min(...values),z=Math.max(...values),span=z-a||1;return wrap(values.map((x,i)=>`<circle cx="${values.length===1?w/2:6+i*(w-12)/(values.length-1)}" cy="${h-6-(h-14)*(z===a?.5:(x-a)/span)}" r="3" fill="${P[i%2]}" opacity=".85">${title(rows[i])}</circle>`).join(''));
   }
   case 'bodyFat':{
    const values=v.slice(0,5),sum=values.reduce((a,x)=>a+Math.max(0,x),0);let X=0;return wrap(values.map((x,i)=>{const ww=sum?Math.max(0,x)/sum*(w-4):0,b=`<rect x="${X+2}" y="4" width="${ww}" height="${h-8}" rx="3" fill="${P[i%P.length]}">${title(rows[i])}</rect>`;X+=ww;return b}).join(''));
   }
   case 'temp':{
    const p=(last.v-range[0])/(range[1]-range[0]),hh=(h-8)*p;return wrap(`<rect x="${w/2-8}" y="4" width="16" height="${h-8}" rx="8" fill="var(--surface3)"/><rect x="${w/2-8}" y="${h-4-hh}" width="16" height="${hh}" rx="8" fill="url(#${g})" fill-opacity=".9"/><defs>${grad()}</defs><title>Шкала записей: ${fmt(range[0],1)}–${fmt(range[1],1)} °C</title>`);
   }
   case 'glucose':case 'vo2':{
    const p=(last.v-range[0])/(range[1]-range[0]),r=Math.max(2,Math.min(w/2,h/2)-5),cx=w/2,cy=h/2,L=Math.PI*r;
    return wrap(`<defs>${grad(g,false)}</defs><path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="var(--surface3)" stroke-width="6" stroke-linecap="round"/><path d="M${cx-r} ${cy}A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="url(#${g})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${L}" stroke-dashoffset="${L*(1-p)}"/><text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="${Math.min(w,h)*.28}" font-weight="800" fill="var(--text)">${fmt(last.v,m.dec)}</text><text x="${cx}" y="${cy+r*.6}" text-anchor="middle" font-size="8" fill="var(--muted)">${fmt(range[0],m.dec)}–${fmt(range[1],m.dec)}</text><title>Шкала по записям, ${esc(m.unit)}</title>`);
   }
   case 'power':{
    const p=(last.v-range[0])/(range[1]-range[0]),X=8+p*(w-16);return wrap(`<path d="M${X-8} ${h/2-5}L${X} ${h/2-8}L${X+8} ${h/2-5}L${X} ${h/2+8}L${X-8} ${h/2+5}Z" fill="url(#${g})"/><defs>${grad(g,true,true)}</defs><title>Шкала записей: ${fmt(range[0],m.dec)}–${fmt(range[1],m.dec)} Вт</title>`);
   }
  }
  return wrap(miniLine());
 }
 // Original vizBig: original geometry, axes, palette and moving average.
 const L=Math.min(34,w*.13),R=8,T=10,B=24,base=h-B,step=(w-L-R)/n,X=i=>L+step*i+step/2;
 const scale=(values,zero=false,pad=.2)=>{
  let a=Math.min(...values),z=Math.max(...values);
  if(zero){a=Math.min(0,a);if(z===a)z=a+1}
  else [a,z]=padRange(a,z,pad);
  return {mn:a,mx:z,y:x=>T+(h-T-B)*(1-(x-a)/(z-a))};
 };
 const axes=s=>{
  let b='';[s.mn,(s.mn+s.mx)/2,s.mx].forEach(t=>{const y=s.y(t);b+=`<line x1="${L}" x2="${w-R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-dasharray="3 4"/><text x="${L-6}" y="${y+4}" text-anchor="end" font-size="10" fill="var(--faint)">${esc(fmt(t,s.mx-s.mn<12?m.dec:0))}</text>`});
  rows.forEach((r,i)=>{if(n<=7||[0,Math.floor((n-1)/2),n-1].includes(i))b+=`<text x="${X(i)}" y="${h-6}" text-anchor="middle" font-size="10" fill="var(--faint)">${oaDate(r)}</text>`});return b;
 };
 let s,b='';
 switch(m.id){
  case 'steps':case 'activeCalories':case 'water':{
   const goal=({steps:GOAL.steps,activeCalories:GOAL.active,water:GOAL.water})[m.id];
   s=scale(goal>0?v.concat(goal*1.1):v,true);b=axes(s)+`<defs>${grad(g,true,m.id==='water')}</defs>`;const bw=Math.max(.5,step*.62);
   if(goal>0){const gy=s.y(goal);b+=`<line x1="${L}" x2="${w-R}" y1="${gy}" y2="${gy}" stroke="${P.at(-1)}" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${w-R}" y="${gy-4}" font-size="10" font-weight="700" fill="${P.at(-1)}" text-anchor="end">цель ${fmt(goal)}</text>`}
   v.forEach((x,i)=>{const y=s.y(x),hit=goal>0&&x>=goal,hh=Math.max(0,base-y);b+=`<g>${title(rows[i])}<rect x="${X(i)-bw/2}" y="${y}" width="${bw}" height="${hh}" rx="${Math.min(bw/2.2,7,hh/2)}" fill="url(#${g})" opacity="${hit||i===n-1?1:.55}"/>${m.id==='water'&&bw>10?`<circle cx="${X(i)}" cy="${y-7}" r="3" fill="${P[0]}"/>`:hit&&bw>8?`<circle cx="${X(i)}" cy="${y-6}" r="3" fill="${P.at(-1)}"/>`:''}</g>`});break;
  }
  case 'distance':{
   const c=rows.map(r=>cumulative.get(r));s=scale(c,true);b=axes(s);
   const pts=c.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);
   b+=`<defs>${grad(g,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${P[0]}" stop-opacity=".4"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3"/>`;
   const bw=Math.max(.5,step*.3);v.forEach((x,i)=>{const hh=Math.min(h-T-B,Math.max(0,x)/Math.max(.000001,total)*(h-T-B)*3);b+=`<rect x="${X(i)-bw/2}" y="${base-hh}" width="${bw}" height="${hh}" rx="${bw/2}" fill="${P[1]}" opacity=".35">${title(rows[i])}</rect>`});
   if(n<=31)pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===n-1?5:2.5}" fill="${i===n-1?P[0]:'var(--surface)'}" stroke="${P[0]}" stroke-width="2"/>`);
   b+=`<text x="${L+4}" y="${T+12}" font-size="11" font-weight="700" fill="var(--text)">всего ${fmt(total,1)} км по записям</text>`;break;
  }
  case 'exercise':{
   s=scale(v.concat(Math.max(...v)*1.3),true);b=axes(s)+`<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient></defs>`;
   v.forEach((x,i)=>{const r=Math.min(step*.48,18)*Math.sqrt(Math.max(0,x)/Math.max(.000001,mx));b+=`<circle cx="${X(i)}" cy="${s.y(x)}" r="${r}" fill="url(#${g})" opacity=".9">${title(rows[i])}</circle>`;if(n<=7)b+=`<text x="${X(i)}" y="${s.y(x)+4}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${fmt(x,m.dec)}</text>`});break;
  }
  case 'heart':{
   s=scale(v,false,.35);b=axes(s);const pts=v.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);
   b+=`<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="${s.y(s.mn)}" x2="0" y2="${s.y(s.mx)}"><stop stop-color="${P[0]}"/><stop offset=".6" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient><filter id="${g}f"><feGaussianBlur stdDeviation="3"/></filter></defs><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="6" opacity=".35" filter="url(#${g}f)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>`;
   [[v.indexOf(mx),P[2]],[v.indexOf(mn),P[0]]].forEach(([i,c])=>b+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4.5" fill="var(--surface)" stroke="${c}" stroke-width="2.4"/>`);break;
  }
  case 'restingHeart':case 'hrv':case 'spo2':{
   const band=[rawMin,rawMax];s=scale(v.concat(band),false,.3);b=axes(s)+`<rect x="${L}" y="${s.y(band[1])}" width="${w-L-R}" height="${Math.max(0,s.y(band[0])-s.y(band[1]))}" fill="${P[0]}" opacity=".14" rx="6"/><text x="${w-R-4}" y="${s.y(band[1])-4}" font-size="10" fill="${P[0]}" text-anchor="end">диапазон записей</text><defs>${grad(g,true,true)}</defs>`;
   if(m.id==='hrv')v.forEach((x,i)=>b+=`<line x1="${X(i)}" x2="${X(i)}" y1="${base}" y2="${s.y(x)}" stroke="${P[0]}" stroke-width="${Math.max(1.5,step*.18)}" stroke-linecap="round" opacity=".7"/><circle cx="${X(i)}" cy="${s.y(x)}" r="${Math.max(2,Math.min(5,step*.3))}" fill="${P[1]}">${title(rows[i])}</circle>`);
   else if(m.id==='spo2'){const pts=v.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);b+=`<path d="${d}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="url(#${g})" opacity=".28"/><path d="${d}" fill="none" stroke="${P[0]}" stroke-width="2.4"/>`;pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${P[1]}">${title(rows[i])}</circle>`)}
   else {b+=`<path d="${v.map((x,i)=>(i?'L':'M')+X(i)+' '+s.y(x)).join(' ')}" fill="none" stroke="${P[0]}" stroke-opacity=".4" stroke-width="1.5"/>`;v.forEach((x,i)=>b+=`<circle cx="${X(i)}" cy="${s.y(x)}" r="${Math.max(2.2,Math.min(5.5,step*.32))}" fill="${P[1]}" stroke="var(--surface)" stroke-width="1.5">${title(rows[i])}</circle>`)}
   break;
  }
  case 'bp':{
   const dia=rows.map(r=>r.lo).filter(Number.isFinite);s=scale(v.concat(dia),false,.15);b=axes(s)+`<defs>${grad(g,true,true)}</defs>`;const bw=Math.max(.5,Math.min(14,step*.5));
   rows.forEach((r,i)=>{const y=s.y(r.v);if(Number.isFinite(r.lo)){const top=Math.min(y,s.y(r.lo)),hh=Math.abs(s.y(r.lo)-y);b+=`<rect x="${X(i)-bw/2}" y="${top}" width="${bw}" height="${hh}" rx="${Math.min(bw/2,hh/2)}" fill="url(#${g})">${title(r)}</rect>`;if(bw>8&&hh>bw)b+=`<circle cx="${X(i)}" cy="${top+bw/2}" r="${Math.max(.5,bw/2-3)}" fill="#fff" opacity=".85"/><circle cx="${X(i)}" cy="${top+hh-bw/2}" r="${Math.max(.5,bw/2-3)}" fill="#fff" opacity=".85"/>`}else b+=`<circle cx="${X(i)}" cy="${y}" r="3.5" fill="${P[0]}">${title(r)}</circle>`});break;
  }
  case 'sleep':{
   if(n===1){const phases=oaHypnogram(last,w,h,false);if(phases)return wrap(phases)}
   const phaseHours=r=>{const out=[0,0,0,0,0];oaStages(r).forEach(st=>{const l=oaPhase(st.kind);out[l<0?4:l]+=(st.end-st.start)/3600000});return out};
   const durations=rows.map(phaseHours),totals=durations.map(a=>a.reduce((s,x)=>s+x,0));
   s=scale(v.concat(totals,GOAL.sleep>0?[GOAL.sleep]:[]),true);b=axes(s);const bw=Math.max(.5,step*.6);
   rows.forEach((r,i)=>{if(!oaStages(r).length){const y=s.y(r.v);b+=`<rect x="${X(i)-bw/2}" y="${y}" width="${bw}" height="${Math.max(0,base-y)}" rx="${Math.min(4,bw/2)}" fill="${P[0]}">${title(r)}</rect>`;return}
    let acc=0;[3,2,1,0,4].forEach(l=>{const amount=durations[i][l];if(amount<=0)return;const y0=s.y(acc),y1=s.y(acc+amount);b+=`<rect x="${X(i)-bw/2}" y="${y1}" width="${bw}" height="${Math.max(0,y0-y1-.6)}" rx="${Math.min(3,bw/3)}" fill="${l===4?'var(--faint)':ORIGINAL_AUTHOR_PHASES[l][1]}"/>`;acc+=amount});
   });
   if(GOAL.sleep>0){const gy=s.y(GOAL.sleep);b+=`<line x1="${L}" x2="${w-R}" y1="${gy}" y2="${gy}" stroke="var(--text)" stroke-opacity=".5" stroke-dasharray="5 4"/><text x="${w-R}" y="${gy-4}" font-size="10" fill="var(--muted)" text-anchor="end">цель ${fmt(GOAL.sleep,1)} ч</text>`}break;
  }
  case 'weight':{
   s=scale(v,false,.4);b=axes(s);const pts=v.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts),windowSize=Math.max(2,Math.round(all.length/6)),prefix=[0],indices=new Map();
   all.forEach((r,i)=>{prefix.push(prefix.at(-1)+r.v);indices.set(r,i)});
   const ma=rows.map(r=>{const i=indices.get(r),a=Math.max(0,i-windowSize);return(prefix[i+1]-prefix[a])/(i+1-a)});
   b+=`<defs>${grad(g,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${P[0]}" stop-opacity=".38"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="url(#${g}a)"/><path d="${smooth(ma.map((x,i)=>[X(i),s.y(x)]))}" fill="none" stroke="var(--text)" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="5 4"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="${P[1]}" stroke="var(--surface)" stroke-width="2"/>`;break;
  }
  default:{
   // Original drawChart fallback: bar / line, NOT the later MD reinterpretation.
   const bar=m.chart==='bar'||m.id==='nutrition';s=scale(v,bar,.25);b=axes(s);
   const c=`var(${CATS[m.cat].c})`;
   if(bar){const bw=Math.max(.5,step*.62);v.forEach((x,i)=>{const y=s.y(x),hh=Math.max(0,base-y);b+=`<rect x="${X(i)-bw/2}" y="${y}" width="${bw}" height="${hh}" rx="${Math.min(4,bw/2,hh/2)}" fill="${c}" opacity="${i===n-1?1:.75}">${title(rows[i])}</rect>`})}
   else {const pts=v.map((x,i)=>[X(i),s.y(x)]),d=pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');
    b+=`<defs><linearGradient id="${g}" x1="0" x2="0" y1="0" y2="1"><stop stop-color="${c}" stop-opacity=".38"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d}L${pts.at(-1)[0]} ${base}L${pts[0][0]} ${base}Z" fill="url(#${g})"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="var(--surface)" stroke="${c}" stroke-width="2.4"/>`;
   }break;
  }
 }
 return wrap(b);
}
