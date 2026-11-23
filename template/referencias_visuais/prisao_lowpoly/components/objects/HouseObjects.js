import * as THREE from 'three';
import { mesh, deformBox } from '../../lib/geometry.js';
import { mat, canvasTexture } from '../../lib/materials.js';
import { smooth } from '../../systems/AnimationSystem.js';

// Residential props for "A Casa". Origin conventions: floor objects at their floor centre (front = +Z);
// wall objects with their back at z = 0 facing +Z (use mountOnWall).

const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const b = mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  return b;
};

function cushion(w, h, d, round) {
  return deformBox(w, h, d, [3, 1, 3], (v) => {
    if (v.y > 0) v.y -= round * Math.max(Math.abs(v.x) / (w / 2), Math.abs(v.z) / (d / 2)) ** 4;
  });
}

/** Hinged interior/exterior door. Pivot on the -X edge; setOpen(1) swings 95 degrees toward +Z. */
export function createHouseDoor({ width = 0.86, height = 2.1, color = 0x8a5a3a, frame = 0xe8e2d6, glass = false, peephole = false } = {}) {
  const group = new THREE.Group();
  group.name = 'houseDoor';
  const fm = mat(frame, { roughness: 0.6 });
  const fw = 0.07;
  group.add(box(fw, height + fw, 0.16, fm, -width / 2 - fw / 2, (height + fw) / 2));
  group.add(box(fw, height + fw, 0.16, fm, width / 2 + fw / 2, (height + fw) / 2));
  group.add(box(width + fw * 2, fw, 0.16, fm, 0, height + fw / 2));
  const pivot = new THREE.Group();
  pivot.position.set(-width / 2, 0, 0);
  group.add(pivot);
  const leaf = mat(color, { roughness: 0.6 });
  const t = 0.045;
  pivot.add(box(width, height, t, leaf, width / 2, height / 2));
  // raised panels on both faces
  const panel = mat(new THREE.Color(color).multiplyScalar(0.88).getHex(), { roughness: 0.6 });
  for (const s of [1, -1]) {
    for (const [y0, y1] of glass ? [[0.15, 0.95]] : [[0.15, 0.95], [1.1, 1.95]]) {
      pivot.add(box(width - 0.22, y1 - y0, 0.01, panel, width / 2, (y0 + y1) / 2, s * (t / 2 + 0.004)));
    }
  }
  if (glass) {
    const g = new THREE.MeshStandardMaterial({ color: 0x1b2633, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.5 });
    pivot.add(box(width - 0.3, 0.75, t + 0.004, g, width / 2, 1.5));
  }
  if (peephole) pivot.add(box(0.025, 0.025, t + 0.02, mat(0xb8a46a, { metalness: 0.7, roughness: 0.3 }), width / 2, 1.55));
  const metal = mat(0xb8a46a, { roughness: 0.3, metalness: 0.75 });
  for (const s of [1, -1]) {
    const knob = mesh(new THREE.SphereGeometry(0.03, 8, 6), metal);
    knob.position.set(width - 0.07, 1.0, s * (t / 2 + 0.035));
    pivot.add(knob, box(0.016, 0.016, 0.035, metal, width - 0.07, 1.0, s * (t / 2 + 0.017)));
  }
  const state = { open: 0 };
  return {
    group,
    pivot,
    get open() {
      return state.open;
    },
    setOpen(v) {
      state.open = Math.min(1, Math.max(0, v));
      pivot.rotation.y = -smooth(state.open) * THREE.MathUtils.degToRad(95);
    },
  };
}

/** Wall window (back at z = 0): frame, see-through tinted glass, curtains. Center at the window centre. */
export function createWindow({ width = 1.1, height = 1.1, curtain = 0x6d5a48 } = {}) {
  const g = new THREE.Group();
  g.name = 'window';
  const fm = mat(0xe8e2d6, { roughness: 0.6 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x223044, roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.16, depthWrite: false });
  const pane = box(width, height, 0.01, glass, 0, 0, -0.04); // the outside stays visible (and readable at night)
  pane.castShadow = false; // light from outside comes in
  g.add(pane);
  g.add(box(width + 0.1, 0.06, 0.12, fm, 0, -height / 2 - 0.03, 0.02), box(width + 0.1, 0.05, 0.08, fm, 0, height / 2 + 0.025));
  for (const s of [1, -1]) g.add(box(0.05, height, 0.08, fm, s * (width / 2 + 0.025), 0));
  g.add(box(0.035, height, 0.05, fm, 0, 0, -0.01), box(width, 0.035, 0.05, fm, 0, 0.05, -0.01));
  const cm = mat(curtain, { roughness: 0.95 });
  for (const s of [1, -1]) {
    const c = mesh(deformBox(width * 0.24, height + 0.35, 0.03, [4, 1, 1], (v) => { v.z += Math.sin(v.x * 40) * 0.012; }), cm);
    c.position.set(s * (width / 2 + width * 0.02), 0.05, 0.08); // drawn open: the glass stays clear
    g.add(c);
  }
  g.add(box(width + 0.4, 0.03, 0.03, mat(0x3a3a3a), 0, height / 2 + 0.22, 0.09));
  return g;
}

