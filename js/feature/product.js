import { STATE } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Dom } from '../ui/dom.js';

function updateProductQuantity(productId, delta) {
  const product = STATE.findProduct(productId);
  if (!product) return;

  const nextQty = STATE.cartQty(productId) + delta;
  const cappedQty = Math.min(Math.max(nextQty, 0), product.stock || 99);

  STATE.setCartQty(productId, cappedQty);
}

export const ProductFeature = {
  init() {
    Dom.searchInput.addEventListener('input', event => {
      STATE.set('search', Utils.normalize(event.target.value));
    });

    Dom.filterChips.addEventListener('click', event => {
      const chip = event.target.closest('[data-category]');
      if (!chip) return;

      STATE.set('category', chip.dataset.category);
    });

    Dom.productGrid.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action][data-id]');
      if (!actionButton) return;

      const { action, id } = actionButton.dataset;

      if (action === 'add' || action === 'increase') {
        const product = STATE.findProduct(id);
        const currentQty = STATE.cartQty(id);

        if (product && currentQty >= product.stock) {
          Dom.showToast({
            tone: 'error',
            title: 'Stok tidak cukup',
            detail: `${product.name} sudah mencapai batas stok yang tersedia.`
          });
          return;
        }

        updateProductQuantity(id, 1);

        if (action === 'add' && product) {
          Dom.showToast({
            tone: 'success',
            title: `${product.name} ditambahkan`,
            detail: `${STATE.cartCount()} item di keranjang | ${Utils.formatCurrency(STATE.cartTotal())}`,
            actionLabel: 'Lihat',
            onAction: () => {
              location.hash = 'cart';
            }
          });
        }

        return;
      }

      if (action === 'decrease') {
        updateProductQuantity(id, -1);
      }
    });

    Dom.emptyResetButton.addEventListener('click', () => {
      Dom.searchInput.value = '';
      STATE.patch({
        category: 'ALL',
        search: ''
      });
    });

    Dom.primaryCtaButton.addEventListener('click', () => {
      Dom.catalogSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }
};
