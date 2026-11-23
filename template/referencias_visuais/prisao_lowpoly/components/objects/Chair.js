import * as THREE from 'three';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';

/** Bolted round steel stool (cells, cafeteria). */
export function createStool({ height = 0.46, color = 0x9aa2a7 } = {}) {
  const group = new THREE.Group();
  group.name = 'stool';
  const steel = mat(color, { roughness: 0.45, metalness: 0.4 });
  const seat = mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.04, 8), steel);
  seat.position.y = height;
  const post = mesh(new THREE.CylinderGeometry(0.03, 0.035, height - 0.02, 6), steel);
  post.position.y = (height - 0.02) / 2;
  const base = mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.02, 8), steel);
  base.position.y = 0.01;
  group.add(seat, post, base);
  return { group, seat: new THREE.Vector3(0, height + 0.02, 0) };
}

/** Simple office chair on a 5-star base (security office). Faces +Z. */
export function createChair({ color = 0x23272b, frame = 0x55595e } = {}) {
  const group = new THREE.Group();
  group.name = 'chair';
  const fabric = mat(color, { roughness: 0.9 });
  const metal = mat(frame, { roughness: 0.4, metalness: 0.5 });
  const seat = mesh(new THREE.BoxGeometry(0.46, 0.07, 0.44), fabric);
  seat.position.y = 0.48;
  const back = mesh(new THREE.BoxGeometry(0.44, 0.5, 0.06), fabric);
  back.position.set(0, 0.8, -0.22);
  back.rotation.x = -0.08;
  const post = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 6), metal);
  post.position.y = 0.27;
  group.add(seat, back, post);
  for (let i = 0; i < 5; i++) {
    const leg = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), metal);
    const a = (i / 5) * Math.PI * 2;
    leg.position.set(Math.sin(a) * 0.15, 0.06, Math.cos(a) * 0.15);
    leg.rotation.y = a;
    group.add(leg);
  }
  return { group, seat: new THREE.Vector3(0, 0.52, 0) };
}
