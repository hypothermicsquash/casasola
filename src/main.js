import { SCENES, FIRST } from './scenes/index.js';
import { ZoneManager } from './engine/zones.js';
import { setupEmbed } from './engine/embed.js';

setupEmbed();

async function boot() {
  const id = new URLSearchParams(location.search).get('scene') || FIRST;
  const def = SCENES[id] || SCENES[FIRST];
  const mod = await def.load();
  // this streamer runs the zones; the scene's own fallback streamer (for the single-file prototype) stands down
  window.__casasolaZoneHost = true;
  const game = await mod.start();

  const kit = { ...game.kit, scene: game.scene, camera: game.camera, renderer: game.renderer };
  // zones listed in the scene folder, plus any the scene script registers itself (scene 1's house interior)
  const zones = [...(mod.zones || []), ...(game.zones || [])];
  const zm = new ZoneManager({ zones, kit, getPlayer: () => game.player });
  await zm.prime();

  const debug = new URLSearchParams(location.search).get('zones') === 'debug';
  let tag = null;
  if (debug) { tag = document.createElement('pre'); tag.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:99;margin:0;font:11px monospace;color:#fff;background:#0008;padding:3px 5px;pointer-events:none'; document.body.append(tag); }

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    zm.update(dt);
    if (tag) tag.textContent = `x ${game.player.x.toFixed(1)} z ${game.player.z.toFixed(1)}  ${zm.status()}`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.__zones = zm;
  if (id === 'scene1') nextScene('office.html');
  const S = window.CasasolaShell;
  if (S && S.inShell) {
    // inside the game shell: the title card is the shell's, so go straight into the opening pages once the town has
    // warmed its shaders behind the loading screen (scene 1 draws the street for 2.5 s after load for exactly that)
    const again = document.getElementById('bAgain'); if (again) again.onclick = () => S.next('scene1.html');
    setTimeout(() => { S.ready(); }, 2600);
    S.onShown(() => { const b = document.getElementById('bStart'); if (b) b.click(); });
  }
}
// after scene 1's newspaper, a second button beside Play again leads on to the publisher's office, which leads to the palace
function nextScene(href) {
  const again = document.getElementById('bAgain'); if (!again) return;
  const b = again.cloneNode(false); b.id = 'bNext'; b.textContent = 'Next scene'; b.style.marginLeft = '10px'; b.style.transition = 'opacity .4s'; b.style.opacity = 0; b.style.pointerEvents = 'none';
  b.onclick = () => {
    if (window.CasasolaShell) window.CasasolaShell.next(href);
    else location.href = href + location.search.replace(/[?&]scene=[^&]*/, '');
  };
  again.after(b);
  new MutationObserver(() => { const on = again.classList.contains('show'); b.classList.toggle('show', on); b.style.opacity = on ? 1 : 0; b.style.pointerEvents = on ? '' : 'none'; }).observe(again, { attributes: true, attributeFilter: ['class'] });
}
boot().catch(e => console.error('boot failed', e));
