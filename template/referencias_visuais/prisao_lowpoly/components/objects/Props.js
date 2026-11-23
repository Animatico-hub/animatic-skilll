import * as THREE from 'three';
import { mesh, deformBox, mulberry32 } from '../../lib/geometry.js';
import { mat, canvasTexture, texturedMat, textDecalMaterial } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';

// Convention: wall props have their back on the wall plane z = 0 and face +Z.

const stainless = () => mat(0xb4bbbf, { roughness: 0.32, metalness: 0.55 });

/** Stainless steel toilet + sink combo unit. */
export function createToiletSink() {
  const g = new THREE.Group();
  g.name = 'toiletSink';
  const s = stainless();
  const dark = mat(0x3d4246, { roughness: 0.3, metalness: 0.5 });
  const body = mesh(new THREE.BoxGeometry(0.52, 0.98, 0.3), s);
  body.position.set(0, 0.49, 0.15);
  const basin = mesh(new THREE.BoxGeometry(0.34, 0.02, 0.18), dark);
  basin.position.set(0, 0.985, 0.17);
  const tap = mesh(new THREE.BoxGeometry(0.03, 0.05, 0.06), s);
  tap.position.set(0, 1.0, 0.06);
  const bowl = mesh(
    deformBox(0.42, 0.36, 0.42, [2, 1, 3], (v) => {
      const t = (v.z + 0.21) / 0.42;
      v.x *= 1 - 0.35 * t * t;
      if (v.y < 0) v.x *= 0.75;
    }),
    s,
  );
  bowl.position.set(0, 0.2, 0.48);
  const seat = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 8), dark);
  seat.scale.set(0.95, 1, 1.25);
  seat.position.set(0, 0.385, 0.46);
  g.add(body, basin, tap, bowl, seat);
  for (const x of [-0.18, 0.18]) {
    const b = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 8), dark);
    b.rotation.x = Math.PI / 2;
    b.position.set(x, 0.86, 0.305);
    g.add(b);
  }
  return g;
}

/** Polished steel mirror plate. */
export function createMirror({ width = 0.34, height = 0.44 } = {}) {
  const m = mesh(new THREE.BoxGeometry(width, height, 0.01), mat(0xc9d0d4, { roughness: 0.18, metalness: 0.45 }));
  m.position.z = 0.005;
  m.name = 'mirror';
  return m;
}

/** Wall shelf with personal items. */
export function createShelf({ width = 0.8, seed = 4, items = true } = {}) {
  const g = new THREE.Group();
  g.name = 'shelf';
  const steel = mat(0x9aa2a7, { roughness: 0.45, metalness: 0.4 });
  const board = mesh(new THREE.BoxGeometry(width, 0.025, 0.22), steel);
  board.position.set(0, 0, 0.11);
  g.add(board);
  if (!items) return g;
  const rnd = mulberry32(seed);
  const colors = [0x6b2f2a, 0x2e4a6b, 0x3d5a3a, 0x8a7a55, 0x4a3a5a];
  let x = -width / 2 + 0.06;
  for (let i = 0; i < 4; i++) {
    const h = 0.17 + rnd() * 0.06;
    const t = 0.025 + rnd() * 0.02;
    const b = mesh(new THREE.BoxGeometry(t, h, 0.15), mat(colors[i % colors.length], { roughness: 0.8 }));
    b.position.set(x, h / 2 + 0.0125, 0.1);
    if (i === 3) {
      b.rotation.z = -0.35;
      b.position.x += 0.03;
      b.position.y -= 0.01;
    }
    g.add(b);
    x += t + 0.004;
  }
  const cup = mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8), mat(0xd9d4c4, { roughness: 0.7 }));
  cup.position.set(width * 0.12, 0.058, 0.11);
  const brush = mesh(new THREE.BoxGeometry(0.008, 0.14, 0.008), mat(0x2d7fbf));
  brush.position.set(width * 0.12 + 0.01, 0.1, 0.11);
  brush.rotation.z = -0.25;
  const soap = mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), mat(0xe8e1c8));
  soap.position.set(width * 0.25, 0.028, 0.1);
  const roll = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), mat(0xf1f0ea, { roughness: 0.95 }));
  roll.position.set(width * 0.4, 0.063, 0.1);
  g.add(cup, brush, soap, roll);
  return g;
}

// ---------- paper on the walls ----------

