import * as THREE from 'three';
import { mesh, deformBox, mulberry32 } from '../../lib/geometry.js';
import { mat, canvasTexture, texturedMat } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';

// Room fixtures shared by the cafeteria, showers and offices. Wall items face +Z with their back at z = 0.

const steel = () => mat(0xa9b1b5, { roughness: 0.35, metalness: 0.5 });

const FOODS = { rice: 0xe9e2c9, beans: 0x6a3b25, greens: 0x5f8a3a, carrot: 0xd9762b, meat: 0x8a4f35, bread: 0xc9965a };

/** Plastic food tray with compartments and food. Length along X. */
export function createFoodTray({ color = 0x9b8a6e, seed = 1, empty = false } = {}) {
  const g = new THREE.Group();
  g.name = 'tray';
  const rnd = mulberry32(seed);
  const tray = mesh(new THREE.BoxGeometry(0.42, 0.02, 0.3), mat(color, { roughness: 0.6 }));
  tray.position.y = 0.01;
  g.add(tray);
  if (empty) return g;
  const keys = Object.keys(FOODS);
  const slots = [[-0.11, -0.06, 0.17, 0.14], [0.1, -0.06, 0.17, 0.14], [-0.13, 0.08, 0.12, 0.1], [0.0, 0.08, 0.1, 0.1], [0.13, 0.08, 0.1, 0.1]];
  for (const [x, z, w, d] of slots) {
    const food = mesh(
      deformBox(w, 0.025, d, [2, 1, 2], (v) => {
        if (v.y > 0) v.y += (0.012 - Math.hypot(v.x / w, v.z / d) * 0.02);
      }),
      mat(FOODS[keys[Math.floor(rnd() * keys.length)]], { roughness: 0.9 }),
    );
    food.position.set(x, 0.032, z);
    g.add(food);
  }
  const cup = mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8), mat(0xd8d3c3, { roughness: 0.7 }));
  cup.position.set(0.24, 0.045, 0.08);
  const spoon = mesh(new THREE.BoxGeometry(0.15, 0.006, 0.018), steel());
  spoon.position.set(0.0, 0.025, 0.135);
  g.add(cup, spoon);
  return g;
}

/**
 * Serving counter with food pans and sneeze guard. Length along X, servers stand at -Z,
 * prisoners queue at +Z. Returns { group, trayRail: y }.
 */
export function createServingCounter({ length = 5, depth = 0.8, height = 0.9 } = {}) {
  const g = new THREE.Group();
  g.name = 'servingCounter';
  const s = steel();
  const body = mesh(new THREE.BoxGeometry(length, height, depth), s);
  body.position.y = height / 2;
  const kick = mesh(new THREE.BoxGeometry(length, 0.1, depth - 0.06), mat(0x3a3f43));
  kick.position.set(0, 0.05, -0.02);
  g.add(body, kick);
  // tray rail on the prisoner side
  const rail = mesh(new THREE.BoxGeometry(length, 0.03, 0.28), s);
  rail.position.set(0, height - 0.12, depth / 2 + 0.14);
  g.add(rail);
  for (let x = -length / 2 + 0.3; x < length / 2; x += 0.9) {
    const b = mesh(new THREE.BoxGeometry(0.03, 0.1, 0.25), s);
    b.position.set(x, height - 0.18, depth / 2 + 0.12);
    g.add(b);
  }
  // food pans
  const keys = Object.keys(FOODS);
  const n = Math.floor(length / 0.62);
  for (let i = 0; i < n; i++) {
    const x = -length / 2 + 0.4 + i * 0.62;
    const pan = mesh(new THREE.BoxGeometry(0.52, 0.02, 0.36), mat(0x6b7276, { roughness: 0.3, metalness: 0.6 }));
    pan.position.set(x, height + 0.005, 0);
    const food = mesh(deformBox(0.48, 0.03, 0.32, [3, 1, 2], (v) => { if (v.y > 0) v.y += Math.sin(v.x * 40 + i) * 0.006; }), mat(FOODS[keys[i % keys.length]], { roughness: 0.9 }));
    food.position.set(x, height + 0.012, 0);
    g.add(pan, food);
  }
  // sneeze guard
  const glass = new THREE.MeshStandardMaterial({ color: 0xcfe3ea, transparent: true, opacity: 0.25, roughness: 0.1 });
  const guard = new THREE.Mesh(new THREE.BoxGeometry(length, 0.01, 0.45), glass);
  guard.position.set(0, height + 0.42, 0.08);
  guard.rotation.x = 0.25;
  g.add(guard);
  for (let x = -length / 2 + 0.05; x <= length / 2; x += length / 4) {
    const post = mesh(new THREE.BoxGeometry(0.025, 0.42, 0.025), s);
    post.position.set(Math.min(x, length / 2 - 0.05), height + 0.21, -0.12);
    g.add(post);
  }
  return { group: g, height };
}

