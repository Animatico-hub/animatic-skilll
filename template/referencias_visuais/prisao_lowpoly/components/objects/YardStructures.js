import * as THREE from 'three';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';
import { chainLinkTexture } from '../environments/EnvironmentKit.js';

const galv = () => mat(0x9aa3a8, { roughness: 0.45, metalness: 0.5 });
let meshMat = null;
function chainMat() {
  if (!meshMat) {
    meshMat = new THREE.MeshStandardMaterial({ map: chainLinkTexture(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4, color: 0xd9dfe2 });
  }
  return meshMat;
}

/** Chain-link mesh panel along X from x=-L/2..L/2, bottom at y=0. */
function chainPanel(length, height) {
  const geo = new THREE.PlaneGeometry(length, height);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * length) / 0.1, (uv.getY(i) * height) / 0.1);
  const m = new THREE.Mesh(geo, chainMat());
  m.position.y = height / 2;
  m.castShadow = true;
  return m;
}

/** Chain-link fence along X (posts every ~2.5 m, top rail). */
export function createChainLinkFence({ length = 10, height = 2.4 } = {}) {
  const g = new THREE.Group();
  g.name = 'fence';
  g.add(chainPanel(length, height));
  const n = Math.max(1, Math.round(length / 2.5));
  const pieces = [];
  for (let i = 0; i <= n; i++) pieces.push([-length / 2 + (length / n) * i, height / 2, 0.03, 0.06, height + 0.05, 0.06]);
  pieces.push([0, height, 0.03, length, 0.04, 0.04]);
  g.add(instancedBoxes(pieces, galv(), { name: 'fencePosts' }));
  return g;
}

/** Concertina razor wire along X as one InstancedMesh of coils. */
export function createRazorWire({ length = 10, radius = 0.22 } = {}) {
  const geo = new THREE.TorusGeometry(radius, 0.007, 3, 12);
  const count = Math.ceil(length / 0.11);
  const im = new THREE.InstancedMesh(geo, mat(0xc4cbcf, { roughness: 0.3, metalness: 0.8 }), count);
  im.name = 'razorWire';
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < count; i++) {
    e.set(0, Math.PI / 2 + (i % 2 ? 0.35 : -0.35), (i % 3) * 0.4);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(-length / 2 + i * 0.11, 0, 0), q, new THREE.Vector3(1, 1, 1));
    im.setMatrixAt(i, m);
  }
  im.castShadow = true;
  return im;
}

/** Guard watchtower. Returns { group, floorY, spot }. */
export function createWatchtower({ height = 5, size = 2.4 } = {}) {
  const g = new THREE.Group();
  g.name = 'watchtower';
  const concrete = mat(0xb9bdbc, { roughness: 0.9 });
  const s = size / 2;
  const legs = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) legs.push([x * (s - 0.15), height / 2, z * (s - 0.15), 0.25, height, 0.25]);
  for (const y of [height * 0.35, height * 0.7]) {
    legs.push([0, y, s - 0.15, size - 0.3, 0.12, 0.12], [0, y, -(s - 0.15), size - 0.3, 0.12, 0.12]);
    legs.push([s - 0.15, y, 0, 0.12, 0.12, size - 0.3], [-(s - 0.15), y, 0, 0.12, 0.12, size - 0.3]);
  }
  g.add(instancedBoxes(legs, concrete, { name: 'towerLegs' }));
  const floor = mesh(new THREE.BoxGeometry(size + 0.3, 0.2, size + 0.3), concrete);
  floor.position.y = height;
  g.add(floor);
  // cabin: low wall, glass band, roof
  const wallH = 1.0;
  const cabin = mat(0xd8dad7, { roughness: 0.85 });
  const walls = [];
  for (const sgn of [-1, 1]) {
    walls.push([0, height + 0.1 + wallH / 2, sgn * s, size, wallH, 0.12], [sgn * s, height + 0.1 + wallH / 2, 0, 0.12, wallH, size]);
  }
  g.add(instancedBoxes(walls, cabin, { name: 'cabinWalls' }));
  // open window band (corner posts only) so the guard is visible and can look out
  const posts = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) posts.push([x * s, height + 0.1 + wallH + 0.45, z * s, 0.1, 0.9, 0.1]);
  g.add(instancedBoxes(posts, galv(), { name: 'cabinPosts' }));
  const roof = mesh(new THREE.BoxGeometry(size + 0.7, 0.18, size + 0.7), mat(0x5d6468, { roughness: 0.7 }));
  roof.position.y = height + 0.1 + wallH + 0.95;
  g.add(roof);
  // ladder
  const rungs = [];
  for (let y = 0.3; y < height; y += 0.3) rungs.push([0, y, s + 0.25, 0.45, 0.03, 0.03]);
  rungs.push([-0.22, height / 2, s + 0.25, 0.04, height, 0.04], [0.22, height / 2, s + 0.25, 0.04, height, 0.04]);
  g.add(instancedBoxes(rungs, galv(), { name: 'ladder' }));
  // searchlight on the roof edge
  const lamp = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 8), mat(0x2a2d30));
  lamp.rotation.x = Math.PI / 2 + 0.5;
  lamp.position.set(0, height + 2.2, s + 0.2);
  const lens = mesh(new THREE.CircleGeometry(0.15, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4d8, emissiveIntensity: 2 }), { cast: false });
  lens.position.set(0, height + 2.13, s + 0.36);
  lens.rotation.x = 0.5 - Math.PI / 2 + Math.PI;
  g.add(lamp, lens);
  return { group: g, floorY: height + 0.1 };
}

