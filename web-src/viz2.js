/* ===== Уникальные графики для всех оставшихся показателей ===== */
(function(){
  // Хелперы для мини-визуализаций
  const miniBar=(v,w,h,P,n=7)=>{const mx=Math.max(...v)*1.1,bw=w/n;
    return `<defs><linearGradient id="g${n}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`+
    v.map((x,i)=>{const hgt=Math.max(3,x/mx*(h-8));return `<rect x="${i*bw+1}" y="${h-4-hgt}" width="${bw-2}" height="${hgt}" rx="${(bw-2)/2.4}" fill="url(#g${n})" opacity="${i===v.length-1?1:.55}"/>`}).join('')};
  const miniLine=(v,w,h,P)=>{const mn=Math.min(...v),mx=Math.max(...v);
    const pts=v.map((x,i)=>[6+i*(w-12)/(v.length-1),h-8-(h-16)*((x-mn)/(mx-mn||1))]);
    const d=pts.map((p,i)=>i?'L'+p[0].toFixed(1)+' '+p[1].toFixed(1):'M'+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    return `<defs><linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`+
    `<path d="${d}" fill="none" stroke="url(#gl)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`+
    `<circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="3.5" fill="${P[1]}"/>`};
  const miniGauge=(val,mn,mx,w,h,P,label)=>{const p=Math.max(0,Math.min(1,(val-mn)/(mx-mn))),r=Math.min(w/2,h/2)-5;
    const cx=w/2,cy=h/2,cir=Math.PI*r;
    return `<defs><linearGradient id="gg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`+
    `<path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="var(--surface3)" stroke-width="6" stroke-linecap="round"/>`+
    `<path d="M${cx-r} ${cy} A${r} ${r} 0 0 1 ${cx+r} ${cy}" fill="none" stroke="url(#gg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${cir}" stroke-dashoffset="${cir*(1-p)}"/>`+
    `<text x="${cx}" y="${cy-2}" text-anchor="middle" font-size="${Math.min(w,h)*.28}" font-weight="800" fill="var(--text)">${val}</text>`+
    (label?`<text x="${cx}" y="${cy+r*.6}" text-anchor="middle" font-size="8" fill="var(--muted)">${label}</text>`:'')};
  const miniDots=(v,w,h,P)=>{const mn=Math.min(...v),mx=Math.max(...v);
    return v.map((x,i)=>{const X=6+i*(w-12)/Math.max(v.length-1,1),Y=h-6-(h-14)*((x-mn)/((mx-mn)||1));const col=P[i%2];
    return `<circle cx="${X}" cy="${Y}" r="3" fill="${col}" opacity=".85"/>`}).join('')};
  const miniWave=(w,h,P)=>{let d='M0 '+(h/2);const N=8;
    for(let i=0;i<N;i++){const cx=(i+.5)*w/N,r=h*.32;d+=` Q${cx-r/2} ${h/2-r} ${cx} ${h/2} Q${cx+r/2} ${h/2+r} ${cx+r} ${h/2}`}
    return `<path d="${d}" fill="none" stroke="url(#gw)" stroke-width="2.4" stroke-linecap="round"/>`+
    `<defs><linearGradient id="gw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`};
  const miniStacked=(v,w,h,P)=>{const tot=v.reduce((a,b)=>a+b,0),y=h-4;
    let X=0;return v.map((x,i)=>{const ww=x/tot*(w-4);const r=`<rect x="${X+2}" y="${y-h+4}" width="${ww}" height="${h-8}" rx="3" fill="${P[i%P.length]}"/>`;X+=ww;return r}).join('')};
  const miniThermo=(val,mn,mx,w,h,P)=>{const p=(val-mn)/(mx-mn),gh=(h-8)*p;
    return `<rect x="${w/2-8}" y="4" width="16" height="${h-8}" rx="8" fill="var(--surface3)"/>`+
    `<rect x="${w/2-8}" y="${h-4-gh}" width="16" height="${gh}" rx="8" fill="url(#gt)" fill-opacity=".9"/>`+
    `<defs><linearGradient id="gt" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`};
  const miniRadar=(w,h,P)=>{const cx=w/2,cy=h/2,r=Math.min(w,h)/2-6,N=5;
    const pts=Array.from({length:N},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/N,rr=r*(.5+(i%2)*.4);
      return `${cx+rr*Math.cos(a)} ${cy+rr*Math.sin(a)}`}).join(' ');
    return `<polygon points="${pts}" fill="none" stroke="${P[0]}" stroke-width="1.5" opacity=".8"/>`+
    `<polygon points="${pts}" fill="${P[1]}" fill-opacity=".18"/>`};
  const miniSun=(w,h,P,val)=>{const cx=w/2,cy=h/2,r=Math.min(w,h)/2-5;
    return `<circle cx="${cx}" cy="${cy}" r="${r*.6}" fill="url(#gs)" fill-opacity=".5"/>`+
    `<circle cx="${cx}" cy="${cy}" r="${r*.35}" fill="url(#gs)"/>`+
    `<defs><radialGradient id="gs"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></radialGradient></defs>`};
  const miniRing=(v,w,h,P)=>{const tot=v.reduce((a,b)=>a+b,0),r=Math.min(w,h)/2-4,cx=w/2,cy=h/2,C=2*Math.PI*r;
    let a=-Math.PI/2;return v.map((x,i)=>{const len=x/tot*C;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${P[i%P.length]}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-a/(2*Math.PI)*C}"/>`}).join('')};
  const miniCapsule=(v,w,h,P)=>{const mx=Math.max(...v),bw=w/v.length;
    return v.map((x,i)=>{const hh=Math.max(6,x/mx*(h-10));return `<rect x="${i*bw+1}" y="${h-6-hh}" width="${bw-2}" height="${hh}" rx="${Math.min((bw-2)/2,4)}" fill="${P[i%2]}" opacity="${i===v.length-1?1:.55}"/>`}).join('')};
  const miniArrow=(val,mn,mx,w,h,P)=>{const p=(val-mn)/(mx-mn),X=4+p*(w-8);
    return `<path d="M${X-8} ${h/2-5} L${X} ${h/2-8} L${X+8} ${h/2-5} L${X} ${h/2+8} L${X-8} ${h/2+5} Z" fill="url(#ga)"/>`+
    `<defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`};
  const miniGrid=(w,h,P)=>{const g=6;let r='';for(let i=0;i<g;i++)for(let j=0;j<g;j++){
    const on=(i+j)%2===0;r+=`<rect x="${j*w/g}" y="${i*h/g}" width="${w/g}" height="${h/g}" fill="${P[0]}" opacity="${on?.8:.2}"/>`}
    return r};
  const miniHeat=(w,h,P)=>{return Array.from({length:20},(_,i)=>{const r=rng('heat'+i)();return `<rect x="${(i%5)*w/5}" y="${Math.floor(i/5)*h/4}" width="${w/5}" height="${h/4}" rx="2" fill="${P[0]}" opacity="${.15+r*.75}"/>`}).join('')};
  const miniZig=(w,h,P)=>{let d='M2 '+(h*.5);for(let x=0;x<w;x+=8){d+=` L${x} ${h*.5} L${x+2} ${h*.25} L${x+4} ${h*.75} L${x+6} ${h*.5}`}
    return `<path d="${d}" fill="none" stroke="url(#gz)" stroke-width="2" stroke-linecap="round"/>`+
    `<defs><linearGradient id="gz" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${P[0]}"/><stop offset="1" stop-color="${P[1]}"/></linearGradient></defs>`};

  // Регистрация мини-визуализаций
  const vizExtra={
    totalCalories:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    floors:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    elevation:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    speed:{f:(m,w,h,v,P)=>miniLine(v.slice(0,7),w,h,P)},
    resp:{f:(m,w,h,v,P)=>miniWave(w,h,P)},
    height:{f:(m,w,h,v,P)=>`<line x1="6" y1="${h*.3}" x2="${w-6}" y2="${h*.3}" stroke="${P[0]}" stroke-width="3" stroke-linecap="round"/>`},
    bodyFat:{f:(m,w,h,v,P)=>miniStacked(v.slice(0,5),w,h,P)},
    leanMass:{f:(m,w,h,v,P)=>miniCapsule(v.slice(0,6),w,h,P)},
    bodyWater:{f:(m,w,h,v,P)=>miniLine(v.slice(0,7),w,h,P)},
    boneMass:{f:(m,w,h,v,P)=>miniDots(v.slice(0,7),w,h,P)},
    nutrition:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    temp:{f:(m,w,h,v,P)=>miniThermo(cur(m),35.5,38,w,h,P)},
    skinTemperature:{f:(m,w,h,v,P)=>miniLine(v.slice(0,7),w,h,P)},
    glucose:{f:(m,w,h,v,P)=>miniGauge(cur(m),3,10,w,h,P)},
    mindfulness:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    vo2:{f:(m,w,h,v,P)=>miniGauge(cur(m),20,50,w,h,P)},
    bmr:{f:(m,w,h,v,P)=>miniBar(v.slice(0,7),w,h,P)},
    power:{f:(m,w,h,v,P)=>miniArrow(cur(m),0,300,w,h,P)},
    cadence:{f:(m,w,h,v,P)=>miniZig(w,h,P)},
    cyclingCadence:{f:(m,w,h,v,P)=>miniZig(w,h,P)},
  };
  window._vizExtra=vizExtra;
})();
