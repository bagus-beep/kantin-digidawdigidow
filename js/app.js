// ================================
// /js/app.js
// ================================
import { STATE } from './core/state.js';
import { Router } from './core/router.js';
import { Performance } from './core/performance.js';
import { Dom } from './ui/dom.js';
import { Render } from './ui/render.js';
import { ProductFeature } from './feature/product.js';

async function initData() {
  const products = await fetch('data/products.json').then(r => r.json());

  STATE.set('products', products.map(p => ({
    id: String(p.produk_id),
    name: p.produk_name,
    price: Number(p.produk_price),
    category: p.produk_kategori
  })));
}

function init() {
  Dom.init();

  STATE.subscribe(() => {
    Render.products();
    Render.cart();
  });

  Dom.searchInput.addEventListener('input', e => {
    STATE.set('search', e.target.value.toLowerCase());
  });

  ProductFeature.init();
  Router.init();
  Performance.lazyImages();
  initData();
}

document.addEventListener('DOMContentLoaded', init);
