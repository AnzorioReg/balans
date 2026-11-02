/* BALANS_CLEAN_V16_STAGE1 */
try{(function(){
  const ensureLayout=()=>{if(!document.body.dataset.layout)document.body.dataset.layout='grid3'};
  const improveEmpty=()=>{document.querySelectorAll('.emptybox').forEach(x=>{if(x.dataset.reviewEmpty==='1')return;x.dataset.reviewEmpty='1';const b=x.querySelector('b'),s=x.querySelector('small');if(b&&!b.textContent.trim())b.textContent='Нет данных за этот период';if(s&&!s.textContent.trim())s.textContent='Подключи источник или добавь запись — здесь появится динамика.'})};
  new MutationObserver(()=>{ensureLayout();improveEmpty()}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>{ensureLayout();improveEmpty()});window.addEventListener('load',()=>{ensureLayout();improveEmpty()});
})();}catch(e){console.error('Clean mode disabled',e)}
