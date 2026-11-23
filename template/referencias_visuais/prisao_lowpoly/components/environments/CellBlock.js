import * as THREE from 'three';
import { mat } from '../../lib/materials.js';
import { worldBox, wallMat, floorMat, ceilingMat, PRISON, TILE, ceilingLight } from './EnvironmentKit.js';
import { createBarPanel, barSteel } from '../objects/MetalBars.js';
import { createSlidingBarDoor, createSteelDoor } from '../objects/PrisonDoor.js';
import { createBunkBed } from '../objects/BunkBed.js';
import { createToiletSink, createSignPlate, createExtinguisher, createWallFan, createSecurityCamera, createExitSign, createVent } from '../objects/Props.js';

/**
 * Shared cell-block dimensions (metres). Cells open toward +Z onto the corridor.
 * Cell interior: x in [cx - W/2, cx + W/2], z in [-DEPTH, 0]; bars on z = 0.
 */
export const CELL = { width: 2.6, depth: 3.6, height: 2.75, wall: 0.2, barsH: 2.3, pitch: 2.8, corridor: 2.6 };

/**
 * One cell module (left wall, back wall, floor, ceiling, bars, sliding door, number).
 * Built in world coordinates so block courses stay continuous across modules.
 */
export function buildCellModule(parent, cx, number, { furnishedBasics = false, light = 'dim' } = {}) {
  const { width: W, depth: D, height: H, wall: T, barsH } = CELL;
  const x0 = cx - W / 2;
  const x1 = cx + W / 2;
  const white = wallMat(PRISON.blockWhite);
  parent.add(
    worldBox([x0, x1], [-0.1, 0], [-D, 0], floorMat(PRISON.cellFloor), TILE.floor, { cast: false, name: 'cellFloor' }),
    worldBox([x0 - T, x1 + T], [0, H], [-D - T, -D], white, TILE.block, { name: 'backWall' }),
    worldBox([x0 - T, x0], [0, H], [-D, 0.15], white, TILE.block, { name: 'sideWall' }),
    worldBox([x0, x1], [H, H + 0.15], [-D, 0.12], ceilingMat(), TILE.block, { cast: false, name: 'ceiling' }),
    worldBox([x0, x1], [barsH + 0.03, H], [-0.12, 0.12], white, TILE.block, { name: 'header' }),
  );
  const track = worldBox([x0, x1], [barsH + 0.005, barsH + 0.035], [0.05, 0.11], barSteel(), TILE.block, { name: 'doorTrack' });
  parent.add(track);

  const doorW = 1.08;
  const fixedW = W - doorW + 0.02;
  const bars = createBarPanel({ width: fixedW, height: barsH, cross: [0.14, 0.98, 1.2] });
  bars.position.set(x0 + fixedW / 2, 0, 0);
  parent.add(bars);
  const door = createSlidingBarDoor({ width: doorW, height: barsH - 0.04, travel: doorW - 0.08 });
  door.group.position.set(x1 - doorW / 2, 0, 0.075);
  parent.add(door.group);

  const plate = createSignPlate(String(number), { width: 0.26, height: 0.16 });
  plate.position.set(cx - 0.3, barsH + 0.22, 0.12);
  parent.add(plate);

  let lamp = null;
  if (light !== 'none') {
    lamp = ceilingLight({
      length: 1.0,
      type: light === 'main' ? 'spot' : light === 'tube' ? 'none' : 'point',
      intensity: light === 'main' ? 14 : 1.6,
      castShadow: light === 'main',
      angle: 1.2,
      ownMaterial: light === 'main',
      cage: true,
    });
    lamp.group.position.set(cx, H, -D / 2);
    parent.add(lamp.group);
  }

  if (furnishedBasics) {
    const bunk = createBunkBed({ seed: number, messy: [number % 2 === 0, true] });
    bunk.group.position.set(x0 + 0.43, 0, -D + 1.0);
    const wc = createToiletSink();
    wc.position.set(cx + 0.85, 0, -D);
    parent.add(bunk.group, wc);
  }
  return { door, lamp, x0, x1 };
}

/**
 * A row of cells plus the corridor in front of them.
 * Returns { cells: {number: module}, lights, fan, camera, steelDoor, bounds }.
 */
