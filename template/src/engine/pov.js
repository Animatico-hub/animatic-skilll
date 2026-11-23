// Câmera POV (olhos do protagonista) + antebraços/mãos em primeira pessoa.
import * as THREE from 'three';
import {mesh, G} from './toon.js';
import {targetAt, clamp01} from './anim.js';

const dir = new THREE.Vector3();

// ruído determinístico para tremidas (sem Math.random)
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const noise = (x, seed) => {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  const a = hash(i + seed * 57.31), b = hash(i + 1 + seed * 57.31);
  return (a + (b - a) * u) * 2 - 1;
};
const DEG = Math.PI / 180;

export function createPov({fov = 78, aspect = 9 / 16} = {}) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.03, 40);
  camera.rotation.order = 'YXZ';
  return {
    camera,
    /**
     * eye: posição dos olhos (Vector3), lookKeys: [{t, target, dur?}] — a câmera só vira quando o roteiro manda.
     */
    update(t, eye, lookKeys, {dur = 0.7} = {}) {
      // respiração/peso do corpo: deslocamentos minúsculos e determinísticos
      camera.position.set(
        eye.x + Math.sin(t * 0.9) * 0.004,
        eye.y + Math.sin(t * 1.7) * 0.003,
        eye.z,
      );
      const target = targetAt(t, lookKeys, dur);
      dir.subVectors(target, camera.position);
      camera.rotation.set(
        Math.atan2(dir.y, Math.hypot(dir.x, dir.z)),
        Math.atan2(-dir.x, -dir.z),
        Math.sin(t * 0.6) * 0.004,
      );
      camera.updateMatrixWorld(true);
    },
  };
}

/**
 * Câmera POV de ação (Pacote 2, aprovado em 19/11/2026). Mesmo uso de createPov, com opções extras por frame:
 *  gait:   [[t, 'idle'|'walk'|'run'], ...]  modo de locomoção (transição de 0,3 s). idle = respiração 0,6 Hz (±0,7 cm);
 *          walk = 1,8 passos/s; run = 2,7 passos/s com sobe-desce, balanço lateral, inclinação ~2° e cabeça instável.
 *  shakes: [{t, amp: graus, dur: s}]        tremida de impacto que decai ((1-u)^2). Típico: batida 3–4°/0,35 s; queda 5°/0,5 s.
 *  lookKeys aceitam whip: true             virada rápida de 0,35 s + tranco de ~1° ao chegar (sustos, batidas, gritos).
 * Expõe rig.state {phase, run, walk} para createViewArms. Faça scene.add(rig.camera) se usar braços presos à câmera.
 */
