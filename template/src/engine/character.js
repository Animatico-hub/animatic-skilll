// Personagem-base cartoon: rig hierárquico simples + rosto animável (olhos, pálpebras, sobrancelhas, boca).
// Unidades em metros, personagem olhando para +Z.
import * as THREE from 'three';
import {mesh, toon, G} from './toon.js';
import {badge} from './props.js';

export const DEFAULTS = {
  scale: 1,            // altura geral
  headScale: 1,
  shoulders: 1,        // largura dos ombros
  body: 1,             // volume do tronco
  limbs: 1,            // comprimento de braços/pernas
  skin: 0xc68a63,
  hair: 0x3a2018,
  hairStyle: 'bob',    // bob | short | bun
  top: 0x2c8c80,
  pants: 0x3b4157,
  shoes: 0x26252c,
  eyeScale: 1,
  eyeSpacing: 1,
  mouthColor: 0x5a1c22,
};

const v3 = new THREE.Vector3();

const darken = (hex, k) => new THREE.Color(hex).multiplyScalar(k).getHex();

function buildHair(style, color) {
  const g = new THREE.Group();
  const dbl = {side: THREE.DoubleSide};
  const cap = (theta, tilt = 0.06) => {
    const geo = new THREE.SphereGeometry(0.153, 32, 12, 0, Math.PI * 2, 0, theta);
    const m = mesh(geo, color, {...dbl, outline: 3});
    m.position.set(0, 0.135, -0.004);
    m.rotation.x = tilt;
    m.scale.set(1.04, 1.02, 1.05);
    return m;
  };
  if (style === 'bob') {
    const gap = 1.12; // abertura frontal para o rosto
    const shell = new THREE.SphereGeometry(0.155, 32, 22, Math.PI / 2 + gap, Math.PI * 2 - gap * 2, 0, Math.PI * 0.68);
    const m = mesh(shell, color, {...dbl, outline: 3});
    m.position.set(0, 0.138, -0.01);
    m.scale.set(1.06, 1.02, 1.06);
    g.add(m, cap(Math.PI * 0.255, 0.02));
  } else if (style === 'bun') {
    g.add(cap(Math.PI * 0.42, 0.02));
    const bun = mesh(G.sphere(0.065), color, {outline: 3});
    bun.position.set(0, 0.29, -0.06);
    g.add(bun);
  } else {
    g.add(cap(Math.PI * 0.4, 0.1));
    const back = mesh(G.sphere(0.14), color, {outline: 3});
    back.position.set(0, 0.125, -0.03);
    back.scale.set(1.05, 0.95, 0.95);
    g.add(back);
  }
  return g;
}

function buildArm(side, P) {
  const s = side; // +1 esquerda do personagem, -1 direita
  const shoulder = new THREE.Group();
  shoulder.position.set(0.2 * P.shoulders * s, -0.02, 0);
  const ball = mesh(G.sphere(0.074), P.top);
  shoulder.add(ball);
  const upper = new THREE.Group();
  shoulder.add(upper);
  const upperMesh = mesh(G.capsule(0.05, 0.16 * P.limbs), P.top);
  upperMesh.position.y = -0.12 * P.limbs;
  upper.add(upperMesh);
  const elbow = new THREE.Group();
  elbow.position.y = -0.25 * P.limbs;
  upper.add(elbow);
  const fore = mesh(G.capsule(0.045, 0.15 * P.limbs), P.top);
  fore.position.y = -0.1 * P.limbs;
  elbow.add(fore);
  const hand = mesh(G.sphere(0.047), P.skin);
  hand.position.y = -0.235 * P.limbs;
  hand.scale.set(0.9, 1.08, 0.82);
  elbow.add(hand);
  return {shoulder, upper, elbow, fore, hand};
}

function buildLeg(side, P) {
  const hip = new THREE.Group();
  hip.position.set(0.09 * P.body * side, -0.02, 0);
  const thigh = mesh(G.capsule(0.068, 0.3 * P.limbs), P.pants);
  thigh.position.y = -0.2 * P.limbs;
  hip.add(thigh);
  const knee = new THREE.Group();
  knee.position.y = -0.41 * P.limbs;
  hip.add(knee);
  const shin = mesh(G.capsule(0.058, 0.32 * P.limbs), P.pants);
  shin.position.y = -0.22 * P.limbs;
  knee.add(shin);
  const foot = mesh(G.capsule(0.045, 0.1), P.shoes);
  foot.rotation.x = Math.PI / 2;
  foot.position.set(0, -0.47 * P.limbs, 0.045);
  knee.add(foot);
  return {hip, knee};
}

