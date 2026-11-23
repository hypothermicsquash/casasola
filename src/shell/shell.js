// The game shell. One page stays open the whole game: the title, the loading screen and a frame (#stage) that holds
// the scene being played. Moving on fades the loading screen in, drops the old scene (its WebGL memory goes with it),
// loads the next page into a fresh frame, and fades the loader away once that scene has drawn its first frames.
// Scenes talk to the shell through public/shell/client.js (CasasolaShell.ready / onShown / next).
import './shell.css';

const $ = id => document.getElementById(id);
const SEARCH = location.search;                       // ?q=low and friends pass through to every scene
const ORDER = ['scene1.html', 'office.html', 'scene2.html', 'credits.html'];
const MIN_SHOW = 1400;                                // the loader stays at least this long, so it never just flickers
const READY_TIMEOUT = 45000;                          // a scene that never reports in is shown anyway
const FADE_IN = 600, FADE_OUT = 900;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- the loading screen ----------
const loader = $('loader');
// every page that shows it starts the turn at the same angle for the same moment, so it never jumps
function syncSpin() {
  const t = performance.now();
  loader.querySelector('.row').style.animationDelay = -(t % 12000) + 'ms';
  loader.querySelector('.col').style.animationDelay = -(t % 1000) + 'ms';
}
async function showLoader() {
  if (!loader.classList.contains('off')) return;
  syncSpin(); loader.classList.add('coming'); void loader.offsetWidth; loader.classList.remove('off');
  await sleep(FADE_IN + 40); loader.classList.remove('coming');
}
async function hideLoader() { loader.classList.add('off'); await sleep(FADE_OUT); }

// ---------- the title: a wall of overlapping prints ----------
const PHOTOS = ['maderistas', 'tram', 'carniceros', 'ladrones', 'juicio', 'soldiers', 'officers', 'darkroom', 'soldado', 'villa-train', 'train', 'march', 'diaz', 'villa-zapata', 'madero'];
const imgs = PHOTOS.map(n => { const im = new Image(); im.decoding = 'async'; im.src = `shell/collage/${n}.jpg`; im.alt = ''; im.draggable = false; return im; });
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
function layoutCollage() {
  const box = $('collage'); box.innerHTML = ''; seed = 7;
  const W = box.clientWidth, H = box.clientHeight;
  // under-layer: rows of prints laid edge to edge with a little overlap, so no black ever shows
  const rows = Math.max(2, Math.round(H / Math.max(170, Math.min(300, H / 3)))), rh = H / rows + 2;
  let k = 0;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * rh * .6;
    while (x < W) {
      const im = imgs[k++ % imgs.length], ar = (im.naturalWidth / im.naturalHeight) || 1.4, w = rh * ar;
      const el = im.cloneNode(); el.style.cssText = `left:${x.toFixed(1)}px;top:${(r * (rh - 2) - 1).toFixed(1)}px;width:${(w + 3).toFixed(1)}px;height:${rh.toFixed(1)}px`;
      box.appendChild(el); x += w - 2;
    }
    k += 3;
  }
  // over-layer: loose prints with white borders, turned a little, scattered on top
  const n = Math.round(Math.max(7, Math.min(14, W * H / 110000)));
  for (let i = 0; i < n; i++) {
    const im = imgs[(i * 7 + 4) % imgs.length], ar = (im.naturalWidth / im.naturalHeight) || 1.4;
    const h = Math.min(H * .42, 150 + rnd() * 140), w = h * ar;
    const cx = ((i + .5) / n) * W + (rnd() - .5) * W / n, cy = (.15 + rnd() * .75) * H;
    const el = im.cloneNode(); el.className = 'print';
    el.style.cssText = `left:${(cx - w / 2).toFixed(1)}px;top:${(cy - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;transform:rotate(${((rnd() - .5) * 14).toFixed(2)}deg)`;
    box.appendChild(el);
  }
}
let rt = 0;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (!$('title').hidden) layoutCollage(); }, 150); });

// ---------- scenes ----------
let frame = null, current = null, readyAt = null, busy = false;
function mount(href) {
  return new Promise(resolve => {
    readyAt = resolve;
    const f = document.createElement('iframe');
    f.title = 'Game'; f.allow = 'fullscreen; autoplay';
    f.src = href + SEARCH;
    $('stage').appendChild(f); frame = f; current = href;
    // fall back if a scene never says it's ready
    f.addEventListener('load', () => setTimeout(() => { if (readyAt === resolve) { console.warn('shell: no ready from', href); readyAt = null; resolve(); } }, READY_TIMEOUT), { once: true });
  });
}
function unmount() {
  if (!frame) return;
  const f = frame; frame = null;
  try { f.contentWindow.location.replace('about:blank'); } catch (e) {}
  f.remove();
}
async function go(href) {
  if (busy) return; busy = true;
  if (href === 'title') return toTitle();
  await showLoader();
  const t0 = performance.now();
  $('title').hidden = true; $('collage').innerHTML = '';
  unmount();
  await sleep(60);
  await mount(href);
  const wait = MIN_SHOW - (performance.now() - t0); if (wait > 0) await sleep(wait);
  // two more frames so the first picture is on screen before the curtain lifts
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try { frame.contentWindow.focus(); } catch (e) {}
  await hideLoader();
  busy = false;
  try { frame.contentWindow.CasasolaShell && frame.contentWindow.CasasolaShell._shown(); } catch (e) {}
}
async function toTitle() {
  await showLoader();
  unmount(); current = null;
  $('title').hidden = false; layoutCollage();
  await sleep(400);
  await hideLoader();
  busy = false;
}

// what the scenes see as window.parent.__casasolaShell
window.__casasolaShell = {
  ready(win) { if (frame && win === frame.contentWindow && readyAt) { const r = readyAt; readyAt = null; r(); } },
  go(href) { go(href); },
  next() { const i = ORDER.indexOf(current); go(i >= 0 && i + 1 < ORDER.length ? ORDER[i + 1] : 'title'); }
};

// Start Game clicks like the game's other important buttons (public/audio/click.mp3, quiet)
$('bPlay').addEventListener('click', () => { try { const c = new Audio('audio/click.mp3'); c.volume = .35; c.play().catch(() => {}); } catch (e) {} go(ORDER[0]); });
// ?start=office jumps straight in (testing)
const jump = new URLSearchParams(SEARCH).get('start');

// first load: the loader is up from the first paint; the title fades in once its prints are decoded
(async () => {
  syncSpin();
  if (jump) { $('title').hidden = true; return go(jump.endsWith('.html') ? jump : jump + '.html'); }
  await Promise.race([Promise.all(imgs.map(im => im.decode().catch(() => {}))), sleep(6000)]);
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(1500)]);
  layoutCollage();
  await sleep(300);
  await hideLoader();
})();
