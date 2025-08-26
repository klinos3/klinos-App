/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'ui-sans-serif', 'system-ui', 'Arial', 'sans-serif'],
      },
      colors: {
        klinosBlue: '#0f4fa2',    // ajuste brand azul (podes refinar)
        klinosPurple: '#5b3cc4',  // roxo azulado
        klinosLight: '#e6f0ff',
      },
    },
  },
  plugins: [],
};
