// js/ui.js - UI Rendering
const grid = document.getElementById('grid');

function bindEvents() {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', (e) => {
    STATE.search = e.target.value.toLowerCase();
    render();
  });
}

function renderSkeleton() {
  grid.innerHTML = Array(4).fill(0).map(() => `<div class="glass rounded-2xl h-44 skeleton"></div>`).join('');
}

function renderFilter() {
  const cats = ['ALL', 'MAKANAN', 'MINUMAN'];
  const el = document.getElementById('filterBar');
  el.innerHTML = cats.map(c => `
    <button onclick="setFilter('${c}')" class="px-3 py-1 rounded-full text-xs ${STATE.filter === c ? 'bg-gold text-black shadow' : 'glass'}">${c}</button>
  `).join('');
}

function toast(msg) {
  let t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 1500);
}

function rupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

