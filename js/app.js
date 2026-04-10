// js/app.js - Minimal Initialization Only
init();

function goHome() {
  console.log('Go to Home');
}

function goTransaction() {
  alert('Fitur Transaksi akan segera hadir!');
}

function goAccount() {
  alert('Fitur Akun akan segera hadir!');
}

async function init() {
  renderSkeleton();
  bindEvents();
  updateCount();
  updateNavCount();
  
  // Load initial data
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
  
  // Auto refresh every 30s
  setInterval(loadProducts, 30000);
}

