import { STATE } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Performance } from '../core/performance.js';
import { Dom } from './dom.js';

function visibleProducts() {
  const query = Utils.normalize(STATE.get('search'));
  const category = STATE.get('category');

  return STATE.get('products')
    .filter(product => category === 'ALL' || product.category === category)
    .filter(product => !query || Utils.normalize(product.name).includes(query));
}

function productSubtitle(product) {
  const school = product.school || STATE.get('partner')?.school;
  return school ? school : 'Siap dipesan via WhatsApp';
}

export const Render = {
  app() {
    this.theme();
    this.partner();
    this.filters();
    this.products();
    this.cart();
    this.transactions();
    this.profile();
  },

  theme() {
    const theme = STATE.get('theme') || 'light';
    document.documentElement.dataset.theme = theme;
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#162233' : '#e87817');
    }
  },

  partner() {
    const partner = STATE.get('partner');
    const products = STATE.get('products');
    const categories = STATE.categories();
    const isLoaded = STATE.get('isLoaded');

    if (!isLoaded && !partner) {
      Dom.partnerName.textContent = 'Memuat kantin...';
      Dom.partnerTagline.textContent = 'Menyiapkan katalog partner, produk, dan informasi checkout.';
      Dom.heroProductCount.textContent = '...';
      Dom.heroCategoryCount.textContent = '...';
      Dom.heroOwnerName.textContent = 'Memuat partner';
      Dom.schoolText.textContent = 'Memuat sekolah partner...';
      Dom.addressText.textContent = 'Memuat alamat partner...';
      Dom.ownerText.textContent = 'Kontak partner sedang dimuat...';
      Dom.profilePartnerName.textContent = 'Memuat partner aktif...';
      Dom.profilePartnerInfo.textContent = 'Informasi partner akan muncul setelah data selesai dimuat.';
      document.title = 'Kantin Digital';
      return;
    }

    const partnerName = partner?.name || 'Kantin Digital';
    const school = partner?.school || 'Sekolah partner belum tersedia';
    const ownerName = partner?.ownerName || 'Pengelola belum tersedia';
    const address = partner?.address || 'Alamat partner belum tersedia';
    const phone = partner?.phone ? `WhatsApp ${partner.phone}` : 'Kontak penjual belum tersedia';
    const checkoutOwner = partner?.ownerName || 'penjual';

    Dom.partnerName.textContent = partnerName;
    Dom.partnerTagline.textContent = partner
      ? `${school}. Pilih menu favorit, atur jumlah, lalu checkout cepat ke ${checkoutOwner} via WhatsApp.`
      : 'Data partner belum ditemukan. Pastikan berkas partner dan produk tersedia.';
    Dom.heroProductCount.textContent = String(products.length);
    Dom.heroCategoryCount.textContent = String(categories.length);
    Dom.heroOwnerName.textContent = ownerName;
    Dom.schoolText.textContent = school;
    Dom.addressText.textContent = address;
    Dom.ownerText.textContent = `${ownerName} | ${phone}`;
    Dom.profilePartnerName.textContent = partnerName;
    Dom.profilePartnerInfo.textContent = `${school} | ${address}`;
    document.title = `${partnerName} | Kantin Digital`;
  },

  filters() {
    const categories = ['ALL', ...STATE.categories()];
    const active = STATE.get('category');

    Dom.filterChips.innerHTML = categories.map(category => {
      const label = category === 'ALL' ? 'Semua' : Utils.title(category);
      const isActive = category === active;

      return `
        <button
          class="filter-chip ${isActive ? 'active' : ''}"
          type="button"
          data-category="${Utils.escapeHtml(category)}"
          role="tab"
          aria-selected="${isActive}"
        >
          ${Utils.escapeHtml(label)}
        </button>
      `;
    }).join('');
  },

  products() {
    const products = visibleProducts();
    const isLoaded = STATE.get('isLoaded');

    if (!isLoaded) {
      Dom.resultsMeta.textContent = 'Memuat katalog...';
      Dom.emptyState.classList.add('hidden');
      Dom.productGrid.innerHTML = Array.from({ length: 4 }, () => `
        <article class="product-card loading-card" aria-hidden="true">
          <div class="product-media loading-block"></div>
          <div class="product-body">
            <div class="loading-line loading-line-title"></div>
            <div class="loading-line"></div>
            <div class="loading-line loading-line-short"></div>
          </div>
        </article>
      `).join('');
      return;
    }

    Dom.resultsMeta.textContent = `${products.length} produk tersedia`;
    Dom.emptyState.classList.toggle('hidden', products.length > 0);

    if (!products.length) {
      Dom.productGrid.innerHTML = '';
      return;
    }

    Dom.productGrid.innerHTML = products.map(product => {
      const stock = Math.max(product.stock, 0);
      const qty = STATE.cartQty(product.id);
      const stockLabel = stock <= 5 ? `Sisa ${stock}` : `Stok ${stock}`;
      const image = Utils.escapeHtml(product.image || 'favicon.svg');
      const cartLabel = qty > 0 ? `${qty} di keranjang` : 'Belum di keranjang';

      return `
        <article class="product-card">
          <div class="product-media">
            <img
              data-src="${image}"
              alt="${Utils.escapeHtml(product.name)}"
              loading="lazy"
              referrerpolicy="no-referrer"
            />
            <div class="product-badges">
              <span class="category-pill">${Utils.escapeHtml(Utils.title(product.category))}</span>
              <span class="stock-badge ${stock <= 5 ? 'is-low' : ''}">${Utils.escapeHtml(stockLabel)}</span>
            </div>
          </div>

          <div class="product-body">
            <div class="product-copy">
              <h3 class="product-name">${Utils.escapeHtml(product.name)}</h3>
              <p class="product-subtitle">${Utils.escapeHtml(productSubtitle(product))}</p>
            </div>

            <div class="product-meta">
              <strong class="product-price">${Utils.formatCurrency(product.price)}</strong>
              <span class="cart-hint ${qty > 0 ? 'is-active' : ''}">${Utils.escapeHtml(cartLabel)}</span>
            </div>

            <div class="product-actions">
              <button class="primary-button product-cta" type="button" data-action="add" data-id="${product.id}">
                Tambah
              </button>

              ${qty > 0 ? `
                <div class="qty-stepper" aria-label="Jumlah ${Utils.escapeHtml(product.name)}">
                  <button class="qty-button" type="button" data-action="decrease" data-id="${product.id}" aria-label="Kurangi ${Utils.escapeHtml(product.name)}">-</button>
                  <span class="qty-value">${qty}</span>
                  <button class="qty-button" type="button" data-action="increase" data-id="${product.id}" aria-label="Tambah ${Utils.escapeHtml(product.name)}">+</button>
                </div>
              ` : ''}
            </div>
          </div>
        </article>
      `;
    }).join('');

    Performance.lazyImages(Dom.productGrid);
  },

  cart() {
    const items = STATE.detailedCart();
    const total = STATE.cartTotal();
    const totalQty = STATE.cartCount();

    Dom.summaryCount.textContent = `${totalQty} item`;
    Dom.summaryTotal.textContent = Utils.formatCurrency(total);
    Dom.checkoutButton.disabled = items.length === 0;
    Dom.cartEmpty.classList.toggle('hidden', items.length > 0);
    Dom.navCartCount.hidden = totalQty === 0;
    Dom.navCartCount.textContent = String(totalQty);

    if (!items.length) {
      Dom.cartItems.innerHTML = '';
      return;
    }

    Dom.cartItems.innerHTML = items.map(item => `
      <article class="cart-card">
        <div class="cart-card-head">
          <div class="cart-card-title">
            <h3>${Utils.escapeHtml(item.name)}</h3>
            <p>${Utils.escapeHtml(Utils.title(item.category))} | ${Utils.formatCurrency(item.price)}</p>
          </div>
          <strong class="cart-line-total">${Utils.formatCurrency(item.subtotal)}</strong>
        </div>

        <div class="cart-card-foot">
          <div class="qty-stepper" aria-label="Jumlah ${Utils.escapeHtml(item.name)}">
            <button class="qty-button" type="button" data-action="decrease" data-id="${item.id}" aria-label="Kurangi ${Utils.escapeHtml(item.name)}">-</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-button" type="button" data-action="increase" data-id="${item.id}" aria-label="Tambah ${Utils.escapeHtml(item.name)}">+</button>
          </div>

          <button class="ghost-button" type="button" data-action="remove" data-id="${item.id}">
            Hapus
          </button>
        </div>
      </article>
    `).join('');
  },

  transactions() {
    const orders = STATE.get('orders');
    Dom.transactionsEmpty.classList.toggle('hidden', orders.length > 0);

    if (!orders.length) {
      Dom.transactionsList.innerHTML = '';
      return;
    }

    Dom.transactionsList.innerHTML = orders.map(order => `
      <article class="transaction-card">
        <div class="transaction-head">
          <div>
            <p class="section-kicker">Checkout ${Utils.escapeHtml(order.code)}</p>
            <h3>${Utils.escapeHtml(order.partnerName)}</h3>
          </div>
          <strong class="transaction-total">${Utils.formatCurrency(order.total)}</strong>
        </div>

        <div class="transaction-meta">
          <p>${Utils.escapeHtml(order.customer.name || 'Pembeli belum diisi')} | ${Utils.escapeHtml(Utils.formatDateTime(order.createdAt))}</p>
          <p>${order.totalQty} item</p>
        </div>

        <div class="transaction-items">
          ${order.items.slice(0, 4).map(item => `
            <div class="transaction-item">
              <span>${Utils.escapeHtml(item.name)} x${item.qty}</span>
              <span>${Utils.formatCurrency(item.subtotal)}</span>
            </div>
          `).join('')}
        </div>
      </article>
    `).join('');
  },

  profile() {
    const profile = STATE.get('profile');

    Dom.profileInputs.forEach(input => {
      const key = input.dataset.key;
      const nextValue = profile[key] || '';

      if (document.activeElement !== input && input.value !== nextValue) {
        input.value = nextValue;
      }
    });

    Dom.themeToggle.checked = STATE.get('theme') === 'dark';
  }
};
