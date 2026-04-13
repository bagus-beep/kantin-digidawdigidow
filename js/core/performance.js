// =========================================
// performance.js (Optimization Layer)
// =========================================
export const Performance = {
  lazyImages() {
    const images = document.querySelectorAll('img[data-src]');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      });
    });

    images.forEach(img => observer.observe(img));
  },

  virtualList(container, items, renderItem) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
      const el = renderItem(item);
      fragment.appendChild(el);
    });
    container.innerHTML = '';
    container.appendChild(fragment);
  }
};