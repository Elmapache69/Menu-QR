/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        char: {
          950: "#0f0d0b",
          900: "#161310",
          800: "#1f1b17",
          700: "#2b2521",
          600: "#3d3530",
        },
        // Colores "ember" controlados por variables CSS (ver globals.css)
        // para poder cambiar de tema (Halloween, Navidad, Fiestas
        // Patrias) sin tocar cada componente que usa estos colores.
        ember: {
          400: "rgb(var(--ember-400) / <alpha-value>)",
          500: "rgb(var(--ember-500) / <alpha-value>)",
          600: "rgb(var(--ember-600) / <alpha-value>)",
          700: "rgb(var(--ember-700) / <alpha-value>)",
        },
        smoke: {
          100: "#f4ede1",
          300: "#d9cdbb",
          500: "#a9998861",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
    },
  },
  plugins: [],
};