function paperTexture(kind) {
  return canvasTexture('paper_' + kind, 256, 320, (ctx, w, h) => {
    ctx.fillStyle = kind === 'photo' ? '#f4f2ec' : '#f2eee2';
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (kind === 'house') {
      ctx.fillStyle = '#f2c21b';
      ctx.beginPath();
      ctx.arc(205, 55, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3c8b3a';
      ctx.lineWidth = 10;
      ctx.beginPath();
      for (let x = 10; x < w; x += 18) {
        ctx.moveTo(x, 300);
        ctx.lineTo(x + 6, 270);
      }
      ctx.stroke();
      ctx.fillStyle = '#d24b3a';
      ctx.beginPath();
      ctx.moveTo(40, 170);
      ctx.lineTo(115, 105);
      ctx.lineTo(190, 170);
      ctx.fill();
      ctx.strokeStyle = '#2b5fa8';
      ctx.lineWidth = 7;
      ctx.strokeRect(55, 170, 120, 100);
      ctx.strokeRect(100, 215, 30, 55);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 5;
      const stick = (x, s) => {
        ctx.beginPath();
        ctx.arc(x, 222 - 40 * s, 10 * s, 0, Math.PI * 2);
        ctx.moveTo(x, 232 - 40 * s);
        ctx.lineTo(x, 272 - 20 * s);
        ctx.moveTo(x - 14 * s, 245 - 30 * s);
        ctx.lineTo(x + 14 * s, 245 - 30 * s);
        ctx.moveTo(x, 272 - 20 * s);
        ctx.lineTo(x - 10, 292);
        ctx.moveTo(x, 272 - 20 * s);
        ctx.lineTo(x + 10, 292);
        ctx.stroke();
      };
      stick(214, 1.1);
      stick(236, 0.8);
      ctx.fillStyle = '#c0392b';
      ctx.font = 'bold 30px "Comic Sans MS", "Segoe Print", sans-serif';
      ctx.fillText('PAI ♥', 26, 60);
    } else if (kind === 'calendar') {
      ctx.fillStyle = '#b8322a';
      ctx.fillRect(0, 0, w, 52);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NOVEMBRO', w / 2, 37);
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillStyle = '#333';
      const cw = (w - 20) / 7;
      for (let d = 0; d < 30; d++) {
        const cx = 10 + (d % 7) * cw + cw / 2;
        const cy = 85 + Math.floor(d / 7) * 46;
        ctx.fillText(String(d + 1), cx, cy);
        if (d < 10) {
          ctx.strokeStyle = '#c0392b';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx - 13, cy - 20);
          ctx.lineTo(cx + 13, cy + 6);
          ctx.moveTo(cx + 13, cy - 20);
          ctx.lineTo(cx - 13, cy + 6);
          ctx.stroke();
        }
      }
    } else if (kind === 'photo') {
      const g = ctx.createLinearGradient(0, 20, 0, 240);
      g.addColorStop(0, '#7fb7d9');
      g.addColorStop(0.55, '#d6e7ef');
      g.addColorStop(0.56, '#3f7f9d');
      g.addColorStop(1, '#2b5d73');
      ctx.fillStyle = g;
      ctx.fillRect(18, 18, w - 36, 226);
      ctx.fillStyle = '#e1c48f';
      ctx.fillRect(18, 200, w - 36, 44);
      ctx.fillStyle = '#4a3326';
      ctx.fillRect(110, 150, 14, 55);
      ctx.fillRect(140, 158, 12, 47);
      ctx.fillStyle = '#444';
      ctx.font = 'italic 22px "Segoe Print", cursive';
      ctx.fillText('Saudades...', 40, 290);
    } else {
      ctx.fillStyle = '#222';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('REGRAS DA CELA', w / 2, 44);
      ctx.fillStyle = 'rgba(40,40,40,0.55)';
      for (let i = 0; i < 9; i++) ctx.fillRect(24, 74 + i * 26, w - 48 - (i % 3) * 30, 8);
    }
  });
}

