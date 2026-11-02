import subprocess
from pathlib import Path

base=subprocess.run(['git','show','13fa3fdcc12678343a897d36bae32d182701875c:scripts/menu-fix.py'],check=True,capture_output=True,text=True).stdout
exec(compile(base,'menu-fix-v8.py','exec'),{})
heart=r'''
/* PARALLEL_HEART_V9 */
(function(){
 const previous=activityGlyph;
 let serial=0;
 const d='M140 246 C111 222 25 164 25 96 C25 35 96 19 140 68 C184 19 255 35 255 96 C255 164 169 222 140 246 Z';
 activityGlyph=function(style,small=false,a=ACTIVITY()){
  if(style!=='heart')return previous(style,small,a);
  const id='parallel-heart-'+(++serial),width=18,gap=.65;
  let defs='',body='',badges='';
  const path=(fill,extra='')=>'<path d="'+d+'" fill="'+fill+'" '+extra+'/>';
  const maskStart=name=>'<mask id="'+name+'" maskUnits="userSpaceOnUse" x="0" y="0" width="280" height="280" style="mask-type:luminance">';
  for(let k=0;k<6;k++){
   const inset=Math.floor(k/2)*(width+gap)+(k%2?width:0);
   defs+=maskStart(id+'-inset-'+k)+path('white',inset?'stroke="black" stroke-width="'+(2*inset)+'" stroke-linejoin="round"':'')+'</mask>';
  }
  a.slice(0,3).forEach((x,i)=>{
   const band=id+'-band-'+i;
   defs+=maskStart(band)+'<g mask="url(#'+id+'-inset-'+(2*i)+')">'+path('white')+'</g><g mask="url(#'+id+'-inset-'+(2*i+1)+')">'+path('black')+'</g></mask>';
   const p=Number.isFinite(x.p)?Math.max(0,Math.min(1,x.p)):0;
   body+='<g mask="url(#'+band+')">'+path(x.c,'opacity="'+(small?1:.44)+'"');
   if(!small&&p>0)body+=path('none','stroke="'+x.c+'" style="stroke-width:140!important" stroke-linejoin="round" stroke-linecap="butt" pathLength="100" stroke-dasharray="'+(p*100)+' 100" data-goal="'+x.m.id+'"');
   body+='</g>';
   if(!small)badges+=dashboardGoalBadge(x,140,246-(i*(width+gap)+width/2),false);
  });
  return '<svg class="activity-glyph '+(small?'small':'')+'" data-hero-style="heart" data-heart-version="9" viewBox="0 0 280 280" aria-hidden="true"><defs>'+defs+'</defs>'+body+badges+'</svg>';
 };
})();
'''
for name in ['app/src/main/assets/index.html','web-src/index.html']:
 p=Path(name)
 text=p.read_text(encoding='utf-8')
 marker='ensureDemo();applyTheme();'
 assert text.count(marker)==1
 text=text.replace(marker,heart+chr(10)+marker,1)
 assert 'PARALLEL_HEART_V9' in text
 p.write_text(text,encoding='utf-8')
