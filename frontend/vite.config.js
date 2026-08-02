import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Splits heavy, rarely-changing libraries into their own chunks so
        // the browser can cache them independently of app code — visitors
        // only re-download these when the library itself updates, not on
        // every deploy. recharts/react-loading-skeleton are only used on a
        // couple of pages, so isolating them also shrinks what the browser
        // has to parse before the initial page (e.g. Landing) is interactive.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-charts": ["recharts"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
});
