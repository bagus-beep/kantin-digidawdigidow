// js/app.js - Minimal Initialization Only
init();

async function loadPartner() {
  try {
    const res = await fetch('data/products.json');
    const data = await res.json();
    if (data[0]) {
      PARTNER = { mitra_name: 'Kantin Digital' };
      setHeader(PARTNER.mitra_name);
    }
  } catch (e) {
    console.warn('Partner load skipped:', e);
    setHeader('Kantin Digital');
  }
}

function goHome() {
  console.log('Go to Home');
}

function goTransaction() {
  alert('Fitur Transaksi akan segera hadir!');
}

function goAccount() {
  alert('Fitur Akun akan segera hadir!');
}

function init() {
  renderSkeleton();  
  bindEvents();
  updateCount();
  
  // Load data
  Promise.all([
    loadPartner(),
    loadProducts()
  ]).then(() => {
    renderFilter();
    render();
    updateUpsell();
  }).catch(err => {
    console.error('Load error:', err);
    toast('Error loading data');
  });
  
  // Auto refresh
  setInterval(loadProducts, 30000);
}

