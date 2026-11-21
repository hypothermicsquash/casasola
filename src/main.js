import { SCENES, FIRST } from './scenes/index.js';
import { ZoneManager } from './engine/zones.js';
import { setupEmbed } from './engine/embed.js';

setupEmbed();

async function boot() {
  const id = new URLSearchParams(location.search).get('scene') || FIRST;
  const def = SCENES[id] || SCENES[FIRST];
  const mod = await def.load();
  const game = await mod.start();

  const kit = { ...game.kit, scene: game.scene, camera: game.camera, renderer: game.renderer };
  const zm = new ZoneManager({ zones: mod.zones, kit, getPlayer: () => game.player });
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
}
boot().catch(e => console.error('boot failed', e));
