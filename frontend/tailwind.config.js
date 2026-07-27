/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        panel: "#131313",
        panel2: "#1a1a1a",
        border: "rgba(201,168,106,0.14)",
        gold: {
          DEFAULT: "#c9a86a",
          bright: "#e4c88a",
        },
        ink: "#ece7dd",
        muted: "#a39a8a",
        danger: "#e06a6a",
        success: "#6ac98a",
      },
      fontFamily: {
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
