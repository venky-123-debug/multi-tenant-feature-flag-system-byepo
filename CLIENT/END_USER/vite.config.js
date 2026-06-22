import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import vitePluginInject from "./vite-plugin-inject.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), vitePluginInject()],
  build: {
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    port: 5600,
    open: false,
    strictPort: true,
    hmr: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
