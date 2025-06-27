/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          'green-dark': '#128C7E',
          'green-light': '#DCF8C6',
        }
      }
    },
  },
  plugins: [],
}