/** Kitchen pass-through hatch on a wall: dark opening, warm glow, half-open steel shutter. */
export function createKitchenHatch({ width = 3, height = 1.1 } = {}) {
  const g = new THREE.Group();
  g.name = 'kitchenHatch';
  const inside = mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshStandardMaterial({ color: 0x3a3226, emissive: 0x6b5232, emissiveIntensity: 0.6 }), { cast: false });
  inside.position.z = 0.003;
  const frame = mat(0x8e969a, { roughness: 0.4, metalness: 0.4 });
  for (const [x, y, w, h] of [[0, height / 2, width + 0.1, 0.05], [0, -height / 2, width + 0.1, 0.05], [-width / 2, 0, 0.05, height], [width / 2, 0, 0.05, height]]) {
    const f = mesh(new THREE.BoxGeometry(w, h, 0.06), frame);
    f.position.set(x, y, 0.03);
    g.add(f);
  }
  const pieces = [];
  for (let i = 0; i < 6; i++) pieces.push([0, height / 2 - 0.05 - i * 0.07, 0.04, width, 0.065, 0.015]);
  g.add(inside, instancedBoxes(pieces, mat(0xb9c0c3, { roughness: 0.4, metalness: 0.5 }), { name: 'shutter' }));
  return g;
}

/** Steel bench (shower/locker room). Length along X. */
export function createBench({ length = 1.8, height = 0.45, seat = 0x8a6a48 } = {}) {
  const g = new THREE.Group();
  g.name = 'bench';
  const pieces = [];
  for (let i = 0; i < 3; i++) pieces.push([0, height, -0.1 + i * 0.1, length, 0.03, 0.08]);
  g.add(instancedBoxes(pieces, mat(seat, { roughness: 0.8 }), { name: 'slats' }));
  const legs = [];
  for (const x of [-length / 2 + 0.15, length / 2 - 0.15]) {
    legs.push([x, height / 2, 0, 0.04, height, 0.28], [x, 0.02, 0, 0.06, 0.04, 0.34]);
  }
  g.add(instancedBoxes(legs, steel(), { name: 'benchLegs' }));
  return g;
}

/** Shower head + valve on a wall. Returns { group, water, setOn(bool) }. */
export function createShowerUnit({ headY = 2.0 } = {}) {
  const g = new THREE.Group();
  g.name = 'shower';
  const chrome = mat(0xc7cdd0, { roughness: 0.2, metalness: 0.7 });
  const pipe = mesh(new THREE.CylinderGeometry(0.015, 0.015, headY - 1.1, 6), chrome);
  pipe.position.set(0, (headY + 1.1) / 2, 0.03);
  const arm = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.18), chrome);
  arm.position.set(0, headY, 0.11);
  const head = mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.05, 8), chrome);
  head.position.set(0, headY - 0.02, 0.2);
  head.rotation.x = 0.3;
  const valve = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 8), chrome);
  valve.rotation.x = Math.PI / 2;
  valve.position.set(0, 1.1, 0.03);
  const knob = mesh(new THREE.BoxGeometry(0.09, 0.02, 0.02), chrome);
  knob.position.set(0, 1.1, 0.055);
  g.add(pipe, arm, head, valve, knob);
  const waterMat = new THREE.MeshStandardMaterial({ color: 0xcfe6f2, transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false });
  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, headY - 0.05, 8, 1, true), waterMat);
  water.position.set(0, (headY - 0.05) / 2, 0.28);
  water.visible = false;
  g.add(water);
  return {
    group: g,
    water,
    setOn(on) {
      water.visible = on;
    },
    update(t) {
      if (water.visible) {
        water.scale.x = water.scale.z = 1 + Math.sin(t * 31) * 0.06;
        waterMat.opacity = 0.28 + Math.sin(t * 23) * 0.05;
      }
    },
  };
}

