import * as THREE from 'three';
import { mesh, mulberry32 } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';

// ---------- CCTV feeds (procedural sketches, redrawn with a live overlay) ----------

const FEED_W = 256;
const FEED_H = 160;
const sketches = new Map();

function sketch(kind) {
  if (sketches.has(kind)) return sketches.get(kind);
  const c = document.createElement('canvas');
  c.width = FEED_W;
  c.height = FEED_H;
  const ctx = c.getContext('2d');
  const w = FEED_W;
  const h = FEED_H;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#5c6862');
  g.addColorStop(1, '#2c3430');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const line = (pts, color = '#9fb0a6', width = 2) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  };
  const fill = (pts, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.fill();
  };
  const person = (x, y, s) => {
    ctx.fillStyle = '#1d2320';
    ctx.fillRect(x - 5 * s, y - 30 * s, 10 * s, 22 * s);
    ctx.beginPath();
    ctx.arc(x, y - 35 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - 5 * s, y - 8 * s, 4 * s, 8 * s);
    ctx.fillRect(x + 1 * s, y - 8 * s, 4 * s, 8 * s);
  };
  const vp = [w * 0.55, h * 0.42];
  if (kind === 'corridor' || kind === 'gate') {
    fill([[0, h], [w, h], vp], '#3d4842');
    line([[0, 0], vp, [w, 0]]);
    line([[0, h], vp, [w, h]]);
    for (let i = 0; i < 6; i++) {
      const t = i / 6;
      const x = t * vp[0];
      line([[x, t * vp[1]], [x, h - t * (h - vp[1])]], '#141816', 3);
    }
    for (let i = 1; i < 4; i++) fill([[vp[0] - 40 / i, vp[1] - 60 / i], [vp[0] + 40 / i, vp[1] - 60 / i], [vp[0] + 30 / i, vp[1] - 55 / i], [vp[0] - 30 / i, vp[1] - 55 / i]], '#e7efe9');
    if (kind === 'gate') for (let x = 20; x < w; x += 14) line([[x, 0], [x, h]], '#121513', 5);
    else person(vp[0] + 25, h * 0.8, 0.9);
  } else if (kind === 'cell') {
    fill([[0, h * 0.75], [w, h * 0.7], [w, h], [0, h]], '#46514b');
    ctx.fillStyle = '#7d8d84';
    ctx.fillRect(20, 70, 90, 12);
    ctx.fillRect(20, 110, 90, 12);
    person(170, 140, 1.1);
    for (let x = 6; x < w; x += 16) line([[x, 0], [x, h]], '#101311', 6);
    line([[0, 40], [w, 40]], '#101311', 6);
  } else if (kind === 'yard') {
    fill([[0, h * 0.45], [w, h * 0.45], [w, h], [0, h]], '#59655e');
    for (let x = 0; x < w; x += 10) line([[x, h * 0.2], [x + 10, h * 0.45]], '#7f8d85', 1);
    for (let x = 10; x < w; x += 10) line([[x, h * 0.2], [x - 10, h * 0.45]], '#7f8d85', 1);
    line([[0, h * 0.2], [w, h * 0.2]], '#a5b4ab', 2);
    line([[190, 60], [190, 120]], '#cfd9d3', 3);
    ctx.strokeRect(178, 52, 24, 16);
    const rnd = mulberry32(3);
    for (let i = 0; i < 6; i++) person(30 + rnd() * 140, 110 + rnd() * 40, 0.55 + rnd() * 0.2);
  } else if (kind === 'cafeteria') {
    fill([[0, h * 0.35], [w, h * 0.35], [w, h], [0, h]], '#505b55');
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) {
      const y = 70 + r * 30;
      const s = 0.6 + r * 0.25;
      ctx.fillStyle = '#8c9a92';
      ctx.fillRect(20 + k * 80 * s * 0.9, y, 60 * s, 8 * s);
    }
    person(120, 120, 0.8);
    person(60, 150, 1);
  } else {
    // showers: tiles + heads
    ctx.strokeStyle = 'rgba(200,215,206,0.35)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 12) line([[x, 0], [x, h * 0.7]], 'rgba(200,215,206,0.35)', 1);
    for (let y = 0; y < h * 0.7; y += 12) line([[0, y], [w, y]], 'rgba(200,215,206,0.35)', 1);
    fill([[0, h * 0.7], [w, h * 0.7], [w, h], [0, h]], '#3b4540');
    for (let x = 40; x < w; x += 60) line([[x, 30], [x, 45], [x + 10, 50]], '#d6e0da', 3);
  }
  sketches.set(kind, c);
  return c;
}

