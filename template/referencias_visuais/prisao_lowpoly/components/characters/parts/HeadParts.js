import * as THREE from 'three';
import { loft, mesh, deformBox, frontZ, backZ, sideX, profileAt, jitter, faceColorize } from '../../../lib/geometry.js';
import { mat, mix, shade, PALETTE } from '../../../lib/materials.js';
import { SEG } from './BodyParts.js';

/** Angular head profile (y = 0 at the top of the neck). */
export function headRings(f) {
  const W = f.width;
  const J = f.jaw;
  return [
    { y: 0.0, w: 0.05, df: 0.06, db: 0.05, n: 2, z: 0.0 },
    { y: 0.026, w: 0.064 * J, df: 0.1, db: 0.06, n: 2.6, z: 0.004 },
    { y: 0.07, w: 0.078 * J, df: 0.097, db: 0.078, n: 2.8, z: 0.004 },
    { y: 0.092, w: (0.082 * J + 0.086 * W) / 2, df: 0.0975, db: 0.086, n: 2.8, z: 0.004 },
    { y: 0.115, w: 0.086 * W, df: 0.098, db: 0.094, n: 2.8, z: 0.004 },
    { y: 0.16, w: 0.09 * W, df: 0.098, db: 0.1, n: 2.8, z: 0.004 },
    { y: 0.205, w: 0.085 * W, df: 0.086, db: 0.096, n: 2.6, z: 0.002 },
    { y: 0.24, w: 0.062 * W, df: 0.06, db: 0.07, n: 2.4 },
    { y: 0.258, w: 0.025 * W, df: 0.022, db: 0.03, n: 2, capOffset: 0.002 },
  ];
}

function noseGeometry(len, depth, width) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, -width, -len, 0, width, -len, 0, 0, -len * 0.85, depth], 3),
  );
  geo.setIndex([0, 1, 3, 0, 3, 2, 1, 2, 3, 0, 2, 1]);
  geo.computeVertexNormals();
  return geo;
}

const HAIR_STYLES = {
  crew: { t: 0.007, top: 0.007, lift: 0.036, drop: 0.06, y0: 0.168, sideburns: true },
  buzz: { t: 0.0035, top: 0.0015, lift: 0.036, drop: 0.075, y0: 0.165, sideburns: false },
  side: { t: 0.01, top: 0.012, lift: 0.032, drop: 0.06, y0: 0.17, shiftX: 0.006, sideburns: true },
  messy: { t: 0.011, top: 0.012, lift: 0.016, drop: 0.1, y0: 0.172, jitter: 0.01, fringe: true, sideburns: true },
  // longer hair: back = how far below the head base it falls (m), sides = side panel length, bangs = fringe slab
  long: { t: 0.012, top: 0.013, lift: 0.03, drop: 0.055, y0: 0.17, back: 0.13, sides: 0.2, sideburns: false },
  bob: { t: 0.012, top: 0.011, lift: 0.02, drop: 0.05, y0: 0.17, back: -0.02, sides: 0.15, bangs: true, sideburns: false },
};

