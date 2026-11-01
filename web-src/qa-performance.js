const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true}),p=await b.newPage({viewport:{width:390,height:844}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(require('node:url').pathToFileURL(require('node:path').join(__dirname,'index.html')).href);
 const result=await p.evaluate(()=>{
   state.demo=false;stripDemo();state.manual={};state.fold=[];state.layout='grid3';
   state.deviceData=Object.fromEntries(M.map(m=>[m.id,Array.from({length:5000},(_,i)=>({
     id:m.id+':'+i,v:m.base||12,lo:m.id==='bp'?80:undefined,ts:Date.now()-(4999-i)*300000,
     d:'2026-10-30',source:'Health Connect'
   }))]));
   const t=performance.now();renderAll();const first=performance.now()-t;
   const s=performance.now();for(let i=0;i<10;i++)renderGroups();
   return {records:M.length*5000,cards:document.querySelectorAll('#groups .g3 .t').length,firstMs:first,repeatMs:(performance.now()-s)/10};
 });
 assert.equal(result.cards,32);assert.ok(result.firstMs<2000);assert.ok(result.repeatMs<200);
 // Render all major app pages against a dense actual-record fixture.
 for(const key of ['sources','manual','diary','remind','export','report','privacy','help','demo','profile','themes','gbody','gfood','gtrain','gloyal']){
   await p.evaluate(key=>go(key),key);await p.waitForTimeout(40);
 }
 assert.deepEqual(errors,[]);
 console.log('PASS stress fixture (not phone benchmark):',JSON.stringify(result),'; major pages render without JS errors');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
