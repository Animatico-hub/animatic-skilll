import * as THREE from 'three';

const TAU = Math.PI * 2;

/** Normalised cross-section ring. */
function norm(r) {
  return {
    y: r.y,
    w: r.w,
    df: r.df ?? r.d ?? r.w,
    db: r.db ?? r.d ?? r.w,
    n: r.n ?? 2,
    x: r.x ?? 0,
    z: r.z ?? 0,
  };
}

/**
 * Lofts cross-section rings into a faceted tube (the base primitive of every body part).
 * ring: { y, w (half width X), d | df/db (half depth front/back Z), x, z offsets,
 *         n (superellipse exponent: 2 = ellipse, >2 = boxier),
 *         lift (raise the front of the ring), drop (lower the back of the ring), capOffset }
 * Angle 0 = +X, PI/2 = front (+Z). Default arcStart puts a flat face toward the front.
 */
export function loft(rings, opts = {}) {
  const segments = opts.segments ?? 8;
  const arcLength = opts.arcLength ?? TAU;
  const closed = arcLength >= TAU - 1e-6;
  const arcStart = opts.arcStart ?? (closed ? Math.PI / segments : 0);
  const capStart = closed && (opts.capStart ?? true);
  const capEnd = closed && (opts.capEnd ?? true);
  const flip = rings[rings.length - 1].y < rings[0].y;
  const cols = segments + 1;
  const nr = rings.length;
  const pos = [];
  const uv = [];
  const idx = [];

  rings.forEach((raw, ri) => {
    const r = norm(raw);
    const e = 2 / r.n;
    for (let i = 0; i < cols; i++) {
      const a = arcStart + (i / segments) * arcLength;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = Math.sign(c) * Math.abs(c) ** e * r.w;
      const z = Math.sign(s) * Math.abs(s) ** e * (s >= 0 ? r.df : r.db);
      let y = r.y;
      if (raw.lift && s > 0) y += raw.lift * s;
      if (raw.drop && s < 0) y += raw.drop * s;
      pos.push(x + r.x, y, z + r.z);
      uv.push(i / segments, ri / (nr - 1));
    }
  });

  for (let ri = 0; ri < nr - 1; ri++) {
    for (let i = 0; i < segments; i++) {
      const a = ri * cols + i;
      const b = a + 1;
      const d = a + cols;
      const c = d + 1;
      if (!flip) idx.push(a, d, b, b, d, c);
      else idx.push(a, b, d, b, c, d);
    }
  }

  const addCap = (ri, isBottom) => {
    const r = norm(rings[ri]);
    const center = pos.length / 3;
    pos.push(r.x, r.y + (rings[ri].capOffset ?? 0), r.z);
    uv.push(0.5, ri / (nr - 1));
    for (let i = 0; i < segments; i++) {
      const p = ri * cols + i;
      const q = p + 1;
      if (isBottom) idx.push(center, p, q);
      else idx.push(center, q, p);
    }
  };
  if (capStart) addCap(0, !flip);
  if (capEnd) addCap(nr - 1, flip);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Interpolated ring profile at height y. */
export function profileAt(rings, y) {
  const s = rings[0].y <= rings[rings.length - 1].y ? rings : [...rings].reverse();
  if (y <= s[0].y) return norm(s[0]);
  for (let i = 0; i < s.length - 1; i++) {
    const a = norm(s[i]);
    const b = norm(s[i + 1]);
    if (y <= b.y) {
      const t = (y - a.y) / (b.y - a.y || 1);
      const l = (k) => a[k] + (b[k] - a[k]) * t;
      return { y, w: l('w'), df: l('df'), db: l('db'), n: l('n'), x: l('x'), z: l('z') };
    }
  }
  return norm(s[s.length - 1]);
}

/** Z of the flat front face of a loft (default arcStart) at height y. */
export function frontZ(rings, y, segments = 8) {
  const p = profileAt(rings, y);
  return p.z + Math.sin(Math.PI / 2 - Math.PI / segments) ** (2 / p.n) * p.df;
}

export function backZ(rings, y, segments = 8) {
  const p = profileAt(rings, y);
  return p.z - Math.sin(Math.PI / 2 - Math.PI / segments) ** (2 / p.n) * p.db;
}

/** Half-width of the flat side face at height y. */
export function sideX(rings, y, segments = 8) {
  const p = profileAt(rings, y);
  return p.x + Math.cos(Math.PI / segments) ** (2 / p.n) * p.w;
}

/**
 * Thin strip that hugs the front (or back) face of a loft between y0 and y1.
 * Used for zippers, plackets, stripes. halfWidth may be a function of y (V shapes).
 */
export function surfaceStrip(rings, y0, y1, halfWidth, offset = 0.002, opts = {}) {
  const { x = 0, back = false, segments = 8 } = opts;
  const ys = [y0, ...rings.map((r) => r.y).filter((y) => y > y0 && y < y1), y1].sort((a, b) => a - b);
  const pos = [];
  const idx = [];
  ys.forEach((y, k) => {
    const z = back ? backZ(rings, y, segments) - offset : frontZ(rings, y, segments) + offset;
    const hw = typeof halfWidth === 'function' ? halfWidth(y) : halfWidth;
    pos.push(x - hw, y, z, x + hw, y, z);
    if (k > 0) {
      const a = (k - 1) * 2;
      if (!back) idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      else idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Per-face solid colours (classic low poly look): fn(centroid) returns a colour per triangle.
 * Returns a non-indexed geometry with a colour attribute (use a vertexColors material).
 */
export function faceColorize(geo, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const cen = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    cen.set(0, 0, 0);
    for (let k = 0; k < 3; k++) cen.add(v.fromBufferAttribute(p, i + k));
    cen.divideScalar(3);
    c.set(fn(cen));
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

/** Box with extra segments whose vertices are reshaped by fn(v: Vector3). */
export function deformBox(w, h, d, segs = [1, 1, 1], fn = null) {
  const geo = new THREE.BoxGeometry(w, h, d, ...segs);
  if (fn) {
    const p = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      fn(v, w, h, d);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
  }
  return geo;
}

export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

/** Deterministic position-based jitter (seam vertices move together). */
export function jitter(geo, amount, seed = 1, mask = () => 1) {
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const m = mask(v);
    if (!m) continue;
    const h = hash3(Math.round(v.x * 1e4), Math.round(v.y * 1e4), Math.round(v.z * 1e4), seed);
    p.setXYZ(i, v.x + (h[0] - 0.5) * amount * m, v.y + (h[1] - 0.3) * amount * m, v.z + (h[2] - 0.5) * amount * m);
  }
  geo.computeVertexNormals();
  return geo;
}

function hash3(x, y, z, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 1274126177);
  const out = [];
  for (let k = 0; k < 3; k++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    out.push((h >>> 0) / 4294967296);
  }
  return out;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Mesh with shadow defaults. */
export function mesh(geo, material, { cast = true, receive = true, name } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  if (name) m.name = name;
  return m;
}

/** Disposes geometries under an object (materials are shared and cached). */
export function disposeGeometries(obj) {
  obj.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
  });
}
