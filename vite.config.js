import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const proxyTarget = process.env.VITE_API_BASE_URL;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: proxyTarget
    ? {
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: true,
          },
        },
      }
    : undefined,
});