function buildHair(style, color, rings, seed, grey = null) {
  const cfg = HAIR_STYLES[style];
  const g = new THREE.Group();
  if (!cfg) return g;
  const m = mat(color, { roughness: 0.95 });
  const sideM = grey ? mat(grey, { roughness: 0.95 }) : m;
  const ys = [cfg.y0, 0.205, 0.235, 0.253];
  const liftK = [1, 0.35, 0, 0];
  const dropK = [1, 0.3, 0, 0];
  const r = ys.map((y, i) => {
    const p = profileAt(rings, y);
    const t = cfg.t + cfg.top * (i / (ys.length - 1));
    // front/back radii sampled where the lifted/dropped vertices actually sit
    const pf = profileAt(rings, y + cfg.lift * liftK[i]);
    const pb = profileAt(rings, y - cfg.drop * dropK[i]);
    return {
      y: y + (i ? t * 0.5 : 0),
      w: p.w + t,
      df: pf.df + t,
      db: Math.max(pb.db, p.db * 0.96) + t,
      n: p.n,
      z: p.z,
      x: (cfg.shiftX ?? 0) * (i / 3),
      lift: cfg.lift * liftK[i],
      drop: cfg.drop * dropK[i],
    };
  });
  const tt = cfg.t + cfg.top;
  r.push({ y: 0.259 + tt * 0.55, w: 0.034 + tt, df: 0.03 + tt, db: 0.038 + tt, n: 2, x: cfg.shiftX ?? 0, capOffset: 0.002 });
  const geo = loft(r, { segments: SEG, capStart: false });
  if (cfg.jitter) jitter(geo, cfg.jitter, seed, (v) => (v.y > 0.12 ? 1 : 0.4));
  g.add(mesh(geo, m));

  if (cfg.sideburns) {
    for (const s of [1, -1]) {
      const sb = mesh(new THREE.BoxGeometry(0.005, 0.03, 0.014), sideM);
      sb.position.set(s * (sideX(rings, 0.145) + 0.001), 0.15, 0.028);
      g.add(sb);
      if (grey) {
        // greying temples: a lighter patch above the sideburn
        const tp = mesh(new THREE.BoxGeometry(0.003, 0.02, 0.026), sideM);
        tp.position.set(s * (sideX(rings, 0.172) + cfg.t - 0.0005), 0.174, 0.006);
        g.add(tp);
      }
    }
  }
  if (cfg.back !== undefined) {
    // hair falling behind the head (down to the nape or the shoulders), slightly flared at the ends
    const top = 0.2;
    const bottom = -cfg.back;
    const len = top - bottom;
    const w = sideX(rings, 0.13) * 2 + cfg.t * 2 + 0.01;
    const back = mesh(deformBox(w, len, 0.04, [3, 4, 1], (v) => {
      const u = (top - (v.y + top - len / 2)) / len; // 0 at the top, 1 at the ends
      v.x *= 1 + 0.12 * u;
      v.z -= 0.012 * u;
    }), m);
    back.position.set(0, (top + bottom) / 2, backZ(rings, 0.13) + 0.006);
    g.add(back);
  }
  if (cfg.sides) {
    for (const s of [1, -1]) {
      const sp = mesh(deformBox(0.02, cfg.sides, 0.085, [1, 3, 2], (v) => { if (v.y < 0) v.z -= 0.012; }), m);
      sp.position.set(s * (sideX(rings, 0.13) + cfg.t + 0.004), 0.205 - cfg.sides / 2, -0.012);
      sp.rotation.z = s * 0.05;
      g.add(sp);
    }
  }
  if (cfg.bangs) {
    const bg = mesh(deformBox(0.15, 0.04, 0.022, [3, 1, 1], (v) => { v.z -= Math.abs(v.x) * 0.25; }), m);
    bg.position.set(0, 0.208, frontZ(rings, 0.205) + 0.004);
    bg.rotation.x = -0.12;
    g.add(bg);
  }
  if (cfg.fringe) {
    for (const [x, len, rot] of [[-0.03, 0.05, 0.25], [0.004, 0.044, -0.1], [0.036, 0.052, -0.3]]) {
      const fr = mesh(deformBox(0.032, len, 0.012, [1, 1, 1], (v) => { if (v.y < 0) v.x *= 0.25; }), m);
      fr.position.set(x, 0.19, frontZ(rings, 0.19) + 0.012);
      fr.rotation.set(-0.25, 0, rot);
      g.add(fr);
    }
  }
  return g;
}

function buildBeard(type, color, skin, rings) {
  const g = new THREE.Group();
  if (!type) return g;
  if (type === 'goatee' || type === 'full') {
    const m = mat(color, { roughness: 0.95 });
    const chin = mesh(deformBox(0.034, 0.042, 0.016, [1, 1, 1], (v) => { if (v.y < 0) v.x *= 0.6; }), m);
    chin.position.set(0, 0.04, frontZ(rings, 0.04) - 0.002);
    const stache = mesh(new THREE.BoxGeometry(0.05, 0.009, 0.01), m);
    stache.position.set(0, 0.084, frontZ(rings, 0.084) + 0.004);
    g.add(chin, stache);
  }
  if (type === 'mustache') {
    // thick "cop" chevron: wide, heavier in the middle, ends drooping toward the mouth corners
    const m = mat(color, { roughness: 0.95 });
    const stache = mesh(
      deformBox(0.062, 0.014, 0.012, [6, 1, 1], (v) => {
        const nx = Math.abs(v.x) / 0.031;
        v.y -= nx * nx * 0.007;
        if (v.y < 0) v.y += nx * 0.003;
        v.z -= nx * nx * 0.009;
      }),
      m,
    );
    stache.position.set(0, 0.0855, frontZ(rings, 0.0855) + 0.003);
    g.add(stache);
  }
  return g;
}

