import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      input: {
        main: '/index.html',
      },
      // Exclude template emails from build
      external: ['templates/**'],
    },
  },
  // Prevent Vite from processing template email HTML files
  optimizeDeps: {
    exclude: ['templates'],
  },
});
