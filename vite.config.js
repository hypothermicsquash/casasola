import { defineConfig } from 'vite';
// base './' makes every URL relative, so the same build works at any address
// (GitHub Pages under /<repo>/, Cloudflare Pages at the root, or a local folder).
// Pages: index.html is the game shell (title, loading screen, the frame each scene plays in); scene1.html the railway town,
// office.html the publisher's office, credits.html the credits; they share the people kit chunk.
// The palace (scene 2) is a self-contained page built by the prototype, copied verbatim from public/scene2.html.
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0, chunkSizeWarningLimit: 900, rollupOptions: { input: { main: 'index.html', scene1: 'scene1.html', office: 'office.html', credits: 'credits.html' } } },
  server: { host: true },
});
