import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import vitePluginInject from "./vite-plugin-inject.js"; // Import the custom plugin

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginInject()],
  build: {
    sourcemap: true, // Disable source maps
    emptyOutDir: true, // Clear dist folder before build
  },
  server: {
    port: 5200,
    open: false,
    strictPort: true,
    hmr: true, // Auto restart
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
