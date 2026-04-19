import { STATE } from '../core/state.js';
import { Utils } from '../core/utils.js';
import { Dom } from '../ui/dom.js';

function updateCartFromAction(action, id) {
  if (!id) return;
  const product = STATE.findProduct(id);

  if (action === 'increase') {
    if (product && STATE.cartQty(id) >= product.stock) {
      Dom.showToast({
        tone: 'error',
        title: 'Stok tidak mencukupi',
        detail: `${product.name} tidak bisa ditambah lagi.`
      });
      return;
    }

    STATE.changeCartQty(id, 1);
    return;
  }

  if (action === 'decrease') {
    STATE.changeCartQty(id, -1);
    return;
  }

  if (action === 'remove') {
    STATE.setCartQty(id, 0);
    Dom.showToast({
      tone: 'info',
      title: `${product?.name || 'Produk'} dihapus`,
      detail: `${STATE.cartCount()} item tersisa di keranjang.`
    });
  }
}

function contactUrl(customMessage = '') {
  const partner = STATE.get('partner');
  const phone = Utils.normalizePhone(partner?.phone);

  if (!phone) return '';

  return `https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`;
}

export const CartFeature = {
  init() {
    Dom.cartItems.addEventListener('click', event => {
      const actionButton = event.target.closest('[data-action][data-id]');
      if (!actionButton) return;

      updateCartFromAction(actionButton.dataset.action, actionButton.dataset.id);
    });

    Dom.checkoutButton.addEventListener('click', () => this.checkout());

    Dom.contactSellerButton.addEventListener('click', () => {
      const partner = STATE.get('partner');
      const url = contactUrl(`Halo ${partner?.ownerName || 'penjual'}, saya ingin bertanya tentang menu di ${partner?.name || 'kantin'}.`);

      if (!url) {
        Dom.showToast({
          tone: 'error',
          title: 'Kontak belum tersedia',
          detail: 'Nomor WhatsApp partner belum tersedia.'
        });
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    });

    Dom.cartBrowseButton.addEventListener('click', () => {
      location.hash = 'home';
    });

    Dom.profileInputs.forEach(input => {
      input.addEventListener('input', event => {
        const key = event.target.dataset.key;
        STATE.set('profile', {
          ...STATE.get('profile'),
          [key]: Utils.compactText(event.target.value)
        });
      });
    });

    Dom.themeToggle.addEventListener('change', event => {
      STATE.set('theme', event.target.checked ? 'dark' : 'light');
    });
  },

  checkout() {
    const partner = STATE.get('partner');
    const items = STATE.detailedCart();
    const profile = STATE.get('profile');
    const total = STATE.cartTotal();
    const totalQty = STATE.cartCount();

    if (!items.length) {
      Dom.showToast({
        tone: 'info',
        title: 'Keranjang masih kosong',
        detail: 'Tambahkan produk dulu sebelum checkout.'
      });
      return;
    }

    const phone = Utils.normalizePhone(partner?.phone);
    if (!phone) {
      Dom.showToast({
        tone: 'error',
        title: 'Checkout belum bisa dibuka',
        detail: 'Nomor WhatsApp partner belum tersedia.'
      });
      return;
    }

    const messageLines = [
      `Halo ${partner?.ownerName || 'penjual'}, saya ingin checkout di ${partner?.name || 'kantin'}.`,
      '',
      'Data pembeli:',
      `Nama: ${profile.name || '-'}`,
      `Sekolah: ${profile.school || partner?.school || '-'}`,
      `WhatsApp: ${profile.whatsapp || '-'}`,
      '',
      'Pesanan:'
    ];

    items.forEach((item, index) => {
      messageLines.push(`${index + 1}. ${item.name} x${item.qty} - ${Utils.formatCurrency(item.subtotal)}`);
    });

    messageLines.push('');
    messageLines.push(`Total item: ${totalQty}`);
    messageLines.push(`Total belanja: ${Utils.formatCurrency(total)}`);

    const order = {
      code: Utils.createOrderCode(),
      createdAt: new Date().toISOString(),
      partnerName: partner?.name || 'Kantin Digital',
      total,
      totalQty,
      customer: profile,
      items
    };

    STATE.addOrder(order);
    STATE.clearCart();

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(messageLines.join('\n'))}`, '_blank', 'noopener,noreferrer');
    Dom.showToast({
      tone: 'success',
      title: 'Checkout dibuka',
      detail: 'Pesanan siap dikirim lewat WhatsApp.'
    });
  }
};