export function createSofa({ color = 0x4f5a4a, width = 2.0 } = {}) {
  const g = new THREE.Group();
  g.name = 'sofa';
  const fab = mat(color, { roughness: 0.95 });
  const dark = mat(new THREE.Color(color).multiplyScalar(0.8).getHex(), { roughness: 0.95 });
  g.add(box(width, 0.22, 0.85, dark, 0, 0.17));
  for (const s of [1, -1]) g.add(box(0.18, 0.62, 0.85, fab, s * (width / 2 - 0.09), 0.31));
  g.add(box(width - 0.36, 0.55, 0.2, fab, 0, 0.55, -0.32));
  const n = width > 1.6 ? 3 : 2;
  const cw = (width - 0.36) / n;
  for (let i = 0; i < n; i++) {
    const c = mesh(cushion(cw - 0.02, 0.14, 0.62, 0.04), fab);
    c.position.set(-width / 2 + 0.18 + cw * (i + 0.5), 0.35, 0.07);
    g.add(c);
  }
  return g;
}

/** TV on a low cabinet. setOn(level) lights the screen (and its light, if added by the caller). */
export function createTVUnit({ width = 1.4 } = {}) {
  const g = new THREE.Group();
  g.name = 'tvUnit';
  const wood = mat(0x5a4030, { roughness: 0.7 });
  g.add(box(width, 0.45, 0.42, wood, 0, 0.225));
  g.add(box(width * 0.42, 0.01, 0.4, mat(0x2a1e16), -width * 0.22, 0.2, 0.012));
  const black = mat(0x111214, { roughness: 0.4 });
  g.add(box(0.25, 0.04, 0.18, black, 0, 0.47), box(0.06, 0.1, 0.04, black, 0, 0.53, -0.02));
  const tv = box(1.12, 0.66, 0.05, black, 0, 0.92, -0.02);
  g.add(tv);
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x050607, emissive: 0x6d8fb3, emissiveIntensity: 0, roughness: 0.2 });
  const screen = box(1.06, 0.6, 0.005, screenMat, 0, 0.92, 0.008);
  g.add(screen);
  return {
    group: g,
    setOn(level) {
      screenMat.emissiveIntensity = level;
    },
  };
}

export function createCoffeeTable({ w = 1.0, d = 0.55, h = 0.42 } = {}) {
  const g = new THREE.Group();
  g.name = 'coffeeTable';
  const wood = mat(0x7a5638, { roughness: 0.65 });
  g.add(box(w, 0.04, d, wood, 0, h - 0.02));
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) g.add(box(0.045, h - 0.04, 0.045, wood, x * (w / 2 - 0.05), (h - 0.04) / 2, z * (d / 2 - 0.05)));
  g.add(box(w - 0.1, 0.02, d - 0.1, wood, 0, 0.1));
  return { group: g, top: h };
}

/** Small table (entrance, bedside). */
export function createSideTable({ w = 0.5, d = 0.38, h = 0.75, color = 0x6a4a32 } = {}) {
  const t = createCoffeeTable({ w, d, h });
  t.group.traverse((o) => { if (o.isMesh) o.material = mat(color, { roughness: 0.65 }); });
  return t;
}

/** Table lamp with a warm point light. setOn(level). Origin at the base. */
export function createLamp({ height = 0.45, color = 0xffc98a, intensity = 1.2, distance = 5, castShadow = false } = {}) {
  const g = new THREE.Group();
  g.name = 'lamp';
  const base = mat(0x3a3530, { roughness: 0.5, metalness: 0.3 });
  g.add(box(0.12, 0.03, 0.12, base, 0, 0.015), box(0.02, height - 0.12, 0.02, base, 0, (height - 0.12) / 2));
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, emissive: color, emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide });
  const shade = mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.17, 8, 1, true), shadeMat, { cast: false });
  shade.position.y = height - 0.06;
  g.add(shade);
  const light = new THREE.PointLight(color, 0, distance, 2);
  light.position.y = height - 0.08;
  light.castShadow = castShadow;
  if (castShadow) {
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.002;
  }
  g.add(light);
  return {
    group: g,
    light,
    setOn(level) {
      light.intensity = intensity * level;
      shadeMat.emissiveIntensity = 0.9 * level;
    },
  };
}

