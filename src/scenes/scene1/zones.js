// Scene 1 zones, in the player's path coordinates (x runs -8 at the edge of town to 161 on the platform).
// The street, crossing and station are still built in one piece by scene1.js: the whole path is 170 m and
// visible end to end, so splitting the outdoors would save little. Interiors, and anything the player
// only reaches by walking somewhere, go here as their own modules and stream in as the player nears them.
//
// To add one: make zones/<name>.js exporting `async function load(kit)` that builds into a THREE.Group
// and returns { group, update?, dispose? }, then add an entry below with its ground box.
// The ochre house's front room (Miguel, the table, the camera) is registered by scene1.js itself as the zone
// 'house-interior' (window.__casasola.zones), because it is built from the template's own figures and props;
// main.js streams it together with the zones listed here.
export const zones = [
];

// ?zones=debug adds a marker post that streams in near the crossing, to watch loading and unloading work
if (new URLSearchParams(location.search).get('zones') === 'debug')
  zones.push({ id: 'probe', x0: 88, x1: 92, z0: -2, z1: 2, load: () => import('./zones/probe.js') });
