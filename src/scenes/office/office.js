// The publisher's office: a short talk between scene 1 (the railway town, 1911) and scene 2 (the palace, 1912).
// First person, seated across the desk. One warm bulb above you is the only light. The publisher is built on the
// low-poly people kit with his own face painter (many expressions, spiral eyes when riled) and procedural body acting.
import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LowPolyPeople } from '../scene1/people-kit.js';
import { setupEmbed } from '../../engine/embed.js';
import './style.css';

setupEmbed();
const $ = id => document.getElementById(id);
const asset = p => new URL(p, location.href).href;
document.documentElement.style.setProperty('--paper', `url("${asset('scenes/scene1/assets/paper.jpg')}")`);
const PARAMS = new URLSearchParams(location.search);
const NEXT = 'scene2.html';

// ---------- the user's script, word for word. Bold terms carry an English gloss on hover. ----------
// Each beat is one card. `act` is the body acting, `face` the expression, `then` an event when the line is fully shown.
const T = (t, en) => ({ t, en });
const BEATS = [
  { say: ['You take some good photos.'], face: 'pleased', act: 'idle' },
  { say: ['Madero’s earned a good amount of public support, thanks to you.'], face: 'happy', act: 'gesture' },
  { say: ['He’s a true man of law, breaking the chains of the ', T('Porfiriato', 'the 34-year rule of the dictator Porfirio Díaz'), '!'], face: 'fired', act: 'fist' },   // user asked to replace 'sierra'
  { say: ['seems Mexico may be finally in the right hands.'], face: 'dreamy', act: 'dreamy' },
  { say: ['However, our government is still crawling with ', T('Porfirian loyalists', 'supporters of Porfirio Díaz, the dictator Madero overthrew'), '.'], face: 'suspicious', act: 'suspicious' },
  { say: ['And the hacendados of the mines and factories too- they still think this country is their private ranch!'], face: 'riled', act: 'riled', then: 'slam' },
  { say: ['You must demonstrate to them- the ', T('administradores', 'administrators; the managers who run the estates and companies'), ', the ', T('cientificos', '“the scientists”: Díaz’s circle of technocrat advisers'), '- the power of Madero’s presidency!'], face: 'angry', act: 'pound' },
  { say: ['Madero will shield the people of this country, rule with kindness and power.'], face: 'proud', act: 'proud' },
  { say: ['Those ', T('ricos', 'the rich'), ' will have no say in government anymore, Mark my words.'], face: 'riled', act: 'riled', then: 'slam' },
  { say: ['I’ve received word that Madero’s cabinet will be assembling in the ', T('Palacio National', 'the National Palace, seat of the government in Mexico City'), ' today.'], face: 'sly', act: 'lean' },
  { say: ['You must find a way to take their photo- something powerful and imposing, to demonstrate the power of his presidency…'], face: 'intense', act: 'imposing' },
  { say: ['I’m sure you’ll find a way.'], face: 'wink', act: 'wink' },
  { say: ['Good luck, and hurry!'], face: 'frantic', act: 'shoo' }
];

// ---------- renderer and quality tier (same rule as scenes 1 and 2: Chromebooks and small machines get tier 2) ----------
const Q = (() => {
  const p = PARAMS.get('q');
  if (p === 'low') return 2; if (p === 'mid') return 1; if (p === 'high') return 0;
  const cros = /CrOS/.test(navigator.userAgent), mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  return (cros || mem <= 4 || cores <= 4) ? 2 : 1;
})();
const renderer = new THREE.WebGLRenderer({ antialias: Q === 0, powerPreference: 'high-performance', preserveDrawingBuffer: PARAMS.has('shot') });
renderer.setPixelRatio(Q === 2 ? 1 : Math.min(devicePixelRatio, Q === 1 ? 1.5 : 2));
$('host').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0907);
const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30);
const SEG = Q === 2 ? 6 : 10;   // walls are subdivided so the bulb's per-vertex light makes a soft pool

// one warm bulb, plus a very dim fill so the corners are not pure black
scene.add(new THREE.HemisphereLight(0xb8c4d0, 0x3a332e, .26));
const BULB = { x: 0, y: 2.56, z: .5, len: .42, ax: 0, az: 0, vx: 0, vz: 0 };
const bulbPivot = new THREE.Group(); bulbPivot.position.set(BULB.x, BULB.y, BULB.z); scene.add(bulbPivot);
const lamp = new THREE.PointLight(0xfff3e4, 1.35, 4.8, 1.5); lamp.position.y = -BULB.len - .04; bulbPivot.add(lamp);