/** Light switch plate (wall object). */
export function createLightSwitch() {
  const g = new THREE.Group();
  g.name = 'lightSwitch';
  g.add(box(0.08, 0.12, 0.012, mat(0xf2efe8, { roughness: 0.5 }), 0, 0, 0.006));
  g.add(box(0.025, 0.04, 0.012, mat(0xdcd8cf, { roughness: 0.5 }), 0, 0, 0.016));
  return g;
}

/** Ceiling bulb with a simple shade. setOn(level). Hang from the ceiling (origin at the ceiling). */
export function createCeilingBulb({ color = 0xffd9a8, intensity = 2.0, distance = 6 } = {}) {
  const g = new THREE.Group();
  g.name = 'ceilingBulb';
  g.add(box(0.012, 0.3, 0.012, mat(0x222222), 0, -0.15));
  const shade = mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.12, 8, 1, true), mat(0xe8e2d6, { roughness: 0.8, side: THREE.DoubleSide }));
  shade.position.y = -0.34;
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0 });
  const bulb = mesh(new THREE.SphereGeometry(0.035, 8, 6), bulbMat, { cast: false });
  bulb.position.y = -0.37;
  const light = new THREE.PointLight(color, 0, distance, 2);
  light.position.y = -0.42;
  g.add(shade, bulb, light);
  return {
    group: g,
    light,
    setOn(level) {
      light.intensity = intensity * level;
      bulbMat.emissiveIntensity = 2 * level;
    },
  };
}

/** Smartphone (origin at its centre, screen facing +Z). setScreen(level) lights the screen. */
export function createPhone() {
  const g = new THREE.Group();
  g.name = 'phone';
  g.add(box(0.072, 0.15, 0.008, mat(0x15171a, { roughness: 0.35, metalness: 0.3 })));
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x050607, emissive: 0x9ec3ff, emissiveIntensity: 0, roughness: 0.2 });
  g.add(box(0.064, 0.138, 0.001, screenMat, 0, 0, 0.0045));
  return {
    group: g,
    setScreen(level) {
      screenMat.emissiveIntensity = level;
    },
  };
}

/** Framed family photo standing on a surface (origin at the base, picture facing +Z). */
export function createFamilyPhoto({ people = [{ h: 0.9, color: '#5d6f7c', hair: '#3a3028' }, { h: 0.82, color: '#7a3b3b', hair: '#3a2618', long: true }, { h: 0.6, color: '#d9b24a', hair: '#2e1f15' }] } = {}) {
  const tex = canvasTexture('familyPhoto|' + JSON.stringify(people), 300, 380, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#b9cfe0');
    sky.addColorStop(1, '#e8e0cc');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7d9a63';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    people.forEach((p, i) => {
      const x = w * (0.25 + 0.25 * i);
      const top = h * (0.95 - p.h * 0.75);
      ctx.fillStyle = p.color;
      ctx.fillRect(x - 28, top + 52, 56, h * 0.95 - top - 52);
      ctx.fillStyle = '#d8a888';
      ctx.beginPath();
      ctx.arc(x, top + 30, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.hair;
      ctx.fillRect(x - 23, top + 6, 46, 14);
      if (p.long) ctx.fillRect(x - 25, top + 10, 10, 50), ctx.fillRect(x + 15, top + 10, 10, 50);
    });
  });
  const g = new THREE.Group();
  g.name = 'familyPhoto';
  const frame = mat(0x2a211b, { roughness: 0.5 });
  g.add(box(0.15, 0.19, 0.015, frame, 0, 0.095));
  g.add(box(0.12, 0.155, 0.001, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 0.095, 0.008));
  const leg = box(0.03, 0.15, 0.01, frame, 0, 0.075, -0.05);
  leg.rotation.x = -0.35;
  g.add(leg);
  return g;
}

export function createWardrobe({ w = 1.0, h = 1.9, d = 0.55, color = 0xd9cdb8 } = {}) {
  const g = new THREE.Group();
  g.name = 'wardrobe';
  const m = mat(color, { roughness: 0.7 });
  g.add(box(w, h, d, m, 0, h / 2));
  const line = mat(new THREE.Color(color).multiplyScalar(0.7).getHex());
  g.add(box(0.006, h - 0.1, 0.01, line, 0, h / 2, d / 2 + 0.002));
  const knob = mat(0x9a8a6a, { metalness: 0.6, roughness: 0.4 });
  for (const s of [1, -1]) g.add(box(0.02, 0.12, 0.03, knob, s * 0.05, h * 0.55, d / 2 + 0.015));
  return g;
}

export function createRug({ w = 1.8, d = 1.2, color = 0x7a5a4a } = {}) {
  const r = box(w, 0.012, d, mat(color, { roughness: 1 }), 0, 0.006);
  r.receiveShadow = true;
  r.castShadow = false;
  return r;
}
