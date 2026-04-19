export const Dom = {
  init() {
    this.catalogSection = document.getElementById('catalogSection');
    this.searchInput = document.getElementById('searchInput');
    this.filterChips = document.getElementById('filterChips');
    this.productGrid = document.getElementById('productGrid');
    this.resultsMeta = document.getElementById('resultsMeta');
    this.emptyState = document.getElementById('emptyState');
    this.emptyResetButton = document.getElementById('emptyResetButton');

    this.partnerName = document.getElementById('partnerName');
    this.partnerTagline = document.getElementById('partnerTagline');
    this.heroProductCount = document.getElementById('heroProductCount');
    this.heroCategoryCount = document.getElementById('heroCategoryCount');
    this.heroOwnerName = document.getElementById('heroOwnerName');
    this.schoolText = document.getElementById('schoolText');
    this.addressText = document.getElementById('addressText');
    this.ownerText = document.getElementById('ownerText');
    this.profilePartnerName = document.getElementById('profilePartnerName');
    this.profilePartnerInfo = document.getElementById('profilePartnerInfo');

    this.primaryCtaButton = document.getElementById('primaryCtaButton');
    this.contactSellerButton = document.getElementById('contactSellerButton');

    this.cartItems = document.getElementById('cartItems');
    this.cartEmpty = document.getElementById('cartEmpty');
    this.summaryCount = document.getElementById('summaryCount');
    this.summaryTotal = document.getElementById('summaryTotal');
    this.checkoutButton = document.getElementById('checkoutButton');
    this.cartBrowseButton = document.getElementById('cartBrowseButton');
    this.navCartCount = document.getElementById('navCartCount');

    this.transactionsList = document.getElementById('transactionsList');
    this.transactionsEmpty = document.getElementById('transactionsEmpty');

    this.profileInputs = [...document.querySelectorAll('.profile-input')];
    this.themeToggle = document.getElementById('themeToggle');
    this.toast = document.getElementById('toast');
  },

  showToast(message) {
    if (!this.toast) return;

    clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.classList.add('is-visible');

    this.toastTimer = window.setTimeout(() => {
      this.toast.classList.remove('is-visible');
    }, 2200);
  }
};
