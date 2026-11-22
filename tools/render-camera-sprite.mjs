// Renders the loading screen's spinning camera: the same 1910s folding plate camera the player carries in scene 1
// (the FP block of src/scenes/scene1/scene1.js), turned a full circle in COLS x ROWS frames and packed into one
// sprite sheet, public/shell/camera-spin.jpg. The loader plays it with CSS steps() on transforms, so it keeps
// spinning on the compositor even while a scene's scripts are parsing.
//   node tools/render-camera-sprite.mjs        (needs playwright and chromium; three from node_modules)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COLS = +(process.env.COLS || 12), ROWS = +(process.env.ROWS || 12), TILE = 168, SS = 2;
const src = fs.readFileSync(path.join(ROOT, 'src/scenes/scene1/scene1.js'), 'utf8');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker not found: ' + a); return src.slice(i, j + b.length); };
const helpers = cut('let useed = 12345;', '\n  return c;\n}');
const fp = cut('const FP = (() => {', "setHover: v => { hoverT = v; } };\n})();");

const page = `<!doctype html><html><body style="margin:0;background:#000">
<script type="importmap">{ "imports": { "three": "/node_modules/three/build/three.module.js" } }</script>
<script type="module">
import * as THREE from 'three';
import { RoomEnvironment } from '/node_modules/three/examples/jsm/environments/RoomEnvironment.js';
${helpers}
const IMG = { woodbrown: new Image() };
await new Promise(r => { IMG.woodbrown.onload = IMG.woodbrown.onerror = r; IMG.woodbrown.src = '/public/scenes/scene1/tex/woodbrown.jpg'; });
const patch = m => m, markShared = o => o, mergeGeos = () => new THREE.Group();
const sun = new THREE.Object3D(), scene = new THREE.Scene(), host = document.body;
const camera = new THREE.PerspectiveCamera(24, 1, .01, 10);
${fp}
const S = ${TILE * SS};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(S, S); renderer.setPixelRatio(1);
renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);
const pm = new THREE.PMREMGenerator(renderer);
const stage = new THREE.Scene(); stage.background = new THREE.Color(0x000000);
stage.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
// neutral white light only: a key from the upper left, a soft fill, a cool rim from behind
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(-1.2, 1.6, 1.4); stage.add(key);
const fill = new THREE.DirectionalLight(0xffffff, .5); fill.position.set(1.4, .3, .8); stage.add(fill);
const rim = new THREE.DirectionalLight(0xeef2ff, 1.6); rim.position.set(.4, 1.0, -2); stage.add(rim);
stage.add(new THREE.HemisphereLight(0xffffff, 0x222222, .35));
// the camera without its cable and bulb, every part in a physically lit material made from the game's own textures
const LOOK = { leather: [.75, 0], bellows: [.85, 0], nickel: [.28, 1], brass: [.32, 1], japan: [.35, .1], mahogany: [.45, 0], wool: [.9, 0], dial: [.4, .2], scale: [.6, 0], slide: [.5, 0], knurl: [.3, 1], level: [.2, 0], ivory: [.6, 0] };
const pivot = new THREE.Group(), model = FP.model.clone(true);
model.traverse(o => { o.layers.set(0); });
const drop = [];
model.traverse(o => {
  if (!o.isMesh) return;
  const m = o.material, name = m.userData.fpName;
  if (name === 'rubber' || o.position.y < -.12) { drop.push(o); return; }
  const glow = name === 'glass' || name === 'finder';
  const [rough, metal] = LOOK[name] || [.6, 0];
  const nm = new THREE.MeshStandardMaterial({ color: glow ? 0x000000 : m.color.getHex(), map: glow ? null : m.map, roughness: rough, metalness: metal, side: m.side, envMapIntensity: metal ? 1.4 : .6 });
  if (glow) { nm.emissive = new THREE.Color(0xffffff); nm.emissiveMap = m.emissiveMap || m.map; nm.roughness = .05; nm.metalness = 0; nm.color.setHex(0x111111); }
  for (const t of [nm.map, nm.emissiveMap]) if (t) { t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; t.needsUpdate = true; }
  o.material = nm;
});
drop.forEach(o => o.parent.remove(o));
model.position.set(0, 0, 0); model.rotation.set(0, 0, 0); model.scale.set(1, 1, 1); model.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(model), c = box.getCenter(new THREE.Vector3());
model.position.sub(c); pivot.add(model); stage.add(pivot);
const R = box.getSize(new THREE.Vector3()).length() / 2;
const el = .32, dist = R / Math.sin(camera.fov * Math.PI / 360) * .86;
scene.remove(camera); camera.remove(FP.rig);
camera.position.set(0, Math.sin(el) * dist, Math.cos(el) * dist); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
const N = ${COLS * ROWS}, sheet = document.createElement('canvas'); sheet.width = ${COLS * TILE}; sheet.height = ${ROWS * TILE};
const g = sheet.getContext('2d'); g.imageSmoothingQuality = 'high';
for (let i = 0; i < N; i++) {
  pivot.rotation.y = -i / N * Math.PI * 2 + .6;
  renderer.render(stage, camera);
  g.drawImage(renderer.domElement, (i % ${COLS}) * ${TILE}, Math.floor(i / ${COLS}) * ${TILE}, ${TILE}, ${TILE});
}
window.__sheet = sheet.toDataURL('image/jpeg', .82);
</script></body></html>`;

// tag each FP material with its name so the page can choose a finish for it
const tagged = page.replace("const M = {", "const M = {").replace(
  "  const model = new THREE.Group();",
  "  for (const k in M) M[k].userData.fpName = k;\n  const model = new THREE.Group();");

const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  if (u === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(tagged); }
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await browser.newPage();
p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('page error:', e.message));
await p.goto(`http://localhost:${port}/`);
await p.waitForFunction(() => window.__sheet, null, { timeout: 240000 });
const data = await p.evaluate(() => window.__sheet);
const out = path.join(ROOT, 'public/shell/camera-spin.jpg');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log('wrote', out, fs.statSync(out).size);
await browser.close(); server.close();