/** Wall sink with tap. */
export function createWallSink() {
  const g = new THREE.Group();
  g.name = 'wallSink';
  const s = mat(0xb4bbbf, { roughness: 0.3, metalness: 0.55 });
  const basin = mesh(deformBox(0.5, 0.16, 0.38, [2, 1, 2], (v) => { if (v.y < 0) { v.x *= 0.8; v.z = v.z * 0.8 - 0.02; } }), s);
  basin.position.set(0, 0.8, 0.19);
  const bowl = mesh(new THREE.BoxGeometry(0.38, 0.01, 0.26), mat(0x50585c, { roughness: 0.25, metalness: 0.6 }));
  bowl.position.set(0, 0.885, 0.21);
  const tap = mesh(new THREE.BoxGeometry(0.03, 0.12, 0.12), s);
  tap.position.set(0, 0.95, 0.06);
  g.add(basin, bowl, tap);
  return g;
}

/**
 * Row of toilet stalls along X (partitions + doors). Back at z = 0, opens toward +Z.
 * Returns { group, doors: [{ pivot, setOpen }] }.
 */
export function createStallRow({ count = 3, width = 0.95, depth = 1.5, height = 1.9, color = 0x6c8796 } = {}) {
  const g = new THREE.Group();
  g.name = 'stalls';
  const panel = mat(color, { roughness: 0.55 });
  const legs = steel();
  const doors = [];
  for (let i = 0; i <= count; i++) {
    const x = -((count * width) / 2) + i * width;
    const p = mesh(new THREE.BoxGeometry(0.03, height - 0.25, depth), panel);
    p.position.set(x, 0.25 + (height - 0.25) / 2, depth / 2);
    const foot = mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), legs);
    foot.position.set(x, 0.125, depth - 0.05);
    g.add(p, foot);
  }
  for (let i = 0; i < count; i++) {
    const x0 = -((count * width) / 2) + i * width + 0.03;
    const pivot = new THREE.Group();
    pivot.position.set(x0, 0, depth);
    const d = mesh(new THREE.BoxGeometry(width - 0.08, height - 0.25, 0.025), panel);
    d.position.set((width - 0.08) / 2, 0.25 + (height - 0.25) / 2, 0);
    const lock = mesh(new THREE.BoxGeometry(0.04, 0.02, 0.02), legs);
    lock.position.set(width - 0.14, 1.0, 0.02);
    pivot.add(d, lock);
    g.add(pivot);
    const wc = mesh(deformBox(0.38, 0.4, 0.5, [2, 1, 2], (v) => { const t = (v.z + 0.25) / 0.5; v.x *= 1 - 0.3 * t * t; }), mat(0xe8e8e4, { roughness: 0.3 }));
    wc.position.set(x0 + width / 2 - 0.03, 0.2, 0.3);
    g.add(wc);
    doors.push({ pivot, setOpen: (t) => (pivot.rotation.y = -t * 1.6) });
  }
  const top = mesh(new THREE.BoxGeometry(count * width + 0.03, 0.04, 0.04), legs);
  top.position.set(0, height, depth);
  g.add(top);
  return { group: g, doors };
}

/** Wall clock; returns { group, setTime(hours) }. */
export function createWallClock({ radius = 0.17 } = {}) {
  const g = new THREE.Group();
  g.name = 'clock';
  const face = mesh(new THREE.CylinderGeometry(radius, radius, 0.04, 16), mat(0xf4f4f0, { roughness: 0.5 }));
  face.rotation.x = Math.PI / 2;
  face.position.z = 0.02;
  const rim = mesh(new THREE.TorusGeometry(radius, 0.015, 4, 16), mat(0x202326));
  rim.position.z = 0.04;
  g.add(face, rim);
  for (let i = 0; i < 12; i++) {
    const tick = mesh(new THREE.BoxGeometry(0.01, i % 3 ? 0.02 : 0.04, 0.004), mat(0x202326), { cast: false });
    const a = (i / 12) * Math.PI * 2;
    tick.position.set(Math.sin(a) * radius * 0.82, Math.cos(a) * radius * 0.82, 0.043);
    tick.rotation.z = -a;
    g.add(tick);
  }
  const hand = (len, w) => {
    const pivot = new THREE.Group();
    pivot.position.z = 0.046;
    const h = mesh(new THREE.BoxGeometry(w, len, 0.004), mat(0x15171a), { cast: false });
    h.position.y = len / 2;
    pivot.add(h);
    g.add(pivot);
    return pivot;
  };
  const hh = hand(radius * 0.5, 0.014);
  const mh = hand(radius * 0.75, 0.009);
  const api = {
    group: g,
    setTime(hours) {
      hh.rotation.z = -((hours % 12) / 12) * Math.PI * 2;
      mh.rotation.z = -(hours % 1) * Math.PI * 2;
    },
  };
  api.setTime(12.25);
  return api;
}

