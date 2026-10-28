
const SUPABASE_URL='https://wkyyuyyfauyhpivebrdg.supabase.co';
const SUPABASE_KEY='sb_publishable_AXZtXN81wyM_W7tVZuJ-zw_ohoaj-1M';

let menu=[];
let category='Frappe & Smoothies';
let cart=[];
let selected=null;
let selectedType='standard';
let selectedPayment='cash';
const GCASH_NUMBER='09672365176';
let deliveryZones=[];
let selectedDeliveryFee=0;
let selectedSweetness='Normal Sugar';

const $=id=>document.getElementById(id);
const money=v=>`₱${Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2})}`;

async function rpc(name,payload={}){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${SUPABASE_KEY}`,
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
  $('flavorField').classList.toggle('hidden',!hasFlavor);

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
  const flavor=$('flavorField').classList.contains('hidden')?'':$('flavorInput').value.trim();

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

function total(){
  return cart.reduce((sum,x)=>sum+x.unitPrice*x.qty,0);
}

function renderCart(){
  $('cartCount').textContent=cart.reduce((s,x)=>s+x.qty,0);
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
        <p>${money(item.unitPrice)} each</p>
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

function openCart(){
  $('cartDrawer').classList.add('open');
  $('cartDrawer').setAttribute('aria-hidden','false');
}
function closeCart(){
  $('cartDrawer').classList.remove('open');
  $('cartDrawer').setAttribute('aria-hidden','true');
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

function updateCheckoutTotals(){
  const subtotal=total();
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const fee=service==='delivery'?selectedDeliveryFee:0;
  const finalTotal=subtotal+fee;

  if($('checkoutSubtotal'))$('checkoutSubtotal').textContent=money(subtotal);
  if($('checkoutTotal'))$('checkoutTotal').textContent=money(finalTotal);

  const cashBtn=$('cashPaymentButton');
  if(cashBtn){
    cashBtn.disabled=finalTotal>300;
    cashBtn.title=finalTotal>300?'Orders above ₱300 require GCash.':'';
  }

  let note=document.getElementById('paymentLimitNote');
  if(finalTotal>300){
    if(!note){
      note=document.createElement('div');
      note.id='paymentLimitNote';
      note.className='payment-limit-note';
      document.querySelector('.payment-buttons')?.insertAdjacentElement('afterend',note);
    }
    note.textContent='Orders above ₱300 require GCash payment.';
    if(selectedPayment!=='gcash')setPayment('gcash');
  }else if(note){
    note.remove();
  }
}

function updateServiceFields(){
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const delivery=service==='delivery';
  $('deliveryAddressField').classList.toggle('hidden',!delivery);
  $('deliveryEta').classList.toggle('hidden',!delivery);

  if(delivery){
    $('notesLabel').textContent='Delivery notes (optional)';
    $('orderNotes').placeholder='Landmark, gate color, special instructions, etc.';
  }else{
    $('notesLabel').textContent='What time will you pick it up?';
    $('orderNotes').placeholder='Example: Around 7:30 PM';
    $('deliveryAddress').value='';
    if($('deliveryBarangay'))$('deliveryBarangay').value='';
    selectedDeliveryFee=0;
    $('deliveryFeePreview')?.classList.add('hidden');
    $('deliveryFeeRow')?.classList.add('hidden');
  }
  updateCheckoutTotals();
}

function setPayment(method){
  const finalTotal=total()+((document.querySelector('input[name="serviceType"]:checked')?.value||'pickup')==='delivery'?selectedDeliveryFee:0);
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
}

async function placeOrder(){
  const customerName=$('customerName').value.trim();
  const contact=$('contactNumber').value.trim();
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const barangay=$('deliveryBarangay')?.value||'';
  const address=$('deliveryAddress').value.trim();
  const payment=selectedPayment;
  let notes=$('orderNotes').value.trim();
  const cashAmount=Number($('cashAmount')?.value||0);
  const requested=null;

  if(payment==='cash'){
    if(!cashAmount||cashAmount<(total()+(service==='delivery'?selectedDeliveryFee:0)))return toast('Please enter enough cash for the order total.');
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
      p_items:cart.map(x=>({
        productId:x.productId,
        name:x.name,
        category:x.category,
        type:x.type,
        size:x.size,
        sweetness:x.sweetness,
        flavor:x.flavor,
        qty:x.qty
      }))
    });

    cart=[];
    saveCart();
    renderCart();
    $('checkoutDialog').close();

    $('successOrderNo').textContent=`Online #${result.orderNumber}`;
    $('successText').textContent=result.serviceType==='delivery'
      ? `Your delivery order totaling ${money(result.total)} has been sent. Kape Bar-Rio will use your contact number to confirm delivery details.`
      : `Your pickup order totaling ${money(result.total)} has been sent to Kape Bar-Rio.`;
    $('successDialog').showModal();
  }catch(error){
    toast(error.message||'Could not send your order.');
  }finally{
    button.disabled=false;
    button.textContent='Send order';
  }
}

async function loadMenu(){
  try{
    const snapshot=await rpc('kbr_online_menu_snapshot');
    menu=Array.isArray(snapshot?.items)?snapshot.items:[];
    const tabs=categories();
    if(!tabs.includes(category))category=tabs[0]||'Frappe & Smoothies';
    $('shopStatus').textContent=snapshot?.shopOpen
      ? 'Open now · online ordering available'
      : 'Shop is currently closed · menu browsing only';
    $('shopStatus').className=`shop-status ${snapshot?.shopOpen?'open':'closed'}`;
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

$('cartButton')?.addEventListener('click',openCart);
document.querySelectorAll('[data-close-cart]').forEach(el=>el.addEventListener('click',closeCart));
$('checkoutButton')?.addEventListener('click',()=>{
  if(!cart.length)return;
  closeCart();
  updateCheckoutTotals();
  updateServiceFields();
  $('checkoutDialog').showModal();
});
$('addToCartButton')?.addEventListener('click',e=>{e.preventDefault();addSelected()});
$('qtyMinus')?.addEventListener('click',()=>{$('qtyInput').value=Math.max(1,Number($('qtyInput').value||1)-1)});
$('qtyPlus')?.addEventListener('click',()=>{$('qtyInput').value=Math.min(20,Number($('qtyInput').value||1)+1)});
document.querySelectorAll('input[name="serviceType"]').forEach(el=>el.addEventListener('change',updateServiceFields));
$('deliveryBarangay')?.addEventListener('change',updateDeliveryFee);
$('cashPaymentButton')?.addEventListener('click',()=>setPayment('cash'));
$('gcashPaymentButton')?.addEventListener('click',()=>setPayment('gcash'));
$('placeOrderButton')?.addEventListener('click',e=>{e.preventDefault();placeOrder()});
$('successClose')?.addEventListener('click',()=>$('successDialog')?.close());

loadCart();
renderCart();
setPayment('cash');
loadDeliveryZones();
loadMenu();
