import * as THREE from 'three';
import { mesh, mulberry32 } from '../../lib/geometry.js';
import { canvasTexture, texturedMat, mat } from '../../lib/materials.js';

/** Shared prison palette: every environment pulls from here so rooms read as one building. */
export const PRISON = {
  blockWhite: 0xf2f2ee,
  blockBlue: 0xa9c9d9,
  blockGray: 0xc7cbcc,
  cellFloor: 0xd3d6d6,
  corridorFloor: 0x34505f,
  ceiling: 0xdfe2e2,
  safetyYellow: 0xe6b520,
  steelDark: 0x1c1e21,
  steelPaint: 0x8d969b,
  steelBright: 0xb7bec2,
  mattress: 0x2f9c92,
  doorBeige: 0xcfc3a3,
};

// ---------- tiling textures (UVs are in world metres / tile size) ----------

/** Painted concrete block: 2 courses x 2 blocks (0.8 m x 0.4 m), seamless. */
export function blockWallTexture() {
  return canvasTexture(
    'blockwall',
    512,
    256,
    (ctx, w, h) => {
      const rnd = mulberry32(5);
      ctx.fillStyle = '#c4c6c4';
      ctx.fillRect(0, 0, w, h);
      const bw = 256;
      const bh = 128;
      const m = 6;
      const tones = [[0, 1].map(() => 232 + rnd() * 14), [0, 1].map(() => 232 + rnd() * 14)];
      for (let row = 0; row < 2; row++) {
        const y = row * bh;
        const off = row ? bw / 2 : 0;
        for (let k = -1; k < 3; k++) {
          const x = off + k * bw;
          const t = tones[row][((k % 2) + 2) % 2];
          ctx.fillStyle = `rgb(${t},${t},${t - 3})`;
          ctx.fillRect(x + m / 2, y + m / 2, bw - m, bh - m);
          ctx.fillStyle = 'rgba(255,255,255,0.45)';
          ctx.fillRect(x + m / 2, y + m / 2, bw - m, 4);
          ctx.fillStyle = 'rgba(0,0,0,0.08)';
          ctx.fillRect(x + m / 2, y + bh - m / 2 - 6, bw - m, 6);
        }
      }
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(0,0,0,${0.02 + rnd() * 0.04})`;
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
    },
    { repeat: true },
  );
}

/** Light concrete with faint 0.6 m slab joints (tint it for coloured floors). 512 px = 1.2 m. */
export function concreteTexture() {
  return canvasTexture(
    'concrete',
    512,
    512,
    (ctx, w, h) => {
      const rnd = mulberry32(9);
      ctx.fillStyle = '#e4e6e6';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const r = 20 + rnd() * 70;
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        const a = 0.025 + rnd() * 0.03;
        g.addColorStop(0, `rgba(80,85,90,${a})`);
        g.addColorStop(1, 'rgba(80,85,90,0)');
        ctx.fillStyle = g;
        const x = rnd() * w;
        const y = rnd() * h;
        for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
          ctx.save();
          ctx.translate(x + dx, y + dy);
          ctx.fillRect(-r, -r, r * 2, r * 2);
          ctx.restore();
        }
      }
      for (let i = 0; i < 1500; i++) {
        ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.05})`;
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
      ctx.fillStyle = 'rgba(60,65,70,0.22)';
      for (const p of [0, 256]) {
        ctx.fillRect(p, 0, 3, h);
        ctx.fillRect(0, p, w, 3);
      }
    },
    { repeat: true },
  );
}

/** Square ceramic tiles with grout: 4 x 4 tiles of 0.15 m per repeat (0.6 m). */
export function tileTexture() {
  return canvasTexture(
    'tiles',
    256,
    256,
    (ctx, w, h) => {
      const rnd = mulberry32(13);
      ctx.fillStyle = '#9ea4a6';
      ctx.fillRect(0, 0, w, h);
      const s = w / 4;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const t = 238 + rnd() * 12;
        ctx.fillStyle = `rgb(${t},${t},${t})`;
        ctx.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(i * s + 4, j * s + 4, s - 10, 3);
      }
    },
    { repeat: true },
  );
}

