
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
function renderRewardItems(items){
  const indexed=items.map((item,index)=>({item,index}));
  const filtered=indexed.filter(x=>x.item.category===rewardCategory)
    .sort((a,b)=>{
      if(rewardCategory==='Frappe & Smoothies'){
        if(Number(b.item.price)!==Number(a.item.price))return Number(b.item.price)-Number(a.item.price);
        return b.index-a.index;
      }
      return a.index-b.index;
    }).map(x=>x.item);

  $('rewardCategoryTitle').textContent=categoryLabel(rewardCategory);
  $('rewardEmpty').classList.toggle('hidden',filtered.length>0);
  $('rewardGrid').innerHTML=filtered.map(item=>`
    <article class="reward-card">
      <img src="${attr(resolveImage(item.image))}" alt="${attr(item.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="reward-card-body">
        <h3>${esc(item.name)}</h3>
        <div class="reward-meta">${esc(item.size)}</div>
        <div class="reward-price">${money(item.price)}</div>
        <span class="eligible-badge">Eligible with points</span>
      </div>
    </article>
  `).join('');
}
function renderRewards(snapshot){
  $('pointsBalance').textContent=Number(snapshot?.points||0).toLocaleString('en-PH');
  $('rewardValue').textContent=money(snapshot?.rewardValue||0);
  const eligible=Array.isArray(snapshot?.eligible)?snapshot.eligible:[];
  renderRewardCategories(eligible);
  renderRewardItems(eligible);
}

async function loadRewards(){
  const {data}=await authClient.auth.getSession();
  session=data?.session||null;

  if(!session?.user){
    window.location.href='./online.html';
    return;
  }

  try{
    const snapshot=await rpc('kbr_customer_rewards_snapshot',{});
    renderRewards(snapshot);
  }catch(error){
    toast(error.message||'Could not load rewards.');
  }
}

$('backButton').addEventListener('click',()=>window.location.href='./online.html');
loadRewards();
