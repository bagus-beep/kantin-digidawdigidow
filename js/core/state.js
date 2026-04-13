// ================================
// /js/core/state.js
// ================================
import { Utils } from './utils.js';

export class State {
  constructor() {
    this.data = {
      partner: null,
      products: [],
      category: 'ALL',
      search: '',
      cart: Utils.load(Utils.STORAGE_KEY, [])
    };
    this.listeners = [];
  }

  get(key) { return this.data[key]; }

  set(key, value) {
    this.data[key] = value;
    if (key === 'cart') Utils.save(Utils.STORAGE_KEY, value);
    this.emit();
  }

  update(key, fn) {
    this.set(key, fn(this.data[key]));
  }

  subscribe(fn) { this.listeners.push(fn); }

  emit() { this.listeners.forEach(fn => fn(this.data)); }

  findProduct(id) {
    return this.data.products.find(p => p.id === id);
  }

  cartQty(id) {
    return this.data.cart.find(i => i.id === id)?.qty || 0;
  }
}

export const STATE = new State();