/** Chain-link diamond mesh with alpha (0.1 m per repeat). */
export function chainLinkTexture() {
  return canvasTexture(
    'chainlink',
    64,
    64,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#b9c0c4';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w / 2, 0);
      ctx.lineTo(w, h / 2);
      ctx.lineTo(w / 2, h);
      ctx.closePath();
      ctx.stroke();
    },
    { repeat: true },
  );
}

export const wallMat = (color = PRISON.blockWhite) => texturedMat(blockWallTexture(), color, { roughness: 0.92 });
export const tileMat = (color = 0xffffff, roughness = 0.4) => texturedMat(tileTexture(), color, { roughness });
export const floorMat = (color = PRISON.cellFloor) => texturedMat(concreteTexture(), color, { roughness: 0.85 });
/** Ceilings only get light from below; a little self-illumination stands in for bounce light. */
export const ceilingMat = () => mat(PRISON.ceiling, { roughness: 0.95, emissive: 0x6a6f73, emissiveIntensity: 0.55, flat: false });

export const TILE = { block: [0.8, 0.4], floor: [1.2, 1.2], ceramic: [0.6, 0.6], fence: [0.1, 0.1] };

/**
 * Axis-aligned box given world bounds, with world-space UVs so block courses line up
 * across every wall in the building.
 */
export function worldBox([x0, x1], [y0, y1], [z0, z1], material, tile = TILE.block, opts = {}) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)];
    const [nx, ny, nz] = [n.getX(i), n.getY(i), n.getZ(i)];
    let u;
    let v;
    if (Math.abs(nx) > 0.5) [u, v] = [-z * Math.sign(nx), y];
    else if (Math.abs(ny) > 0.5) [u, v] = [x, -z * Math.sign(ny)];
    else [u, v] = [x * Math.sign(nz), y];
    uv.setXY(i, u / tile[0], v / tile[1]);
  }
  return mesh(g, material, { cast: opts.cast ?? true, receive: true, name: opts.name });
}

// ---------- lights ----------

const tubeMats = new Map();
function tubeMaterial(color, own) {
  const make = () => new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 2.4, roughness: 0.3 });
  if (own) return make();
  if (!tubeMats.has(color)) tubeMats.set(color, make());
  return tubeMats.get(color);
}

/**
 * Ceiling fluorescent fixture + its light. Returns { group, light, tube, setLevel(0..1) }.
 * type 'spot' casts shadows (main light of a room); 'point' is cheap fill.
 */
export function ceilingLight({
  length = 1.2,
  color = 0xeaf3ff,
  intensity = 20,
  type = 'spot',
  castShadow = false,
  target = null,
  angle = 1.15,
  shadowSize = 1024,
  ownMaterial = false,
  cage = false,
} = {}) {
  const group = new THREE.Group();
  group.name = 'ceilingLight';
  const housing = mesh(new THREE.BoxGeometry(length + 0.08, 0.06, 0.26), mat(0xa9b1b6, { roughness: 0.5 }), { cast: false });
  housing.position.y = -0.03;
  const tubeMat = tubeMaterial(color, ownMaterial);
  const tube = mesh(new THREE.BoxGeometry(length, 0.025, 0.18), tubeMat, { cast: false, receive: false });
  tube.position.y = -0.07;
  group.add(housing, tube);
  if (cage) {
    const wire = mat(0x3a3e42, { roughness: 0.5, metalness: 0.4 });
    for (let i = -2; i <= 2; i++) {
      const b = mesh(new THREE.BoxGeometry(0.008, 0.05, 0.24), wire, { cast: false });
      b.position.set((i * length) / 5, -0.08, 0);
      group.add(b);
    }
  }
  let light;
  if (type === 'none') {
    // fixture only (glowing tube, no light source) for far/repeated fixtures
    return { group, light: null, tube, setLevel: (l) => (tube.material.emissiveIntensity = 2.4 * l) };
  }
  if (type === 'spot') {
    light = new THREE.SpotLight(color, intensity, 0, angle, 0.85, 2);
    light.position.set(0, -0.1, 0);
    light.target.position.copy(target ?? new THREE.Vector3(0, -3, 0));
    group.add(light.target);
  } else {
    light = new THREE.PointLight(color, intensity, 0, 2);
    light.position.set(0, -0.15, 0);
  }
  light.castShadow = castShadow;
  if (castShadow) {
    light.shadow.mapSize.set(shadowSize, shadowSize);
    light.shadow.bias = -0.0005;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.near = 0.2;
    light.shadow.camera.far = 12;
  }
  group.add(light);
  const base = intensity;
  return {
    group,
    light,
    tube,
    setLevel(l) {
      light.intensity = base * l;
      tube.material.emissiveIntensity = 2.4 * l;
    },
  };
}

