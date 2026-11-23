import * as THREE from 'three';
import { loft, mesh, deformBox, smoothstep } from '../../../lib/geometry.js';

/** Base skeleton measurements in metres (before the per-character height scale). */
export const BASE = {
  ankleH: 0.075,
  shin: 0.415,
  thigh: 0.415,
  hipX: 0.088,
  thighDrop: 0.04,
  spineUp: 0.08,
  chestUp: 0.14,
  neckUp: 0.325,
  neck: 0.075,
  shoulderX: 0.185,
  shoulderY: 0.255,
  upperArm: 0.295,
  foreArm: 0.255,
};

export const SEG = 8;

// ---------- torso (three lofts so the spine can bend) ----------

export function pelvisRings(b) {
  const W = b.waist;
  const H = W * (b.hips ?? 1); // hips: wider pelvis (female bodies); 1 = unchanged
  return [
    { y: -0.135, w: 0.1 * H, df: 0.072 * W, db: 0.08 * H, n: 2.4 },
    { y: -0.07, w: 0.163 * H, df: 0.098 * W, db: 0.112 * H, n: 2.8 },
    { y: 0.0, w: 0.168 * H, df: 0.103 * W, db: 0.108 * H, n: 2.8 },
    { y: 0.09, w: 0.16 * W, df: 0.1 * W + b.belly, db: 0.098 * W, n: 2.8 },
  ];
}

export function abdomenRings(b) {
  const W = b.waist;
  const C = b.chest;
  return [
    { y: -0.01, w: 0.16 * W, df: 0.1 * W + b.belly, db: 0.098 * W, n: 2.8 },
    { y: 0.07, w: 0.156 * (W + C) * 0.5, df: 0.1 * W + b.belly * 1.3, db: 0.095 * W, n: 2.8 },
    { y: 0.15, w: 0.172 * C, df: 0.11 * C + b.belly * 0.5, db: 0.1 * C, n: 2.9 },
  ];
}

export function chestRings(b) {
  const C = b.chest;
  const S = b.shoulders;
  const N = b.neck;
  const U = b.bust ?? 0; // extra forward volume of the upper chest (female bodies); 0 = unchanged
  return [
    { y: -0.01, w: 0.172 * C, df: 0.11 * C, db: 0.1 * C, n: 3 },
    { y: 0.1, w: 0.19 * C, df: 0.128 * C + U, db: 0.11 * C, n: 3 },
    { y: 0.19, w: 0.205 * S, df: 0.125 * C + U * 0.55, db: 0.115 * C, n: 3 },
    { y: 0.255, w: 0.21 * S, df: 0.108 * C, db: 0.104 * C, n: 3 },
    { y: 0.305, w: 0.15 * S, df: 0.084 * C, db: 0.086 * C, n: 2.6 },
    { y: 0.335, w: 0.066 * N, df: 0.06 * N, db: 0.062 * N, n: 2 },
  ];
}

export function neckRings(b, len) {
  const N = b.neck;
  return [
    { y: -0.02, w: 0.062 * N, d: 0.058 * N },
    { y: len * 0.5, w: 0.054 * N, df: 0.05 * N, db: 0.056 * N },
    { y: len + 0.035, w: 0.05 * N, d: 0.05 * N },
  ];
}

// ---------- limbs (rings ascending from the far end up to the joint) ----------

export function upperArmRings(b, L, k = 0) {
  const A = b.arms;
  return [
    { y: -L, w: 0.042 * A + k, d: 0.041 * A + k },
    { y: -L * 0.55, w: 0.052 * A + k, df: 0.056 * A + k, db: 0.05 * A + k },
    { y: -L * 0.2, w: 0.058 * A + k, d: 0.056 * A + k },
    { y: 0, w: 0.062 * A + k, d: 0.06 * A + k },
    { y: 0.045, w: 0.046 * A + k, d: 0.048 * A + k },
  ];
}

export function forearmRings(b, L, k = 0) {
  const A = b.arms ** 0.85;
  return [
    { y: -L, w: 0.024 * A + k, d: 0.031 * A + k },
    { y: -L * 0.6, w: 0.036 * A + k, d: 0.04 * A + k },
    { y: -L * 0.22, w: 0.045 * A + k, d: 0.046 * A + k },
    { y: 0.02, w: 0.043 * A + k, d: 0.044 * A + k },
  ];
}

export function thighRings(b, L, k = 0) {
  const G = b.legs;
  return [
    { y: -L, w: 0.05 * G + k, df: 0.052 * G + k, db: 0.05 * G + k },
    { y: -L * 0.7, w: 0.06 * G + k, d: 0.063 * G + k },
    { y: -L * 0.3, w: 0.075 * G + k, d: 0.078 * G + k },
    { y: 0, w: 0.088 * G + k, d: 0.092 * G + k },
    { y: 0.06, w: 0.084 * G + k, d: 0.088 * G + k },
  ];
}

/** hem: half width of the trouser opening (null = bare leg taper). */
export function shinRings(b, L, k = 0, hem = null) {
  const G = b.legs ** 0.9;
  const end = hem ?? 0.036 * G;
  return [
    { y: -L, w: end + (hem ? 0 : k), d: end * 1.05 + (hem ? 0 : k) },
    { y: -L * 0.65, w: 0.044 * G + k, df: 0.044 * G + k, db: 0.048 * G + k },
    { y: -L * 0.3, w: 0.05 * G + k, df: 0.05 * G + k, db: 0.062 * G + k },
    { y: 0.03, w: 0.05 * G + k, d: 0.052 * G + k },
  ];
}

