import * as THREE from 'three';
import { createEnvironment, worldBox, wallMat, PRISON, TILE } from './EnvironmentKit.js';
import { buildCellBlock, CELL } from './CellBlock.js';
import { createBarPanel, barSteel } from '../objects/MetalBars.js';
import { createSlidingBarDoor } from '../objects/PrisonDoor.js';
import { createSignPlate } from '../objects/Props.js';

/**
 * Corredor principal: cells 41-49 of Bloco C (Cela 13 included), a cross gate near the
 * west end and the steel door to the cafeteria at the east end.
 */
export function createPrisonCorridor() {
  const env = createEnvironment('Corredor principal');
  const g = env.group;
  const numbers = [41, 42, 43, 44, 45, 46, 47, 48, 49];
  g.add(new THREE.HemisphereLight(0xdde7ef, 0x5d6166, 0.85));
  const block = buildCellBlock(g, {
    numbers,
    main: null,
    shadowAt: [43, 47],
    cellLight: () => 'tube',
    pointEvery: 2,
    doorLabel: 'REFEITÓRIO',
  });
  const C = CELL.corridor;
  const H = CELL.height;

  // cross-corridor security gate (fixed half + sliding half), with header and sign
  // aligned with the wall pillar between cells 41 and 42
  const gateX = block.cells[41].cx + CELL.width / 2 + CELL.wall / 2;
  g.add(worldBox([gateX - 0.12, gateX + 0.12], [CELL.barsH + 0.03, H], [0, C], wallMat(PRISON.blockWhite), TILE.block));
  g.add(worldBox([gateX + 0.05, gateX + 0.11], [CELL.barsH + 0.005, CELL.barsH + 0.035], [0, C], barSteel(), TILE.block));
  const fixed = createBarPanel({ width: C / 2 + 0.02, height: CELL.barsH, cross: [0.14, 0.98, 1.2] });
  fixed.rotation.y = Math.PI / 2;
  fixed.position.set(gateX, 0, C * 0.75);
  g.add(fixed);
  const gate = createSlidingBarDoor({ width: C / 2 + 0.02, height: CELL.barsH - 0.04, travel: C / 2 - 0.1 });
  gate.group.rotation.y = Math.PI / 2;
  gate.group.position.set(gateX + 0.075, 0, C * 0.25);
  g.add(gate.group);
  const sign = createSignPlate('ALA C', { width: 0.5, height: 0.16 });
  sign.rotation.y = Math.PI / 2;
  sign.position.set(gateX + 0.12, 2.53, C / 2);
  g.add(sign);
  const blockSign = createSignPlate('BLOCO C', { width: 0.7, height: 0.2, bg: 0x2a5a7a });
  blockSign.rotation.y = Math.PI;
  blockSign.position.set(0, 2.2, C);
  g.add(blockSign);

  env.interactives = {
    gate,
    cellDoors: Object.fromEntries(numbers.map((n) => [n, block.cells[n].door])),
    steelDoor: block.steelDoor,
  };
  env.updaters.push((t) => {
    block.fan.blades.rotation.z = t * 14;
    block.camera.led.visible = Math.floor(t * 1.2) % 2 === 0;
  });

  // ---- anchors ----
  const cx = (n) => block.cells[n].cx;
  env.characterAnchor('protagonist_walk_start', [gateX + 1.4, 0, 1.3], Math.PI / 2);
  env.characterAnchor('guard_escort', [gateX + 1.9, 0, 0.75], Math.PI / 2);
  env.characterAnchor('guard_gate', [gateX - 0.8, 0, 1.9], Math.PI / 2);
  env.characterAnchor('guard_patrol', [cx(46), 0, 1.6], -Math.PI / 2);
  for (const n of numbers) env.characterAnchor('bars_' + n, [cx(n) + 0.35, 0, -0.5], 0);

  // ---- cameras ----
  env.cameraPoint('pov_walk_start', [gateX + 1.4, 1.62, 1.3], [cx(49), 1.4, 1.2], 70);
  env.cameraPoint('pov_walk_mid', [cx(45), 1.62, 1.5], [cx(49) + 2, 1.3, 0.7], 70);
  env.cameraPoint('pov_cell_glance', [cx(46) - 0.6, 1.62, 1.5], [cx(46) + 0.2, 1.1, -2.2], 70);
  env.cameraPoint('pov_gate', [cx(43), 1.62, 1.2], [gateX - 0.5, 1.2, 1.1], 70);
  env.cameraPoint('third_person', [gateX + 0.3, 2.3, 2.2], [gateX + 4, 1.1, 0.9], 65);
  env.cameraPoint('wide_end', [block.bounds.x1 - 0.8, 2.4, 2.2], [cx(42), 0.8, 0.4], 70);
  return env;
}