// ---------- rooms ----------

/**
 * Closed room built from world boxes. Walls sit OUTSIDE the interior bounds.
 * doors: [{ side: 'n'|'s'|'e'|'w', at: world coord along the wall, width, height }]
 * s = -Z wall, n = +Z wall, w = -X wall, e = +X wall.
 */
export function buildRoom(parent, {
  x: [x0, x1],
  z: [z0, z1],
  height = 2.75,
  wall: T = 0.2,
  dado = 1.2,
  low = wallMat(PRISON.blockBlue),
  high = wallMat(PRISON.blockWhite),
  floor = floorMat(PRISON.cellFloor),
  floorTile = TILE.floor,
  wallTile = TILE.block,
  lowTile = wallTile,
  ceiling = true,
  doors = [],
  stripe = 0x5f8aa3,
  ceilingMaterial = null, // default: the prison ceiling
} = {}) {
  parent.add(worldBox([x0, x1], [-0.1, 0], [z0, z1], floor, floorTile, { cast: false, name: 'floor' }));
  if (ceiling) parent.add(worldBox([x0 - T, x1 + T], [height, height + 0.15], [z0 - T, z1 + T], ceilingMaterial ?? ceilingMat(), TILE.block, { cast: false, name: 'ceiling' }));
  const walls = {
    s: { axis: 'x', from: x0 - T, to: x1 + T, box: (a, b, y0, y1) => [[a, b], [y0, y1], [z0 - T, z0]] },
    n: { axis: 'x', from: x0 - T, to: x1 + T, box: (a, b, y0, y1) => [[a, b], [y0, y1], [z1, z1 + T]] },
    w: { axis: 'z', from: z0, to: z1, box: (a, b, y0, y1) => [[x0 - T, x0], [y0, y1], [a, b]] },
    e: { axis: 'z', from: z0, to: z1, box: (a, b, y0, y1) => [[x1, x1 + T], [y0, y1], [a, b]] },
  };
  for (const [side, w] of Object.entries(walls)) {
    const gaps = doors.filter((d) => d.side === side).map((d) => [d.at - d.width / 2, d.at + d.width / 2, d.height ?? 2.17]).sort((a, b) => a[0] - b[0]);
    const spans = [];
    let cur = w.from;
    for (const [a, b, h] of gaps) {
      if (a > cur) spans.push([cur, a, 0]);
      spans.push([a, b, h]); // lintel above the opening
      cur = b;
    }
    if (cur < w.to) spans.push([cur, w.to, 0]);
    for (const [a, b, yStart] of spans) {
      const add = (y0, y1, m, tile) => {
        if (y1 - y0 > 0.001) parent.add(worldBox(...w.box(a, b, y0, y1), m, tile));
      };
      if (dado && yStart < dado) {
        add(yStart, dado, low, lowTile);
        add(dado, height, high, wallTile);
      } else add(yStart, height, high, wallTile);
    }
    if (dado && stripe !== null) {
      // painted trim line where the colours meet (inside face only)
      const inset = 0.012;
      const strip = { s: [[x0, x1], [dado - 0.02, dado + 0.02], [z0, z0 + inset]], n: [[x0, x1], [dado - 0.02, dado + 0.02], [z1 - inset, z1]], w: [[x0, x0 + inset], [dado - 0.02, dado + 0.02], [z0, z1]], e: [[x1 - inset, x1], [dado - 0.02, dado + 0.02], [z0, z1]] }[side];
      const holes = gaps.map(([a, b]) => [a, b]);
      let c = w.axis === 'x' ? x0 : z0;
      const end = w.axis === 'x' ? x1 : z1;
      for (const [a, b] of [...holes, [end, end]]) {
        if (a > c) {
          const s = strip.map((r) => [...r]);
          if (w.axis === 'x') s[0] = [c, a];
          else s[2] = [c, a];
          parent.add(worldBox(...s, mat(stripe), TILE.block, { cast: false }));
        }
        c = Math.max(c, b);
      }
    }
  }
  return { x0, x1, z0, z1, height, wall: T };
}