export function createCharacter(params = {}) {
  const P = {...DEFAULTS, ...params};
  const root = new THREE.Group();
  root.scale.setScalar(P.scale);

  const hips = new THREE.Group();
  root.add(hips);
  const pelvis = mesh(G.sphere(0.15), P.pants);
  pelvis.scale.set(1.12 * P.body, 0.72, 0.9);
  hips.add(pelvis);

  const spine = new THREE.Group();
  spine.position.y = 0.04;
  hips.add(spine);
  const torso = mesh(G.capsule(0.155, 0.2), P.top);
  torso.position.y = 0.2;
  torso.scale.set(1.18 * P.body, 1, 0.78 * P.body);
  spine.add(torso);

  const chest = new THREE.Group();
  chest.position.y = 0.36;
  spine.add(chest);

  if (P.badge) { // crachá no cordão (acessório opcional)
    // superfície frontal do tronco (cápsula r=0.155, centro y=0.2, meia-altura 0.1, escala z 0.78*body)
    const front = (y) => {
      const dy = Math.max(0, Math.abs(y - 0.2) - 0.1);
      return Math.sqrt(Math.max(0, 0.155 ** 2 - dy * dy)) * 0.78 * P.body + 0.006;
    };
    const card = badge(P.badge);
    card.position.set(0, 0.17, front(0.17) - 0.003);
    card.rotation.z = 0.03;
    spine.add(card);
    // cordão: canto superior do crachá -> sobe colado ao peito -> contorna até a lateral do pescoço
    const mat = toon(P.badge.cord ?? 0x2b5fa8);
    const up = new THREE.Vector3(0, 1, 0);
    for (const s of [1, -1]) {
      const pts = [
        [0.018 * s, 0.21, front(0.21)],
        [0.03 * s, 0.3, front(0.3)],
        [0.038 * s, 0.37, front(0.37)],
        [0.044 * s, 0.42, front(0.42)],
        [0.045 * s, 0.46, 0.012], // encosta na lateral do pescoço (r≈0.043 + raio do cordão)
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const seg = new THREE.Mesh(new THREE.CapsuleGeometry(0.0045, a.distanceTo(b), 4, 8), mat);
        seg.position.copy(a).lerp(b, 0.5);
        seg.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
        spine.add(seg);
      }
    }
  }
  const neck = mesh(G.cyl(0.04, 0.046, 0.16), P.skin, {outline: 2.5});
  neck.position.y = 0.08;
  chest.add(neck);

  // ---- cabeça ----
  const head = new THREE.Group();
  head.position.y = 0.13;
  head.rotation.order = 'YXZ';
  chest.add(head);
  const face = new THREE.Group();
  face.scale.setScalar(P.headScale);
  head.add(face);
  const skull = mesh(G.sphere(0.135, 36, 28), P.skin);
  skull.position.y = 0.13;
  skull.scale.set(0.96, 1.05, 0.95);
  face.add(skull);
  for (const s of [1, -1]) {
    const ear = mesh(G.sphere(0.032), P.skin, {outline: 2.5});
    ear.position.set(0.128 * s, 0.122, -0.005);
    ear.scale.set(0.45, 1, 0.75);
    face.add(ear);
  }
  const nose = mesh(G.sphere(0.021), darken(P.skin, 0.88), {outline: 0});
  nose.position.set(0, 0.112, 0.124);
  nose.scale.set(0.95, 0.8, 0.7);
  face.add(nose);

  const eyes = [];
  const brows = [];
  for (const s of [1, -1]) {
    const eye = new THREE.Group(); // pivô do globo (gira para olhar)
    eye.position.set(0.049 * s * P.eyeSpacing, 0.148, 0.092);
    eye.rotation.order = 'YXZ';
    const lid = new THREE.Group(); // escala Y = piscar / arregalar / semicerrar
    lid.scale.setScalar(P.eyeScale);
    lid.add(eye);
    const white = mesh(G.sphere(0.04), 0xf7f5ef, {outline: 2.6, material: new THREE.MeshBasicMaterial({color: 0xf7f5ef})});
    eye.add(white);
    const pupil = new THREE.Mesh(G.sphere(0.0165, 20, 14), new THREE.MeshBasicMaterial({color: 0x111014}));
    pupil.position.z = 0.0365;
    pupil.scale.set(1, 1.08, 0.45);
    eye.add(pupil);
    const holder = new THREE.Group();
    holder.position.copy(eye.position);
    eye.position.set(0, 0, 0);
    holder.add(lid);
    face.add(holder);
    eyes.push({holder, lid, eye, side: s});

    const brow = new THREE.Group();
    brow.position.set(0.05 * s * P.eyeSpacing, 0.2, 0.104);
    const bar = mesh(G.capsule(0.0095, 0.042), darken(P.hair, 0.8), {outline: 0});
    bar.rotation.z = Math.PI / 2;
    brow.add(bar);
    face.add(brow);
    brows.push({brow, side: s, baseY: 0.2});
  }

  const mouth = new THREE.Group();
  mouth.position.set(0, 0.074, 0.112);
  const mouthMesh = mesh(G.sphere(0.03), P.mouthColor, {outline: 2, material: new THREE.MeshBasicMaterial({color: P.mouthColor})});
  mouth.add(mouthMesh);
  face.add(mouth);

  face.add(buildHair(P.hairStyle, P.hair));

  const armL = buildArm(1, P);
  const armR = buildArm(-1, P);
  chest.add(armL.shoulder, armR.shoulder);
  const legL = buildLeg(1, P);
  const legR = buildLeg(-1, P);
  hips.add(legL.hip, legR.hip);

  const rig = {root, hips, spine, chest, head, face, eyes, brows, mouth, mouthMesh, armL, armR, legL, legR, torso};

  const poseArm = (arm, a = {}) => {
    const [x = 0, y = 0, z = 0] = a.shoulder || [];
    arm.upper.rotation.set(x, y, z);
    arm.elbow.rotation.set(a.elbow ?? 0, 0, 0);
  };

  /** Aplica um estado completo (função pura do tempo, chamada a cada frame). */
  const apply = (st) => {
    const sit = st.sit ?? 0;
    hips.position.y = THREE.MathUtils.lerp(0.9, 0.54, sit) * P.limbs;
    for (const leg of [legL, legR]) {
      leg.hip.rotation.x = -Math.PI / 2 * sit;
      leg.knee.rotation.x = Math.PI / 2 * sit;
    }
    legL.hip.rotation.z = 0.05 * sit;
    legR.hip.rotation.z = -0.05 * sit;

    const breath = Math.sin((st.t ?? 0) * 2.1);
    const lean = (st.lean ?? 0) + breath * 0.008;
    let twist = st.twist ?? 0;
    head.rotation.set(0, 0, 0);
    if (st.lookAt) {
      // tronco acompanha uma parte do giro (alvos laterais), cabeça faz o resto, olhos completam
      spine.rotation.set(lean, twist, 0);
      root.updateMatrixWorld(true);
      chest.worldToLocal(v3.copy(st.lookAt));
      twist += THREE.MathUtils.clamp(Math.atan2(v3.x, v3.z) * 0.3, -0.4, 0.4);
    }
    spine.rotation.set(lean, twist, 0);
    torso.scale.y = 1 + breath * 0.012;
    chest.rotation.x = (st.lean ?? 0) * 0.4;
    poseArm(armL, st.armL);
    poseArm(armR, st.armR);

    const h = st.head || {};
    let yaw = h.yaw ?? 0;
    let pitch = h.pitch ?? 0;
    if (st.lookAt) {
      root.updateMatrixWorld(true);
      head.worldToLocal(v3.copy(st.lookAt));
      v3.y -= 0.14 * P.headScale;
      const f = st.headFollow ?? 0.65;
      yaw += THREE.MathUtils.clamp(Math.atan2(v3.x, v3.z) * f, -0.95, 0.95);
      pitch += THREE.MathUtils.clamp(Math.atan2(v3.y, Math.hypot(v3.x, v3.z)) * f, -0.45, 0.4);
    }
    head.rotation.set(-pitch, yaw, h.roll ?? 0);
    root.updateMatrixWorld(true);

    // olhos
    const open = (st.eyeOpen ?? 1) * (1 - 0.93 * (st.blink ?? 0));
    for (const e of eyes) {
      e.lid.scale.set(P.eyeScale, P.eyeScale * open, P.eyeScale);
      const tgt = st.eyesAt || st.lookAt;
      if (tgt) {
        e.holder.worldToLocal(v3.copy(tgt));
        const ey = THREE.MathUtils.clamp(Math.atan2(v3.x, v3.z), -0.55, 0.55);
        const ep = THREE.MathUtils.clamp(Math.atan2(v3.y, Math.hypot(v3.x, v3.z)), -0.45, 0.4);
        e.eye.rotation.set(-ep, ey, 0);
      } else {
        e.eye.rotation.set(0, 0, 0);
      }
    }
    for (const b of brows) {
      b.brow.position.y = b.baseY + (st.browRaise ?? 0) * 0.012 - (st.blink ?? 0) * 0.004;
      b.brow.rotation.z = -(st.browAngle ?? 0) * b.side; // + = preocupado (interno sobe), - = bravo
    }
    const m = st.mouth || {};
    const o = m.open ?? 0;
    const wide = (m.wide ?? 1) * (st.mouthWidth ?? 1);
    mouthMesh.scale.set(1.1 * wide * (1 - 0.25 * (m.round ?? 0)) * (1 - 0.12 * o), 0.12 + 1.05 * o, 0.35);
    mouth.position.y = 0.072 - o * 0.012;
  };

  return {root, rig, P, apply};
}
