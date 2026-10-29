
const SUPABASE_URL='https://wkyyuyyfauyhpivebrdg.supabase.co';
const SUPABASE_KEY='sb_publishable_AXZtXN81wyM_W7tVZuJ-zw_ohoaj-1M';
const authClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
});

let session=null;
const $=id=>document.getElementById(id);
const money=v=>`₱${Number(v||0).toLocaleString('en-PH',{maximumFractionDigits:2})}`;

function esc(value=''){
  return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}
function attr(value=''){return esc(value)}

function resolveImage(raw=''){
  raw=String(raw||'').trim();
  if(!raw)return '';
  if(/^https?:\/\//i.test(raw)||raw.startsWith('data:'))return raw;
  if(raw.startsWith('./')||raw.startsWith('images/'))return raw;
  if(raw.startsWith('/'))return '.'+raw;
  return `images/${raw}`;
}

async function rpc(name,args={}){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{
      apikey:SUPABASE_KEY,
      Authorization:`Bearer ${session?.access_token||SUPABASE_KEY}`,
      'Content-Type':'application/json'
    },
    body:JSON.stringify(args)
  });
  const text=await response.text();
  let data=null;
  try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)throw new Error(data?.message||data?.details||'Request failed.');
  return data;
}

function toast(message){
  const el=$('toast');
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>el.classList.remove('show'),2200);
}


const CATEGORY_ORDER=['Frappe & Smoothies','Coffee Series','Matcha Series','Milk Tea Series','Soda','Floats','Snackies','Ice Cream'];
let rewardCategory='';
let rewardsSnapshot=null;

function categoryLabel(name){
  if(name==='Soda')return 'Fruit Soda';
  if(name==='Ice Cream')return 'Ice Creams';
  return name;
}
function rewardCategories(items){
  const present=new Set(items.map(x=>x.category).filter(Boolean));
  return CATEGORY_ORDER.filter(x=>present.has(x));
}
function renderRewardCategories(items){
  const cats=rewardCategories(items);
  if(!cats.includes(rewardCategory))rewardCategory=cats[0]||'';
  $('rewardCategoryBar').innerHTML=cats.map(cat=>`
    <button class="reward-category-button ${cat===rewardCategory?'active':''}" data-reward-category="${attr(cat)}" type="button">${esc(categoryLabel(cat))}</button>
  `).join('');
  $('rewardCategoryBar').querySelectorAll('[data-reward-category]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      rewardCategory=btn.dataset.rewardCategory;
      renderRewardCategories(items);
      renderRewardItems(items);
    });
  });
}

function rewardsGroupedCartCount(){
  return rewardCart().length;
}


function availableRewardPoints(){
  const raw=Number(rewardsSnapshot?.points||0);
  const reserved=rewardPointsReserved();
  return Math.max(0,raw-reserved);
}

function updateRewardsHeader(){
  const raw=Number(rewardsSnapshot?.points||0);
  const reserved=rewardPointsReserved();
  const available=Math.max(0,raw-reserved);
  const count=rewardsGroupedCartCount();

  if($('rewardsHeaderPoints'))$('rewardsHeaderPoints').textContent=available.toLocaleString('en-PH');
  if($('pointsBalance'))$('pointsBalance').textContent=available.toLocaleString('en-PH');
  if($('rewardValue'))$('rewardValue').textContent=money(Math.floor(available/1000)*50);
  if($('rewardsCartCount'))$('rewardsCartCount').textContent=String(count);
}
function animateRewardToCart(card,onArrive){
  const img=card?.querySelector('img');
  const cartButton=$('rewardsCartButton');
  if(!img||!cartButton||!img.src){
    onArrive?.();
    return;
  }

  const src=img.getBoundingClientRect();
  const dst=cartButton.getBoundingClientRect();

  const flyer=document.createElement('img');
  flyer.src=img.src;
  flyer.className='reward-fly-to-cart';
  Object.assign(flyer.style,{
    left:`${src.left}px`,
    top:`${src.top}px`,
    width:`${src.width}px`,
    height:`${src.height}px`,
    transform:'translate3d(0,0,0) scale(1)',
    opacity:'1'
  });
  document.body.appendChild(flyer);

  const x=(dst.left+dst.width/2)-(src.left+src.width/2);
  const y=(dst.top+dst.height/2)-(src.top+src.height/2);

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      flyer.style.transform=`translate3d(${x}px,${y}px,0) scale(.12)`;
      flyer.style.opacity='.18';
    });
  });

  let finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;
    flyer.remove();

    cartButton.classList.remove('rewards-cart-bump');
    void cartButton.offsetWidth;
    cartButton.classList.add('rewards-cart-bump');

    onArrive?.();
  };

  flyer.addEventListener('transitionend',finish,{once:true});
  setTimeout(finish,800);
}

function rewardCart(){
  try{
    const value=JSON.parse(localStorage.getItem('kbr_online_cart_v2')||'[]');
    return Array.isArray(value)?value:[];
  }catch{return []}
}
function rewardPointsReserved(cart=rewardCart()){
  const safeCart=Array.isArray(cart)?cart:[];
  return safeCart.reduce((sum,item)=>
    sum + (item?.paidByPoints ? Number(item.rewardPointsCost||0)*Number(item.qty||0) : 0)
  ,0);
}

