// A test zone: a tall striped post at the crossing. Only loaded with ?zones=debug.
export async function load({ THREE, warpS }) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xc0392b });
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(.3, .5, .3), i % 2 ? mat : new THREE.MeshBasicMaterial({ color: 0xffffff }));
    m.position.set(90, .25 + i * .5, warpS ? warpS(90, 0) : 0);
    group.add(m);
  }
  let t = 0;
  return { group, update(dt) { t += dt; group.rotation.y = 0; group.children.forEach((m, i) => { m.rotation.y = t + i * .3; }); } };
}
