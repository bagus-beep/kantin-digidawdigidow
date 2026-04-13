// ================================
// /js/features/cart.js
// ================================
import { STATE } from '../core/state.js';

export const CartFeature = {
  checkout() {
    const cart = STATE.get('cart');
    if (!cart.length) return;

    const message = cart.map(i => `- ${i.id} x${i.qty}`).join('\n');
    const url = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }
};