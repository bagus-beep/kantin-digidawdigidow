// ================================
// /js/ui/dom.js
// ================================
export const Dom = {
  init() {
    this.searchInput = document.getElementById('searchInput');
    this.filterChips = document.getElementById('filterChips');
    this.productGrid = document.getElementById('productGrid');
    this.resultsMeta = document.getElementById('resultsMeta');
    this.emptyState = document.getElementById('emptyState');

    this.cartItems = document.getElementById('cartItems');
    this.cartEmpty = document.getElementById('cartEmpty');
    this.summaryTotal = document.getElementById('summaryTotal');
    this.checkoutButton = document.getElementById('checkoutButton');

    this.partnerName = document.getElementById('partnerName');
    this.partnerTagline = document.getElementById('partnerTagline');
  }
};