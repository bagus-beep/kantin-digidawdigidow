import { Utils } from './utils.js';

const defaultProfile = {
  name: '',
  school: '',
  whatsapp: ''
};

export class State {
  constructor() {
    this.data = {
      isLoaded: false,
      partner: null,
      partners: [],
      products: [],
      category: 'ALL',
      search: '',
      cart: Utils.load(Utils.CART_KEY, []),
      profile: Utils.load(Utils.PROFILE_KEY, defaultProfile),
      theme: Utils.load(Utils.THEME_KEY, 'light'),
      orders: Utils.load(Utils.ORDERS_KEY, [])
    };
    this.listeners = [];
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.persist(key, value);
    this.emit();
  }

  patch(partial) {
    Object.entries(partial).forEach(([key, value]) => {
      this.data[key] = value;
      this.persist(key, value);
    });
    this.emit();
  }

  update(key, updater) {
    this.set(key, updater(this.data[key]));
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  emit() {
    this.listeners.forEach(listener => listener(this.data));
  }

  persist(key, value) {
    if (key === 'cart') Utils.save(Utils.CART_KEY, value);
    if (key === 'profile') Utils.save(Utils.PROFILE_KEY, value);
    if (key === 'theme') Utils.save(Utils.THEME_KEY, value);
    if (key === 'orders') Utils.save(Utils.ORDERS_KEY, value);
  }

  categories() {
    return [...new Set(this.data.products.map(product => product.category).filter(Boolean))];
  }

  findProduct(id) {
    return this.data.products.find(product => product.id === id);
  }

  cartQty(id) {
    return this.data.cart.find(item => item.id === id)?.qty || 0;
  }

  detailedCart() {
    return this.data.cart
      .map(item => {
        const product = this.findProduct(item.id);
        return product ? { ...product, qty: item.qty, subtotal: product.price * item.qty } : null;
      })
      .filter(Boolean);
  }

  cartCount() {
    return this.data.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  cartTotal() {
    return this.detailedCart().reduce((sum, item) => sum + item.subtotal, 0);
  }

  setCartQty(id, qty) {
    const nextQty = Math.max(0, Number(qty) || 0);
    const nextCart = [...this.data.cart];
    const item = nextCart.find(entry => entry.id === id);

    if (nextQty === 0) {
      this.set('cart', nextCart.filter(entry => entry.id !== id));
      return;
    }

    if (item) {
      item.qty = nextQty;
    } else {
      nextCart.push({ id, qty: nextQty });
    }

    this.set('cart', nextCart);
  }

  changeCartQty(id, delta) {
    this.setCartQty(id, this.cartQty(id) + delta);
  }

  clearCart() {
    this.set('cart', []);
  }

  addOrder(order) {
    this.set('orders', [order, ...this.data.orders].slice(0, 20));
  }
}

export const STATE = new State();
