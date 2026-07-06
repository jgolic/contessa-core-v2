/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mjs}",
    "./src/**/*.{js,jsx,ts,tsx,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        // Midnight Bridge remap: cyan carries the champagne-gold accent language.
        cyan: {
          50: "#fbf8ef",
          100: "#f5edd8",
          200: "#ecdcb2",
          300: "#dfc487",
          400: "#d3b071",
          500: "#c9a96a",
          600: "#b08a45",
          700: "#8f6e36",
          800: "#6e542b",
          900: "#513e22",
          950: "#2e2213",
        },
        // teal carries the sea-jade "healthy / ready" language.
        teal: {
          50: "#eefaf4",
          100: "#d8efe4",
          200: "#b5e0ce",
          300: "#83c8ac",
          400: "#58ae8f",
          500: "#3d9477",
          600: "#2e7861",
          700: "#275f4f",
          800: "#224b40",
          900: "#1e3e36",
          950: "#0f241f",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