// ---------- painted textures ----------
let seed = 11; const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
function cv(n = 256) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function speck(g, n, a, dark, s = 2, W = 256) { for (let i = 0; i < n; i++) { g.fillStyle = (dark ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (a * rand()).toFixed(3) + ')'; const r = .5 + rand() * s; g.fillRect(rand() * W, rand() * W, r, r); } }
function stains(g, n, col, W = 256) { for (let i = 0; i < n; i++) { const x = rand() * W, y = rand() * W, r = 10 + rand() * 50, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }
const PAINT = {
  wallpaper(g) { g.fillStyle = '#2f5a4a'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 64) { g.fillStyle = '#a8342a'; g.fillRect(x + 62, 0, 2, 256); }
    for (let y = 0; y < 256; y += 64) for (let x = 0; x < 256; x += 64) for (const [ox, oy] of [[32, 32], [0, 0], [64, 0], [0, 64], [64, 64]]) { const cx = x + ox, cy = y + oy;
      g.fillStyle = 'rgba(200,190,150,.28)'; g.beginPath(); g.ellipse(cx, cy - 6, 3.5, 7, 0, 0, 7); g.ellipse(cx - 7, cy + 4, 2.6, 5.5, -.8, 0, 7); g.ellipse(cx + 7, cy + 4, 2.6, 5.5, .8, 0, 7); g.fill();
      g.fillStyle = 'rgba(201,160,60,.5)'; g.beginPath(); g.arc(cx, cy + 3, 2, 0, 7); g.fill(); }
    speck(g, 1400, .1, true); },
  wainscot(g) { g.fillStyle = '#2e211c'; g.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 128) { g.fillStyle = '#3d2c25'; g.fillRect(x + 14, 20, 100, 216); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(x + 14, 20, 100, 216); g.strokeStyle = 'rgba(255,220,170,.12)'; g.lineWidth = 1.5; g.strokeRect(x + 18, 24, 92, 208); }
    for (let i = 0; i < 50; i++) { g.strokeStyle = `rgba(0,0,0,${.05 + rand() * .08})`; g.lineWidth = 1; g.beginPath(); const x = rand() * 256; g.moveTo(x, 0); g.lineTo(x + (rand() - .5) * 8, 256); g.stroke(); } },
  floor(g) { g.fillStyle = '#1e140c'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 8; r++) { const off = (r % 2) * 90; for (let c = -1; c < 3; c++) { const k = 88 + (rand() - .5) * 26 | 0; g.fillStyle = `rgb(${k},${k * .6 | 0},${k * .5 | 0})`; g.fillRect(c * 160 + off + 1, r * 32 + 1, 158, 30); } }
    for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(0,0,0,${.06 + rand() * .1})`; g.lineWidth = 1; g.beginPath(); const y = rand() * 256; g.moveTo(0, y); g.lineTo(256, y + (rand() - .5) * 4); g.stroke(); } speck(g, 900, .2, true); },
  plaster(g) { g.fillStyle = '#e8e6e0'; g.fillRect(0, 0, 256, 256); stains(g, 8, 'rgba(90,80,70,.1)'); speck(g, 900, .08, true); },
  wood(g) { g.fillStyle = '#7a3a2a'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 80; i++) { g.strokeStyle = `rgba(40,20,8,${.06 + rand() * .14})`; g.lineWidth = 1 + rand() * 2; g.beginPath(); const y = rand() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + (rand() - .5) * 12, 170, y + (rand() - .5) * 12, 256, y); g.stroke(); } speck(g, 500, .1, true); },
  leather(g) { g.fillStyle = '#2f4a34'; g.fillRect(0, 0, 256, 256); speck(g, 3000, .18, true, 2.4); stains(g, 6, 'rgba(0,0,0,.18)'); g.strokeStyle = 'rgba(200,170,90,.5)'; g.lineWidth = 3; g.strokeRect(8, 8, 240, 240); },
  paper(g) { g.fillStyle = '#eeeae0'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(40,30,20,.32)';
    for (let y = 34; y < 236; y += 11) { let x = 26; while (x < 226) { const w = 8 + rand() * 30; if (x + w > 230) break; g.fillRect(x, y, w, 2.5); x += w + 5; } }
    g.fillStyle = 'rgba(40,30,20,.6)'; g.fillRect(26, 16, 110, 7); stains(g, 3, 'rgba(120,90,40,.15)'); },
  news(g) { g.fillStyle = '#d4ccb8'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(20,16,12,.75)'; g.fillRect(14, 10, 228, 22); g.fillStyle = 'rgba(20,16,12,.35)';
    for (let c = 0; c < 5; c++) for (let y = 42; y < 246; y += 6) if (rand() > .08) g.fillRect(14 + c * 46, y, 40, 2.4);
    g.fillStyle = 'rgba(20,16,12,.55)'; g.fillRect(60, 60, 90, 60); speck(g, 600, .08, true); },
  manila(g) { g.fillStyle = '#c99a5a'; g.fillRect(0, 0, 256, 256); speck(g, 1200, .1, true); stains(g, 4, 'rgba(110,70,20,.2)'); },
  books(g) { g.fillStyle = '#1d140d'; g.fillRect(0, 0, 256, 256); const BC = ['#5a2a1e', '#2a3448', '#3a4228', '#5a4a2a', '#4a2a30', '#6a5a3a'];
    for (let r = 0; r < 4; r++) { let x = 0; while (x < 256) { const w = 7 + rand() * 12, hgt = 40 + rand() * 14; g.fillStyle = BC[(rand() * BC.length) | 0]; g.fillRect(x, r * 64 + 60 - hgt, w - 1, hgt); g.fillStyle = 'rgba(201,162,74,.55)'; g.fillRect(x + 1, r * 64 + 60 - hgt + 8, w - 3, 2); x += w; } g.fillStyle = '#3a2616'; g.fillRect(0, r * 64 + 60, 256, 4); } },
  rug(g) { g.fillStyle = '#9e2a24'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#23305a'; g.fillRect(0, 0, 256, 28); g.fillRect(0, 228, 256, 28); g.fillRect(0, 0, 28, 256); g.fillRect(228, 0, 28, 256);
    g.fillStyle = '#e8dcc0'; for (let i = 14; i < 256; i += 24) { g.fillRect(i - 3, 11, 6, 6); g.fillRect(i - 3, 239, 6, 6); g.fillRect(11, i - 3, 6, 6); g.fillRect(239, i - 3, 6, 6); }
    g.save(); g.translate(128, 128); g.rotate(Math.PI / 4); g.fillStyle = '#23305a'; g.fillRect(-56, -56, 112, 112); g.fillStyle = '#d9a23a'; g.fillRect(-36, -36, 72, 72); g.fillStyle = '#9e2a24'; g.fillRect(-18, -18, 36, 36); g.restore();
    g.fillStyle = '#2f6a4a'; for (const [x, y] of [[64, 64], [192, 64], [64, 192], [192, 192]]) { g.beginPath(); g.moveTo(x, y - 16); g.lineTo(x + 16, y); g.lineTo(x, y + 16); g.lineTo(x - 16, y); g.fill(); }
    speck(g, 2500, .12, true); },
  frosted(g) { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#9aa08c'); gr.addColorStop(1, '#6c705e'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); speck(g, 4000, .12, false, 1.6); g.fillStyle = 'rgba(30,26,20,.55)'; g.font = 'bold 30px Georgia'; g.textAlign = 'center'; g.save(); g.scale(-1, 1); g.restore(); }
};
const TEX = {};
function tex(kind) { if (TEX[kind]) return TEX[kind]; const c = cv(), g = c.getContext('2d'); PAINT[kind](g); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = Q === 2 ? 1 : 4; return TEX[kind] = t; }
function img(src) { const t = new THREE.TextureLoader().load(asset(src)); t.anisotropy = Q === 2 ? 1 : 4; return t; }

// material keys -> [texture or colour, metres per tile]
const MATDEF = {
  wall: ['wallpaper', 1.1], wain: ['wainscot', 1.2], floor: ['floor', 2.2], ceil: ['plaster', 2], wood: ['wood', .9], woodD: [0x3a2414], leather: ['leather', 0],
  paper: ['paper', 0], manila: ['manila', .5], news: ['news', 0], books: ['books', 0], metal: [0x2a2622], brass: [0xb08a3c], black: [0x141110], cord: [0x1e1814], glass: ['frosted', 0],
  gilt: [0x9a7a34], white: [0xe8e0cc], rug: ['rug', 0], leaf: [0x3f7a3a], leafD: [0x2a5a2c], pot: [0xb05a36], enamel: [0x2f5a9a], olive: [0x4a5232], red: [0x7a2a1c], straw: [0x8a6a3a]
};
const MATS = {};
function mat(k) { if (MATS[k]) return MATS[k]; const d = MATDEF[k];
  return MATS[k] = typeof d[0] === 'string' ? new THREE.MeshLambertMaterial({ map: tex(d[0]) }) : new THREE.MeshLambertMaterial({ color: d[0] }); }

// static geometry is collected per material and merged into one mesh each (a handful of draw calls for the whole room)
const STATIC = {};
function boxUV(g, s) {   // world-scale UVs from each face's direction, so wallpaper and planks keep their size on any box
  const p = g.attributes.position.array, n = g.attributes.normal.array, uv = g.attributes.uv.array;
  for (let i = 0, j = 0; i < p.length; i += 3, j += 2) { const ax = Math.abs(n[i]), ay = Math.abs(n[i + 1]), az = Math.abs(n[i + 2]);
    if (ay >= ax && ay >= az) { uv[j] = p[i] / s; uv[j + 1] = p[i + 2] / s; } else if (ax >= az) { uv[j] = p[i + 2] / s; uv[j + 1] = p[i + 1] / s; } else { uv[j] = p[i] / s; uv[j + 1] = p[i + 1] / s; } }
}
function put(k, geo) { (STATIC[k] = STATIC[k] || []).push(geo.index ? geo.toNonIndexed() : geo); }
function bx(k, x0, x1, y0, y1, z0, z1, o = {}) {
  const s = o.seg || 1, geo = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0, s, s, s);
  if (o.ry || o.rx || o.rz) geo.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)));
  geo.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const ts = MATDEF[k][1]; if (ts) boxUV(geo, ts);
  put(k, geo); return geo;
}
// a box by centre and size, turned about y: handy for paper stacks and photographs
function bc(k, x, y, z, w, h, d, ry = 0, o = {}) { const geo = new THREE.BoxGeometry(w, h, d); geo.rotateY(ry); if (o.rz) geo.rotateZ(o.rz); if (o.rx) geo.rotateX(o.rx); geo.translate(x, y + h / 2, z); if (MATDEF[k] && MATDEF[k][1]) boxUV(geo, MATDEF[k][1]); put(k, geo); return geo; }
function cyl(k, r0, r1, h, n, x, y, z, o = {}) { const geo = new THREE.CylinderGeometry(r1, r0, h, n, 1, !!o.open); if (o.rx) geo.rotateX(o.rx); if (o.rz) geo.rotateZ(o.rz); geo.translate(x, y + (o.rx || o.rz ? 0 : h / 2), z); put(k, geo); return geo; }
// a plane facing a direction, subdivided for the light
function wall(k, w, h, pos, ry, s = SEG) { const geo = new THREE.PlaneGeometry(w, h, s, s); geo.rotateY(ry); geo.translate(pos[0], pos[1], pos[2]); const ts = MATDEF[k][1]; if (ts) boxUV(geo, ts); put(k, geo); }

// ---------- the room: tight, about 3.2 by 3.4 metres ----------
const RX = 1.6, RZ0 = -1.75, RZ1 = 1.65, RH = 2.55, WAIN = .95;
{
  const fl = new THREE.PlaneGeometry(RX * 2, RZ1 - RZ0, SEG + 2, SEG + 2); fl.rotateX(-Math.PI / 2); fl.translate(0, 0, (RZ0 + RZ1) / 2); boxUV(fl, MATDEF.floor[1]); put('floor', fl);
  const ce = new THREE.PlaneGeometry(RX * 2, RZ1 - RZ0, SEG, SEG); ce.rotateX(Math.PI / 2); ce.translate(0, RH, (RZ0 + RZ1) / 2); boxUV(ce, MATDEF.ceil[1]); put('ceil', ce);
  const D = RZ1 - RZ0, cz = (RZ0 + RZ1) / 2;
  wall('wall', RX * 2, RH - WAIN, [0, (RH + WAIN) / 2, RZ0], 0); wall('wain', RX * 2, WAIN, [0, WAIN / 2, RZ0], 0, 4);
  wall('wall', D, RH - WAIN, [-RX, (RH + WAIN) / 2, cz], Math.PI / 2); wall('wain', D, WAIN, [-RX, WAIN / 2, cz], Math.PI / 2, 4);
  wall('wall', D, RH - WAIN, [RX, (RH + WAIN) / 2, cz], -Math.PI / 2); wall('wain', D, WAIN, [RX, WAIN / 2, cz], -Math.PI / 2, 4);
  wall('wall', RX * 2, RH - WAIN, [0, (RH + WAIN) / 2, RZ1], Math.PI); wall('wain', RX * 2, WAIN, [0, WAIN / 2, RZ1], Math.PI, 4);
  // dado rail, skirting and cornice
  for (const [a, b, c, d] of [[-RX, RX, RZ0, RZ0 + .03], [-RX, RX, RZ1 - .03, RZ1], [-RX, -RX + .03, RZ0, RZ1], [RX - .03, RX, RZ0, RZ1]]) {
    bx('woodD', a, b, WAIN - .02, WAIN + .03, c, d); bx('woodD', a, b, 0, .12, c, d); bx('woodD', a, b, RH - .08, RH, c, d); }
}
// the door behind you: dark frame, frosted glass, a thin line of hallway light under it
const DOOR = { x: .55, w: .86, h: 2.08 };
bx('woodD', DOOR.x - DOOR.w / 2 - .07, DOOR.x + DOOR.w / 2 + .07, DOOR.h, DOOR.h + .09, RZ1 - .05, RZ1 - .01);
bx('woodD', DOOR.x - DOOR.w / 2 - .07, DOOR.x - DOOR.w / 2, 0, DOOR.h, RZ1 - .05, RZ1 - .01); bx('woodD', DOOR.x + DOOR.w / 2, DOOR.x + DOOR.w / 2 + .07, 0, DOOR.h, RZ1 - .05, RZ1 - .01);
bx('wood', DOOR.x - DOOR.w / 2, DOOR.x + DOOR.w / 2, .015, DOOR.h, RZ1 - .035, RZ1 - .02);
bx('glass', DOOR.x - DOOR.w / 2 + .1, DOOR.x + DOOR.w / 2 - .1, 1.15, 1.95, RZ1 - .04, RZ1 - .036);
bx('brass', DOOR.x - DOOR.w / 2 + .07, DOOR.x - DOOR.w / 2 + .12, .98, 1.02, RZ1 - .1, RZ1 - .035);
const underDoor = new THREE.Mesh(new THREE.PlaneGeometry(DOOR.w - .04, .016), new THREE.MeshBasicMaterial({ color: 0xc9b98e })); underDoor.position.set(DOOR.x, .008, RZ1 - .03); underDoor.rotation.y = Math.PI; scene.add(underDoor);
// coat hooks on the door wall: his jacket and bowler wait for him
bx('woodD', -1.3, -.5, 1.68, 1.76, RZ1 - .03, RZ1 - .01);
bc('black', -1.05, 1.0, RZ1 - .12, .42, .66, .1, 0, { rz: .04 });
cyl('black', .15, .13, .1, 10, -.75, 1.6, RZ1 - .14); cyl('black', .19, .19, .012, 12, -.75, 1.6, RZ1 - .14);

// the desk: wide, heavy, two pedestals, a modesty panel facing you
const DT = .74, DX = .86, DZ0 = -.74, DZ1 = .06;
bx('wood', -DX - .03, DX + .03, DT - .045, DT, DZ0 - .03, DZ1 + .03, { seg: 3 });
bx('woodD', -DX, -DX + .44, 0, DT - .045, DZ0, DZ1); bx('woodD', DX - .44, DX, 0, DT - .045, DZ0, DZ1);
bx('woodD', -DX + .44, DX - .44, .2, DT - .045, DZ1 - .04, DZ1 - .01);
for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const x0 = s < 0 ? -DX + .03 : DX - .41; bx('wood', x0, x0 + .38, .06 + k * .22, .24 + k * .22, DZ1, DZ1 + .012); bx('brass', x0 + .16, x0 + .22, .14 + k * .22, .16 + k * .22, DZ1 + .012, DZ1 + .03); }
// green leather blotter, papers, folders, an inkwell, a telephone, a spike of notes, an ashtray
bc('leather', 0, DT, -.36, .74, .006, .46);
const papers = [];
for (let i = 0; i < 9; i++) papers.push(bc('paper', -.6 + (rand() - .5) * .04, DT + i * .009, -.48 + (rand() - .5) * .04, .22, .009, .3, (rand() - .5) * .3));
for (let i = 0; i < 6; i++) bc('manila', .56 + (rand() - .5) * .05, DT + i * .012, -.5 + (rand() - .5) * .05, .25, .011, .33, (rand() - .5) * .25);
bc('paper', .6, DT + .074, -.46, .21, .004, .29, .35); bc('paper', -.2, DT + .007, -.58, .21, .004, .29, -.9); bc('paper', .2, DT + .007, -.14, .21, .004, .29, .5);
cyl('black', .035, .03, .05, 8, .36, DT, -.12); cyl('brass', .012, .012, .01, 8, .36, DT + .05, -.12); cyl('straw', .003, .003, .17, 4, .39, DT + .1, -.12, { rz: -.5 });
// candlestick telephone
cyl('black', .06, .05, .025, 10, -.68, DT, -.14); cyl('black', .016, .016, .25, 6, -.68, DT + .025, -.14); cyl('black', .03, .022, .05, 8, -.68, DT + .27, -.11, { rx: -1.2 });
cyl('black', .018, .022, .09, 8, -.62, DT + .2, -.14, {}); bx('metal', -.655, -.615, DT + .22, DT + .23, -.15, -.13);
// spike with notes, ashtray with a cigar
cyl('metal', .03, .03, .012, 8, .7, DT, -.08); cyl('metal', .003, .002, .16, 4, .7, DT + .012, -.08);
for (let i = 0; i < 5; i++) bc('paper', .7, DT + .02 + i * .012, -.08, .09, .002, .07, rand() * 3);
cyl('brass', .055, .045, .02, 10, .3, DT, -.62); cyl('straw', .009, .009, .11, 6, .3, DT + .03, -.62, { rz: Math.PI / 2 - .1 });
// his chair: dark oak, with arms and a slatted back
const CH = { z: -1.18, seat: .55 };
bx('woodD', -.27, .27, CH.seat - .06, CH.seat, CH.z - .24, CH.z + .22);
bx('woodD', -.27, .27, CH.seat, CH.seat + .72, CH.z - .27, CH.z - .22, { rx: -.08 });
for (const s of [-1, 1]) { bx('woodD', s * .27 - .025, s * .27 + .025, CH.seat, CH.seat + .24, CH.z - .2, CH.z + .2); bx('woodD', s * .27 - .035, s * .27 + .035, CH.seat + .22, CH.seat + .26, CH.z - .22, CH.z + .24); }
cyl('metal', .04, .04, CH.seat - .06, 6, 0, 0, CH.z); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .4; bx('metal', -.02, .02, 0, .04, 0, .3, { ry: a }); }
// filing cabinet on the left, folders piled on it; shelves of ledgers and bundled newspapers on the right
bx('woodD', -RX + .03, -RX + .53, 0, 1.32, -1.65, -1.05);
for (let k = 0; k < 4; k++) { bx('wood', -RX + .53, -RX + .545, .06 + k * .31, .34 + k * .31, -1.62, -1.08); bx('brass', -RX + .545, -RX + .56, .26 + k * .31, .29 + k * .31, -1.4, -1.3); }
for (let i = 0; i < 7; i++) bc(i % 3 ? 'manila' : 'paper', -RX + .28, 1.32 + i * .02, -1.35, .32, .018, .44, (rand() - .5) * .35);
for (let i = 0; i < 3; i++) bx('woodD', RX - .34, RX - .02, 1.0 + i * .42, 1.03 + i * .42, -1.5, -.3);
for (let i = 0; i < 3; i++) { const g = new THREE.BoxGeometry(.3, .3, 1.16); g.translate(RX - .18, 1.18 + i * .42, -.9); const u = g.attributes.uv.array; put('books', g); }
for (let i = 0; i < 4; i++) bc('news', RX - .32 + (i % 2) * .02, i * .16, -.15 + (i > 1 ? .46 : 0) + (rand() - .5) * .04, .42, .16, .3, Math.PI / 2 + (rand() - .5) * .3);
for (let i = 0; i < 2; i++) bc('news', -RX + .3, i * .14, .4 + (rand() - .5) * .04, .42, .14, .3, Math.PI / 2 + (rand() - .5) * .3);

{ const g = new THREE.PlaneGeometry(2.4, 2.1); g.rotateX(-Math.PI / 2); g.translate(0, .006, .05); put('rug', g); }
cyl('pot', .16, .2, .3, 8, RX - .3, 0, .85);
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, l = .35 + rand() * .3; const g = new THREE.BoxGeometry(.09, .012, l); g.translate(0, 0, l / 2); g.rotateX(-.6 - rand() * .5); g.rotateY(a); g.translate(RX - .3, .3, .85); put(i % 2 ? 'leaf' : 'leafD', g); }
cyl('enamel', .06, .07, .16, 8, -RX + .2, 1.33 + .14, -1.2); cyl('enamel', .03, .035, .07, 8, -RX + .38, 1.33 + .14, -1.15);
// ---------- merge the static room ----------
const roomMeshes = [];
for (const k of Object.keys(STATIC)) {
  const m = new THREE.Mesh(BufferGeometryUtils.mergeBufferGeometries(STATIC[k]), mat(k)); scene.add(m); roomMeshes.push(m);
}

// ---------- things with their own picture: the framed photograph and prints on the desk ----------
// Framed on the wall behind his chair: Maderistas on a tram celebrating the revolution's triumph, Mexico City, 1911. Archivo Casasola.
const frame = new THREE.Group(); frame.position.set(0, 1.98, RZ0 + .02); frame.rotation.z = .035; scene.add(frame);
{ const W = .74, H = W * 514 / 768, F = .06;
  const fm = mat('woodD'), gm = mat('gilt');
  for (const [w, h, x, y] of [[W + F * 2, F, 0, H / 2 + F / 2], [W + F * 2, F, 0, -H / 2 - F / 2], [F, H, -W / 2 - F / 2, 0], [F, H, W / 2 + F / 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .035), fm); m.position.set(x, y, .018); frame.add(m); }
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + .02, H + .02, .012), gm); lip.position.z = .006; frame.add(lip);
  const mt = new THREE.Mesh(new THREE.PlaneGeometry(W - .04, H - .04), new THREE.MeshLambertMaterial({ map: img('scenes/office/framed-tram-1911.jpg') })); mt.position.z = .0135; frame.add(mt); }
// prints on the desk, facing you, a little askew; they jump when he hits the desk
const deskBits = new THREE.Group(); scene.add(deskBits);
[['scenes/office/desk1.jpg', -.18, -.34, .12, 320 / 229], ['scenes/office/desk2.jpg', .1, -.3, -.2, 320 / 229], ['scenes/office/desk3.jpg', -.02, -.48, .05, 320 / 225], ['scenes/office/desk4.jpg', .24, -.5, .32, 320 / 222]].forEach(([src, x, z, r, a], i) => {
  const w = .2, m = new THREE.Mesh(new THREE.PlaneGeometry(w, w / a), new THREE.MeshLambertMaterial({ map: img(src) }));
  m.rotation.set(-Math.PI / 2, 0, r); m.position.set(x, DT + .008 + i * .0012, z); m.userData.y0 = m.position.y; deskBits.add(m);
});

// ---------- the bulb: cord, brass socket, glowing glass, a soft halo ----------
{ const cord = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, BULB.len, 4), mat('cord')); cord.position.y = -BULB.len / 2; bulbPivot.add(cord);
  const sock = new THREE.Mesh(new THREE.CylinderGeometry(.018, .022, .05, 8), mat('brass')); sock.position.y = -BULB.len; bulbPivot.add(sock);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfffaf0 })); glass.scale.y = 1.3; glass.position.y = -BULB.len - .055; bulbPivot.add(glass);
  const c = cv(64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,246,228,.9)'); gr.addColorStop(.25, 'rgba(255,236,205,.3)'); gr.addColorStop(1, 'rgba(255,230,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); halo.scale.set(.5, .5, 1); halo.position.y = -BULB.len - .055; bulbPivot.add(halo); }
// soft dark pools on the floor under the desk and the chair (no shadow maps: one cheap texture)
{ const c = cv(64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const sm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
  for (const [x, z, w, d] of [[0, -.34, 2.3, 1.3], [0, CH.z, .9, .8], [-RX + .28, -1.35, .8, .9]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sm); m.rotation.x = -Math.PI / 2; m.position.set(x, .004, z); scene.add(m); } }

// ---------- the publisher: a new character on the low-poly kit ----------
const { figure } = LowPolyPeople;
const SKIN = 0x9c6542, GREY = 0x9c958c;
const PUB_D = { id: 'publisher', name: 'Publisher', h: 1.5, headK: 1.12, skin: SKIN, shirt: 0xf0e8d4, sleeve: 0xf0e8d4, vest: true, coat: 0x6a2a24, pants: 0x34302e, belt: null, shoes: 0x1a1414,
  belly: 1.5 * .06, shoulders: .96, neckTo: .01, hand: 1.3, arm: 1.06, hair: null, hat: null, beard3d: false,
  skull: { wide: 1.1, deep: 1.04, jaw: 1.06, cheek: 1.1, chin: .82, crown: 1.06, chinW: .46 },
  face: { mouth: false }, expr: {}, pose: {} };
const pub = figure(PUB_D);
const { J, face } = pub.userData;
const H = PUB_D.h, HIPY = H * .42;
pub.position.set(0, 0, -1.08); scene.add(pub);
const headMesh = J.head.children.find(m => m.material && m.material.map === face.tex);
// head measurements, read from the kit's mesh so the props sit on it whatever the proportions
const HP = (() => { const p = headMesh.geometry.attributes.position.array; let yb = 1e9, yt = -1e9, W = 0, zb = 1e9;
  for (let i = 0; i < p.length; i += 3) { yb = Math.min(yb, p[i + 1]); yt = Math.max(yt, p[i + 1]); W = Math.max(W, Math.abs(p[i])); zb = Math.min(zb, p[i + 2]); }
  // the head is a loft of rings: collect each ring's extents, then interpolate between rings
  const R = new Map(); for (let i = 0; i < p.length; i += 3) { const k = p[i + 1].toFixed(4), r = R.get(k) || { y: p[i + 1], x: 0, zf: -1e9, zb: 1e9 }; r.x = Math.max(r.x, Math.abs(p[i])); r.zf = Math.max(r.zf, p[i + 2]); r.zb = Math.min(r.zb, p[i + 2]); R.set(k, r); }
  const rings = [...R.values()].filter(r => R.size < 40 || r.x > 0).sort((a, b) => a.y - b.y);
  const at = (y, f) => { for (let i = 0; i < rings.length - 1; i++) { const a = rings[i], b = rings[i + 1]; if (y >= a.y && y <= b.y) { const t = (y - a.y) / (b.y - a.y || 1); return f(a) + (f(b) - f(a)) * t; } } return f(y < rings[0].y ? rings[0] : rings[rings.length - 1]); };
  return { yb, yt, W, zb, front: y => at(y, r => r.zf), back: y => at(y, r => r.zb), half: y => at(y, r => r.x), py: py => yb + (1 - py / 256) * (yt - yb), px: px => (px / 256 - .5) * 2 * W }; })();
const fl = c => new THREE.MeshLambertMaterial({ color: c });
const greyM = fl(GREY), fluffM = fl(0xb4ada2);
// big round nose
const nose = new THREE.Mesh(new THREE.SphereGeometry(HP.W * .2, 8, 6), new THREE.MeshLambertMaterial({ color: 0xa5603e })); { const y = HP.py(168); nose.position.set(0, y, HP.front(y) + HP.W * .08); nose.scale.set(1, .9, .9); J.head.add(nose); }
// walrus moustache: two drooping lobes that bounce while he talks
const stache = new THREE.Group(); { const y = HP.py(192); stache.position.set(0, y, HP.front(y) + HP.W * .02); J.head.add(stache);
  [-1, 1].forEach(s => { const lobe = new THREE.Mesh(new THREE.SphereGeometry(1, 7, 5), greyM); lobe.scale.set(HP.W * .42, HP.W * .17, HP.W * .17); lobe.position.set(s * HP.W * .34, -HP.W * .04, 0); lobe.rotation.z = s * -.42; stache.add(lobe);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 5, 4), greyM); tip.scale.set(HP.W * .13, HP.W * .2, HP.W * .12); tip.position.set(s * HP.W * .7, -HP.W * .24, -HP.W * .06); stache.add(tip); }); }
// grey tufts over the ears and round the back of a bald crown
{ const y = HP.py(112); [-1, 1].forEach(s => [[0, 0, .2], [.12, -.18, .16], [-.12, -.34, .17], [.08, .16, .14]].forEach(([dy, dz, r]) => { const t = new THREE.Mesh(new THREE.SphereGeometry(HP.W * r * 1.1, 7, 5), fluffM);
    t.position.set(s * HP.half(y) * 1.02, y + dy * HP.W, HP.front(y) * .2 + dz * HP.W * 2.2 - HP.W * .2); t.rotation.set(rand() * 3, rand() * 3, 0); J.head.add(t); }));
  const zc = (HP.front(y) + HP.back(y)) / 2, rz = (HP.front(y) - HP.back(y)) / 2;
  for (let k = -3; k <= 3; k++) { const a = Math.PI + k * .3, t = new THREE.Mesh(new THREE.SphereGeometry(HP.W * .2, 7, 5), fluffM); t.position.set(Math.sin(a) * HP.half(y) * .98, y - HP.W * .08 + Math.abs(k) * .01, zc + Math.cos(a) * rz * .98); t.rotation.set(k, k * 2, 0); J.head.add(t); } }
const strand = new THREE.Group();   // the comb-over was removed (user); kept as an empty handle for the acting code
// green eyeshade: a band round the forehead and a translucent brim
{ const y = HP.py(46), rx = HP.half(y) * 1.06, zf = HP.front(y), zb = HP.back(y), zc = (zf + zb) / 2, rz = (zf - zb) / 2 * 1.06, bh = HP.W * .15;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 14, 1, true), new THREE.MeshLambertMaterial({ color: 0x2d5a3a, side: THREE.DoubleSide })); band.scale.set(rx, bh, rz); band.position.set(0, y, zc); J.head.add(band);
  const N = 10, P = [], I = []; for (let i = 0; i <= N; i++) { const a = -1.15 + 2.3 * i / N, ix = Math.sin(a) * rx, iz = zc + Math.cos(a) * rz; P.push(ix, y - bh * .45, iz, ix * 1.15, y - bh * .45 - HP.W * .06, zc + Math.cos(a) * (rz + HP.W * .3)); if (i < N) { const b = i * 2; I.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
  const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setIndex(I); bg.computeVertexNormals();
  J.head.add(new THREE.Mesh(bg, new THREE.MeshLambertMaterial({ color: 0x3f9a5c, transparent: true, opacity: .72, side: THREE.DoubleSide, depthWrite: false }))); }
// red sleeve garters and a black bow tie
[J.shR, J.shL].forEach(sh => { const g = new THREE.Mesh(new THREE.TorusGeometry(H * .03 * 1.06 * 1.3, H * .007, 4, 10), fl(0x8a2a20)); g.rotation.x = Math.PI / 2; g.position.y = -H * .1; sh.add(g); });
{ const y = H * .695 - HIPY, z = H * .058; [-1, 1].forEach(s => { const b = new THREE.Mesh(new THREE.ConeGeometry(H * .022, H * .04, 4), fl(0x161214)); b.rotation.z = s * Math.PI / 2; b.position.set(s * H * .018, y, z); J.spine.add(b); }); }

// ---------- his face: the kit's old-console look (solid dark eyes, simple strokes), with a wider range ----------
// eyes: dot | happy | closed | spiral | squeeze | wink ; mouth: line | cat | smile | grin | grit | frown | smirk | pout | shout (talking swaps in a triangle)
const EX = {
  neutral: { eyes: 'dot', open: 1, brow: 0, mouth: 'line' },
  pleased: { eyes: 'happy', brow: .35, mouth: 'cat', blush: .6 },
  happy: { eyes: 'dot', open: 1.1, brow: .45, browY: 4, mouth: 'grin', blush: .4 },
  fired: { eyes: 'dot', open: 1.25, small: true, brow: -.35, browY: 2, mouth: 'grin', flush: .25 },
  dreamy: { eyes: 'dot', open: .55, ly: -1, lx: .5, brow: .7, browY: 6, mouth: 'cat', blush: .5 },
  suspicious: { eyes: 'dot', open: .45, lx: .9, brow: -.4, browL: .9, browR: -.5, mouth: 'pout' },
  angry: { eyes: 'dot', open: .9, cut: 1, brow: -1, browY: -3, mouth: 'grit', flush: .55, lines: true },
  riled: { eyes: 'spiral', brow: -1.1, browY: -2, mouth: 'shout', flush: 1, lines: true, jitter: 1 },
  proud: { eyes: 'closed', brow: .3, browY: 6, mouth: 'smile', blush: .3 },
  sly: { eyes: 'dot', open: .55, lx: -.9, brow: -.2, browL: .7, mouth: 'smirk' },
  intense: { eyes: 'dot', open: 1.4, small: true, brow: -.6, mouth: 'frown', flush: .2 },
  wink: { eyes: 'wink', open: 1, brow: .4, browL: -.3, mouth: 'grin', blush: .4 },
  frantic: { eyes: 'squeeze', brow: 1.1, browY: 8, mouth: 'shout', sweat: true, flush: .3 }
};
const FACE = { cur: 'neutral', talk: 0, blink: false, spin: 0, flush: 0, key: '' };
const ink = '#16100d', BROWC = '#6e675e';
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
const SKRGB = [(SKIN >> 16) & 255, (SKIN >> 8) & 255, SKIN & 255];
function paintPub(S, st) {
  const g = face.cv.getContext('2d'), cx = 128, ey = 134, es = 46, ew = 19, eh = 28;
  g.setTransform(1, 0, 0, 1, 0, 0); g.lineCap = 'round'; g.lineJoin = 'round';
  const sk = mix(SKRGB, [205, 70, 56], st.flush * .6); g.fillStyle = `rgb(${sk})`; g.fillRect(0, 0, 256, 256);
  if (st.flush > .05) { const gr = g.createLinearGradient(0, 20, 0, 120); gr.addColorStop(0, `rgba(170,30,30,${st.flush * .45})`); gr.addColorStop(1, 'rgba(170,30,30,0)'); g.fillStyle = gr; g.fillRect(20, 0, 216, 120); }
  if (S.lines) { g.strokeStyle = 'rgba(120,20,20,.6)'; g.lineWidth = 3; for (const x of [-14, 0, 14]) { g.beginPath(); g.moveTo(cx + x, 48); g.lineTo(cx + x * .8, 70); g.stroke(); } }
  if (S.blush) { g.fillStyle = `rgba(190,40,50,${.26 * S.blush})`; [-1, 1].forEach(s => { g.beginPath(); g.arc(cx + s * (es + 14), ey + 34, 18, 0, 7); g.fill(); }); }
  const j = S.jitter ? (st.tick % 2 ? 2 : -2) : 0;
  g.fillStyle = ink; g.strokeStyle = ink;
  [-1, 1].forEach(s => {
    const x = cx + s * es, y = ey + (S.ly || 0) * 5; let kind = S.eyes;
    if (kind === 'wink' ) kind = s > 0 ? 'closed' : 'dot';
    if (st.blink && kind === 'dot') kind = 'blinkline';
    const w = ew, h = eh * (S.open || 1);
    if (kind === 'blinkline') { g.lineWidth = 5; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y + 7, x + w, y); g.stroke(); return; }
    if (kind === 'happy') { g.lineWidth = 6; g.beginPath(); g.moveTo(x - w, y + 6); g.quadraticCurveTo(x, y - 18, x + w, y + 6); g.stroke(); return; }
    if (kind === 'closed') { g.lineWidth = 6; g.beginPath(); g.moveTo(x - w, y - 2); g.quadraticCurveTo(x, y + 14, x + w, y - 2); g.stroke(); return; }
    if (kind === 'squeeze') { g.lineWidth = 6; g.beginPath(); g.moveTo(x + s * w, y - 12); g.lineTo(x - s * w * .7, y); g.lineTo(x + s * w, y + 12); g.stroke(); return; }
    if (kind === 'spiral') { g.lineWidth = 4; g.beginPath(); const a0 = st.spin * s; for (let k = 0; k <= 46; k++) { const a = a0 + k * .42 * s, r = 1.5 + k * .46; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 1.08; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); return; }
    // the kit's eye: a thick lid curve with a dark pupil under it; angry drops the inner end
    const yi = y - h * .32 + (S.cut > 0 ? h * .34 : 0), yo = y - h * .38, xi = x - s * w, xo = x + s * w, peak = Math.min(yi, yo) - h * .3;
    const lid = () => { g.moveTo(xi, yi); g.quadraticCurveTo(x, peak, xo, yo); };
    g.save(); g.beginPath(); lid(); g.lineTo(xo, y + h * 2); g.lineTo(xi, y + h * 2); g.closePath(); g.clip();
    const pw = w * (S.small ? .34 : .6), ph = h * (S.small ? .3 : .46), px = x + (S.lx || 0) * w * .45, py = (.25 * yi + .5 * peak + .25 * yo) + ph * .85;
    g.beginPath(); g.ellipse(px, py, pw, ph, 0, 0, 7); g.fill(); g.restore();
    g.lineWidth = 5; g.beginPath(); lid(); g.stroke();
  });
  // round wire spectacles
  g.strokeStyle = '#4a3a26'; g.lineWidth = 3; [-1, 1].forEach(s => { g.beginPath(); g.arc(cx + s * es, ey, 30, 0, 7); g.stroke(); });
  g.beginPath(); g.moveTo(cx - es + 30, ey - 6); g.quadraticCurveTo(cx, ey - 16, cx + es - 30, ey - 6); g.stroke();
  g.strokeStyle = 'rgba(255,245,220,.35)'; g.lineWidth = 3; [-1, 1].forEach(s => { g.beginPath(); g.arc(cx + s * es, ey, 24, -2.4, -1.7); g.stroke(); });
  // bushy grey brows: thick, and they carry most of the mood
  g.strokeStyle = BROWC; g.lineWidth = 10;
  [-1, 1].forEach(s => {
    const b = (S.brow || 0) + (s < 0 ? (S.browR || 0) : (S.browL || 0)), x = cx + s * es, y = ey - 44 - (S.browY || 0) + j * s, bw = 24;
    g.beginPath(); g.moveTo(x - s * bw, y - b * 11); g.quadraticCurveTo(x, y - 6 - Math.abs(b) * 2, x + s * bw * 1.05, y + b * 5); g.stroke();
  });
  // sweat drops
  if (S.sweat) { g.fillStyle = 'rgba(190,225,240,.95)'; g.strokeStyle = 'rgba(40,70,90,.8)'; g.lineWidth = 2; [[-1, 0], [1, 1]].forEach(([s, k]) => { const x = cx + s * 92, y = 82 + k * 14 + (st.tick % 3) * 2; g.beginPath(); g.moveTo(x, y - 14); g.quadraticCurveTo(x + 9, y + 2, x, y + 6); g.quadraticCurveTo(x - 9, y + 2, x, y - 14); g.fill(); g.stroke(); }); }
  // mouth, under the moustache: thick simple strokes (a sideways 3, a >, a flat line...); open mouths are plain triangles (user)
  let m = S.mouth; if (st.talk) m = { none: 'triS', cat: 'tri', smile: 'tri', grin: 'triB', grit: 'triB', frown: 'triS', smirk: 'tri', pout: 'triS', shout: 'triXL', tri: 'triS' }[m] || m;
  const my = 218; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = '#2a0f0a'; g.fillStyle = '#2a0f0a';
  const line = pts => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(cx + x, my + y) : g.moveTo(cx + x, my + y)); g.stroke(); };
  const tri = (w, h) => { g.beginPath(); g.moveTo(cx - w, my - 4); g.lineTo(cx + w, my - 4); g.lineTo(cx, my - 4 + h); g.closePath(); g.fill(); g.stroke(); };
  if (m === 'line') line([[-12, 2], [12, 2]]);
  else if (m === 'cat') line([[-18, -2], [-9, 7], [0, 0], [9, 7], [18, -2]]);              // a sideways 3
  else if (m === 'smile') line([[-16, -2], [0, 8], [16, -2]]);
  else if (m === 'grin') line([[-22, -4], [0, 10], [22, -4], [-22, -4]]);
  else if (m === 'frown') line([[-14, 8], [0, -1], [14, 8]]);
  else if (m === 'smirk') line([[-12, 6], [14, -4]]);
  else if (m === 'pout') line([[-8, -5], [8, 3], [-8, 10]]);                                 // a >
  else if (m === 'grit') line([[-20, 0], [-12, 6], [-4, 0], [4, 6], [12, 0], [20, 6]]);
  else if (m === 'tri' || m === 'triS') tri(m === 'tri' ? 13 : 9, m === 'tri' ? 16 : 11);
  else if (m === 'triB') tri(19, 22);
  else if (m === 'shout' || m === 'triXL') tri(m === 'shout' ? 22 : 26, m === 'shout' ? 28 : 34);
  face.tex.needsUpdate = true;
}

// ---------- body acting: each act returns joint targets; the body eases toward them ----------
// arms: [x, y, z, elbow] for his right arm; the left mirrors y and z. sit: 1 seated, 0 standing.
const ARMS_DESK = [-1.05, .1, -.34, -.75];
const sn = Math.sin;
const ACTS = {
  idle: t => ({ sit: 1, lean: .1 + .02 * sn(t * 1.3), head: [.02 * sn(t * 1.1), 0, .03 * sn(t * .7)], R: ARMS_DESK, L: ARMS_DESK, k: 4 }),
  gesture: t => ({ sit: 1, lean: .12, twist: .08 * sn(t * 2.1), head: [.05 * sn(t * 4.2), .1 * sn(t * 2.1), .06 * sn(t * 1.7)],
    R: [-1.05 + .3 * sn(t * 4.2), -.2, -.55 + .22 * sn(t * 3.1), -1.15 + .35 * sn(t * 4.2 + .6)], L: [-1.0 + .3 * sn(t * 4.2 + 2), -.2, -.5 + .2 * sn(t * 2.7 + 1), -1.1 + .35 * sn(t * 4.2 + 2.6)], k: 7 }),
  fist: t => ({ sit: .55, lean: -.06, twist: -.12, tilt: .06, head: [-.18, -.1, .05 * sn(t * 9)], R: [-.1, 0, -2.95 + .08 * sn(t * 16), -.12 + .1 * sn(t * 16)], L: [-.9, 0, -.35, -1.2], k: 8, bounce: .015 * Math.abs(sn(t * 8)) }),
  dreamy: t => ({ sit: 1, lean: -.16, tilt: .05 * sn(t * .9), head: [-.2, .12 * sn(t * .8), .14 + .05 * sn(t * .9)], R: [-.95 + .05 * sn(t * .9), .2, -.5, -.55], L: [-.95 + .05 * sn(t * .9 + 1), .2, -.5, -.55], k: 3 }),
  suspicious: t => ({ sit: 1, lean: .32, twist: .1, head: [.08, .22 + .12 * sn(t * 1.6), -.08], R: [-1.35, .3, -.12, -1.75], L: ARMS_DESK, k: 4 }),
  riled: t => ({ sit: 0, lean: .06 + .06 * sn(t * 7.3), twist: .28 * sn(t * 5.7), tilt: .16 * sn(t * 8.3), head: [.12 * sn(t * 11), .38 * sn(t * 12.7), .2 * sn(t * 9.1)],
    R: [-.5 + .7 * sn(t * 7.1), .3 * sn(t * 5), -2.2 + .75 * sn(t * 10.3), -.7 + .65 * sn(t * 13.1)], L: [-.5 + .7 * sn(t * 6.3 + 1.7), .3 * sn(t * 4.4 + 1), -2.2 + .75 * sn(t * 11.1 + 2.3), -.7 + .65 * sn(t * 12.2 + 1.1)], k: 16, bounce: .05 * Math.abs(sn(t * 9.5)), strand: 1 }),
  pound: t => { const ph = (t * 2.3) % 1, up = ph < .55 ? sn(ph / .55 * Math.PI / 2) : 1 - (ph - .55) / .45 * 1.6;
    return { sit: .3, lean: .34 + .06 * up, head: [.05 - .1 * up, .08 * sn(t * 4.6), .08 * sn(t * 2.3)], R: [-1.2 - .9 * Math.max(0, up), 0, -.3, -.5 - .5 * Math.max(0, up)], L: [-1.5, -.05, -.05, -.08 + .1 * sn(t * 9)], k: 18, pound: ph, strand: .5 }; },
  proud: t => ({ sit: .6, lean: -.1, head: [-.22, .05 * sn(t * .8), -.06], R: [-1.25, 0, -.5, -1.35 + .08 * sn(t * 2)], L: ARMS_DESK, k: 4, chest: 1 }),
  lean: t => ({ sit: 1, lean: .5, twist: -.06, head: [.1, -.18 + .3 * Math.max(0, sn(t * 1.1)), .05], R: [-1.2, -.1, -.55, -.75], L: [-1.2, -.1, -.55, -.75], k: 4 }),
  imposing: t => { const r = Math.min(1, t / 1.6); return { sit: 1 - r, lean: -.04, head: [-.12, .05 * sn(t * 1.2), 0], R: [-.4, 0, -1.25 - .9 * r, -.25], L: [-.4, 0, -1.25 - .9 * r, -.25], k: 3.5, bounce: .006 * sn(t * 2) }; },
  wink: t => ({ sit: 1, lean: .16, tilt: -.12, head: [.02, -.08, -.2], R: [-1.35, .25, -.35, -1.25 + .1 * sn(t * 6)], L: ARMS_DESK, k: 6 }),
  shoo: t => ({ sit: .2, lean: .2, twist: .1 * sn(t * 9), head: [.1 * sn(t * 14), .14 * sn(t * 7), .08 * sn(t * 9)], R: [-1.35 + .45 * sn(t * 15), 0, -.5 + .2 * sn(t * 15), -1.2 + .7 * sn(t * 15 + 1)], L: [-1.35 + .45 * sn(t * 15 + 2), 0, -.5 + .2 * sn(t * 15 + 2), -1.2 + .7 * sn(t * 15 + 3)], k: 14, bounce: .02 * Math.abs(sn(t * 7.5)), strand: .6 })
};
const POSE = { sit: 1, lean: 0, twist: 0, tilt: 0, head: [0, 0, 0], R: [...ARMS_DESK], L: [...ARMS_DESK], bounce: 0, strand: 0, chest: 0 };
function lerp(a, b, k) { return a + (b - a) * k; }
let lastPound = 0;
function animatePub(t, dt, act) {
  const A = ACTS[act](t), k = 1 - Math.exp(-(A.k || 6) * dt);
  POSE.sit = lerp(POSE.sit, A.sit, k * .7); POSE.lean = lerp(POSE.lean, A.lean || 0, k); POSE.twist = lerp(POSE.twist, A.twist || 0, k); POSE.tilt = lerp(POSE.tilt, A.tilt || 0, k);
  POSE.bounce = lerp(POSE.bounce, A.bounce || 0, k); POSE.strand = lerp(POSE.strand, A.strand || 0, k * .6); POSE.chest = lerp(POSE.chest, A.chest || 0, k);
  for (let i = 0; i < 3; i++) POSE.head[i] = lerp(POSE.head[i], A.head[i], k);
  for (let i = 0; i < 4; i++) { POSE.R[i] = lerp(POSE.R[i], A.R[i], k); POSE.L[i] = lerp(POSE.L[i], A.L[i], k); }
  const s = POSE.sit, breath = .012 * sn(t * 2.2);
  // seated: hips forward, knees down; standing: straight. The pelvis drops onto the seat.
  J.pelvis.position.y = lerp(HIPY, CH.seat + .06, s) + POSE.bounce;
  J.pelvis.position.z = lerp(.06, -.06, s);
  J.hipR.rotation.x = J.hipL.rotation.x = -1.45 * s; J.knR.rotation.x = J.knL.rotation.x = 1.45 * s;
  J.spine.rotation.set(POSE.lean + breath, POSE.twist, POSE.tilt);
  J.spine.scale.set(1, 1, 1 + .06 * POSE.chest);
  J.head.rotation.set(POSE.head[0] - POSE.lean * .95, POSE.head[1], POSE.head[2]);
  J.shR.rotation.set(POSE.R[0], POSE.R[1], POSE.R[2]); J.elR.rotation.set(POSE.R[3], 0, 0);
  J.shL.rotation.set(POSE.L[0], -POSE.L[1], -POSE.L[2]); J.elL.rotation.set(POSE.L[3], 0, 0);
  keepArmsClear();
  strand.rotation.z = POSE.strand * (.9 + .5 * sn(t * 17)); strand.rotation.x = POSE.strand * .3 * sn(t * 11);
  // the moustache bounces when he talks and bristles when he's riled
  stache.scale.y = 1 + (FACE.talk ? .12 : 0) + POSE.strand * .1 * sn(t * 23); stache.rotation.z = .05 * sn(t * 3) * (1 + POSE.strand * 3);
  // the fist meets the desk: thump
  if (A.pound !== undefined) { if (A.pound > .55 && A.pound < .62 && t - lastPound > .3) { lastPound = t; thump(.45); } }
}

// no clipping: if a hand or elbow would sink into his body or head, swing that arm outward until it is clear
const HAND_R = H * .046 * 1.3, TORSO = { y0: H * .37 - HIPY, y1: H * .74 - HIPY, rx: H * .11 + .05, zf: H * .066 + PUB_D.belly + .01, zb: H * .065 };
const HEAD = { y: (HP.yb + HP.yt) / 2, ry: (HP.yt - HP.yb) / 2 * 1.08, rx: HP.W * 1.25, zc: (HP.front((HP.yb + HP.yt) / 2) + HP.back((HP.yb + HP.yt) / 2)) / 2, rz: (HP.front((HP.yb + HP.yt) / 2) - HP.back((HP.yb + HP.yt) / 2)) / 2 * 1.1 };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), HAND_AT = new THREE.Vector3(0, -H * .13 - H * .03 * 1.3, 0), MID_AT = new THREE.Vector3(0, -H * .07, 0);
function inBody(local, r = HAND_R) {   // local: a point in the spine's frame
  if (local.y > TORSO.y0 - r && local.y < TORSO.y1 + r) { const rz = local.z > 0 ? TORSO.zf : TORSO.zb, a = local.x / (TORSO.rx + r), b = local.z / (rz + r); if (a * a + b * b < 1) return true; }
  return false;
}
function inHead(local) { const a = local.x / (HEAD.rx + HAND_R), b = (local.y - HEAD.y) / (HEAD.ry + HAND_R), c = (local.z - HEAD.zc) / (HEAD.rz + HAND_R); return a * a + b * b + c * c < 1; }
function keepArmsClear() {
  for (const [sh, el, sg] of [[J.shR, J.elR, -1], [J.shL, J.elL, 1]]) {
    for (let it = 0; it < 12; it++) {
      pub.updateMatrixWorld(true); let hit = false;
      for (const [pt, r] of [[HAND_AT, HAND_R], [MID_AT, H * .035]]) { el.localToWorld(_w.copy(pt));
        if (inBody(J.spine.worldToLocal(_v.copy(_w)), r) || inHead(J.head.worldToLocal(_v.copy(_w)))) { hit = true; break; } }
      if (!hit) break;
      sh.rotation.z += (Math.abs(sh.rotation.z) > Math.PI / 2 ? -sg : sg) * .1;   // a raised arm swings back toward the side, a lowered one away from the body
    }
  }
}

// ---------- symbols round his head: red anger marks when he's mad, sparkles when he's pleased (user's references) ----------
function symTex(draw) { const c = cv(128), g = c.getContext('2d'); g.lineCap = 'round'; draw(g); const t = new THREE.CanvasTexture(c); return t; }
const ANGER = symTex(g => { g.strokeStyle = '#d0283a'; g.lineWidth = 13; g.translate(64, 64); g.rotate(-.35);
  for (let k = 0; k < 4; k++) { g.save(); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(-44, -12); g.lineTo(-24, -12); g.quadraticCurveTo(-12, -12, -12, -24); g.lineTo(-12, -44); g.stroke(); g.restore(); } });
const SPARK = symTex(g => { const star = (x, y, r) => { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); };
  g.fillStyle = '#fff4c8'; g.strokeStyle = '#3a2a10'; star(64, 64, 52); });
const SYM_OF = { angry: 'anger', riled: 'anger', intense: 'anger', pleased: 'spark', happy: 'spark', proud: 'spark', wink: 'spark', fired: 'spark' };
const SYMS = { anger: [[.34, .3, 1], [-.32, .2, .8]], spark: [[.36, .32, .9], [-.38, .24, .7], [.46, .04, .5]] };
const symSprites = [0, 1, 2].map(() => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: ANGER, transparent: true, depthTest: false })); m.renderOrder = 5; m.visible = false; scene.add(m); return m; });
const _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3();
let symA = 0;
function updateSyms(dt) {
  const kind = SYM_OF[FACE.cur], set = kind ? SYMS[kind] : [];
  symA = kind ? Math.min(1, symA + dt * 4) : Math.max(0, symA - dt * 6);
  camera.matrixWorld.extractBasis(_r, _u, _f); J.head.localToWorld(_w.set(0, HEAD.y, 0));
  symSprites.forEach((m, i) => { const d = set[i]; if (!d || symA <= 0) { m.visible = false; return; }
    const tex = kind === 'anger' ? ANGER : SPARK; if (m.material.map !== tex) { m.material.map = tex; m.material.needsUpdate = true; }
    const ph = clock * (kind === 'anger' ? 9 : 3) + i * 2.1, pulse = kind === 'anger' ? 1 + .18 * Math.abs(sn(ph)) : .65 + .45 * Math.abs(sn(ph));
    const sc = .2 * d[2] * pulse * symA; m.scale.set(sc, sc, 1); m.material.rotation = kind === 'spark' ? .2 * sn(ph * .5) : .1 * sn(ph);
    m.position.copy(_w).addScaledVector(_r, d[0]).addScaledVector(_u, d[1]).addScaledVector(_f, .25); m.visible = true; });
}

// ---------- thumps: the bulb swings, prints jump, the frame goes crooked, the view shakes ----------
const SHAKE = { a: 0 };
function thump(power = 1) {
  BULB.vx += (rand() - .5) * 1.6 * power; BULB.vz += (.6 + rand() * .6) * power;
  SHAKE.a = Math.max(SHAKE.a, .02 * power);
  deskBits.children.forEach(m => { m.userData.v = (m.userData.v || 0) + (.4 + rand() * .5) * power; });
  frame.rotation.z += (rand() - .3) * .03 * power;
}

// ---------- first-person view: seated across the desk, look around by dragging or with the arrow keys ----------
// shots: the camera moves between a few set-ups during the talk. All of them stay on your side of the desk and on the
// right of the line between you and him (x >= 0), so the 180-degree rule holds; none of them shows you.
const SHOTS = {
  pov: { p: [0, 1.42, .66], fov: 56, ty: -.05 },
  med: { p: [.42, 1.36, .22], fov: 44, ty: -.12 },
  low: { p: [.3, 1.02, .28], fov: 56, ty: -.04 },
  close: { p: [.24, 1.34, .45], fov: 44, ty: -.04 },
  wide: { p: [1.15, 1.9, 1.25], fov: 58, ty: -.3 }
};
const SHOT_OF = ['pov', 'med', 'pov', 'close', 'med', 'wide', 'low', 'low', 'wide', 'close', 'low', 'close', 'pov'];
const CAM = { p: new THREE.Vector3(...SHOTS.pov.p), look: new THREE.Vector3(0, 1.2, -1), fov: 56, shot: 'pov' };
const EYE = { x: 0, y: 1.42, z: .66 }, view = { yaw: 0, pitch: 0, ty: 0, tp: 0 };
const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); advance(); } });
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cvs = renderer.domElement; let drag = null;
cvs.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; try { cvs.setPointerCapture(e.pointerId); } catch (_) {} });
cvs.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; if (e.buttons === 0 && e.pointerType === 'mouse') { drag = null; return; }
  const s = 2.6 / Math.max(innerWidth, innerHeight) * (e.pointerType === 'touch' ? 1.3 : 1); view.ty += (e.clientX - drag.x) * s; view.tp += (e.clientY - drag.y) * s; drag.x = e.clientX; drag.y = e.clientY; });
for (const ev of ['pointerup', 'pointercancel']) cvs.addEventListener(ev, () => { drag = null; });

// ---------- the talk ----------
const TALK = { i: -1, shown: 0, total: 0, spans: [], t0: 0, done: false, then: null, ending: false };
function buildLine(b) {
  const p = $('talkText'); p.textContent = ''; TALK.spans = [];
  for (const seg of b.say) {
    const host = typeof seg === 'string' ? p : Object.assign(document.createElement('span'), { className: 'term h' });
    if (host !== p) { host.dataset.en = seg.en; host.dataset.t = seg.t; host.tabIndex = 0; p.append(host); }
    for (const ch of (typeof seg === 'string' ? seg : seg.t)) { const s = document.createElement('span'); s.className = 'h'; s.textContent = ch; host.append(s); TALK.spans.push(s); }
  }
  TALK.total = TALK.spans.length; TALK.shown = 0;
}
function say(i) {
  const b = BEATS[i]; TALK.i = i; TALK.done = false; TALK.then = b.then || null; TALK.t0 = clock; actT0 = clock;
  FACE.cur = b.face; ACT = b.act; CAM.shot = SHOT_OF[i] || 'pov'; view.ty = view.tp = 0; buildLine(b); $('talk').hidden = false;
}
function revealAll() { TALK.spans.forEach(s => s.classList.remove('h')); $('talkText').querySelectorAll('.term').forEach(e => e.classList.remove('h')); TALK.shown = TALK.total; finishLine(); }
function finishLine() { if (TALK.done) return; TALK.done = true; FACE.talk = 0; if (TALK.then === 'slam') { slamAt = clock + .05; } }
function advance() {
  if (TALK.ending) { const g = document.querySelector('.cas-go.on'); if (g) g.click(); return; }
  if (TALK.i < 0) return;
  if (!TALK.done) { revealAll(); return; }
  if (TALK.i + 1 < BEATS.length) { hideGloss(); say(TALK.i + 1); return; }
  // the last line: he keeps shooing you out while the room fades, then on to the palace
  // he keeps shooing; a big button takes you out, and the room fades before the palace loads
  TALK.ending = true; hideGloss(); $('talk').hidden = true;
  const go = window.CasasolaShell.goButton('Go to the National Palace', NEXT, { fixed: true, before: on => { go.classList.remove('on'); $('fade').className = 'in'; setTimeout(on, 1100); } });
  document.body.appendChild(go); requestAnimationFrame(() => { go.classList.add('on'); go.focus({ preventScroll: true }); });
}
$('bNext').addEventListener('click', e => { e.stopPropagation(); advance(); });
$('talk').addEventListener('click', e => { if (e.target.closest('.term')) return; advance(); });
// glosses: hover with a mouse, tap on a touch screen
const gloss = $('gloss');
function showGloss(el) { gloss.innerHTML = ''; const b = document.createElement('b'); b.textContent = el.dataset.t; gloss.append(b, document.createTextNode(el.dataset.en)); gloss.hidden = false;
  const r = el.getBoundingClientRect(), gw = gloss.offsetWidth, gh = gloss.offsetHeight; gloss.style.left = Math.max(16, Math.min(innerWidth - gw - 16, r.left + r.width / 2 - gw / 2)) + 'px'; gloss.style.top = Math.max(8, r.top - gh - 10) + 'px'; gloss.dataset.for = el.dataset.t; }
function hideGloss() { gloss.hidden = true; gloss.dataset.for = ''; }
$('talkText').addEventListener('pointerover', e => { const t = e.target.closest('.term'); if (t && !t.classList.contains('h') && e.pointerType === 'mouse') showGloss(t); });
$('talkText').addEventListener('pointerout', e => { const t = e.target.closest('.term'); if (t && e.pointerType === 'mouse' && !t.contains(e.relatedTarget)) hideGloss(); });
$('talkText').addEventListener('click', e => { const t = e.target.closest('.term'); if (!t) return; e.stopPropagation(); if (!t.classList.contains('h')) showGloss(t); });
addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('.term')) hideGloss(); });
$('talkText').addEventListener('focusin', e => { const t = e.target.closest('.term'); if (t) showGloss(t); });
$('talkText').addEventListener('focusout', hideGloss);

// ---------- loop ----------
let clock = 0, ACT = 'idle', actT0 = 0, slamAt = -1, lastPaint = -1, nextBlink = 2, blinkEnd = 0, flapT = 0;
const CPS = 42;   // letters per second
function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();
let last = performance.now();
function frame_(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now; clock += dt;
  // the typed line
  if (TALK.i >= 0 && !TALK.done) {
    const n = Math.min(TALK.total, Math.floor((clock - TALK.t0) * CPS));
    while (TALK.shown < n) { const s = TALK.spans[TALK.shown++]; s.classList.remove('h'); const term = s.parentElement.closest('.term'); if (term) term.classList.remove('h'); }
    flapT -= dt; if (flapT <= 0) { flapT = .07 + Math.random() * .07; FACE.talk = FACE.talk ? 0 : 1; }
    if (TALK.shown >= TALK.total) finishLine();
  }
  if (slamAt > 0 && clock >= slamAt) { slamAt = -1; thump(1.2); }
  // the publisher
  animatePub(clock - actT0 + 0, dt, ACT);
  const S = EX[FACE.cur] || EX.neutral;
  FACE.flush = lerp(FACE.flush, S.flush || 0, 1 - Math.exp(-3 * dt)); FACE.spin += dt * 7;
  if (clock > nextBlink) { blinkEnd = clock + .12; nextBlink = clock + 2 + Math.random() * 3; }
  FACE.blink = clock < blinkEnd;
  const key = [FACE.cur, FACE.talk, FACE.blink, Math.round(FACE.flush * 10), S.eyes === 'spiral' || S.jitter || S.sweat ? Math.floor(clock * 14) : 0].join();
  if (key !== FACE.key && clock - lastPaint > .045) { FACE.key = key; lastPaint = clock; paintPub(S, { flush: FACE.flush, blink: FACE.blink, talk: FACE.talk, spin: FACE.spin, tick: Math.floor(clock * 14) }); }
  // bulb pendulum and prints settling
  BULB.vx += (-BULB.ax * 9 - BULB.vx * .6) * dt; BULB.vz += (-BULB.az * 9 - BULB.vz * .6) * dt; BULB.ax += BULB.vx * dt; BULB.az += BULB.vz * dt;
  bulbPivot.rotation.set(BULB.az + .01 * sn(clock * .7), 0, BULB.ax + .008 * sn(clock * .5));
  lamp.intensity = 1.35 + .05 * sn(clock * 37) * sn(clock * 3.1);
  deskBits.children.forEach(m => { const u = m.userData; if (!u.v && !u.h) return; u.v = (u.v || 0) - 9.8 * dt; u.h = Math.max(0, (u.h || 0) + u.v * dt * .05); if (u.h === 0) u.v = Math.max(0, -u.v * .3) < .05 ? 0 : -u.v * .3; m.position.y = u.y0 + u.h; });
  // view
  const kr = 1.6 * dt; if (keys.ArrowLeft || keys.KeyA) view.ty -= kr; if (keys.ArrowRight || keys.KeyD) view.ty += kr; if (keys.ArrowUp || keys.KeyW) view.tp -= kr; if (keys.ArrowDown || keys.KeyS) view.tp += kr;
  view.ty = Math.max(-2.4, Math.min(2.4, view.ty)); view.tp = Math.max(-1.2, Math.min(1.2, view.tp));
  const kv = 1 - Math.exp(-12 * dt); view.yaw = lerp(view.yaw, view.ty, kv); view.pitch = lerp(view.pitch, view.tp, kv);
  if (ACT === 'riled' || ACT === 'pound') SHAKE.a = Math.max(SHAKE.a, ACT === 'riled' ? .028 : .016);
  SHAKE.a *= Math.exp(-8 * dt);
  const sh = SHOTS[CAM.shot], km = 1 - Math.exp(-2.6 * dt);
  CAM.p.lerp(_v.set(sh.p[0] + .03 * sn(clock * .31), sh.p[1] + .006 * sn(clock * 1.4), sh.p[2] + .02 * sn(clock * .23)), km);
  J.head.localToWorld(_v.set(0, HEAD.y, 0)); _v.y += sh.ty; CAM.look.lerp(_v, 1 - Math.exp(-4 * dt));
  CAM.fov = lerp(CAM.fov, (window.__fov || sh.fov) * (camera.aspect < .8 ? 1.32 : 1), km); if (Math.abs(camera.fov - CAM.fov) > .01) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
  camera.position.set(CAM.p.x + (Math.random() - .5) * SHAKE.a, CAM.p.y + (Math.random() - .5) * SHAKE.a, CAM.p.z);
  camera.lookAt(CAM.look); camera.rotateY(-view.yaw); camera.rotateX(-view.pitch); camera.rotateZ((Math.random() - .5) * SHAKE.a * 1.6);
  updateSyms(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame_);
}
requestAnimationFrame(frame_);
// begin: the room fades up, then he speaks
const startBeat = Math.max(0, Math.min(BEATS.length - 1, +(PARAMS.get('beat') || 0)));
// inside the game shell the room is drawn under the loading screen first, and the talk starts once it is seen
const SHELL = window.CasasolaShell;
if (SHELL && SHELL.inShell) {
  $('fade').className = 'out';
  requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => SHELL.ready(), 300)));
  SHELL.onShown(() => setTimeout(() => say(startBeat), 700));
} else {
  requestAnimationFrame(() => { $('fade').className = 'out'; });
  setTimeout(() => say(startBeat), PARAMS.has('shot') ? 0 : 1100);
}
window.__office = { THREE, scene, camera, renderer, pub, J, BEATS, say, advance, revealAll, view, thump, EX, FACE, setFace: f => { FACE.cur = f; }, setAct: a => { ACT = a; actT0 = clock; }, POSE, Q };