/** Paper taped to a wall. kind: 'house' | 'calendar' | 'photo' | 'rules'. */
export function createWallPaper(kind = 'house', { width = 0.21, rotation = 0 } = {}) {
  const g = new THREE.Group();
  g.name = 'paper_' + kind;
  const h = width * 1.25;
  const sheet = mesh(new THREE.PlaneGeometry(width, h), texturedMat(paperTexture(kind), 0xffffff, { roughness: 0.95, decal: true }), {
    cast: false,
  });
  sheet.position.z = 0.003;
  g.add(sheet);
  const tape = mat(0xe9e1b8, { roughness: 0.6 });
  for (const [x, y] of [[-1, 1], [1, 1]]) {
    const t = mesh(new THREE.BoxGeometry(0.045, 0.016, 0.002), tape, { cast: false });
    t.position.set((x * width) / 2.4, (y * h) / 2, 0.005);
    t.rotation.z = x * 0.5;
    g.add(t);
  }
  g.rotation.z = rotation;
  return g;
}

/** Scratched tally marks (groups of five). */
export function createTallyMarks(count = 23, { width = 0.42, height = 0.2 } = {}) {
  const tex = canvasTexture('tally_' + count, 512, 256, (ctx, w, h) => {
    const rnd = mulberry32(count);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(55,55,60,0.9)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    let gx = 14;
    let gy = 20;
    for (let i = 0; i < count; i++) {
      const k = i % 5;
      if (k === 4) {
        ctx.beginPath();
        ctx.moveTo(gx - 10, gy + 80);
        ctx.lineTo(gx + 64, gy + 12);
        ctx.stroke();
        gx += 92;
        if (gx > w - 80) {
          gx = 14;
          gy += 115;
        }
        continue;
      }
      const x = gx + k * 16;
      ctx.beginPath();
      ctx.moveTo(x + (rnd() - 0.5) * 4, gy);
      ctx.lineTo(x + (rnd() - 0.5) * 6, gy + 90);
      ctx.stroke();
    }
  });
  const m = mesh(new THREE.PlaneGeometry(width, height), texturedMat(tex, 0xffffff, { transparent: true, decal: true }), { cast: false });
  m.position.z = 0.002;
  m.name = 'tallyMarks';
  return m;
}

// ---------- building services ----------

export function createVent({ width = 0.5, height = 0.3 } = {}) {
  const g = new THREE.Group();
  g.name = 'vent';
  const m = mat(0xb9c0c3, { roughness: 0.5, metalness: 0.3 });
  const back = mesh(new THREE.BoxGeometry(width, height, 0.02), mat(0x2a2d30));
  back.position.z = 0.01;
  g.add(back);
  const pieces = [];
  const n = 7;
  for (let i = 0; i < n; i++) pieces.push([0, -height / 2 + (height / n) * (i + 0.5), 0.025, width - 0.04, 0.012, 0.03]);
  pieces.push([0, height / 2 - 0.01, 0.03, width, 0.02, 0.03], [0, -height / 2 + 0.01, 0.03, width, 0.02, 0.03]);
  pieces.push([-width / 2 + 0.01, 0, 0.03, 0.02, height, 0.03], [width / 2 - 0.01, 0, 0.03, 0.02, height, 0.03]);
  g.add(instancedBoxes(pieces, m, { name: 'ventSlats', cast: false }));
  return g;
}

/** Wall fan; returns { group, blades } (spin blades in update). */
export function createWallFan() {
  const group = new THREE.Group();
  group.name = 'wallFan';
  const dark = mat(0x26292c, { roughness: 0.5, metalness: 0.3 });
  const plate = mesh(new THREE.BoxGeometry(0.1, 0.14, 0.02), dark);
  plate.position.z = 0.01;
  const arm = mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), dark);
  arm.position.set(0, 0, 0.12);
  const head = new THREE.Group();
  head.position.set(0, -0.04, 0.27);
  head.rotation.x = 0.35;
  const motor = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.12, 8), dark);
  motor.rotation.x = Math.PI / 2;
  head.add(motor);
  const cageMat = mat(0x3a3e42, { roughness: 0.5, metalness: 0.5 });
  for (const [r, z] of [[0.2, 0.09], [0.12, 0.1], [0.2, 0.0]]) {
    const ring = mesh(new THREE.TorusGeometry(r, 0.005, 4, 16), cageMat, { cast: false });
    ring.position.z = z;
    head.add(ring);
  }
  const blades = new THREE.Group();
  blades.position.z = 0.06;
  for (let i = 0; i < 3; i++) {
    const b = mesh(deformBox(0.08, 0.17, 0.008, [1, 1, 1], (v) => { if (v.y < 0) v.x *= 0.5; }), mat(0x4a4f54), { cast: false });
    b.position.y = 0.09;
    const holder = new THREE.Group();
    holder.rotation.z = (i / 3) * Math.PI * 2;
    b.rotation.y = 0.35;
    holder.add(b);
    blades.add(holder);
  }
  head.add(blades);
  group.add(plate, arm, head);
  return { group, blades };
}

