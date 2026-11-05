
const SUPABASE_URL='https://wkyyuyyfauyhpivebrdg.supabase.co';
const SUPABASE_KEY='sb_publishable_AXZtXN81wyM_W7tVZuJ-zw_ohoaj-1M';
const authClient=window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    })
  : null;
let customerSession=null;
let customerProfile=null;
let customerOrders=[];
let activeCartTab='cart',lastCartOrdersRefresh=0,cartOrdersTimer=null,customerSnapshotPromise=null;
const KBR_GUEST_SENT_KEY='kbr_guest_sent_v2';
const KBR_CUSTOMER_ORDER_HISTORY_DAYS=30;
const KBR_ORDER_HISTORY_CUTOFF_MS=KBR_CUSTOMER_ORDER_HISTORY_DAYS*24*60*60*1000;
function isRecentCustomerOrder(order){
 const status=String(order?.status||'').toLowerCase();
 if(status!=='completed'&&status!=='cancelled')return true; // Keep unresolved orders visible.
 const when=Date.parse(order?.createdAt||'');
 return Number.isFinite(when)&&when>=Date.now()-KBR_ORDER_HISTORY_CUTOFF_MS;
}
function savedGuestCustomerOrders(){
 try{
   const orders=JSON.parse(localStorage.getItem(KBR_GUEST_SENT_KEY)||'[]');
   const recent=Array.isArray(orders)?orders.filter(isRecentCustomerOrder).slice(0,12):[];
   if(Array.isArray(orders)&&orders.length!==recent.length)
     localStorage.setItem(KBR_GUEST_SENT_KEY,JSON.stringify(recent));
   return recent;
 }catch{return [];}
}


let menu=[];
let category='Frappe & Smoothies';
let cart=[];
let selected=null;
let selectedType='standard';
let selectedPayment='cash';
let selectedRedeemPoints=0;
const GCASH_NUMBER='09672365176';
let deliveryZones=[];
let selectedDeliveryFee=0;
let currentShopOpen=false;
let closedPreorderConfigured=false;
let closedPreorderService='pickup';
let lockedServiceType='';
const GUEST_CLAIM_KEY='kbrPendingGuestOrderClaim';

let selectedSweetness='Normal Sugar';

const $=id=>document.getElementById(id);
const money=v=>`₱${Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2})}`;

async function rpc(name,payload={}){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${customerSession?.access_token||SUPABASE_KEY}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(payload)
  });
  const text=await response.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)throw new Error(data?.message||data?.details||data?.hint||'Request failed.');
  return data;
}

function toast(message){
  const el=$('toast');
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>el.classList.remove('show'),2200);
}

function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

function attr(value=''){return esc(value)}

function categories(){
  const preferred=[
    'Frappe & Smoothies',
    'Coffee Series',
    'Matcha Series',
    'Milk Tea Series',
    'Soda',
    'Floats',
    'Snackies',
    'Ice Cream'
  ];
  const present=new Set(menu.map(x=>x.category).filter(Boolean));
  return preferred.filter(x=>present.has(x));
}

function categoryLabel(name){
  if(name==='Soda')return 'Fruit Soda';
  if(name==='Ice Cream')return 'Ice Creams';
  return name;
}

function renderCategories(){
  $('categoryBar').innerHTML=categories().map(name=>`
    <button type="button" class="category-button ${name===category?'active':''}" data-category="${attr(name)}">${esc(categoryLabel(name))}</button>
  `).join('');
  $('categoryBar').querySelectorAll('[data-category]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      category=btn.dataset.category;
      renderCategories();
      renderMenu();
    });
  });
}

function itemVariants(item){
  const standard=(Array.isArray(item.sizes)?item.sizes:[]).map((size,i)=>({
    type:'standard',size,price:Number(item.prices?.[i]||0)
  }));
  const premium=(Array.isArray(item.premiumSizes)&&Array.isArray(item.premium))
    ? item.premiumSizes.map((size,i)=>({type:'premium',size,price:Number(item.premium?.[i]||0)}))
    : [];
  return [...standard,...premium].filter(x=>x.size&&Number.isFinite(x.price));
}

function minimumPrice(item){
  const vals=itemVariants(item).map(x=>x.price);
  return vals.length?Math.min(...vals):0;
}

function resolveImage(item){
  const raw=String(item.image||'').trim();
  if(!raw)return '';
  if(/^https?:\/\//i.test(raw)||raw.startsWith('data:'))return raw;
  if(raw.startsWith('./'))return raw;
  if(raw.startsWith('images/'))return raw;
  if(raw.startsWith('/'))return '.'+raw;
  return `images/${raw}`;
}

function renderMenu(){
  const indexed=menu.map((item,index)=>({item,index}));
  const filtered=indexed
    .filter(({item})=>item.category===category)
    .sort((a,b)=>{
      if(category==='Frappe & Smoothies'){
        const aMax=Math.max(...itemVariants(a.item).map(x=>x.price),0);
        const bMax=Math.max(...itemVariants(b.item).map(x=>x.price),0);
        if(bMax!==aMax)return bMax-aMax;
        return b.index-a.index;
      }
      return a.index-b.index;
    })
    .map(x=>x.item);

  $('categoryTitle').textContent=categoryLabel(category);
  $('emptyState').classList.toggle('hidden',filtered.length>0);

  $('menuGrid').innerHTML=filtered.map(item=>`
    <article class="menu-card" data-product="${attr(item.productId||item.name)}"
             tabindex="0" role="button" aria-label="Choose ${attr(item.name||'item')}">
      <img src="${attr(resolveImage(item))}" alt="${attr(item.name)}" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="menu-card-body">
        <h3>${esc(item.name||'')}</h3>
      </div>
    </article>
  `).join('');

  $('menuGrid').querySelectorAll('[data-product]').forEach(card=>{
    card.addEventListener('click',()=>openItem(card.dataset.product));
    card.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){
        event.preventDefault();
        openItem(card.dataset.product);
      }
    });
  });
}

function isFriesProduct(item){
  return String(item?.name||'').toLowerCase().includes('fries');
}

function selectedFriesFlavor(){
  return document.querySelector('input[name="friesFlavor"]:checked')?.value||'Cheese';
}

function openItem(key){
  selected=menu.find(x=>(x.productId||x.name)===key);
  if(!selected)return;

  $('itemImage').src=resolveImage(selected);
  $('itemImage').alt=selected.name||'';
  $('itemCategory').textContent=selected.category||'';
  $('itemName').textContent=selected.name||'';
  $('qtyInput').value=1;
  $('flavorInput').value='';
  selectedSweetness='Normal Sugar';
  document.querySelectorAll('.sweetness-option').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.sweetness==='Normal Sugar');
  });

  const hasPremium=Array.isArray(selected.premium)&&selected.premium.length>0&&Array.isArray(selected.premiumSizes)&&selected.premiumSizes.length>0;
  selectedType='standard';

  $('typeOptions').classList.toggle('hidden',!hasPremium);
  $('typeOptions').innerHTML=hasPremium?`
    <label class="option-choice">
      <span><input type="radio" name="itemType" value="standard" checked> Standard</span>
    </label>
    <label class="option-choice">
      <span><input type="radio" name="itemType" value="premium"> Premium</span>
    </label>
  `:'';

  $('typeOptions').querySelectorAll('input[name="itemType"]').forEach(input=>{
    input.addEventListener('change',()=>{
      selectedType=input.value;
      renderSizeOptions();
    });
  });

  const cat=String(selected.category||'').toLowerCase();
  const isDrink=!selected.food && !cat.includes('snack') && !cat.includes('ice cream');
  $('sweetnessField').classList.toggle('hidden',!isDrink);

  const hasFlavor=cat.includes('ice cream');
  const fries=isFriesProduct(selected);
  $('flavorField').classList.toggle('hidden',!hasFlavor);
  $('friesFlavorField')?.classList.toggle('hidden',!fries);

  if(fries){
    const cheese=document.querySelector('input[name="friesFlavor"][value="Cheese"]');
    if(cheese)cheese.checked=true;
  }

  renderSizeOptions();
  $('itemDialog').showModal();
}

function renderSizeOptions(){
  const sizes=selectedType==='premium'?selected.premiumSizes:selected.sizes;
  const prices=selectedType==='premium'?selected.premium:selected.prices;
  $('sizeOptions').innerHTML=(Array.isArray(sizes)?sizes:[]).map((size,i)=>`
    <label class="option-choice">
      <span><input type="radio" name="itemSize" value="${attr(size)}" ${i===0?'checked':''}> ${esc(size)}</span>
      <strong>${money(prices?.[i])}</strong>
    </label>
  `).join('');
}


