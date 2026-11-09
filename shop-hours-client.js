'use strict';
window.KBRShopHoursClient=(()=>{
 let state=null;
 const pad=n=>String(n).padStart(2,'0');
 const minutes=t=>{const a=String(t||'').split(':').map(Number);return a.length===2&&Number.isFinite(a[0])&&Number.isFinite(a[1])?a[0]*60+a[1]:null};
 const nowManila=()=>new Date(new Date().toLocaleString('en-US',{timeZone:'Asia/Manila'}));
 function mode(){
  if(!state)return 'automatic';
  if(state.mode==='automatic'||!state.override_until)return 'automatic';
  return Date.parse(state.override_until)>Date.now()?state.mode:'automatic';
 }
 function schedule(date){
  if(!state)return null;
  const day=((date.getUTCDay()+6)%7)+1;
  const dateStr=date.getUTCFullYear()+'-'+pad(date.getUTCMonth()+1)+'-'+pad(date.getUTCDate());
  return (state.special_dates||[]).find(x=>x.date===dateStr)
     ||(state.schedule||[]).find(x=>Number(x.day)===day)||null;
 }
 function serviceEnabled(service){
  return !!state&&!!state.online_enabled&&!!state[service+'_enabled']&&mode()!=='closed';
 }
 function timeWindow(date,service){
  const day=schedule(date);
  if(!day||day.closed||!serviceEnabled(service))return null;
  const start=minutes(day.open),end=minutes(day.close);
  if(start===null||end===null)return null;
  const weekend=date.getUTCDay()===0||date.getUTCDay()===6;
  const offset=service==='delivery'
    ? Number(weekend?state.weekend_delivery_start_offset_minutes:state.delivery_start_offset_minutes)
    : Number(state.pickup_start_offset_minutes);
  const cutoff=Number(state[service+'_cutoff_minutes']||0);
  const earliest=start+offset,latest=end-cutoff;
  if(earliest>=latest||earliest<0||latest>1439)return null;
  return {earliest,latest,start,end};
 }
 function immediateAllowed(shopOpen,service='pickup'){
  if(!serviceEnabled(service)||!shopOpen)return false;
  if(mode()==='open')return true;
  // Use a Manila wall clock expressed as pseudo-UTC, as the existing customer time picker does.
  const now=nowManila();
  const pseudo=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate(),now.getHours(),now.getMinutes()));
  const day=schedule(pseudo);
  if(!day||day.closed)return false;
  const start=minutes(day.open),end=minutes(day.close),t=now.getHours()*60+now.getMinutes();
  return end>start?t>=start&&t<=end:(t>=start||t<=end);
 }
 function validateScheduled(date,service){
  if(!serviceEnabled(service))return {ok:false,message:'This ordering service is temporarily unavailable.'};
  if(!state.advance_enabled)return {ok:false,message:'Advance ordering is currently disabled.'};
  const window=timeWindow(date,service);
  if(!window)return {ok:false,message:'No ordering times are available on the selected date.'};
  const total=date.getUTCHours()*60+date.getUTCMinutes();
  if(total<window.earliest||total>window.latest)return {ok:false,message:'Please select an available '+service+' time for the selected day.'};
  return {ok:true};
 }
 function set(snapshot){
  const candidate=snapshot?.settings;
  if(candidate&&Array.isArray(candidate.schedule)&&candidate.timezone==='Asia/Manila')state=candidate;
  return state;
 }
 return Object.freeze({set,mode,schedule,timeWindow,immediateAllowed,validateScheduled,serviceEnabled,
  get settings(){return state;}});
})();