/**
 * Mounts a wall object (back at local z = 0, facing +Z) on the inside face of a room wall.
 * along = world X (s/n walls) or world Z (w/e walls).
 */
export function mountOnWall(parent, obj, room, side, along, y) {
  const conf = {
    s: [along, room.z0, 0],
    n: [along, room.z1, Math.PI],
    w: [room.x0, along, Math.PI / 2],
    e: [room.x1, along, -Math.PI / 2],
  }[side];
  obj.position.set(conf[0], y, conf[1]);
  obj.rotation.y = conf[2];
  parent.add(obj);
  return obj;
}

/** Places a hinged door (createSteelDoor) in a buildRoom opening, opening into the room. */
export function mountDoor(parent, door, room, side, along) {
  const T = room.wall;
  const conf = {
    s: [along, room.z0 - T / 2, 0],
    n: [along, room.z1 + T / 2, Math.PI],
    w: [room.x0 - T / 2, along, Math.PI / 2],
    e: [room.x1 + T / 2, along, -Math.PI / 2],
  }[side];
  door.group.position.set(conf[0], 0, conf[1]);
  door.group.rotation.y = conf[2];
  parent.add(door.group);
  return door;
}

/** Gradient sky dome (unlit, no fog). */
export function createSkyDome({ radius = 90, top = 0x4f86c6, horizon = 0xd8e6ef, bottom = 0xb9c4c9 } = {}) {
  const geo = new THREE.SphereGeometry(radius, 24, 12);
  const p = geo.attributes.position;
  const colors = [];
  const c = new THREE.Color();
  const ct = new THREE.Color(top);
  const ch = new THREE.Color(horizon);
  const cb = new THREE.Color(bottom);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / radius;
    if (y >= 0) c.copy(ch).lerp(ct, Math.pow(y, 0.6));
    else c.copy(ch).lerp(cb, Math.min(1, -y * 4));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  dome.name = 'sky';
  dome.renderOrder = -1;
  return dome;
}

// ---------- environment container ----------

/**
 * Every environment returns this shape:
 * { name, group, anchors: { characters: {id: {position, rotationY}}, cameras: {id: {position, target, fov}} },
 *   interactives, update(time), dispose() }
 */
export function createEnvironment(name) {
  const group = new THREE.Group();
  group.name = name;
  const env = {
    name,
    group,
    /** background colour + optional fog [color, near, far]; the renderer host applies it */
    atmosphere: { background: 0x101316, fog: null, exposure: 1 },
    anchors: { characters: {}, cameras: {} },
    interactives: {},
    updaters: [],
    characterAnchor(id, [x, y, z], rotationY = 0) {
      env.anchors.characters[id] = { position: new THREE.Vector3(x, y, z), rotationY };
    },
    cameraPoint(id, position, target, fov = 70) {
      env.anchors.cameras[id] = { position: new THREE.Vector3(...position), target: new THREE.Vector3(...target), fov };
    },
    update(time) {
      for (const f of env.updaters) f(time);
    },
    dispose() {
      group.removeFromParent();
      // characters placed here belong to the caller: detach them, never dispose them
      for (const c of [...group.children]) if (c.userData.external) group.remove(c);
      group.traverse((o) => {
        o.geometry?.dispose();
        if (o.isInstancedMesh) o.dispose();
        o.shadow?.map?.dispose();
      });
    },
  };
  return env;
}

/** Puts a character's root on an anchor of an environment. */
export function placeCharacter(env, character, anchorId) {
  const a = env.anchors.characters[anchorId];
  if (!a) throw new Error(`Unknown anchor ${anchorId} in ${env.name}`);
  character.root.position.copy(a.position);
  character.root.rotation.y = a.rotationY;
  character.root.userData.external = true;
  if (character.root.parent !== env.group) env.group.add(character.root);
}

/** Moves a camera onto a camera point (fov included). */
export function applyCameraPoint(env, camera, id, controls) {
  const c = env.anchors.cameras[id];
  camera.position.copy(c.position);
  camera.fov = c.fov;
  camera.updateProjectionMatrix();
  camera.lookAt(c.target);
  if (controls) controls.target.copy(c.target);
}