export function createExtinguisher() {
  const g = new THREE.Group();
  g.name = 'extinguisher';
  const red = mat(0xc4231c, { roughness: 0.4, metalness: 0.2 });
  const body = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.45, 8), red);
  body.position.set(0, 0.225, 0.09);
  const top = mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.06, 8), mat(0x222222));
  top.position.set(0, 0.48, 0.09);
  const hose = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 6), mat(0x151515));
  hose.position.set(0.07, 0.3, 0.12);
  hose.rotation.z = 0.12;
  const bracket = mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), mat(0x2a2a2a));
  bracket.position.set(0, 0.35, 0.02);
  const sign = mesh(new THREE.BoxGeometry(0.2, 0.2, 0.01), red, { cast: false });
  sign.position.set(0, 0.72, 0.005);
  g.add(body, top, hose, bracket, sign);
  return g;
}

/** Security camera on a wall arm; returns { group, led }. */
export function createSecurityCamera() {
  const group = new THREE.Group();
  group.name = 'securityCamera';
  const white = mat(0xe3e5e4, { roughness: 0.5 });
  const plate = mesh(new THREE.BoxGeometry(0.08, 0.1, 0.02), white);
  plate.position.z = 0.01;
  const arm = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.16), white);
  arm.position.z = 0.09;
  const head = new THREE.Group();
  head.position.set(0, -0.03, 0.2);
  head.rotation.x = 0.45;
  const body = mesh(new THREE.BoxGeometry(0.09, 0.09, 0.22), white);
  const hood = mesh(new THREE.BoxGeometry(0.11, 0.015, 0.26), white);
  hood.position.y = 0.055;
  const lens = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8), mat(0x111111, { roughness: 0.2 }));
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.115;
  const led = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.01), new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2a1a, emissiveIntensity: 3 }));
  led.position.set(0.03, -0.03, 0.112);
  head.add(body, hood, lens, led);
  group.add(plate, arm, head);
  return { group, head, led };
}

export function createExitSign() {
  const tex = canvasTexture('exitSign', 256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#12a150';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('SAÍDA', 96, h / 2 + 2);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(48, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.moveTo(46, 34);
    ctx.lineTo(40, 58);
    ctx.lineTo(58, 76);
    ctx.moveTo(40, 58);
    ctx.lineTo(24, 80);
    ctx.moveTo(26, 46);
    ctx.lineTo(60, 44);
    ctx.stroke();
  });
  const g = new THREE.Group();
  g.name = 'exitSign';
  const box = mesh(new THREE.BoxGeometry(0.36, 0.14, 0.05), mat(0xe8e8e4), { cast: false });
  box.position.z = 0.025;
  const face = mesh(new THREE.PlaneGeometry(0.34, 0.12), texturedMat(tex, 0xffffff, { emissive: 0xffffff, roughness: 0.5 }), { cast: false });
  face.position.z = 0.051;
  g.add(box, face);
  return g;
}

/** Plate with large text (cell numbers, area names). */
export function createSignPlate(text, { width = 0.3, height = 0.16, bg = 0x1d2328, fg = 0xeef1f2 } = {}) {
  const g = new THREE.Group();
  g.name = 'sign_' + text;
  const plate = mesh(new THREE.BoxGeometry(width, height, 0.015), mat(bg, { roughness: 0.6 }), { cast: false });
  plate.position.z = 0.0075;
  const label = mesh(new THREE.PlaneGeometry(width * 0.9, height * 0.85), textDecalMaterial(text, { color: fg, aspect: (width * 0.9) / (height * 0.85) }), {
    cast: false,
  });
  label.position.z = 0.016;
  g.add(plate, label);
  return g;
}

