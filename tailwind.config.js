/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
    "./index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#020617',
        accent: '#1e3a8a',
        gold: '#fbbf24'
      }
    }
  },
  plugins: [],
}

