// vite.config.ts
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      devOptions: {
        enabled: true,
        type: 'module'
      }, 
      workbox: {
        // TS Fix: Added 'ts' to the caching patterns
        globPatterns: ['**/*.{js,ts,css,html,ico,png,svg,json}']
      }
    })
  ],

  server: {
    port: 3000,
    open: true,
    proxy: {
      // Forward any request starting with /api to Wrangler
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        auth: 'skeleton/auth_placeholder.html',
        profile: 'skeleton/profile_placeholder.html',
        problem: 'skeleton/problem_placeholder.html'
      }
    }
  },

  test: {
    environment: 'happy-dom', // Simulates the browser environment
    globals: true, // Allows us to use describe/it without importing them every time
  }
});