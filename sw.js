const PRODUCTS = [{"category": "Milk Tea Series", "name": "Matcha Milk Tea", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Blueberry Milk Tea", "prices": [49, 59, 79], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Taro Milk Tea", "prices": [49, 59, 79], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Caramel Brown Sugar", "prices": [49, 59, 79], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Strawberry Milk Tea", "prices": [49, 59, 79], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Okinawa Milk Tea", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Wintermelon Milk Tea", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Black Forest Choco", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Cookies and Cream", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "White Bunny Milk Tea", "prices": [49, 59, 79], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Red Matcha Milk Tea", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Green Taro MilkTea", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Blue-ish Red MilkTea", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Milk Tea Series", "name": "Dirty Taro MilkTea", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "Caramel Macchiato", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [119, 139], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Vanilla Latte", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [109, 129], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Caramel Latte", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [109, 129], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Iced Mocha Latte", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [109, 129], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Dirty Matcha", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [119, 139], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Spanish Latte", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": [119, 139], "premiumSizes": ["16 oz", "22 oz"]}, {"category": "Coffee Series", "name": "Dirty Taro", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "Americano", "prices": [89, 109], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "Cappuccino", "prices": [99, 119], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "Oreo Coffee", "prices": [79, 89, 109], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "Frappuccino", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Coffee Series", "name": "FrapMacchiato", "prices": [89, 99, 119], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Matcha Milk Tea", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Matcha Latte", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Green Taro", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Red Matcha", "prices": [69, 79, 99], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Dirty Matcha", "prices": [59, 69, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Familia De Verde", "prices": [99, 109, 129], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Matcha Frappe", "prices": [99, 109, 129], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Matcha Latte (Premium)", "prices": [109, 129], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Dirty Matcha (Premium)", "prices": [119, 139], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Cracking Matcha", "prices": [129, 159], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Nutella Matcha", "prices": [129, 159], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Mango Matcha", "prices": [129, 159], "sizes": ["16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Matcha Series", "name": "Oreo Matcha", "prices": [79, 89, 109], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Four Seasons", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Green Apple", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Blue Lemonade", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Blueberry", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Strawberry", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Soda", "name": "Lychee", "prices": [39, 49, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Floats", "name": "Coke Float", "prices": [49, 59, 69], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Floats", "name": "Dutchmill Float", "prices": [69, 79, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Floats", "name": "Chuckie Float", "prices": [69, 79, 89], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Frappe Macchiato", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Frappuccino", "prices": [89, 99, 119], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Cookies de Crema", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Mekus de Berries", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Frappe de Choco", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Frappe de Taro", "prices": [89, 99, 119], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Matcha Frappe", "prices": [99, 109, 129], "sizes": ["12 oz", "16 oz", "22 oz"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Mango Smoothie", "prices": [99, 109, 129], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Frappe & Smoothies", "name": "Familia de Verde", "prices": [99, 109, 129], "sizes": ["16 oz w/o ice cream", "16 oz w/ ice cream", "22 oz w/ ice cream"], "premium": null, "premiumSizes": null}, {"category": "Snackies", "name": "Fries", "prices": [70, 150], "sizes": ["Solo", "Barkada"], "premium": null, "premiumSizes": null, "food": true}, {"category": "Snackies", "name": "Shiang hai", "prices": [100], "sizes": ["10 pcs"], "premium": null, "premiumSizes": null, "food": true}, {"category": "Snackies", "name": "Siomai", "prices": [5], "sizes": ["1 pc"], "premium": null, "premiumSizes": null, "food": true}, {"category": "Snackies", "name": "Nachos", "prices": [100], "sizes": ["1 order"], "premium": null, "premiumSizes": null, "food": true}];

const SIZE_DEFAULT = ["12 oz", "16 oz", "22 oz"];
const CATEGORY_LABELS = {
  "Milk Tea Series":"Milk Tea",
  "Coffee Series":"Coffee Drinks",
  "Matcha Series":"Matcha Drinks",
  "Soda":"Fruit Soda Series",
  "Floats":"Floats",
  "Frappe & Smoothies":"Frappe & Smoothies",
  "Snackies":"Snackies"
};

const PRODUCT_IMAGES = {
  "Matcha Milk Tea":"images/matcha-milk-tea.jpg",
  "Blueberry Milk Tea":"images/blueberry-milk-tea.jpg",
  "Taro Milk Tea":"images/taro-milk-tea.jpg",
  "Caramel Brown Sugar":"images/caramel-brown-sugar.jpg",
  "Strawberry Milk Tea":"images/strawberry-milk-tea.jpg",
  "Okinawa Milk Tea":"images/okinawa-milk-tea.jpg",
  "Wintermelon Milk Tea":"images/wintermelon-milk-tea.jpg",
  "Black Forest Choco":"images/black-forest-choco.jpg",
  "Cookies and Cream":"images/cookies-and-cream.jpg",
  "White Bunny Milk Tea":"images/white-bunny-milk-tea.jpg",
  "Red Matcha Milk Tea":"images/red-matcha-milk-tea.jpg",
  "Green Taro MilkTea":"images/green-taro-milktea.jpg",
  "Blue-ish Red MilkTea":"images/blue-ish-red-milktea.jpg",
  "Dirty Taro MilkTea":"images/dirty-taro-milktea.jpg",
  "Caramel Macchiato":"images/caramel-macchiato.jpg",
  "Vanilla Latte":"images/vanilla-latte.jpg",
  "Caramel Latte":"images/caramel-latte.jpg",
  "Iced Mocha Latte":"images/iced-mocha-latte.jpg",
  "Dirty Matcha":"images/dirty-matcha.jpg",
  "Spanish Latte":"images/spanish-latte.jpg",
  "Dirty Taro":"images/dirty-taro.jpg",
  "Americano":"images/americano.jpg",
  "Cappuccino":"images/cappuccino.jpg",
  "Oreo Coffee":"images/oreo-coffee.jpg",
  "Frappuccino":"images/frappuccino.jpg",
  "FrapMacchiato":"images/frapmacchiato.jpg",
  "Matcha Latte":"images/matcha-latte.jpg",
  "Green Taro":"images/green-taro.jpg",
  "Red Matcha":"images/red-matcha.jpg",
  "Familia De Verde":"images/familia-de-verde.jpg",
  "Matcha Frappe":"images/matcha-frappe.jpg",
  "Matcha Latte (Premium)":"images/matcha-latte-premium.jpg",
  "Dirty Matcha (Premium)":"images/dirty-matcha-premium.jpg",
  "Cracking Matcha":"images/cracking-matcha.jpg",
  "Nutella Matcha":"images/nutella-matcha.jpg",
  "Mango Matcha":"images/mango-matcha.jpg",
  "Oreo Matcha":"images/oreo-matcha.jpg",
  "Four Seasons":"images/four-seasons.jpg",
  "Green Apple":"images/green-apple.jpg",
  "Blue Lemonade":"images/blue-lemonade.jpg",
  "Blueberry":"images/blueberry.jpg",
  "Strawberry":"images/strawberry.jpg",
  "Lychee":"images/lychee.jpg",
  "Coke Float":"images/coke-float.jpg",
  "Dutchmill Float":"images/dutchmill-float.jpg",
  "Chuckie Float":"images/chuckie-float.jpg",
  "Frappe Macchiato":"images/frappe-macchiato.jpg",
  "Cookies de Crema":"images/cookies-de-crema.jpg",
  "Mekus de Berries":"images/mekus-de-berries.jpg",
  "Frappe de Choco":"images/frappe-de-choco.jpg",
  "Frappe de Taro":"images/frappe-de-taro.jpg",
  "Mango Smoothie":"images/mango-smoothie.jpg",
  "Familia de Verde":"images/familia-de-verde.jpg",
  "Fries":"images/fries.jpg",
  "Shiang hai":"images/shiang-hai.jpg",
  "Siomai":"images/siomai.jpg",
  "Nachos":"images/nachos.jpg"
};

PRODUCTS.forEach(p=>{
  p.image=PRODUCT_IMAGES[p.name]||"";
});

const cats = [
  "Best Sellers",
  "Milk Tea Series",
  "Coffee Series",
  "Matcha Series",
  "Soda",
  "Floats",
  "Frappe & Smoothies",
  "Snackies"
];

const BEST_SELLERS = [
  "Frappe de Taro",
  "Matcha Frappe",
  "Frappe de Choco",
  "Wintermelon Milk Tea",
  "Taro Milk Tea",
  "Black Forest Choco",
  "Matcha Milk Tea",
  "Caramel Macchiato",
  "Matcha Latte",
  "Dirty Matcha",
  "Vanilla Latte",
  "Green Apple",
  "Strawberry",
  "Chuckie Float",
  "Dutchmill Float"
];

const money = n => Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
const peso = n => `₱${money(n)}`;

let category="Best Sellers";
let cart=JSON.parse(localStorage.getItem("kbr_cart")||"[]");
let history=JSON.parse(localStorage.getItem("kbr_history")||"[]");
let selected=null;
let swipeStartX=0;
let swipeStartY=0;
let swipeStartTime=0;

const products=document.getElementById("products");
const tabs=document.getElementById("tabs");
const cartBadge=document.getElementById("cartBadge");
const historyBadge=document.getElementById("historyBadge");
const orderDrawer=document.getElementById("orderDrawer");
const orderList=document.getElementById("orderList");
const cartDrawerTotal=document.getElementById("cartDrawerTotal");
const selector=document.getElementById("selector");
const selName=document.getElementById("selName");
const selImage=document.getElementById("selImage");
const selType=document.getElementById("selType");
const premiumWrap=document.getElementById("premiumWrap");
const typeOptions=document.getElementById("typeOptions");
const sizeOptions=document.getElementById("sizeOptions");
const selQty=document.getElementById("selQty");
const receiptDrawer=document.getElementById("receiptDrawer");
const receiptArea=document.getElementById("receiptArea");
const paymentSide=document.getElementById("paymentSide");
const historyDrawer=document.getElementById("historyDrawer");
const historyList=document.getElementById("historyList");
const menuToast=document.getElementById("menuToast");

function displayProductsForCategory(cat){
  if(cat==="Best Sellers"){
    return BEST_SELLERS
      .map(name=>PRODUCTS.find(p=>p.name===name))
      .filter(Boolean);
  }
  return PRODUCTS.filter(p=>p.category===cat);
}

function renderTabs(){
  tabs.innerHTML=cats.map(c=>{
    const active=c===category?"active":"";
    return `<button class="${active}" onclick="setCategory('${c.replace(/'/g,"\\'")}')">${CATEGORY_LABELS[c]||c}</button>`;
  }).join("");
}

function render(){
  renderTabs();

  const list=displayProductsForCategory(category);

  products.innerHTML=list.map(p=>{
    const image=p.image?`<img src="${p.image}" alt="${p.name}" loading="lazy">`:"";
    return `<button class="product-card" onclick="chooseProduct(PRODUCTS.find(x=>x===PRODUCTS[${PRODUCTS.indexOf(p)}]))">
      ${image}
      <div class="product-name">${p.name}</div>
    </button>`;
  }).join("");

  updateCartBar();
}

function setCategory(c){
  category=c;
  render();
}

function showMenuToast(name){
  const label=CATEGORY_LABELS[name]||name;
  menuToast.textContent=label;
  menuToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>menuToast.classList.remove("show"),1200);
}

let toastTimer;

function goToCategory(direction){
  const current=cats.indexOf(category);
  if(current<0) return;

  const next=(current+direction+cats.length)%cats.length;
  if(next===current) return;

  const cls=direction>0?'swipe-out-left':'swipe-out-right';
  products.classList.add(cls);

  setTimeout(()=>{
    category=cats[next];
    render();
    products.classList.remove(cls);
    showMenuToast(category);

    const activeTab=[...tabs.querySelectorAll('button')][next];
    activeTab?.scrollIntoView({
      behavior:'smooth',
      block:'nearest',
      inline:'center'
    });
  },120);
}

products.addEventListener('touchstart',e=>{
  if(e.touches.length!==1) return;
  swipeStartX=e.touches[0].clientX;
  swipeStartY=e.touches[0].clientY;
  swipeStartTime=Date.now();
},{passive:true});

products.addEventListener('touchend',e=>{
  if(!swipeStartTime || e.changedTouches.length!==1) return;

  const dx=e.changedTouches[0].clientX-swipeStartX;
  const dy=e.changedTouches[0].clientY-swipeStartY;
  const dt=Date.now()-swipeStartTime;

  swipeStartTime=0;

  if(dt>700 || Math.abs(dx)<70 || Math.abs(dx)<Math.abs(dy)*1.35) return;

  goToCategory(dx<0?1:-1);
},{passive:true});

function chooseProduct(p){
  selected={
    p,
    type:p.premium?'premium':'standard',
    sizeIndex:0,
    qty:1
  };

  selName.textContent=p.name;
  selImage.src=p.image||"";
  selImage.alt=p.name;
  selImage.style.display=p.image?"block":"none";

  premiumWrap.style.display=p.premium?'block':'none';

  if(p.premium){
    renderTypes();
  }else{
    selType.textContent="Select size";
  }

  renderSizes();
  selQty.textContent=1;
  selector.classList.add("open");
}

function renderTypes(){
  const isMatcha=selected.p.category==='Matcha Series';

  typeOptions.innerHTML=`
    <button class="opt type-option premium ${selected.type==='premium'?'selected':''}" onclick="selected.type='premium';renderTypes();renderSizes()">
      🫘 Premium
      <small>${isMatcha?'Ceremonial grade':'Beans · ground & extracted'}</small>
    </button>

    <button class="opt type-option ${selected.type==='budget'?'selected':''}" onclick="selected.type='budget';renderTypes();renderSizes()">
      Budget
      <small>${isMatcha?'Milky Matcha':'Syrup-based'}</small>
    </button>`;
}

function renderSizes(){
  const p=selected.p;

  const sizes=
    selected.type==='premium'&&p.premiumSizes
      ?p.premiumSizes
      :(p.sizes||SIZE_DEFAULT);

  const prices=
    selected.type==='premium'
      ?p.premium
      :p.prices;

  selected.sizeIndex=Math.min(
    selected.sizeIndex,
    prices.length-1
  );

  sizeOptions.innerHTML=sizes.map((s,i)=>
    `<button class="opt ${i===selected.sizeIndex?'selected':''}" onclick="selected.sizeIndex=${i};renderSizes()">
      ${s}
      <span>${peso(prices[i])}</span>
    </button>`
  ).join("");

  selType.textContent=
    selected.type==='premium'
      ?'Premium'
      :'Budget / Standard';
}

function changeQty(d){
  selected.qty=Math.max(1,selected.qty+d);
  selQty.textContent=selected.qty;
}

function addSelected(){
  const p=selected.p;

  const sizes=
    selected.type==='premium'&&p.premiumSizes
      ?p.premiumSizes
      :(p.sizes||SIZE_DEFAULT);

  const prices=
    selected.type==='premium'
      ?p.premium
      :p.prices;

  const item={
    name:p.name,
    category:p.category,
    type:selected.type,
    size:sizes[selected.sizeIndex],
    price:prices[selected.sizeIndex],
    qty:selected.qty
  };

  const key=JSON.stringify([
    item.name,
    item.type,
    item.size,
    item.price
  ]);

  const old=cart.find(x=>x.key===key);

  if(old){
    old.qty+=item.qty;
  }else{
    item.key=key;
    cart.push(item);
  }

  persist();
  closeSelector();
  render();
  animateToCart(p.image);
}

function animateToCart(src){
  if(!src) return;

  const target=document.querySelector('.floating-cart');
  if(!target) return;

  const img=document.createElement('img');
  img.src=src;
  img.className='cart-fly-img';

  document.body.appendChild(img);

  const rect=target.getBoundingClientRect();

  img.style.left=(window.innerWidth/2-38)+'px';
  img.style.top=(window.innerHeight/2-38)+'px';

  requestAnimationFrame(()=>{
    img.style.left=(rect.left+rect.width/2-22)+'px';
    img.style.top=(rect.top+rect.height/2-22)+'px';
    img.classList.add('fly');
  });

  setTimeout(()=>img.remove(),650);
}

function persist(){
  localStorage.setItem("kbr_cart",JSON.stringify(cart));
}

function updateCartBar(){
  const count=cart.reduce((s,x)=>s+x.qty,0);

  cartBadge.textContent=
    count>99?'99+':String(count);

  cartBadge.style.display=count?'flex':'none';

  historyBadge.textContent=
    history.length>99?'99+':String(history.length);

  historyBadge.style.display=
    history.length?'flex':'none';
}

function persistHistory(){
  localStorage.setItem(
    "kbr_history",
    JSON.stringify(history)
  );

  updateCartBar();
}

function saveTransactionToHistory(receipt){
  history.unshift(
    JSON.parse(JSON.stringify(receipt))
  );

  if(history.length>200){
    history=history.slice(0,200);
  }

  persistHistory();
}

const HISTORY_PASSCODE="0628";
const CLEAR_HISTORY_PASSCODE="2012";

function requestPasscode(label,expected){
  const value=prompt(
    label+"\nEnter 4-digit passcode:"
  );

  if(value===null) return false;

  if(value.trim()!==expected){
    alert("Incorrect passcode.");
    return false;
  }

  return true;
}

function openHistory(){
  if(!requestPasscode(
    "Transaction History",
    HISTORY_PASSCODE
  )) return;

  renderHistory();
  historyDrawer.classList.add("open");
}

function closeHistory(){
  historyDrawer.classList.remove("open");
}

function renderHistory(){
  if(!history.length){
    historyList.innerHTML=
      '<div class="history-empty">No transactions yet.<br>Completed orders will appear here.</div>';
    return;
  }

  historyList.innerHTML=history.map((r,i)=>{
    const summary=r.items
      .map(x=>`${x.qty}× ${x.name} (${x.size})`)
      .join('<br>');

    return `
      <div class="history-item">
        <div class="history-head">
          <div>
            <b>Order #${r.no}</b>
            <div class="history-meta">${r.date} · ${r.time}</div>
          </div>
          <div class="history-total">${peso(r.total)}</div>
        </div>

        <div class="history-items">${summary}</div>

        <div class="history-actions">
          <button class="primary" onclick="saveHistoryReceipt(${i})">
            Save picture
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function clearHistory(){
  if(!history.length) return;

  if(!requestPasscode(
    "Clear transaction history",
    CLEAR_HISTORY_PASSCODE
  )) return;

  if(confirm(
    'Clear all transaction history from this iPad?'
  )){
    history=[];
    persistHistory();
    renderHistory();
  }
}

async function saveHistoryReceipt(index){
  const r=history[index];
  if(!r) return;

  try{
    await saveReceipt(r);
  }catch(err){
    console.error(
      'History receipt save failed',
      err
    );

    alert(
      'Could not save the receipt picture. Please try again.'
    );
  }
}

function changeCartQty(i,d){
  cart[i].qty=Math.max(
    0,
    cart[i].qty+d
  );

  if(cart[i].qty===0){
    cart.splice(i,1);
  }

  persist();
  render();
  renderOrder();
}

function openOrder(){
  renderOrder();
  orderDrawer.classList.add("open");
}

function closeOrder(){
  orderDrawer.classList.remove("open");
}

function renderOrder(){
  const total=cart.reduce(
    (s,x)=>s+x.qty*x.price,
    0
  );

  cartDrawerTotal.innerHTML=
    `<span>Total</span><b>${peso(total)}</b>`;

  if(!cart.length){
    orderList.innerHTML=
      '<div class="empty">Your cart is empty.<br>Add a drink to get started.</div>';
    return;
  }

  orderList.innerHTML=cart.map((x,i)=>
    `<div class="order-item">
      <div class="desc">
        <b>${x.name}</b><br>
        <small>
          ${x.type!=='standard'?x.type+' · ':''}
          ${x.size} · ${peso(x.price)} each
        </small>

        <div class="order-qty">
          <button onclick="changeCartQty(${i},-1)">−</button>
          <b>${x.qty}</b>
          <button onclick="changeCartQty(${i},1)">+</button>
        </div>
      </div>

      <strong>${peso(x.price*x.qty)}</strong>
    </div>`
  ).join("");
}

function clearOrder(){
  if(confirm("Clear this order?")){
    cart=[];
    persist();
    render();
    renderOrder();
  }
}

function closeSelector(){
  selector.classList.remove("open");
}

function closeReceipt(){
  receiptDrawer.classList.remove("open");
}

function orderNumber(){
  let n=
    Number(localStorage.getItem("kbr_order_no")||0)+1;

  localStorage.setItem(
    "kbr_order_no",
    String(n)
  );

  return String(n).padStart(5,"0");
}

let currentReceipt=null;

async function makeReceipt(){
  if(!cart.length){
    alert("Add at least one item.");
    return;
  }

  const no=orderNumber();
  const now=new Date();

  const total=cart.reduce(
    (s,x)=>s+x.qty*x.price,
    0
  );

  const date=now.toLocaleDateString(
    "en-PH",
    {
      year:"numeric",
      month:"short",
      day:"numeric"
    }
  );

  const time=now.toLocaleTimeString(
    "en-PH",
    {
      hour:"numeric",
      minute:"2-digit"
    }
  );

  const orderedItems=[...cart].sort(
    (a,b)=>
      (a.category==='Snackies'?1:0)-
      (b.category==='Snackies'?1:0)
  );

  currentReceipt={
    no,
    date,
    time,
    total,
    items:JSON.parse(
      JSON.stringify(orderedItems)
    )
  };

  renderPaymentOptions();

  receiptArea.innerHTML=`
    <div id="receiptCanvas" class="receipt">
      <div class="center">
        <h3>KAPE' BAR-RIO</h3>
        <div>SHOP & CAFE</div>
        <div class="receipt-number">
          Order #${no}
        </div>
        <div>${date} · ${time}</div>
      </div>

      <hr>

      ${currentReceipt.items.map(x=>
        `<div class="receipt-line">
          <div class="item">
            ${x.qty}× ${x.name}<br>
            <small>
              ${x.type!=='standard'?x.type+' · ':''}
              ${x.size}
            </small>
          </div>
          <div>${peso(x.qty*x.price)}</div>
        </div>`
      ).join("")}

      <hr>

      <div class="receipt-line">
        <b>TOTAL</b>
        <b>${peso(total)}</b>
      </div>

      <hr>

      <div class="center">
        Thank you!
      </div>
    </div>
  `;

  closeOrder();
  receiptDrawer.classList.add("open");
}

async function saveReceipt(receipt=currentReceipt){
  if(!receipt) return;

  const el=document.getElementById(
    "receiptCanvas"
  );

  const receiptWidth=el
    ?Math.max(el.offsetWidth,420)
    :480;

  const receiptHeight=el
    ?Math.max(el.offsetHeight,260)
    :Math.max(
      260,
      220+(receipt.items.length*55)
    );

  const scale=2;
  const w=receiptWidth;
  const h=receiptHeight;

  const canvas=document.createElement("canvas");

  canvas.width=w*scale;
  canvas.height=h*scale;

  const ctx=canvas.getContext("2d");

  ctx.scale(scale,scale);
  ctx.fillStyle="#fff";
  ctx.fillRect(0,0,w,h);

  const centerLines=[
    "KAPE' BAR-RIO",
    "SHOP & CAFE",
    `Order #${receipt.no}`,
    `${receipt.date} · ${receipt.time}`
  ];

  let y=42;

  ctx.fillStyle="#111";
  ctx.textAlign="center";

  centerLines.forEach((line,i)=>{
    ctx.font=
      i===0
        ?"bold 28px monospace"
        :(i===2
          ?"bold 20px monospace"
          :"18px monospace");

    ctx.fillText(
      line,
      w/2,
      y
    );

    y+=30;
  });

  y+=8;

  ctx.textAlign="left";

  receipt.items.forEach(x=>{
    ctx.font="18px monospace";

    ctx.fillText(
      `${x.qty}× ${x.name}`,
      28,
      y
    );

    ctx.textAlign="right";

    ctx.fillText(
      peso(x.qty*x.price),
      w-28,
      y
    );

    ctx.textAlign="left";

    y+=27;

    ctx.font="15px monospace";

    ctx.fillText(
      `${x.type!=='standard'?x.type+' · ':''}${x.size}`,
      44,
      y
    );

    y+=28;
  });

  ctx.font="bold 20px monospace";

  ctx.fillText(
    "TOTAL",
    28,
    y
  );

  ctx.textAlign="right";

  ctx.fillText(
    peso(receipt.total),
    w-28,
    y
  );

  ctx.textAlign="center";

  y+=34;

  ctx.font="18px monospace";

  ctx.fillText(
    "Thank you!",
    w/2,
    y
  );

  const finalCanvas=
    document.createElement("canvas");

  finalCanvas.width=w*scale;
  finalCanvas.height=
    Math.ceil((y+28)*scale);

  const fctx=
    finalCanvas.getContext("2d");

  fctx.drawImage(
    canvas,
    0,
    0
  );

  const dataUrl=
    finalCanvas.toDataURL("image/png");

  const byteString=
    atob(dataUrl.split(",")[1]);

  const bytes=
    new Uint8Array(
      byteString.length
    );

  for(
    let i=0;
    i<byteString.length;
    i++
  ){
    bytes[i]=byteString.charCodeAt(i);
  }

  const file=
    new File(
      [bytes],
      `Kape-Bar-Rio-Receipt-${receipt.no}.png`,
      {type:"image/png"}
    );

  const isStandalone=
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    window.navigator.standalone===true;

  if(
    isStandalone &&
    navigator.share &&
    (!navigator.canShare ||
      navigator.canShare({files:[file]}))
  ){
    try{
      await navigator.share({
        title:
          `Kape' Bar-Rio Receipt #${receipt.no}`,
        files:[file]
      });

      return;
    }catch(err){
      if(
        err &&
        err.name==='AbortError'
      ){
        return;
      }
    }
  }

  const url=
    URL.createObjectURL(file);

  const a=
    document.createElement("a");

  a.href=url;
  a.download=file.name;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(
    ()=>URL.revokeObjectURL(url),
    1500
  );
}


/* =========================
   PAYMENT FLOW
   ========================= */

let selectedPayment='';

function renderPaymentOptions(){
  paymentSide.innerHTML=`
    <h2 class="payment-title">
      Payment
    </h2>

    <div class="payment-sub">
      Choose how you would like to pay.
    </div>

    <div class="payment-options">

      <button
        class="payment-choice"
        onclick="showCashPayment()">
        💵 Pay cash at the counter
      </button>

      <button
        class="payment-choice gcash-choice"
        onclick="showGcashPayment()">
        📱 Pay thru GCash
      </button>

      <!-- NEW:
           Go back without losing the current cart -->
      <button
        class="payment-back"
        onclick="continueOrdering()">
        ← Continue adding drinks or food
      </button>

    </div>
  `;
}


/* Go back from payment to the cart/order panel.
   Nothing is deleted and the current order remains. */
function continueOrdering(){
  closeReceipt();
  renderOrder();
  openOrder();
}


/* Finish the payment:
   - save transaction
   - clear cart
   - close payment panel */
function finishPayment(){
  if(!currentReceipt) return;

  saveTransactionToHistory(
    currentReceipt
  );

  cart=[];

  persist();
  render();
  renderOrder();

  closeReceipt();
}


/* CASH PAYMENT
   Only the Close button is shown after
   the customer reaches the cash payment screen. */
function showCashPayment(){
  selectedPayment='cash';

  paymentSide.innerHTML=`
    <h2 class="payment-title">
      Cash Payment
    </h2>

    <div class="payment-total">
      <span>Total</span>
      <b>${peso(currentReceipt?.total||0)}</b>
    </div>

    <div class="cash-note">
      Please pay cash at the counter.<br>
      After payment, show this receipt at the counter.
    </div>

    <button
      class="payment-choice"
      onclick="finishPayment()">
      Close
    </button>
  `;
}


/* GCASH PAYMENT
   Only the Close button is shown after
   the customer finishes paying. */
function showGcashPayment(){
  selectedPayment='gcash';

  paymentSide.innerHTML=`
    <h2 class="payment-title">
      GCash Payment
    </h2>

    <div class="payment-total">
      <span>Total Amount</span>
      <b>${peso(currentReceipt?.total||0)}</b>
    </div>

    <img
      class="gcash-card"
      src="images/gcash-card.png"
      alt="GCash QR code">

    <div class="gcash-number">
      GCash Number: 09672365176
    </div>

    <div class="gcash-help">
      Scan the QR code or send the exact total
      to this GCash number.
    </div>

    <div class="show-receipt-note">
      After payment, please show your GCash
      receipt at the counter.
    </div>

    <button
      class="payment-choice"
      onclick="finishPayment()">
      Close
    </button>
  `;
}


function selectPayment(method){
  if(method==='gcash'){
    showGcashPayment();
  }else{
    showCashPayment();
  }
}


/* Kept for compatibility with the existing HTML. */
function payAtCounter(){
  closeReceipt();
}


if("serviceWorker" in navigator){
  window.addEventListener(
    "load",
    ()=>{
      navigator.serviceWorker
        .register("sw.js")
        .catch(()=>{});
    }
  );
}

render();
