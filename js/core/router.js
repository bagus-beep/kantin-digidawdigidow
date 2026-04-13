// =========================================
// router.js (SPA Navigation System)
// =========================================
export const Router = {
  init() {
    window.addEventListener('hashchange', this.handleRoute);
    this.handleRoute();
  },

  handleRoute() {
    const page = location.hash.replace('#', '') || 'home';

    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.remove('active');
    });

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('active');
    });

    const targetPage = document.getElementById(page);
    const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);

    targetPage?.classList.add('active');
    targetNav?.classList.add('active');
  }
};