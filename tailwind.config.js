/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./css/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#020617',
        accent: '#1e3a8a',
        gold: '#fbbf24',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-out',
        'stagger': 'stagger 0.3s ease-in-out',
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: [],
}
