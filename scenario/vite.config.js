import { defineConfig } from 'vite';

// Served by the main Next.js app from public/scenario at /scenario.
// An absolute base keeps asset, font, and data URLs correct with or
// without a trailing slash on the page URL.
export default defineConfig({
  base: '/scenario/',
  build: { target: 'es2022', outDir: 'dist' },
});