function animateToCart(){
  const source=$('itemImage');
  const cartButton=$('cartButton');
  if(!source||!cartButton||!source.src)return;

  const srcRect=source.getBoundingClientRect();
  const cartRect=cartButton.getBoundingClientRect();

  const clone=document.createElement('img');
  clone.src=source.src;
  clone.className='fly-to-cart';
  clone.style.left=`${srcRect.left}px`;
  clone.style.top=`${srcRect.top}px`;
  clone.style.width=`${srcRect.width}px`;
  clone.style.height=`${srcRect.height}px`;
  clone.style.opacity='1';
  document.body.appendChild(clone);

  const targetX=cartRect.left + cartRect.width/2 - srcRect.left - srcRect.width/2;
  const targetY=cartRect.top + cartRect.height/2 - srcRect.top - srcRect.height/2;

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      clone.style.transform=`translate(${targetX}px,${targetY}px) scale(.18)`;
      clone.style.width=`${srcRect.width*.55}px`;
      clone.style.height=`${srcRect.height*.55}px`;
      clone.style.opacity='.15';
    });
  });

  setTimeout(()=>{
    clone.remove();
    cartButton.classList.remove('cart-bump');
    void cartButton.offsetWidth;
    cartButton.classList.add('cart-bump');
    setTimeout(()=>cartButton.classList.remove('cart-bump'),450);
  },720);
}

function addSelected(){
  if(!selected)return;
  const sizeEl=document.querySelector('#sizeOptions input[name="itemSize"]:checked');
  if(!sizeEl)return toast('Please choose a size.');

  const size=sizeEl.value;
  const sizes=selectedType==='premium'?selected.premiumSizes:selected.sizes;
  const prices=selectedType==='premium'?selected.premium:selected.prices;
  const idx=sizes.indexOf(size);
  const price=Number(prices[idx]);
  const qty=Math.max(1,Math.min(20,Number($('qtyInput').value)||1));
  const sweetness=$('sweetnessField').classList.contains('hidden')?'':selectedSweetness;
  const flavor=isFriesProduct(selected)
    ? selectedFriesFlavor()
    : ($('flavorField').classList.contains('hidden')?'':$('flavorInput').value.trim());

  const key=[selected.productId||selected.name,selectedType,size,sweetness,flavor].join('|');
  const existing=cart.find(x=>x.key===key);
  if(existing)existing.qty=Math.min(20,existing.qty+qty);
  else cart.push({
    key,
    productId:selected.productId||'',
    name:selected.name,
    category:selected.category,
    type:selectedType,
    size,
    sweetness,
    flavor,
    unitPrice:price,
    qty
  });

  saveCart();
  renderCart();
updateHeaderCartCount();
updateHeaderPoints();
  animateToCart();
  setTimeout(()=>$('itemDialog').close(),120);
  toast('Added to cart.');
}

function saveCart(){
  localStorage.setItem('kbr_online_cart_v2',JSON.stringify(cart));
}

function loadCart(){
  try{
    const value=JSON.parse(localStorage.getItem('kbr_online_cart_v2')||'[]');
    cart=Array.isArray(value)?value:[];
  }catch{cart=[]}
}


function groupedCartItemCount(){
  // The cart already groups identical configured items into one line.
  // Count those grouped lines rather than qty, so 20× Siomai = 1 cart item.
  return Array.isArray(cart)?cart.length:0;
}

function updateHeaderCartCount(){
  if($('cartCount'))$('cartCount').textContent=String(groupedCartItemCount());
}


function rewardCartPoints(){
  return cart.reduce((sum,item)=>
    sum + (item.paidByPoints ? Number(item.rewardPointsCost||0)*Number(item.qty||0) : 0)
  ,0);
}
function spendablePointsAfterRewardCart(){
  return Math.max(0,Number(customerProfile?.points||0)-rewardCartPoints());
}
function total(){
  return cart.reduce((sum,x)=>sum+x.unitPrice*x.qty,0);
}

function renderCart(){
  updateHeaderCartCount();
  $('cartCount').textContent=String(groupedCartItemCount());
  $('cartTotal').textContent=money(total());
  updateCheckoutTotals();
  $('checkoutButton').disabled=!cart.length;

  if(!cart.length){
    $('cartItems').innerHTML='<div class="empty-state">Your cart is empty.</div>';
    return;
  }

  $('cartItems').innerHTML=cart.map((item,i)=>`
    <div class="cart-line">
      <div>
        <h4>${esc(item.name)}</h4>
        <p>${esc(item.type==='premium'?'Premium · ':'')}${esc(item.size)}${item.sweetness?` · ${esc(item.sweetness)}`:''}${item.flavor?` · ${esc(item.flavor)}`:''}</p>
        <p>${item.paidByPoints
          ? `${Number(item.rewardPointsCost||0).toLocaleString('en-PH')} pts · Paid by Points`
          : `${money(item.unitPrice)} each`}</p>
      </div>
      <div class="qty-inline">
        <button type="button" data-minus="${i}">−</button>
        <strong>${item.qty}</strong>
        <button type="button" data-plus="${i}">+</button>
      </div>
    </div>
  `).join('');

  $('cartItems').querySelectorAll('[data-minus]').forEach(btn=>btn.addEventListener('click',()=>{
    const i=Number(btn.dataset.minus);
    cart[i].qty--;
    if(cart[i].qty<=0)cart.splice(i,1);
    saveCart();renderCart();
  }));

  $('cartItems').querySelectorAll('[data-plus]').forEach(btn=>btn.addEventListener('click',()=>{
    const i=Number(btn.dataset.plus);
    cart[i].qty=Math.min(20,cart[i].qty+1);
    saveCart();renderCart();
  }));
}


function visibleCartOrders(){
 const signed=!!customerSession?.user;
 let orders=customerOrders;
 if(!signed)orders=savedGuestCustomerOrders();
 return (Array.isArray(orders)?orders:[]).filter(o=>{
  const status=String(o.status||'sent').toLowerCase();
  return isRecentCustomerOrder(o)&&status!=='cancelled'&&
    (activeCartTab==='paid'?status==='completed':status!=='completed');
 });
}
function renderCartOrderTabs(){
 for(const tab of document.querySelectorAll('[data-cart-tab]')){
  const on=tab.dataset.cartTab===activeCartTab;
  tab.classList.toggle('active',on);tab.setAttribute('aria-selected',String(on));
 }
 const cartVisible=activeCartTab==='cart';
 $('cartItems').classList.toggle('hidden',!cartVisible);
 $('cartCheckoutFooter').classList.toggle('hidden',!cartVisible);
 $('customerCartOrders').classList.toggle('hidden',cartVisible);
 if(cartVisible)return;
 const signed=!!customerSession?.user;
 $('cartOrdersNotice').textContent=!signed?'Orders sent from this device are shown here. Sign in to track payment status across devices.':
 activeCartTab==='sent'?'Submitted orders awaiting confirmation and payment.':'Orders confirmed completed and paid by the shop.';
 $('refreshCartOrders').classList.toggle('hidden',!signed);
 const orders=visibleCartOrders();
 $('cartOrdersList').innerHTML=orders.length?orders.map(order=>{
  const items=(Array.isArray(order.items)?order.items:[]).map(item=>
   '<div class="cart-order-line"><strong>'+Number(item.qty||1)+'× '+esc(item.name||'Item')+'</strong><span>'+
   [item.size,item.sweetness,item.flavor].filter(Boolean).map(esc).join(' · ')+'</span></div>').join('');
  const date=order.createdAt?new Date(order.createdAt):null;
  const stamp=date&&!Number.isNaN(date.getTime())?date.toLocaleString('en-PH',{dateStyle:'medium',timeStyle:'short'}):'';
  return '<article class="cart-order-card"><div class="cart-order-heading"><strong>Online #'+esc(order.orderNumber||'')+
   '</strong><strong>'+money(order.total||0)+'</strong></div><p>'+
   esc(String(order.status||'sent').replace(/_/g,' '))+' · '+esc(order.serviceType||'pickup')+
   (stamp?' · '+esc(stamp):'')+'</p>'+items+'</article>';
 }).join(''):'<p class="empty-state">'+(activeCartTab==='paid'?'No paid orders yet.':'No sent orders awaiting payment.')+'</p>';
}
function stopCartOrdersTimer(){if(cartOrdersTimer!==null){clearInterval(cartOrdersTimer);cartOrdersTimer=null;}}
async function refreshCartOrders(force=false){
 if(document.hidden||!customerSession?.user)return;
 if(!force&&Date.now()-lastCartOrdersRefresh<20000)return;
 await loadCustomerProfile();
}
function startCartOrdersTimer(){
 stopCartOrdersTimer();
 if(activeCartTab!=='sent'||!customerSession?.user||document.hidden||!$('cartDrawer').classList.contains('open'))return;
 cartOrdersTimer=setInterval(()=>{
  if(document.hidden||activeCartTab!=='sent'||!$('cartDrawer').classList.contains('open')){stopCartOrdersTimer();return;}
  refreshCartOrders();
 },60000);
}
function selectCartTab(tab){
 if(!['cart','sent','paid'].includes(tab))return;
 activeCartTab=tab;renderCartOrderTabs();startCartOrdersTimer();
 if(tab!=='cart')refreshCartOrders();
}

function openCart(){
  $('cartDrawer').classList.add('open');
  $('cartDrawer').setAttribute('aria-hidden','false');
  renderCartOrderTabs();startCartOrdersTimer();
  if(activeCartTab!=='cart')refreshCartOrders();
}
function closeCart(){
  $('cartDrawer').classList.remove('open');
  $('cartDrawer').setAttribute('aria-hidden','true');
  stopCartOrdersTimer();
}