function drawFeed(ctx, kind, index, time, glitch) {
  const w = FEED_W;
  const h = FEED_H;
  const rnd = mulberry32(Math.floor(time * 8) + index * 97);
  ctx.drawImage(sketch(kind), 0, 0);
  if (glitch) {
    for (let i = 0; i < 6; i++) {
      const y = rnd() * h;
      const bh = 4 + rnd() * 14;
      ctx.drawImage(ctx.canvas, 0, y, w, bh, (rnd() - 0.5) * 40, y, w, bh);
    }
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.3})`;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 1);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.font = 'bold 13px Consolas, monospace';
  ctx.fillStyle = '#e8f2ea';
  ctx.fillText(`CAM ${String(index + 1).padStart(2, '0')}  ${kind.toUpperCase()}`, 8, 17);
  const secs = 23 * 3600 + 41 * 60 + Math.floor(time);
  const hh = String(Math.floor(secs / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor(secs / 60) % 60).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  ctx.fillText(`${hh}:${mm}:${ss}`, w - 70, h - 8);
  if (Math.floor(time * 1.5) % 2 === 0) {
    ctx.fillStyle = '#e0332b';
    ctx.beginPath();
    ctx.arc(w - 40, 13, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8f2ea';
    ctx.fillText('REC', w - 32, 18);
  }
}

/**
 * Wall of CCTV monitors. Returns { group, update(time), glitch, setFeed(i, kind) }.
 * Feeds redraw 4x per second (deterministic in time, safe for frame-by-frame rendering).
 */
export function createMonitorWall({ cols = 3, rows = 2, feeds = ['corridor', 'cell', 'yard', 'cafeteria', 'gate', 'showers'] } = {}) {
  const group = new THREE.Group();
  group.name = 'monitorWall';
  const mw = 0.56;
  const mh = 0.38;
  const bezel = mat(0x15181b, { roughness: 0.5 });
  const screens = [];
  const bracket = mesh(new THREE.BoxGeometry(cols * (mw + 0.04) + 0.06, rows * (mh + 0.04) + 0.06, 0.03), mat(0x2c3135));
  bracket.position.set(0, 0, 0.015);
  group.add(bracket);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    const x = (c - (cols - 1) / 2) * (mw + 0.04);
    const y = ((rows - 1) / 2 - r) * (mh + 0.04);
    const b = mesh(new THREE.BoxGeometry(mw, mh, 0.06), bezel);
    b.position.set(x, y, 0.06);
    const canvas = document.createElement('canvas');
    canvas.width = FEED_W;
    canvas.height = FEED_H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(mw - 0.05, mh - 0.05),
      // unlit: a screen emits its image and should never catch room highlights
      new THREE.MeshBasicMaterial({ map: tex, color: 0xd8e0dc }),
    );
    scr.position.set(x, y, 0.091);
    group.add(b, scr);
    screens.push({ canvas, ctx: canvas.getContext('2d'), tex, kind: feeds[i % feeds.length], mesh: scr });
  }
  let lastTick = -1;
  const api = {
    group,
    screens,
    glitch: false,
    setFeed(i, kind) {
      screens[i].kind = kind;
      lastTick = -1;
    },
    update(time) {
      const tick = Math.floor(time * 4);
      if (tick === lastTick) return;
      lastTick = tick;
      screens.forEach((s, i) => {
        drawFeed(s.ctx, s.kind, i, time, api.glitch && (i + tick) % 2 === 0);
        s.tex.needsUpdate = true;
      });
    },
    dispose() {
      screens.forEach((s) => {
        s.tex.dispose();
        s.mesh.material.dispose();
      });
    },
  };
  api.update(0);
  return api;
}

/** Control console desk (length along X, operator at +Z). */
export function createConsoleDesk({ length = 2.4, depth = 0.75, height = 0.76 } = {}) {
  const g = new THREE.Group();
  g.name = 'consoleDesk';
  const body = mat(0x3b4247, { roughness: 0.5, metalness: 0.2 });
  const top = mesh(new THREE.BoxGeometry(length, 0.04, depth), mat(0x9aa3a8, { roughness: 0.4, metalness: 0.3 }));
  top.position.set(0, height, depth / 2);
  const front = mesh(new THREE.BoxGeometry(length, height - 0.1, 0.03), body);
  front.position.set(0, (height - 0.1) / 2 + 0.1, 0.12);
  const sides = [];
  for (const x of [-length / 2 + 0.02, length / 2 - 0.02]) sides.push([x, height / 2, depth / 2, 0.04, height, depth]);
  g.add(top, front, instancedBoxes(sides, body, { name: 'deskSides' }));
  // sloped button panel
  const panel = mesh(new THREE.BoxGeometry(length * 0.5, 0.03, 0.22), mat(0x262b2f, { roughness: 0.5 }));
  panel.position.set(-length * 0.15, height + 0.07, 0.16);
  panel.rotation.x = 0.5;
  g.add(panel);
  const colors = [0xe0332b, 0x2fbf4a, 0xf2b31b, 0x2f8fe0];
  for (let i = 0; i < 12; i++) {
    const c = colors[i % 4];
    const btn = mesh(new THREE.BoxGeometry(0.03, 0.012, 0.03), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i % 3 === 0 ? 1.2 : 0.25 }), { cast: false });
    btn.position.set(-length * 0.15 - length * 0.22 + (i % 6) * 0.09, height + 0.085 + Math.floor(i / 6) * 0.04, 0.2 - Math.floor(i / 6) * 0.07);
    btn.rotation.x = 0.5;
    g.add(btn);
  }
  // keyboard, phone, radio, mug, papers
  const kb = mesh(new THREE.BoxGeometry(0.42, 0.02, 0.14), mat(0x1c1f22));
  kb.position.set(length * 0.2, height + 0.03, depth * 0.55);
  const phone = mesh(new THREE.BoxGeometry(0.18, 0.06, 0.2), mat(0x2a2d30));
  phone.position.set(length * 0.42, height + 0.05, depth * 0.45);
  const radio = mesh(new THREE.BoxGeometry(0.06, 0.16, 0.04), mat(0x1a1c1e));
  radio.position.set(length * 0.33, height + 0.1, depth * 0.3);
  const antenna = mesh(new THREE.BoxGeometry(0.01, 0.1, 0.01), mat(0x111111));
  antenna.position.set(length * 0.33 + 0.02, height + 0.22, depth * 0.3);
  const mug = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.1, 8), mat(0xc7372b, { roughness: 0.6 }));
  mug.position.set(length * 0.05, height + 0.07, depth * 0.75);
  const papers = mesh(new THREE.BoxGeometry(0.22, 0.01, 0.3), mat(0xf0ede4));
  papers.position.set(-length * 0.38, height + 0.025, depth * 0.6);
  papers.rotation.y = 0.2;
  g.add(kb, phone, radio, antenna, mug, papers);
  return { group: g, height };
}

/** Wall key cabinet with hooks and keys (door open). */
export function createKeyCabinet({ width = 0.5, height = 0.6 } = {}) {
  const g = new THREE.Group();
  g.name = 'keyCabinet';
  const box = mat(0x6d767c, { roughness: 0.45, metalness: 0.4 });
  const back = mesh(new THREE.BoxGeometry(width, height, 0.02), mat(0x3c4247));
  back.position.z = 0.01;
  g.add(back);
  const frame = [];
  frame.push([0, height / 2, 0.06, width, 0.02, 0.12], [0, -height / 2, 0.06, width, 0.02, 0.12], [-width / 2, 0, 0.06, 0.02, height, 0.12], [width / 2, 0, 0.06, 0.02, height, 0.12]);
  g.add(instancedBoxes(frame, box, { name: 'cabinetFrame' }));
  const keys = [];
  const brass = mat(0xc9a64a, { roughness: 0.3, metalness: 0.8 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    if ((r * 6 + c) % 7 === 3) continue;
    const x = -width / 2 + 0.06 + c * ((width - 0.12) / 5);
    const y = height / 2 - 0.1 - r * 0.13;
    keys.push([x, y - 0.035, 0.03, 0.012, 0.05, 0.004]);
  }
  g.add(instancedBoxes(keys, brass, { cast: false, name: 'keys' }));
  const door = mesh(new THREE.BoxGeometry(width, height, 0.02), box);
  door.position.set(width + 0.02, 0, 0.1);
  door.rotation.y = -1.9;
  door.position.set(width / 2 + 0.02, 0, 0.12 + width / 2);
  g.add(door);
  return g;
}

export function createFilingCabinet({ drawers = 4, color = 0x7c868c } = {}) {
  const g = new THREE.Group();
  g.name = 'filingCabinet';
  const h = drawers * 0.33;
  const body = mesh(new THREE.BoxGeometry(0.45, h, 0.6), mat(color, { roughness: 0.45, metalness: 0.4 }));
  body.position.set(0, h / 2, 0.3);
  g.add(body);
  const pieces = [];
  for (let i = 0; i < drawers; i++) {
    const y = 0.33 * i + 0.165;
    pieces.push([0, y + 0.16, 0.602, 0.43, 0.008, 0.004], [0, y + 0.06, 0.615, 0.12, 0.02, 0.03]);
  }
  g.add(instancedBoxes(pieces, mat(0x3a4045), { cast: false, name: 'drawerDetail' }));
  return g;
}

/** Red alarm beacon; returns { group, light, update(time) } (light pulses only when on). */
export function createAlarmBeacon() {
  const g = new THREE.Group();
  g.name = 'alarmBeacon';
  const base = mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), mat(0x222528));
  base.position.z = 0.03;
  const domeMat = new THREE.MeshStandardMaterial({ color: 0x7a1410, emissive: 0xff2010, emissiveIntensity: 0.15, roughness: 0.3 });
  const dome = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 8), domeMat, { cast: false });
  dome.position.set(0, 0.08, 0.04);
  const light = new THREE.PointLight(0xff2a1a, 0, 6, 2);
  light.position.set(0, 0.1, 0.3);
  g.add(base, dome, light);
  const api = {
    group: g,
    light,
    on: false,
    update(t) {
      const p = api.on ? Math.max(0, Math.sin(t * 9)) : 0;
      light.intensity = p * 6;
      domeMat.emissiveIntensity = api.on ? 0.3 + p * 3 : 0.15;
    },
  };
  return api;
}
