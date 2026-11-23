import * as THREE from 'three';
import { mesh } from '../../lib/geometry.js';
import { mat, textDecalMaterial } from '../../lib/materials.js';
import { barPanelPieces, instancedBoxes, barSteel } from './MetalBars.js';

const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Sliding barred cell door. The leaf slides toward -X along a top track.
 * Returns { group, leaf, setOpen(0..1), open }.
 */
export function createSlidingBarDoor({ width = 1.08, height = 2.26, travel = 1.0 } = {}) {
  const group = new THREE.Group();
  group.name = 'cellDoor';
  const leaf = new THREE.Group();
  leaf.name = 'doorLeaf';
  const steel = barSteel();
  leaf.add(
    instancedBoxes(
      barPanelPieces({ width, height, spacing: 0.13, cross: [0.14, 0.98, 1.2], frame: 0.055, bottom: true }),
      steel,
      { name: 'doorBars' },
    ),
  );
  // lock box on the closing edge + handle
  const lockMat = mat(0x2b2e32, { roughness: 0.4, metalness: 0.6 });
  const lock = mesh(new THREE.BoxGeometry(0.14, 0.26, 0.08), lockMat);
  lock.position.set(width / 2 - 0.1, 1.09, 0);
  const key = mesh(new THREE.BoxGeometry(0.02, 0.035, 0.01), mat(0x0c0c0d));
  key.position.set(width / 2 - 0.1, 1.06, 0.045);
  const handle = mesh(new THREE.BoxGeometry(0.025, 0.22, 0.025), steel);
  handle.position.set(width / 2 - 0.2, 1.09, 0.07);
  const hb1 = mesh(new THREE.BoxGeometry(0.02, 0.02, 0.06), steel);
  hb1.position.set(width / 2 - 0.2, 1.18, 0.04);
  const hb2 = hb1.clone();
  hb2.position.y = 1.0;
  // hangers riding the track
  for (const x of [-width / 2 + 0.12, width / 2 - 0.12]) {
    const h = mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), lockMat);
    h.position.set(x, height + 0.03, 0);
    leaf.add(h);
  }
  leaf.add(lock, key, handle, hb1, hb2);
  group.add(leaf);

  const state = { open: 0 };
  const api = {
    group,
    leaf,
    travel,
    get open() {
      return state.open;
    },
    setOpen(t) {
      state.open = Math.min(1, Math.max(0, t));
      leaf.position.x = -smooth(state.open) * travel;
    },
  };
  return api;
}

/**
 * Hinged steel door with a wired-glass window (corridor ends, offices).
 * Pivot on the -X edge; setOpen(1) swings it 95 degrees toward +Z.
 */
export function createSteelDoor({ width = 0.95, height = 2.1, color = 0xcfc3a3, window = true, label = null } = {}) {
  const group = new THREE.Group();
  group.name = 'steelDoor';
  const frameMat = mat(0x9ea6aa, { roughness: 0.5, metalness: 0.3 });
  const fw = 0.06;
  const frame = [
    [-width / 2 - fw / 2, height / 2, fw, height + fw],
    [width / 2 + fw / 2, height / 2, fw, height + fw],
    [0, height + fw / 2, width + fw * 2, fw],
  ];
  for (const [x, y, sx, sy] of frame) {
    const f = mesh(new THREE.BoxGeometry(sx, sy, 0.12), frameMat);
    f.position.set(x, y, 0);
    group.add(f);
  }
  const pivot = new THREE.Group();
  pivot.position.set(-width / 2, 0, 0.0);
  group.add(pivot);
  const leafMat = mat(color, { roughness: 0.55 });
  const t = 0.05;
  const add = (x0, x1, y0, y1, m = leafMat, z = 0, d = t) => {
    const b = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, d), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, z);
    pivot.add(b);
    return b;
  };
  if (window) {
    const wx0 = width * 0.3;
    const wx1 = width * 0.7;
    const wy0 = 1.2;
    const wy1 = 1.75;
    add(0, width, 0, wy0);
    add(0, width, wy1, height);
    add(0, wx0, wy0, wy1);
    add(wx1, width, wy0, wy1);
    const glass = new THREE.MeshStandardMaterial({ color: 0x2c3d4a, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.55 });
    add(wx0, wx1, wy0, wy1, glass, 0, 0.01);
    const wire = mat(0x6e767c);
    for (let i = 1; i < 4; i++) add(wx0 + ((wx1 - wx0) / 4) * i - 0.002, wx0 + ((wx1 - wx0) / 4) * i + 0.002, wy0, wy1, wire, 0, 0.012);
  } else add(0, width, 0, height);
  add(0.04, width - 0.04, 0.03, 0.28, mat(0x9aa2a6, { roughness: 0.35, metalness: 0.6 }), t / 2 + 0.002, 0.004);
  const handleMat = mat(0x8c9397, { roughness: 0.3, metalness: 0.7 });
  const handle = add(width - 0.14, width - 0.06, 1.0, 1.03, handleMat, t / 2 + 0.03, 0.025);
  handle.name = 'handle';
  add(width - 0.12, width - 0.1, 0.98, 1.05, handleMat, t / 2 + 0.012, 0.025);
  if (label) {
    const plate = mesh(new THREE.PlaneGeometry(0.34, 0.1), textDecalMaterial(label, { color: 0x1a1a1a, aspect: 3.4 }), { cast: false });
    plate.position.set(width / 2, 1.88, t / 2 + 0.003);
    pivot.add(plate);
  }
  const state = { open: 0 };
  return {
    group,
    pivot,
    get open() {
      return state.open;
    },
    setOpen(v) {
      state.open = Math.min(1, Math.max(0, v));
      pivot.rotation.y = -smooth(state.open) * THREE.MathUtils.degToRad(95);
    },
  };
}