export function createFloorDrain() {
  const g = new THREE.Group();
  g.name = 'drain';
  const base = mesh(new THREE.BoxGeometry(0.16, 0.004, 0.16), mat(0x2b2e31, { roughness: 0.5, metalness: 0.5 }), { cast: false });
  base.position.y = 0.002;
  g.add(base);
  const pieces = [];
  for (let i = -2; i <= 2; i++) pieces.push([i * 0.028, 0.005, 0, 0.008, 0.004, 0.14]);
  g.add(instancedBoxes(pieces, mat(0x8a9195, { metalness: 0.5, roughness: 0.4 }), { cast: false, name: 'drainGrate' }));
  return g;
}

/** Loose items for desks/floors: papers, envelope, pencil, sandals. */
export function createDeskClutter(seed = 2) {
  const g = new THREE.Group();
  g.name = 'deskClutter';
  const rnd = mulberry32(seed);
  const paper = mat(0xf1eee5, { roughness: 0.95 });
  for (let i = 0; i < 4; i++) {
    const p = mesh(new THREE.BoxGeometry(0.21, 0.002, 0.29), paper, { cast: false });
    p.position.set(-0.15 + rnd() * 0.02, 0.001 + i * 0.002, rnd() * 0.02);
    p.rotation.y = (rnd() - 0.5) * 0.3;
    g.add(p);
  }
  const env = mesh(new THREE.BoxGeometry(0.22, 0.003, 0.11), mat(0xe4d3a8, { roughness: 0.9 }), { cast: false });
  env.position.set(0.15, 0.002, -0.04);
  env.rotation.y = 0.4;
  const pencil = mesh(new THREE.BoxGeometry(0.17, 0.008, 0.008), mat(0xe1b12c));
  pencil.position.set(0.05, 0.01, 0.1);
  pencil.rotation.y = -0.6;
  g.add(env, pencil);
  return g;
}

/**
 * Guard's key ring. Origin = top of the ring (where fingers hold it); keys hang toward -Y.
 * setSwing(angle) rocks the bunch (z rotation) for a little secondary motion.
 */
export function createKeyRing({ count = 4, seed = 3 } = {}) {
  const g = new THREE.Group();
  g.name = 'keyRing';
  const rnd = mulberry32(seed);
  const steel = mat(0xa9b0b5, { roughness: 0.3, metalness: 0.85 });
  const brass = mat(0xb89a52, { roughness: 0.35, metalness: 0.8 });
  const ring = mesh(new THREE.TorusGeometry(0.02, 0.0026, 4, 10), steel, { cast: false });
  ring.position.y = -0.02;
  g.add(ring);
  const bunch = new THREE.Group();
  bunch.position.y = -0.038;
  g.add(bunch);
  for (let i = 0; i < count; i++) {
    const k = new THREE.Group();
    const m = i % 2 ? brass : steel;
    const len = 0.045 + rnd() * 0.02;
    const bow = mesh(new THREE.BoxGeometry(0.02, 0.018, 0.003), m, { cast: false });
    bow.position.y = -0.009;
    const blade = mesh(new THREE.BoxGeometry(0.0065, len, 0.0024), m, { cast: false });
    blade.position.y = -0.018 - len / 2;
    const bit = mesh(new THREE.BoxGeometry(0.008, 0.01, 0.0024), m, { cast: false });
    bit.position.set(0.006, -0.018 - len * 0.8, 0);
    k.add(bow, blade, bit);
    k.rotation.z = (i - (count - 1) / 2) * 0.32;
    k.rotation.y = (rnd() - 0.5) * 0.8;
    bunch.add(k);
  }
  g.userData.bunch = bunch;
  g.userData.setSwing = (a) => { bunch.rotation.z = a; bunch.rotation.x = a * 0.5; };
  return g;
}

/**
 * Handwritten note lying flat (faces +Y). Text "up" points to local -Z before any rotation.
 * lines: array of strings, written big and dark so it stays legible in low light.
 */