export const limb = (rings, material) => mesh(loft(rings, { segments: SEG }), material);

// ---------- hands ----------

/**
 * Simplified hand hanging from the wrist joint. Palm faces the body (-side X), thumb forward.
 * side: +1 left (+X), -1 right.
 */
export function buildHand(side, scale, material) {
  const s = side;
  const A = scale;
  const g = new THREE.Group();
  g.name = 'hand';
  g.add(
    mesh(
      loft(
        [
          { y: -0.092 * A, w: 0.014 * A, df: 0.041 * A, db: 0.037 * A, n: 3 },
          { y: -0.045 * A, w: 0.018 * A, df: 0.042 * A, db: 0.036 * A, n: 3 },
          { y: 0.008, w: 0.017 * A, df: 0.03 * A, db: 0.028 * A, n: 2.5 },
        ],
        { segments: SEG },
      ),
      material,
    ),
  );
  const fingers = [
    [0.028, 0.074],
    [0.01, 0.081],
    [-0.008, 0.077],
    [-0.025, 0.064],
  ];
  const fingerGroups = [];
  for (const [z, len] of fingers) {
    const base = new THREE.Group();
    base.position.set(-s * 0.002, -0.088 * A, z * A);
    base.rotation.z = -s * 0.18;
    const l1 = len * 0.55 * A;
    const l2 = len * 0.45 * A;
    const p1 = mesh(new THREE.BoxGeometry(0.015 * A, l1, 0.0165 * A), material);
    p1.position.y = -l1 / 2;
    const tip = new THREE.Group();
    tip.position.y = -l1;
    tip.rotation.z = -s * 0.32;
    const p2 = mesh(new THREE.BoxGeometry(0.0135 * A, l2, 0.015 * A), material);
    p2.position.y = -l2 / 2;
    tip.add(p2);
    base.add(p1, tip);
    g.add(base);
    fingerGroups.push({ base, tip });
  }
  const thumb = new THREE.Group();
  thumb.position.set(-s * 0.006, -0.028 * A, 0.034 * A);
  thumb.rotation.set(-0.55, 0, -s * 0.35);
  const t1 = mesh(new THREE.BoxGeometry(0.018 * A, 0.056 * A, 0.018 * A), material);
  t1.position.y = -0.028 * A;
  thumb.add(t1);
  g.add(thumb);
  g.userData.fingers = fingerGroups;
  g.userData.thumb = thumb;
  return g;
}

// ---------- footwear ----------

/** Sneaker or boot attached to the ankle joint (toe toward +Z). */
export function buildShoe(cfg, scale, mats) {
  const g = new THREE.Group();
  g.name = 'shoe';
  const H = BASE.ankleH;
  const boot = cfg.type === 'boot';
  const len = boot ? 0.275 : 0.27;
  const zMin = -0.072;
  const soleH = boot ? 0.03 : 0.022;
  const upperH = boot ? 0.08 : 0.068;
  const taper = (v, t, k) => {
    v.x *= 1 - k * smoothstep(0.72, 1, t) - 0.12 * (1 - smoothstep(0, 0.14, t));
  };
  const upper = deformBox(boot ? 0.104 : 0.098, upperH, len, [2, 2, 6], (v) => {
    const t = (v.z + len / 2) / len;
    if (v.y > 0) {
      v.y -= (boot ? 0.03 : 0.038) * smoothstep(0.3, 1, t);
      if (t < 0.4) v.y += 0.012 * (1 - t / 0.4);
    }
    taper(v, t, boot ? 0.2 : 0.3);
  });
  upper.translate(0, -H + soleH + upperH / 2, zMin + len / 2);
  g.add(mesh(upper, mats.upper));

  const sole = deformBox(boot ? 0.112 : 0.104, soleH, len + 0.01, [1, 1, 6], (v) => {
    const t = (v.z + (len + 0.01) / 2) / (len + 0.01);
    taper(v, t, boot ? 0.18 : 0.28);
    if (t > 0.86 && v.y < 0) v.y += 0.008 * smoothstep(0.86, 1, t);
  });
  sole.translate(0, -H + soleH / 2, zMin + len / 2);
  g.add(mesh(sole, mats.sole));

  // laces / tongue strips across the instep
  const topAt = (t) => -H + soleH + upperH - (boot ? 0.03 : 0.038) * smoothstep(0.3, 1, t);
  for (let i = 0; i < (boot ? 4 : 3); i++) {
    const t = 0.36 + i * 0.09;
    const z = zMin + len * t;
    const slope = (topAt(t + 0.02) - topAt(t - 0.02)) / (0.04 * len);
    const lace = mesh(new THREE.BoxGeometry(0.05, 0.006, 0.011), mats.lace, { receive: false });
    lace.position.set(0, topAt(t) + 0.002, z);
    lace.rotation.x = Math.atan(-slope);
    g.add(lace);
  }

  if (boot) {
    const shaft = loft(
      [
        { y: -0.035, w: 0.056, df: 0.062, db: 0.058 },
        { y: 0.06, w: 0.054, d: 0.056 },
        { y: 0.115, w: 0.056, d: 0.058 },
      ],
      { segments: SEG },
    );
    g.add(mesh(shaft, mats.upper));
    const rim = loft(
      [
        { y: 0.1, w: 0.06, d: 0.062 },
        { y: 0.122, w: 0.06, d: 0.062 },
      ],
      { segments: SEG },
    );
    g.add(mesh(rim, mats.sole));
  }
  g.scale.setScalar(scale);
  return g;
}
