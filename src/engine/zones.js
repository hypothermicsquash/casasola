// Streams a scene's zones in and out by where the player stands.
//
// A zone is a box on the ground plane (x0..x1, z0..z1, in the scene's straight, unbent layout) plus a
// load() that dynamic-imports its own module. Vite turns every import() into a separate file, so a zone's
// code and the textures it fetches are only downloaded when the player comes within `preload` metres.
// A zone more than `keep` metres away is unloaded and its GPU memory freed (keep > preload, so walking
// back and forth over an edge never thrashes).
//
// A zone module exports:
//   export async function load(kit)  -> { group, update?(dt, kit), dispose?() }
// where kit is the scene's shared toolbox (THREE, the painted shading `patch`, `box`, `warpS`, textures...).
// Zones with `always: true` load at start and never unload (the street the player spawns on, say).

export class ZoneManager {
  constructor({ zones, kit, getPlayer, preload = 40, keep = 70, every = .25 }) {
    this.zones = zones.map(z => ({ ...z, state: 'idle', live: null }));
    this.kit = kit; this.getPlayer = getPlayer;
    this.preload = preload; this.keep = keep; this.every = every; this.acc = every;
    this.onChange = null;
  }
  static distance(z, x, y) {
    const dx = Math.max(z.x0 - x, 0, x - z.x1), dy = Math.max(z.z0 - y, 0, y - z.z1);
    return Math.hypot(dx, dy);
  }
  // load the zones around the spawn before the player can see anything
  async prime() {
    const p = this.getPlayer();
    await Promise.all(this.zones.filter(z => z.always || ZoneManager.distance(z, p.x, p.z) <= this.preload).map(z => this.enter(z)));
  }
  update(dt) {
    for (const z of this.zones) if (z.state === 'live' && z.live.update) z.live.update(dt, this.kit);
    if ((this.acc += dt) < this.every) return;   // distance checks four times a second are plenty
    this.acc = 0;
    const p = this.getPlayer();
    for (const z of this.zones) {
      if (z.always) continue;
      const d = ZoneManager.distance(z, p.x, p.z);
      if (d <= this.preload && z.state === 'idle') this.enter(z);
      else if (d > this.keep && z.state === 'live') this.leave(z);
    }
  }
  async enter(z) {
    if (z.state !== 'idle') return z.pending;
    z.state = 'loading';
    const ticket = z.ticket = (z.ticket || 0) + 1;   // a later enter() or leave() makes this load stale
    z.pending = (async () => {
      try {
        const mod = await z.load();
        const live = await mod.load(this.kit);
        if (z.ticket !== ticket || z.state !== 'loading') { dispose(live); return; }   // left again before it finished
        if (live.group) this.kit.scene.add(live.group);
        z.live = live; z.state = 'live';
        if (this.onChange) this.onChange(z, 'in');
      } catch (e) { console.error('zone ' + z.id + ' failed to load', e); if (z.ticket === ticket) z.state = 'idle'; }
    })();
    return z.pending;
  }
  leave(z) {
    if (z.state === 'loading') { z.state = 'idle'; z.ticket++; return; }
    if (z.state !== 'live') return;
    if (z.live.group && z.live.group.parent) z.live.group.parent.remove(z.live.group);
    dispose(z.live); z.live = null; z.state = 'idle';
    if (this.onChange) this.onChange(z, 'out');
  }
  status() { return this.zones.map(z => `${z.id}:${z.state}`).join(' '); }
}

// free geometry, materials and textures a zone made (shared ones carry userData.shared and are kept)
function dispose(live) {
  if (!live) return;
  if (live.dispose) live.dispose();
  if (!live.group) return;
  live.group.traverse(o => {
    if (o.geometry && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      if (m.userData && m.userData.shared) continue;
      // r128 textures have no userData unless something gave them one
      for (const k in m) { const v = m[k]; if (v && v.isTexture && !(v.userData && v.userData.shared)) v.dispose(); }
      m.dispose();
    }
  });
}