function addRewardToCart(item,card){
  const cart=rewardCart();
  const pointCost=Number(item.pointCost||0);
  const available=availableRewardPoints();

  if(pointCost<=0)return toast('Reward price is unavailable.');
  if(pointCost>available)return toast('You do not have enough available KBR Points.');

  // Prevent double taps while the drink is flying.
  if(card?.dataset.flying==='1')return;
  if(card)card.dataset.flying='1';

  animateRewardToCart(card,()=>{
    const latestCart=rewardCart();
    const latestAvailable=Math.max(
      0,
      Number(rewardsSnapshot?.points||0)-rewardPointsReserved(latestCart)
    );

    if(pointCost>latestAvailable){
      if(card)card.dataset.flying='';
      toast('You do not have enough available KBR Points.');
      updateRewardsHeader();
      return;
    }

    const key=`reward|${item.productId}|${item.type||'standard'}|${item.size}`;
    const existing=latestCart.find(x=>x.key===key && x.paidByPoints===true);

    if(existing){
      existing.qty=Math.min(20,Number(existing.qty||1)+1);
    }else{
      latestCart.push({
        key,
        productId:item.productId||'',
        name:item.name,
        category:item.category,
        type:item.type||'standard',
        size:item.size,
        sweetness:'Normal Sugar',
        flavor:'',
        unitPrice:0,
        rewardOriginalPrice:Number(item.price||0),
        rewardPointsCost:pointCost,
        paidByPoints:true,
        qty:1
      });
    }

    localStorage.setItem('kbr_online_cart_v2',JSON.stringify(latestCart));
    if(card)card.dataset.flying='';

    updateRewardsHeader();
    renderRewardCategories(Array.isArray(rewardsSnapshot?.eligible)?rewardsSnapshot.eligible:[]);
    renderRewardItems(Array.isArray(rewardsSnapshot?.eligible)?rewardsSnapshot.eligible:[]);
    toast(`${item.name} ${item.size} added for ${pointCost.toLocaleString('en-PH')} points.`);
  });
}

function renderRewardItems(items){
  const available=availableRewardPoints();
  const indexed=items.map((item,index)=>({item,index}));
  const filtered=indexed
    .filter(x=>x.item.category===rewardCategory && Number(x.item.pointCost||0)<=available)
    .sort((a,b)=>{
      if(rewardCategory==='Frappe & Smoothies'){
        if(Number(b.item.price)!==Number(a.item.price))return Number(b.item.price)-Number(a.item.price);
        return b.index-a.index;
      }
      return a.item.name.localeCompare(b.item.name);
    }).map(x=>x.item);

  $('rewardCategoryTitle').textContent=categoryLabel(rewardCategory);
  $('rewardEmpty').classList.toggle('hidden',filtered.length>0);

  $('rewardGrid').innerHTML=filtered.map((item,index)=>`
    <article class="reward-card" data-reward-index="${index}" tabindex="0">
      <img src="${attr(resolveImage(item.image))}" alt="${attr(item.name)}" loading="lazy"
           onerror="this.style.visibility='hidden'">
      <div class="reward-card-body">
        <h3>${esc(item.name)}</h3>
        <div class="reward-meta">${esc(item.size)}${item.type==='premium'?' · Premium':''}</div>
        <div class="reward-point-price">${Number(item.pointCost||0).toLocaleString('en-PH')} pts</div>
        <span class="reward-tap-hint">Tap to add to cart</span>
      </div>
    </article>
  `).join('');

  $('rewardGrid').querySelectorAll('[data-reward-index]').forEach(card=>{
    const item=filtered[Number(card.dataset.rewardIndex)];
    card.addEventListener('click',()=>addRewardToCart(item,card));
    card.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){
        e.preventDefault();
        addRewardToCart(item,card);
      }
    });
  });
}
function renderRewards(snapshot){
  rewardsSnapshot=snapshot||{};
  updateRewardsHeader();
  $('pointsBalance').textContent=Number(snapshot?.points||0).toLocaleString('en-PH');
  $('rewardValue').textContent=money(snapshot?.rewardValue||0);
  const eligible=Array.isArray(snapshot?.eligible)?snapshot.eligible:[];
  renderRewardCategories(eligible);
  renderRewardItems(eligible);
}

async function loadRewards(){
  try{
    const {data,error}=await authClient.auth.getSession();
    if(error)throw error;

    session=data?.session||null;

    if(!session?.user){
      window.location.href='./online.html';
      return;
    }

    const snapshot=await rpc('kbr_customer_rewards_snapshot',{});
    renderRewards(snapshot);
  }catch(error){
    console.error('Rewards load failed',error);
    const empty=$('rewardEmpty');
    if(empty){
      empty.textContent='Could not load your rewards. Please return to Online Ordering and try again.';
      empty.classList.remove('hidden');
    }
    toast(error?.message||'Could not load rewards.');
  }
}


$('rewardsCartButton')?.addEventListener('click',()=>{
  window.location.href='./online.html#cart';
});
$('rewardsPointsButton')?.addEventListener('click',()=>{
  window.scrollTo({top:0,behavior:'smooth'});
});
$('rewardsAccountButton')?.addEventListener('click',()=>{
  window.location.href='./online.html#account';
});

$('backButton')?.addEventListener('click',()=>window.location.href='./online.html');
window.addEventListener('DOMContentLoaded',loadRewards);