/** Age lines: forehead creases, nasolabial folds and crow's feet (thin darker strips). */
function buildAgeLines(f, skin, rings) {
  const g = new THREE.Group();
  const age = f.age ?? 0;
  if (age <= 0) return g;
  const m = mat(shade(skin, 0.74 - age * 0.06));
  const fz = (y) => frontZ(rings, y);
  for (const [y, w] of [[0.19, 0.06], [0.2, 0.048]]) {
    const ln = mesh(deformBox(w * f.width, 0.0022, 0.002, [4, 1, 1], (v) => { v.z -= (v.x / 0.05) ** 2 * 0.012; v.y += Math.abs(v.x) * 0.06; }), m, { cast: false });
    ln.position.set(0, y, fz(y) + 0.0012);
    g.add(ln);
  }
  for (const s of [1, -1]) {
    const fold = mesh(new THREE.BoxGeometry(0.0024, 0.03, 0.002), m, { cast: false });
    fold.position.set(s * 0.028, 0.087, fz(0.087) - 0.003);
    fold.rotation.set(0, s * 0.45, s * -0.32);
    const crow = mesh(new THREE.BoxGeometry(0.009, 0.0018, 0.002), m, { cast: false });
    crow.position.set(s * 0.056 * f.width, 0.131, fz(0.131) - 0.012);
    crow.rotation.set(0, s * 0.7, s * 0.25);
    g.add(fold, crow);
  }
  return g;
}

/** Skull mesh; stubble is painted onto the lower-face triangles instead of a separate shell. */
function buildSkull(def, rings) {
  const geo = loft(rings, { segments: SEG });
  if (def.beard !== 'stubble' && def.beard !== 'full') return mesh(geo, mat(def.skin), { name: 'skull' });
  const stubble = mix(def.skin, def.hair.color, 0.32);
  const colored = faceColorize(geo, (c) => (c.y < 0.092 && c.z > -0.03 ? stubble : def.skin));
  geo.dispose();
  return mesh(colored, mat(0xffffff, { vertexColors: true }), { name: 'skull' });
}

function buildEye(side, f, mats) {
  const root = new THREE.Group();
  root.name = side > 0 ? 'eyeL' : 'eyeR';
  const white = mesh(new THREE.BoxGeometry(0.027, 0.0135, 0.004), mats.eyeWhite, { cast: false });
  const pupil = new THREE.Group();
  pupil.position.z = 0.003;
  const iris = mesh(new THREE.BoxGeometry(0.0115, 0.0118, 0.003), mats.iris, { cast: false });
  const dot = mesh(new THREE.BoxGeometry(0.0052, 0.0058, 0.002), mats.pupil, { cast: false });
  dot.position.z = 0.0018;
  pupil.add(iris, dot);
  const lid = mesh(new THREE.BoxGeometry(0.03, 0.016, 0.005), mats.lid, { cast: false });
  lid.position.z = 0.0045;
  const lowLid = mesh(new THREE.BoxGeometry(0.029, 0.006, 0.004), mats.lid, { cast: false });
  lowLid.position.set(0, -0.0095, 0.0035);
  root.add(white, pupil, lid, lowLid);
  if (f.eyeBags) {
    const bag = mesh(new THREE.BoxGeometry(0.026, 0.006, 0.003), mats.bags, { cast: false });
    bag.position.set(0, -0.0145, 0.002);
    root.add(bag);
  }
  return { root, pupil, lid, lowLid };
}

/**
 * Builds the head under the given joint and returns the face rig.
 * Face rig values are what FacialExpressions / LipSync will drive later.
 */