async function loadDeliveryZones(){
  try{
    const zones=await rpc('kbr_delivery_zones_snapshot');
    deliveryZones=(Array.isArray(zones)?zones:[]).sort((a,b)=>{
      if(a.barangay==='Ungib')return -1;
      if(b.barangay==='Ungib')return 1;
      return String(a.barangay||'').localeCompare(String(b.barangay||''));
    });
    const select=$('deliveryBarangay');
    if(!select)return;

    select.innerHTML='<option value="">Select barangay</option>'+deliveryZones.map(zone=>{
      const label=zone.available
        ? `${zone.barangay} — ${Number(zone.fee||0)===0?'FREE':money(zone.fee)}`
        : `${zone.barangay} — No delivery`;
      return `<option value="${attr(zone.barangay)}" ${zone.available?'':'disabled'}>${esc(label)}</option>`;
    }).join('');
  }catch(error){
    console.warn('Could not load delivery zones',error);
  }
}

function updateDeliveryFee(){
  const barangay=$('deliveryBarangay')?.value||'';
  const zone=deliveryZones.find(x=>x.barangay===barangay);
  selectedDeliveryFee=zone&&zone.available?Number(zone.fee||0):0;

  const preview=$('deliveryFeePreview');
  const row=$('deliveryFeeRow');

  if(!barangay||!zone){
    preview.classList.add('hidden');
    row.classList.add('hidden');
    selectedDeliveryFee=0;
  }else if(!zone.available){
    preview.textContent='Delivery is not available to this barangay.';
    preview.classList.remove('hidden');
    preview.classList.add('no-delivery');
    row.classList.add('hidden');
    selectedDeliveryFee=0;
  }else{
    preview.classList.remove('no-delivery');
    preview.textContent=selectedDeliveryFee===0
      ? `${zone.barangay}: FREE delivery`
      : `${zone.barangay}: Delivery fee ${money(selectedDeliveryFee)}`;
    preview.classList.remove('hidden');
    row.classList.remove('hidden');
  }

  $('deliveryFeeAmount').textContent=money(selectedDeliveryFee);
  updateCheckoutTotals();
}


function eligibleDrinkSubtotal(){
  return cart.reduce((sum,line)=>{
    const product=menu.find(item=>
      (line.productId&&item.productId===line.productId) ||
      (String(item.name||'').toLowerCase()===String(line.name||'').toLowerCase() &&
       String(item.category||'').toLowerCase()===String(line.category||'').toLowerCase())
    );
    const food=product?.food===true;
    const iceCream=String(line.category||'').toLowerCase().includes('ice cream');
    return sum+((food||iceCream)?0:Number(line.unitPrice||0)*Number(line.qty||0));
  },0);
}
function maxRedeemBlocks(){return 0;} // Rewards are free drinks only.
function clampRedeemPoints(){
  const max=maxRedeemBlocks()*1000;
  selectedRedeemPoints=Math.max(0,Math.min(max,Math.floor(selectedRedeemPoints/1000)*1000));
}
function pointsDiscount(){return Math.floor(selectedRedeemPoints/1000)*50}
function updatePointsPaymentUI(){
  const signed=!!customerSession?.user;
  const balance=Number(customerProfile?.points||0);
  const box=$('pointsPaymentBox');
  if(!box)return;
  box.classList.toggle('hidden',!signed||balance<1000||maxRedeemBlocks()<1);
  if($('pointsPaymentBalance')){
    const reserved=rewardCartPoints();
    $('pointsPaymentBalance').textContent=reserved>0
      ? `${balance.toLocaleString('en-PH')} points · ${reserved.toLocaleString('en-PH')} reserved for reward drinks`
      : `${balance.toLocaleString('en-PH')} points available`;
  }
  clampRedeemPoints();
  const discount=pointsDiscount();
  if($('pointsRedeemValue'))$('pointsRedeemValue').textContent=`₱${discount} off`;
  if($('pointsRedeemLabel'))$('pointsRedeemLabel').textContent=`${selectedRedeemPoints.toLocaleString('en-PH')} points`;
  if($('pointsMinusButton'))$('pointsMinusButton').disabled=selectedRedeemPoints<=0;
  if($('pointsPlusButton'))$('pointsPlusButton').disabled=selectedRedeemPoints>=maxRedeemBlocks()*1000;
}
function updateCheckoutTotals(){
  clampRedeemPoints();
  const subtotal=total();
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const fee=service==='delivery'?selectedDeliveryFee:0;
  const discount=pointsDiscount();
  const finalTotal=Math.max(0,subtotal+fee-discount);

  if($('checkoutSubtotal'))$('checkoutSubtotal').textContent=money(subtotal);
  if($('checkoutTotal'))$('checkoutTotal').textContent=money(finalTotal);
  if($('checkoutPointsDiscount'))$('checkoutPointsDiscount').textContent=`−${money(discount)}`;
  $('pointsDiscountRow')?.classList.toggle('hidden',discount<=0);
  updatePointsPaymentUI();

  const cashBtn=$('cashPaymentButton');
  if(cashBtn){
    cashBtn.disabled=finalTotal>300;
    cashBtn.title=finalTotal>300?'Orders above ₱300 after points require GCash.':'';
  }

  let note=document.getElementById('paymentLimitNote');
  if(finalTotal>300){
    if(!note){
      note=document.createElement('div');
      note.id='paymentLimitNote';
      note.className='payment-limit-note';
      document.querySelector('.payment-buttons')?.insertAdjacentElement('afterend',note);
    }
    note.textContent='Orders above ₱300 after points require GCash payment.';
    if(selectedPayment!=='gcash')setPayment('gcash');
  }else if(note){
    note.remove();
  }
}


function applyServiceLock(){
  const radios=[...document.querySelectorAll('input[name="serviceType"]')];
  radios.forEach(radio=>{
    const label=radio.closest('label');
    const locked=!!lockedServiceType;
    const isSelected=!locked||radio.value===lockedServiceType;

    radio.disabled=locked&&!isSelected;
    label?.classList.toggle('service-locked-off',locked&&!isSelected);
    label?.classList.toggle('service-locked-on',locked&&isSelected);

    if(locked&&isSelected)radio.checked=true;
  });
}

function updateServiceFields(){
  applyServiceLock();
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||lockedServiceType||'pickup';
  const delivery=service==='delivery';
  $('deliveryAddressField').classList.toggle('hidden',!delivery);
  $('deliveryEta').classList.toggle('hidden',!delivery);

  if(delivery){
    $('notesLabel').textContent='Delivery notes (optional)';
    $('orderNotes').placeholder='Landmark, gate color, special instructions, etc.';
  }else{
    $('notesLabel').textContent=currentShopOpen
      ? 'Pickup notes (optional) — include your pickup time'
      : 'Pickup notes (optional)';
    $('orderNotes').placeholder=currentShopOpen
      ? 'Example: Pick up around 3:00 PM. Add special instructions here.'
      : 'Special instructions, etc.';
    $('deliveryAddress').value='';
    if($('deliveryBarangay'))$('deliveryBarangay').value='';
    selectedDeliveryFee=0;
    $('deliveryFeePreview')?.classList.add('hidden');
    $('deliveryFeeRow')?.classList.add('hidden');
  }

  updateTimingFields();
  updateCheckoutTotals();
  setPayment(selectedPayment);
}

function setPayment(method){
  const finalTotal=Math.max(0,total()+((document.querySelector('input[name="serviceType"]:checked')?.value||'pickup')==='delivery'?selectedDeliveryFee:0)-pointsDiscount());
  if(method==='cash'&&finalTotal>300){
    selectedPayment='gcash';
    toast('Orders above ₱300 require GCash.');
  }else{
    selectedPayment=method==='gcash'?'gcash':'cash';
  }

  document.querySelectorAll('.payment-choice').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.payment===selectedPayment);
  });

  $('cashAmountField').classList.toggle('hidden',selectedPayment!=='cash');
  $('gcashDetails').classList.toggle('hidden',selectedPayment!=='gcash');
  if($('gcashNumber'))$('gcashNumber').textContent=GCASH_NUMBER;

  const service=document.querySelector('input[name="serviceType"]:checked')?.value||lockedServiceType||'pickup';
  $('cashAmountField')?.classList.toggle('hidden',!(method==='cash'&&service==='delivery'));
}




function getManilaNow(){
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone:'Asia/Manila',
    year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',
    hour12:false
  }).formatToParts(new Date()).reduce((acc,p)=>{
    acc[p.type]=p.value;
    return acc;
  },{});
  return {
    year:Number(parts.year),month:Number(parts.month),day:Number(parts.day),
    hour:Number(parts.hour),minute:Number(parts.minute),second:Number(parts.second)
  };
}

function manilaPseudoDate(parts=getManilaNow()){
  return new Date(Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second||0));
}

