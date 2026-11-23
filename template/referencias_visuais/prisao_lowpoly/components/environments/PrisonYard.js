import * as THREE from 'three';
import { createEnvironment, worldBox, wallMat, floorMat, createSkyDome, PRISON, TILE } from './EnvironmentKit.js';
import { createBarredWindow } from '../objects/MetalBars.js';
import { createSteelDoor } from '../objects/PrisonDoor.js';
import { createTable } from '../objects/Table.js';
import { createSignPlate, createSecurityCamera } from '../objects/Props.js';
import {
  createChainLinkFence,
  createRazorWire,
  createWatchtower,
  createFloodlightPole,
  createBasketballHoop,
  createPullUpBars,
  createWeightBench,
  createFenceGate,
} from '../objects/YardStructures.js';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';

const X = 16;
const Z = 12;
const WALL_H = 4;

/** Pátio: walled yard behind Bloco C, court, workout corner, watchtower, daylight. */
export function createPrisonYard() {
  const env = createEnvironment('Pátio');
  const g = env.group;
  env.atmosphere = { background: 0xd8e6ef, fog: [0xd8e6ef, 45, 120], exposure: 1 };
  g.add(createSkyDome());

  // ---- ground ----
  const dirt = floorMat(0xb3a487);
  g.add(worldBox([-80, 80], [-0.2, -0.02], [-80, 80], floorMat(0x7f8c5a), [3, 3], { cast: false, name: 'outside' }));
  g.add(worldBox([-X, X], [-0.1, 0], [-Z, Z], dirt, [2.4, 2.4], { cast: false, name: 'yardGround' }));
  g.add(worldBox([-X, X], [0, 0.03], [-Z, -8.5], floorMat(0xc9cccb), TILE.floor, { cast: false, name: 'walkway' }));
  const court = { x0: 2, x1: 14, z0: -4.2, z1: 8 };
  g.add(worldBox([court.x0, court.x1], [0, 0.02], [court.z0, court.z1], floorMat(0x5b6266), TILE.floor, { cast: false, name: 'court' }));
  const paint = mat(0xf1f1ec, { roughness: 0.7 });
  const line = (x0, x1, z0, z1) => g.add(worldBox([x0, x1], [0.02, 0.026], [z0, z1], paint, TILE.block, { cast: false }));
  const cx = (court.x0 + court.x1) / 2;
  line(court.x0 + 0.4, court.x1 - 0.4, court.z0 + 0.35, court.z0 + 0.4);
  line(court.x0 + 0.4, court.x1 - 0.4, court.z1 - 0.45, court.z1 - 0.4);
  line(court.x0 + 0.35, court.x0 + 0.4, court.z0 + 0.35, court.z1 - 0.4);
  line(court.x1 - 0.4, court.x1 - 0.35, court.z0 + 0.35, court.z1 - 0.4);
  line(cx - 1.8, cx - 1.75, court.z0 + 0.4, court.z0 + 6.0);
  line(cx + 1.75, cx + 1.8, court.z0 + 0.4, court.z0 + 6.0);
  line(cx - 1.8, cx + 1.8, court.z0 + 5.95, court.z0 + 6.0);
  const ring = (r, start, len) => {
    const m = mesh(new THREE.RingGeometry(r - 0.05, r, 32, 1, start, len), paint, { cast: false });
    m.rotation.x = -Math.PI / 2;
    m.position.set(cx, 0.027, court.z0 + 6.0);
    g.add(m);
  };
  ring(1.8, 0, Math.PI * 2);
  const arc = mesh(new THREE.RingGeometry(6.0, 6.05, 40, 1, Math.PI * 1.05, Math.PI * 0.9), paint, { cast: false });
  arc.rotation.x = -Math.PI / 2;
  arc.position.set(cx, 0.027, court.z0 + 1.2);
  g.add(arc);

  // ---- cell block facade (south) ----
  const facade = wallMat(PRISON.blockGray);
  g.add(worldBox([-X - 0.4, X + 0.4], [0, 8.5], [-Z - 2, -Z], facade, TILE.block, { name: 'facade' }));
  g.add(worldBox([-X - 0.4, X + 0.4], [8.5, 8.8], [-Z - 2.1, -Z + 0.1], mat(0x8d9396), TILE.block));
  g.add(worldBox([-X - 0.4, X + 0.4], [0, 1.2], [-Z, -Z + 0.02], wallMat(PRISON.blockBlue), TILE.block, { cast: false }));
  for (let x = -X + 2; x <= X - 2; x += 2.8) {
    for (const y of [3.4, 6.2]) {
      if (Math.abs(x + 6) < 1.6 && y < 4) continue;
      const w = createBarredWindow({ width: 0.62, height: 0.26, sky: 0x39434a });
      w.position.set(x, y, -Z);
      g.add(w);
    }
  }
  const door = createSteelDoor({ label: 'BLOCO C' });
  door.group.position.set(-6, 0, -Z + 0.06);
  g.add(door.group);
  const canopy = mesh(new THREE.BoxGeometry(2.2, 0.12, 1.3), mat(0x7b8286));
  canopy.position.set(-6, 2.6, -Z + 0.65);
  g.add(canopy);
  const sign = createSignPlate('PÁTIO', { width: 0.8, height: 0.22, bg: 0x2a5a7a });
  sign.position.set(-6, 3.0, -Z);
  g.add(sign);
  const cam = createSecurityCamera();
  cam.group.position.set(-4.4, 3.2, -Z);
  cam.group.rotation.y = 0.5;
  g.add(cam.group);

  // ---- perimeter walls with fence + razor wire (west, east, north) ----
  const perim = wallMat(PRISON.blockGray);
  const runs = [
    { name: 'w', box: [[-X - 0.4, -X], [0, WALL_H], [-Z, Z + 0.4]], at: [-X - 0.2, Z], rot: Math.PI / 2, len: 2 * Z },
    { name: 'e', box: [[X, X + 0.4], [0, WALL_H], [-Z, Z + 0.4]], at: [X + 0.2, Z], rot: Math.PI / 2, len: 2 * Z },
  ];
  for (const r of runs) {
    g.add(worldBox(...r.box, perim, TILE.block));
    const f = createChainLinkFence({ length: r.len, height: 1.8 });
    f.rotation.y = r.rot;
    f.position.set(r.at[0], WALL_H, 0);
    const wire = createRazorWire({ length: r.len });
    wire.rotation.y = r.rot;
    wire.position.set(r.at[0], WALL_H + 2.05, 0);
    g.add(f, wire);
  }
  // north wall with a gate opening (4 m) at x = -9
  const gateX = -9;
  const north = [[-X - 0.4, gateX - 2.1], [gateX + 2.1, X + 0.4]];
  for (const [a, b] of north) {
    g.add(worldBox([a, b], [0, WALL_H], [Z, Z + 0.4], perim, TILE.block));
    const f = createChainLinkFence({ length: b - a, height: 1.8 });
    f.position.set((a + b) / 2, WALL_H, Z + 0.2);
    const wire = createRazorWire({ length: b - a });
    wire.position.set((a + b) / 2, WALL_H + 2.05, Z + 0.2);
    g.add(f, wire);
  }
  g.add(worldBox([gateX - 2.1, gateX + 2.1], [WALL_H + 0.6, WALL_H + 1.0], [Z, Z + 0.4], perim, TILE.block));
  const gate = createFenceGate({ width: 4.2, height: WALL_H + 0.55 });
  gate.group.position.set(gateX, 0, Z + 0.25);
  g.add(gate.group);
  const yellow = mat(PRISON.safetyYellow, { roughness: 0.6 });
  g.add(worldBox([gateX - 2.1, gateX + 2.1], [0, 0.02], [Z - 1.2, Z - 1.0], yellow, TILE.block, { cast: false }));

  // ---- yard furniture ----
  const tower = createWatchtower();
  tower.group.position.set(X - 2.2, 0, Z - 2.2);
  g.add(tower.group);
  const hoop = createBasketballHoop();
  hoop.position.set(cx, 0, court.z0 + 0.9);
  g.add(hoop);
  const bars = createPullUpBars();
  bars.position.set(-11, 0, 1.0);
  const benchW = createWeightBench();
  benchW.position.set(-8, 0, 2.5);
  benchW.rotation.y = 0.3;
  g.add(bars, benchW);
  const concrete = 0xa9adab;
  for (const [x, z, r] of [[-9, 7.5, 0.1], [-4, 8.5, -0.2], [-12.5, -4, 1.4]]) {
    const t = createTable({ length: 2.0, color: concrete, topColor: 0xbcbfbd });
    t.group.position.set(x, 0, z);
    t.group.rotation.y = r;
    g.add(t.group);
  }
  const lamps = [];
  for (const [x, z, r] of [[-X + 0.8, -2, Math.PI / 2], [X - 0.8, -2, -Math.PI / 2], [0, Z - 0.8, Math.PI]]) {
    const p = createFloodlightPole();
    p.group.position.set(x, 0, z);
    p.group.rotation.y = r;
    g.add(p.group);
    lamps.push(p);
  }
  // trees outside the walls for depth
  const trunk = mat(0x6b5136);
  const leaves = [mat(0x4f7a3a), mat(0x5d8a45), mat(0x47703a)];
  for (let i = 0; i < 14; i++) {
    const x = -30 + i * 4.6 + (i % 3) * 1.3;
    const z = Z + 8 + (i % 4) * 3.5;
    const tr = mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.6, 5), trunk);
    tr.position.set(x, 1.3, z);
    const crown = mesh(new THREE.ConeGeometry(2 + (i % 3) * 0.4, 5 + (i % 2) * 1.5, 6), leaves[i % 3]);
    crown.position.set(x, 5, z);
    g.add(tr, crown);
  }

  // ---- light: sun + sky ----
  g.add(new THREE.HemisphereLight(0xc4ddf2, 0x8a7d66, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0d8, 2.8);
  sun.position.set(-14, 24, 14);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.04;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 70 });
  g.add(sun, sun.target);

  env.interactives = {
    gate,
    door,
    floodlights: { setOn: (on) => lamps.forEach((l) => l.setOn(on)) },
    sun,
  };
  env.updaters.push((t) => {
    cam.led.visible = Math.floor(t * 1.2) % 2 === 0;
  });

  // ---- anchors ----
  env.characterAnchor('protagonist_exit', [-6, 0, -Z + 1.2], 0);
  env.characterAnchor('cellmate_court', [cx - 1.2, 0, 2.2], Math.PI - 0.3);
  env.characterAnchor('player_1', [cx + 1.5, 0, 4.0], Math.PI + 0.6);
  env.characterAnchor('player_2', [cx - 2.5, 0, 5.0], 2.6);
  env.characterAnchor('workout', [-10.4, 0, 1.4], 0.3);
  env.characterAnchor('guard_tower', [X - 2.2, tower.floorY, Z - 2.2], -2.4);
  env.characterAnchor('guard_patrol', [-2, 0, -8.6], 0.6);
  env.characterAnchor('guard_gate', [gateX + 2.6, 0, Z - 1.4], Math.PI);
  env.characterAnchor('mysterious_wall', [-X + 0.5, 0, Z - 1.2], 2.3);

  // ---- cameras ----
  env.cameraPoint('pov_exit', [-6, 1.62, -Z + 1.4], [2, 1.4, 4], 70);
  env.cameraPoint('pov_court', [cx - 1.0, 1.62, 6.5], [cx, 2.6, court.z0 + 0.9], 70);
  env.cameraPoint('pov_corner', [-X + 3.8, 1.62, Z - 4.0], [-X + 0.5, 1.4, Z - 1.0], 70);
  env.cameraPoint('tower_view', [X - 2.3, tower.floorY + 1.6, Z - 3.1], [0, 0, -2], 60);
  env.cameraPoint('wide', [-X + 2, 6.5, Z - 1.5], [4, 0, -4], 70);
  return env;
}
