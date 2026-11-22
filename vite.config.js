import { defineConfig } from 'vite';
// base './' makes every URL relative, so the same build works at any address
// (GitHub Pages under /<repo>/, Cloudflare Pages at the root, or a local folder).
// Two pages: index.html is scene 1, scene2.html is the palace; they share the people kit chunk.
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900, rollupOptions: { input: { main: 'index.html', scene2: 'scene2.html' } } },
  server: { host: true },
});
