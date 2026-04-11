const DOM = {
  partnerName: document.getElementById("partnerName"),
  partnerTagline: document.getElementById("partnerTagline"),
  schoolBadge: document.getElementById("schoolBadge"),
  ownerBadge: document.getElementById("ownerBadge"),
  deliveryBadge: document.getElementById("deliveryBadge"),
  statProducts: document.getElementById("statProducts"),
  statCategories: document.getElementById("statCategories"),
  statPrice: document.getElementById("statPrice"),
  statStock: document.getElementById("statStock"),
  featuredTags: document.getElementById("featuredTags"),
  addressText: document.getElementById("addressText"),
  serviceText: document.getElementById("serviceText"),
  catalogText: document.getElementById("catalogText"),
  searchInput: document.getElementById("searchInput"),
  sortSelect: document.getElementById("sortSelect"),
  clearSearchButton: document.getElementById("clearSearchButton"),
  emptyResetButton: document.getElementById("emptyResetButton"),
  filterChips: document.getElementById("filterChips"),
  resultsMeta: document.getElementById("resultsMeta"),
  cartMeta: document.getElementById("cartMeta"),
  productGrid: document.getElementById("productGrid"),
  emptyState: document.getElementById("emptyState"),
  cartPanel: document.getElementById("cartPanel"),
  cartOverlay: document.getElementById("cartOverlay"),
  cartItems: document.getElementById("cartItems"),
  cartEmpty: document.getElementById("cartEmpty"),
  recommendationCard: document.getElementById("recommendationCard"),
  recommendationName: document.getElementById("recommendationName"),
  recommendationMeta: document.getElementById("recommendationMeta"),
  recommendationButton: document.getElementById("recommendationButton"),
  summaryCount: document.getElementById("summaryCount"),
  summaryTotal: document.getElementById("summaryTotal"),
  checkoutButton: document.getElementById("checkoutButton"),
  topCartCount: document.getElementById("topCartCount"),
  mobileCartBar: document.getElementById("mobileCartBar"),
  mobileCartCount: document.getElementById("mobileCartCount"),
  mobileCartTotal: document.getElementById("mobileCartTotal"),
  scrollCatalogButton: document.getElementById("scrollCatalogButton"),
  primaryCtaButton: document.getElementById("primaryCtaButton"),
  contactSellerButton: document.getElementById("contactSellerButton"),
  cartToggleButton: document.getElementById("cartToggleButton"),
  closeCartButton: document.getElementById("closeCartButton"),
  mobileCartButton: document.getElementById("mobileCartButton"),
  toast: document.getElementById("toast")
};

const STORAGE_KEY = "kantin_digital_cart_v3";
const MAX_TOAST_TIME = 2600;
const currency = new Intl.NumberFormat("id-ID");
let toastTimer = null;

const state = {
  partner: null,
  products: [],
  category: "ALL",
  search: "",
  sort: "recommended",
  cart: loadCart(),
  cartOpen: false
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  renderLoadingProducts();

  try {
    const [partners, rawProducts] = await Promise.all([
      fetchJson("data/partners.json"),
      fetchJson("data/products.json")
    ]);

    hydrateData(partners, rawProducts);
    syncCartWithProducts();
    renderPartnerInfo();
    renderFilters();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error("Initialization error:", error);
    showToast("Data katalog gagal dimuat.");
    renderFailureState();
  }

  registerServiceWorker();
}

function bindEvents() {
  DOM.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    renderProducts();
  });

  DOM.sortSelect.addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });

  DOM.clearSearchButton.addEventListener("click", resetCatalog);
  DOM.emptyResetButton.addEventListener("click", resetCatalog);
  DOM.filterChips.addEventListener("click", handleFilterClick);
  DOM.productGrid.addEventListener("click", handleProductGridClick);
  DOM.productGrid.addEventListener("error", handleGridImageError, true);
  DOM.cartItems.addEventListener("click", handleCartClick);
  DOM.recommendationButton.addEventListener("click", addRecommendedProduct);
  DOM.checkoutButton.addEventListener("click", checkoutViaWhatsApp);
  DOM.contactSellerButton.addEventListener("click", contactSeller);
  DOM.scrollCatalogButton.addEventListener("click", scrollToCatalog);
  DOM.primaryCtaButton.addEventListener("click", scrollToCatalog);
  DOM.cartToggleButton.addEventListener("click", () => toggleCart(true));
  DOM.closeCartButton.addEventListener("click", () => toggleCart(false));
  DOM.cartOverlay.addEventListener("click", () => toggleCart(false));
  DOM.mobileCartButton.addEventListener("click", () => toggleCart(true));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleCart(false);
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobileViewport()) {
      toggleCart(false, { skipScroll: true });
    }
  });
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json();
}