export function createNote(lines, { width = 0.17, height = 0.22, seed = 9 } = {}) {
  const key = 'note|' + lines.join('/');
  const tex = canvasTexture(key, 680, 880, (ctx, w, h) => {
    const rnd = mulberry32(seed);
    ctx.fillStyle = '#ece6d6';
    ctx.fillRect(0, 0, w, h);
    // fold creases and grime
    ctx.strokeStyle = 'rgba(120,110,90,0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5 + 6);
    ctx.lineTo(w, h * 0.5 - 4);
    ctx.stroke();
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(90,80,60,${0.05 + rnd() * 0.08})`;
      ctx.beginPath();
      ctx.arc(rnd() * w, rnd() * h, 4 + rnd() * 18, 0, Math.PI * 2);
      ctx.fill();
    }
    // pencil-marker block letters, one phrase per line
    ctx.fillStyle = '#16120e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = (h * 0.84) / lines.length;
    lines.forEach((ln, i) => {
      let size = 118;
      ctx.font = `900 ${size}px "Arial Black", Impact, "Segoe UI", sans-serif`;
      while (ctx.measureText(ln).width > w * 0.88 && size > 30) {
        size -= 2;
        ctx.font = `900 ${size}px "Arial Black", Impact, "Segoe UI", sans-serif`;
      }
      ctx.save();
      ctx.translate(w / 2 + (rnd() - 0.5) * 14, h * 0.08 + lh * (i + 0.5));
      ctx.rotate((rnd() - 0.5) * 0.05);
      ctx.fillText(ln, 0, 0);
      ctx.restore();
    });
  });
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, emissive: new THREE.Color(0xffffff), emissiveMap: tex, emissiveIntensity: 0.1 });
  const geo = new THREE.PlaneGeometry(width, height, 4, 4);
  // a little curl so it does not look like a decal
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, (Math.abs(p.getX(i)) / (width / 2)) ** 2 * 0.006);
  geo.computeVertexNormals();
  geo.rotateX(-Math.PI / 2);
  const note = mesh(geo, m, { cast: false });
  note.name = 'note';
  return note;
}

/** Worn paperback, closed. Origin at the centre; lies flat (thin along Y), spine along -X. */
export function createBook({ color = 0x7a2a22, pages = 0xe6dfcc } = {}) {
  const g = new THREE.Group();
  g.name = 'book';
  const cover = mat(color, { roughness: 0.8 });
  const w = 0.13;
  const d = 0.19;
  for (const y of [-0.0105, 0.0105]) {
    const c = mesh(new THREE.BoxGeometry(w, 0.003, d), cover);
    c.position.y = y;
    g.add(c);
  }
  const spine = mesh(new THREE.BoxGeometry(0.004, 0.024, d), cover);
  spine.position.x = -w / 2;
  const block = mesh(new THREE.BoxGeometry(w - 0.006, 0.018, d - 0.008), mat(pages, { roughness: 0.95 }));
  block.position.x = 0.002;
  g.add(spine, block);
  return g;
}

/** Low-poly apple. Origin at the centre; radius ~0.038. */
export function createApple({ color = 0xb3261e, seed = 5 } = {}) {
  const g = new THREE.Group();
  g.name = 'apple';
  const geo = new THREE.IcosahedronGeometry(0.038, 1);
  const p = geo.attributes.position;
  const rnd = mulberry32(seed);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    // slightly flattened, with the dimple at the top
    p.setXYZ(i, p.getX(i) * (1.04 + rnd() * 0.03), y * 0.9 - (y > 0.03 ? 0.008 : 0), p.getZ(i) * (1.04 + rnd() * 0.03));
  }
  geo.computeVertexNormals();
  const body = mesh(geo, mat(color, { roughness: 0.45 }));
  const stem = mesh(new THREE.CylinderGeometry(0.0025, 0.003, 0.022, 4), mat(0x4a3220, { roughness: 0.9 }));
  stem.position.y = 0.036;
  stem.rotation.z = 0.25;
  const leaf = mesh(new THREE.BoxGeometry(0.018, 0.002, 0.009), mat(0x4f7a2c, { roughness: 0.8 }));
  leaf.position.set(0.008, 0.042, 0);
  leaf.rotation.z = -0.4;
  g.add(body, stem, leaf);
  return g;
}

export function createSandals(color = 0x253a5c) {
  const g = new THREE.Group();
  g.name = 'sandals';
  for (const [x, r] of [[-0.07, 0.15], [0.07, -0.1]]) {
    const s = mesh(deformBox(0.1, 0.02, 0.27, [1, 1, 3], (v) => { if (v.z > 0.08) v.x *= 0.85; }), mat(color, { roughness: 0.8 }));
    s.position.set(x, 0.01, 0);
    s.rotation.y = r;
    const strap = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), mat(0x1b2a44));
    strap.position.set(x, 0.025, 0.03);
    strap.rotation.y = r;
    g.add(s, strap);
  }
  return g;
}
