// js/app.js - Minimal Initialization Only
init();

async function loadPartner() {
  try {
    const res = await fetch('data/partners.json');
    PARTNER = await res.json();
    setHeader(PARTNER[0]?.mitra_name || 'Kantin Digital');
  } catch (e) {
    console.warn('Partner load skipped:', e);
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

