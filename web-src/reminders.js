/* Native local schedules. HTML cannot pretend to deliver Android notifications. */
let reminderInfo={enabled:false,scheduled:0,message:''};
function syncNativeReminders(ask=false){
 if(!window.BalansReminders)return;
 window.BalansReminders.sync(JSON.stringify(state.rem),!!state.priv.hideNotif);
 if(ask&&state.rem.some(r=>r.on))window.BalansReminders.requestPermission();
}
function testNativeReminder(){
 if(window.BalansReminders)window.BalansReminders.test();
 else toast('Нужна APK-версия','HTML-файл не отправляет системные напоминания Android.');
}
window.onReminderEvent=function(ev){
 reminderInfo={...reminderInfo,...ev};
 const status=$('#reminderStatus');if(status)status.textContent=ev.message||'';
};
const remindersPage=MPAGES.remind.r;
MPAGES.remind.r=function(){
 return remindersPage()+`<p class="foot" role="status" id="reminderStatus">${window.BalansReminders?esc(reminderInfo.message||'Разрешите уведомления при добавлении напоминания. Android может задерживать доставку в режиме энергосбережения.'):'Системные уведомления доступны в APK, а не в HTML-файле.'}</p>`;
};
document.addEventListener('submit',e=>{
 if(e.target.id==='fRem')queueMicrotask(()=>syncNativeReminders(true));
});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-x]')?.dataset.x;
 if(['remtog','remdel'].includes(a)||(a==='ptog'&&e.target.closest('[data-x]')?.dataset.a==='hideNotif'))queueMicrotask(()=>syncNativeReminders(a==='remtog'));
});
const foregroundWithReminders=window.onAppForeground;
window.onAppForeground=()=>{foregroundWithReminders?.();syncNativeReminders()};
if(window.BalansReminders)setTimeout(()=>syncNativeReminders(),500);
