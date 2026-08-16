import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    // Proxy API requests to your backend server
    // Change 'http://localhost:8080' to your actual backend port if different
    proxy: {
      '/_api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@pages': path.resolve(__dirname, './pages'),
      '@helpers': path.resolve(__dirname, './helpers'),
      '@endpoints': path.resolve(__dirname, './endpoints'),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
    // Include crypto-js or other crypto shims if you aren't using a plugin
    include: ['crypto-js'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Ensure templates are not treated as JS entries
      external: [],
    },
  },
  // Define process.env for browser compatibility
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
});