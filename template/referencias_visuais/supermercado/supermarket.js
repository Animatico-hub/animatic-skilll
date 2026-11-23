// Pequeno supermercado à noite: caixa (primeiro plano), corredores, geladeiras, saída e porta do depósito.
// Câmera POV sentada no caixa em (0, 1.25, 0.55) olhando para -Z.
import * as THREE from 'three';
import {mesh, flat, toon, G} from '../engine/toon.js';
import {sign, paper, panel, text, wallClock} from '../engine/props.js';
import {place} from '../engine/validate.js';

const X0 = -4, X1 = 4.2, Z0 = -9, Z1 = 2.5, H = 3.0;
export const DOOR = {x: X1, z: -0.6};   // porta do depósito (parede direita, abre para -X)
export const EXIT = {x: X0, z: -2.0};   // saída (parede esquerda)

function tiles() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d9dcdf'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#b9bdc3'; g.lineWidth = 3; g.strokeRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set((X1 - X0) / 0.5, (Z1 - Z0) / 0.5);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

const PRODUCT_COLORS = [0xe74c3c, 0xf1c40f, 0x3498db, 0x2ecc71, 0xe67e22, 0x9b59b6, 0xecf0f1, 0x1abc9c, 0xd35400, 0xc0392b];
function shelfUnit(g, x, z0, z1, rng, inst) {
  const len = z1 - z0, cz = (z0 + z1) / 2;
  const body = mesh(G.box(0.62, 1.7, len), 0xdfe3e8, {outline: 2.5});
  body.position.set(x, 0.85, cz);
  g.add(body);
  for (let s = 0; s < 4; s++) {
    const y = 0.25 + s * 0.42;
    for (const side of [-1, 1]) {
      const lip = new THREE.Mesh(G.box(0.05, 0.05, len), toon(0xc9ced6));
      lip.position.set(x + side * 0.33, y, cz);
      g.add(lip);
      for (let zz = z0 + 0.12; zz < z1 - 0.1; zz += 0.16 + rng() * 0.06) {
        const h = 0.14 + rng() * 0.16;
        inst.push({p: [x + side * 0.24, y + 0.03 + h / 2, zz], s: [0.12, h, 0.12], c: PRODUCT_COLORS[Math.floor(rng() * PRODUCT_COLORS.length)]});
      }
    }
  }
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function posScreen(lines) {
  return panel(0.3, 0.2, (c, w, h) => {
    c.fillStyle = '#123a5c'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2f6d4f'; c.fillRect(0, 0, w, h * 0.2);
    text(c, 'CAIXA 02 · VILA NOVA', w / 2, h * 0.1, {size: h * 0.11, color: '#fff', maxW: w * 0.92});
    lines.forEach((l, i) => text(c, l, w * 0.06, h * (0.34 + i * 0.16), {size: h * 0.1, color: '#e8f1ff', align: 'left', maxW: w * 0.9, weight: i === lines.length - 1 ? 'bold' : 'normal'}));
  }, {name: 'tela do caixa'});
}

export function createSupermarket() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshToonMaterial({map: tiles(), gradientMap: toon(0xffffff).gradientMap}));
  floor.rotation.x = -Math.PI / 2; floor.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  g.add(floor);
  const wall = (w, h, color) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon(color));
  const back = wall(X1 - X0, H, 0xe9e4d8); back.position.set((X0 + X1) / 2, H / 2, Z0); g.add(back);
  const left = wall(Z1 - Z0, H, 0xe9e4d8); left.rotation.y = Math.PI / 2; left.position.set(X0, H / 2, (Z0 + Z1) / 2); g.add(left);
  const right = wall(Z1 - Z0, H, 0xe9e4d8); right.rotation.y = -Math.PI / 2; right.position.set(X1, H / 2, (Z0 + Z1) / 2); g.add(right);
  const front = wall(X1 - X0, H, 0xe9e4d8); front.rotation.y = Math.PI; front.position.set((X0 + X1) / 2, H / 2, Z1); g.add(front);
  const ceil = wall(X1 - X0, Z1 - Z0, 0xcfd2d6); ceil.rotation.x = Math.PI / 2; ceil.position.set((X0 + X1) / 2, H, (Z0 + Z1) / 2); g.add(ceil);
  // faixa verde da marca nas paredes (rodapé alto)
  for (const [w, x, z, ry] of [[X1 - X0, (X0 + X1) / 2, Z0 + 0.01, 0], [Z1 - Z0, X0 + 0.01, (Z0 + Z1) / 2, Math.PI / 2], [Z1 - Z0, X1 - 0.01, (Z0 + Z1) / 2, -Math.PI / 2]]) {
    const b = wall(w, 0.25, 0x2f6d4f); b.position.set(x, 0.125, z); b.rotation.y = ry; g.add(b);
  }
  // quinas
  for (const [x, z] of [[X0, Z0], [X1, Z0]]) {
    const q = new THREE.Mesh(G.box(0.02, H, 0.02), flat(0x24232b)); q.position.set(x, H / 2, z); g.add(q);
  }
  // luminárias
  for (let x = -2.8; x <= 3.2; x += 2.0) for (let z = -7.5; z <= 0.5; z += 2.0) {
    const p = mesh(G.box(1.2, 0.04, 0.22), 0xf7f7f2, {outline: 2, material: flat(0xf7f7f2)});
    p.position.set(x, H - 0.03, z); g.add(p);
  }

  // ---------- corredores ----------
  const rng = mulberry(7);
  const inst = [];
  for (const x of [-2.3, -0.2, 1.9]) shelfUnit(g, x, -8.2, -3.2, rng, inst);
  const im = new THREE.InstancedMesh(G.box(1, 1, 1), new THREE.MeshToonMaterial({gradientMap: toon(0xffffff).gradientMap}), inst.length);
  const m4 = new THREE.Matrix4(), col = new THREE.Color();
  inst.forEach((it, i) => {
    m4.compose(new THREE.Vector3(...it.p), new THREE.Quaternion(), new THREE.Vector3(...it.s));
    im.setMatrixAt(i, m4); im.setColorAt(i, col.set(it.c));
  });
  g.add(im);
  [['1', 'MERCEARIA', -1.25], ['2', 'BEBIDAS', 0.85], ['3', 'FRIOS · LATICÍNIOS', 3.05]].forEach(([n, label, x]) => {
    const s = sign(1.0, 0.3, {title: `${n} · ${label}`, bg: '#2f6d4f', fg: '#ffffff'});
    s.position.set(x, 2.45, -3.0); g.add(s);
    for (const dx of [-0.35, 0.35]) { const w = new THREE.Mesh(G.box(0.01, 0.4, 0.01), flat(0x55585e)); w.position.set(x + dx, 2.8, -3.0); g.add(w); }
  });
  const banner = sign(3.2, 0.6, {title: 'MERCADO VILA NOVA', sub: 'aberto das 7h às 22h', bg: '#2f6d4f', fg: '#ffffff'});
  banner.position.set(0.3, 2.3, Z0 + 0.01); g.add(banner);

  // ---------- geladeiras (parede direita, longe da porta do depósito) ----------
  for (let z = -8.2; z < -2.3; z += 1.0) {
    const f = mesh(G.box(0.7, 2.0, 0.96), 0xd5dbe2, {outline: 2.5});
    f.position.set(X1 - 0.36, 1.0, z + 0.48); g.add(f);
    const glass = new THREE.Mesh(G.box(0.02, 1.6, 0.82), flat(0xbfe6f5));
    glass.position.set(X1 - 0.72, 1.05, z + 0.48); g.add(glass);
    for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) {
      const b = new THREE.Mesh(G.cyl(0.04, 0.04, 0.22, 10), flat(PRODUCT_COLORS[(r * 4 + k) % PRODUCT_COLORS.length]));
      b.position.set(X1 - 0.6, 0.45 + r * 0.38, z + 0.2 + k * 0.19); g.add(b);
    }
  }

  // ---------- saída (parede esquerda) ----------
  const exit = new THREE.Group();
  exit.position.set(EXIT.x + 0.01, 0, EXIT.z); exit.rotation.y = Math.PI / 2;
  const night = new THREE.Mesh(G.box(1.8, 2.3, 0.01), flat(0x0b1426)); night.position.y = 1.15;
  const frame = mesh(G.box(1.95, 2.42, 0.04), 0x9aa2ad, {outline: 2.5}); frame.position.set(0, 1.21, -0.03);
  const mid = new THREE.Mesh(G.box(0.04, 2.3, 0.03), flat(0x9aa2ad)); mid.position.set(0, 1.15, 0.01);
  const street = new THREE.Mesh(G.sphere(0.12, 12, 8), flat(0xffd88a)); street.position.set(0.5, 2.0, 0.0);
  const saida = sign(0.55, 0.2, {title: 'SAÍDA', bg: '#1e8f4e', fg: '#ffffff'}); saida.position.set(0, 2.62, 0);
  exit.add(frame, night, mid, street, saida);
  g.add(exit);

  // ---------- porta do depósito (parede direita) ----------
  const dep = new THREE.Group();
  dep.position.set(DOOR.x - 0.01, 0, DOOR.z); dep.rotation.y = -Math.PI / 2;
  const dframe = mesh(G.box(1.05, 2.18, 0.05), 0x6b7079, {outline: 2.5}); dframe.position.set(0, 1.09, -0.02);
  const slab = mesh(G.box(0.92, 2.05, 0.05), 0x9ea6b0, {outline: 2.5}); slab.position.set(0, 1.055, 0.02);
  const gap = new THREE.Mesh(G.box(0.92, 0.03, 0.06), flat(0x07080b)); gap.position.set(0, 0.015, 0.02);
  const bar = mesh(G.box(0.6, 0.05, 0.06), 0xc9ccd2, {outline: 2}); bar.position.set(0, 1.0, 0.07);
  const lock = mesh(G.cyl(0.03, 0.03, 0.03, 12), 0xc9a640, {outline: 1.5}); lock.rotation.x = Math.PI / 2; lock.position.set(0.32, 1.12, 0.06);
  const depSign = sign(0.7, 0.24, {title: 'DEPÓSITO', sub: 'SOMENTE FUNCIONÁRIOS', bg: '#f4f1e8', fg: '#1b1a22', band: 'VILA NOVA', bandColor: '#2f6d4f'});
  depSign.position.set(0, 1.62, 0.05);
  const lamp = new THREE.Mesh(G.box(0.3, 0.06, 0.08), flat(0xfff6d8)); lamp.position.set(0, 2.32, 0.05);
  dep.add(dframe, slab, gap, bar, lock, depSign, lamp);
  // alarme de incêndio (sirene + estroboscópio) ao lado da porta
  const alarmBox = mesh(G.box(0.16, 0.16, 0.07), 0xc0392b, {outline: 2}); alarmBox.position.set(-0.8, 2.25, 0.03);
  const strobe = new THREE.Mesh(G.box(0.1, 0.05, 0.04), new THREE.MeshBasicMaterial({color: 0x5a1010})); strobe.position.set(-0.8, 2.36, 0.08);
  const alarmLbl = sign(0.22, 0.07, {title: 'INCÊNDIO', bg: '#c0392b', fg: '#ffffff'}); alarmLbl.position.set(-0.8, 2.11, 0.03);
  dep.add(alarmBox, strobe, alarmLbl);
  g.add(dep);
  const alarmLight = new THREE.PointLight(0xff2a1a, 0, 7, 1.6);
  alarmLight.position.set(DOOR.x - 0.5, 2.2, DOOR.z - 0.8); g.add(alarmLight);

  // ---------- pilar com relógio (21:55) e pilar com quadro de chaves ----------
  const pillar = mesh(G.box(0.36, H, 0.36), 0xe9e4d8, {outline: 2.5}); pillar.position.set(-0.95, H / 2, -2.55); g.add(pillar);
  const clock = wallClock({radius: 0.2, time: [21, 55, 0]});
  clock.group.position.set(-0.95, 2.1, -2.37); g.add(clock.group);
  // pilar à frente-direita: fora da linha de visão caixa → porta do depósito
  const kcol = mesh(G.box(0.4, H, 0.4), 0xe9e4d8, {outline: 2.5}); kcol.position.set(1.5, H / 2, -1.55); g.add(kcol);
  const kboard = panel(0.42, 0.5, (c, w, h) => {
    c.fillStyle = '#7a5a3a'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f4f1e8'; c.fillRect(w * 0.06, h * 0.04, w * 0.88, h * 0.16);
    text(c, 'QUADRO DE CHAVES', w / 2, h * 0.12, {size: h * 0.075, font: 'bold', maxW: w * 0.84});
    ['DEPÓSITO', 'CÂMARA FRIA', 'ESCRITÓRIO', 'PORTA FUNDOS'].forEach((l, i) => {
      const y = h * (0.32 + i * 0.17);
      c.fillStyle = '#f4f1e8'; c.fillRect(w * 0.08, y - h * 0.04, w * 0.5, h * 0.08);
      text(c, l, w * 0.33, y, {size: h * 0.05, maxW: w * 0.46});
    });
  }, {depth: 0.02, body: 0x5e4630, name: 'quadro de chaves'});
  kboard.position.set(1.5, 1.45, -1.35); g.add(kboard); // face +Z, voltada para o caixa
  const hooks = [];
  for (let i = 0; i < 4; i++) { // gancho à direita de cada etiqueta
    const hk = new THREE.Group();
    hk.position.set(1.62, 1.7 - 0.5 * (0.32 + i * 0.17), -1.32);
    const ring = mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 14), 0xc9a640, {outline: 1});
    ring.position.y = -0.02;
    const key = new THREE.Mesh(G.box(0.005, 0.045, 0.012), flat(0xb8a04a)); key.position.y = -0.055;
    hk.add(ring, key); g.add(hk); hooks.push(hk);
  }

  // ---------- caixa (primeiro plano) ----------
  const counter = mesh(G.box(2.0, 0.86, 0.75), 0x3b6e57, {outline: 3}); counter.position.set(-0.1, 0.43, -0.25); g.add(counter);
  const top = mesh(G.box(2.0, 0.03, 0.75), 0xd9dde2, {outline: 2.5}); g.add(top);
  place(top, counter, {x: -0.1, z: -0.25, name: 'tampo do caixa'});
  const belt = new THREE.Mesh(G.box(0.95, 0.008, 0.42), toon(0x26272c)); g.add(belt);
  place(belt, top, {x: -0.62, z: -0.3, name: 'esteira'});
  const scanner = new THREE.Mesh(G.box(0.26, 0.006, 0.2), new THREE.MeshBasicMaterial({color: 0x2a0d10})); g.add(scanner);
  place(scanner, top, {x: 0.0, z: -0.3, name: 'scanner'});
  const tray = mesh(G.box(0.4, 0.012, 0.3), 0xb9bec6, {outline: 1.5}); g.add(tray);
  place(tray, top, {x: 0.45, z: -0.25, name: 'área de empacotar'});
  // monitor baixo e mais à direita: não encobre o gerente quando ele está no quadro de chaves
  const posStand = mesh(G.cyl(0.02, 0.05, 0.1, 10), 0x2b2d35, {outline: 2}); g.add(posStand);
  place(posStand, top, {x: 0.74, z: 0.06, name: 'suporte do monitor'});
  const posBody = mesh(G.box(0.34, 0.24, 0.03), 0x2b2d35, {outline: 2});
  const screens = [posScreen(['CAIXA LIVRE', '', 'Aguardando...']), posScreen(['PÃO FRANCÊS  4,90', '', 'TOTAL  R$ 4,90']), posScreen(['PÃO FRANCÊS  4,90', 'LEITE INTEGRAL  6,90', 'TOTAL  R$ 11,80'])];
  const posGroup = new THREE.Group();
  posGroup.position.set(0.74, 1.08, 0.06); posGroup.rotation.set(-0.25, -0.75, 0); posGroup.scale.setScalar(0.85);
  posGroup.add(posBody);
  screens.forEach((s) => { s.position.z = 0.016; posGroup.add(s); });
  g.add(posGroup);
  const drawer = mesh(G.box(0.42, 0.1, 0.36), 0x2b2d35, {outline: 2}); drawer.position.set(0.42, 0.76, -0.06); g.add(drawer);
  const cardMachine = mesh(G.box(0.08, 0.03, 0.15), 0x1f2228, {outline: 1.5}); g.add(cardMachine);
  place(cardMachine, top, {x: 0.12, z: 0.0, name: 'maquininha'});
  cardMachine.rotation.x = 0;
  const bagRack = mesh(G.box(0.3, 0.25, 0.04), 0xf2f2f2, {outline: 1.5}); g.add(bagRack);
  place(bagRack, top, {x: 0.45, z: -0.6, name: 'sacolas'});
  const aviso = paper(0.2, 0.14, {title: 'ATENÇÃO', accent: '#c0392b', lines: [{text: 'FECHAMENTO 22H', bold: true, size: 0.14}, {text: 'conferir o caixa', size: 0.11}]});
  aviso.rotation.set(-Math.PI / 2 + 0.05, 0, 0.12);
  aviso.position.set(0.2, 0.878, 0.03); g.add(aviso);
  const lanePole = mesh(G.cyl(0.02, 0.02, 0.95, 10), 0x9aa2ad, {outline: 2}); g.add(lanePole);
  place(lanePole, top, {x: -1.03, z: -0.58, name: 'poste do caixa'});
  const laneSign = sign(0.22, 0.22, {title: '2', bg: '#2f6d4f', fg: '#ffffff'}); laneSign.position.set(-1.03, 1.95, -0.57); g.add(laneSign);

  // ---------- objetos narrativos ----------
  const bread = mesh(G.capsule(0.045, 0.16), 0xd9a35b, {outline: 2}); bread.rotation.z = Math.PI / 2;
  const breadG = new THREE.Group(); breadG.add(bread); breadG.userData.halfH = 0.045;
  const milk = new THREE.Group();
  const carton = mesh(G.box(0.07, 0.19, 0.07), 0xf4f6f8, {outline: 2});
  const label = new THREE.Mesh(G.box(0.072, 0.07, 0.072), flat(0x2b6cb0));
  milk.add(carton, label); milk.userData.halfH = 0.095;
  const bag = new THREE.Group();
  const bagBody = mesh(G.box(0.24, 0.26, 0.14), 0xf2f2f2, {outline: 2}); bagBody.position.y = 0.13;
  const handle = mesh(new THREE.TorusGeometry(0.06, 0.008, 6, 16, Math.PI), 0xf2f2f2, {outline: 1.5}); handle.position.y = 0.26;
  bag.add(bagBody, handle);
  const box = new THREE.Group();
  const boxBody = mesh(G.box(0.24, 0.2, 0.3), 0xc49a6c, {outline: 2.5});
  const tape = new THREE.Mesh(G.box(0.05, 0.205, 0.305), toon(0xd9c27e)); box.add(boxBody, tape);
  box.userData.halfH = 0.1;
  g.add(breadG, milk, bag, box);

  return {
    group: g, counterTop: top, belt, tray, drawer, scanner, screens, clock, alarmLight, strobe,
    items: {bread: breadG, milk, bag, box}, hooks,
    pois: {
      clock: new THREE.Vector3(-0.95, 2.1, -2.37),
      door: new THREE.Vector3(DOOR.x, 1.15, DOOR.z),
      doorBottom: new THREE.Vector3(DOOR.x - 0.05, 0.2, DOOR.z),
      exit: new THREE.Vector3(EXIT.x, 1.25, EXIT.z),
      alarm: new THREE.Vector3(DOOR.x, 2.25, DOOR.z - 0.8),
      scanner: new THREE.Vector3(0, 0.9, -0.32),
      bagArea: new THREE.Vector3(0.45, 0.92, -0.32),
      counter: new THREE.Vector3(0.1, 0.88, -0.15),
      keyboard: new THREE.Vector3(1.5, 1.45, -1.35),
    },
  };
}
