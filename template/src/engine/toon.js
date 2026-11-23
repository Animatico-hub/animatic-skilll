// Cel shading (MeshToonMaterial + gradiente de 3 tons) e contorno por casco invertido
// com espessura constante em pixels.
import * as THREE from 'three';

export const OUTLINE_COLOR = 0x1b1a22;
export const RESOLUTION = new THREE.Vector2(1080, 1920);
const OUTLINE_SCALE = 1.8; // multiplicador global (px em 1080p)

let gradient;
const gradientMap = () => {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([165, 215, 255]), 3, 1, THREE.RedFormat);
    gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
    gradient.needsUpdate = true;
  }
  return gradient;
};

const toonCache = new Map();
export const toon = (color, opts = {}) => {
  const key = `${color}|${opts.side ?? 0}`;
  if (!toonCache.has(key)) {
    toonCache.set(key, new THREE.MeshToonMaterial({color, gradientMap: gradientMap(), side: opts.side ?? THREE.FrontSide}));
  }
  return toonCache.get(key);
};

const flatCache = new Map();
export const flat = (color) => {
  if (!flatCache.has(color)) flatCache.set(color, new THREE.MeshBasicMaterial({color}));
  return flatCache.get(color);
};

const outlineCache = new Map();
const outlineMaterial = (px) => {
  if (!outlineCache.has(px)) {
    outlineCache.set(px, new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        thickness: {value: px},
        resolution: {value: RESOLUTION},
        color: {value: new THREE.Color(OUTLINE_COLOR)},
      },
      vertexShader: /* glsl */ `
        attribute vec3 smoothNormal;
        uniform float thickness;
        uniform vec2 resolution;
        void main() {
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * smoothNormal);
          vec2 d = (projectionMatrix * vec4(n, 0.0)).xy;
          float len = length(d);
          if (len > 1e-5) clip.xy += (d / len) * thickness * 2.0 / resolution * clip.w;
          gl_Position = clip;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 color;
        void main() { gl_FragColor = vec4(color, 1.0); }`,
    }));
  }
  return outlineCache.get(px);
};

// Normais suavizadas por posição: fecha as frestas do contorno em quinas de caixas.
const withSmoothNormals = (geo) => {
  if (geo.attributes.smoothNormal) return geo;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const acc = new Map();
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const v = acc.get(k) || [0, 0, 0];
    v[0] += nor.getX(i); v[1] += nor.getY(i); v[2] += nor.getZ(i);
    acc.set(k, v);
  }
  const out = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = acc.get(key(i));
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    out[i * 3] = v[0] / l; out[i * 3 + 1] = v[1] / l; out[i * 3 + 2] = v[2] / l;
  }
  geo.setAttribute('smoothNormal', new THREE.BufferAttribute(out, 3));
  return geo;
};

/**
 * Malha cel-shaded com contorno.
 * opts: outline (px, 0 = sem contorno), material (substitui o toon), side
 */
export const mesh = (geo, color, opts = {}) => {
  const m = new THREE.Mesh(geo, opts.material ?? toon(color, opts));
  const px = (opts.outline ?? 3) * OUTLINE_SCALE;
  if (px > 0) m.add(new THREE.Mesh(withSmoothNormals(geo), outlineMaterial(px)));
  return m;
};

// Geometrias compartilhadas
const geoCache = new Map();
const cached = (key, make) => {
  if (!geoCache.has(key)) geoCache.set(key, make());
  return geoCache.get(key);
};
export const G = {
  sphere: (r, w = 28, h = 20) => cached(`s${r}|${w}|${h}`, () => new THREE.SphereGeometry(r, w, h)),
  capsule: (r, len) => cached(`c${r}|${len}`, () => new THREE.CapsuleGeometry(r, len, 8, 20)),
  box: (x, y, z) => cached(`b${x}|${y}|${z}`, () => new THREE.BoxGeometry(x, y, z)),
  cyl: (rt, rb, h, s = 24) => cached(`y${rt}|${rb}|${h}|${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)),
};
