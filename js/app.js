let PRODUCTS = [];
let PARTNER = null;
let CACHED_DATA = null;
const CACHE_KEY = 'kantin_data';
const CACHE_EXPIRY = 3600000; // 1 hour


const STATE = {
  filter:'ALL',
  cart: JSON.parse(localStorage.getItem('cart')||'[]'),
  search:''
};

const grid = document.getElementById('grid');

init();

async function init(){
  renderSkeleton();
  bindEvents();
  updateCount();
  updateNavCount();
  
  // Load data
  Promise.all([loadPartner(), loadProducts()]).then(() => {
    renderFilter();
    render();
    updateUpsell();
  }).catch(err => {
    console.error('Load error:', err);
    toast('Error loading data, using cached/fallback');
    updateUpsell();
  });
  
  // Auto refresh
  setInterval(loadProducts, 30000);
}

async function loadPartner(){
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if(cached){
      const data = JSON.parse(cached);
      if(Date.now() - data.timestamp < CACHE_EXPIRY){
        PARTNER = data.partner;
        setHeader(PARTNER?.mitra_name || 'Kantin Digital');
        return;
      }
    }
    
    const res = await fetch('data/partners.json');
    const partners = await res.json();
    PARTNER = partners[0];
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      partner: PARTNER,
      timestamp: Date.now()
    }));
    setHeader(PARTNER.mitra_name);
  } catch(e){
    console.error('Partner load error:', e);
    setHeader('Kantin Digital');
  }
}

async function loadProducts(){
  try {
    renderSkeleton();
    const cached = localStorage.getItem(CACHE_KEY);
    if(cached){
      const data = JSON.parse(cached);
      if(Date.now() - data.timestamp < CACHE_EXPIRY && data.products){
        PRODUCTS = data.products;
        renderFilter();
        render();
        return;
      }
    }
    
    const res = await fetch('data/products.json');
    const rawProducts = await res.json();
    
    PRODUCTS = rawProducts.map(p => ({
      id: p.produk_id,
      name: p.produk_name,
      price: parseInt(p.produk_price.replace(/\./g,'')),
      kategori: p.produk_kategori,
      img: p.produk_image,
      stock: parseInt(p.produk_stock)
    })).filter(p => p.stock > 0 || true); // show all, even 0 stock
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      products: PRODUCTS,
      partner: PARTNER,
      timestamp: Date.now()
    }));
    
    renderFilter();
    render();
    updateUpsell();
  } catch(e){
    console.error('Products load error:', e);
    updateUpsell();
  }
}

function setHeader(name){
  const header = document.querySelector('header h1');
  if(header) header.textContent = name;
}

function bindEvents(){
  const searchInput = document.getElementById('searchInput');
  let debounceTimer;
  
  searchInput.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      STATE.search = e.target.value.toLowerCase();
      render();
    }, 300);
    
    // Show/hide clear button
    if (e.target.value) {
      if (!searchInput.nextElementSibling || !searchInput.nextElementSibling.classList.contains('clear-btn')) {
        const clearBtn = document.createElement('button');
        clearBtn.innerHTML = '❌';
        clearBtn.className = 'clear-btn absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-lg';
        clearBtn.onclick = () => {
          searchInput.value = '';
          STATE.search = '';
          render();
          searchInput.focus();
        };
        searchInput.parentNode.style.position = 'relative';
        searchInput.parentNode.appendChild(clearBtn);
      }
    } else {
      const clearBtn = searchInput.parentNode.querySelector('.clear-btn');
      if (clearBtn) clearBtn.remove();
    }
  });
}

function renderFilter(){
  const cats = ['ALL','MAKANAN','MINUMAN'];
  const el = document.getElementById('filterBar');
  el.innerHTML = cats.map(c=>`
    <button onclick="setFilter('${c}')" class="px-3 py-1 rounded-full text-xs ${STATE.filter===c?'bg-gold text-black shadow':'glass'}">${c}</button>
  `).join('');
}

function setFilter(f){ STATE.filter=f; renderFilter(); render(); }

function renderSkeleton(){
  grid.innerHTML = Array(4).fill(0).map(()=>`<div class="glass rounded-2xl h-44 skeleton"></div>`).join('');
}

