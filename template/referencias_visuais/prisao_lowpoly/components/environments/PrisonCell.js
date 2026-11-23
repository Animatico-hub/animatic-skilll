import * as THREE from 'three';
import { createEnvironment } from './EnvironmentKit.js';
import { buildCellBlock, CELL } from './CellBlock.js';
import { createBunkBed } from '../objects/BunkBed.js';
import { createWallDesk } from '../objects/Table.js';
import { createStool } from '../objects/Chair.js';
import { createBarredWindow } from '../objects/MetalBars.js';
import {
  createToiletSink,
  createMirror,
  createShelf,
  createWallPaper,
  createTallyMarks,
  createVent,
  createFloorDrain,
  createDeskClutter,
  createSandals,
} from '../objects/Props.js';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';

/**
 * Cela 13: the protagonist's cell, flanked by cells 46 and 48, with the corridor in front.
 * Interactives: door (setOpen), light (setLevel), flicker (bool), neighbours' doors.
 */
export function createCell47() {
  const env = createEnvironment('Cela 13');
  const g = env.group;
  const { width: W, depth: D } = CELL;
  const xL = -W / 2;
  const xR = W / 2;

  g.add(new THREE.HemisphereLight(0xdde7ef, 0x5d6166, 0.75));
  const block = buildCellBlock(g, { numbers: [46, 47, 48], main: 47 });
  const cell = block.cells[47];

  // ---- furniture ----
  const bunk = createBunkBed({ seed: 47, messy: [true, false], blanket: 0x67756f });
  bunk.group.position.set(xL + 0.43, 0, -D + 1.0);
  g.add(bunk.group);

  const wc = createToiletSink();
  wc.position.set(0.85, 0, -D);
  const mirror = createMirror();
  mirror.position.set(0.85, 1.45, -D);
  g.add(wc, mirror);

  const onRightWall = (obj, y, z) => {
    obj.rotation.y = -Math.PI / 2;
    obj.position.set(xR, y, z);
    g.add(obj);
    return obj;
  };
  const onLeftWall = (obj, y, z) => {
    obj.rotation.y = Math.PI / 2;
    obj.position.set(xL, y, z);
    g.add(obj);
    return obj;
  };
  const onBackWall = (obj, x, y) => {
    obj.position.set(x, y, -D);
    g.add(obj);
    return obj;
  };

  const desk = createWallDesk({ width: 0.9 });
  onRightWall(desk.group, 0, -1.65);
  const clutter = createDeskClutter(47);
  onRightWall(clutter, desk.surface.y, -1.65);
  clutter.position.x = xR - desk.surface.z;
  const cup = mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.09, 8), mat(0xd9d4c4, { roughness: 0.7 }));
  cup.position.set(xR - 0.12, desk.surface.y + 0.045, -1.35);
  g.add(cup);
  const stool = createStool();
  stool.group.position.set(xR - 0.55, 0, -1.65);
  g.add(stool.group);
  onRightWall(createShelf({ width: 0.8, seed: 47 }), 1.42, -1.65);

  onBackWall(createBarredWindow({ width: 0.62, height: 0.26, depth: 0.08 }), -0.1, 2.2);
  onBackWall(createVent({ width: 0.4, height: 0.24 }), -0.95, 2.5);

  // ---- personal story details ----
  onRightWall(createWallPaper('house', { rotation: 0.05 }), 1.45, -2.55);
  onRightWall(createWallPaper('calendar', { width: 0.24, rotation: -0.03 }), 1.5, -2.95);
  onRightWall(createWallPaper('rules', { width: 0.22 }), 1.5, -0.55);
  onLeftWall(createWallPaper('photo', { width: 0.16, rotation: -0.08 }), 0.95, -3.15);
  onLeftWall(createTallyMarks(23), 0.78, -2.35);

  const drain = createFloorDrain();
  drain.position.set(0.25, 0, -3.05);
  const sandals = createSandals();
  sandals.position.set(-0.45, 0, -1.4);
  sandals.rotation.y = 0.3;
  const book = mesh(new THREE.BoxGeometry(0.15, 0.03, 0.22), mat(0x6b2f2a, { roughness: 0.8 }));
  book.position.set(-0.75, 1.62, -2.0);
  book.rotation.y = 0.4;
  g.add(drain, sandals, book);

  // ---- interactives ----
  const lamp = cell.lamp;
  env.interactives = {
    door: cell.door,
    light: lamp,
    flicker: false,
    neighbourDoors: { 46: block.cells[46].door, 48: block.cells[48].door },
    steelDoor: block.steelDoor,
  };
  env.updaters.push((t) => {
    block.fan.blades.rotation.z = t * 14;
    block.camera.led.visible = Math.floor(t * 1.2) % 2 === 0;
    if (env.interactives.flicker) {
      const f = Math.sin(t * 13.1) * Math.sin(t * 7.3) * Math.sin(t * 2.1);
      lamp.setLevel(f > 0.55 ? 0.15 : f > 0.45 ? 0.6 : 1);
    }
  });

  // ---- anchors (character feet + facing) ----
  env.characterAnchor('protagonist_center', [0.1, 0, -1.5], 0);
  env.characterAnchor('protagonist_bars', [0.3, 0, -0.45], 0);
  env.characterAnchor('cellmate_stand', [0.6, 0, -2.0], -2.0);
  env.characterAnchor('cellmate_confront', [0.45, 0, -1.7], 0.2);
  env.characterAnchor('cellmate_desk', [0.65, 0, -1.65], Math.PI / 2);
  env.characterAnchor('cellmate_bunk_sit', [-0.5, 0, -2.4], Math.PI / 2);
  env.characterAnchor('guard_corridor', [0.75, 0, 1.0], Math.PI);
  env.characterAnchor('guard_patrol_left', [-3.0, 0, 1.4], Math.PI / 2);
  env.characterAnchor('guard_patrol_right', [3.0, 0, 1.4], -Math.PI / 2);
  env.characterAnchor('neighbour_46', [-2.6, 0, -0.55], 0.25);
  env.characterAnchor('neighbour_48', [2.6, 0, -0.55], -0.3);

  // ---- camera points (position, target, vertical fov) ----
  env.cameraPoint('pov_entry', [0.75, 1.62, -0.3], [-0.25, 1.05, -3.4], 70);
  env.cameraPoint('pov_back', [-0.1, 1.62, -3.2], [0.2, 1.3, 1.5], 70);
  env.cameraPoint('pov_bunk_lower', [-0.72, 1.08, -2.55], [1.3, 1.0, -1.5], 70);
  env.cameraPoint('pov_bunk_upper', [-0.82, 1.98, -3.05], [0.7, 1.35, 0.2], 70);
  env.cameraPoint('pov_bars', [0.55, 1.62, -0.6], [-2.4, 1.35, 2.0], 70);
  env.cameraPoint('corridor_look_in', [2.3, 1.85, 2.15], [-0.35, 0.95, -1.8], 60);
  env.cameraPoint('overview', [3.1, 2.45, 2.2], [-0.6, 0.6, -1.9], 75);
  return env;
}
