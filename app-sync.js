'use strict';
(()=>{
 const cloud=KBRCloud,ui=KBRSyncUI,queueKey='kbr_order_write_v1',draftKey='kbr_order_draft_v1';
 let role='',ready=false,busy=false,polling=false,menuRevision=0,lastFinalized=null;const remote=new Map();
 let claimDay='',claimedNames=null,claimRequest=null;
 function shopDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
 window.KBRBaristaDrinks={available:()=>claimDay===shopDay()&&claimedNames!==null?['James','Mark','Khenn'].filter(name=>!claimedNames.has(name)):null};
 async function refreshBaristaClaims(){
  if(claimRequest)return claimRequest;
  claimRequest=(async()=>{try{
   const day=shopDay(),rows=await cloud.request('/rest/v1/kbr_barista_drinks?day=eq.'+day+'&select=person');
   claimDay=day;claimedNames=new Set(rows.map(row=>row.person));
  }catch(e){claimDay='';claimedNames=null;}finally{
   claimRequest=null;
   if(selectedBaristaPayment==='barista-drink'&&baristaDrawer.classList.contains('open'))renderBaristaPaymentPanel();
  }})();return claimRequest;
 }
 function snapshot(){return structuredClone({pending:pendingOrders,served:servedUnpaidOrders,paid:unservedPaidOrders,history,cart});}
 function restore(s){pendingOrders=s.pending;servedUnpaidOrders=s.served;unservedPaidOrders=s.paid;history=s.history;cart=s.cart;persist();renderOrder();saveOpenOrderBuckets();localStorage.setItem('kbr_history',JSON.stringify(history));renderBaristaOrders();renderHistory();render();}
 function all(s){return [...s.pending,...s.served,...s.paid];}
 function clean(row){return {...structuredClone(row.data),_cloudId:row.id,_cloudRevision:row.revision};}
 function applyRow(row){remote.set(row.id,row);removeOpenOrderFromBuckets(row.data.no);history=history.filter(r=>r._cloudId ? r._cloudId!==row.id : String(r.no)!==String(row.data.no));if(row.status==='completed'&&row.receipt)history.unshift({...row.receipt,no:row.data.no,_cloudId:row.id});else if(row.status==='open'){
  const order=clean(row);normalizeOpenOrder(order);ensurePendingUnits(order);ensureUnitServedFlags(order);if(isOrderFullyServed(order)&&!order.paid)servedUnpaidOrders.unshift(order);else if(order.paid)unservedPaidOrders.unshift(order);else pendingOrders.unshift(order);
 }saveOpenOrderBuckets();localStorage.setItem('kbr_history',JSON.stringify(history));}
 async function loadOrders(){const rows=await cloud.rows('/rest/v1/kbr_orders?select=*&order=order_number.desc');pendingOrders=[];servedUnpaidOrders=[];unservedPaidOrders=[];const backup=cloud.read('kbr_before_cloud_v1',{});history=structuredClone(backup.history||[]);remote.clear();rows.reverse().forEach(applyRow);}
 function display(){updatePendingOrdersTab();if(baristaDrawer.classList.contains('open')){if(baristaView==='history')renderHistory();else if(baristaView==='kitchen')renderKitchenAlerts();else renderBaristaOrders();}render();}
 function showPending(){const q=cloud.read(queueKey),draft=cloud.read(draftKey);if(q)ui.screen('Change waiting to sync','Keep this device open. Retry the saved change before making another edit.',[['Retry saved change',()=>retryUpdate()],['Sign in again',()=>location.href='sync-login.html']]);else if(draft)ui.screen('Order awaiting confirmation','The connection stopped before confirmation. Retry this same order to check whether it was received. Its ID is reused to prevent duplicates.',[['Retry order',()=>retryDraft()],['Sign in again',()=>location.href='sync-login.html']]);}
 async function poll(){if(!ready||busy||polling||cloud.read(queueKey)||cloud.read(draftKey)||document.hidden)return;polling=true;try{
  let changedUI=false;const [menus,rows]=await Promise.all([cloud.request('/rest/v1/kbr_menu?id=eq.1&select=id,revision'),cloud.rows('/rest/v1/kbr_orders?select=id,revision,status&order=order_number.desc')]);
  if(menus[0]&&menus[0].revision!==menuRevision){const latest=await cloud.request('/rest/v1/kbr_menu?id=eq.1&select=*');ui.applyMenu(latest[0]);menuRevision=latest[0].revision;refreshManagedMenu();changedUI=true;}
  const ids=new Set(rows.map(r=>r.id));for(const row of rows){if(remote.get(row.id)?.revision!==row.revision){const changed=await cloud.request('/rest/v1/kbr_orders?id=eq.'+encodeURIComponent(row.id)+'&select=*');if(changed[0]){applyRow(changed[0]);changedUI=true;}}}
  // Fetch individual tombstones so cancelled or completed orders never resurrect.
  for(const [id,row] of [...remote])if(row.status==='open'&&!ids.has(id)){const changed=await cloud.request('/rest/v1/kbr_orders?id=eq.'+encodeURIComponent(id)+'&select=*');if(changed[0]){applyRow(changed[0]);changedUI=true;}}
  await refreshBaristaClaims();if(changedUI)display();cloud.status('Connected · updates every 3 sec');
 }catch(e){cloud.status('Offline or disconnected · orders cannot be sent',true);}finally{polling=false;}}
 async function flushUpdate(operation){let row;try{row=await cloud.rpc('kbr_update_order',operation.args);}catch(e){const rejected=e.status===400&&e.code==='P0001'&&/Authorize this complimentary payment first|already has a free drink today|Order items changed|One drink only/.test(e.message);if(!rejected)throw e;localStorage.removeItem(queueKey);await loadOrders();display();ui.screen('Payment was not saved',e.message+' Choose the payment option again.',[['Review order',()=>ui.close()]]);return false;}if(row.conflict){localStorage.setItem('kbr_last_conflicting_change',JSON.stringify(operation));localStorage.removeItem(queueKey);await loadOrders();display();ui.screen('Another device changed this order','Your edit was not applied. The latest shared order has been loaded; check it before editing again.',[['Review order',()=>ui.close()]]);return false;}applyRow(row);if(operation.cartAfter){cart=operation.cartAfter;persist();renderOrder();}localStorage.removeItem(queueKey);await refreshBaristaClaims();display();ui.close();cloud.status('Connected · change saved');return true;}
 async function retryUpdate(){if(busy)return;const op=cloud.read(queueKey);if(!op)return;busy=true;ui.screen('Retrying saved change…','Please wait.');try{await flushUpdate(op);}catch(e){ui.screen('Change still waiting to sync',e.message,[['Retry',()=>retryUpdate()],['Sign in again',()=>location.href='sync-login.html']]);}finally{busy=false;}}
 async function mutate(fn,args){if(!ready||busy||polling||cloud.read(queueKey)||cloud.read(draftKey)){if(cloud.read(queueKey)||cloud.read(draftKey))showPending();else showActionToast('Connecting or saving… please try again in a moment.');return;}
  if(!['owner','operator'].includes(role)){alert('This account is read only.');return;}
  busy=true;const before=snapshot();try{
   lastFinalized=null;ui.screen('Saving order…','Please wait for confirmation.');await fn(...args);const after=snapshot();const affected=[];
   for(const order of all(before)){
    const next=all(after).find(o=>o._cloudId===order._cloudId);const receipt=after.history.find(r=>String(r.no)===String(order.no));
    if(!next||JSON.stringify(cloud.strip(next))!==JSON.stringify(cloud.strip(order))){if(!order._cloudId)throw new Error('This is a local pre-sync order. Download the backup and complete it in the previous version.');affected.push({order,next,receipt});}
   }
   if(!affected.length){ui.close();return;}if(affected.length!==1)throw new Error('Only one order can be edited at a time.');
   const {order,next,receipt}=affected[0],base=remote.get(order._cloudId);if(!base)throw new Error('Refresh this order first.');
   const op={cartAfter:after.cart,args:{p_id:order._cloudId,p_expected_revision:base.revision,p_operation:cloud.uuid(),p_data:cloud.strip(next||(lastFinalized?.no===order.no?lastFinalized:order)),p_status:next?'open':receipt?'completed':'cancelled',p_receipt:!next&&receipt?receipt:null}};
   localStorage.setItem(queueKey,JSON.stringify(op));ui.screen('Saving order…','Please wait for confirmation.');await flushUpdate(op);
  }catch(e){restore(before);if(cloud.read(queueKey)){cloud.status('Change waiting to sync',true);ui.screen('Change waiting to sync',e.message,[['Retry saved change',()=>retryUpdate()],['Sign in again',()=>location.href='sync-login.html']]);}else{ui.close();alert(e.message);}}finally{busy=false;}
 }
 function units(items,id){return items.flatMap((x,index)=>Array.from({length:x.qty},(_,n)=>({uid:id+'-'+index+'-'+n,sourceIndex:index,name:x.name,category:x.category,type:x.type,size:x.size,serviceType:x.serviceType,flavor:x.flavor||'',sweetness:x.sweetness||'',originalPrice:x.price,price:x.price,discountPercent:0,food:!!x.food,served:false})));}
 function completeDraft(row){applyRow(row);const order=row.data;currentReceipt={no:order.no,date:order.date,time:order.time,serviceType:order.serviceType,note:order.note||'',total:order.items.reduce((s,x)=>s+x.qty*x.price,0),items:structuredClone(order.items),payment:''};cart=[];persist();localStorage.removeItem(draftKey);render();renderOrder();closeOrder();ui.close();showOrderSentMessage(currentReceipt);cloud.status('Connected · order received');}
 async function retryDraft(){if(busy)return;const draft=cloud.read(draftKey);if(!draft)return;busy=true;ui.screen('Confirming order…','Checking the same order ID; it will not be sent twice.');try{completeDraft(await cloud.rpc('kbr_create_order',draft));}catch(e){draftError(e);}finally{busy=false;}}
 function draftError(e){cloud.status('Order awaiting confirmation',true);const rejected=e.status>=400&&e.status<500&&e.status!==401&&e.status!==403;if(rejected){localStorage.removeItem(draftKey);ui.screen('Order was not accepted',e.message+' Your cart has been kept.',[['Return to cart',()=>{ui.close();poll();}]]);}else ui.screen('Order awaiting confirmation',e.message,[['Retry order',()=>retryDraft()],['Sign in again',()=>location.href='sync-login.html']]);}
 const originalFinalize=finalizeOpenOrder;finalizeOpenOrder=order=>{lastFinalized=structuredClone(order);return originalFinalize(order);};
 const originalMakeReceipt=makeReceipt;
 makeReceipt=async()=>{
  if(!ready||busy||polling){showActionToast('Connecting or saving… please try again in a moment.');return;}if(cloud.read(queueKey)||cloud.read(draftKey)){showPending();return;}
  if(!cart.length){alert('Add at least one item.');return;}if(!['owner','operator'].includes(role)){alert('This account cannot send orders.');return;}
  if(localStorage.getItem('kbr_append_to_pending_order')){if(!findOpenOrder(localStorage.getItem('kbr_append_to_pending_order'))){clearAppendTarget();alert('The order is no longer open. Return to the order list.');return;}await mutate(originalMakeReceipt,[]);return;}
  const id=cloud.uuid(),now=new Date(),mode=customerServiceType||'dine-in';const items=structuredClone(cart).map(x=>({...x,serviceType:mode}));
  const data={date:now.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric',timeZone:'Asia/Manila'}),time:now.toLocaleTimeString('en-PH',{hour:'numeric',minute:'2-digit',timeZone:'Asia/Manila'}),serviceType:mode,items,units:units(items,id),note:'',baristaDone:false,paid:false,paymentMethod:'',cashReceived:0,change:0};
  try{localStorage.setItem(draftKey,JSON.stringify({p_id:id,p_data:data}));}catch(e){alert('Could not save the order for retry. Free some storage first.');return;}
  await retryDraft();
 };
 const handlers={markKitchenDone,savePendingOrderNote,toggleUnitServed,toggleItemGroupServed,setOrderServiceType,cancelPendingTransaction,removeBaristaUnit,baristaAddon,baristaDiscount,completePendingPayment};
 for(const [name,fn] of Object.entries(handlers))window[name]=(...args)=>mutate(fn,args);
 window.authorizeCompPayment=async(kind,person='')=>{
  if(!ready||busy||polling||cloud.read(queueKey)||cloud.read(draftKey)){showActionToast('Connecting or saving… please try again.');return;}
  const order=getCurrentBaristaOrder();if(!order?._cloudId)return;
  const pinInput=document.getElementById('ownerChargePin');const pin=kind==='kuya-john'?String(pinInput?.value||''):'';if(pinInput)pinInput.value='';
  busy=true;let authorization;
  try{ui.screen('Authorizing payment…','Please wait.');authorization=await cloud.rpc('kbr_authorize_comp_payment',{p_order:order._cloudId,p_expected_revision:order._cloudRevision,p_kind:kind,p_person:person,p_pin:pin});if(authorization.error)throw Error(authorization.error);ui.close();}
  catch(e){ui.screen('Payment not authorized',e.message,[['Back to payment',()=>ui.close()]]);return;}finally{busy=false;}
  await mutate(handlers.completePendingPayment,[kind,authorization]);
 };
 clearHistory=()=>alert('Shared sales history is retained in the database. Export CSV to keep a separate copy.');
 async function start(){if(!cloud.requireLogin())return;ui.screen('Connecting this device…','Loading the shared shop menu and orders.');try{
  ui.rememberBackup();role=await cloud.role();const menuRow=await ui.menuReady(role);ui.applyMenu(menuRow);menuRevision=menuRow.revision;refreshManagedMenu();await loadOrders();await refreshBaristaClaims();ready=true;display();ui.close();cloud.status('Connected · updates every 3 sec');showPending();
  const managerLink=document.getElementById('managerLink');if(managerLink)managerLink.hidden=role!=='owner';
  const actions=document.querySelector('.barista-actions');if(actions){for(const [label,action] of [['Sign out',()=>cloud.logout()]]){const button=document.createElement('button');button.className='secondary';button.textContent=label;button.onclick=action;actions.insertBefore(button,document.getElementById('baristaUpdateTools'));}}
 }catch(e){ui.screen('Could not connect',e.message+' Check the database and staff setup steps.',[['Retry connection',start],['Sign in again',()=>location.href='sync-login.html']]);}}
 window.addEventListener('online',()=>{if(cloud.read(queueKey))retryUpdate();else if(cloud.read(draftKey))retryDraft();else poll();});window.addEventListener('focus',poll);setInterval(poll,cloud.config.pollMs);start();
})();
