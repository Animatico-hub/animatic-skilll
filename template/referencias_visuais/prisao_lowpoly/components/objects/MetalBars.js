import * as THREE from 'three';
import { mat } from '../../lib/materials.js';

export const barSteel = () => mat(0x1d1f22, { roughness: 0.42, metalness: 0.55 });

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

/**
 * Many axis-aligned box pieces as ONE InstancedMesh.
 * pieces: [cx, cy, cz, sx, sy, sz]
 */
export function instancedBoxes(pieces, material, { cast = true, receive = true, name = 'boxes' } = {}) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(geo, material, pieces.length);
  im.name = name;
  pieces.forEach(([x, y, z, sx, sy, sz], i) => {
    _m.compose(_p.set(x, y, z), _q.identity(), _s.set(sx, sy, sz));
    im.setMatrixAt(i, _m);
  });
  im.instanceMatrix.needsUpdate = true;
  im.computeBoundingSphere();
  im.castShadow = cast;
  im.receiveShadow = receive;
  return im;
}

/**
 * Bar pieces for a panel in the XY plane: x centred on 0, y from 0 to height, z = 0.
 * Square vertical bars, flat crossbars and an outer frame (classic cell front).
 */
export function barPanelPieces({
  width,
  height,
  spacing = 0.13,
  bar = 0.036,
  cross = [0.14, 1.08],
  crossH = 0.055,
  crossD = 0.06,
  frame = 0.06,
  bottom = true,
  x = 0,
  z = 0,
}) {
  const pieces = [];
  const inner = width - frame * 2;
  const n = Math.max(1, Math.round(inner / spacing));
  const step = inner / n;
  for (let i = 1; i < n; i++) pieces.push([x - width / 2 + frame + step * i, height / 2, z, bar, height - frame, bar]);
  for (const y of cross) pieces.push([x, y, z, inner, crossH, crossD]);
  pieces.push([x - width / 2 + frame / 2, height / 2, z, frame, height, frame]);
  pieces.push([x + width / 2 - frame / 2, height / 2, z, frame, height, frame]);
  pieces.push([x, height - frame / 2, z, width, frame, frame]);
  if (bottom) pieces.push([x, frame / 4, z, width, frame / 2, frame]);
  return pieces;
}

export function createBarPanel(opts) {
  return instancedBoxes(barPanelPieces(opts), opts.material ?? barSteel(), { name: 'bars' });
}

/**
 * Small barred window mounted ON a wall surface (back at z = 0, frame protrudes `depth` toward +Z),
 * so it works on solid wall boxes without cutting holes.
 */
export function createBarredWindow({ width = 0.7, height = 0.32, depth = 0.08, sky = 0xcfe3f2 } = {}) {
  const g = new THREE.Group();
  g.name = 'barredWindow';
  const root = new THREE.Group();
  root.position.z = depth;
  g.add(root);
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ color: sky, emissive: sky, emissiveIntensity: 1.3 }),
  );
  pane.position.z = -depth + 0.004;
  root.add(pane);
  const steel = barSteel();
  const pieces = [];
  const n = 6;
  for (let i = 1; i < n; i++) pieces.push([-width / 2 + (width / n) * i, 0, -depth / 2, 0.022, height, 0.022]);
  pieces.push([0, 0, -depth * 0.55, width, 0.02, 0.02]);
  // concrete frame around the opening, with a deeper sill
  const reveal = mat(0xb9bec0);
  const f = 0.04;
  const rv = (x, y, sx, sy, sz = depth) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), reveal);
    m.position.set(x, y, -depth + sz / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
  };
  rv(0, height / 2 + f / 2, width + f * 2, f);
  rv(0, -height / 2 - f / 2, width + f * 2 + 0.04, f, depth + 0.04);
  rv(width / 2 + f / 2, 0, f, height);
  rv(-width / 2 - f / 2, 0, f, height);
  root.add(instancedBoxes(pieces, steel, { name: 'windowBars' }));
  return g;
}
