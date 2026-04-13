// ================================
// /js/features/product.js
// ================================
import { STATE } from '../core/state.js';
import { Render } from '../ui/render.js';

export const ProductFeature = {
  init() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.add');
      if (!btn) return;

      const id = btn.dataset.id;
      STATE.update('cart', cart => {
        const item = cart.find(i => i.id === id);
        if (item) item.qty++;
        else cart.push({ id, qty: 1 });
        return [...cart];
      });
    });
  }
};