export function buildHead(def, joint) {
  const f = def.face;
  const rings = headRings(f);
  const skin = def.skin;
  const skinMat = mat(skin);
  const fz = (y) => frontZ(rings, y);
  const hairColor = def.hair.color;

  joint.add(buildSkull(def, rings));

  if (f.browRidge > 0) {
    const ridge = mesh(
      deformBox(0.084 * f.width, 0.018, 0.012 + 0.01 * f.browRidge, [2, 1, 1], (v) => {
        v.z -= Math.abs(v.x) * 0.3;
      }),
      skinMat,
    );
    ridge.position.set(0, 0.161, fz(0.161) - 0.004);
    joint.add(ridge);
  }

  // ears
  for (const s of [1, -1]) {
    const ear = mesh(
      deformBox(0.014, 0.05, 0.032, [1, 1, 1], (v) => {
        if (v.y < 0) v.z *= 0.6;
      }),
      skinMat,
    );
    ear.position.set(s * (sideX(rings, 0.125) + 0.004), 0.123, -0.006);
    ear.rotation.y = s * -0.25;
    joint.add(ear);
  }

  // nose
  const nose = mesh(noseGeometry(0.056, 0.032 * f.nose, 0.018 * (0.85 + 0.15 * f.width)), skinMat);
  nose.position.set(0, 0.15, fz(0.15) - 0.002);
  joint.add(nose);

  // eyes
  const eyeMats = {
    eyeWhite: mat(PALETTE.eyeWhite, { roughness: 0.5 }),
    iris: mat(f.iris, { roughness: 0.4 }),
    pupil: mat(0x0d0b0a, { roughness: 0.3 }),
    lid: skinMat,
    bags: mat(mix(shade(skin, 0.78), 0x5a4060, 0.15)),
  };
  const eyeY = 0.136;
  const eyes = [1, -1].map((s) => {
    const e = buildEye(s, f, eyeMats);
    e.root.position.set(s * 0.033 * f.width, eyeY, fz(eyeY) + 0.001);
    joint.add(e.root);
    return e;
  });

  // brows
  const browMat = mat(shade(hairColor, 0.85), { roughness: 0.95 });
  const browY = 0.16;
  const brows = [1, -1].map((s) => {
    const b = new THREE.Group();
    b.position.set(s * 0.034 * f.width, browY, fz(browY) + 0.004 + 0.006 * f.browRidge);
    b.rotation.y = s * 0.15;
    const bar = mesh(
      deformBox(0.041, 0.0085 * f.browThick, 0.01, [2, 1, 1], (v) => {
        if (v.x * s > 0) v.y *= 0.7; // thinner toward the outer end
      }),
      browMat,
      { cast: false },
    );
    b.add(bar);
    joint.add(b);
    return b;
  });

  // mouth: upper lip, lower lip and a dark interior revealed when the jaw opens
  const lipMat = mat(mix(shade(skin, 0.8), 0x8e3b36, 0.12));
  const mouth = new THREE.Group();
  mouth.name = 'mouth';
  mouth.position.set(0, 0.072, fz(0.072) + 0.0012);
  const mw = f.mouthWidth;
  // lips have extra width segments so the corners can bend (smile / frown) at runtime
  const lip = (w, h) => {
    const geo = new THREE.BoxGeometry(w, h, 0.004, 6, 1, 1);
    geo.userData.base = geo.attributes.position.array.slice();
    geo.userData.halfW = w / 2;
    return geo;
  };
  const upper = mesh(lip(0.042 * mw, 0.0055), lipMat, { cast: false });
  upper.position.y = 0.0028;
  const lower = mesh(lip(0.036 * mw, 0.007), lipMat, { cast: false });
  lower.position.y = -0.0042;
  const inner = mesh(new THREE.BoxGeometry(0.036 * mw, 0.016, 0.003), mat(0x2e1514), { cast: false });
  inner.position.set(0, -0.002, -0.002);
  inner.scale.y = 0.05;
  const teeth = mesh(new THREE.BoxGeometry(0.03 * mw, 0.0045, 0.002), mat(0xe9e4d6, { roughness: 0.4 }), { cast: false });
  teeth.position.set(0, 0.0004, -0.0005);
  teeth.visible = false;
  mouth.add(upper, lower, inner, teeth);
  joint.add(mouth);

  joint.add(buildHair(def.hair.style, hairColor, rings, def.seed, def.hair.grey ?? null));
  joint.add(buildBeard(def.beard, def.hair.beardColor ?? hairColor, skin, rings));
  joint.add(buildAgeLines(f, skin, rings));

  // first-person camera anchor between the eyes
  const eyeAnchor = new THREE.Object3D();
  eyeAnchor.name = 'eyeAnchor';
  eyeAnchor.position.set(0, eyeY, fz(eyeY) - 0.02);
  joint.add(eyeAnchor);

  return {
    rings,
    eyes,
    brows,
    mouth: { group: mouth, upper, lower, inner, teeth },
    eyeAnchor,
    rest: {
      browY: brows.map((b) => b.position.y),
      upperY: upper.position.y,
      lowerY: lower.position.y,
    },
  };
}
