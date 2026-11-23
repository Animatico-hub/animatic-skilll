import * as THREE from 'three';
import { mulberry32 } from './geometry.js';

/** Shared palette so every character and environment speaks the same visual language. */
export const PALETTE = {
  jumpsuit: 0xe8641e,
  jumpsuitFaded: 0xd0702f,
  navy: 0x1f2b3d,
  navyDark: 0x172131,
  undershirt: 0xefebe3,
  leather: 0x1b1a1c,
  steel: 0x8e959b,
  sneaker: 0xe9e8e3,
  sole: 0xcfcdc6,
  boot: 0x2a2421,
  eyeWhite: 0xe9e3d8,
  ink: 0x24323d,
};

const cache = new Map();

/** Cached flat-shaded standard material. */
export function mat(color, o = {}) {
  const c = new THREE.Color(color);
  const key = ['std', c.getHexString(), o.roughness ?? 0.82, o.metalness ?? 0, o.flat ?? true, o.emissive ?? 0, o.emissiveIntensity ?? 1, !!o.vertexColors].join('|');
  if (!cache.has(key)) {
    cache.set(
      key,
      new THREE.MeshStandardMaterial({
        color: c,
        vertexColors: !!o.vertexColors,
        roughness: o.roughness ?? 0.82,
        metalness: o.metalness ?? 0,
        flatShading: o.flat ?? true,
        emissive: new THREE.Color(o.emissive ?? 0),
        emissiveIntensity: o.emissiveIntensity ?? 1,
      }),
    );
  }
  return cache.get(key);
}

export const shade = (color, f) => new THREE.Color(color).multiplyScalar(f).getHex();
export const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
const css = (hex) => '#' + new THREE.Color(hex).getHexString();

/** Cached canvas texture. opts.repeat = true makes it tile (world-scaled UVs). */
export function canvasTexture(key, w, h, draw, opts = {}) {
  const k = 'tex|' + key;
  if (cache.has(k)) return cache.get(k);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  if (opts.repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  cache.set(k, tex);
  return tex;
}

/** Cached material using a texture, tinted by color (walls, floors, posters). */
export function texturedMat(texture, color = 0xffffff, o = {}) {
  const key = ['texmat', texture.uuid, new THREE.Color(color).getHexString(), o.roughness ?? 0.9, !!o.transparent, o.emissive ?? 0, !!o.decal, o.metalness ?? 0].join('|');
  if (!cache.has(key)) {
    cache.set(
      key,
      new THREE.MeshStandardMaterial({
        map: texture,
        color,
        roughness: o.roughness ?? 0.9,
        metalness: o.metalness ?? 0,
        transparent: !!o.transparent,
        alphaTest: o.transparent ? 0.3 : 0,
        emissive: new THREE.Color(o.emissive ?? 0),
        emissiveMap: o.emissive ? texture : null,
        polygonOffset: !!o.decal,
        polygonOffsetFactor: o.decal ? -2 : 0,
      }),
    );
  }
  return cache.get(key);
}

/** Printed stencil text (chest numbers, back print). Transparent background. */
export function textDecalMaterial(text, { color = 0x1a1410, aspect = 2, weight = 900 } = {}) {
  const key = ['decal', text, color, aspect].join('|');
  if (cache.has(key)) return cache.get(key);
  const h = 128;
  const w = Math.round(h * aspect);
  const map = canvasTexture(key, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css(color);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = h * 0.86;
    ctx.font = `${weight} ${size}px Impact, "Arial Black", "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > w * 0.94 && size > 10) {
      size -= 2;
      ctx.font = `${weight} ${size}px Impact, "Arial Black", "Segoe UI", sans-serif`;
    }
    ctx.fillText(text, w / 2, h / 2 + 4);
  });
  const m = new THREE.MeshStandardMaterial({
    map,
    transparent: true,
    alphaTest: 0.35,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  cache.set(key, m);
  return m;
}

/**
 * Skin with a tattoo layer. UV: u wraps around the limb, v runs along it (0 = bottom).
 * variant: 'forearm' | 'upper' | 'neck'
 */
export function tattooMaterial(skin, ink, variant = 'forearm', seed = 7) {
  const key = ['tattoo', skin, ink, variant, seed].join('|');
  if (cache.has(key)) return cache.get(key);
  const map = canvasTexture(key, 256, 256, (ctx, w, h) => {
    const rnd = mulberry32(seed);
    ctx.fillStyle = css(skin);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = css(ink);
    ctx.strokeStyle = css(ink);
    const vy = (v) => h * (1 - v); // canvas y from v
    const band = (v, t) => ctx.fillRect(0, vy(v) - t / 2, w, t);
    const spikes = (v, height, count, up = true) => {
      const step = w / count;
      ctx.beginPath();
      for (let i = 0; i < count; i++) {
        const x = i * step;
        ctx.moveTo(x, vy(v));
        ctx.lineTo(x + step / 2, vy(v) + (up ? -height : height) * (0.7 + rnd() * 0.5));
        ctx.lineTo(x + step, vy(v));
      }
      ctx.fill();
    };
    const diamond = (x, v, r) => {
      ctx.beginPath();
      ctx.moveTo(x, vy(v) - r);
      ctx.lineTo(x + r * 0.6, vy(v));
      ctx.lineTo(x, vy(v) + r);
      ctx.lineTo(x - r * 0.6, vy(v));
      ctx.closePath();
      ctx.fill();
    };
    if (variant === 'forearm') {
      band(0.12, 10);
      spikes(0.15, 34, 7, true);
      for (let i = 0; i < 4; i++) diamond(w * (0.125 + i * 0.25), 0.5, 26);
      ctx.lineWidth = 7;
      for (let i = 0; i < 4; i++) {
        const x = w * (0.25 + i * 0.25);
        ctx.beginPath();
        ctx.moveTo(x - 20, vy(0.7));
        ctx.lineTo(x, vy(0.62));
        ctx.lineTo(x + 20, vy(0.7));
        ctx.stroke();
      }
      spikes(0.86, 26, 9, false);
      band(0.88, 8);
    } else if (variant === 'upper') {
      band(0.08, 9);
      spikes(0.1, 40, 6, true);
      for (let i = 0; i < 3; i++) diamond(w * (0.17 + i * 0.33), 0.42, 20);
    } else {
      spikes(0.18, 46, 8, true);
      band(0.16, 8);
    }
  });
  const m = new THREE.MeshStandardMaterial({ map, roughness: 0.8, flatShading: true });
  cache.set(key, m);
  return m;
}

/** Releases every cached material and texture (call when tearing down a composition). */
export function disposeMaterials() {
  for (const v of cache.values()) v.dispose?.();
  cache.clear();
}