function render(){
  let data = PRODUCTS
    .filter(p=>STATE.filter==='ALL'||p.kategori===STATE.filter)
    .filter(p=>p.name.toLowerCase().includes(STATE.search));

  if(!data.length){
    grid.innerHTML = `<p class="text-center col-span-2 text-gray-400">Produk tidak ditemukan</p>`;
    return;
  }

  grid.innerHTML = data.map((p,i)=>{
    const lowStock = p.stock <= 5;
    const outStock = p.stock <= 0;
    return `
      <div class="glass rounded-2xl overflow-hidden fade-in ripple card-fixed ${outStock ? 'opacity-50' : ''}">
        <div class="relative flex-shrink-0 h-[120px]">
          <img src="${p.img}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmM2YzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='" />
          ${lowStock ? '<span class="absolute top-2 left-2 bg-yellow-500 text-black text-[10px] px-2 py-1 rounded font-bold">Low Stock</span>' : ''}
          ${outStock ? '<span class="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold">Habis</span>' : ''}
        </div>
        <div class="card-content">
          <div>
            <p class="text-[10px] opacity-50 mb-1">${p.kategori}</p>
            <h2 class="product-name text-sm font-semibold">${p.name}</h2>
          </div>
          <div class="flex items-center justify-between text-xs mt-auto">
            <p class="text-gold font-bold">${rupiah(p.price)}</p>
            <span class="text-gray-400">Stok: ${p.stock}</span>
          </div>
          <button onclick="add(${i}, event)" 
            ${outStock ? 'disabled' : ''} 
            class="mt-3 w-full py-2.5 rounded-xl font-semibold premium-btn ${outStock ? 'opacity-50 cursor-not-allowed' : ''}">

            ${outStock ? 'Habis' : '+ Keranjang'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function add(i, e) {
  if (e) {
    // Ripple effect
    const btn = e.target.closest('.ripple');
    if (btn) {
      btn.classList.add('ripple-active');
      setTimeout(() => btn.classList.remove('ripple-active'), 600);
    }
    // Fly animation
    const img = btn.closest('.card-fixed').querySelector('img');
    if (img) {
      flyToCart(img);
    }
  }

  const item = PRODUCTS[i];
  if(item.stock <= 0){
    toast('Stok habis!');
    return;
  }
  const found = STATE.cart.find(x=>x.id===item.id);
  if(found){
    if(found.qty >= item.stock){
      toast('Stok tidak mencukupi!');
      return;
    }
    found.qty++;
  } else {
    STATE.cart.push({...item, qty:1});
  }
  persist();
  animateCart();
  toast('Ditambahkan ke keranjang!');
}

function flyToCart(img) {
  const clone = img.cloneNode(true);
  clone.classList.add('fly-item');
  clone.style.left = img.getBoundingClientRect().left + 'px';
  clone.style.top = img.getBoundingClientRect().top + 'px';
  document.body.appendChild(clone);
  
  // Animate to cart position
  requestAnimationFrame(() => {
    clone.classList.add('animate-fly');
  });
  
  setTimeout(() => {
    document.body.removeChild(clone);
  }, 600);
}

function animateCart(){
  const el = document.querySelector('[onclick="toggleCart(true)"]');
  el.classList.add('scale-110');
  setTimeout(()=>el.classList.remove('scale-110'),200);
}

function toggleCart(open){
  document.getElementById('cartModal').classList.toggle('hidden', !open);
  if(open) renderCart();
}

function renderCart(){
  let el = document.getElementById('cartItems');
  let total=0;

  if(!STATE.cart.length){
    document.getElementById('emptyCart').classList.remove('hidden');
    document.getElementById('upsell').classList.add('hidden');
    el.innerHTML='';
    return;
  }

  document.getElementById('emptyCart').classList.add('hidden');
  document.getElementById('upsell').classList.remove('hidden');
  updateUpsellContent();

  el.innerHTML = STATE.cart.map((item,i)=>{
    total += item.price*item.qty;
    return `
    <div class='flex justify-between items-center text-sm py-2 border-b border-white/10'>
      <div>
        <p class='font-medium'>${item.name}</p>
        <p class='text-xs opacity-50'>${rupiah(item.price)}</p>
      </div>
      <div class='flex items-center gap-2'>
        <button class='bg-white/10 px-2 rounded' onclick="qty(${i},-1)">-</button>
        <span>${item.qty}</span>
        <button class='bg-white/10 px-2 rounded' onclick="qty(${i},1)">+</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('total').innerText = 'Total: '+rupiah(total);
}

function updateUpsellContent(){
  const content = document.getElementById('upsellContent');
  const btn = document.getElementById('upsellBtn');
  if(!upsellProduct || upsellProduct.stock <= 0){
    content.innerHTML = '<span class="text-gold text-lg">🔥</span><span class="font-medium">Tidak ada promo</span>';
    btn.disabled = true;
    return;
  }
  content.innerHTML = `
    <span class="text-gold text-lg">🔥</span>
    <span class="font-medium">${upsellProduct.name}</span>
    <span class="opacity-75">+${rupiah(upsellProduct.price)}</span>
  `;
  btn.disabled = false;
}

let upsellProduct = null;

function addUpsell(){
  if(upsellProduct && PRODUCTS.find(p => p.id === upsellProduct.id)){
    const idx = PRODUCTS.findIndex(p => p.id === upsellProduct.id);
    add(idx);
  }
}

function updateUpsell(){
  const minuman = PRODUCTS.find(p => p.kategori === 'MINUMAN' && p.stock > 0);
  upsellProduct = minuman;
}

function qty(i,n){
  STATE.cart[i].qty += n;
  if(STATE.cart[i].qty<=0) STATE.cart.splice(i,1);
  persist(); renderCart();
}

function persist(){
  localStorage.setItem('cart', JSON.stringify(STATE.cart));
  updateCount();
  updateNavCount();
}

function updateCount(){
  const count = STATE.cart.reduce((a,b)=>a+b.qty,0);
  const navCount = document.getElementById('navCount');
  if(count > 0) {
    navCount.innerText = count;
    navCount.classList.remove('hidden');
  } else {
    navCount.classList.add('hidden');
  }
}

function updateNavCount() {
  updateCount();
}

function goHome() {
  console.log('Go to Home');
  // Add active class logic if needed
}

function goTransaction() {
  alert('Fitur Transaksi akan segera hadir!');
}

function goAccount() {
  alert('Fitur Akun akan segera hadir!');
}

function checkout(){
  let text='Order:%0A';
  STATE.cart.forEach(i=> text+=`${i.name} x${i.qty}%0A`);
  window.open(`https://wa.me/?text=${text}`);
  STATE.cart=[]; persist(); toggleCart(false); toast('Checkout berhasil');
}

function rupiah(n){ return 'Rp '+n.toLocaleString('id-ID'); }

function toast(msg){
  let t=document.getElementById('toast');
  t.innerText=msg; t.classList.remove('hidden');
  setTimeout(()=>t.classList.add('hidden'),1500);
}
