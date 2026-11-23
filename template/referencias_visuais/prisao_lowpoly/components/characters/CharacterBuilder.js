import * as THREE from 'three';
import { disposeGeometries } from '../../lib/geometry.js';
import { mat, shade, tattooMaterial, PALETTE } from '../../lib/materials.js';
import {
  BASE,
  pelvisRings,
  abdomenRings,
  chestRings,
  neckRings,
  upperArmRings,
  forearmRings,
  thighRings,
  shinRings,
  limb,
  buildHand,
  buildShoe,
} from './parts/BodyParts.js';
import { buildHead } from './parts/HeadParts.js';
import * as Cloth from './parts/Clothing.js';

/** Defaults every preset is merged onto. */
export const DEFAULT_CHARACTER = {
  id: 'character',
  height: 1,
  seed: 1,
  skin: 0xd6a07a,
  build: { shoulders: 1, chest: 1, waist: 1, arms: 1, legs: 1, neck: 1, belly: 0, hands: 1, feet: 1, hips: 1, bust: 0 },
  headScale: 1, // > 1 for children (bigger head relative to the body)
  face: {
    width: 1, jaw: 1, nose: 1, browRidge: 0, browThick: 1, mouthWidth: 1,
    iris: 0x4a3a2c, eyeBags: false, eyeOpen: 1, lowLid: 0, browTilt: 0, browRaise: 0, gaze: [0, 0],
  },
  hair: { style: 'crew', color: 0x3b2a20 },
  beard: null,
  outfit: {
    top: PALETTE.jumpsuit,
    bottom: PALETTE.jumpsuit,
    sleeves: 'long', // long | short
    rolled: false,
    collar: 'v', // v | shirt | crew (t-shirt / sweater neckline)
    undershirt: PALETTE.undershirt, // null = skin shows
    front: 'zipper', // zipper | buttons | none
    chestText: null,
    backText: null,
    printColor: 0x17120f,
    hem: false,
    pocket: false,
    badge: null,
    nameTag: false,
    epaulettes: null,
    belt: null,
    gloves: null,
    tattoos: null,
    trouserHem: 0.056,
    shoes: { type: 'sneaker', color: PALETTE.sneaker, sole: PALETTE.sole, lace: 0xbdbab2 },
  },
  posture: {},
  idle: { breath: 0.22, sway: 1, look: 1 },
};

export function deepMerge(base, over) {
  if (over === undefined) return structuredClone(base);
  if (base === null || typeof base !== 'object' || Array.isArray(base)) return over;
  const out = structuredClone(base);
  for (const k of Object.keys(over)) {
    out[k] = over[k] !== null && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object'
      ? deepMerge(base[k], over[k])
      : over[k];
  }
  return out;
}

/**
 * Builds an articulated low poly character.
 * Returns { id, def, root, joints, face, basePose, dispose }.
 * Joint hierarchy: hips > spine > chest > neck > head, chest > shoulder > elbow > wrist,
 * hips > thigh > knee > ankle (suffix L = character's left = +X).
 */
