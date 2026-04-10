// js/product.js - Product Functions
async function loadProducts() {
  try {
    renderSkeleton();
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_EXPIRY && data.products) {
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
      price: parseInt((p.produk_price || '0').replace(/\./g, '')),
      kategori: p.produk_kategori || 'MAKANAN',
      img: p.produk_image || '',
      stock: parseInt(p.produk_stock || '0')
    })).filter(p => p.stock > 0 || true); // show all, even 0 stock
    
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      products: PRODUCTS,
      partner: PARTNER,
      timestamp: Date.now()
    }));
    
    renderFilter();
    render();
    updateUpsell();
  } catch (e) {
    console.error('Products load error:', e);
    updateUpsell();
  }
}

function setFilter(f) {
  STATE.filter = f;
  renderFilter();
  render();
}

function render() {
  let data = PRODUCTS
    .filter(p => STATE.filter === 'ALL' || p.kategori === STATE.filter)
    .filter(p => p.name.toLowerCase().includes(STATE.search));

  if (!data.length) {
    grid.innerHTML = `<p class="text-center col-span-2 text-gray-400">Produk tidak ditemukan</p>`;
    return;
  }

  grid.innerHTML = data.map((p, i) => {
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
  if (item.stock <= 0) {
    toast('Stok habis!');
    return;
  }
  const found = STATE.cart.find(x => x.id === item.id);
  if (found) {
    if (found.qty >= item.stock) {
      toast('Stok tidak mencukupi!');
      return;
    }
    found.qty++;
  } else {
    STATE.cart.push({...item, qty: 1});
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

