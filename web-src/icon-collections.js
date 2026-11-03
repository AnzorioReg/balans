/* New object-based vector sets; emoji use the device font. */
(function(){
const sets=[['objects','Предметы'],['anatomy','Анатомия'],['instruments','Приборы'],['notation','Обозначения'],['signage','Инфографика'],['emoji','Эмодзи']];
for(const item of sets)if(!ICON_STYLES.some(x=>x[0]===item[0]))ICON_STYLES.push(item);
const units={shoe:'шаг',flame:'ккал',clock:'мин',dumbbell:'мин',heart:'bpm',water:'мл',route:'км',stairs:'эт',mountain:'м',speed:'км/ч',moon:'ч',resting:'bpm',variability:'мс',pressure:'мм',oxygen:'O₂',scale:'кг',ruler:'см',fat:'%',muscle:'кг',hydration:'кг',bone:'кг',meal:'ккал',thermometer:'°C',skin:'°C',glucose:'Glu',lotus:'мин',lungs:'/мин',capacity:'VO₂',metabolism:'ккал',bolt:'Вт',cadence:'/мин',cycle:'об/м'};
const emojis={shoe:'👟',flame:'🔥',clock:'⏱️',dumbbell:'🏋️',heart:'🫀',water:'💧',route:'🗺️',stairs:'🪜',mountain:'🏔️',speed:'🏃',moon:'🛏️',resting:'❤️',variability:'💓',pressure:'🩺',oxygen:'🫧',scale:'⚖️',ruler:'📏',fat:'🧈',muscle:'💪',hydration:'🚰',bone:'🦴',meal:'🍽️',thermometer:'🌡️',skin:'🤚',glucose:'🩸',lotus:'🧘',lungs:'🫁',capacity:'🚴',metabolism:'⚙️',bolt:'⚡',cadence:'👣',cycle:'🚲'};
const outline=d=>'<g fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+d+'</g>';
const label=(name,y=14,size=6)=>'<text x="12" y="'+y+'" text-anchor="middle" font-size="'+size+'" font-family="sans-serif" font-weight="700" fill="currentColor">'+(units[name]||'')+'</text>';
const objectBody=name=>{
 if(['shoe','speed','cadence'].includes(name))return outline('<path d="M3 9 7 5 10 10 15 13 21 15V20H3Z"/><path d="M3 17H21M8 9l-2 3m5-1-2 3m5-1-2 3"/>');
 if(['water','hydration'].includes(name))return '<path d="M9 2H15V6L18 10V21H6V10L9 6Z" fill="#6bcddd"/>'+outline('<path d="M9 2H15V6L18 10V21H6V10L9 6M6 12H18M9 6H15"/>');
 if(name==='moon')return outline('<path d="M2 6V21M22 11V21M2 17H22V11H3M5 11V8H10V11M11 11V6H20V11"/>');
 if(['meal','metabolism','flame'].includes(name))return outline('<circle cx="13" cy="13" r="8"/><circle cx="13" cy="13" r="5"/><path d="M2 3V10M4 3V10M2 7H4M3 10V21M23 3V21"/>');
 if(['scale','fat','muscle','bone'].includes(name))return '<rect x="3" y="3" width="18" height="18" rx="4" fill="#b4c2ce"/>'+outline('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7H17V12H7ZM7 17H9M15 17H17"/>')+label(name,11,4);
 if(name==='cycle')return outline('<circle cx="5" cy="16" r="4"/><circle cx="19" cy="16" r="4"/><path d="M5 16 10 7 14 16H5L8 10H17L19 16M9 7H12M16 5H19L17 10"/>');
 if(['clock','lotus','dumbbell'].includes(name))return outline('<circle cx="12" cy="14" r="8"/><path d="M12 9V14L16 16M9 2H15M12 2V6M19 6 21 8"/>');
 if(['route','mountain','stairs'].includes(name))return outline('<path d="M2 5 8 2 16 5 22 2V19L16 22 8 19 2 22ZM8 2V19M16 5V22M5 10 11 14 19 8"/>');
 return outline('<path d="M8 1H16L17 6H7ZM7 18H17L16 23H8Z"/><rect x="5" y="6" width="14" height="12" rx="3"/>')+label(name,14,5);
};
const anatomyBody=name=>{
 if(['heart','resting','variability','pressure','oxygen'].includes(name))return '<path d="M11 8V3H14V7L17 5 19 8 16 10C23 15 17 22 11 22 3 20 2 13 7 9Z" fill="#d65f76"/>'+outline('<path d="M11 8V3H14V7L17 5 19 8 16 10C23 15 17 22 11 22 3 20 2 13 7 9ZM10 10 13 15 12 20M13 15 17 16"/>');
 if(['lungs','capacity'].includes(name))return '<path d="M10 7C5 5 1 14 3 20 6 23 10 19 10 15ZM14 7C19 5 23 14 21 20 18 23 14 19 14 15Z" fill="#c887a1"/>'+outline('<path d="M12 2V11L7 15M12 11 17 15M10 7C5 5 1 14 3 20 6 23 10 19 10 15ZM14 7C19 5 23 14 21 20 18 23 14 19 14 15Z"/>');
 if(name==='bone')return '<path d="M4 3C1 1 0 6 4 8L16 20C18 24 23 23 21 20 24 18 22 14 18 16L8 6C10 2 6 0 4 3Z" fill="#e5dbc5"/>'+outline('<path d="M4 3C1 1 0 6 4 8L16 20C18 24 23 23 21 20 24 18 22 14 18 16L8 6C10 2 6 0 4 3Z"/>');
 if(['water','hydration','glucose','skin','thermometer'].includes(name))return '<path d="M12 2C9 7 4 12 4 16A8 8 0 0 0 20 16C20 12 15 7 12 2Z" fill="'+(name==='glucose'?'#c95670':'#79b9d1')+'"/>'+outline('<path d="M8 15C7 18 10 20 13 20"/>');
 return outline('<circle cx="12" cy="4" r="2.5"/><path d="M7 9 4 15M17 9 20 15M7 9Q12 7 17 9L15 16 16 22M9 16 8 22M9 10V15H15V10M12 10V15"/>');
};
const instrumentBody=name=>{
 if(['ruler','route','mountain','stairs'].includes(name))return outline('<path d="M4 2H20V22H4ZM4 5H11M4 9H8M4 13H11M4 17H8M4 21H11"/>')+label(name,15,5);
 if(['thermometer','skin','glucose'].includes(name))return outline('<path d="M9 16V4A3 3 0 0 1 15 4V16A5 5 0 1 1 9 16Z"/><path d="M12 6V18M16 5H19M16 9H19M16 13H19"/><circle cx="12" cy="19" r="1.5"/>');
 if(['heart','resting','variability','pressure','oxygen','lungs','capacity'].includes(name))return outline('<rect x="2" y="3" width="18" height="14" rx="2"/><path d="M6 21H16M11 17V21M20 7C25 7 24 19 20 20"/>')+label(name,12,5);
 return outline('<circle cx="12" cy="12" r="10"/><path d="M12 3V5M5 5 7 7M3 12H5M19 12H21M17 7 19 5M6 18 9 15M18 18 15 15M12 12 16 6"/>')+label(name,19,4);
};
const target=document.querySelector('symbol')?.parentNode;
if(!target)throw new Error('Missing SVG symbol container');
for(const name of Object.keys(HEALTH_GLYPHS))for(const [variant]of sets){
 const symbol=document.createElementNS('http://www.w3.org/2000/svg','symbol');symbol.id=semanticGlyph(name,variant);symbol.setAttribute('viewBox','0 0 24 24');
 symbol.innerHTML=variant==='objects'?objectBody(name):variant==='anatomy'?anatomyBody(name):variant==='instruments'?instrumentBody(name):variant==='notation'?label(name,16,(units[name]||'').length>3?6:9):variant==='emoji'?'<text x="12" y="20" text-anchor="middle" font-size="21" font-family="sans-serif">'+emojis[name]+'</text>':'<g fill="currentColor"><path d="M2 2H22V22H2Z" opacity=".09"/><path d="M2 2H7V4H4V7H2ZM17 2H22V7H20V4H17ZM2 17H4V20H7V22H2ZM20 17H22V22H17V20H20Z"/></g><g transform="translate(4 4) scale(.67)">'+objectBody(name)+'</g>';
 target.appendChild(symbol);
}
const remembered=window.balansPendingIconSet||LS.get('balans2.iconSet','outline');if(ICON_STYLES.some(x=>x[0]===remembered)){state.iconSet=remembered;LS.set('balans2.iconSet',remembered);}delete window.balansPendingIconSet;
const identities=[{"id":"balance","name":"Баланс","colors":["#3ee2c4","#ff6a91","#59a9ff"],"paths":["M54 30 A24 24 0 1 1 30 54","M54 38 A16 16 0 1 1 38 54","M54 46 A8 8 0 1 1 46 54"],"background":"#0b0f15"},{"id":"prism","name":"Спектр","colors":["#60e9ed","#9673ff","#ff66b3","#235fd3"],"paths":["M54 16 L88 36 L54 55 L20 36 Z","M20 36 L54 55 L54 94 L20 73 Z","M54 55 L88 36 L88 73 L54 94 Z","M54 16 L54 55 L88 36 Z"],"background":"#111b36","filled":true},{"id":"aurora","name":"Северное сияние","colors":["#4be9c5","#738bff","#ff74b5"],"paths":["M15 78 C24 18 42 16 54 39 C39 37 32 65 28 85 Z","M35 85 C45 19 65 14 78 34 C61 30 57 62 51 91 Z","M59 87 C69 45 83 36 95 48 C83 53 82 71 75 91 Z"],"background":"#131b2c","filled":true},{"id":"compass","name":"Четыре стихии","colors":["#42dccc","#ff7aa9","#ffcc65","#719fff","#f5f7ff"],"paths":["M54 15 Q76 21 83 40 L54 54 Z","M93 54 Q87 76 68 83 L54 54 Z","M54 93 Q32 87 25 68 L54 54 Z","M15 54 Q21 32 40 25 L54 54 Z","M54 41 L67 54 L54 67 L41 54 Z"],"background":"#142234","filled":true},{"id":"horizon","name":"Новый день","colors":["#ffcc69","#ff8072","#55d9cf","#7498ff"],"paths":["M26 57 A28 28 0 0 1 82 57 Z","M16 65 Q40 49 62 63 T96 60 L96 73 Q73 85 49 70 T16 76 Z","M12 78 Q32 67 56 80 T96 74 L96 87 Q73 96 50 86 T12 91 Z","M44 22 L49 16 L54 22 L59 16 L64 22 L59 28 L49 28 Z"],"background":"#16233b","filled":true}];
APP_IDENTITIES.splice(0,APP_IDENTITIES.length,...identities);
identitySVG=function(item){return '<svg viewBox="0 0 108 108" role="img" aria-label="'+esc(item.name)+'"><rect width="108" height="108" rx="26" fill="'+item.background+'"/>'+item.paths.map((p,i)=>'<path d="'+p+'" fill="'+(item.filled?item.colors[i%item.colors.length]:'none')+'" stroke="'+(item.filled?'none':item.colors[i%item.colors.length])+'" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>').join('')+'</svg>';};
if(!LS.get('balans2.identityCatalogV2',false)||!APP_IDENTITIES.some(x=>x.id===state.appIcon)){state.appIcon='balance';LS.set('balans2.appIcon','balance');LS.set('balans2.identityCatalogV2',true);}
const previousAppearanceEvent=window.onAppearanceEvent;
window.onAppearanceEvent=function(ev){previousAppearanceEvent(ev);if(ev.id==='balance'&&!LS.get('balans2.identityCatalogV2',false))LS.set('balans2.identityCatalogV2',true);};
visualPrefs();
})();
