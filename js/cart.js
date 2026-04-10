// js/cart.js - Cart Functions
function toggleCart(open) {
  document.getElementById('cartModal').classList.toggle('hidden', !open);
  if (open) renderCart();
}

function renderCart() {
  let el = document.getElementById('cartItems');
  let total = 0;

  if (!STATE.cart.length) {
    document.getElementById('emptyCart').classList.remove('hidden');
    document.getElementById('upsell').classList.add('hidden');
    el.innerHTML = '';
    return;
  }

  document.getElementById('emptyCart').classList.add('hidden');
  document.getElementById('upsell').classList.remove('hidden');
  updateUpsellContent();

  el.innerHTML = STATE.cart.map((item, i) => {
    total += item.price * item.qty;
    return `
    <div class='flex justify-between items-center text-sm py-2 border-b border-white/10'>
      <div>
        <p class='font-medium'>${item.name}</p>
        <p class='text-xs opacity-50'>${rupiah(item.price)}</p>
      </div>
      <div class='flex items-center gap-2'>
        <button class='bg-white/10 px-2 rounded' onclick="qty(${i}, -1)">-</button>
        <span>${item.qty}</span>
        <button class='bg-white/10 px-2 rounded' onclick="qty(${i}, 1)">+</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('total').innerText = 'Total: ' + rupiah(total);
}

function qty(i, n) {
  STATE.cart[i].qty += n;
  if (STATE.cart[i].qty <= 0) STATE.cart.splice(i, 1);
  persist();
  renderCart();
}

function animateCart() {
  const el = document.querySelector('[onclick="toggleCart(true)"]');
  el.classList.add('scale-110');
  setTimeout(() => el.classList.remove('scale-110'), 200);
}

function checkout() {
  let text = 'Order:%0A';
  STATE.cart.forEach(i => text += `${i.name} x${i.qty}%0A`);
  window.open(`https://wa.me/?text=${text}`);
  STATE.cart = [];
  persist();
  toggleCart(false);
  toast('Checkout berhasil');
}

// upsellProduct declared globally

function updateUpsell() {
  const minuman = PRODUCTS.find(p => p.kategori === 'MINUMAN' && p.stock > 0);
  upsellProduct = minuman;
}

function updateUpsellContent() {
  const content = document.getElementById('upsellContent');
  const btn = document.getElementById('upsellBtn');
  if (!upsellProduct || upsellProduct.stock <= 0) {
    content.innerHTML = '<span class="text-gold text-lg">🔥</span><span class="font-medium">Tidak ada promo</span>';
    btn.disabled = true;
    return;
  }
  content.innerHTML = `
    <span class="text-gold text-lg">🔥</span>
    <span class="font-medium">${upsellProduct.name}</span>
    <span class="opacity-75">+${rupiah(upsellProduct.price)}</span>
  `;
  btn.disabled = false;
}

function addUpsell() {
  if (upsellProduct && PRODUCTS.find(p => p.id === upsellProduct.id)) {
    const idx = PRODUCTS.findIndex(p => p.id === upsellProduct.id);
    add(idx);
  }
}

