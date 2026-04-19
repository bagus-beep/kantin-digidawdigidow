export const Router = {
  init() {
    document.addEventListener('click', event => {
      const button = event.target.closest('.nav-item[data-page]');
      if (!button) return;

      const { page } = button.dataset;
      if (!page) return;

      if (location.hash !== `#${page}`) {
        location.hash = page;
        return;
      }

      this.handleRoute();
    });

    window.addEventListener('hashchange', () => this.handleRoute());

    if (!location.hash) {
      location.hash = 'home';
    } else {
      this.handleRoute();
    }
  },

  handleRoute() {
    const page = location.hash.replace('#', '') || 'home';

    document.querySelectorAll('[data-page].page').forEach(section => {
      section.classList.toggle('active', section.id === page);
    });

    document.querySelectorAll('.nav-item').forEach(button => {
      button.classList.toggle('active', button.dataset.page === page);
    });
  }
};
