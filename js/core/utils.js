// ================================
// /js/core/utils.js
// ================================
export const Utils = {
  STORAGE_KEY: 'kantin_digital_cart_v3',
  PROFILE_KEY: 'kantin_profile_v1',
  currency: new Intl.NumberFormat('id-ID'),

  parseNumber(str) {
    return Number(String(str || '0').replace(/[^\\d]/g, '')) || 0;
  },

  formatCurrency(value) {
    return `Rp ${this.currency.format(Math.max(Number(value) || 0, 0))}`;
  },

  normalize(str) {
    return String(str || '').toLowerCase().trim();
  },

  title(str) {
    return this.normalize(str).replace(/\\b\\w/g, m => m.toUpperCase());
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },

  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};