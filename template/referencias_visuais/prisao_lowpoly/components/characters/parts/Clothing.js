import * as THREE from 'three';
import { loft, mesh, profileAt, frontZ, backZ, surfaceStrip, deformBox } from '../../../lib/geometry.js';
import { mat, shade, textDecalMaterial } from '../../../lib/materials.js';
import { SEG } from './BodyParts.js';

/** Ring band wrapped around a loft between y0 and y1 (hems, cuffs, belts, collars). */
export function band(rings, y0, y1, extra, material) {
  const r = [y0, y1].map((y) => {
    const p = profileAt(rings, y);
    return { y, w: p.w + extra, df: p.df + extra, db: p.db + extra, n: p.n, x: p.x, z: p.z };
  });
  return mesh(loft(r, { segments: SEG }), material);
}

/** Loose shell over part of a limb (short sleeves, rolled cuffs). */
export function shell(rings, y0, y1, extra, material) {
  const ys = [y0, ...rings.map((r) => r.y).filter((y) => y > y0 && y < y1), y1];
  const r = ys.map((y) => {
    const p = profileAt(rings, y);
    return { y, w: p.w + extra, df: p.df + extra, db: p.db + extra, n: p.n, x: p.x, z: p.z };
  });
  return mesh(loft(r, { segments: SEG, capEnd: false }), material);
}

/** Open V collar with lapel flaps and an optional undershirt triangle. */
export function vCollar(chest, cloth, undershirt, depth = 0.22) {
  const g = new THREE.Group();
  const flapMat = mat(shade(cloth, 0.9));
  const topY = 0.322;
  // undershirt / skin triangle inside the V
  if (undershirt !== null) {
    const hw = (y) => 0.042 * Math.max(0.02, (y - depth) / (topY - depth));
    g.add(mesh(surfaceStrip(chest, depth, topY, hw, 0.0025), mat(undershirt), { cast: false }));
  }
  // lapel flaps
  const midY = (topY + depth) / 2 + 0.008;
  const slope = Math.atan2(frontZ(chest, depth) - frontZ(chest, topY), topY - depth);
  for (const s of [1, -1]) {
    const flap = mesh(
      deformBox(0.042, topY - depth + 0.03, 0.007, [1, 1, 1], (v) => {
        if (v.y < 0) v.x = v.x * 0.35 - s * 0.012;
      }),
      flapMat,
    );
    flap.position.set(s * 0.04, midY, frontZ(chest, midY) + 0.006);
    flap.rotation.set(-slope, 0, -s * 0.36);
    g.add(flap);
  }
  // collar band behind the neck
  g.add(band(chest, 0.3, 0.348, 0.012, flapMat));
  return g;
}

/** Shirt collar with pointed tips and placket buttons (guard uniform). */
export function shirtCollar(chest, abdomen, cloth, buttonColor) {
  const g = new THREE.Group();
  const dark = mat(shade(cloth, 0.82));
  g.add(band(chest, 0.31, 0.36, 0.012, dark));
  for (const s of [1, -1]) {
    const tip = mesh(
      deformBox(0.05, 0.05, 0.007, [1, 1, 1], (v) => {
        if (v.y < 0) v.x = v.x * 0.3 + s * 0.008;
      }),
      dark,
    );
    tip.position.set(s * 0.034, 0.31, frontZ(chest, 0.31) + 0.012);
    tip.rotation.set(-0.5, 0, s * 0.3);
    g.add(tip);
  }
  g.add(mesh(surfaceStrip(chest, -0.01, 0.3, 0.011, 0.002), dark, { cast: false }));
  const btn = mat(buttonColor, { roughness: 0.5 });
  for (const y of [0.04, 0.13, 0.22]) {
    const b = mesh(new THREE.BoxGeometry(0.008, 0.008, 0.004), btn, { cast: false });
    b.position.set(0, y, frontZ(chest, y) + 0.004);
    g.add(b);
  }
  return g;
}

export function zipper(rings, y0, y1, color) {
  return mesh(surfaceStrip(rings, y0, y1, 0.0045, 0.0025), mat(color, { roughness: 0.45, metalness: 0.3 }), { cast: false });
}

export function buttons(rings, ys, color) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.6 });
  for (const y of ys) {
    const b = mesh(new THREE.BoxGeometry(0.01, 0.01, 0.005), m, { cast: false });
    b.position.set(0, y, frontZ(rings, y) + 0.003);
    g.add(b);
  }
  return g;
}

/** Printed text on the front (x offset) or back of a torso loft. */
export function printDecal(rings, text, { y, x = 0, width = 0.09, height = 0.045, back = false, color } = {}) {
  const m = mesh(new THREE.PlaneGeometry(width, height), textDecalMaterial(text, { color, aspect: width / height }), {
    cast: false,
  });
  if (back) {
    m.position.set(x, y, backZ(rings, y) - 0.0025);
    m.rotation.y = Math.PI;
  } else {
    m.position.set(x, y, frontZ(rings, y) + 0.0025);
  }
  return m;
}

