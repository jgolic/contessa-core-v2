/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mjs}",
    "./src/**/*.{js,jsx,ts,tsx,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        hull: {
          900: "#0A1626",
          800: "#10203A",
          700: "#1A2F4F",
        },
        deck: {
          50: "#FAF7F0",
          100: "#F1EBDE",
          200: "#E4DBC8",
        },
        signal: "#FF4F30",
        brass: "#B08D4C",
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
        // blue carries the oxford-navy ink language: dark premium details
        // (chips, links, active states) on the eggshell canvas.
        blue: {
          50: "#f0f2f7",
          100: "#e1e6ef",
          200: "#c6cfdf",
          300: "#a2b0c9",
          400: "#7488ab",
          500: "#51688f",
          600: "#3b5177",
          700: "#2c3f61",
          800: "#22324e",
          900: "#1b2840",
          950: "#111a2c",
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
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
