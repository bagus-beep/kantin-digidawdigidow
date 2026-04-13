/**
 * Kantin Digital - Complete Modular Refactor
 * Clean, DRY, Mobile-First, Theme-aware E-commerce App
 */

'use strict';

// ==========================================================================
// UTILS - Reusable helpers (COMPLETE w/ missing functions)
// ==========================================================================

const CONSTANTS = {
  STOCK_LOW_THRESHOLD: 5,
  MAX_TOAST_TIME: 2600,
  SEARCH_DEBOUNCE_MS: 300
};

const Utils = {
  STORAGE_KEY: 'kantin_digital_cart_v3',
  PROFILE_KEY: 'kantin_profile_v1',
  CART_EMPTY_MSG: 'Keranjang kosong',
  NO_PRODUCTS_MSG: 'Tidak ada produk ditemukan',
  NO_WA_MSG: 'Nomor WA belum diset di profil',
  currency: new Intl.NumberFormat('id-ID'),
  toastTimer: null,

  parseNumber(str) {
    return Number(String(str || '0').replace(/[^\\d]/g, '')) || 0;
  },

  formatCurrency(value) {
    return `Rp ${this.currency.format(Math.max(Number(value) || 0, 0))}`;
  },

  normalizeSpaces(str) {
    return String(str || '').replace(/\\s+/g, ' ').trim();
  },

  toTitleCase(str) {
    return this.normalizeSpaces(str).toLowerCase().replace(/\\b\\w/g, m => m.toUpperCase());
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  },

  /** Missing: Get initials from name */
  getInitials(name) {
    return this.normalizeSpaces(name)
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('')
      .slice(0, 2) || '??';
  },

  /** Missing: Normalize category key */
  normalizeCategory(cat) {
    return this.normalizeSpaces(cat || '').toUpperCase();
  },

  /** Missing: Humanize category label */
  labelizeCategory(cat) {
    const map = { 'MAKANAN': 'Makanan', 'MINUMAN': 'Minuman', 'ALL': 'Semua' };
    return map[this.normalizeCategory(cat)] || this.toTitleCase(cat);
  },

  loadCart() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
  },

  loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(this.PROFILE_KEY) || '{}');
    } catch {
      return {};
    }
  },

  saveProfile(profile) {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('is-visible');
    
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => toast.classList.remove('is-visible'), this.MAX_TOAST_TIME);
  },

  updateNavCartBadge() {
    const badge = document.getElementById('navCartCount');
    if (!badge) return;
    
    const count = STATE.cart.reduce((sum, item) => sum + item.qty, 0);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'block' : 'none';
  }
};


// ==========================================================================
// STATE - Centralized app state
// ==========================================================================

class StateManager {
  constructor() {
    this.state = {
      partner: null,
      products: [],
      category: 'ALL',
      search: '',
      cart: Utils.loadCart()
    };
    this.subscribers = [];
  }

  set(key, value) {
    this.state[key] = value;
    this.notify();
    if (key === 'cart') Utils.saveCart(value);
  }

  get(key) {
    return this.state[key];
  }

  subscribe(fn) {
    this.subscribers.push(fn);
  }

  notify() {
    this.subscribers.forEach(fn => fn(this.state));
  }

  syncCartWithProducts() {
    this.state.cart = this.state.cart.filter(item => {
      const product = this.findProduct(item.id);
      if (!product || product.stock <= 0) return false;
      item.qty = Math.min(item.qty, product.stock);
      return item.qty > 0;
    });
    Utils.saveCart(this.state.cart);
  }

  findProduct(id) {
    return this.state.products.find(p => p.id === id);
  }

  getCartQuantity(id) {
    const item = this.state.cart.find(item => item.id === id);
    return item ? item.qty : 0;
  }
}

const STATE = new StateManager();

// ==========================================================================
// DOM - Query selectors (only existing HTML elements)
// ==========================================================================

const Dom = {
  elements: null
};

// ==========================================================================
// RENDERERS - Pure UI update functions
// ==========================================================================