export function createCharacter(preset) {
  const def = deepMerge(DEFAULT_CHARACTER, preset);
  const b = def.build;
  const o = def.outfit;
  const root = new THREE.Group();
  root.name = def.id;
  const joints = {};
  const J = (name, parent, x, y, z = 0) => {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    joints[name] = g;
    return g;
  };

  const thighLen = BASE.thigh * b.legs ** 0.15;
  const shinLen = BASE.shin * b.legs ** 0.15;
  const hipY = BASE.ankleH + shinLen + thighLen + BASE.thighDrop;
  const shrug = def.posture.shrug ?? 0;

  const skin = mat(def.skin);
  const top = mat(o.top);
  const bottom = mat(o.bottom);
  const topDark = mat(shade(o.top, 0.86));
  const bottomDark = mat(shade(o.bottom, 0.86));
  const ink = o.tattoos?.color ?? PALETTE.ink;
  const tat = (variant, seed) => (o.tattoos?.[variant] ? tattooMaterial(def.skin, ink, variant, seed) : skin);

  // ---- torso ----
  const hips = J('hips', root, 0, hipY);
  const spine = J('spine', hips, 0, BASE.spineUp);
  const chest = J('chest', spine, 0, BASE.chestUp);
  const pR = pelvisRings(b);
  const aR = abdomenRings(b);
  const cR = chestRings(b);
  hips.add(limb(pR, bottom));
  spine.add(limb(aR, top));
  chest.add(limb(cR, top));

  const neck = J('neck', chest, 0, BASE.neckUp, -0.006);
  neck.add(limb(neckRings(b, BASE.neck), o.tattoos?.neck ? tattooMaterial(def.skin, ink, 'neck', def.seed) : skin));
  const head = J('head', neck, 0, BASE.neck, 0.008);
  const face = buildHead(def, head);
  head.scale.setScalar(def.headScale ?? 1);

  // ---- collar, front closure, prints ----
  if (o.collar === 'v') chest.add(Cloth.vCollar(cR, o.top, o.undershirt === 'skin' ? def.skin : o.undershirt));
  if (o.collar === 'shirt') chest.add(Cloth.shirtCollar(cR, aR, o.top, shade(o.top, 0.6)));
  if (o.collar === 'crew') chest.add(Cloth.band(cR, 0.3, 0.322, 0.004, topDark));
  if (o.front === 'zipper') {
    chest.add(Cloth.zipper(cR, -0.01, 0.222, 0xb9b6ad));
    spine.add(Cloth.zipper(aR, -0.01, 0.15, 0xb9b6ad));
  } else if (o.front === 'buttons') {
    chest.add(Cloth.buttons(cR, [0.05, 0.13, 0.2], shade(o.top, 0.7)));
    spine.add(Cloth.buttons(aR, [0.04, 0.12], shade(o.top, 0.7)));
  }
  if (o.chestText) chest.add(Cloth.printDecal(cR, o.chestText, { y: 0.17, x: 0.085, width: 0.085, height: 0.04, color: o.printColor }));
  if (o.backText) chest.add(Cloth.printDecal(cR, o.backText, { y: 0.17, width: 0.22, height: 0.06, back: true, color: o.printColor }));
  if (o.hem) spine.add(Cloth.band(aR, 0.0, 0.035, 0.009, topDark));
  if (o.pocket) {
    chest.add(Cloth.chestPocket(cR, 0.085, o.top));
    chest.add(Cloth.chestPocket(cR, -0.085, o.top));
  }
  if (o.badge) chest.add(Cloth.badge(cR, 0.085, 0.215, o.badge));
  if (o.nameTag) chest.add(Cloth.nameTag(cR, -0.085, 0.215));
  if (o.epaulettes) chest.add(Cloth.epaulettes(cR, o.epaulettes));
  if (o.belt) hips.add(Cloth.dutyBelt(pR, o.belt));

  // ---- arms ----
  const hands = {};
  const handScale = b.hands * Math.max(1, b.arms) ** 0.35;
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const upperLen = BASE.upperArm;
    const foreLen = BASE.foreArm;
    const shoulder = J('shoulder' + S, chest, s * BASE.shoulderX * b.shoulders, BASE.shoulderY + shrug, -0.005);
    const elbow = J('elbow' + S, shoulder, 0, -upperLen);
    const wrist = J('wrist' + S, elbow, 0, -foreLen);
    const longSleeve = o.sleeves === 'long';
    const uR = upperArmRings(b, upperLen, longSleeve ? 0.007 : 0);
    const fR = forearmRings(b, foreLen, longSleeve ? 0.008 : 0);

    if (longSleeve) {
      shoulder.add(limb(uR, top));
      elbow.add(limb(fR, top));
      elbow.add(Cloth.band(fR, -foreLen, -foreLen + 0.03, 0.004, topDark));
    } else {
      shoulder.add(limb(uR, tat('upper', def.seed + s)));
      elbow.add(limb(fR, tat('forearm', def.seed + 3 + s)));
      const sleeveEnd = -upperLen * (o.rolled ? 0.42 : 0.5);
      shoulder.add(Cloth.shell(uR, sleeveEnd, 0.06, 0.012, top));
      if (o.rolled) shoulder.add(Cloth.band(uR, sleeveEnd, sleeveEnd + 0.035, 0.017, topDark));
    }
    const handMat = o.gloves ? mat(o.gloves, { roughness: 0.7 }) : skin;
    if (o.gloves) elbow.add(Cloth.band(fR, -foreLen - 0.005, -foreLen + 0.03, 0.006, handMat));
    const hand = buildHand(s, handScale, handMat);
    wrist.add(hand);
    hands[S] = hand;
  }

  // ---- legs ----
  const shoeMats = {
    upper: mat(o.shoes.color, { roughness: 0.75 }),
    sole: mat(o.shoes.sole, { roughness: 0.85 }),
    lace: mat(o.shoes.lace ?? shade(o.shoes.color, 0.8)),
  };
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    const thigh = J('thigh' + S, hips, s * BASE.hipX * b.waist * (b.hips ?? 1), -BASE.thighDrop);
    const knee = J('knee' + S, thigh, 0, -thighLen);
    const ankle = J('ankle' + S, knee, 0, -shinLen);
    const tR = thighRings(b, thighLen, 0.01);
    const sR = shinRings(b, shinLen, 0.01, o.shoes.type === 'boot' ? 0.05 : o.trouserHem);
    thigh.add(limb(tR, bottom));
    knee.add(limb(sR, bottom));
    if (o.shoes.type !== 'boot') knee.add(Cloth.band(sR, -shinLen + 0.005, -shinLen + 0.03, 0.003, bottomDark));
    ankle.add(buildShoe(o.shoes, b.feet, shoeMats));
  }

  root.scale.setScalar(def.height);

  const character = {
    id: def.id,
    def,
    root,
    joints,
    face,
    hands,
    /** unscaled skeleton measurements used by procedural clips (sit height, stride) */
    dims: { hipY, thighLen, shinLen, ankleH: BASE.ankleH, thighDrop: BASE.thighDrop, upperArm: BASE.upperArm, foreArm: BASE.foreArm },
    basePose: null,
    dispose() {
      root.removeFromParent();
      disposeGeometries(root);
    },
  };
  applyPosture(character, def.posture);
  return character;
}

