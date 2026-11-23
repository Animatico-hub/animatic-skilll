// Corredor da parte 5: luz cortada (disjuntor), só luz de emergência; no fundo, a porta de vidro da portaria
// estourada de claridade e ele parado na frente (silhueta preta, olhos brancos). Quepe + rádio da polícia no chão.
// Corredor ao longo de z: x de -W/2 a +W/2, nós perto de z = +1, saída em z = Z0.
import * as THREE from 'three';
import {mesh, toon, flat, G} from '../../engine/toon.js';
import {sign, paper, canvasTexture} from '../../engine/props.js';

export const HALL = {W: 2.8, Z0: -16, Z1: 3.5, H: 3.2};
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const texMat = (tex) => new THREE.MeshToonMaterial({map: tex, gradientMap: toon(0xffffff).gradientMap});

function granilite(wM, hM) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b9b2a2'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#a69e8c';
  for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 256, (i * 53) % 256, 6, 4);
  g.strokeStyle = '#8f8775'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(wM / 0.8, hM / 0.8);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function walls(g, {W, Z0, Z1, H}) {
  const D = Z1 - Z0, lowH = 1.1;
  const add = (w, x, z, ry) => {
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, lowH), toon(0x6f9f8a)); lo.position.set(x, lowH / 2, z); lo.rotation.y = ry;
    const hi = new THREE.Mesh(new THREE.PlaneGeometry(w, H - lowH), toon(0xece4cf)); hi.position.set(x, lowH + (H - lowH) / 2, z); hi.rotation.y = ry;
    const rail = new THREE.Mesh(G.box(w, 0.04, 0.02), toon(0x4d7d69)); rail.position.set(x, lowH, z); rail.rotation.y = ry;
    g.add(lo, hi, rail);
  };
  add(W, 0, Z0, 0);
  add(D, -W / 2, (Z0 + Z1) / 2, Math.PI / 2);
  add(D, W / 2, (Z0 + Z1) / 2, -Math.PI / 2);
  add(W, 0, Z1, Math.PI);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), toon(0xdedbd0));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, (Z0 + Z1) / 2);
  g.add(ceil);
}

/** vão de porta de sala aberta (sala vazia e escura), na parede x = side*W/2 */
function openDoor(g, side, z, label, sub) {
  const {W} = HALL;
  const d = new THREE.Group();
  d.position.set(side * (W / 2 - 0.01), 0, z);
  d.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
  const frame = mesh(G.box(1.0, 2.15, 0.05), 0x55607a, {outline: 2.5});
  frame.position.set(0, 1.075, 0.0);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 2.05), new THREE.MeshBasicMaterial({color: 0x0b0d14}));
  hole.position.set(0, 1.03, 0.03);
  // folha aberta pra dentro da sala: só a borda aparece
  const leaf = mesh(G.box(0.05, 2.05, 0.6), 0x3f6fb5, {outline: 2});
  leaf.position.set(-0.4, 1.03, -0.3);
  d.add(frame, hole, leaf);
  const plate = sign(0.34, 0.2, {title: label, sub, band: 'ESCOLA ESTADUAL', bandColor: '#2b5fa8'});
  plate.position.set(0, 2.3, 0.03);
  d.add(plate);
  g.add(d);
  return d;
}

/** o homem: silhueta toda preta (contra a luz), olhos que refletem branco */
function makeMan() {
  const g = new THREE.Group();
  const black = new THREE.MeshBasicMaterial({color: 0x040406});
  const cap = (r, len, a, b) => {
    const A = V(...a), B = V(...b), d = B.clone().sub(A);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len ?? d.length(), 8, 16), black);
    m.position.copy(A).lerp(B, 0.5);
    m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    g.add(m);
    return m;
  };
  cap(0.085, null, [-0.11, 0.08, 0], [-0.12, 0.86, 0]);
  cap(0.085, null, [0.11, 0.08, 0], [0.12, 0.86, 0]);
  const torso = cap(0.21, null, [0, 0.95, 0], [0, 1.4, 0]);
  torso.scale.set(1.3, 1, 0.75);
  const shoulders = new THREE.Mesh(G.sphere(0.2, 20, 14), black);
  shoulders.scale.set(1.75, 0.55, 0.85); shoulders.position.set(0, 1.47, 0);
  g.add(shoulders);
  cap(0.07, null, [-0.33, 1.45, 0], [-0.36, 0.86, 0.04]);
  cap(0.07, null, [0.33, 1.45, 0], [0.3, 1.0, 0.18]);  // braço direito segurando o celular
  const head = new THREE.Mesh(G.sphere(0.135, 24, 18), black);
  head.position.set(0, 1.72, 0.01);
  const hood = new THREE.Mesh(G.sphere(0.165, 24, 18), black);
  hood.scale.set(1, 1.08, 1.05); hood.position.set(0, 1.74, -0.03);
  g.add(head, hood);
  // celular na mão direita (tela apagada) + faixa da mão mordida, quase invisível no contraluz
  const phone = new THREE.Mesh(G.box(0.07, 0.14, 0.012), new THREE.MeshBasicMaterial({color: 0x101216}));
  phone.position.set(0.3, 0.98, 0.25); phone.rotation.x = -0.5;
  const band = new THREE.Mesh(G.cyl(0.05, 0.05, 0.06, 14), new THREE.MeshBasicMaterial({color: 0x2a2a2e}));
  band.position.set(0.3, 0.95, 0.19);
  g.add(phone, band);
  const eyeMat = new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: 0});
  for (const x of [-0.05, 0.05]) {
    const e = new THREE.Mesh(G.sphere(0.024, 16, 10), eyeMat);
    e.scale.set(1.25, 0.8, 0.4);
    e.position.set(x, 1.725, 0.135);
    g.add(e);
  }
  return {group: g, eyeMat, face: V(0, 1.72, 0)};
}

