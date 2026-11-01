/* Semantic 24px health glyphs: the same meaning in four visibly different sets. */
const HEALTH_GLYPHS={
 shoe:{
  outline:'<path d="M3 11 7 6l4 5c2 2 5 2 8 3l2 3v3H3v-4Z"/><path d="M3 17h18M10 10l-2 2m5 0-2 2m5-1-2 2"/>',
  solid:'<path d="m3 11 4-5 4 5c2 2 5 2 8 3l2 3v3H3Z"/>',
  cut:'<path d="M3 17h18M10 10l-2 2m5 0-2 2m5-1-2 2"/>'
 },
 flame:{
  outline:'<path d="M13 2c1 5-4 6-4 10-2-1-2-3-2-4-4 4-5 8-2 11 3 4 10 4 13 0 5-6-1-11-5-17Z"/><path d="M12 13c0 3-4 4-2 7 2 2 5 0 5-2 0-2-1-3-3-5Z"/>',
  solid:'<path d="M13 2c1 5-4 6-4 10-2-1-2-3-2-4-4 4-5 8-2 11 3 4 10 4 13 0 5-6-1-11-5-17Z"/>',
  cut:'<path d="M12 13c0 3-4 4-2 7 2 2 5 0 5-2 0-2-1-3-3-5Z" fill="var(--glyph-cut,var(--surface))" stroke="none"/>'
 },
 clock:{outline:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 2h6M12 2v3m6 0 2 2"/>',solid:'<circle cx="12" cy="13" r="8"/><path d="M9 1h6v3H9Zm9 3 3 3-2 2-3-3Z"/>',cut:'<path d="M12 8v6l3 2"/>'},
 dumbbell:{outline:'<path d="M3 7v10m3-12v14M18 5v14m3-12v10M6 10h12v4H6M1 10v4m22-4v4"/>',solid:'<rect x="3" y="5" width="5" height="14" rx="2"/><rect x="16" y="5" width="5" height="14" rx="2"/><rect x="7" y="10" width="10" height="4"/><path d="M1 8h2v8H1Zm20 0h2v8h-2Z"/>'},
 heart:{outline:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/><path d="M4 12h4l2-4 3 8 2-4h5"/>',solid:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/>',cut:'<path d="M3 12h5l2-4 3 8 2-4h6"/>'},
 water:{outline:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/><path d="M8 15a4 4 0 0 0 4 5"/>',solid:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/>',cut:'<path d="M8 15a4 4 0 0 0 4 5"/>'},
 route:{outline:'<circle cx="5" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M5 8v7a4 4 0 0 0 4 4h7M8 5h7a4 4 0 0 1 0 8H9"/>',solid:'<circle cx="5" cy="5" r="4"/><circle cx="19" cy="19" r="4"/>',extra:'<path d="M5 9v6a4 4 0 0 0 4 4h6M9 5h6a4 4 0 0 1 0 8H9"/>'},
 stairs:{outline:'<path d="M3 21h18M3 18h6v-6h6V6h6M3 9V3h6M3 3l7 7"/>',solid:'<path d="M3 17h6v-6h6V5h6v16H3Z"/>',extra:'<path d="M3 9V3h6M3 3l7 7"/>'},
 mountain:{outline:'<path d="m2 20 7-15 5 8 3-5 5 12ZM6 12l3 2 3-2M17 3v-2m-3 3-2-2m8 2 2-2"/>',solid:'<path d="m2 21 7-16 5 9 3-6 5 13Z"/>',cut:'<path d="m6 12 3 2 3-2"/>'},
 speed:{outline:'<path d="M4 19a10 10 0 1 1 16 0ZM5 12h2m10 0h2M12 5v2m-6-1 2 2m10-2-2 2M12 15l5-6"/><circle cx="12" cy="15" r="2"/>',solid:'<path d="M4 20a10 10 0 1 1 16 0Z"/>',cut:'<path d="M5 12h2m10 0h2M12 5v2m0 8 5-6"/><circle cx="12" cy="15" r="2" fill="var(--glyph-cut,var(--surface))" stroke="none"/>'},
 moon:{outline:'<path d="M19 15A9 9 0 0 1 9 3a9 9 0 1 0 10 12ZM17 2v5m-2-3h4m2 4v4m-2-2h4"/>',solid:'<path d="M19 15A9 9 0 0 1 9 3a9 9 0 1 0 10 12ZM17 1l1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/>'},
 resting:{outline:'<path d="M12 20S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11-9 11Z"/><path d="M13 9a4 4 0 1 0 4 5 4 4 0 0 1-4-5Z"/>',solid:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z"/>',cut:'<path d="M13 8a5 5 0 1 0 5 6 5 5 0 0 1-5-6Z" fill="var(--glyph-cut,var(--surface))" stroke="none"/>'},
 variability:{outline:'<circle cx="12" cy="12" r="10"/><path d="M3 12h4l2-5 4 11 2-6h6"/>',solid:'<circle cx="12" cy="12" r="10"/>',cut:'<path d="M3 12h4l2-5 4 11 2-6h6"/>'},
 pressure:{outline:'<path d="M4 3h9v13H4ZM6 6h5M13 9h3a4 4 0 0 1 4 4v2M5 16v5h7"/><circle cx="19" cy="18" r="4"/><path d="m19 18 2-2"/>',solid:'<rect x="3" y="2" width="11" height="15" rx="3"/><circle cx="19" cy="18" r="4"/>',cut:'<path d="M6 6h5m8 12 2-2"/>',extra:'<path d="M5 17v4h7M14 9h2a4 4 0 0 1 4 4v1"/>'},
 oxygen:{outline:'<path d="M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13Z"/><ellipse cx="10" cy="15" rx="2" ry="3"/><path d="M15 14c2-2 4 1 1 3l-1 1h3"/>',solid:'<path d="M12 2S4 10 4 15a8 8 0 0 0 16 0c0-5-8-13-8-13Z"/>',cut:'<ellipse cx="10" cy="15" rx="2" ry="3"/><path d="M15 14c2-2 4 1 1 3l-1 1h3"/>'},
 scale:{outline:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7q5-4 10 0l-2 5H9ZM12 7v3"/>',solid:'<rect x="2" y="2" width="20" height="20" rx="5"/>',cut:'<path d="M7 7q5-4 10 0l-2 5H9ZM12 7v3"/>'},
 ruler:{outline:'<path d="M7 2h10v20H7ZM7 6h5M7 10h3m-3 4h5m-5 4h3"/>',solid:'<rect x="6" y="1" width="12" height="22" rx="2"/>',cut:'<path d="M6 5h7m-7 4h4m-4 4h7m-7 4h4"/>'},
 fat:{outline:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/><path d="m9 19 6-7"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="18" r="1"/>',solid:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/>',cut:'<path d="m9 19 6-7"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="18" r="1"/>'},
 muscle:{outline:'<path d="m3 15 3-9h6v4H9l-1 5c4-4 10-4 13 0v5c-6 3-13 2-18-1Z"/><path d="M10 6V3h4v7m-5 7q5-3 9 0"/>',solid:'<path d="m3 15 3-9h4V3h5v8c3 0 5 2 6 4v5c-6 3-13 2-18-1Z"/>',cut:'<path d="M9 17q5-3 9 0M10 6v4H9"/>'},
 hydration:{outline:'<circle cx="8" cy="4" r="2"/><path d="M4 20v-8a4 4 0 0 1 8 0v8m-4-5v6M18 7s-4 5-4 8a4 4 0 0 0 8 0c0-3-4-8-4-8Z"/>',solid:'<circle cx="8" cy="4" r="3"/><path d="M3 20v-8a5 5 0 0 1 9-3v12H9v-6H7v6H3ZM18 7s-4 5-4 8a4 4 0 0 0 8 0c0-3-4-8-4-8Z"/>'},
 bone:{outline:'<path d="M7 4a3 3 0 1 0-4 4l4 4 5 5a3 3 0 1 0 4 4 3 3 0 1 0 4-4l-4-4-5-5a3 3 0 1 0-4-4Z"/>',solid:'<path d="M7 4a3 3 0 1 0-4 4l4 4 5 5a3 3 0 1 0 4 4 3 3 0 1 0 4-4l-4-4-5-5a3 3 0 1 0-4-4Z"/>'},
 meal:{outline:'<circle cx="13" cy="12" r="6"/><path d="M2 2v6a2 2 0 0 0 4 0V2M4 2v20M22 2v20m0-20c-4 3-4 10 0 10"/>',solid:'<circle cx="13" cy="12" r="6"/>',extra:'<path d="M2 2v6a2 2 0 0 0 4 0V2M4 2v20M22 2v20m0-20c-4 3-4 10 0 10"/>'},
 thermometer:{outline:'<path d="M9 4a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0ZM12 7v10m5-12h3m-3 4h2"/><circle cx="12" cy="18" r="2"/>',solid:'<path d="M9 4a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0Z"/>',cut:'<path d="M12 7v10"/><circle cx="12" cy="18" r="2"/>',extra:'<path d="M18 5h3m-3 4h2"/>'},
 skin:{outline:'<path d="M4 20c-2-5 0-9 2-8l2 3V4a1.5 1.5 0 0 1 3 0v7-9a1.5 1.5 0 0 1 3 0v9-7a1.5 1.5 0 0 1 3 0v8-5a1.5 1.5 0 0 1 3 0v10l-3 4H7Z"/>',solid:'<path d="M4 20c-2-5 0-9 2-8l2 3V4a1.5 1.5 0 0 1 3 0v7-9a1.5 1.5 0 0 1 3 0v9-7a1.5 1.5 0 0 1 3 0v8-5a1.5 1.5 0 0 1 3 0v10l-3 4H7Z"/>'},
 glucose:{outline:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/><path d="M9 13h6v6H9Zm3 0v6m-3-3h6"/>',solid:'<path d="M12 2S4 11 4 16a8 8 0 0 0 16 0C20 11 12 2 12 2Z"/>',cut:'<path d="M9 13h6v6H9Zm3 0v6m-3-3h6"/>'},
 lotus:{outline:'<path d="M12 17c-7-1-8-6 0-14 8 8 7 13 0 14ZM12 17C5 18 1 13 2 8c7 0 10 3 10 9Zm0 0c7 1 11-4 10-9-7 0-10 3-10 9Zm-7 4h14"/>',solid:'<path d="M12 17c-7-1-8-6 0-14 8 8 7 13 0 14ZM10 19C3 19 0 14 1 9c6 0 10 4 9 10Zm4 0c7 0 10-5 9-10-6 0-10 4-9 10Z"/>'},
 lungs:{outline:'<path d="M12 2v11m0-5-3 4m3-4 3 4M9 5C5 5 1 13 2 18c1 4 7 2 7-1Zm6 0c4 0 8 8 7 13-1 4-7 2-7-1Z"/>',solid:'<path d="M9 5C5 5 1 13 2 18c1 4 7 2 7-1Zm6 0c4 0 8 8 7 13-1 4-7 2-7-1Z"/>',extra:'<path d="M12 2v10m0-4-3 4m3-4 3 4"/>'},
 capacity:{outline:'<path d="M12 2v10m0-5-3 4m3-4 3 4M9 5C5 5 1 13 2 18c1 4 7 2 7-1Zm6 0c4 0 8 8 7 13-1 4-7 2-7-1ZM4 14h3m10 0h3m-15 3h2m10 0h2"/>',solid:'<path d="M9 5C5 5 1 13 2 18c1 4 7 2 7-1Zm6 0c4 0 8 8 7 13-1 4-7 2-7-1Z"/>',cut:'<path d="M4 14h3m10 0h3m-15 3h2m10 0h2"/>',extra:'<path d="M12 2v10m0-5-3 4m3-4 3 4"/>'},
 metabolism:{outline:'<path d="M13 2c1 5-4 6-4 10-2-1-2-3-2-4-4 4-5 8-2 11 3 4 10 4 13 0 5-6-1-11-5-17Z"/><path d="m14 11-5 5h5l-2 5"/>',solid:'<path d="M13 2c1 5-4 6-4 10-2-1-2-3-2-4-4 4-5 8-2 11 3 4 10 4 13 0 5-6-1-11-5-17Z"/>',cut:'<path d="m14 11-5 5h5l-2 5"/>'},
 bolt:{outline:'<path d="M14 2 4 14h7l-1 8 10-13h-7Z"/>',solid:'<path d="M14 2 4 14h7l-1 8 10-13h-7Z"/>'},
 cadence:{outline:'<ellipse cx="8" cy="8" rx="3" ry="5" transform="rotate(20 8 8)"/><ellipse cx="16" cy="15" rx="3" ry="5" transform="rotate(-20 16 15)"/><path d="m5 16 2 3m10-15 2 3"/>',solid:'<ellipse cx="8" cy="7" rx="3.5" ry="5" transform="rotate(20 8 7)"/><ellipse cx="16" cy="16" rx="3.5" ry="5" transform="rotate(-20 16 16)"/><circle cx="5" cy="16" r="2"/><circle cx="19" cy="7" r="2"/>'},
 cycle:{outline:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2m-7 10-5 5h-3m8-10 5-5h3"/>',solid:'<circle cx="12" cy="12" r="7"/>',cut:'<circle cx="12" cy="12" r="3"/>',extra:'<path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2m-7 10-5 5h-3m8-10 5-5h3"/>'}
};
const METRIC_GLYPH_MAP={
 steps:'shoe',distance:'route',activeCalories:'flame',totalCalories:'metabolism',exercise:'dumbbell',
 floors:'stairs',elevation:'mountain',speed:'speed',heart:'heart',restingHeart:'resting',bp:'pressure',spo2:'oxygen',hrv:'variability',
 sleep:'moon',weight:'scale',height:'ruler',bodyFat:'fat',leanMass:'muscle',bodyWater:'hydration',boneMass:'bone',
 water:'water',nutrition:'meal',temp:'thermometer',skinTemperature:'skin',glucose:'glucose',mindfulness:'lotus',
 resp:'lungs',vo2:'capacity',bmr:'metabolism',power:'bolt',cadence:'cadence',cyclingCadence:'cycle'
};
function semanticGlyph(name,variant=state.iconSet){return `health-${variant}-${HEALTH_GLYPHS[name]?name:'heart'}`}
function metricGlyph(m,variant=state.iconSet){return semanticGlyph(METRIC_GLYPH_MAP[m.id]||'heart',variant)}
mic=function(m){return metricGlyph(m)};
function installHealthGlyphs(){
 const target=document.querySelector('symbol')?.parentNode;if(!target)return;
 const ns='http://www.w3.org/2000/svg';
 for(const [name,g]of Object.entries(HEALTH_GLYPHS))for(const variant of ['classic','outline','soft','duo']){
  const symbol=document.createElementNS(ns,'symbol');symbol.id=semanticGlyph(name,variant);symbol.setAttribute('viewBox','0 0 24 24');
  const stroke=(body,width=2)=>`<g fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;
  const filled=`<g stroke="none" fill="currentColor">${g.solid||''}</g>${g.cut?`<g fill="none" stroke="var(--glyph-cut,var(--surface))" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${g.cut}</g>`:''}${g.extra?stroke(g.extra,2.1):''}`;
  symbol.innerHTML=variant==='outline'?stroke(g.outline,1.8):variant==='soft'?`<circle cx="12" cy="12" r="12" fill="currentColor" opacity=".16"/><g transform="translate(3 3) scale(.75)">${filled}</g>`:variant==='duo'?`<g opacity=".25" transform="translate(1.3 1.3)">${filled}</g>${stroke(g.outline,1.65)}`:filled;
  target.appendChild(symbol);
 }
}
installHealthGlyphs();