function hydrateData(partners, rawProducts) {
  const partnerList = Array.isArray(partners) ? partners : [];
  const normalizedProducts = Array.isArray(rawProducts)
    ? rawProducts.map(normalizeProduct).filter(Boolean)
    : [];

  const primaryPartner = normalizePartner(partnerList[0] || {});
  state.partner = primaryPartner;

  const matchingProducts = primaryPartner.id
    ? normalizedProducts.filter((product) => product.partnerId === primaryPartner.id)
    : normalizedProducts;

  state.products = matchingProducts.length ? matchingProducts : normalizedProducts;
}

function normalizePartner(rawPartner) {
  return {
    id: typeof rawPartner.mitra_id === "string" ? rawPartner.mitra_id : "",
    name: toTitleCase(rawPartner.mitra_name || "Kantin Digital"),
    owner: toTitleCase(rawPartner.owner_name || "Pengelola Kantin"),
    school: toTitleCase(rawPartner.sekolah || "Sekolah"),
    address: normalizeSpaces(rawPartner.address_owner || "Alamat mitra belum tersedia."),
    phoneDisplay: normalizeDisplayPhone(rawPartner.phone_owner || ""),
    phoneLink: normalizePhoneLink(rawPartner.phone_owner || "")
  };
}

function normalizeProduct(rawProduct) {
  if (!rawProduct || typeof rawProduct !== "object") {
    return null;
  }

  const price = parseNumber(rawProduct.produk_price);
  const stock = parseNumber(rawProduct.produk_stock);
  const name = normalizeSpaces(rawProduct.produk_name || "Produk");
  const category = normalizeCategory(rawProduct.produk_kategori || "LAINNYA");

  if (!name) {
    return null;
  }

  return {
    id: String(rawProduct.produk_id || `${name}-${price}`),
    partnerId: String(rawProduct.mitra_id || ""),
    name: toTitleCase(name),
    category,
    categoryLabel: labelizeCategory(category),
    price,
    stock,
    image: normalizeSpaces(rawProduct.produk_image || ""),
    school: toTitleCase(rawProduct.sekolah || "")
  };
}

function renderPartnerInfo() {
  const partner = state.partner;
  const products = state.products;
  const totalStock = products.reduce((sum, product) => sum + Math.max(product.stock, 0), 0);
  const minimumPrice = products.length ? Math.min(...products.map((product) => product.price)) : 0;
  const categories = getCategories();
  const featuredProducts = getFeaturedProducts(products);
  const previewNames = featuredProducts.map((product) => product.name).slice(0, 3);

  document.title = `${partner.name} | Marketplace Kantin Digital`;

  DOM.partnerName.textContent = partner.name;
  DOM.partnerTagline.textContent = `${products.length} menu untuk ${partner.school}. Dikelola oleh ${partner.owner} dengan alur belanja cepat via WhatsApp.`;
  DOM.schoolBadge.textContent = partner.school;
  DOM.ownerBadge.textContent = `Dikelola ${partner.owner}`;
  DOM.deliveryBadge.textContent = partner.phoneDisplay ? `WhatsApp ${partner.phoneDisplay}` : "Checkout via WhatsApp";

  DOM.statProducts.textContent = String(products.length);
  DOM.statCategories.textContent = String(categories.length);
  DOM.statPrice.textContent = formatCurrency(minimumPrice);
  DOM.statStock.textContent = currency.format(totalStock);

  DOM.addressText.textContent = `${partner.school} - ${partner.address}`;
  DOM.serviceText.textContent = partner.phoneDisplay
    ? `Hubungi ${partner.owner} di ${partner.phoneDisplay} untuk konfirmasi stok atau pickup.`
    : `Hubungi ${partner.owner} untuk konfirmasi stok dan info pemesanan.`;
  DOM.catalogText.textContent = `${products.length} produk aktif, ${categories.length} kategori, dan pilihan cepat seperti ${previewNames.join(", ") || "menu favorit sekolah"}.`;

  DOM.featuredTags.innerHTML = featuredProducts
    .map((product) => `<span class="featured-tag">${escapeHtml(product.name)}</span>`)
    .join("");
}