function formatDateTimeLocal(date){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function openingHourFor(date){
  const day=date.getUTCDay();
  return (day===0||day===6)?15:11;
}

function earliestHourMinute(date,service){
  const day=date.getUTCDay();
  const weekend=day===0||day===6;

  if(weekend){
    return service==='delivery'
      ? {hour:16,minute:0}
      : {hour:15,minute:30};
  }

  return {hour:11,minute:30};
}

function latestHourMinute(service){
  return service==='delivery'?{hour:22,minute:30}:{hour:22,minute:45};
}

function defaultScheduledTime(){
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const now=manilaPseudoDate();
  let candidate=new Date(now.getTime()+30*60000);
  candidate.setUTCSeconds(0,0);

  let rounded=Math.ceil(candidate.getUTCMinutes()/15)*15;
  if(rounded>=60){
    candidate.setUTCHours(candidate.getUTCHours()+1);
    rounded=0;
  }
  candidate.setUTCMinutes(rounded,0,0);

  for(let i=0;i<8;i++){
    const earliest=earliestHourMinute(candidate,service);
    const latest=latestHourMinute(service);

    const opening=new Date(candidate);
    opening.setUTCHours(earliest.hour,earliest.minute,0,0);

    const closing=new Date(candidate);
    closing.setUTCHours(latest.hour,latest.minute,0,0);

    if(candidate<opening)candidate=opening;
    if(candidate<=closing)return formatDateTimeLocal(candidate);

    candidate=new Date(candidate);
    candidate.setUTCDate(candidate.getUTCDate()+1);
    const nextEarliest=earliestHourMinute(candidate,service);
    candidate.setUTCHours(nextEarliest.hour,nextEarliest.minute,0,0);
  }
  return '';
}

function scheduledValueIsValid(value,service){
  if(!value)return {ok:false,message:'Please choose a date and time.'};

  const m=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if(!m)return {ok:false,message:'Please choose a valid date and time.'};

  const selected=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]));
  const now=manilaPseudoDate();

  if(selected.getTime()<now.getTime()+30*60000){
    return {ok:false,message:'Please choose a time at least 30 minutes from now.'};
  }
  if(selected.getTime()>now.getTime()+7*24*60*60000){
    return {ok:false,message:'You can schedule up to 7 days ahead.'};
  }

  const earliest=earliestHourMinute(selected,service);
  const latest=latestHourMinute(service);
  const mins=selected.getUTCHours()*60+selected.getUTCMinutes();
  const earliestMins=earliest.hour*60+earliest.minute;
  const latestMins=latest.hour*60+latest.minute;

  if(mins<earliestMins||mins>latestMins){
    const weekend=selected.getUTCDay()===0||selected.getUTCDay()===6;
    const earliestLabel=weekend
      ? (service==='delivery'?'4:00 PM':'3:30 PM')
      : '11:30 AM';
    return {
      ok:false,
      message:service==='delivery'
        ? `Please choose a delivery time between ${earliestLabel} and 10:30 PM.`
        : `Please choose a pickup time between ${earliestLabel} and 10:45 PM.`
    };
  }

  return {ok:true,iso:`${value}:00+08:00`};
}

function updateTimingFields(){
  const input=$('scheduledTime');
  const section=$('orderTimingSection');
  if(!input)return;

  // Open shop: orders are immediate. No scheduled-time field.
  if(currentShopOpen){
    section?.classList.add('hidden');
    input.value='';
    input.removeAttribute('min');
    input.removeAttribute('max');
    return;
  }

  // Closed shop preorder: the time was chosen before entering the menu.
  section?.classList.remove('hidden');

  const minDate=manilaPseudoDate();
  input.min=formatDateTimeLocal(minDate);

  const maxDate=manilaPseudoDate();
  maxDate.setUTCDate(maxDate.getUTCDate()+7);
  input.max=formatDateTimeLocal(maxDate);

  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  if($('scheduledTimeHelp')){
    $('scheduledTimeHelp').textContent=service==='delivery'
      ? 'Scheduled delivery time selected from Order for Later.'
      : 'Scheduled pickup time selected from Order for Later.';
  }
}

function deliveryCutoffPassed(){
  const now=getManilaNow();
  return now.hour>22 || (now.hour===22 && now.minute>=30);
}


function localDateString(date){
  const pad=n=>String(n).padStart(2,'0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth()+1)}-${pad(date.getUTCDate())}`;
}

function closedPreorderShow(step){
  $('closedPreorderIntro')?.classList.toggle('hidden',step!=='intro');
  $('closedPreorderServiceStep')?.classList.toggle('hidden',step!=='service');
  $('closedPreorderTimeStep')?.classList.toggle('hidden',step!=='time');
}

function configureClosedPreorderDate(){
  const input=$('closedPreorderDate');
  if(!input)return;

  const now=manilaPseudoDate();
  const max=new Date(now);
  max.setUTCDate(max.getUTCDate()+7);

  input.min=localDateString(now);
  input.max=localDateString(max);

  if(!input.value)input.value=localDateString(now);
  populateClosedPreorderTimes();

  if(!$('closedPreorderTime').value){
    const tomorrow=new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate()+1);
    input.value=localDateString(tomorrow);
    populateClosedPreorderTimes();
  }
}

function populateClosedPreorderTimes(){
  const dateInput=$('closedPreorderDate');
  const select=$('closedPreorderTime');
  if(!dateInput||!select||!dateInput.value)return;

  const m=dateInput.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return;

  const date=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],0,0));
  const earliest=earliestHourMinute(date,closedPreorderService);
  const latest=latestHourMinute(closedPreorderService);
  const now=manilaPseudoDate();
  const sameDay=localDateString(date)===localDateString(now);

  const options=[];
  for(let mins=earliest.hour*60+earliest.minute; mins<=latest.hour*60+latest.minute; mins+=15){
    const hour=Math.floor(mins/60);
    const minute=mins%60;
    const slot=new Date(date);
    slot.setUTCHours(hour,minute,0,0);

    if(sameDay&&slot.getTime()<now.getTime()+30*60000)continue;

    const h12=hour%12||12;
    const ampm=hour<12?'AM':'PM';
    const label=`${h12}:${String(minute).padStart(2,'0')} ${ampm}`;
    options.push(`<option value="${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}">${label}</option>`);
  }

  select.innerHTML=options.length
    ? options.join('')
    : '<option value="">No remaining times for this date</option>';

  const weekend=date.getUTCDay()===0||date.getUTCDay()===6;
  const earliestLabel=weekend
    ? (closedPreorderService==='delivery'?'4:00 PM':'3:30 PM')
    : '11:30 AM';
  $('closedPreorderTimeHelp').textContent=closedPreorderService==='delivery'
    ? `Delivery times: ${earliestLabel}–10:30 PM`
    : `Pickup times: ${earliestLabel}–10:45 PM`;
}

function startClosedPreorderService(service){
  closedPreorderService=service;
  $('closedPreorderTimeTitle').textContent=service==='delivery'
    ? 'Choose your delivery time'
    : 'Choose your pickup time';
  closedPreorderShow('time');
  configureClosedPreorderDate();
}

function finishClosedPreorder(){
  const date=$('closedPreorderDate')?.value||'';
  const time=$('closedPreorderTime')?.value||'';
  if(!date||!time)return toast('Please choose an available date and time.');

  const value=`${date}T${time}`;
  const check=scheduledValueIsValid(value,closedPreorderService);
  if(!check.ok)return toast(check.message);

  lockedServiceType=closedPreorderService;
  const serviceRadio=document.querySelector(`input[name="serviceType"][value="${lockedServiceType}"]`);
  if(serviceRadio)serviceRadio.checked=true;
  applyServiceLock();

  if($('scheduledTime'))$('scheduledTime').value=value;

  closedPreorderConfigured=true;
  $('closedPreorderGate')?.classList.add('hidden');
  updateServiceFields();
  updateTimingFields();
  window.scrollTo({top:0,behavior:'smooth'});
}

function savePendingGuestClaim(orderId,phone){
  try{
    localStorage.setItem(GUEST_CLAIM_KEY,JSON.stringify({
      orderId,
      phone,
      savedAt:Date.now()
    }));
  }catch(_){}
}

function getPendingGuestClaim(){
  try{
    const raw=localStorage.getItem(GUEST_CLAIM_KEY);
    if(!raw)return null;
    const parsed=JSON.parse(raw);
    if(!parsed?.orderId||!parsed?.phone)return null;
    if(Date.now()-Number(parsed.savedAt||0)>24*60*60*1000){
      localStorage.removeItem(GUEST_CLAIM_KEY);
      return null;
    }
    return parsed;
  }catch(_){
    return null;
  }
}

async function tryClaimPendingGuestOrder(){
  if(!customerSession?.user)return false;
  const pending=getPendingGuestClaim();
  if(!pending)return false;

  try{
    const result=await rpc('kbr_claim_guest_order',{
      p_order_id:pending.orderId,
      p_phone:pending.phone
    });
    localStorage.removeItem(GUEST_CLAIM_KEY);
    await loadCustomerProfile();
    if(Number(result?.pointsAwardedNow||0)>0){
      toast(`Order linked. ${result.pointsAwardedNow} KBR Points added.`);
    }else{
      toast('Order linked to your KBR account. Points will be added when it is completed.');
    }
    return true;
  }catch(error){
    console.warn('Could not claim guest order',error);
    return false;
  }
}