/**
 * Converts compact posture parameters into joint rotations and stores them as the base pose.
 * Animations are applied as offsets on top of this pose.
 */
export function applyPosture(character, p = {}) {
  const j = character.joints;
  const v = (k, d = 0) => p[k] ?? d;
  j.spine.rotation.set(v('spine'), 0, 0);
  j.chest.rotation.set(v('chest'), v('chestTurn'), 0);
  j.neck.rotation.set(v('neck'), 0, 0);
  j.head.rotation.set(v('head'), v('headTurn'), v('headTilt'));
  const weight = v('weight');
  j.hips.rotation.set(0, 0, weight);
  j.spine.rotation.z = -weight * 1.3;
  for (const s of [1, -1]) {
    const S = s > 0 ? 'L' : 'R';
    j['shoulder' + S].rotation.set(-v('armForward', 0.04), 0, s * v('armSpread', 0.09));
    j['elbow' + S].rotation.set(-v('elbow', 0.16), 0, 0);
    j['wrist' + S].rotation.set(0, s * v('wristTwist', 0.25), s * 0.04);
    const st = v('stance', 0.035);
    j['thigh' + S].rotation.set(-v('knee', 0.02) * 0.5, 0, s * st - weight);
    j['knee' + S].rotation.set(v('knee', 0.02), 0, 0);
    j['ankle' + S].rotation.set(-v('knee', 0.02) * 0.5, s * v('toeOut', 0.12), -s * st + weight);
  }
  const base = {};
  for (const [name, g] of Object.entries(j)) base[name] = { rot: g.rotation.clone(), pos: g.position.clone() };
  character.basePose = base;
}
