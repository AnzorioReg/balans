/* ===== unique visualisations per metric ===== */
let VZ=0;const uid=p=>p+(VZ++);
const PAL={
 steps:['#3fe0c5','#b6f36b'],distance:['#4fb8ff','#3fe0c5'],activeCalories:['#ffd23f','#ff7a3d','#ff3d6e'],
 exercise:['#ff8a4c','#ff4fa3'],heart:['#ff9a8b','#ff3d6e','#c13dff'],restingHeart:['#ff6f91','#ffb3c6'],
 bp:['#ff4d6d','#7b6cff'],spo2:['#4fd1ff','#3d7bff'],hrv:['#b18cff','#ff6fd8'],
 weight:['#ffd166','#ff8a4c'],sleep:['#9d8cff','#4c3df0'],water:['#7fe3ff','#2f8bff'],
};
const PH=[['Бодрствование','#ffb066'],['Быстрый','#4fd1ff'],['Лёгкий','#9d8cff'],['Глубокий','#4c3df0']];
const HYP=[[2,20],[3,45],[2,30],[1,15],[2,35],[3,35],[2,30],[1,25],[0,5],[2,40],[3,20],[2,35],[1,35],[0,8],[2,30],[1,35],[0,7],[2,15]];
function lg(id,stops,vertical=true){return `<linearGradient id="${id}" x1="0" y1="${vertical?1:0}" x2="${vertical?0:1}" y2="0">${stops.map((c,i)=>`<stop offset="${stops.length===1?0:i/(stops.length-1)}" stop-color="${c}"/>`).join('')}</linearGradient>`}
function smooth(pts){return pts.map((p,i)=>{if(!i)return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;const q=pts[i-1],cx=(q[0]+p[0])/2;return `C${cx.toFixed(1)} ${q[1].toFixed(1)} ${cx.toFixed(1)} ${p[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`}).join(' ')}
const sv=(w,h,body,cls='viz')=>`<svg viewBox="0 0 ${w} ${h}" class="${cls}" role="img" aria-hidden="true">${body}</svg>`;
const DL=['Ч','П','С','В','П','В','С'];
const txt=(x,y,t,o='')=>`<text x="${x}" y="${y}" font-size="9" fill="var(--faint)" text-anchor="middle" ${o}>${t}</text>`;

