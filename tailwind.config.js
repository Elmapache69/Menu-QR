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
        ember: {
          400: "#f2a93b",
          500: "#e8722c",
          600: "#c1391f",
          700: "#8f2416",
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
