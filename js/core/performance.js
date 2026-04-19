export const Performance = {
  observer: null,
  observed: new WeakSet(),

  lazyImages(root = document) {
    const images = root.querySelectorAll('img[data-src]');
    if (!images.length) return;

    if (!('IntersectionObserver' in window)) {
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
      return;
    }

    if (!this.observer) {
      this.observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          this.observer.unobserve(img);
        });
      }, { rootMargin: '120px 0px' });
    }

    images.forEach(img => {
      if (this.observed.has(img)) return;
      this.observed.add(img);
      this.observer.observe(img);
    });
  }
};