/* ---------- MINI (cards + hero inside detail) ---------- */
function vizMini(m,w,h){
  const v=series(m,'week'),P=PAL[m.id]||[`var(${CATS[m.cat].c})`,`var(${CATS[m.cat].c})`];const g=uid('g');
  if(!v.length)return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" aria-hidden="true"><rect x="4" y="${h/2-1}" width="${w-8}" height="2" rx="1" fill="var(--faint)"/><text x="${w/2}" y="${h/2-8}" font-size="10" fill="var(--faint)" text-anchor="middle">нет записей за неделю</text></svg>`;
  if(window._vizExtra&&window._vizExtra[m.id])return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" aria-hidden="true">${window._vizExtra[m.id].f(m,w,h,v,P)}</svg>`;
  switch(m.id){
  case 'steps':{const goal=GOAL.steps,mx=Math.max(goal*1.12,...v),bw=w/Math.max(v.length,1),base=h-12,y=x=>base-(base-6)*x/mx;
    let b=`<defs>${lg(g,P)}</defs>`;const gy=y(goal);
    b+=`<line x1="0" x2="${w}" y1="${gy}" y2="${gy}" stroke="${P[1]}" stroke-opacity=".7" stroke-dasharray="3 4"/><text x="${w-2}" y="${gy-3}" font-size="9" fill="${P[1]}" text-anchor="end">цель</text>`;
    v.forEach((x,i)=>{const X=i*bw+bw*.2,W=bw*.6,Y=y(x);b+=`<rect x="${X}" y="${Y}" width="${W}" height="${base-Y}" rx="${W/2.4}" fill="url(#${g})" opacity="${i===v.length-1?1:.62}"/>`;if(x>=goal)b+=`<circle cx="${X+W/2}" cy="${Y-5}" r="2.6" fill="${P[1]}"/>`;b+=txt(X+W/2,h-1,DL[i])});
    return sv(w,h,b)}
  case 'distance':{let acc=0;const c=v.map(x=>acc+=x);const mx=acc,pts=c.map((x,i)=>[8+i*(w-16)/(v.length-1),h-8-(h-18)*x/mx]);const li=v.length-1;
    let b=`<defs>${lg(g,P,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}" stop-opacity=".35"/><stop offset="1" stop-color="${P[0]}" stop-opacity="0"/></linearGradient></defs>`;
    const d=smooth(pts);b+=`<path d="${d} L${pts[li][0]} ${h} L${pts[0][0]} ${h}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3" stroke-dasharray="1 6" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="1.2" opacity=".5"/>`;
    pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===li?5:2.6}" fill="${i===li?P[1]:'var(--surface)'}" stroke="url(#${g})" stroke-width="2"/>`);
    b+=`<text x="${pts[li][0]-8}" y="${pts[li][1]+3}" font-size="10" font-weight="700" fill="var(--text)" text-anchor="end">${fmt(acc,1)} км за ${v.length} дн.</text>`;
    return sv(w,h,b)}
  case 'activeCalories':{const goal=GOAL.active,p=Math.min(1,cur(m)/goal),r=Math.min(w/2-8,h-10),cx=w/2,cy=h-4,L=Math.PI*r;
    let b=`<defs>${lg(g,P,false)}</defs><path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="var(--surface3)" stroke-width="10" stroke-linecap="round"/>
    <path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="url(#${g})" stroke-width="10" stroke-linecap="round" stroke-dasharray="${L*p} ${L}"/>`;
    const a=Math.PI*(1-p);b+=`<circle cx="${cx+r*Math.cos(a)}" cy="${cy-r*Math.sin(a)}" r="6" fill="var(--surface)" stroke="${P[2]}" stroke-width="3"/><text x="${cx}" y="${cy-6}" font-size="15" font-weight="800" fill="var(--text)" text-anchor="middle">${Math.round(p*100)}%</text><text x="${cx}" y="${cy-r*.55}" font-size="9" fill="var(--muted)" text-anchor="middle">цель ${goal}</text>`;
    return sv(w,h,b)}
  case 'exercise':{const mx=Math.max(...v),bw=w/Math.max(v.length,1);let b=`<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient></defs>`;
    v.forEach((x,i)=>{const r=Math.max(2.5,(Math.min(bw,h-14)/2-1)*Math.sqrt(x/mx));const cx=i*bw+bw/2,cy=(h-12)/2;b+=`<circle cx="${cx}" cy="${cy}" r="${Math.min(bw/2-1,h/2-6)}" fill="var(--surface3)" opacity=".5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g})" opacity="${i===v.length-1?1:.75}"/>`+txt(cx,h-1,DL[i])});
    return sv(w,h,b)}
  case 'heart':{const y0=h*.62,bw=46;let d=`M0 ${y0}`;for(let x=0;x<w;x+=bw){d+=` L${x+8} ${y0} Q${x+11} ${y0-5} ${x+14} ${y0} L${x+18} ${y0} L${x+20} ${y0+5} L${x+23} ${h*.08} L${x+26} ${h*.92} L${x+29} ${y0} L${x+33} ${y0} Q${x+38} ${y0-9} ${x+42} ${y0} L${x+bw} ${y0}`}
    let b=`<defs>${lg(g,P,false)}<filter id="${g}f" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`;
    b+=`<path d="${d}" fill="none" stroke="url(#${g})" stroke-width="5" opacity=".45" filter="url(#${g}f)"/><path class="ecg" d="${d}" fill="none" stroke="url(#${g})" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    return sv(w,h,b)}
  case 'restingHeart':{const lo=58,hi=64,mn=Math.min(lo-2,...v),mx=Math.max(hi+2,...v),y=x=>6+(h-18)*(1-(x-mn)/(mx-mn)),bw=w/Math.max(v.length,1);
    let b=`<rect x="0" y="${y(hi)}" width="${w}" height="${y(lo)-y(hi)}" rx="6" fill="${P[0]}" opacity=".16"/><text x="${w-3}" y="${y(hi)-3}" font-size="9" fill="${P[0]}" text-anchor="end">обычно 58–64</text>`;
    const pts=v.map((x,i)=>[i*bw+bw/2,y(x)]);b+=`<path d="${pts.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ')}" fill="none" stroke="${P[0]}" stroke-opacity=".35" stroke-width="1.5"/>`;
    pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===v.length-1?5.5:3.8}" fill="${i===v.length-1?P[0]:P[1]}" stroke="var(--surface)" stroke-width="1.5"/>`+txt(p[0],h-1,DL[i]));
    return sv(w,h,b)}
  case 'bp':{const rs=recs(m);const sys=v,dia=rs.length>=3?rs.map(r=>r.lo??r.v*.65):v.map(x=>x*.65),mn=Math.min(...dia)-4,mx=Math.max(...sys)+4,y=x=>4+(h-16)*(1-(x-mn)/((mx-mn)||1)),bw=w/Math.max(sys.length,1);
    let b=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`;
    sys.forEach((s,i)=>{const cx=i*bw+bw/2,W=Math.min(12,bw*.45),yT=Math.min(y(s),y(dia[i])),yH=Math.max(Math.abs(y(dia[i])-y(s)),3),r2=Math.min(W/2,yH/2)-1;b+=`<rect x="${cx-W/2}" y="${yT}" width="${W}" height="${yH}" rx="${Math.min(W/2,yH/2)}" fill="url(#${g})" opacity="${i===sys.length-1?1:.7}"/><circle cx="${cx}" cy="${yT+r2}" r="${Math.max(r2,1)}" fill="#fff" opacity=".85"/><circle cx="${cx}" cy="${yT+yH-r2}" r="${Math.max(r2,1)}" fill="#fff" opacity=".85"/>`+txt(cx,h-1,DL[i])});
    return sv(w,h,b)}
  case 'spo2':{const val=cur(m),N=36,r=Math.min(w,h)/2-4,cx=w/2,cy=h/2;let b=`<defs>${lg(g,P,false)}</defs>`;
    const on=Math.round(N*(val-80)/20);for(let i=0;i<N;i++){const a=-Math.PI/2+i/N*2*Math.PI,r1=r-7,x1=cx+r1*Math.cos(a),y1=cy+r1*Math.sin(a),x2=cx+r*Math.cos(a),y2=cy+r*Math.sin(a);b+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${i<on?(i<on/2?P[0]:P[1]):'var(--surface3)'}" stroke-width="3" stroke-linecap="round"/>`}
    b+=`<text x="${cx}" y="${cy+5}" font-size="${r*.5}" font-weight="800" fill="var(--text)" text-anchor="middle">${Math.round(val)}%</text>`;
    return sv(w,h,b)}
  case 'hrv':{const N=Math.floor(w/6),r=rng('hrvbar'),cy=h/2;let b=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`;
    for(let i=0;i<N;i++){const t=i/N,a=(Math.sin(t*9)*.35+.55)*(.55+r()*.45)*(h/2-3);b+=`<rect x="${i*6+1}" y="${cy-a}" width="3" height="${2*a}" rx="1.5" fill="url(#${g})" opacity="${.45+.55*t}"/>`}
    return sv(w,h,b)}
  case 'sleep':return (m.has&&demoOn())?hypnogram(w,h,true):genericMini(m,v,w,h);
  case 'weight':{const mn=Math.min(...v)-.3,mx=Math.max(...v)+.3,pts=v.map((x,i)=>[6+i*(w-12)/Math.max(v.length-1,1),6+(h-18)*(1-(x-mn)/(mx-mn))]);const d=smooth(pts);
    let b=`<defs>${lg(g,P,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}" stop-opacity=".4"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs>`;
    b+=`<path d="${d} L${pts.at(-1)[0]} ${h-10} L${pts[0][0]} ${h-10}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3" stroke-linecap="round"/>`;
    const iMin=v.indexOf(Math.min(...v)),iMax=v.indexOf(Math.max(...v));
    [[iMin,'мин'],[iMax,'макс']].forEach(([i,l])=>b+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="3.5" fill="var(--surface)" stroke="${P[1]}" stroke-width="2"/><text x="${pts[i][0]}" y="${pts[i][1]+(l==='мин'?14:-7)}" font-size="9" fill="var(--muted)" text-anchor="middle">${fmt(v[i],1)}</text>`);
    b+=`<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="${P[1]}"/>`;pts.forEach((p,i)=>b+=txt(p[0],h-1,DL[i]));
    return sv(w,h,b)}
  case 'water':{const p=Math.min(1,cur(m)/GOAL.water),gw=Math.min(54,h*.8),gh=h-6,gx=6,gy=3,fy=gy+gh*(1-p);
    let b=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient><clipPath id="${g}c"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12"/></clipPath></defs>`;
    b+=`<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="var(--surface3)" opacity=".6"/><g clip-path="url(#${g}c)"><path class="wave" d="M${gx-gw} ${fy} q${gw/4} -6 ${gw/2} 0 t${gw/2} 0 t${gw/2} 0 t${gw/2} 0 t${gw/2} 0 V${gy+gh} H${gx-gw}Z" fill="url(#${g})"/></g><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="12" fill="none" stroke="${P[0]}" stroke-opacity=".6" stroke-width="1.5"/>`;
    b+=`<text x="${gx+gw/2}" y="${gy+gh/2+5}" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">${Math.round(p*100)}%</text>`;
    const cups=8,done=Math.round(cur(m)/250),cx0=gx+gw+16,cw=Math.min(22,(w-cx0)/cups-6);
    for(let i=0;i<cups;i++){const x=cx0+i*(cw+6),y=h/2-cw*.6,ch=cw*1.25;b+=`<path d="M${x} ${y} L${x+cw} ${y} L${x+cw*.85} ${y+ch} L${x+cw*.15} ${y+ch}Z" fill="${i<done?`url(#${g})`:'none'}" stroke="${i<done?P[1]:'var(--line)'}" stroke-width="1.5" stroke-linejoin="round"/>`}
    b+=`<text x="${cx0}" y="${h/2+cw*.6+cw*.65+12}" font-size="10" fill="var(--muted)">${done} из ${cups} стаканов</text>`;
    return sv(w,h,b)}
  }
  return genericMini(m,v,w,h);
}
function genericMini(m,v,w,h){
  const c=cv(m),g=uid('g');
  if(!hasHistory(m)){const r=recs(m),mn=Math.min(...r.map(x=>x.v))*.95,mx=Math.max(...r.map(x=>x.v))*1.05||1;return sv(w,h,r.map((x,i)=>`<circle cx="${12+i*24}" cy="${h/2-(h/2-8)*((x.v-mn)/((mx-mn)||1)-.5)}" r="6" fill="${c}"/>`).join(''))}
  if(m.chart==='bar'){const mx=Math.max(...v)||1,bw=w/Math.max(v.length,1);return sv(w,h,`<defs><linearGradient id="${g}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}"/></linearGradient></defs>`+v.map((x,i)=>{const H=(h-12)*x/mx;return `<rect x="${i*bw+bw*.2}" y="${h-12-H}" width="${bw*.6}" height="${H}" rx="4" fill="url(#${g})"/>`+txt(i*bw+bw/2,h-1,DL[i])}).join(''))}
  const mn=Math.min(...v),mx=Math.max(...v),pts=v.map((x,i)=>[4+i*(w-8)/Math.max(v.length-1,1),4+(h-10)*(1-(x-mn)/((mx-mn)||1))]),d=smooth(pts);
  return sv(w,h,`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity=".4"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${pts.at(-1)[0]} ${h} L4 ${h}Z" fill="url(#${g})"/><path d="${d}" fill="none" stroke="${c}" stroke-width="2.4"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="${c}"/>`);
}
function hypnogram(w,h,mini){
  const tot=HYP.reduce((a,b)=>a+b[1],0),top=mini?2:18,bot=mini?12:22,left=mini?0:64,rowH=(h-top-bot)/4;let b='';
  if(!mini)PH.forEach(([n,c],i)=>b+=`<text x="0" y="${top+rowH*i+rowH/2+4}" font-size="10" fill="${c}">${n==='Бодрствование'?'Пробужд.':n}</text><line x1="${left}" x2="${w}" y1="${top+rowH*i+rowH/2}" y2="${top+rowH*i+rowH/2}" stroke="var(--line)" stroke-dasharray="2 4"/>`);
  let t=0,prev=null;const X=m=>left+(w-left)*m/tot;
  HYP.forEach(([l,d])=>{const x=X(t),x2=X(t+d),yc=top+rowH*l+rowH/2,hh=rowH*.62;
    if(prev!=null){const yp=top+rowH*prev+rowH/2;b+=`<line x1="${x}" x2="${x}" y1="${Math.min(yp,yc)}" y2="${Math.max(yp,yc)}" stroke="var(--faint)" stroke-opacity=".5" stroke-width="1.2"/>`}
    b+=`<rect x="${x}" y="${yc-hh/2}" width="${Math.max(2,x2-x-.6)}" height="${hh}" rx="${Math.min(hh/2,4)}" fill="${PH[l][1]}"/>`;t+=d;prev=l});
  b+=`<text x="${left}" y="${h-1}" font-size="${mini?9:10}" fill="var(--faint)">23:40</text><text x="${w}" y="${h-1}" font-size="${mini?9:10}" fill="var(--faint)" text-anchor="end">07:25</text>`;
  if(!mini)['01:00','03:00','05:00'].forEach((l,i)=>b+=`<text x="${X(80+i*120)}" y="${h-1}" font-size="10" fill="var(--faint)" text-anchor="middle">${l}</text>`);
  return sv(w,h,b);
}
function sleepStats(){const r=[0,0,0,0];HYP.forEach(([l,d])=>r[l]+=d);return r}

/* ---------- BIG (detail, period-aware, x indexed for tap) ---------- */
function vizBig(m,period){
  const v=series(m,period),lb=labels(period),n=v.length,step=(W-PL-PR)/n,X=i=>PL+step*i+step/2,P=PAL[m.id],g=uid('b');
  const sc=(vals,zero,pad=.2)=>{let mn=Math.min(...vals),mx=Math.max(...vals);if(zero)mn=0;else{const p=(mx-mn)*pad||1;mn-=p;mx+=p}return{mn,mx,y:x=>PT+(H-PT-PB)*(1-(x-mn)/((mx-mn)||1))}};
  let s,b='';
  switch(m.id){
  case 'steps':case 'activeCalories':case 'water':{
    const goal=m.id==='steps'?(period==='day'?null:GOAL.steps):m.id==='water'?(period==='day'?null:GOAL.water):(period==='day'?null:GOAL.active);
    s=sc(goal?v.concat(goal*1.1):v,true);b=axes(s,lb,m,n);
    const stops=m.id==='water'?[P[1],P[0]]:P;b+=`<defs>${lg(g,stops)}</defs>`;const bw=Math.max(3,step*.62);
    if(goal){const gy=s.y(goal);b+=`<line x1="${PL}" x2="${W-PR}" y1="${gy}" y2="${gy}" stroke="${P.at(-1)}" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W-PR}" y="${gy-4}" font-size="10" font-weight="700" fill="${P.at(-1)}" text-anchor="end">цель ${fmt(goal)}</text>`}
    v.forEach((x,i)=>{const y=s.y(x),hit=goal&&x>=goal;b+=`<rect x="${X(i)-bw/2}" y="${y}" width="${bw}" height="${Math.max(1,H-PB-y)}" rx="${Math.min(bw/2.2,7)}" fill="url(#${g})" opacity="${hit||i===n-1?1:.55}"/>`;
      if(m.id==='water'&&bw>10)b+=`<circle cx="${X(i)}" cy="${y-7}" r="3" fill="${P[0]}"/>`;
      if(hit&&bw>8&&m.id!=='water')b+=`<circle cx="${X(i)}" cy="${y-6}" r="3" fill="${P.at(-1)}"/>`});
    break}
  case 'distance':{let acc=0;const c=v.map(x=>acc+=x);s=sc(c,true);b=axes(s,lb,m,n);
    const pts=c.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);
    b+=`<defs>${lg(g,P,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}" stop-opacity=".4"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${pts.at(-1)[0]} ${H-PB} L${pts[0][0]} ${H-PB}Z" fill="url(#${g}a)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3"/>`;
    const bw=Math.max(2,step*.3);v.forEach((x,i)=>{b+=`<rect x="${X(i)-bw/2}" y="${H-PB-(H-PB-PT)*x/acc*3}" width="${bw}" height="${(H-PB-PT)*x/acc*3}" rx="${bw/2}" fill="${P[1]}" opacity=".35"/>`});
    if(n<=31)pts.forEach((p,i)=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===n-1?5:2.5}" fill="${i===n-1?P[0]:'var(--surface)'}" stroke="${P[0]}" stroke-width="2"/>`);
    b+=`<text x="${PL+4}" y="${PT+12}" font-size="11" font-weight="700" fill="var(--text)">всего ${fmt(acc,1)} км за период</text>`;break}
  case 'exercise':{s=sc(v.concat(Math.max(...v)*1.3),true);b=axes(s,lb,m,n);const mx=Math.max(...v);
    b+=`<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient></defs>`;
    v.forEach((x,i)=>{const r=Math.max(1.5,Math.min(step*.48,18)*Math.sqrt(x/mx));b+=`<circle cx="${X(i)}" cy="${s.y(x)}" r="${r}" fill="url(#${g})" opacity=".9"/>`;if(n<=7)b+=`<text x="${X(i)}" y="${s.y(x)+4}" font-size="10" font-weight="700" fill="#fff" text-anchor="middle">${Math.round(x)}</text>`});break}
  case 'heart':{s=sc(v,false,.35);b=axes(s,lb,m,n);
    const Z=[[0,90,'#5fd97a'],[90,120,'#ffd23f'],[120,150,'#ff8a4c'],[150,250,'#ff3d6e']];
    Z.forEach(([a,c2,col])=>{const y1=s.y(Math.min(c2,s.mx)),y2=s.y(Math.max(a,s.mn));if(y2>y1)b+=`<rect x="${PL}" y="${y1}" width="${W-PL-PR}" height="${y2-y1}" fill="${col}" opacity=".09"/>`});
    const pts=v.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);
    b+=`<defs><linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="${s.y(s.mn)}" x2="0" y2="${s.y(s.mx)}"><stop offset="0" stop-color="${P[0]}"/><stop offset=".6" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[2]}"/></linearGradient><filter id="${g}f"><feGaussianBlur stdDeviation="3"/></filter></defs><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="6" opacity=".35" filter="url(#${g}f)"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>`;
    const im=v.indexOf(Math.max(...v)),io=v.indexOf(Math.min(...v));[[im,P[2]],[io,P[0]]].forEach(([i,c2])=>b+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="4.5" fill="var(--surface)" stroke="${c2}" stroke-width="2.4"/>`);break}
  case 'restingHeart':case 'hrv':case 'spo2':{const band=m.id==='restingHeart'?[58,64]:m.id==='hrv'?[36,48]:[95,99];s=sc(v.concat(band),false,.3);b=axes(s,lb,m,n);
    b+=`<rect x="${PL}" y="${s.y(band[1])}" width="${W-PL-PR}" height="${s.y(band[0])-s.y(band[1])}" fill="${P[0]}" opacity=".14" rx="6"/><text x="${W-PR-4}" y="${s.y(band[1])-4}" font-size="10" fill="${P[0]}" text-anchor="end">ваш обычный диапазон</text>`;
    b+=`<defs><linearGradient id="${g}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${P[1]}"/><stop offset="1" stop-color="${P[0]}"/></linearGradient></defs>`;
    if(m.id==='hrv'){const base=H-PB;v.forEach((x,i)=>{b+=`<line x1="${X(i)}" x2="${X(i)}" y1="${base}" y2="${s.y(x)}" stroke="${P[0]}" stroke-width="${Math.max(1.5,step*.18)}" stroke-linecap="round" opacity=".7"/><circle cx="${X(i)}" cy="${s.y(x)}" r="${Math.max(2,Math.min(5,step*.3))}" fill="${P[1]}"/>`})}
    else if(m.id==='spo2'){const pts=v.map((x,i)=>[X(i),s.y(x)]),d=smooth(pts);b+=`<path d="${d} L${pts.at(-1)[0]} ${H-PB} L${pts[0][0]} ${H-PB}Z" fill="url(#${g})" opacity=".28"/><path d="${d}" fill="none" stroke="${P[0]}" stroke-width="2.4"/>`;if(n<=31)pts.forEach(p=>b+=`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${P[1]}"/>`)}
    else{b+=`<path d="${v.map((x,i)=>(i?'L':'M')+X(i)+' '+s.y(x)).join(' ')}" fill="none" stroke="${P[0]}" stroke-opacity=".4" stroke-width="1.5"/>`;v.forEach((x,i)=>{const inb=x>=band[0]&&x<=band[1];b+=`<circle cx="${X(i)}" cy="${s.y(x)}" r="${Math.max(2.2,Math.min(5.5,step*.32))}" fill="${inb?P[1]:P[0]}" stroke="var(--surface)" stroke-width="1.5"/>`})}
    break}
  case 'bp':{const dia=v.map(x=>x*.65);s=sc(v.concat(dia,[120,80]),false,.15);b=axes(s,lb,m,n);
    [[120,'120'],[80,'80']].forEach(([y,l])=>b+=`<line x1="${PL}" x2="${W-PR}" y1="${s.y(y)}" y2="${s.y(y)}" stroke="var(--faint)" stroke-dasharray="4 4" stroke-opacity=".7"/>`);
    b+=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`;const bw=Math.max(3,Math.min(14,step*.5));
    v.forEach((x,i)=>b+=`<rect x="${X(i)-bw/2}" y="${s.y(x)}" width="${bw}" height="${s.y(dia[i])-s.y(x)}" rx="${bw/2}" fill="url(#${g})"/>`+(bw>8?`<circle cx="${X(i)}" cy="${s.y(x)+bw/2}" r="${bw/2-3}" fill="#fff" opacity=".85"/><circle cx="${X(i)}" cy="${s.y(dia[i])-bw/2}" r="${bw/2-3}" fill="#fff" opacity=".85"/>`:''));break}
  case 'sleep':{
    if(period==='day')return{svg:hypnogram(W,H,false),v:[],noSel:true};
    s=sc(v,true);b=axes(s,lb,m,n);const f=[.05,.22,.55,.18],bw=Math.max(3,step*.6);
    v.forEach((x,i)=>{let acc=0;[3,2,1,0].forEach(l=>{const y0=s.y(acc),y1=s.y(acc+x*f[l]);b+=`<rect x="${X(i)-bw/2}" y="${y1}" width="${bw}" height="${Math.max(0,y0-y1-1)}" rx="${Math.min(3,bw/3)}" fill="${PH[l][1]}"/>`;acc+=x*f[l]})});
    const gy=s.y(8);b+=`<line x1="${PL}" x2="${W-PR}" y1="${gy}" y2="${gy}" stroke="var(--text)" stroke-opacity=".5" stroke-dasharray="5 4"/><text x="${W-PR}" y="${gy-4}" font-size="10" fill="var(--muted)" text-anchor="end">цель 8 ч</text>`;break}
  case 'weight':{s=sc(v,false,.4);b=axes(s,lb,m,n);const pts=v.map((x,i)=>[X(i),s.y(x)]);
    const k=Math.max(2,Math.round(n/6)),ma=v.map((_,i)=>avg(v.slice(Math.max(0,i-k),i+1)));
    b+=`<defs>${lg(g,P,false)}<linearGradient id="${g}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}" stop-opacity=".38"/><stop offset="1" stop-color="${P[1]}" stop-opacity="0"/></linearGradient></defs>`;
    const d=smooth(pts);b+=`<path d="${d} L${pts.at(-1)[0]} ${H-PB} L${pts[0][0]} ${H-PB}Z" fill="url(#${g}a)"/><path d="${smooth(ma.map((x,i)=>[X(i),s.y(x)]))}" fill="none" stroke="var(--text)" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="5 4"/><path d="${d}" fill="none" stroke="url(#${g})" stroke-width="3"/>`;
    b+=`<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="5" fill="${P[1]}" stroke="var(--surface)" stroke-width="2"/>`;break}
  default:{const r=drawChart(m,period,false);return{svg:r.svg,v:r.v}}
  }
  return{svg:`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="График">${b}</svg>`,v};
}
function bigLegend(m){
  const P=PAL[m.id];const it=(c,t,ex='')=>`<span><i style="background:${c};${ex}"></i>${t}</span>`;
  switch(m.id){
   case 'sleep':return PH.slice().reverse().map(([n,c])=>it(c,n)).join('');
   case 'heart':return it('#5fd97a','покой')+it('#ffd23f','лёгкая')+it('#ff8a4c','кардио')+it('#ff3d6e','пик');
   case 'bp':return it(`linear-gradient(${P[0]},${P[1]})`,'верхнее → нижнее')+'<span>пунктир — 120 и 80</span>';
   case 'weight':return it(P[1],'вес')+'<span>пунктир — средняя линия</span>';
   case 'distance':return it(P[0],'накопленная дистанция')+it(P[1],'за день','opacity:.4');
   case 'restingHeart':case 'hrv':case 'spo2':return it(P[0],'ваш обычный диапазон','opacity:.35')+it(P[1],'измерения');
   case 'exercise':return '<span>Размер круга — длительность тренировки</span>';
   case 'steps':case 'activeCalories':case 'water':return it(`linear-gradient(${P.join(',')})`,'значение')+'<span>яркие — цель выполнена</span>';
  }
  return '';
}
