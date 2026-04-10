// js/state.js - State Management
let PRODUCTS = [];
let PARTNER = null;
const STATE = {
  filter: 'ALL',
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  search: ''
};

const CACHE_KEY = 'kantin_data';
const CACHE_EXPIRY = 3600000; // 1 hour

function persist() {
  localStorage.setItem('cart', JSON.stringify(STATE.cart));
  updateCount();
  updateNavCount();
}

function updateCount() {
  const count = STATE.cart.reduce((a, b) => a + b.qty, 0);
  const navCount = document.getElementById('navCount');
  if (count > 0) {
    navCount.innerText = count;
    navCount.classList.remove('hidden');
  } else {
    navCount.classList.add('hidden');
  }
}

function updateNavCount() {
  updateCount();
}

function setHeader(name) {
  const header = document.querySelector('header h1');
  if (header) header.textContent = name;
}

