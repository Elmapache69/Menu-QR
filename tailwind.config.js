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
          950: "rgb(var(--char-950) / <alpha-value>)",
          900: "rgb(var(--char-900) / <alpha-value>)",
          800: "rgb(var(--char-800) / <alpha-value>)",
          700: "rgb(var(--char-700) / <alpha-value>)",
          600: "rgb(var(--char-600) / <alpha-value>)",
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
          100: "rgb(var(--smoke-100) / <alpha-value>)",
          300: "rgb(var(--smoke-300) / <alpha-value>)",
          500: "rgb(var(--smoke-500) / <alpha-value>)",
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
