import { STATE } from './core/state.js';
import { Router } from './core/router.js';
import { Utils } from './core/utils.js';
import { Dom } from './ui/dom.js';
import { Render } from './ui/render.js';
import { ProductFeature } from './feature/product.js';
import { CartFeature } from './feature/cart.js';

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Gagal memuat ${path}`);
  }

  return response.json();
}

function mapPartner(rawPartner) {
  return {
    id: String(rawPartner.mitra_id || ''),
    name: Utils.presentText(rawPartner.mitra_name || 'Kantin Digital'),
    ownerName: Utils.presentText(rawPartner.owner_name || ''),
    phone: Utils.compactText(rawPartner.phone_owner || ''),
    email: Utils.compactText(rawPartner.email_owner || ''),
    category: Utils.presentText(rawPartner.kategori || ''),
    school: Utils.presentText(rawPartner.sekolah || ''),
    address: Utils.presentText(rawPartner.address_owner || '')
  };
}

function mapProduct(rawProduct, partnersById) {
  const partner = partnersById.get(String(rawProduct.mitra_id || ''));

  return {
    id: String(rawProduct.produk_id || ''),
    partnerId: String(rawProduct.mitra_id || ''),
    name: Utils.presentText(rawProduct.produk_name || 'Produk tanpa nama'),
    price: Utils.parseNumber(rawProduct.produk_price),
    stock: Utils.parseNumber(rawProduct.produk_stock),
    category: Utils.compactText(rawProduct.produk_kategori || 'Lainnya').toUpperCase(),
    image: Utils.compactText(rawProduct.produk_image || ''),
    school: Utils.presentText(rawProduct.sekolah || partner?.school || '')
  };
}

async function initData() {
  const [partnersRaw, productsRaw] = await Promise.all([
    fetchJson('data/partners.json'),
    fetchJson('data/products.json')
  ]);

  const partners = partnersRaw.map(mapPartner);
  const partnersById = new Map(partners.map(partner => [partner.id, partner]));
  const allProducts = productsRaw.map(product => mapProduct(product, partnersById));

  const primaryPartnerId =
    allProducts.find(product => partnersById.has(product.partnerId))?.partnerId ||
    partners[0]?.id ||
    '';

  const activePartner = partnersById.get(primaryPartnerId) || partners[0] || null;
  const filteredProducts = activePartner
    ? allProducts.filter(product => product.partnerId === activePartner.id)
    : allProducts;

  STATE.patch({
    isLoaded: true,
    partners,
    partner: activePartner,
    products: filteredProducts
  });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Ignore registration errors in local preview mode.
    });
  });
}

async function init() {
  Dom.init();
  Render.app();

  STATE.subscribe(() => {
    Render.app();
  });

  ProductFeature.init();
  CartFeature.init();
  Router.init();
  registerServiceWorker();

  await initData();
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch(error => {
    console.error(error);
    STATE.set('isLoaded', true);
    Dom.showToast('Gagal memuat katalog. Coba refresh halaman.');
  });
});