async function placeOrder(){
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';

  let requested=null;
  if(!currentShopOpen){
    const check=scheduledValueIsValid($('scheduledTime')?.value||'',service);
    if(!check.ok)return toast(check.message);
    requested=check.iso;
  }

  const customerName=$('customerName').value.trim();
  const contact=$('contactNumber').value.trim();
  const barangay=$('deliveryBarangay')?.value||'';
  const address=$('deliveryAddress').value.trim();
  const payment=selectedPayment;
  let notes=$('orderNotes').value.trim();
  const cashAmount=Number($('cashAmount')?.value||0);

  if(payment==='cash'&&service==='delivery'){
    if(!cashAmount||cashAmount<Math.max(0,total()+(service==='delivery'?selectedDeliveryFee:0)-pointsDiscount()))return toast('Please enter enough cash for the order total.');
    notes=[notes,`Cash tendered: ₱${cashAmount}`].filter(Boolean).join(' | ');
  }else{
    notes=[notes,'GCash selected. Customer instructed to send receipt to Kape Bar-Rio.'].filter(Boolean).join(' | ');
  }

  if(customerName.length<2)return toast('Please enter your name.');
  if(contact.replace(/\D/g,'').length<7)return toast('Please enter a valid contact number.');
  if(service==='delivery'&&!barangay)return toast('Please select your barangay.');
  if(service==='delivery'&&address.length<5)return toast('Please enter your complete delivery address.');
  if(!cart.length)return toast('Your cart is empty.');

  const button=$('placeOrderButton');
  button.disabled=true;
  button.textContent='Sending order…';

  try{
    const result=await rpc('kbr_create_online_order',{
      p_customer_name:customerName,
      p_phone:contact,
      p_service_type:service,
      p_delivery_barangay:barangay,
      p_delivery_address:address,
      p_payment_method:payment,
      p_notes:notes,
      p_requested_pickup_at:requested,
      p_redeem_points:selectedRedeemPoints,
      p_items:cart.map(x=>({
        productId:x.productId,
        name:x.name,
        category:x.category,
        type:x.type,
        size:x.size,
        sweetness:x.sweetness,
        flavor:x.flavor,
        qty:x.qty,
        paidByPoints:x.paidByPoints===true,
        rewardPointsCost:Number(x.rewardPointsCost||0)
      }))
    });

    const sentItems=cart.map(x=>({name:x.name,qty:x.qty,size:x.size,sweetness:x.sweetness,flavor:x.flavor}));
    cart=[];
    saveCart();
    renderCart();
    $('checkoutDialog').close();

    $('successOrderNo').textContent=`Online #${result.orderNumber}`;
    const rewardItemPts=Number(result.rewardItemPoints||0);
    const checkoutPts=Number(result.checkoutPointsRedeemed||0);
    const redeemedText=(rewardItemPts>0||checkoutPts>0)
      ? ` You used ${Number(result.pointsRedeemed||0).toLocaleString('en-PH')} KBR Points${Number(result.rewardDiscount||0)>0?` including ₱${Number(result.rewardDiscount||0).toLocaleString('en-PH')} checkout discount`:''}.`
      : '';
    selectedRedeemPoints=0;
    const scheduledText=requested
      ? ` Scheduled for ${new Date(requested).toLocaleString('en-PH',{timeZone:'Asia/Manila',dateStyle:'medium',timeStyle:'short'})}.`
      : '';
    $('successText').textContent=result.serviceType==='delivery'
      ? `Your delivery order totaling ${money(result.total)} has been sent.${redeemedText}${scheduledText} Kape Bar-Rio will use your contact number to confirm delivery details.`
      : `Your pickup order totaling ${money(result.total)} has been sent to Kape Bar-Rio.${redeemedText}${scheduledText}`;
    const guestOrder=!customerSession?.user;
    $('guestClaimOffer')?.classList.toggle('hidden',!guestOrder);
    if(guestOrder){
      savePendingGuestClaim(result.id,contact);
      try{
        const previous=JSON.parse(localStorage.getItem(KBR_GUEST_SENT_KEY)||'[]');
        const list=Array.isArray(previous)?previous:[];
        localStorage.setItem(KBR_GUEST_SENT_KEY,JSON.stringify([{
          orderNumber:result.orderNumber,status:'sent',serviceType:result.serviceType,
          total:result.total,createdAt:new Date().toISOString(),items:sentItems
        },...list.filter(o=>String(o.orderNumber)!==String(result.orderNumber))].slice(0,12)));
      }catch{}
    }
    activeCartTab='sent';renderCartOrderTabs();

    $('successDialog').showModal();

    if(customerSession?.user){
      try{
        await rpc('kbr_save_customer_checkout_details',{
          p_name:customerName,
          p_phone:contact,
          p_barangay:service==='delivery'?barangay:'',
          p_address:service==='delivery'?address:''
        });
      }catch(error){
        console.warn('Could not save customer details',error);
      }

      loadCustomerProfile();
    }
  }catch(error){
    toast(error.message||'Could not send your order.');
  }finally{
    button.disabled=false;
    button.textContent='Send order';
  }
}



function populateProfileBarangays(){
  const select=$('profileBarangay');
  if(!select)return;
  const current=customerProfile?.barangay||'';
  select.innerHTML='<option value="">Select barangay</option>'+deliveryZones
    .filter(zone=>zone.available)
    .map(zone=>`<option value="${attr(zone.barangay)}">${esc(zone.barangay)}</option>`)
    .join('');
  if(current)select.value=current;
}

function openSavedDetails(){
  if(!customerSession?.user)return;
  $('profileName').value=customerProfile?.name||'';
  $('profilePhone').value=customerProfile?.phone||'';
  populateProfileBarangays();
  $('profileAddress').value=customerProfile?.address||'';
  $('savedDetailsDialog')?.showModal();
}

async function saveProfileDetails(){
  const name=$('profileName').value.trim();
  const phone=$('profilePhone').value.trim();
  const barangay=$('profileBarangay').value.trim();
  const address=$('profileAddress').value.trim();

  if(name.length<2)return toast('Please enter your name.');
  if(phone.replace(/\D/g,'').length<7)return toast('Please enter a valid phone number.');

  try{
    await rpc('kbr_save_customer_checkout_details',{
      p_name:name,
      p_phone:phone,
      p_barangay:barangay,
      p_address:address
    });
    await loadCustomerProfile();
    $('savedDetailsDialog')?.close();
    toast('Saved details updated.');
  }catch(error){
    toast(error.message||'Could not save your details.');
  }
}


function showAccountEntryStep(step='entry'){
  const registration=step==='register';
  $('accountEntryChoice')?.classList.toggle('hidden',registration);
  $('accountRegisterChoice')?.classList.toggle('hidden',!registration);
}

function normalizePHPhone(value){
  const digits=String(value||'').replace(/\D/g,'');
  if(/^09\d{9}$/.test(digits))return `+63${digits.slice(1)}`;
  if(/^639\d{9}$/.test(digits))return `+${digits}`;
  if(/^\+639\d{9}$/.test(String(value||'').trim()))return String(value||'').trim();
  return '';
}

async function phoneUsernameRequest(action,details){
  const response=await fetch(`${SUPABASE_URL}/functions/v1/kbr-phone-username`,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({action,...details})
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body.error)throw Error(body.error||'Phone account request failed.');
  if(!body.access_token||!body.refresh_token)throw Error('The server did not return a login session.');
  const {data,error}=await authClient.auth.setSession({
    access_token:body.access_token,refresh_token:body.refresh_token
  });
  if(error||!data?.session)throw error||Error('Could not start your session.');
  customerSession=data.session;
}

let initialPasswordChangeProcessing=false;
function requiresInitialPasswordChange(){
  return customerSession?.user?.app_metadata?.kbr_temporary_password===true;
}
function enforceInitialPasswordChange(){
  const required=requiresInitialPasswordChange();
  const dialog=$('changeCustomerPasswordDialog');
  if(!dialog)return;
  dialog.classList.toggle('kbr-initial-change',required);
  const closeButton=$('changeCustomerPasswordClose');
  if(closeButton)closeButton.hidden=required;
  const instruction=$('changeCustomerPasswordInstructions');
  if(instruction)instruction.textContent=required
    ?'Welcome to KBR Rewards! For your security, replace the temporary password before using your account.'
    :'Change your password here. Forgotten passwords can be reset at Kape Bar-Rio.';
  if(required&&!initialPasswordChangeProcessing&&!dialog.open){
    $('phoneAuthDialog')?.close();
    $('accountDialog')?.close();
    dialog.showModal();
  }
}
function showPhoneAuth(mode='login'){
  const register=mode==='register';
  $('phoneLoginView').classList.toggle('hidden',register);
  $('phoneRegisterView').classList.toggle('hidden',!register);
  $('phoneAuthDialog')?.showModal();
}

async function phoneLogin(){
  if(!authClient)return toast('Phone sign-in is unavailable.');
  const phone=normalizePHPhone($('phoneLoginNumber').value);
  const password=$('phoneLoginPassword').value;

  if(!phone)return toast('Please enter a valid Philippine mobile number.');
  if(!password)return toast('Please enter your password.');

  const button=$('phoneLoginButton');
  button.disabled=true;
  button.textContent='Signing in…';

  try{
    await phoneUsernameRequest('login',{phone,password});
    if(requiresInitialPasswordChange()){
      enforceInitialPasswordChange();
      return;
    }
    await loadCustomerProfile();
    await tryClaimPendingGuestOrder();
    $('phoneAuthDialog')?.close();
    $('accountDialog')?.close();
    toast('Signed in.');
  }catch(error){
    toast(error.message||'Could not sign in.');
  }finally{
    button.disabled=false;
    button.textContent='Sign in';
  }
}

