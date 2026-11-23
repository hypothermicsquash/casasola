// Bundles the publisher's office (src/scenes/office/office.js) into one plain script that scene 3's standalone page
// can run inside itself (see prototype/src/assemble3.py). three.js and the people kit come from the page's globals,
// the stylesheet is handed over as text for the shadow root, and the pictures as data URIs.
//   node tools/office-embed.mjs <out dir>
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2]; if (!out) { console.error('usage: node tools/office-embed.mjs <out dir>'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const shim = {
  name: 'globals',
  setup(b) {
    b.onResolve({ filter: /^three$|three\.module\.js$/ }, () => ({ path: 'three', namespace: 'g' }));
    b.onResolve({ filter: /people-kit\.js$/ }, () => ({ path: 'kit', namespace: 'g' }));
    b.onResolve({ filter: /\.css$/ }, () => ({ path: 'css', namespace: 'g' }));
    b.onLoad({ filter: /.*/, namespace: 'g' }, a => ({ contents: a.path === 'three' ? 'module.exports = window.THREE;' : a.path === 'kit' ? 'export const LowPolyPeople = window.LowPolyPeople;' : '', loader: 'js' }));
  }
};
await build({ entryPoints: ['src/scenes/office/office.js'], bundle: true, format: 'iife', target: 'es2019', minify: true, legalComments: 'none', outfile: path.join(out, 'office.iife.js'), plugins: [shim] });
fs.copyFileSync('src/scenes/office/style.css', path.join(out, 'office.css'));
// the room's markup, as office.html has it (everything in <body> before its script)
{ const h = fs.readFileSync('office.html', 'utf8'); fs.writeFileSync(path.join(out, 'office-body.html'), h.slice(h.indexOf('<body>') + 6, h.indexOf('<script type="module"')).trim() + '\n'); }
// the big button style the shell gives every page (public/shell/client.js), for the room's way out
{ const c = fs.readFileSync('public/shell/client.js', 'utf8'), m = c.match(/css\.textContent = ('[\s\S]*?');\n/); fs.writeFileSync(path.join(out, 'cas-go.css'), new Function('return ' + m[1].replace(/\n\s*\+ /g, ' + '))()); }
for (const f of ['desk1.jpg', 'desk2.jpg', 'desk3.jpg', 'desk4.jpg', 'framed-tram-1911.jpg']) fs.copyFileSync('public/scenes/office/' + f, path.join(out, f));
fs.copyFileSync('public/scenes/scene1/assets/paper.jpg', path.join(out, 'paper.jpg'));
console.log('office embed ->', out, fs.statSync(path.join(out, 'office.iife.js')).size);