const Render = {
  loadingProducts() {
    Dom.elements.productGrid.innerHTML = Array(6).fill().map((_, i) => `
      <article class="product-card" style="--delay: ${i * 55}ms;">
        <div class="product-media"></div>
        <div class="product-body">
          <div class="product-title-row">
            <div style="height: 18px; width: 60%; background: var(--bg-secondary); border-radius: 4px;"></div>
            <div style="height: 18px; width: 24%; background: var(--bg-secondary); border-radius: 4px;"></div>
          </div>
          <div style="height: 14px; width: 75%; background: var(--bg-secondary); border-radius: 4px;"></div>
          <div style="height: 48px; background: var(--bg-secondary); border-radius: 8px;"></div>
        </div>
      </article>
    `).join('');
  },

  async products() {
    const visible = STATE.products
      .filter(p => STATE.category === 'ALL' || p.category === STATE.category)
      .filter(p => !STATE.search || p.name.toLowerCase().includes(STATE.search));

    Dom.elements.resultsMeta.textContent = visible.length 
      ? `${visible.length} produk tersedia`
      : Utils.NO_PRODUCTS_MSG;
    
    Dom.elements.emptyState.classList.toggle('hidden', visible.length > 0);

    if (!visible.length) {
      Dom.elements.productGrid.innerHTML = '';
      return;
    }

    Dom.elements.productGrid.innerHTML = visible.map((product, i) => {
      const cartQty = STATE.getCartQuantity(product.id);
  const lowStock = product.stock <= CONSTANTS.STOCK_LOW_THRESHOLD && product.stock > 0;
      const outOfStock = product.stock === 0;

      return `
        <article class="product-card" style="--delay: ${Math.min(i * 55, 330)}ms;">
          <div class="product-media">
            ${product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy">` : `<div class="product-fallback">${Utils.getInitials(product.name)}</div>`}
            <span class="product-chip">${product.categoryLabel}</span>
            <span class="${lowStock ? 'stock-low' : outOfStock ? 'stock-out' : 'stock-ok'}">${outOfStock ? 'Habis' : `Stok ${product.stock}`}</span>
          </div>
          <div class="product-body">
            <div class="product-title-row">
              <h3>${Utils.escapeHtml(product.name)}</h3>
              <span class="price">${Utils.formatCurrency(product.price)}</span>
            </div>
            <p>${product.school || 'Siap diambil hari ini'}</p>
            <div class="product-meta">
              <span>${product.categoryLabel}</span>
              ${cartQty ? `<span>${cartQty} di keranjang</span>` : ''}
            </div>
            <button class="add-to-cart ${outOfStock ? 'disabled' : ''}" data-product-id="${product.id}" ${outOfStock ? 'disabled' : ''}>
              ${outOfStock ? 'Habis' : cartQty ? 'Tambah lagi' : 'Keranjang'}
            </button>
          </div>
        </article>
      `;
    }).join('');
  },

  cart() {
    const items = STATE.cart.map(item => {
      const product = STATE.findProduct(item.id);
      if (!product) return null;
      return {
        product,
        qty: item.qty,
        total: product.price * item.qty
      };
    }).filter(Boolean);

    const total = items.reduce((sum, item) => sum + item.total, 0);

    Dom.elements.cartEmpty.classList.toggle('hidden', items.length > 0);
    Dom.elements.summaryTotal.textContent = Utils.formatCurrency(total);
    Dom.elements.checkoutButton.disabled = total === 0;
    Utils.updateNavCartBadge();

    Dom.elements.cartItems.innerHTML = items.map(item => `
      <article class="cart-item">
        <div>
          <h4>${Utils.escapeHtml(item.product.name)}</h4>
          <p>${item.product.categoryLabel} • Stok ${item.product.stock}</p>
        </div>
        <div class="cart-row">
          <div class="qty-control">
            <button class="qty-btn" data-id="${item.product.id}" data-delta="-1">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" data-id="${item.product.id}" data-delta="1">+</button>
          </div>
          <span class="line-total">${Utils.formatCurrency(item.total)}</span>
        </div>
      </article>
    `).join('') || '';

  if (items.length === 0) {
      Dom.elements.cartItems.innerHTML = `<p style="text-align: center; color: var(--text-secondary);">${Utils.CART_EMPTY_MSG}</p>`;
    }
  },

  partnerInfo() {
    if (!STATE.partner) return;
    
    Dom.elements.partnerName.textContent = STATE.partner.name;
    Dom.elements.partnerTagline.textContent = `${STATE.products.length} menu untuk ${STATE.partner.school}`;
    Dom.elements.addressText.textContent = STATE.partner.address || 'Alamat kantin';
  },

  filters() {
    const categories = [...new Set(STATE.products.map(p => p.category))];
    Dom.elements.filterChips.innerHTML = ['ALL', ...categories].map(cat => {
      const active = cat === STATE.category;
      const label = cat === 'ALL' ? 'Semua' : Utils.labelizeCategory(cat);
      return `<button class="filter-chip ${active ? 'active' : ''}" data-category="${cat}">${label}</button>`;
    }).join('');
  }
};

// ==========================================================================
// HANDLERS - Event handlers
// ==========================================================================

const Handlers = {
  async initData() {
    Render.loadingProducts();
    
    try {
      const [partners, products] = await Promise.all([
        fetch('data/partners.json').then(r => r.json()),
        fetch('data/products.json').then(r => r.json())
      ]);

      STATE.partner = partners[0] || { name: 'Kantin Digital', school: 'Sekolah' };
      STATE.products = products.map(p => ({
        id: String(p.produk_id),
        name: Utils.toTitleCase(p.produk_name),
        category: Utils.normalizeCategory(p.produk_kategori),
        categoryLabel: Utils.labelizeCategory(p.produk_kategori),
        price: Utils.parseNumber(p.produk_price),
        stock: Utils.parseNumber(p.produk_stock),
        image: p.produk_image || ''
      })).filter(p => p.name && p.price > 0);

      STATE.syncCartWithProducts();
      Render.partnerInfo();
      Render.filters();
      Render.products();
      Render.cart();
    } catch (error) {
      console.error('Data load failed:', error);
      Utils.showToast('Gagal memuat katalog');
      Dom.elements.productGrid.innerHTML = '<p>Tidak dapat memuat produk</p>';
    }
  },

  onSearchInput(e) {
    STATE.search = e.target.value.toLowerCase().trim();
    Render.products();
  },

  onFilterClick(e) {
    const btn = e.target.closest('[data-category]');
    if (!btn) return;
    
    STATE.category = btn.dataset.category;
    Render.filters();
    Render.products();
  },

  onProductClick(e) {
    const btn = e.target.closest('[data-product-id]');
    if (!btn) return;
    
    this.addToCart(btn.dataset.productId);
  },

  onCartClick(e) {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    
    const id = btn.dataset.id;
    const delta = Number(btn.dataset.delta);
    
    const item = STATE.cart.find(item => item.id === id);
    if (!item) return;
    
  const product = STATE.findProduct(id);
  item.qty += delta;
  item.qty = Math.max(0, Math.min(item.qty, product ? product.stock : 999));
  if (item.qty <= 0) {
    STATE.cart = STATE.cart.filter(i => i.id !== id);
  }
    
    Utils.saveCart(STATE.cart);
    Render.products();
    Render.cart();
  },

  addToCart(id) {
    const product = STATE.findProduct(id);
    if (!product || product.stock === 0) {
      Utils.showToast('Produk tidak tersedia');
      return;
    }

    const item = STATE.cart.find(item => item.id === id);
    if (item) {
      if (item.qty >= product.stock) {
        Utils.showToast('Stok habis');
        return;
      }
      item.qty = Math.min(item.qty + 1, product.stock);
    } else {
      STATE.cart.push({ id, qty: 1 });
    }

    Utils.saveCart(STATE.cart);
    Render.products();
    Render.cart();
    Utils.showToast(`${product.name} ditambahkan`);
  },

  checkout() {
    if (STATE.cart.length === 0) {
      Utils.showToast('Keranjang kosong');
      return;
    }

    const total = STATE.cart.reduce((sum, item) => {
      const product = STATE.findProduct(item.id);
      return sum + (product ? product.price * item.qty : 0);
    }, 0);

    const message = STATE.cart.map(item => {
      const product = STATE.findProduct(item.id);
      return product ? `- ${product.name} x${item.qty}` : '';
    }).filter(Boolean).join('\\n');

    const profile = Utils.loadProfile();
    const waNumber = profile.whatsapp || (STATE.partner?.wa || '6281234567890').replace(/[^\\d]/g, '');
    if (!waNumber) {
      Utils.showToast('Nomor WA belum diset di profil');
      return;
    }
    const url = `https://wa.me/${waNumber}?text=Halo! Pesanan:%0A${message}%0A%0ATotal: ${Utils.formatCurrency(total)}`;
    window.open(url, '_blank');
  },

  contactSeller() {
    const profile = Utils.loadProfile();
    const waNumber = profile.whatsapp || (STATE.partner?.wa || '6281234567890').replace(/[^\\d]/g, '');
    if (!waNumber) {
      Utils.showToast('Nomor WA belum diset');
      return;
    }
    window.open(`https://wa.me/${waNumber}?text=Halo Kantin Digital!`);
  },

  resetSearch() {
    STATE.search = '';
    STATE.category = 'ALL';
    Dom.elements.searchInput.value = '';
    Render.filters();
    Render.products();
  },

  initTheme() {
    const toggle = Dom.elements.themeToggle;
    if (toggle) {
      const saved = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', saved);
      toggle.checked = saved === 'dark';
      toggle.addEventListener('change', e => {
        const theme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      });
    }
  },

  initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const pageId = link.dataset.page;
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        
        document.getElementById(pageId)?.classList.add('active');
        link.classList.add('active');
      });
    });

    // Cart overlay toggle on nav cart click
    const cartNav = document.querySelector('.nav-item[data-page=\"cart\"]');
    const cartOverlay = Dom.elements.cartOverlay;
    if (cartNav && cartOverlay) {
      cartNav.addEventListener('click', () => {
        cartOverlay.hidden = false;
      });
    }
  },

  /** Basic profile save */
  initProfile() {
    const inputs = document.querySelectorAll('.profile-input');
    const profile = Utils.loadProfile();
    
    inputs.forEach(input => {
      const key = input.closest('label')?.textContent.split(':')[0].trim().toLowerCase();
      if (profile[key]) input.value = profile[key];
      
      input.addEventListener('change', () => {
        profile[key] = input.value;
        Utils.saveProfile(profile);
      });
    });
  }
};


