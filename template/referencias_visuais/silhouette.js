// A silhueta da parte 6 (98% da referência ref8): toda preta e chapada, cabeça redonda grande com duas orelhinhas,
// dois olhos ovais enormes branco-acinzentados levemente inclinados (sem pupila, sem boca), pescoço fino, ombros em bola
// mais largos que o corpo, braços longos e finos com mãos redondas, casaco longo em "A" até o tornozelo, sapatos quadrados.
// Altura ~1,95 m. Olhando para +z. update(t, {walk, headYaw, headPitch, lean}) anima passo, braços e cabeça.
import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function createSilhouette({lit = false} = {}) {
  // no corredor: preto chapado (MeshBasic). De dia (lit): preto fosco com um pouco de luz, pra ler como "alguém de preto".
  const body = lit ? new THREE.MeshLambertMaterial({color: 0x15171c}) : new THREE.MeshBasicMaterial({color: 0x050507});
  const eyeMat = new THREE.MeshBasicMaterial({color: 0xdfe4ee, transparent: true, opacity: 1});
  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  // casaco em "A": do peito (r 0,17) até a barra (r 0,36), achatado na frente/trás
  const prof = [V(0.36, 0.11, 0), V(0.345, 0.2, 0), V(0.29, 0.6, 0), V(0.22, 1.05, 0), V(0.185, 1.3, 0), V(0.16, 1.46, 0), V(0.0, 1.5, 0)]
    .map((p) => new THREE.Vector2(p.x, p.y));
  const coat = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), body);
  coat.scale.z = 0.72;
  bob.add(coat);
  // ombros em bola, mais largos que o corpo
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.105, 20, 14), body);
    sh.position.set(s * 0.235, 1.43, 0);
    bob.add(sh);
  }
  // pescoço fino
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.16, 14), body);
  neck.position.y = 1.55;
  bob.add(neck);
  // cabeça (pivô no pescoço, gira sozinha)
  const head = new THREE.Group();
  head.position.y = 1.6;
  bob.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.175, 32, 24), body);
  skull.scale.set(1.07, 1, 0.97);
  skull.position.y = 0.17;
  head.add(skull);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 10), body);
    ear.position.set(s * 0.188, 0.155, -0.005);
    ear.scale.set(0.7, 1, 1);
    head.add(ear);
  }
  // olhos: ovais grandes colados na frente da cabeça, inclinados (topo pra dentro)
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 24, 16), eyeMat);
    e.scale.set(0.82, 1.18, 0.3);
    e.position.set(s * 0.068, 0.145, 0.158);
    e.rotation.set(-0.05, s * 0.32, s * 0.3);
    head.add(e);
  }
  // braços longos: pivô no ombro, braço fino até a mão redonda na altura da coxa
  const arms = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.25, 1.42, 0);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.62, 6, 12), body);
    arm.position.y = -0.36;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 16, 12), body);
    hand.position.y = -0.73;
    pivot.add(arm, hand);
    pivot.rotation.z = s * 0.1;
    bob.add(pivot);
    return {pivot, hand, s};
  });
  // sapatos quadrados embaixo da barra
  const feet = [-1, 1].map((s) => {
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.075, 0.23), body);
    f.position.set(s * 0.1, 0.0375, 0.02);
    root.add(f);
    return {f, s};
  });

  const state = {headYaw: 0, headPitch: 0};
  return {
    group: root, eyeMat, head, arms, feet,
    faceLocal: V(0, 1.77, 0.12),
    /** walk 0..1 (passo), phase em rad; headYaw/Pitch em rad; reach: braço direito estendido (0..1) */
    update({walk = 0, phase = 0, headYaw = 0, headPitch = 0, lean = 0, reach = 0} = {}) {
      const sw = Math.sin(phase);
      for (const {f, s} of feet) f.position.z = 0.02 + s * sw * 0.16 * walk;
      for (const {pivot, s} of arms) {
        pivot.rotation.x = -s * sw * 0.18 * walk;
        pivot.rotation.z = s * 0.1;
      }
      if (reach > 0) arms[1].pivot.rotation.x = -1.2 * reach;
      bob.position.y = Math.abs(Math.cos(phase)) * 0.018 * walk;
      bob.rotation.x = lean;
      state.headYaw = headYaw; state.headPitch = headPitch;
      head.rotation.set(headPitch, headYaw, 0);
    },
  };
}
