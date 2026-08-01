/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        panel2: "var(--panel2)",
        border: "var(--border)",
        // "gold" is a historical name from an earlier palette — kept as an
        // alias so every existing page (Dashboard, Automations, Analytics,
        // Billing, Sidebar, etc.) picks up the new trust-blue palette
        // automatically via the CSS variables below, with zero JSX changes.
        gold: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          bright: "rgb(var(--brand-bright) / <alpha-value>)",
        },
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          bright: "rgb(var(--brand-bright) / <alpha-value>)",
          deep: "rgb(var(--brand-deep) / <alpha-value>)",
        },
        mint: "rgb(var(--mint) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Instrument Sans'", "sans-serif"],
        sans: ["'Manrope'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        xl2: "14px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        card: "0 2px 8px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
        lifted: "0 12px 32px -8px rgba(16, 24, 40, 0.18)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        "bubble-in": { "0%": { opacity: 0, transform: "scale(0.85) translateY(6px)" }, "100%": { opacity: 1, transform: "scale(1) translateY(0)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "bubble-in": "bubble-in 0.45s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
