// Microinformações visuais reutilizáveis: placas, papéis, post-its, relógio, crachá.
// Texto desenhado em CanvasTexture (mipmaps + anisotropia) e iluminado como o resto da cena.
import * as THREE from 'three';
import {mesh, toon, flat, G} from './toon.js';

const FONT = {
  sans: 'Arial, "Segoe UI", sans-serif',
  bold: '"Arial Black", Arial, sans-serif',
  hand: '"Segoe Print", "Comic Sans MS", cursive',
};

/** Textura de canvas. draw(ctx, w, h) desenha em pixels; pxPerM define a nitidez. */
export function canvasTexture(wM, hM, draw, pxPerM = 1400) {
  const k = Math.min(pxPerM, 1024 / Math.max(wM, hM));
  const c = document.createElement('canvas');
  c.width = Math.round(wM * k);
  c.height = Math.round(hM * k);
  const ctx = c.getContext('2d');
  draw(ctx, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Texto centralizado que encolhe para caber na largura. */
export function text(ctx, str, x, y, {size, font = 'sans', weight = 'bold', color = '#1b1a22', align = 'center', maxW}) {
  let s = size;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  do { ctx.font = `${weight} ${s}px ${FONT[font] ?? font}`; s -= 1; } while (maxW && ctx.measureText(str).width > maxW && s > 6);
  ctx.fillText(str, x, y);
}

const panelGeo = new Map();
const plane = (w, h) => {
  const k = `${w}|${h}`;
  if (!panelGeo.has(k)) panelGeo.set(k, new THREE.PlaneGeometry(w, h));
  return panelGeo.get(k);
};

/**
 * Painel com face desenhada: placa, papel, post-it, cartaz.
 * opts.depth > 0 cria um corpo fino com contorno (placas); 0 = papel colado (sem contorno, quase sem espessura).
 */
export function panel(wM, hM, draw, {depth = 0, body = 0xffffff, outline = 2, tilt = 0, name = 'painel'} = {}) {
  const g = new THREE.Group();
  g.userData.panel = name; // validação: texto precisa estar voltado para a câmera
  const face = new THREE.Mesh(plane(wM, hM), new THREE.MeshToonMaterial({
    map: canvasTexture(wM, hM, draw),
    gradientMap: toon(0xffffff).gradientMap,
  }));
  if (depth > 0) {
    const b = mesh(G.box(wM, hM, depth), body, {outline});
    b.position.z = depth / 2;
    face.position.z = depth + 0.001;
    g.add(b);
  } else {
    face.position.z = 0.002;
  }
  g.add(face);
  g.rotation.z = tilt;
  return g;
}

// ---------- modelos prontos ----------

/** Placa institucional: faixa colorida + texto principal + subtítulo opcional. */
export const sign = (wM, hM, {title, sub, bg = '#f4f1e8', fg = '#1b1a22', band, bandColor = '#2b5fa8'} = {}) =>
  panel(wM, hM, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    let top = 0;
    if (band) {
      top = h * 0.32;
      c.fillStyle = bandColor; c.fillRect(0, 0, w, top);
      text(c, band, w / 2, top / 2, {size: top * 0.62, color: '#fff', maxW: w * 0.9});
    }
    const rest = h - top;
    if (sub) {
      text(c, title, w / 2, top + rest * 0.4, {size: rest * 0.46, font: 'bold', color: fg, maxW: w * 0.9});
      text(c, sub, w / 2, top + rest * 0.78, {size: rest * 0.2, color: fg, maxW: w * 0.9});
    } else {
      text(c, title, w / 2, top + rest / 2, {size: rest * 0.55, font: 'bold', color: fg, maxW: w * 0.9});
    }
  }, {depth: 0.012, body: 0xd8d4c8, name: `placa ${title}`});

/** Folha impressa (A4 ou menor) com título em destaque e linhas curtas. */
export const paper = (wM, hM, {title, lines = [], accent = '#c0392b', tilt = 0} = {}) =>
  panel(wM, hM, (c, w, h) => {
    c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, w, h);
    c.fillStyle = accent; c.fillRect(0, 0, w, h * 0.2);
    text(c, title, w / 2, h * 0.1, {size: h * 0.13, font: 'bold', color: '#fff', maxW: w * 0.9});
    lines.forEach((l, i) => text(c, l.text ?? l, w / 2, h * (0.33 + i * 0.16), {
      size: h * (l.size ?? 0.085), weight: l.bold ? 'bold' : 'normal', color: l.color ?? '#222', maxW: w * 0.88,
    }));
  }, {tilt, name: `folha ${title}`});

