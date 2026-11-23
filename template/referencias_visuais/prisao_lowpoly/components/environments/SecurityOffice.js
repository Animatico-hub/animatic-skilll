import * as THREE from 'three';
import { createEnvironment, buildRoom, mountOnWall, mountDoor, ceilingLight, floorMat, wallMat, PRISON } from './EnvironmentKit.js';
import { createSteelDoor } from '../objects/PrisonDoor.js';
import { createBarredWindow } from '../objects/MetalBars.js';
import { createChair } from '../objects/Chair.js';
import { createSignPlate } from '../objects/Props.js';
import { createWallClock, createTrashBin, createBoard } from '../objects/Fixtures.js';
import { createMonitorWall, createConsoleDesk, createKeyCabinet, createFilingCabinet, createAlarmBeacon } from '../objects/SecurityEquipment.js';

function drawRoster(ctx, w, h) {
  ctx.fillStyle = '#b89a6a';
  ctx.fillRect(0, 0, w, h);
  const papers = [[20, 20, 150, 190, '#f3f0e6'], [190, 30, 140, 110, '#fdf6c8'], [345, 18, 150, 200, '#f3f0e6'], [200, 160, 130, 130, '#e9f1f6']];
  for (const [x, y, pw, ph, c] of papers) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, pw, ph);
    ctx.fillStyle = 'rgba(40,40,40,0.55)';
    for (let i = 0; i < Math.floor(ph / 22) - 1; i++) ctx.fillRect(x + 12, y + 30 + i * 20, pw - 24 - (i % 3) * 18, 5);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(x + pw / 2, y + 8, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#222';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText('ESCALA DE PLANTÃO', 28, 44);
}

/** Posto de segurança: CCTV wall, console, key cabinet, cold dim light + monitor glow. */
export function createSecurityOffice() {
  const env = createEnvironment('Posto de segurança');
  const g = env.group;
  const room = buildRoom(g, {
    x: [-2.6, 2.6],
    z: [-2.2, 2.2],
    height: 2.75,
    dado: 1.0,
    low: wallMat(0x7d9fb5),
    floor: floorMat(PRISON.corridorFloor),
    doors: [{ side: 'w', at: 1.2, width: 1.08 }],
    stripe: 0x3b5d73,
  });

  g.add(new THREE.HemisphereLight(0xc9d6e2, 0x3e4348, 0.45));
  const lamp = ceilingLight({ length: 1.2, type: 'spot', intensity: 9, castShadow: true, angle: 1.2, ownMaterial: true, color: 0xe2ecff });
  lamp.group.position.set(0.3, room.height, 0.2);
  g.add(lamp.group);
  const glow = new THREE.PointLight(0x9cc3ff, 2.2, 0, 2);
  glow.position.set(0, 1.5, -1.5);
  g.add(glow);

  // monitor wall + console
  const monitors = createMonitorWall({ cols: 3, rows: 2 });
  mountOnWall(g, monitors.group, room, 's', 0, 1.78);
  const consoleDesk = createConsoleDesk({ length: 2.6 });
  mountOnWall(g, consoleDesk.group, room, 's', 0, 0);
  const chair = createChair();
  chair.group.position.set(0.25, 0, -1.15);
  chair.group.rotation.y = Math.PI + 0.25;
  const chair2 = createChair();
  chair2.group.position.set(-1.6, 0, 0.6);
  chair2.group.rotation.y = 2.2;
  g.add(chair.group, chair2.group);

  // walls
  mountOnWall(g, createBarredWindow({ width: 2.4, height: 0.85, sky: 0x8aa2b0 }), room, 'n', 0.4, 1.6);
  mountOnWall(g, createKeyCabinet(), room, 'e', -1.0, 1.5);
  for (const z of [0.4, 0.95]) mountOnWall(g, createFilingCabinet(), room, 'e', z, 0);
  mountOnWall(g, createBoard('roster', drawRoster, { width: 1.0, height: 0.6, frame: 0x6b4f2e }), room, 'w', -0.9, 1.55);
  const clock = createWallClock({ radius: 0.15 });
  mountOnWall(g, clock.group, room, 'w', -0.9, 2.3);
  const alarm = createAlarmBeacon();
  mountOnWall(g, alarm.group, room, 's', 2.2, 2.45);
  const door = mountDoor(g, createSteelDoor({ label: 'SEGURANÇA', color: 0xa9b5bf }), room, 'w', 1.2);
  mountOnWall(g, createSignPlate('POSTO 2', { width: 0.4, height: 0.14 }), room, 'n', -1.6, 2.3);
  const bin = createTrashBin({ color: 0x3a3f44 });
  bin.position.set(1.9, 0, -1.6);
  bin.scale.setScalar(0.7);
  g.add(bin);

  env.interactives = { monitors, alarm, light: lamp, door, flicker: false };
  env.updaters.push((t) => {
    monitors.update(t);
    alarm.update(t);
    clock.setTime(23.7 + t / 3600);
    if (env.interactives.flicker) {
      const f = Math.sin(t * 13.1) * Math.sin(t * 7.3) * Math.sin(t * 2.1);
      lamp.setLevel(f > 0.55 ? 0.15 : 1);
    }
  });
  const baseDispose = env.dispose;
  env.dispose = () => {
    monitors.dispose();
    baseDispose();
  };

  // ---- anchors ----
  env.characterAnchor('guard_seated', [0.25, 0, -1.15], Math.PI + 0.25);
  env.characterAnchor('guard_standing', [1.3, 0, -0.5], -2.7);
  env.characterAnchor('protagonist_door', [-2.1, 0, 1.2], Math.PI / 2);
  env.characterAnchor('visitor', [-1.2, 0, 1.4], 2.4);

  // ---- cameras ----
  env.cameraPoint('pov_door', [-2.2, 1.62, 1.2], [0.4, 1.35, -2.0], 70);
  env.cameraPoint('monitors', [0.25, 1.5, -0.55], [0.0, 1.72, -2.2], 60);
  env.cameraPoint('over_shoulder', [1.0, 1.8, 0.1], [-0.3, 1.35, -2.2], 65);
  env.cameraPoint('wide', [2.3, 2.45, 2.0], [-0.8, 0.9, -1.4], 75);
  return env;
}
