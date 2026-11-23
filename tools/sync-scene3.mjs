// Copies scene 3 (the Decena Trágica, 9 February 1913) into this project.
//   npm run sync3        (reads ../prototype/scene3.html)
// The prototype builds the battle as one self-contained page (assemble3.py, then build3.py: textures,
// the people kit and horses are inlined). It goes into public/ as is, so Vite ships it untouched at scene3.html,
// where the palace's arrow after its newspaper points.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '../prototype/scene3.html'));
const html = fs.readFileSync(SRC, 'utf8');
// the game shell: game title, shell client first thing in <head>, the palace hook last (public/shell/)
function shellify(h) {
  if (h.includes('shell/client.js')) return h;
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>The Art of the Mexican Revolution: Casasola's Photography</title>\n<script src="shell/client.js"></script>`);
  return h.replace(/\s*$/, '\n<script src="shell/scene3-hook.js"></script>\n');
}
if (!/window\.G3 = G3/.test(html) || /__U_LIST__|__PEOPLE_KIT__/.test(html)) { console.error('sync-scene3: ' + SRC + ' is not a finished build (run build3.py)'); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'public/scene3.html'), shellify(html));
console.log('wrote public/scene3.html', html.length);