async function phoneRegister(){
  if(!legalConsentAccepted())return toast('Please agree to the Terms & Conditions and Privacy Policy.');
  if(!authClient)return toast('Phone registration is unavailable.');

  const name=$('phoneRegisterName').value.trim();
  const phone=normalizePHPhone($('phoneRegisterNumber').value);
  const password=$('phoneRegisterPassword').value;
  const confirm=$('phoneRegisterConfirm').value;

  if(name.length<2)return toast('Please enter your name.');
  if(!phone)return toast('Please enter a valid Philippine mobile number.');
  if(password.length<6)return toast('Password must be at least 6 characters.');
  if(password!==confirm)return toast('Passwords do not match.');

  const button=$('phoneRegisterButton');
  button.disabled=true;
  button.textContent='Creating account…';

  try{
    await phoneUsernameRequest('register',{name,phone,password,consent:true});
    await rpc('kbr_save_customer_checkout_details',{
      p_name:name,
      p_phone:phone.replace('+63','0'),
      p_barangay:'',
      p_address:''
    }).catch(()=>{});
    await loadCustomerProfile();
    await tryClaimPendingGuestOrder();

    $('phoneAuthDialog')?.close();
    $('accountDialog')?.close();
    toast('KBR account created.');
  }catch(error){
    toast(error.message||'Could not create account.');
  }finally{
    button.disabled=false;
    button.textContent='Create KBR Account';
  }
}

function userHasGoogleIdentity(){
  const identities=customerSession?.user?.identities||[];
  return identities.some(identity=>identity.provider==='google');
}

function customerCanChangePassword(){
  const user=customerSession?.user;
  return Boolean(user&&(user.app_metadata?.kbr_phone_username===true||
    user.identities?.some(identity=>identity.provider==='phone')||user.phone));
}

async function changeCustomerPassword(event){
  event.preventDefault();
  if(initialPasswordChangeProcessing||!customerCanChangePassword()||!authClient)return;
  const current=$('changeCustomerOldPassword').value;
  const next=$('changeCustomerNewPassword').value;
  const confirmation=$('changeCustomerConfirmPassword').value;
  const status=$('changeCustomerPasswordStatus');
  const button=$('changeCustomerPasswordSubmit');
  const feedback=message=>{status.textContent=message;};
  if(!current)return feedback('Enter your current or temporary password.');
  if(next.length<8||next.length>128)return feedback('New password must be 8–128 characters.');
  if(next!==confirmation)return feedback('New passwords do not match.');
  if(current===next)return feedback('Choose a different password.');
  initialPasswordChangeProcessing=true;
  button.disabled=true;
  feedback('Saving your password…');
  try{
    const initial=requiresInitialPasswordChange();
    const user=customerSession?.user;
    if(!user)throw Error('Your session ended. Please sign in again with your phone number.');
    if(initial){
      // Recover a browser session that was not persisted even though login completed.
      let {data:sessionData}=await authClient.auth.getSession();
      if(!sessionData?.session?.access_token){
        const credentials=user.email?{email:user.email,password:current}:{phone:user.phone,password:current};
        const {data:relogin,error:reloginError}=await authClient.auth.signInWithPassword(credentials);
        if(reloginError||!relogin?.session)throw Error('Session expired. Sign in again using your temporary password.');
        customerSession=relogin.session;
        sessionData={session:relogin.session};
      }
      const response=await fetch(SUPABASE_URL+'/functions/v1/kbr-initial-password-change',{
        method:'POST',
        headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+sessionData.session.access_token,'Content-Type':'application/json'},
        body:JSON.stringify({currentPassword:current,newPassword:next})
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok||!result?.ok)throw Error(result?.error||'Could not complete your password setup.');
      // A password update can invalidate the old token. Exit cleanly and request
      // a fresh login rather than using a stale session or reopening this dialog.
      customerSession=null;
      await authClient.auth.signOut({scope:'local'}).catch(()=>{});
      customerProfile=null;
      customerOrders=[];
      $('changeCustomerPasswordForm').reset();
      $('changeCustomerPasswordDialog')?.close();
      $('changeCustomerPasswordDialog')?.classList.remove('kbr-initial-change');
      $('changeCustomerPasswordClose').hidden=false;
      updateAccountUI();
      $('signInChoiceDialog')?.showModal();
      toast('Password saved! Sign in again using your NEW password.');
    }else{
      const verification=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
        auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
      });
      const credentials=user.email?{email:user.email,password:current}:{phone:user.phone,password:current};
      const {error:verifyError}=await verification.auth.signInWithPassword(credentials);
      if(verifyError)throw Error('Current password is incorrect.');
      const {error:updateError}=await authClient.auth.updateUser({password:next});
      if(updateError)throw updateError;
      $('changeCustomerPasswordForm').reset();
      $('changeCustomerPasswordDialog')?.close();
      toast('Password changed successfully.');
    }
  }catch(error){
    feedback(error?.message||'Password change failed. Please try again.');
  }finally{
    initialPasswordChangeProcessing=false;
    button.disabled=false;
  }
}

async function connectGoogleAccount(){
  if(!authClient||!customerSession?.user)return;
  if(userHasGoogleIdentity())return toast('Google is already connected.');

  const redirectTo=new URL('online.html',window.location.href).href;
  const {error}=await authClient.auth.linkIdentity({
    provider:'google',
    options:{redirectTo}
  });
  if(error)toast(error.message||'Could not connect Google.');
}


function currentCustomerPoints(){
  const raw=Number(
    customerProfile?.points ??
    customerProfile?.points_balance ??
    customerProfile?.profile?.points ??
    customerProfile?.profile?.points_balance ??
    0
  );
  const reserved=typeof rewardCartPoints==='function'?rewardCartPoints():0;
  return Math.max(0,raw-reserved);
}

function updateHeaderPoints(){
  const points=currentCustomerPoints();
  const pill=$('pointsBalancePill');
  if(pill)pill.textContent=points.toLocaleString('en-PH');
}

const REWARD_TIERS=[1000,1500,2000,2500,3000,3500];
function renderCustomerPointsProgress(){
 const balance=Math.max(0,Math.floor(Number(customerProfile?.points||0)));
 const goal=REWARD_TIERS.find(tier=>tier>balance)||3500;
 // Progress toward the next free-drink tier, capped at the highest tier.
 const percent=goal>0?Math.min(100,balance/goal*100):0;
 const fill=$('kbrRewardProgressFill');
 const track=$('kbrRewardProgressTrack');
 const goalLabel=$('kbrRewardNextGoal');
 if(fill)fill.style.width=percent.toFixed(2)+'%';
 if(track){
  track.setAttribute('aria-valuemin','0');
  track.setAttribute('aria-valuemax',String(goal));
  track.setAttribute('aria-valuenow',String(balance));
  track.setAttribute('aria-label',balance.toLocaleString('en-PH')+' of '+goal.toLocaleString('en-PH')+' points toward the next drink milestone');
 }
 if(goalLabel)goalLabel.textContent=goal.toLocaleString('en-PH');
}
function customerShortCode(id){
 const compact=String(id||'').replace(/-/g,'').slice(0,12).toUpperCase();
 return compact.length===12?compact.match(/.{4}/g).join('-'):'';
}
let lastRenderedRewardQr='';
function renderCustomerRewardQr(){
 const holder=$('kbrCustomerQr'),status=$('kbrCustomerQrStatus');
 if(!holder||!status)return;
 const id=customerSession?.user?.id||'';
 const codeEl=$('kbrCustomerShortCode');
 if(codeEl)codeEl.textContent=customerShortCode(id)||'—';
 if(!id){holder.replaceChildren();lastRenderedRewardQr='';status.textContent='Sign in to display your QR.';return;}
 const payload='KBR-CUSTOMER:'+id.toLowerCase();
 if(payload===lastRenderedRewardQr&&holder.childElementCount)return;
 if(typeof window.QRCode!=='function'){
  status.textContent='QR image unavailable. Reconnect to load it.';
  return;
 }
 holder.replaceChildren();
 try{
  new window.QRCode(holder,{text:payload,width:224,height:224,
    colorDark:'#1d1713',colorLight:'#ffffff',
    correctLevel:window.QRCode.CorrectLevel.M});
  lastRenderedRewardQr=payload;
  status.textContent='Your personal customer code · Show this to the cashier';
 }catch(error){status.textContent='Could not create your QR. Refresh and try again.';}
}
function updateAccountUI(){
  updateHeaderPoints();
  const button=$('customerAccountButton');
  const signed=!!customerSession?.user;
  $('pointsSignInHero')?.classList.toggle('hidden',signed);

  button.innerHTML='<span class="account-icon">👤</span><small>My Account</small>';
  button.classList.toggle('signed-in',signed);

  if($('headerPoints')){
    $('headerPoints').textContent=Number(customerProfile?.points||0).toLocaleString('en-PH');
  }

  $('guestAccountView').classList.toggle('hidden',signed);
  $('signedInAccountView').classList.toggle('hidden',!signed);

  if(!signed)return;

  const user=customerSession.user;
  if($('connectGoogleButton')){
    $('connectGoogleButton').classList.toggle('hidden',userHasGoogleIdentity());
  }
  $('changeCustomerPasswordOpen')?.classList.toggle('hidden',!customerCanChangePassword());
  $('customerDisplayName').textContent=
    customerProfile?.name||
    user.user_metadata?.full_name||
    user.user_metadata?.name||
    'KBR Customer';

  $('customerPoints').textContent=Number(customerProfile?.points||0).toLocaleString('en-PH');
  renderCustomerPointsProgress();
  renderCustomerRewardQr();

  const avatar=customerProfile?.avatarUrl||user.user_metadata?.avatar_url||'';
  if(avatar){
    $('customerAvatar').src=avatar;
    $('customerAvatar').classList.remove('hidden');
  }else{
    $('customerAvatar').classList.add('hidden');
  }

  const details=[];
  if(customerProfile?.name)details.push(`Name: ${customerProfile.name}`);
  if(customerProfile?.phone)details.push(`Phone: ${customerProfile.phone}`);
  if(customerProfile?.barangay)details.push(`Barangay: ${customerProfile.barangay}`);
  if(customerProfile?.address)details.push(`Location: ${customerProfile.address}`);
  $('savedCustomerDetails').textContent=details.length
    ? details.join('\n')
    : 'No saved checkout details yet.';


}