export function createPovRig({fov = 78, aspect = 9 / 16} = {}) {
  const camera = new THREE.PerspectiveCamera(fov, aspect, 0.03, 40);
  camera.rotation.order = 'YXZ';
  const GAIT = {idle: [0, 0], walk: [1, 0], run: [0, 1]};
  const state = {phase: 0, run: 0, walk: 0};
  const gaitAt = (t, gait) => {
    let w = [0, 0];
    for (let i = 0; i < gait.length; i++) {
      const [t0, m] = gait[i];
      if (t < t0) break;
      const prev = i ? GAIT[gait[i - 1][1]] : GAIT[m];
      const k = clamp01((t - t0) / 0.3);
      w = prev.map((a, j) => a + (GAIT[m][j] - a) * k);
    }
    return {walk: w[0], run: w[1]};
  };

  return {
    camera,
    state,
    update(t, eye, lookKeys, {gait = [[0, 'idle']], shakes = [], dur = 0.7} = {}) {
      const {walk, run} = gaitAt(t, gait);
      const idle = 1 - Math.min(1, walk + run);
      const ph = t * Math.PI * (walk * 1.8 + run * 2.7 || 1);
      Object.assign(state, {phase: ph, run, walk});

      let px = idle * Math.sin(t * 0.3 * 2 * Math.PI) * 0.003;
      let py = idle * Math.sin(t * 0.6 * 2 * Math.PI) * 0.007;
      let roll = 0, pitch = 0, yaw = 0;
      px += Math.sin(ph) * (walk * 0.012 + run * 0.026);
      py += -Math.abs(Math.cos(ph)) * (walk * 0.02 + run * 0.045);
      roll += Math.sin(ph) * (walk * 0.8 + run * 2.2) * DEG;
      pitch += Math.cos(ph * 2) * (walk * 0.4 + run * 1.2) * DEG;
      yaw += noise(t * 1.3, 7) * run * 2.5 * DEG; // pânico: a cabeça não fica reta

      for (const s of shakes) {
        const u = (t - s.t) / s.dur;
        if (u < 0 || u > 1) continue;
        const k = (1 - u) ** 2 * s.amp * DEG;
        roll += noise(t * 28, s.t) * k;
        pitch += noise(t * 31, s.t + 3) * k * 0.6;
        yaw += noise(t * 26, s.t + 5) * k * 0.5;
        py += noise(t * 35, s.t + 9) * k * 0.15;
      }

      const keys = lookKeys.map((k) => (k.whip ? {...k, dur: k.dur ?? 0.35} : k));
      for (const k of keys) {
        if (!k.whip) continue;
        const u = (t - (k.t + k.dur)) / 0.25;
        if (u >= 0 && u <= 1) {
          const e = (1 - u) ** 2;
          roll += noise(t * 30, k.t) * 1.2 * DEG * e;
          pitch += 0.8 * DEG * e * Math.sin(u * 9);
        }
      }

      camera.position.set(eye.x + px, eye.y + py, eye.z);
      dir.subVectors(targetAt(t, keys, dur), eye);
      camera.rotation.set(
        Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) + pitch,
        Math.atan2(-dir.x, -dir.z) + yaw,
        roll,
      );
      camera.updateMatrixWorld(true);
    },
  };
}

/**
 * Braços presos à câmera: entram pelos cantos de baixo com a mão perto do centro; na corrida balançam alternados.
 * update(t, {visible, run, phase, reach}) — passe run/phase de rig.state; reach 0..1 estica para frente.
 * Use quando o protagonista está em pé/andando; sentado à mesa, prefira createPovArms (apoiados no tampo).
 */
export function createViewArms(camera, {sleeve = 0x5d6475, skin = 0xe2b08a} = {}) {
  const g = new THREE.Group();
  const arms = [-1, 1].map((side) => {
    const a = new THREE.Group();
    a.rotation.order = 'YXZ';
    const fore = mesh(new THREE.CapsuleGeometry(0.045, 0.32, 8, 20), sleeve, {outline: 3});
    fore.rotation.x = -Math.PI / 2;
    const hand = mesh(G.sphere(0.052), skin, {outline: 3});
    hand.position.z = -0.22;
    hand.scale.set(1, 0.72, 1.15);
    a.add(fore, hand);
    g.add(a);
    return {a, side};
  });
  camera.add(g);
  return {
    group: g,
    update(t, {visible = true, run = 0, phase = 0, reach = 0} = {}) {
      g.visible = visible;
      for (const {a, side} of arms) {
        const s = Math.sin(phase + (side > 0 ? 0 : Math.PI)); // alternados
        a.position.set(side * (0.22 - 0.03 * reach), -0.36 + run * 0.05 * s + reach * 0.05, -0.46 - run * 0.07 * s - reach * 0.1);
        a.rotation.set(0.6 + run * 0.35 * s, side * (0.7 - 0.25 * reach), 0);
      }
    },
  };
}

/** Antebraços do protagonista apoiados na mesa (pontos do cotovelo -> mão em coordenadas do mundo). */
export function createPovArms({sleeve = 0x5d6475, skin = 0xe2b08a, arms}) {
  const g = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  for (const [from, to] of arms) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const len = a.distanceTo(b);
    const fore = mesh(new THREE.CapsuleGeometry(0.048, len, 8, 20), sleeve, {outline: 3});
    fore.position.copy(a).lerp(b, 0.5);
    fore.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
    const hand = mesh(G.sphere(0.055), skin, {outline: 3});
    hand.position.copy(b).add(b.clone().sub(a).normalize().multiplyScalar(0.045));
    hand.scale.set(1, 0.72, 1.15);
    g.add(fore, hand);
  }
  return g;
}
