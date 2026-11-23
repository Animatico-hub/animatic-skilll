import * as THREE from 'three';
import { createEnvironment, buildRoom, mountOnWall, mountDoor, ceilingLight, floorMat, PRISON } from './EnvironmentKit.js';
import { createTable } from '../objects/Table.js';
import { createStool } from '../objects/Chair.js';
import { createSteelDoor } from '../objects/PrisonDoor.js';
import { createBarredWindow } from '../objects/MetalBars.js';
import { createSignPlate, createSecurityCamera, createVent } from '../objects/Props.js';
import { createServingCounter, createKitchenHatch, createFoodTray, createWallClock, createTrashBin, createBoard } from '../objects/Fixtures.js';
import { createWallDesk } from '../objects/Table.js';

function drawMenu(ctx, w, h) {
  ctx.fillStyle = '#26302c';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#f2efe6';
  ctx.font = 'bold 40px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CARDÁPIO', w / 2, 52);
  ctx.textAlign = 'left';
  ctx.font = '24px Arial, sans-serif';
  const days = [['SEG', 'Arroz, feijão, frango'], ['TER', 'Macarrão, salsicha'], ['QUA', 'Arroz, feijão, ovo'], ['QUI', 'Sopa de legumes'], ['SEX', 'Arroz, carne moída']];
  days.forEach(([d, f], i) => {
    ctx.fillStyle = '#f2c318';
    ctx.fillText(d, 30, 110 + i * 46);
    ctx.fillStyle = '#e8e6df';
    ctx.fillText(f, 110, 110 + i * 46);
  });
}

/** Refeitório: serving line, bolted tables, high barred windows, uniform light. */
export function createCafeteria() {
  const env = createEnvironment('Refeitório');
  const g = env.group;
  const room = buildRoom(g, {
    x: [-6, 6],
    z: [-4.5, 4.5],
    height: 3.2,
    floor: floorMat(0xcbc8bf),
    doors: [
      { side: 'w', at: 2.6, width: 1.08 },
      { side: 'n', at: 4.0, width: 1.08 },
    ],
  });

  // light: uniform fixture grid + one soft shadow-casting key
  g.add(new THREE.HemisphereLight(0xe6edf2, 0x6a6a66, 0.9));
  for (const x of [-3.8, 0, 3.8]) for (const z of [-2.2, 1.6]) {
    const l = ceilingLight({ length: 1.2, type: 'point', intensity: 7, cage: false });
    l.group.position.set(x, room.height, z);
    g.add(l.group);
  }
  const key = new THREE.DirectionalLight(0xf3f7ff, 1.1);
  key.position.set(2.5, 9, 4);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 20 });
  g.add(key, key.target);

  // serving line
  const counter = createServingCounter({ length: 5 });
  counter.group.position.set(-1.5, 0, -3.3);
  g.add(counter.group);
  mountOnWall(g, createKitchenHatch({ width: 4, height: 1.1 }), room, 's', -1.5, 1.45);
  const sign = createSignPlate('REFEITÓRIO', { width: 1.4, height: 0.26, bg: 0x2a5a7a });
  mountOnWall(g, sign, room, 's', -1.5, 2.55);
  for (let i = 0; i < 4; i++) {
    const t = createFoodTray({ empty: true, color: 0x9b8a6e });
    t.position.set(1.4, counter.height + 0.02 * i, -3.3);
    g.add(t);
  }

  // tables with trays
  const tables = [];
  let seed = 1;
  for (const x of [-3.8, 0, 3.8]) for (const z of [0.0, 2.8]) {
    const t = createTable({ length: 2.4 });
    t.group.position.set(x, 0, z);
    g.add(t.group);
    tables.push(t);
    for (const [dx, dz] of [[-0.6, -0.2], [0.55, 0.2], [0.1, -0.2]]) {
      if ((seed += 1) % 3 === 0) continue;
      const tray = createFoodTray({ seed });
      tray.position.set(x + dx, t.surface.y, z + dz);
      tray.rotation.y = dz < 0 ? 0 : Math.PI;
      g.add(tray);
    }
  }

  // walls: windows, clock, menu, doors, camera, guard station
  for (const z of [-2.5, 0.5, 3.0]) mountOnWall(g, createBarredWindow({ width: 1.0, height: 0.45 }), room, 'e', z, 2.55);
  const clock = createWallClock();
  mountOnWall(g, clock.group, room, 's', 3.6, 2.45);
  mountOnWall(g, createBoard('menu', drawMenu, { width: 1.1, height: 0.75 }), room, 's', 3.6, 1.55);
  mountOnWall(g, createVent({ width: 0.6, height: 0.3 }), room, 'w', -2.5, 2.7);
  const cam = createSecurityCamera();
  mountOnWall(g, cam.group, room, 'n', -5.5, 2.8);
  cam.group.rotation.y += 0.6;
  const toCorridor = mountDoor(g, createSteelDoor({ label: 'BLOCO C' }), room, 'w', 2.6);
  const toYard = mountDoor(g, createSteelDoor({ label: 'PÁTIO', color: 0xb9c6b0 }), room, 'n', 4.0);
  for (const [x, z] of [[-5.5, 3.9], [5.5, -4.0]]) {
    const bin = createTrashBin();
    bin.position.set(x, 0, z);
    g.add(bin);
  }
  const desk = createWallDesk({ width: 0.8, depth: 0.4, height: 1.0 });
  mountOnWall(g, desk.group, room, 'e', -1.0, 0);
  const stool = createStool({ height: 0.7 });
  stool.group.position.set(5.35, 0, -1.0);
  g.add(stool.group);

  env.interactives = { doors: { corridor: toCorridor, yard: toYard }, clock };
  env.updaters.push((t) => {
    cam.led.visible = Math.floor(t * 1.2) % 2 === 0;
    clock.setTime(12.25 + t / 3600);
  });

  // ---- anchors (seats face the table centre) ----
  env.characterAnchor('protagonist_line', [0.3, 0, -2.1], Math.PI);
  env.characterAnchor('server', [-1.5, 0, -4.05], 0);
  env.characterAnchor('queue_1', [1.1, 0, -2.1], Math.PI * 0.9);
  env.characterAnchor('queue_2', [1.9, 0, -1.9], Math.PI * 0.9);
  env.characterAnchor('cellmate_table_stand', [0.7, 0, -0.95], 0.3);
  env.characterAnchor('seat_across', [0.0, 0, -0.68], 0);
  env.characterAnchor('seat_near', [0.0, 0, 0.68], Math.PI);
  env.characterAnchor('guard_watch', [5.2, 0, -0.2], -Math.PI / 2);
  env.characterAnchor('mysterious_corner', [-5.3, 0, -3.9], 0.7);
  env.characterAnchor('protagonist_entrance', [-5.5, 0, 2.6], Math.PI / 2);

  // ---- cameras ----
  env.cameraPoint('pov_line', [0.6, 1.62, -1.75], [-1.6, 1.0, -3.4], 70);
  env.cameraPoint('pov_table', [0.15, 1.22, 0.9], [0.0, 1.15, -1.5], 70);
  env.cameraPoint('pov_entrance', [-5.5, 1.62, 2.6], [1.5, 1.2, -1.0], 70);
  env.cameraPoint('wide', [5.4, 2.8, 4.1], [-2.0, 0.8, -1.5], 70);
  return env;
}
