export const Utils = {
  CART_KEY: 'kantin_digital_cart_v4',
  PROFILE_KEY: 'kantin_profile_v2',
  THEME_KEY: 'kantin_theme_v1',
  ORDERS_KEY: 'kantin_orders_v1',
  currency: new Intl.NumberFormat('id-ID'),
  dateTime: new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),

  parseNumber(value) {
    return Number(String(value ?? '').replace(/[^\d]/g, '')) || 0;
  },

  formatCurrency(value) {
    return `Rp ${this.currency.format(Math.max(Number(value) || 0, 0))}`;
  },

  formatDateTime(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : this.dateTime.format(date);
  },

  normalize(value) {
    return String(value || '').toLowerCase().trim();
  },

  title(value) {
    return this.normalize(value).replace(/\b\w/g, letter => letter.toUpperCase());
  },

  compactText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  },

  escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  },

  normalizePhone(value) {
    const digits = String(value || '').replace(/[^\d]/g, '');

    if (!digits) return '';
    if (digits.startsWith('62')) return digits;
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    return digits;
  },

  createOrderCode() {
    return `ORD-${Date.now().toString().slice(-6)}`;
  },

  load(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};