export function buildCellBlock(parent, {
  numbers = [46, 47, 48],
  main = 47,
  corridorLights = true,
  shadowAt = [main],
  cellLight = (n) => (n === main ? 'main' : 'dim'),
  pointEvery = 1,
  doorLabel = 'BLOCO C',
} = {}) {
  const { pitch, height: H, wall: T, corridor: C } = CELL;
  const mid = (numbers.length - 1) / 2;
  const cells = {};
  numbers.forEach((n, i) => {
    const cx = (i - mid) * pitch;
    cells[n] = buildCellModule(parent, cx, n, { furnishedBasics: n !== main, light: cellLight(n) });
    cells[n].cx = cx;
  });
  const xMin = -mid * pitch - CELL.width / 2 - T;
  const xMax = mid * pitch + CELL.width / 2;
  const white = wallMat(PRISON.blockWhite);
  const blue = wallMat(PRISON.blockBlue);
  // closing wall of the last cell
  parent.add(worldBox([xMax, xMax + T], [0, H], [-CELL.depth, 0.15], white));

  // corridor shell
  const X0 = xMin;
  const X1 = xMax + T;
  const dado = 1.2;
  parent.add(
    worldBox([X0, X1], [-0.1, 0], [0, C], floorMat(PRISON.corridorFloor), TILE.floor, { cast: false, name: 'corridorFloor' }),
    worldBox([X0, X1], [0, dado], [C, C + T], blue, TILE.block, { name: 'corridorWallLow' }),
    worldBox([X0, X1], [dado, H], [C, C + T], white, TILE.block, { name: 'corridorWallHigh' }),
    worldBox([X0, X1], [dado - 0.02, dado + 0.02], [C - 0.012, C], mat(0x5f8aa3), TILE.block, { cast: false }),
    worldBox([X0, X1], [H, H + 0.15], [0.12, C], ceilingMat(), TILE.block, { cast: false }),
    worldBox([X0, X1], [0.001, 0.004], [0.42, 0.49], mat(PRISON.safetyYellow, { roughness: 0.6 }), TILE.block, { cast: false }),
    // far-left end wall
    worldBox([X0 - T, X0], [0, H], [0, C + T], white),
  );
  // far-right end wall with a steel door opening (door 0.95 wide, centred at z = C/2)
  const dz = C / 2;
  parent.add(
    worldBox([X1, X1 + T], [0, H], [0, dz - 0.54], white),
    worldBox([X1, X1 + T], [0, H], [dz + 0.54, C + T], white),
    worldBox([X1, X1 + T], [2.17, H], [dz - 0.54, dz + 0.54], white),
  );
  const steelDoor = createSteelDoor({ label: doorLabel });
  steelDoor.group.rotation.y = -Math.PI / 2;
  steelDoor.group.position.set(X1 + T / 2, 0, dz);
  parent.add(steelDoor.group);
  const exit = createExitSign();
  exit.rotation.y = -Math.PI / 2;
  exit.position.set(X1, 2.4, dz);
  parent.add(exit);

  // corridor services on the opposite wall (facing -Z)
  const onFarWall = (obj, x, y) => {
    obj.rotation.y = Math.PI;
    obj.position.set(x, y, C);
    parent.add(obj);
    return obj;
  };
  onFarWall(createExtinguisher(), X0 + 1.4, 0.9);
  const fan = createWallFan();
  onFarWall(fan.group, 1.7, 2.25);
  onFarWall(createVent({ width: 0.6, height: 0.3 }), -1.6, 2.4);
  const cam = createSecurityCamera();
  onFarWall(cam.group, X1 - 0.4, 2.5);
  cam.group.rotation.y = Math.PI + 0.5;

  const lights = [];
  if (corridorLights) {
    numbers.forEach((n, i) => {
      const cx = (i - mid) * pitch;
      const isMain = shadowAt.includes(n);
      const l = ceilingLight({
        length: 1.2,
        type: isMain ? 'spot' : i % pointEvery === 0 ? 'point' : 'none',
        intensity: isMain ? 34 : 5 * pointEvery,
        castShadow: isMain,
        shadowSize: 2048,
        angle: 0.95,
        target: isMain ? new THREE.Vector3(-0.9, -H, -3.1) : null,
      });
      l.group.position.set(cx + (isMain ? 0.6 : 0), H, C * 0.55);
      parent.add(l.group);
      lights.push(l);
    });
  }
  return { cells, lights, fan, camera: cam, steelDoor, bounds: { x0: X0, x1: X1, z0: -CELL.depth, z1: C } };
}
