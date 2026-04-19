import { Utils } from '../core/utils.js';

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

    this.toast?.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-toast-action]');
      if (!actionButton || typeof this.toastAction !== 'function') return;

      const nextAction = this.toastAction;
      this.hideToast();
      nextAction();
    });
  },

  hideToast() {
    if (!this.toast) return;

    clearTimeout(this.toastTimer);
    this.toast.classList.remove('is-visible');
    this.toast.removeAttribute('data-tone');
    this.toastAction = null;
  },

  showToast(options) {
    if (!this.toast) return;

    const config = typeof options === 'string' ? { title: options } : options;
    const {
      tone = 'info',
      title = '',
      detail = '',
      actionLabel = '',
      duration = 2600,
      onAction = null
    } = config;

    const iconMap = {
      success: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m5 12 4.2 4.2L19 6.5"></path>
        </svg>
      `,
      error: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 8v5"></path>
          <circle cx="12" cy="16.5" r=".9" fill="currentColor" stroke="none"></circle>
          <path d="M10.3 3.8 2.9 17a2 2 0 0 0 1.8 3h14.6a2 2 0 0 0 1.8-3L13.7 3.8a2 2 0 0 0-3.4 0Z"></path>
        </svg>
      `,
      info: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 10v5"></path>
          <circle cx="12" cy="7.5" r=".9" fill="currentColor" stroke="none"></circle>
        </svg>
      `
    };

    clearTimeout(this.toastTimer);
    this.toastAction = typeof onAction === 'function' ? onAction : null;
    this.toast.dataset.tone = tone;
    this.toast.innerHTML = `
      <div class="toast-shell">
        <span class="toast-icon" aria-hidden="true">${iconMap[tone] || iconMap.info}</span>
        <div class="toast-copy">
          <strong class="toast-title">${Utils.escapeHtml(title)}</strong>
          ${detail ? `<p class="toast-detail">${Utils.escapeHtml(detail)}</p>` : ''}
        </div>
        ${actionLabel && this.toastAction ? `<button class="toast-action" type="button" data-toast-action>${Utils.escapeHtml(actionLabel)}</button>` : ''}
      </div>
      <div class="toast-progress">
        <span class="toast-progress-bar"></span>
      </div>
    `;
    this.toast.classList.add('is-visible');

    const progressBar = this.toast.querySelector('.toast-progress-bar');
    if (progressBar) {
      progressBar.style.animation = 'none';
      void progressBar.offsetWidth;
      progressBar.style.animation = `toast-progress ${duration}ms linear forwards`;
    }

    this.toastTimer = window.setTimeout(() => {
      this.hideToast();
    }, duration);
  }
};
