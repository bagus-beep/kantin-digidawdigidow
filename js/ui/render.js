// ================================
// /js/ui/render.js
// ================================
import { STATE } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Dom } from './dom.js';

export const Render = {
  products() {
    const products = STATE.get('products')
      .filter(p => STATE.get('category') === 'ALL' || p.category === STATE.get('category'))
      .filter(p => !STATE.get('search') || p.name.toLowerCase().includes(STATE.get('search')));

    Dom.resultsMeta.textContent = `${products.length} produk`;
    Dom.emptyState.classList.toggle('hidden', products.length > 0);

    Dom.productGrid.innerHTML = products.map(p => `
      <div class="product-card">
        <h3>${Utils.escapeHtml(p.name)}</h3>
        <p>${Utils.formatCurrency(p.price)}</p>
        <button data-id="${p.id}" class="add">Tambah</button>
      </div>
    `).join('');
  },

  cart() {
    const cart = STATE.get('cart');
    const items = cart.map(i => {
      const p = STATE.findProduct(i.id);
      return p ? { ...p, qty: i.qty } : null;
    }).filter(Boolean);

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);

    Dom.summaryTotal.textContent = Utils.formatCurrency(total);
    Dom.checkoutButton.disabled = total === 0;

    Dom.cartItems.innerHTML = items.map(i => `
      <div>
        ${i.name} x${i.qty}
      </div>
    `).join('');
  }
};