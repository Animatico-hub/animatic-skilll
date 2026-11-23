import * as THREE from 'three';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';

/**
 * Wall-mounted steel desk. Back edge on the wall at z = 0, extends toward +Z.
 */
export function createWallDesk({ width = 0.9, depth = 0.45, height = 0.76, color = 0x9aa2a7 } = {}) {
  const group = new THREE.Group();
  group.name = 'wallDesk';
  const steel = mat(color, { roughness: 0.45, metalness: 0.4 });
  const topSlab = mesh(new THREE.BoxGeometry(width, 0.035, depth), steel);
  topSlab.position.set(0, height, depth / 2);
  const lip = mesh(new THREE.BoxGeometry(width, 0.06, 0.02), steel);
  lip.position.set(0, height - 0.03, depth - 0.01);
  group.add(topSlab, lip);
  // triangular brackets
  for (const x of [-width / 2 + 0.06, width / 2 - 0.06]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(depth * 0.8, 0);
    shape.lineTo(0, -0.3);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
    g.rotateY(-Math.PI / 2);
    const b = mesh(g, steel);
    b.position.set(x + 0.01, height - 0.017, 0);
    group.add(b);
  }
  return { group, surface: new THREE.Vector3(0, height + 0.018, depth / 2) };
}

/**
 * Bolted cafeteria table with attached benches (length along X).
 */
export function createTable({ length = 1.8, width = 0.75, height = 0.76, benches = true, color = 0x9aa2a7, topColor = 0xb8bfc3 } = {}) {
  const group = new THREE.Group();
  group.name = 'table';
  const steel = mat(color, { roughness: 0.45, metalness: 0.4 });
  const top = mesh(new THREE.BoxGeometry(length, 0.04, width), mat(topColor, { roughness: 0.35, metalness: 0.5 }));
  top.position.y = height;
  group.add(top);
  const pieces = [];
  for (const sx of [-1, 1]) {
    pieces.push([sx * (length / 2 - 0.25), height / 2, 0, 0.06, height, 0.06]);
    pieces.push([sx * (length / 2 - 0.25), 0.03, 0, 0.06, 0.06, benches ? width + 0.9 : width * 0.8]);
  }
  if (benches) {
    for (const sz of [-1, 1]) {
      for (const sx of [-1, 1]) pieces.push([sx * (length / 2 - 0.25), 0.22, sz * (width / 2 + 0.3), 0.05, 0.4, 0.05]);
      const bench = mesh(new THREE.BoxGeometry(length, 0.04, 0.3), mat(topColor, { roughness: 0.35, metalness: 0.5 }));
      bench.position.set(0, 0.45, sz * (width / 2 + 0.3));
      group.add(bench);
    }
  }
  group.add(instancedBoxes(pieces, steel, { name: 'tableFrame' }));
  return {
    group,
    surface: new THREE.Vector3(0, height + 0.02, 0),
    seats: benches ? [-1, 1].flatMap((sz) => [-0.5, 0, 0.5].map((x) => new THREE.Vector3(x * (length / 2), 0.47, sz * (width / 2 + 0.3)))) : [],
  };
}
