
const SUPABASE_URL='https://wkyyuyyfauyhpivebrdg.supabase.co';
const SUPABASE_KEY='sb_publishable_AXZtXN81wyM_W7tVZuJ-zw_ohoaj-1M';

let menu=[];
let category='Frappe & Smoothies';
let cart=[];
let selected=null;
let selectedType='standard';

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
    <article class="menu-card">
      <img src="${attr(resolveImage(item))}" alt="${attr(item.name)}" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="menu-card-body">
        <h3>${esc(item.name||'')}</h3>
        <div class="menu-card-footer">
          <button type="button" class="add-button" data-product="${attr(item.productId||item.name)}">Add</button>
        </div>
      </div>
    </article>
  `).join('');

  $('menuGrid').querySelectorAll('[data-product]').forEach(btn=>{
    btn.addEventListener('click',()=>openItem(btn.dataset.product));
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
  const sweetness=$('sweetnessField').classList.contains('hidden')?'':$('sweetnessSelect').value;
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
  $('itemDialog').close();
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
  $('checkoutTotal').textContent=money(total());
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

function updateServiceFields(){
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const delivery=service==='delivery';
  $('deliveryAddressField').classList.toggle('hidden',!delivery);
  $('deliveryNote').classList.toggle('hidden',!delivery);
  $('timeLabel').textContent=delivery?'Preferred delivery time (optional)':'Preferred pickup time (optional)';
  if(!delivery)$('deliveryAddress').value='';
}

async function placeOrder(){
  const customerName=$('customerName').value.trim();
  const contact=$('contactNumber').value.trim();
  const service=document.querySelector('input[name="serviceType"]:checked')?.value||'pickup';
  const address=$('deliveryAddress').value.trim();
  const payment=document.querySelector('input[name="paymentMethod"]:checked')?.value||'cash';
  const notes=$('orderNotes').value.trim();
  const requested=$('requestedTime').value?new Date($('requestedTime').value).toISOString():null;

  if(customerName.length<2)return toast('Please enter your name.');
  if(contact.replace(/\D/g,'').length<7)return toast('Please enter a valid contact number.');
  if(service==='delivery'&&address.length<5)return toast('Please enter your delivery address.');
  if(!cart.length)return toast('Your cart is empty.');

  const button=$('placeOrderButton');
  button.disabled=true;
  button.textContent='Sending order…';

  try{
    const result=await rpc('kbr_create_online_order',{
      p_customer_name:customerName,
      p_phone:contact,
      p_service_type:service,
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

$('cartButton')?.addEventListener('click',openCart);
document.querySelectorAll('[data-close-cart]').forEach(el=>el.addEventListener('click',closeCart));
$('checkoutButton')?.addEventListener('click',()=>{
  if(!cart.length)return;
  closeCart();
  $('checkoutTotal').textContent=money(total());
  updateServiceFields();
  $('checkoutDialog').showModal();
});
$('addToCartButton')?.addEventListener('click',e=>{e.preventDefault();addSelected()});
$('qtyMinus')?.addEventListener('click',()=>{$('qtyInput').value=Math.max(1,Number($('qtyInput').value||1)-1)});
$('qtyPlus')?.addEventListener('click',()=>{$('qtyInput').value=Math.min(20,Number($('qtyInput').value||1)+1)});
document.querySelectorAll('input[name="serviceType"]').forEach(el=>el.addEventListener('change',updateServiceFields));
$('placeOrderButton')?.addEventListener('click',e=>{e.preventDefault();placeOrder()});
$('successClose')?.addEventListener('click',()=>$('successDialog')?.close());

loadCart();
renderCart();
loadMenu();