function renderFilters() {
  const filters = ["ALL", ...getCategories()];

  DOM.filterChips.innerHTML = filters
    .map((category) => {
      const className = category === state.category ? "filter-chip is-active" : "filter-chip";
      const label = category === "ALL" ? "Semua" : labelizeCategory(category);
      return `<button class="${className}" type="button" data-category="${escapeAttribute(category)}">${escapeHtml(label)}</button>`;
    })
    .join("");
}

function renderProducts() {
  const products = getVisibleProducts();

  DOM.productGrid.setAttribute("aria-busy", "false");
  DOM.resultsMeta.textContent = products.length
    ? `${products.length} produk ditemukan untuk ${state.partner.school}`
    : "Tidak ada produk untuk filter yang dipilih";
  DOM.emptyState.classList.toggle("hidden", products.length > 0);

  if (!products.length) {
    DOM.productGrid.innerHTML = "";
    return;
  }

  DOM.productGrid.innerHTML = products
    .map((product, index) => {
      const cartQty = getCartQuantity(product.id);
      const stockClass = product.stock === 0 ? "stock-pill is-out" : product.stock <= 5 ? "stock-pill is-low" : "stock-pill";
      const stockLabel = product.stock === 0 ? "Stok habis" : `Stok ${product.stock}`;
      const buttonLabel = product.stock === 0 ? "Habis" : cartQty ? "Tambah lagi" : "Masukkan ke keranjang";
      const buttonClass = product.stock === 0 ? "add-button" : "add-button is-primary";
      const description = product.school ? `Siap dipesan untuk ${product.school}` : "Siap dipesan hari ini";

      return `
        <article class="product-card" style="--delay: ${Math.min(index * 55, 330)}ms;">
          <div class="product-media">
            ${product.image ? `<img src="${escapeAttribute(product.image)}" alt="${escapeAttribute(product.name)}" loading="lazy" data-product-image="true">` : buildImageFallback(product.name)}
            <span class="product-chip">${escapeHtml(product.categoryLabel)}</span>
            <span class="${stockClass}">${escapeHtml(stockLabel)}</span>
          </div>

          <div class="product-body">
            <div class="product-title-row">
              <h3 class="product-title">${escapeHtml(product.name)}</h3>
              <span class="product-price">${formatCurrency(product.price)}</span>
            </div>

            <p class="product-description">${escapeHtml(description)}</p>

            <div class="product-meta">
              <span>${escapeHtml(product.categoryLabel)}</span>
              ${cartQty ? `<span class="in-cart-pill">${cartQty} di keranjang</span>` : `<span>${escapeHtml(stockLabel)}</span>`}
            </div>

            <button class="${buttonClass}" type="button" data-product-id="${escapeAttribute(product.id)}" ${product.stock === 0 ? "disabled" : ""}>
              ${escapeHtml(buttonLabel)}
            </button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const items = getCartDetails();
  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.lineTotal, 0);

  DOM.cartEmpty.classList.toggle("hidden", items.length > 0);
  DOM.cartItems.innerHTML = items
    .map((item) => {
      return `
        <article class="cart-item">
          <div class="cart-item-head">
            <div>
              <h3 class="cart-item-title">${escapeHtml(item.product.name)}</h3>
              <p class="cart-item-meta">${escapeHtml(item.product.categoryLabel)} - ${escapeHtml(item.stockLabel)}</p>
            </div>
            <span class="cart-item-price">${formatCurrency(item.product.price)}</span>
          </div>

          <div class="cart-item-footer">
            <div class="quantity-controls">
              <button class="quantity-button" type="button" data-cart-product-id="${escapeAttribute(item.product.id)}" data-delta="-1">-</button>
              <span class="quantity-value">${item.qty}</span>
              <button class="quantity-button" type="button" data-cart-product-id="${escapeAttribute(item.product.id)}" data-delta="1">+</button>
            </div>
            <span class="line-total">${formatCurrency(item.lineTotal)}</span>
          </div>
        </article>
      `;
    })
    .join("");

  DOM.summaryCount.textContent = `${totalQuantity} item`;
  DOM.summaryTotal.textContent = formatCurrency(totalPrice);
  DOM.topCartCount.textContent = String(totalQuantity);
  DOM.mobileCartBar.classList.toggle("is-visible", totalQuantity > 0);
  DOM.mobileCartCount.textContent = String(totalQuantity);
  DOM.mobileCartTotal.textContent = formatCurrency(totalPrice);
  DOM.cartMeta.textContent = totalQuantity ? `${totalQuantity} item sedang disiapkan di keranjang` : "Keranjang masih kosong";
  DOM.checkoutButton.disabled = totalQuantity === 0;

  renderRecommendation(items);
  saveCart();
}

function renderRecommendation(items) {
  const recommendation = getRecommendation(items);

  if (!recommendation) {
    DOM.recommendationCard.classList.add("hidden");
    DOM.recommendationButton.dataset.productId = "";
    return;
  }

  DOM.recommendationCard.classList.remove("hidden");
  DOM.recommendationName.textContent = recommendation.name;
  DOM.recommendationMeta.textContent = `${recommendation.categoryLabel} - ${formatCurrency(recommendation.price)}`;
  DOM.recommendationButton.dataset.productId = recommendation.id;
}

function getRecommendation(items = getCartDetails()) {
  if (!state.products.length) {
    return null;
  }

  const cartCategories = new Set(items.map((item) => item.product.category));
  const candidatePool = state.products.filter((product) => product.stock > 0 && !getCartQuantity(product.id));

  if (!candidatePool.length) {
    return null;
  }

  return candidatePool.find((product) => !cartCategories.has(product.category)) || candidatePool[0];
}

function handleFilterClick(event) {
  const button = event.target.closest("[data-category]");

  if (!button) {
    return;
  }

  state.category = button.dataset.category || "ALL";
  renderFilters();
  renderProducts();
}

function handleProductGridClick(event) {
  const button = event.target.closest("[data-product-id]");

  if (!button) {
    return;
  }

  addToCart(button.dataset.productId || "");
}

function handleCartClick(event) {
  const button = event.target.closest("[data-cart-product-id]");

  if (!button) {
    return;
  }

  updateCartItem(button.dataset.cartProductId || "", Number(button.dataset.delta || 0));
}

function handleGridImageError(event) {
  const image = event.target;

  if (!(image instanceof HTMLImageElement) || !image.dataset.productImage) {
    return;
  }

  const fallback = document.createElement("div");
  fallback.className = "product-fallback";
  fallback.textContent = getInitials(image.alt || "KD");
  image.replaceWith(fallback);
}

function addToCart(productId) {
  const product = findProduct(productId);

  if (!product) {
    showToast("Produk tidak ditemukan.");
    return;
  }

  if (product.stock === 0) {
    showToast("Produk ini sedang habis.");
    return;
  }

  const existing = state.cart.find((item) => item.id === productId);

  if (existing) {
    if (existing.qty >= product.stock) {
      showToast("Jumlah sudah mencapai batas stok.");
      return;
    }

    existing.qty += 1;
  } else {
    state.cart.push({ id: productId, qty: 1 });
  }

  renderProducts();
  renderCart();
  showToast(`${product.name} ditambahkan ke keranjang.`);
}

function updateCartItem(productId, delta) {
  if (!delta) {
    return;
  }

  const item = state.cart.find((cartItem) => cartItem.id === productId);
  const product = findProduct(productId);

  if (!item || !product) {
    state.cart = state.cart.filter((cartItem) => cartItem.id !== productId);
    renderProducts();
    renderCart();
    return;
  }

  const nextQty = item.qty + delta;

  if (nextQty <= 0) {
    state.cart = state.cart.filter((cartItem) => cartItem.id !== productId);
    renderProducts();
    renderCart();
    return;
  }

  if (nextQty > product.stock) {
    showToast("Stok tidak mencukupi.");
    return;
  }

  item.qty = nextQty;
  renderProducts();
  renderCart();
}

function addRecommendedProduct() {
  const productId = DOM.recommendationButton.dataset.productId || "";

  if (productId) {
    addToCart(productId);
  }
}

function checkoutViaWhatsApp() {
  const items = getCartDetails();

  if (!items.length) {
    showToast("Keranjang masih kosong.");
    return;
  }

  if (!state.partner.phoneLink) {
    showToast("Nomor WhatsApp penjual belum tersedia.");
    return;
  }

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const lines = [
    `Halo ${state.partner.owner}, saya ingin memesan dari ${state.partner.name}.`,
    "",
    `Sekolah: ${state.partner.school}`,
    "Pesanan:",
    ...items.map((item) => `- ${item.product.name} x${item.qty} = ${formatCurrency(item.lineTotal)}`),
    "",
    `Total: ${formatCurrency(total)}`,
    "Mohon konfirmasi stok dan proses pickup. Terima kasih."
  ];

  const url = `https://wa.me/${state.partner.phoneLink}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, "_blank", "noopener");
}

function contactSeller() {
  if (!state.partner.phoneLink) {
    showToast("Kontak penjual belum tersedia.");
    return;
  }

  const message = encodeURIComponent(`Halo ${state.partner.owner}, saya ingin bertanya soal stok di ${state.partner.name}.`);
  window.open(`https://wa.me/${state.partner.phoneLink}?text=${message}`, "_blank", "noopener");
}

function scrollToCatalog() {
  DOM.searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
  DOM.searchInput.focus({ preventScroll: true });
}

function toggleCart(force, options = {}) {
  const openState = typeof force === "boolean" ? force : !state.cartOpen;

  if (!isMobileViewport()) {
    state.cartOpen = false;
    document.body.classList.remove("cart-open");
    DOM.cartPanel.classList.remove("is-open");
    DOM.cartOverlay.hidden = true;
    DOM.cartToggleButton.setAttribute("aria-expanded", "false");

    if (openState && !options.skipScroll) {
      DOM.cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    return;
  }

  state.cartOpen = openState;
  document.body.classList.toggle("cart-open", openState);
  DOM.cartPanel.classList.toggle("is-open", openState);
  DOM.cartOverlay.hidden = !openState;
  DOM.cartToggleButton.setAttribute("aria-expanded", String(openState));
}

function resetCatalog() {
  state.search = "";
  state.category = "ALL";
  state.sort = "recommended";
  DOM.searchInput.value = "";
  DOM.sortSelect.value = "recommended";
  renderFilters();
  renderProducts();
}

function renderLoadingProducts() {
  DOM.productGrid.innerHTML = Array.from({ length: 6 }, (_, index) => {
    return `
      <article class="product-card" style="--delay: ${Math.min(index * 50, 280)}ms;">
        <div class="product-media"></div>
        <div class="product-body">
          <div class="product-title-row">
            <div style="height: 18px; width: 60%; border-radius: 999px; background: rgba(43, 34, 27, 0.08);"></div>
            <div style="height: 18px; width: 24%; border-radius: 999px; background: rgba(43, 34, 27, 0.08);"></div>
          </div>
          <div style="height: 14px; width: 75%; border-radius: 999px; background: rgba(43, 34, 27, 0.08);"></div>
          <div style="height: 48px; border-radius: 16px; background: rgba(43, 34, 27, 0.08);"></div>
        </div>
      </article>
    `;
  }).join("");
}

function renderFailureState() {
  DOM.resultsMeta.textContent = "Gagal memuat katalog";
  DOM.productGrid.setAttribute("aria-busy", "false");
  DOM.productGrid.innerHTML = "";
  DOM.emptyState.classList.remove("hidden");
}

function syncCartWithProducts() {
  state.cart = state.cart
    .map((item) => {
      const product = findProduct(item.id);

      if (!product || product.stock <= 0) {
        return null;
      }

      const qty = Math.min(Math.max(Number(item.qty) || 0, 0), product.stock);
      return qty ? { id: product.id, qty } : null;
    })
    .filter(Boolean);
}

function getVisibleProducts() {
  const filtered = state.products.filter((product) => {
    const matchCategory = state.category === "ALL" || product.category === state.category;
    const matchSearch = !state.search || product.name.toLowerCase().includes(state.search);
    return matchCategory && matchSearch;
  });

  return filtered.sort((first, second) => compareProducts(first, second, state.sort));
}

function compareProducts(first, second, sortMode) {
  if (sortMode === "lowest") {
    return first.price - second.price || first.name.localeCompare(second.name, "id");
  }

  if (sortMode === "highest") {
    return second.price - first.price || first.name.localeCompare(second.name, "id");
  }

  if (sortMode === "stock") {
    return second.stock - first.stock || first.price - second.price;
  }

  const stockRank = Number(second.stock > 0) - Number(first.stock > 0);
  const cartRank = getCartQuantity(second.id) - getCartQuantity(first.id);
  return stockRank || cartRank || first.price - second.price || first.name.localeCompare(second.name, "id");
}

function getCartDetails() {
  return state.cart
    .map((item) => {
      const product = findProduct(item.id);

      if (!product) {
        return null;
      }

      return {
        product,
        qty: item.qty,
        lineTotal: product.price * item.qty,
        stockLabel: product.stock === 0 ? "Stok habis" : `Sisa stok ${product.stock}`
      };
    })
    .filter(Boolean);
}

function getCategories() {
  return [...new Set(state.products.map((product) => product.category))];
}

function getFeaturedProducts(products) {
  return [...products]
    .filter((product) => product.stock > 0)
    .sort((first, second) => compareProducts(first, second, "recommended"))
    .slice(0, 5);
}

function findProduct(productId) {
  return state.products.find((product) => product.id === productId) || null;
}

function getCartQuantity(productId) {
  const foundItem = state.cart.find((item) => item.id === productId);
  return foundItem ? foundItem.qty : 0;
}

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Unable to parse cart:", error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !window.location.protocol.startsWith("http")) {
    return;
  }

  navigator.serviceWorker.register("./sw.js").catch((error) => {
    console.warn("Service worker registration failed:", error);
  });
}

function showToast(message) {
  DOM.toast.textContent = message;
  DOM.toast.classList.add("is-visible");

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    DOM.toast.classList.remove("is-visible");
  }, MAX_TOAST_TIME);
}

function formatCurrency(value) {
  return `Rp ${currency.format(Math.max(Number(value) || 0, 0))}`;
}

function parseNumber(value) {
  return Number(String(value || "0").replace(/[^\d]/g, "")) || 0;
}

function normalizeCategory(value) {
  return normalizeSpaces(value).toUpperCase() || "LAINNYA";
}

function labelizeCategory(value) {
  return toTitleCase(normalizeCategory(value).toLowerCase());
}

function normalizeSpaces(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function toTitleCase(value) {
  return normalizeSpaces(value)
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePhoneLink(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("62")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  return digits;
}

function normalizeDisplayPhone(value) {
  const digits = normalizePhoneLink(value);

  if (!digits) {
    return "";
  }

  return digits.replace(/(\d{2})(\d{3,4})(\d{3,4})(\d{0,4})/, (_, first, second, third, fourth) => {
    return [first, second, third, fourth].filter(Boolean).join(" ");
  });
}

function buildImageFallback(name) {
  return `<div class="product-fallback">${escapeHtml(getInitials(name))}</div>`;
}

function getInitials(value) {
  return normalizeSpaces(value)
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "KD";
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 980px)").matches;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