async function loadCustomerProfile(){
  if(!customerSession?.user){
    customerProfile=null;customerOrders=[];lastCartOrdersRefresh=0;
    stopCartOrdersTimer();updateAccountUI();renderCartOrderTabs();return;
  }
  if(customerSnapshotPromise)return customerSnapshotPromise;
  const userId=customerSession.user.id;
  customerSnapshotPromise=(async()=>{
    try{
      const snapshot=await rpc('kbr_customer_account_snapshot',{});
      if(customerSession?.user?.id!==userId)return;
      customerProfile=snapshot?.profile||null;
      customerOrders=Array.isArray(snapshot?.orders)?snapshot.orders.filter(isRecentCustomerOrder):[];
      lastCartOrdersRefresh=Date.now();
      // After a guest order is claimed, the server record becomes authoritative.
      try{
        const guest=savedGuestCustomerOrders();
        if(Array.isArray(guest)){
          const linked=new Set(customerOrders.map(o=>String(o.orderNumber)));
          localStorage.setItem(KBR_GUEST_SENT_KEY,JSON.stringify(guest.filter(o=>!linked.has(String(o.orderNumber)))));
        }
      }catch{}
    }catch(error){
      console.warn('Could not refresh customer orders',error);
      // Retain known status when offline rather than clearing previous orders.
    }
    updateAccountUI();updateHeaderPoints();updatePointsPaymentUI();renderCartOrderTabs();
  })().finally(()=>{customerSnapshotPromise=null;});
  return customerSnapshotPromise;
}

async function initCustomerAuth(){
  if(!authClient){
    updateAccountUI();
    return;
  }

  const {data}=await authClient.auth.getSession();
  customerSession=data?.session||null;
  await loadCustomerProfile();
  if(requiresInitialPasswordChange())enforceInitialPasswordChange();
  else if(customerSession?.user)await tryClaimPendingGuestOrder();

  authClient.auth.onAuthStateChange(async(_event,session)=>{
    customerSession=session||null;
    await loadCustomerProfile();
    if(requiresInitialPasswordChange())enforceInitialPasswordChange();
    else if(customerSession?.user)await tryClaimPendingGuestOrder();
  });
}

async function signInWithGoogle(){
  if(!authClient){
    toast('Google sign-in is not available yet.');
    return;
  }

  const redirectTo=new URL('online.html',window.location.href).href;
  const {error}=await authClient.auth.signInWithOAuth({
    provider:'google',
    options:{redirectTo}
  });

  if(error)toast(error.message||'Could not start Google sign-in.');
}

async function signOutCustomer(){
  if(!authClient)return;
  const {error}=await authClient.auth.signOut();
  if(error){
    toast(error.message||'Could not sign out.');
    return;
  }
  customerSession=null;
  customerProfile=null;
  customerOrders=[];
  lastCartOrdersRefresh=0;
  stopCartOrdersTimer();
  activeCartTab='cart';
  updateAccountUI();
  renderCartOrderTabs();
  $('accountDialog')?.close();
}



async function loadMenu(){
  try{
    const snapshot=await rpc('kbr_online_menu_snapshot');
    menu=Array.isArray(snapshot?.items)?snapshot.items:[];
    const tabs=categories();
    if(!tabs.includes(category))category=tabs[0]||'Frappe & Smoothies';
    currentShopOpen=!!snapshot?.shopOpen;
    if($('shopStatus')){
      $('shopStatus').textContent='';
      $('shopStatus').className='shop-status hidden';
    }

    if(currentShopOpen){
      closedPreorderConfigured=false;
      $('closedPreorderGate')?.classList.add('hidden');
    }else if(!closedPreorderConfigured){
      $('closedPreorderGate')?.classList.remove('hidden');
      closedPreorderShow('intro');
    }

    updateTimingFields();
    renderCategories();
    renderMenu();
  }catch(error){
    $('shopStatus').textContent='Unable to load live menu.';
    $('shopStatus').className='shop-status closed';
    toast(error.message||'Could not load the menu.');
  }
}

document.querySelectorAll('.sweetness-option').forEach(btn=>{
  btn.addEventListener('click',()=>{
    selectedSweetness=btn.dataset.sweetness||'Normal Sugar';
    document.querySelectorAll('.sweetness-option').forEach(x=>x.classList.toggle('active',x===btn));
  });
});

$('closedOrderLaterButton')?.addEventListener('click',()=>closedPreorderShow('service'));
$('closedPreorderBackIntro')?.addEventListener('click',()=>closedPreorderShow('intro'));
$('closedPreorderBackService')?.addEventListener('click',()=>closedPreorderShow('service'));
$('closedPickupButton')?.addEventListener('click',()=>startClosedPreorderService('pickup'));
$('closedDeliveryButton')?.addEventListener('click',()=>startClosedPreorderService('delivery'));
$('closedPreorderDate')?.addEventListener('change',populateClosedPreorderTimes);
$('closedPreorderContinue')?.addEventListener('click',finishClosedPreorder);

$('claimCreateAccountButton')?.addEventListener('click',()=>{
  $('successDialog')?.close();
  showAccountEntryStep('register');
  $('accountDialog')?.showModal();
});
$('claimSignInButton')?.addEventListener('click',()=>{
  $('successDialog')?.close();
  $('signInChoiceDialog')?.showModal();
});

$('signInOpenButton')?.addEventListener('click',()=>{
  $('accountDialog')?.close();
  $('signInChoiceDialog')?.showModal();
});
$('signInChoiceClose')?.addEventListener('click',()=>$('signInChoiceDialog')?.close());
$('signInPhoneButton')?.addEventListener('click',()=>{
  $('signInChoiceDialog')?.close();
  showPhoneAuth('login');
});
$('signInGoogleButton')?.addEventListener('click',()=>{
  $('signInChoiceDialog')?.close();
  $('googleSignInButton')?.click();
});

$('welcomeSignInButton')?.addEventListener('click',()=>{
  $('accountDialog')?.close();
  $('signInChoiceDialog')?.showModal();
});
$('createPointsAccountButton')?.addEventListener('click',()=>showAccountEntryStep('register'));
$('backToEntryChoiceButton')?.addEventListener('click',()=>showAccountEntryStep('entry'));

$('phoneRegisterOpenButton')?.addEventListener('click',()=>showPhoneAuth('register'));
$('phoneAuthClose')?.addEventListener('click',()=>$('phoneAuthDialog')?.close());
$('showPhoneRegisterButton')?.addEventListener('click',()=>showPhoneAuth('register'));
$('showPhoneLoginButton')?.addEventListener('click',()=>showPhoneAuth('login'));
$('phoneLoginButton')?.addEventListener('click',phoneLogin);
$('phoneRegisterButton')?.addEventListener('click',phoneRegister);
$('connectGoogleButton')?.addEventListener('click',connectGoogleAccount);

$('savedDetailsButton')?.addEventListener('click',openSavedDetails);
$('saveProfileDetailsButton')?.addEventListener('click',e=>{
  e.preventDefault();
  saveProfileDetails();
});

$('pointsSignInHero')?.addEventListener('click',()=>{
  if(customerSession?.user){
    $('customerAccountButton')?.click();
    return;
  }
  showAccountEntryStep('entry');
  const dialog=$('accountDialog');
  if(dialog && typeof dialog.showModal==='function' && !dialog.open)dialog.showModal();
});

document.querySelectorAll('[data-cart-tab]').forEach(button=>{
  button.addEventListener('click',()=>selectCartTab(button.dataset.cartTab));
});
$('refreshCartOrders')?.addEventListener('click',async()=>{
  const button=$('refreshCartOrders');button.disabled=true;button.textContent='Refreshing…';
  try{await refreshCartOrders(true);}finally{button.disabled=false;button.textContent='Refresh order status';}
});
$('openCart')?.addEventListener('click',()=>{
  renderCart();
  openCart();
});