/** Floodlight pole with two lamp heads; returns { group, setOn(bool) }. */
export function createFloodlightPole({ height = 7 } = {}) {
  const g = new THREE.Group();
  g.name = 'floodlight';
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.12, height, 6), galv());
  pole.position.y = height / 2;
  const bar = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), galv());
  bar.position.y = height;
  g.add(pole, bar);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2d6, emissiveIntensity: 0.2 });
  for (const x of [-0.45, 0.45]) {
    const head = mesh(new THREE.BoxGeometry(0.4, 0.3, 0.15), mat(0x2b2e31));
    head.position.set(x, height + 0.15, 0.1);
    head.rotation.x = 0.6;
    const lens = mesh(new THREE.PlaneGeometry(0.34, 0.24), lensMat, { cast: false });
    lens.position.set(0, 0, 0.076);
    head.add(lens);
    g.add(head);
  }
  return { group: g, setOn: (on) => (lensMat.emissiveIntensity = on ? 3 : 0.2) };
}

/** Basketball hoop facing +Z (ring at x=0). */
export function createBasketballHoop() {
  const g = new THREE.Group();
  g.name = 'hoop';
  const pole = mesh(new THREE.CylinderGeometry(0.08, 0.09, 3.2, 6), mat(0x2c4f7a, { roughness: 0.5, metalness: 0.3 }));
  pole.position.set(0, 1.6, -1.0);
  const arm = mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), mat(0x2c4f7a, { roughness: 0.5, metalness: 0.3 }));
  arm.position.set(0, 3.15, -0.55);
  const board = mesh(new THREE.BoxGeometry(1.8, 1.05, 0.04), mat(0xf2f2ef, { roughness: 0.5 }));
  board.position.set(0, 3.4, -0.1);
  const red = mat(0xc9372c);
  const square = [[0, 3.13, 0.59, 0.035], [0, 3.55, 0.59, 0.035], [-0.28, 3.34, 0.035, 0.45], [0.28, 3.34, 0.035, 0.45]];
  for (const [x, y, w, h] of square) {
    const s = mesh(new THREE.BoxGeometry(w, h, 0.005), red, { cast: false });
    s.position.set(x, y, -0.077);
    g.add(s);
  }
  const ring = mesh(new THREE.TorusGeometry(0.23, 0.012, 4, 14), mat(0xe0601c, { roughness: 0.4, metalness: 0.4 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 3.05, 0.17);
  const net = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.15, 0.4, 10, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.7 }),
  );
  net.position.set(0, 2.85, 0.17);
  g.add(pole, arm, board, ring, net);
  return g;
}

export function createPullUpBars({ width = 2.4 } = {}) {
  const pieces = [];
  for (const x of [-width / 2, 0, width / 2]) pieces.push([x, 1.2, 0, 0.08, 2.4, 0.08]);
  pieces.push([-width / 4, 2.25, 0, width / 2, 0.04, 0.04], [width / 4, 2.0, 0, width / 2, 0.04, 0.04]);
  const g = new THREE.Group();
  g.name = 'pullUpBars';
  g.add(instancedBoxes(pieces, galv(), { name: 'bars' }));
  return g;
}

/** Weight bench with rack and barbell (bench length along Z). */
export function createWeightBench() {
  const g = new THREE.Group();
  g.name = 'weightBench';
  const pad = mesh(new THREE.BoxGeometry(0.3, 0.08, 1.2), mat(0x1f2124, { roughness: 0.8 }));
  pad.position.set(0, 0.45, 0);
  const frame = [[0, 0.2, -0.45, 0.06, 0.4, 0.06], [0, 0.2, 0.45, 0.06, 0.4, 0.06], [0, 0.02, 0, 0.06, 0.04, 1.2]];
  for (const x of [-0.45, 0.45]) frame.push([x, 0.6, -0.55, 0.06, 1.2, 0.06]);
  g.add(pad, instancedBoxes(frame, galv(), { name: 'benchFrame' }));
  const bar = mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.8, 6), mat(0xb9c0c4, { roughness: 0.3, metalness: 0.8 }));
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.1, -0.55);
  g.add(bar);
  for (const x of [-0.7, -0.62, 0.62, 0.7]) {
    const plate = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 10), mat(0x1a1b1d, { roughness: 0.6 }));
    plate.rotation.z = Math.PI / 2;
    plate.position.set(x, 1.1, -0.55);
    g.add(plate);
  }
  return g;
}

/** Sliding chain-link gate along X; setOpen slides toward -X. */
export function createFenceGate({ width = 4, height = 3 } = {}) {
  const group = new THREE.Group();
  group.name = 'fenceGate';
  const leaf = new THREE.Group();
  leaf.add(chainPanel(width, height));
  leaf.add(instancedBoxes([
    [-width / 2, height / 2, 0.03, 0.08, height, 0.08], [width / 2, height / 2, 0.03, 0.08, height, 0.08],
    [0, height, 0.03, width, 0.08, 0.08], [0, 0.05, 0.03, width, 0.08, 0.08], [0, height / 2, 0.03, width, 0.06, 0.06],
  ], galv(), { name: 'gateFrame' }));
  group.add(leaf);
  const state = { open: 0 };
  return {
    group,
    get open() {
      return state.open;
    },
    setOpen(t) {
      state.open = Math.min(1, Math.max(0, t));
      leaf.position.x = -state.open * width * 0.95;
    },
  };
}