// ==========================================================================
// INIT - App bootstrap
// ==========================================================================

function init() {
  // Event listeners
  Dom.elements.searchInput?.addEventListener('input', e => Handlers.onSearchInput(e));
  Dom.elements.filterChips?.addEventListener('click', e => Handlers.onFilterClick(e));
  Dom.elements.productGrid?.addEventListener('click', e => Handlers.onProductClick(e));
  Dom.elements.cartItems?.addEventListener('click', e => Handlers.onCartClick(e));
  Dom.elements.emptyResetButton?.addEventListener('click', () => Handlers.resetSearch());
  Dom.elements.primaryCtaButton?.addEventListener('click', () => Dom.elements.searchInput?.focus());
  Dom.elements.contactSellerButton?.addEventListener('click', () => Handlers.contactSeller());
  Dom.elements.checkoutButton?.addEventListener('click', () => Handlers.checkout());
  Dom.elements.cartOverlay?.addEventListener('click', e => e.currentTarget.hidden = true);

  // Theme & Nav & Profile
  Handlers.initTheme();
  Handlers.initNavigation();
  Handlers.initProfile();

  // Load data
  Handlers.initData();

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
  }
}


// Bootstrap
document.addEventListener('DOMContentLoaded', init);

// Export for module use
window.KantinApp = { STATE, Render, Handlers };
