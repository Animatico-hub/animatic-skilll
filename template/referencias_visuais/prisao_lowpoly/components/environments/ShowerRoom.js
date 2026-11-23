import * as THREE from 'three';
import { createEnvironment, buildRoom, mountOnWall, mountDoor, ceilingLight, worldBox, tileMat, wallMat, PRISON, TILE } from './EnvironmentKit.js';
import { createSteelDoor } from '../objects/PrisonDoor.js';
import { createMirror, createSignPlate, createVent, createFloorDrain, createSandals } from '../objects/Props.js';
import { createShowerUnit, createWallSink, createStallRow, createBench, createWetFloorSign, createLockers } from '../objects/Fixtures.js';
import { mesh } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';

/** Banheiros e chuveiros: tiled walls, shower row, stalls, sinks, cold green-white light. */
export function createShowerRoom() {
  const env = createEnvironment('Banheiros e chuveiros');
  const g = env.group;
  const room = buildRoom(g, {
    x: [-3.6, 3.6],
    z: [-3, 3],
    height: 2.8,
    dado: 2.0,
    low: tileMat(0xf4f6f5, 0.3),
    lowTile: TILE.ceramic,
    high: wallMat(PRISON.blockWhite),
    floor: tileMat(0x8b979d, 0.35),
    floorTile: [0.6, 0.6],
    doors: [{ side: 'n', at: -1.6, width: 1.08 }],
    stripe: 0x3f7fa8,
  });

  g.add(new THREE.HemisphereLight(0xe2f2ec, 0x5e6b68, 0.8));
  const lamp = ceilingLight({ length: 1.2, type: 'spot', intensity: 16, castShadow: true, angle: 1.25, ownMaterial: true, color: 0xe4fff2, cage: true });
  lamp.group.position.set(0, room.height, 0);
  g.add(lamp.group);
  for (const x of [-2.4, 2.4]) {
    const l = ceilingLight({ length: 1.0, type: 'point', intensity: 4, color: 0xe4fff2, cage: true });
    l.group.position.set(x, room.height, -1.5);
    g.add(l.group);
  }

  // shower row on the back wall, separated by tiled half walls
  const showers = [];
  const xs = [-2.8, -1.4, 0, 1.4, 2.8];
  xs.forEach((x) => {
    const s = createShowerUnit();
    mountOnWall(g, s.group, room, 's', x, 0);
    showers.push(s);
  });
  const tiles = tileMat(0xf4f6f5, 0.3);
  for (const x of [-2.1, -0.7, 0.7, 2.1]) g.add(worldBox([x - 0.05, x + 0.05], [0, 1.8], [-3, -2.15], tiles, TILE.ceramic));
  g.add(worldBox([-3.6, 3.6], [0.001, 0.006], [-2.12, -1.98], mat(0x2d3336, { roughness: 0.4, metalness: 0.4 }), TILE.block, { cast: false }));
  for (const x of [-2.1, 0.7]) {
    const d = createFloorDrain();
    d.position.set(x + 0.7, 0, -2.6);
    g.add(d);
  }

  // stalls on the west wall, sinks + mirrors on the east wall
  const stalls = createStallRow({ count: 3 });
  mountOnWall(g, stalls.group, room, 'w', 0.45, 0);
  for (const z of [-1.4, -0.2, 1.0]) {
    mountOnWall(g, createWallSink(), room, 'e', z, 0);
    mountOnWall(g, createMirror({ width: 0.42, height: 0.5 }), room, 'e', z, 1.45);
  }

  // centre bench, lockers by the door, cleaning gear
  const bench = createBench({ length: 1.8 });
  bench.position.set(0.4, 0, 0.5);
  g.add(bench);
  const towel = mesh(new THREE.BoxGeometry(0.4, 0.04, 0.3), mat(0xd9d4c6, { roughness: 1 }));
  towel.position.set(0.9, 0.49, 0.5);
  towel.rotation.y = 0.2;
  const soap = mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), mat(0xe8d36a));
  soap.position.set(-0.2, 0.49, 0.45);
  g.add(towel, soap);
  const flops = createSandals(0x2b2f33);
  flops.position.set(1.6, 0, 0.9);
  g.add(flops);
  mountOnWall(g, createLockers({ count: 4 }), room, 'n', 1.4, 0);
  const sign = createWetFloorSign();
  sign.position.set(-0.6, 0, 1.9);
  sign.rotation.y = 0.5;
  g.add(sign);
  const bucket = mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.3, 8), mat(0xe2b520, { roughness: 0.5 }));
  bucket.position.set(-0.2, 0.15, 2.5);
  const mop = mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), mat(0x8a6a48));
  mop.position.set(-0.1, 0.75, 2.6);
  mop.rotation.z = 0.25;
  g.add(bucket, mop);
  mountOnWall(g, createVent({ width: 0.5, height: 0.25 }), room, 's', 0, 2.45);
  const door = mountDoor(g, createSteelDoor({ label: 'CHUVEIROS', color: 0xa9c2c9 }), room, 'n', -1.6);
  mountOnWall(g, createSignPlate('WC', { width: 0.24, height: 0.14 }), room, 'w', 2.2, 2.2);

  env.interactives = { showers, stalls: stalls.doors, door, light: lamp, flicker: false };
  showers[1].setOn(true);
  showers[3].setOn(true);
  env.updaters.push((t) => {
    for (const s of showers) s.update(t);
    if (env.interactives.flicker) {
      const f = Math.sin(t * 13.1) * Math.sin(t * 7.3) * Math.sin(t * 2.1);
      lamp.setLevel(f > 0.55 ? 0.15 : 1);
    }
  });
  stalls.doors[2].setOpen(0.6);

  // ---- anchors ----
  xs.forEach((x, i) => env.characterAnchor('shower_' + (i + 1), [x, 0, -2.5], 0));
  env.characterAnchor('sink_1', [3.05, 0, -1.4], -Math.PI / 2);
  env.characterAnchor('sink_2', [3.05, 0, -0.2], -Math.PI / 2);
  env.characterAnchor('bench_stand', [0.4, 0, 1.1], Math.PI);
  env.characterAnchor('stall_front', [-1.6, 0, 1.4], -Math.PI / 2);
  env.characterAnchor('protagonist_entrance', [-1.6, 0, 2.5], Math.PI);
  env.characterAnchor('guard_door', [-0.6, 0, 2.6], Math.PI + 0.4);

  // ---- cameras ----
  env.cameraPoint('pov_entrance', [-1.6, 1.62, 2.6], [0.9, 1.15, -2.6], 70);
  env.cameraPoint('pov_shower', [0, 1.62, -2.3], [-0.6, 1.3, 3], 70);
  env.cameraPoint('pov_sink', [2.6, 1.62, 0.3], [-3.0, 1.1, 0.8], 70);
  env.cameraPoint('stall_peek', [0.4, 1.62, 2.5], [-3.0, 1.05, 0.4], 70);
  env.cameraPoint('wide', [3.2, 2.5, 2.7], [-1.5, 0.8, -1.5], 75);
  return env;
}
