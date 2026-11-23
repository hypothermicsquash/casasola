// Credits, after the last scene: names roll up on the left in capitals; on the right a Maderista in a sombrero
// gallops in place on one of the game's own procedural horses, waving, with dust streaming back from the hooves.
// Neutral white light only. Cheap: one horse (two draw calls), one rider, a few dust sprites.
import * as THREE from 'three';
import { CasHorses } from '../scenes/scene1/horses.js';
import { LowPolyPeople } from '../scenes/scene1/people-kit.js';
import './credits.css';

const $ = id => document.getElementById(id);
const S = window.CasasolaShell;
const PARAMS = new URLSearchParams(location.search);
const Q = (() => {
  const p = PARAMS.get('q'); if (p === 'low') return 2; if (p === 'mid') return 1; if (p === 'high') return 0;
  const cros = /CrOS/.test(navigator.userAgent), mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8;
  return (cros || mem <= 4 || cores <= 4) ? 2 : 1;
})();

// ---------- the rider ----------
const host = $('rider');
const renderer = new THREE.WebGLRenderer({ antialias: Q < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Q === 2 ? 1 : Math.min(devicePixelRatio, 1.75));
host.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(28, 1, .1, 60);
scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, .75));
const key = new THREE.DirectionalLight(0xffffff, .95); key.position.set(-3, 6, 5); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, .35); rim.position.set(2, 3, -5); scene.add(rim);

const HORSES = CasHorses(THREE, { outlineColor: 0x111111 });
const horse = HORSES.make({ coat: 'darkbay', tack: 'ranchero', seed: 4 });
horse.rotation.y = Math.PI;   // facing left, toward the names
scene.add(horse);

const base = LowPolyPeople.DRAFTS.find(D => D.id === 'rebel');
const RIDE = { hipR: [-1.2, 0, -.45], hipL: [-1.2, 0, .45], knR: [1.0, 0, 0], knL: [1.0, 0, 0], shR: [-.4, 0, -.1], shL: [-2.3, 0, .35], elR: [-.8, 0, 0], elL: [-.3, 0, 0] };
const D = Object.assign({}, base, { id: 'credits_rider', faceOf: undefined, important: true, cane: null, pose: RIDE, expr: Object.assign({}, base.expr) });
const man = LowPolyPeople.figure(D);
const { J, face } = man.userData;
LowPolyPeople.paintFace(face.cv, face.F, face.E, false); face.tex.needsUpdate = true;
horse.userData.seat.add(man);
man.rotation.set(0, Math.PI / 2, 0); man.position.set(0, -.42 * D.h + .02, 0);

// ground: a soft shadow that stays put and dust that streams back
const blob = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.2), new THREE.MeshBasicMaterial({ map: blob, color: 0x2a2a2a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = .002; scene.add(floorGlow);
const under = new THREE.Mesh(new THREE.PlaneGeometry(3, .9), new THREE.MeshBasicMaterial({ map: blob, color: 0x000000, transparent: true, opacity: .85, depthWrite: false }));
under.rotation.x = -Math.PI / 2; under.position.y = .004; scene.add(under);
const DUST = Q === 2 ? 14 : 26, dustMat = new THREE.SpriteMaterial({ map: blob, color: 0x8c8884, transparent: true, depthWrite: false, opacity: .5 });
const dust = [];
for (let i = 0; i < DUST; i++) { const s = new THREE.Sprite(dustMat.clone()); s.userData.t = Math.random(); scene.add(s); dust.push(s); }
const ticks = [];   // little marks on the ground that rush back, so the gallop reads as moving
for (let i = 0; i < 9; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.35, .02), new THREE.MeshBasicMaterial({ color: 0x3c3c3c, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(-5 + i * 1.25, .003, (Math.random() - .5) * 1.4); scene.add(m); ticks.push(m); }

function resize() {
  const w = host.clientWidth || 1, h = host.clientHeight || 1;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  // keep the whole horse and rider in frame at any panel shape
  const fit = Math.max(3.3 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))), 4.4 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
  camera.position.set(.9, 1.55, fit * 1.08); camera.lookAt(0, 1.2, 0); camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

let last = performance.now(), t = 0, frames = 0;
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
  HORSES.update(horse, dt, { speed: 7.6, gait: 'gallop' });
  // a wave with the free arm, and the head turned a little toward you
  J.shL.rotation.z = .35 + Math.sin(t * 5.2) * .3; J.elL.rotation.x = -.35 + Math.sin(t * 5.2 + .8) * .3;   // the near arm (he rides to the left)
  if (J.head) J.head.rotation.y = .35;
  for (const s of dust) {
    s.userData.t += dt * .9; if (s.userData.t > 1) { s.userData.t -= 1; s.userData.z = (Math.random() - .5) * .7; s.userData.x0 = .2 + Math.random() * .7; }
    const k = s.userData.t; s.position.set((s.userData.x0 || .5) + k * 3.2, .08 + k * .55, s.userData.z || 0);
    const sc = .25 + k * 1.1; s.scale.set(sc, sc * .7, 1); s.material.opacity = .32 * Math.sin(Math.PI * k);
  }
  for (const m of ticks) { m.position.x += dt * 7.6; if (m.position.x > 5.5) { m.position.x -= 11.25; m.position.z = (Math.random() - .5) * 1.4; } m.material.opacity = .9 * Math.max(0, 1 - Math.abs(m.position.x) / 5.5); }
  renderer.render(scene, camera);
  if (++frames === 3 && S) S.ready();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- the roll ----------
const roll = $('roll'), win = $('rollWin'), SPEED = 72;   // pixels a second
function startRoll() {
  const H = win.clientHeight, end = $('end'), stop = -(end.offsetTop + end.offsetHeight / 2) + H / 2, from = H;
  const dur = (from - stop) / SPEED * 1000;
  const a = roll.animate([{ transform: `translateY(${from}px)` }, { transform: `translateY(${stop}px)` }], { duration: dur, easing: 'linear', fill: 'forwards' });
  a.onfinish = () => { $('bTitle').classList.add('show'); $('bTitle').focus({ preventScroll: true }); };
  // hold a key or the mouse to roll faster
  const fast = on => { a.playbackRate = on ? 4 : 1; };
  addEventListener('pointerdown', e => { if (!e.target.closest('button')) fast(true); });
  addEventListener('pointerup', () => fast(false)); addEventListener('pointercancel', () => fast(false));
  addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowDown') fast(true); });
  addEventListener('keyup', () => fast(false));
}
roll.style.transform = `translateY(${win.clientHeight}px)`;
// Play again: back to the start of the game, through the loading screen
$('bTitle').onclick = () => { if (S && S.inShell) S.next('scene1.html'); else location.href = 'scene1.html' + location.search; };
const go = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(startRoll, 500));
if (S) S.onShown(go); else go();
