/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#08090A",
        surface: "#0F1011",
        "surface-dim": "#11131b",
        "surface-bright": "#373941",
        "surface-container-lowest": "#050505",
        "surface-container-low": "#0F1011",
        "surface-container": "#0F1011",
        "surface-container-high": "#161718",
        "surface-container-highest": "#23252A",
        "surface-variant": "#32343d",
        "on-surface": "#e1e2ed",
        "on-surface-variant": "#A0AEC0",
        "on-background": "#e1e2ed",
        outline: "#23252A",
        "outline-variant": "#23252A",

        primary: "#3C7BFA",
        "on-primary": "#FFFFFF",
        "primary-container": "#3C7BFA",
        "on-primary-container": "#002663",

        secondary: "#bac8da",
        "on-secondary": "#243240",
        "secondary-container": "#161718",
        "on-secondary-container": "#acbacc",

        tertiary: "#ffb68b",
        "on-tertiary": "#522300",
        "tertiary-container": "#e37117",
        "on-tertiary-container": "#481e00",

        error: "#ffb4ab",
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",

        // Backward-compat aliases — old pages (pre-migration) still reference
        // these names. Points them at the closest new-design equivalent so
        // nothing renders unstyled while pages are migrated phase by phase.
        // Safe to delete once every page below has been rebuilt.
        bg: "#08090A",
        panel: "#0F1011",
        panel2: "#161718",
        border: "#23252A",
        gold: { DEFAULT: "#3C7BFA", bright: "#5B8FFF" },
        ink: "#e1e2ed",
        muted: "#A0AEC0",
        danger: "#ffb4ab",
        success: "#4ADE80",
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.03em", fontWeight: "700" }],
        "label-sm": ["13px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        mono: ["14px", { lineHeight: "20px", fontWeight: "400" }],
      },
      spacing: {
        gutter: "16px",
        "padding-card": "24px",
        "stack-xs": "4px",
        "stack-sm": "8px",
        "stack-md": "16px",
        "stack-lg": "32px",
        "section-gap": "96px",
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        "2xl": "0.75rem",
        full: "9999px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(60,123,250,0.08)",
      },
    },
  },
  plugins: [],
};