export function chestPocket(chest, x, color) {
  const g = new THREE.Group();
  const y = 0.15;
  const z = frontZ(chest, y);
  const p = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.006), mat(shade(color, 0.92)));
  p.position.set(x, y, z + 0.003);
  const flap = mesh(new THREE.BoxGeometry(0.074, 0.02, 0.009), mat(shade(color, 0.8)));
  flap.position.set(x, y + 0.035, z + 0.005);
  g.add(p, flap);
  return g;
}

export function badge(chest, x, y, color) {
  const g = new THREE.Group();
  const shield = mesh(
    deformBox(0.04, 0.046, 0.006, [2, 2, 1], (v) => {
      if (v.y < 0) v.x *= 1 - (-v.y / 0.023) * 0.6;
    }),
    mat(color, { roughness: 0.35, metalness: 0.6 }),
  );
  shield.position.set(x, y, frontZ(chest, y) + 0.007);
  const star = mesh(new THREE.BoxGeometry(0.014, 0.014, 0.004), mat(0xc8a54a, { roughness: 0.35, metalness: 0.7 }));
  star.position.set(x, y + 0.003, frontZ(chest, y) + 0.011);
  star.rotation.z = Math.PI / 4;
  g.add(shield, star);
  return g;
}

export function nameTag(chest, x, y) {
  const t = mesh(new THREE.BoxGeometry(0.06, 0.016, 0.004), mat(0x9aa1a6, { roughness: 0.4, metalness: 0.5 }), {
    cast: false,
  });
  t.position.set(x, y, frontZ(chest, y) + 0.004);
  return t;
}

/** Light stripe across the top of each shoulder (epaulettes). */
export function epaulettes(chest, color) {
  const g = new THREE.Group();
  const p0 = profileAt(chest, 0.255);
  const p1 = profileAt(chest, 0.305);
  const ang = Math.atan2(0.305 - 0.255, p0.w - p1.w);
  for (const s of [1, -1]) {
    const e = mesh(new THREE.BoxGeometry(0.075, 0.006, 0.05), mat(color, { roughness: 0.6 }));
    const x = (p0.w + p1.w) / 2;
    const y = (0.255 + 0.305) / 2;
    e.position.set(s * (x + Math.sin(ang) * 0.006), y + Math.cos(ang) * 0.006, 0);
    e.rotation.z = -s * ang;
    g.add(e);
  }
  return g;
}

/** Duty belt with buckle, pouches, radio and key ring (attached to the hips joint). */
export function dutyBelt(pelvis, cfg) {
  const g = new THREE.Group();
  const leather = mat(cfg.color, { roughness: 0.6 });
  const y0 = 0.035;
  const y1 = 0.085;
  g.add(band(pelvis, y0, y1, 0.014, leather));
  const yc = (y0 + y1) / 2;
  const fz = frontZ(pelvis, yc) + 0.014;
  const buckle = mesh(new THREE.BoxGeometry(0.05, 0.04, 0.008), mat(cfg.buckle, { roughness: 0.35, metalness: 0.7 }));
  buckle.position.set(0, yc, fz + 0.003);
  const buckleIn = mesh(new THREE.BoxGeometry(0.03, 0.022, 0.004), leather);
  buckleIn.position.set(0, yc, fz + 0.0065);
  g.add(buckle, buckleIn);
  const p = profileAt(pelvis, yc);
  const pouch = (x, z, w, h, d, rotY) => {
    const m = mesh(new THREE.BoxGeometry(w, h, d), leather);
    m.position.set(x, yc - h * 0.25, z);
    m.rotation.y = rotY;
    const lid = mesh(new THREE.BoxGeometry(w + 0.004, 0.012, d + 0.004), mat(shade(cfg.color, 1.3), { roughness: 0.6 }));
    lid.position.set(0, h / 2 - 0.004, 0);
    m.add(lid);
    g.add(m);
  };
  for (const s of [1, -1]) {
    pouch(s * (p.w * 0.62), p.df + 0.03, 0.045, 0.06, 0.03, s * -0.35);
  }
  // radio on the right hip, cuff case on the left back
  pouch(-(p.w + 0.03), -0.005, 0.034, 0.08, 0.05, 0);
  pouch(p.w * 0.6, -(p.db + 0.03), 0.05, 0.045, 0.03, -0.4);
  // key ring
  const ring = mesh(new THREE.TorusGeometry(0.014, 0.003, 4, 8), mat(cfg.buckle, { roughness: 0.3, metalness: 0.8 }));
  ring.position.set(p.w * 0.32, yc - 0.035, fz + 0.002);
  const key = mesh(new THREE.BoxGeometry(0.008, 0.04, 0.003), mat(0xb0b4b8, { roughness: 0.3, metalness: 0.8 }));
  key.position.set(p.w * 0.32 + 0.004, yc - 0.065, fz + 0.002);
  key.rotation.z = 0.15;
  g.add(ring, key);
  return g;
}
