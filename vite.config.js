import { defineConfig } from 'vite';
// base './' makes every URL relative, so the same build works at any address
// (GitHub Pages under /<repo>/, Cloudflare Pages at the root, or a local folder).
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900 },
  server: { host: true },
});
