import * as THREE from 'three';
import { mesh, deformBox, jitter } from '../../lib/geometry.js';
import { mat } from '../../lib/materials.js';
import { instancedBoxes } from './MetalBars.js';

/** Puffy rounded mattress / pillow block. */
function cushion(w, h, d, round, segs = [3, 1, 4]) {
  return deformBox(w, h, d, segs, (v) => {
    if (v.y > 0) {
      const ex = Math.abs(v.x) / (w / 2);
      const ez = Math.abs(v.z) / (d / 2);
      v.y -= round * Math.max(ex, ez) ** 4;
    }
  });
}

/**
 * Steel bunk bed. Length runs along Z (head at -Z), width along X; origin at floor centre.
 * opts.single = true builds a single bed (lower deck only).
 * Returns { group, anchors: { lowerSit, lowerLie, upperLie } } in local space.
 */
export function createBunkBed({
  length = 1.95,
  width = 0.82,
  lowerY = 0.4,
  upperY = 1.45,
  frameColor = 0x8d969b,
  mattress = 0x2f9c92,
  blanket = 0x6f7d79,
  pillow = 0xe9e6de,
  single = false,
  messy = [false, true],
  seed = 3,
} = {}) {
  const group = new THREE.Group();
  group.name = single ? 'bed' : 'bunkBed';
  const frame = mat(frameColor, { roughness: 0.5, metalness: 0.35 });
  const top = single ? lowerY + 0.25 : upperY + 0.36;
  const L = length / 2;
  const W = width / 2;
  const p = 0.045;
  const pieces = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) pieces.push([sx * (W - p / 2), top / 2, sz * (L - p / 2), p, top, p]);
  const decks = single ? [lowerY] : [lowerY, upperY];
  for (const y of decks) {
    pieces.push([0, y, 0, width - 0.01, 0.025, length - 0.01]);
    for (const sx of [-1, 1]) pieces.push([sx * (W - p / 2), y + 0.01, 0, p, 0.07, length]);
    for (const sz of [-1, 1]) pieces.push([0, y + 0.01, sz * (L - p / 2), width, 0.07, p]);
  }
  // head/foot boards and ladder rungs at the foot end
  for (const sz of [-1, 1]) pieces.push([0, top - 0.04, sz * (L - p / 2), width, 0.05, p]);
  if (!single) {
    for (const y of [0.78, 1.1]) pieces.push([0, y, L - p / 2, width - p, 0.03, 0.03]);
    pieces.push([W - p / 2, upperY + 0.3, 0, 0.035, 0.035, length]); // guard rail
  }
  group.add(instancedBoxes(pieces, frame, { name: 'bedFrame' }));

  const mMat = mat(mattress, { roughness: 0.9 });
  const pMat = mat(pillow, { roughness: 0.95 });
  const bMat = mat(blanket, { roughness: 0.95 });
  decks.forEach((y, i) => {
    const mt = mesh(cushion(width - 0.06, 0.12, length - 0.06, 0.035), mMat);
    mt.position.y = y + 0.0725;
    const pl = mesh(cushion(0.5, 0.1, 0.32, 0.05, [3, 1, 3]), pMat);
    pl.position.set(0, y + 0.18, -L + 0.27);
    pl.rotation.y = (i ? -0.08 : 0.05);
    const rumpled = messy[i];
    const bl = deformBox(width + 0.02, 0.03, length * (rumpled ? 0.62 : 0.4), [4, 1, 6], (v) => {
      if (Math.abs(v.x) > width / 2 - 0.01) v.y -= 0.06; // drape over the sides
    });
    if (rumpled) jitter(bl, 0.05, seed + i);
    const b = mesh(bl, bMat);
    b.position.set(0, y + 0.15, L - length * (rumpled ? 0.33 : 0.22));
    group.add(mt, pl, b);
  });

  const anchors = {
    lowerSit: new THREE.Vector3(W - 0.05, lowerY + 0.13, 0.1),
    lowerLie: new THREE.Vector3(0, lowerY + 0.14, 0),
    upperLie: single ? null : new THREE.Vector3(0, upperY + 0.14, 0),
  };
  return { group, anchors };
}
