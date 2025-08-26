/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        klinosBlue: "#0a2540", // Azul escuro
        klinosGreen: "#16a34a", // Verde acentuado
      },
    },
  },
  plugins: [],
};