/** Post-it manuscrito. */
export const postIt = (lines, {color = '#f6e27a', tilt = 0, size = 0.11} = {}) =>
  panel(size, size, (c, w, h) => {
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, 0, w, h * 0.12);
    lines.forEach((l, i) => text(c, l, w / 2, h * (0.38 + i * 0.24 - (lines.length - 1) * 0.08), {
      size: h * 0.2, font: 'hand', weight: 'normal', color: '#2a2a6a', maxW: w * 0.9,
    }));
  }, {tilt, name: `post-it ${lines[0]}`});

/** Relógio de parede com marcações, números e ponteiros; hora inicial [h, m, s] avança com t. */
export function wallClock({radius = 0.17, time = [7, 52, 10]} = {}) {
  const g = new THREE.Group();
  const rim = mesh(G.cyl(radius, radius, 0.045, 40), 0x3a3d46, {outline: 2.5});
  rim.rotation.x = Math.PI / 2;
  rim.position.z = 0.022;
  const faceTex = canvasTexture(radius * 2, radius * 2, (c, w) => {
    const r = w / 2;
    c.fillStyle = '#f7f5ef'; c.beginPath(); c.arc(r, r, r, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#222'; c.lineCap = 'round';
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2, big = i % 5 === 0;
      c.lineWidth = big ? r * 0.035 : r * 0.012;
      const r0 = r * (big ? 0.8 : 0.86), r1 = r * 0.92;
      c.beginPath(); c.moveTo(r + Math.sin(a) * r0, r - Math.cos(a) * r0); c.lineTo(r + Math.sin(a) * r1, r - Math.cos(a) * r1); c.stroke();
    }
    for (let n = 1; n <= 12; n++) {
      const a = (n / 12) * Math.PI * 2;
      text(c, String(n), r + Math.sin(a) * r * 0.64, r - Math.cos(a) * r * 0.64, {size: r * 0.19, color: '#222'});
    }
  }, 1600);
  const face = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.94, 48), new THREE.MeshToonMaterial({map: faceTex, gradientMap: toon(0xffffff).gradientMap}));
  face.position.z = 0.046;
  g.add(rim, face);
  const hand = (len, wid, color, z) => {
    const pivot = new THREE.Group();
    const m = new THREE.Mesh(G.box(wid, len, 0.004), flat(color));
    m.position.y = len * 0.4;
    pivot.add(m);
    pivot.position.z = z;
    g.add(pivot);
    return pivot;
  };
  const hh = hand(radius * 0.5, radius * 0.07, 0x1b1a22, 0.05);
  const mh = hand(radius * 0.78, radius * 0.05, 0x1b1a22, 0.053);
  const sh = hand(radius * 0.85, radius * 0.018, 0xc0392b, 0.056);
  const cap = new THREE.Mesh(G.cyl(radius * 0.05, radius * 0.05, 0.01, 16), flat(0x1b1a22));
  cap.rotation.x = Math.PI / 2; cap.position.z = 0.06;
  g.add(cap);
  const start = time[0] * 3600 + time[1] * 60 + time[2];
  return {
    group: g,
    update(t) {
      const s = start + t;
      sh.rotation.z = -((Math.floor(s) % 60) / 60) * Math.PI * 2; // ponteiro de segundos "tica"
      mh.rotation.z = -((s / 60) % 60) / 60 * Math.PI * 2;
      hh.rotation.z = -((s / 3600) % 12) / 12 * Math.PI * 2;
    },
  };
}

/** Crachá: faixa da empresa, foto e nome. */
export const badge = ({company = 'VELTRA', name, role, color = '#2b5fa8', w = 0.056, h = 0.086}) =>
  panel(w, h, (c, W, H) => {
    c.fillStyle = '#fbfaf5'; c.fillRect(0, 0, W, H);
    c.fillStyle = color; c.fillRect(0, 0, W, H * 0.22);
    text(c, company, W / 2, H * 0.11, {size: H * 0.13, font: 'bold', color: '#fff', maxW: W * 0.9});
    c.fillStyle = '#c9d3e0'; c.fillRect(W * 0.28, H * 0.28, W * 0.44, H * 0.3);
    c.fillStyle = '#7a8aa0'; c.beginPath(); c.arc(W / 2, H * 0.4, W * 0.1, 0, Math.PI * 2); c.fill();
    c.fillRect(W * 0.33, H * 0.5, W * 0.34, H * 0.08);
    text(c, name, W / 2, H * 0.7, {size: H * 0.14, font: 'bold', maxW: W * 0.9});
    if (role) text(c, role, W / 2, H * 0.86, {size: H * 0.09, color: '#555', maxW: W * 0.9});
  }, {depth: 0.003, body: 0xf0f0f0, outline: 1.5, name: `crachá ${name}`});