$('customerAccountButton')?.addEventListener('click',async()=>{
  try{
    if(customerSession?.user){
      await loadCustomerProfile();
    }else{
      showAccountEntryStep('entry');
      updateAccountUI();
    }

    const dialog=$('accountDialog');
    if(!dialog){
      toast('Account window is unavailable.');
      return;
    }

    if(typeof dialog.showModal==='function'){
      if(!dialog.open)dialog.showModal();
    }else{
      dialog.classList.remove('hidden');
      dialog.setAttribute('open','');
    }
  }catch(error){
    console.error('Account open failed',error);
    toast(error?.message||'Could not open account.');
  }
});

$('pointsButton')?.addEventListener('click',async()=>{
  if(!customerSession?.user){
    showAccountEntryStep('entry');
    const dialog=$('accountDialog');
    if(dialog && typeof dialog.showModal==='function' && !dialog.open)dialog.showModal();
    toast('Sign in to view and redeem KBR Points.');
    return;
  }
  await loadCustomerProfile();
  window.location.href='./rewards.html';
});

function legalConsentAccepted(){
  return !!($('registrationLegalConsent')?.checked || $('phoneRegisterLegalConsent')?.checked);
}
function syncLegalConsent(sourceId){
  const checked=$(sourceId)?.checked||false;
  if($('registrationLegalConsent'))$('registrationLegalConsent').checked=checked;
  if($('phoneRegisterLegalConsent'))$('phoneRegisterLegalConsent').checked=checked;
}
function openTerms(){ const d=$('termsDialog'); if(d&&!d.open)d.showModal(); }
function openPrivacy(){ const d=$('privacyDialog'); if(d&&!d.open)d.showModal(); }

$('registrationLegalConsent')?.addEventListener('change',()=>syncLegalConsent('registrationLegalConsent'));
$('phoneRegisterLegalConsent')?.addEventListener('change',()=>syncLegalConsent('phoneRegisterLegalConsent'));

['openTermsFromRegister','openTermsFromPhone','footerTermsButton'].forEach(id=>{
  $(id)?.addEventListener('click',openTerms);
});
['openPrivacyFromRegister','openPrivacyFromPhone','footerPrivacyButton'].forEach(id=>{
  $(id)?.addEventListener('click',openPrivacy);
});
$('termsClose')?.addEventListener('click',()=>$('termsDialog')?.close());
$('termsDone')?.addEventListener('click',()=>$('termsDialog')?.close());
$('privacyClose')?.addEventListener('click',()=>$('privacyDialog')?.close());
$('privacyDone')?.addEventListener('click',()=>$('privacyDialog')?.close());

$('accountClose')?.addEventListener('click',()=>$('accountDialog')?.close());
$('continueGuestButton')?.addEventListener('click',()=>$('accountDialog')?.close());
$('googleSignInButton')?.addEventListener('click',signInWithGoogle);
$('changeCustomerPasswordOpen')?.addEventListener('click',()=>{
  if(!customerCanChangePassword())return;
  $('accountDialog')?.close();
  $('changeCustomerPasswordStatus').textContent='';
  $('changeCustomerPasswordForm').reset();
  $('changeCustomerPasswordDialog')?.showModal();
});
$('changeCustomerPasswordClose')?.addEventListener('click',()=>{
  if(requiresInitialPasswordChange())return;
  $('changeCustomerPasswordDialog')?.close();
});
$('changeCustomerPasswordDialog')?.addEventListener('cancel',event=>{
  if(requiresInitialPasswordChange())event.preventDefault();
});
$('changeCustomerPasswordForm')?.addEventListener('submit',changeCustomerPassword);
$('kbrCopyCustomerCode')?.addEventListener('click',async()=>{
 const code=customerShortCode(customerSession?.user?.id);
 if(!code)return;
 try{
  await navigator.clipboard.writeText(code);
  toast('Customer code copied.');
 }catch{
  toast('Code: '+code);
 }
});
$('customerSignOutButton')?.addEventListener('click',signOutCustomer);
$('cartButton')?.addEventListener('click',openCart);
document.querySelectorAll('[data-close-cart]').forEach(el=>el.addEventListener('click',closeCart));
$('checkoutButton')?.addEventListener('click',()=>{
  if(!cart.length)return;
  closeCart();

  if(currentShopOpen){
    lockedServiceType='';
    closedPreorderConfigured=false;
    if($('scheduledTime'))$('scheduledTime').value='';
  }

  applyServiceLock();
  updateCheckoutTotals();
  updateServiceFields();
  updateTimingFields();

  if(customerSession?.user){
    if(!$('customerName').value.trim()){
      $('customerName').value=
        customerProfile?.name||
        customerSession.user.user_metadata?.full_name||
        customerSession.user.user_metadata?.name||
        '';
    }

    if(!$('contactNumber').value.trim()&&customerProfile?.phone){
      $('contactNumber').value=customerProfile.phone;
    }

    if(customerProfile?.barangay&&$('deliveryBarangay')){
      const exists=[...$('deliveryBarangay').options].some(opt=>opt.value===customerProfile.barangay);
      if(exists){
        $('deliveryBarangay').value=customerProfile.barangay;
        updateDeliveryFee();
      }
    }

    if(!$('deliveryAddress').value.trim()&&customerProfile?.address){
      $('deliveryAddress').value=customerProfile.address;
    }
  }

  $('checkoutDialog').showModal();
});
$('itemCloseButton')?.addEventListener('click',()=>{
  const dialog=$('itemDialog');
  if(dialog?.open)dialog.close();
});

$('checkoutCloseButton')?.addEventListener('click',()=>{
  const dialog=$('checkoutDialog');
  if(dialog?.open)dialog.close();
});

$('addToCartButton')?.addEventListener('click',e=>{e.preventDefault();addSelected()});
$('qtyMinus')?.addEventListener('click',()=>{$('qtyInput').value=Math.max(1,Number($('qtyInput').value||1)-1)});
$('qtyPlus')?.addEventListener('click',()=>{$('qtyInput').value=Math.min(20,Number($('qtyInput').value||1)+1)});
document.querySelectorAll('input[name="serviceType"]').forEach(el=>el.addEventListener('change',()=>{
  if(currentShopOpen&&$('scheduledTime'))$('scheduledTime').value='';
  updateServiceFields();
}));
$('scheduledTime')?.addEventListener('change',updateTimingFields);
$('deliveryBarangay')?.addEventListener('change',updateDeliveryFee);
$('pointsPaymentToggle')?.addEventListener('click',()=>{
  if(!customerSession?.user){$('accountDialog')?.showModal();return}
  const controls=$('pointsPaymentControls');
  if(controls?.classList.contains('hidden')){
    controls.classList.remove('hidden');
    if(selectedRedeemPoints===0&&maxRedeemBlocks()>0)selectedRedeemPoints=1000;
  }else{
    controls.classList.add('hidden');
    selectedRedeemPoints=0;
  }
  updateCheckoutTotals();
});
$('pointsMinusButton')?.addEventListener('click',()=>{selectedRedeemPoints=Math.max(0,selectedRedeemPoints-1000);updateCheckoutTotals()});
$('pointsPlusButton')?.addEventListener('click',()=>{selectedRedeemPoints=Math.min(maxRedeemBlocks()*1000,selectedRedeemPoints+1000);updateCheckoutTotals()});

$('cashPaymentButton')?.addEventListener('click',()=>setPayment('cash'));
$('gcashPaymentButton')?.addEventListener('click',()=>setPayment('gcash'));
$('placeOrderButton')?.addEventListener('click',e=>{e.preventDefault();placeOrder()});
$('successClose')?.addEventListener('click',()=>$('successDialog')?.close());

let lastAccountResume=0;
function resumeCustomerApp(){
  if(document.hidden)return;
  const now=Date.now();
  if(now-lastAccountResume<5000)return;
  lastAccountResume=now;
  if(customerSession?.user&&now-lastCartOrdersRefresh>60000)loadCustomerProfile();
  startCartOrdersTimer();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden)stopCartOrdersTimer();
  else resumeCustomerApp();
});
window.addEventListener('focus',resumeCustomerApp);

loadCart();
renderCart();
setPayment('cash');
initCustomerAuth();
loadDeliveryZones();
loadMenu();

if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('./online-sw.js?v=86-welcome-choices',{scope:'./online.html'})
      .catch(error=>console.warn('Online PWA worker registration failed',error));
  });
}


function handleOnlineHashTarget(){
  const target=window.location.hash;
  if(target==='#cart'){
    setTimeout(()=>{
      renderCart();
      openCart();
      history.replaceState(null,'',window.location.pathname+window.location.search);
    },250);
  }else if(target==='#account'){
    setTimeout(()=>{
      $('customerAccountButton')?.click();
      history.replaceState(null,'',window.location.pathname+window.location.search);
    },250);
  }
}
window.addEventListener('load',handleOnlineHashTarget);


function handleLegalHash(){
  if(window.location.hash==='#terms'){
    setTimeout(()=>{ openTerms(); history.replaceState(null,'',window.location.pathname+window.location.search); },250);
  }else if(window.location.hash==='#privacy'){
    setTimeout(()=>{ openPrivacy(); history.replaceState(null,'',window.location.pathname+window.location.search); },250);
  }
}
window.addEventListener('load',handleLegalHash);
