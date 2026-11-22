// Copies scene 2 (the Palacio Nacional, 1912) into this project.
//   npm run sync2        (reads ../prototype/scene2.html)
// The prototype builds the palace as one self-contained page (assemble2.py, then build2.py: textures,
// the people kit and horses are inlined). It goes into public/ as is, so Vite ships it untouched at scene2.html,
// where the office's "next scene" link already points.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '../prototype/scene2.html'));
const html = fs.readFileSync(SRC, 'utf8');
if (!/window\.G2 = /.test(html) || /__U_LIST__|__PEOPLE_KIT__/.test(html)) { console.error('sync-scene2: ' + SRC + ' is not a finished build (run build2.py)'); process.exit(1); }
fs.writeFileSync(path.join(ROOT, 'public/scene2.html'), html);
console.log('wrote public/scene2.html', html.length);
