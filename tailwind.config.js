/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
      },
      colors: {
        brandBlue: '#1e3a8a',   // azul escuro
        brandPurple: '#6d28d9', // roxo
      },
    },
  },
  plugins: [],
};