export function createHall(opts = {}) {
  const {W, Z0, Z1, H} = {...HALL, ...opts};   // opts.Z1: estende o corredor pra trás (parte 6)
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, Z1 - Z0), texMat(granilite(W, Z1 - Z0)));
  floor.rotation.x = -Math.PI / 2; floor.position.z = (Z0 + Z1) / 2;
  g.add(floor);
  walls(g, {W, Z0, Z1, H});

  // calhas apagadas (a luz caiu)
  for (let z = 2; z > Z0 + 1; z -= 3) {
    const p = mesh(G.box(0.22, 0.05, 1.2), 0x6d7078, {outline: 2});
    p.position.set(0, H - 0.04, z);
    g.add(p);
  }
  // luzes de emergência (caixinha branca com dois faróis acesos)
  const emerg = [];
  for (const [side, z] of [[-1, -1.6], [1, -7.4], [-1, -12.2]]) {
    const u = new THREE.Group();
    const box = mesh(G.box(0.36, 0.13, 0.09), 0xf2efe6, {outline: 2});
    u.add(box);
    for (const x of [-0.12, 0.12]) {
      const lamp = new THREE.Mesh(G.sphere(0.04, 14, 10), flat(0xffffff));
      lamp.position.set(x, -0.05, 0.06);
      u.add(lamp);
    }
    u.position.set(side * (W / 2 - 0.05), 2.65, z);
    u.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    g.add(u);
    const l = new THREE.PointLight(0xd6e2ff, 1.3, 7, 1.3);
    l.position.set(side * (W / 2 - 0.4), 2.4, z);
    g.add(l);
    emerg.push(l);
  }

  // portas: a nossa (aberta ao nosso lado), outras salas vazias, a secretaria lá no fundo
  openDoor(g, 1, 1.6, 'SALA 7', '3º ANO B');
  openDoor(g, 1, -4.2, 'SALA 13', '3º ANO C');
  openDoor(g, 1, -10.2, 'SALA 14', '2º ANO A');
  openDoor(g, -1, -5.8, 'SALA 11', '3º ANO A');
  const sec = openDoor(g, -1, -13.2, 'SECRETARIA', 'ATENDIMENTO');
  sec.children[3].scale.set(1.15, 1.15, 1);

  // bebedouro e mural
  const fountain = new THREE.Group();
  const fb = mesh(G.box(0.5, 0.9, 0.36), 0xc9ccd2, {outline: 2.5});
  fb.position.y = 0.45;
  const ftop = mesh(G.box(0.52, 0.06, 0.38), 0xe6e8ea, {outline: 2});
  ftop.position.y = 0.93;
  fountain.add(fb, ftop);
  fountain.position.set(-W / 2 + 0.19, 0, -2.9);
  fountain.rotation.y = Math.PI / 2;
  g.add(fountain);
  const fsign = sign(0.42, 0.14, {title: 'BEBEDOURO', bg: '#2b5fa8', fg: '#ffffff'});
  fsign.position.set(-W / 2 + 0.015, 1.5, -2.9);
  fsign.rotation.y = Math.PI / 2;
  g.add(fsign);
  const board = mesh(G.box(0.03, 0.8, 1.4), 0xb98a57, {outline: 2.5});
  board.position.set(W / 2 - 0.02, 1.6, -1.5);
  g.add(board);
  const notice = paper(0.36, 0.48, {title: 'ATENÇÃO', accent: '#c0392b', lines: [
    {text: 'Em caso de', size: 0.09}, {text: 'ALARME', bold: true, size: 0.14, color: '#c0392b'}, {text: 'trancar a sala', size: 0.08}], tilt: -0.03});
  notice.position.set(W / 2 - 0.04, 1.62, -1.5);
  notice.rotation.y = -Math.PI / 2;
  g.add(notice);

  // fundo: porta de vidro da portaria (dá no portão das viaturas), estourada de claridade
  const exit = new THREE.Group();
  exit.position.set(0, 0, Z0 + 0.02);
  const eFrame = mesh(G.box(1.9, 2.4, 0.06), 0x3a3f4a, {outline: 2.5});
  eFrame.position.y = 1.2;
  const glow = new THREE.MeshBasicMaterial({color: 0xf6f9ff});
  for (const x of [-0.45, 0.45]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.2), glow);
    pane.position.set(x, 1.15, 0.035);
    exit.add(pane);
  }
  const mid = mesh(G.box(0.05, 2.3, 0.07), 0x3a3f4a, {outline: 1.5});
  mid.position.set(0, 1.15, 0.04);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.0), new THREE.MeshBasicMaterial({map: canvasTexture(2.8, 3.0, (c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h * 0.6, w * 0.15, w / 2, h * 0.6, w * 0.55);
    gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }, 120), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  halo.position.set(0, 1.4, 0.05);
  exit.add(eFrame, mid, halo);
  const saida = new THREE.Mesh(G.box(0.62, 0.22, 0.06), new THREE.MeshBasicMaterial({map: canvasTexture(0.62, 0.22, (c, w, h) => {
    c.fillStyle = '#1fa64a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; c.font = `900 ${h * 0.62}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('SAÍDA', w * 0.56, h * 0.54);
    c.fillRect(w * 0.06, h * 0.25, w * 0.1, h * 0.5);
  }, 900)}));
  saida.position.set(0, 2.62, 0.05);
  const port = sign(0.6, 0.18, {title: 'PORTARIA', bg: '#2b5fa8', fg: '#ffffff'});
  port.position.set(-1.1, 2.0, 0.03);
  exit.add(saida, port);
  g.add(exit);
  // claridade espalhada no chão a partir da porta
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(W, 6), new THREE.MeshBasicMaterial({map: canvasTexture(2.8, 6, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(235,242,255,0.55)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }, 60), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.005, Z0 + 3);
  g.add(spill);
  const exitLight = new THREE.PointLight(0xeef4ff, 2.2, 7, 1.2);
  exitLight.position.set(0, 1.8, Z0 + 1.2);
  g.add(exitLight);

  // ele: parado na frente da porta, de frente pro corredor
  const man = makeMan();
  man.group.position.set(0.05, 0, Z0 + 0.75);
  g.add(man.group);

  // no meio do caminho: quepe e rádio da polícia (os policiais que entraram pela secretaria)
  const kepi = new THREE.Group();
  const crown = mesh(G.cyl(0.12, 0.1, 0.09, 24), 0x1d2a44, {outline: 2});
  crown.position.y = 0.045;
  const top = mesh(G.cyl(0.135, 0.135, 0.02, 24), 0x1d2a44, {outline: 1.5});
  top.position.y = 0.1;
  const visor = mesh(G.box(0.16, 0.012, 0.09), 0x0b0c10, {outline: 1.5});
  visor.position.set(0, 0.008, 0.12);
  const badge = new THREE.Mesh(G.sphere(0.018, 10, 8), flat(0xe0b43a));
  badge.position.set(0, 0.06, 0.11); badge.scale.z = 0.4;
  kepi.add(crown, top, visor, badge);
  kepi.position.set(-0.35, 0, -7.6); kepi.rotation.set(0, 0.6, 0.35);
  g.add(kepi);
  const radio = new THREE.Group();
  const rb = mesh(G.box(0.07, 0.035, 0.17), 0x15161a, {outline: 2});
  rb.position.y = 0.018;
  const ant = mesh(G.cyl(0.008, 0.008, 0.12, 8), 0x15161a, {outline: 1.5});
  ant.rotation.x = Math.PI / 2; ant.position.set(0.02, 0.02, -0.13);
  const ledMat = new THREE.MeshBasicMaterial({color: 0xff2020});
  const led = new THREE.Mesh(G.sphere(0.012, 10, 8), ledMat);
  led.position.set(-0.02, 0.04, -0.05);
  radio.add(rb, ant, led);
  radio.position.set(0.32, 0, -8.0); radio.rotation.y = -0.4;
  g.add(radio);
  const redGlow = new THREE.PointLight(0xff2020, 0.6, 1.4, 1.5);
  redGlow.position.set(0.32, 0.12, -8.0);
  g.add(redGlow);

  return {
    group: g, man, emerg, ledMat, redGlow, radio, kepi, exit,
    pois: {exit: V(0, 1.25, Z0 + 0.75), manFace: V(0.05, 1.72, Z0 + 0.75), floorItems: V(0, 0.08, -7.8), radio: V(0.32, 0.05, -8.0)},
  };
}