export function createTrashBin({ color = 0x2f5d8a } = {}) {
  const g = new THREE.Group();
  g.name = 'trashBin';
  const bin = mesh(new THREE.CylinderGeometry(0.22, 0.19, 0.7, 8), mat(color, { roughness: 0.6 }));
  bin.position.y = 0.35;
  const lid = mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.04, 8), mat(0x23262a, { roughness: 0.6 }));
  lid.position.y = 0.72;
  g.add(bin, lid);
  return g;
}

/** Yellow wet-floor A-frame sign. */
export function createWetFloorSign() {
  const tex = canvasTexture('wetfloor', 128, 192, (ctx, w, h) => {
    ctx.fillStyle = '#f2c318';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.moveTo(w / 2, 20);
    ctx.lineTo(w - 18, 100);
    ctx.lineTo(18, 100);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f2c318';
    ctx.fillRect(w / 2 - 4, 45, 8, 32);
    ctx.fillRect(w / 2 - 4, 84, 8, 8);
    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PISO', w / 2, 135);
    ctx.fillText('MOLHADO', w / 2, 162);
  });
  const g = new THREE.Group();
  g.name = 'wetFloorSign';
  const m = texturedMat(tex, 0xffffff, { roughness: 0.5 });
  for (const s of [1, -1]) {
    const p = mesh(new THREE.BoxGeometry(0.3, 0.6, 0.01), m);
    p.position.set(0, 0.3, s * 0.09);
    p.rotation.x = s * 0.28;
    p.rotation.y = s > 0 ? 0 : Math.PI;
    g.add(p);
  }
  return g;
}

/** Board with a painted canvas (menus, rules, maps). draw(ctx, w, h). */
export function createBoard(key, draw, { width = 1.0, height = 0.7, frame = 0x2b2f33 } = {}) {
  const tex = canvasTexture('board_' + key, 512, Math.round((512 * height) / width), draw);
  const g = new THREE.Group();
  g.name = 'board_' + key;
  const back = mesh(new THREE.BoxGeometry(width + 0.05, height + 0.05, 0.025), mat(frame, { roughness: 0.5 }), { cast: false });
  back.position.z = 0.0125;
  const face = mesh(new THREE.PlaneGeometry(width, height), texturedMat(tex, 0xffffff, { roughness: 0.8 }), { cast: false });
  face.position.z = 0.026;
  g.add(back, face);
  return g;
}

/** Bank of lockers (length along X). */
export function createLockers({ count = 6, color = 0x5b7d92 } = {}) {
  const g = new THREE.Group();
  g.name = 'lockers';
  const w = 0.38;
  const body = mesh(new THREE.BoxGeometry(count * w, 1.8, 0.45), mat(color, { roughness: 0.5, metalness: 0.3 }));
  body.position.set(0, 0.9, 0.225);
  g.add(body);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const x = -((count * w) / 2) + w * (i + 0.5);
    pieces.push([x - w / 2 + 0.005, 0.9, 0.452, 0.01, 1.76, 0.006]);
    for (let k = 0; k < 4; k++) pieces.push([x, 1.55 - k * 0.025, 0.453, w * 0.5, 0.008, 0.004]);
    pieces.push([x + w * 0.35, 1.0, 0.46, 0.02, 0.08, 0.02]);
  }
  g.add(instancedBoxes(pieces, mat(0x2c3a44, { roughness: 0.5 }), { cast: false, name: 'lockerDetail' }));
  return g;
}
