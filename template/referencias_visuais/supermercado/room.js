// Sala simples: copa de escritório. Retorna grupo + pontos de interesse (pois) para câmera/olhares.
import * as THREE from 'three';
import {mesh, flat, toon, G} from './toon.js';
import {sign, paper, postIt, wallClock} from './props.js';
import {place} from './validate.js';

const W = 4.6, D = 4.4, H = 2.7; // x: -W/2..W/2, z: -2.6..1.8
const Z0 = -2.6, Z1 = 1.8;

function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#8f9bb5';
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#7a86a1';
  g.lineWidth = 5;
  g.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(W / 0.6, D / 0.6);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const strip = (len, axis) => {
  const s = 0.018;
  return new THREE.Mesh(G.box(axis === 'x' ? len : s, axis === 'y' ? len : s, axis === 'z' ? len : s), flat(0x24232b));
};

export function createRoom() {
  const g = new THREE.Group();
  const floorMat = new THREE.MeshToonMaterial({map: floorTexture(), gradientMap: toon(0xffffff).gradientMap});
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = (Z0 + Z1) / 2;
  g.add(floor);

  const wallLow = 0xcfc3a2, wallHigh = 0xe4dcc6, ceiling = 0xc9c7bd;
  const wall = (w, h, color) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon(color));
  // parede do fundo (2 faixas) e laterais
  const addWall = (w, x, z, ry) => {
    const lo = wall(w, 1.0, wallLow); lo.position.set(x, 0.5, z); lo.rotation.y = ry;
    const hi = wall(w, H - 1.0, wallHigh); hi.position.set(x, 1.0 + (H - 1.0) / 2, z); hi.rotation.y = ry;
    const rail = new THREE.Mesh(G.box(w, 0.05, 0.03), toon(0xb5a684));
    rail.position.set(x, 1.0, z); rail.rotation.y = ry;
    g.add(lo, hi, rail);
  };
  addWall(W, 0, Z0, 0);
  addWall(D, -W / 2, (Z0 + Z1) / 2, Math.PI / 2);
  addWall(D, W / 2, (Z0 + Z1) / 2, -Math.PI / 2);
  addWall(W, 0, Z1, Math.PI);
  const ceil = wall(W, D, ceiling);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, (Z0 + Z1) / 2);
  g.add(ceil);

  // linhas de quina (contorno estrutural)
  for (const x of [-W / 2, W / 2]) {
    const v = strip(H, 'y'); v.position.set(x + (x < 0 ? 0.01 : -0.01), H / 2, Z0 + 0.01); g.add(v);
    const top = strip(D, 'z'); top.position.set(x, H - 0.01, (Z0 + Z1) / 2); g.add(top);
    const bot = strip(D, 'z'); bot.position.set(x, 0.01, (Z0 + Z1) / 2); g.add(bot);
  }
  const topBack = strip(W, 'x'); topBack.position.set(0, H - 0.01, Z0 + 0.01); g.add(topBack);
  const botBack = strip(W, 'x'); botBack.position.set(0, 0.01, Z0 + 0.01); g.add(botBack);

  // luminárias de teto
  for (const [x, z] of [[-1, -1.6], [1, -1.6], [-1, 0.2], [1, 0.2]]) {
    const p = mesh(G.box(1.0, 0.04, 0.32), 0xf6f3e6, {outline: 2.5, material: flat(0xf6f3e6)});
    p.position.set(x, H - 0.03, z);
    g.add(p);
    for (let i = -2; i <= 2; i++) {
      const l = new THREE.Mesh(G.box(0.012, 0.01, 0.3), flat(0x9a9890));
      l.position.set(x + i * 0.19, H - 0.055, z);
      g.add(l);
    }
  }

  // porta (parede lateral direita da câmera) — entreaberta, escuro atrás
  const DOOR_Z = -0.95;
  const door = new THREE.Group();
  door.position.set(W / 2 - 0.02, 0, DOOR_Z);
  door.rotation.y = -Math.PI / 2;
  const frame = mesh(G.box(1.0, 2.15, 0.06), 0x55607a, {outline: 2.5});
  frame.position.set(0, 1.075, 0);
  const dark = new THREE.Mesh(G.box(0.86, 2.06, 0.01), flat(0x0d0f16));
  dark.position.set(0, 1.03, 0.032);
  const hinge = new THREE.Group();
  hinge.position.set(-0.43, 0, 0.04);
  const slab = mesh(G.box(0.86, 2.05, 0.05), 0x46669a, {outline: 2.5});
  slab.position.set(0.43, 1.03, 0);
  const glass = new THREE.Mesh(G.box(0.14, 0.6, 0.055), flat(0xdfe7ef));
  glass.position.set(0.62, 1.45, 0);
  const handle = mesh(G.box(0.12, 0.03, 0.05), 0xc9ccd2, {outline: 2});
  handle.position.set(0.74, 1.0, 0.05);
  // aviso na própria folha da porta (gira junto com ela)
  const keepShut = sign(0.5, 0.11, {title: 'MANTENHA FECHADA', bg: '#c0392b', fg: '#ffffff'});
  keepShut.position.set(0.43, 1.92, 0.025);
  hinge.add(slab, glass, handle, keepShut);
  // identificação da sala + leitor de crachá (LED verde = destravado, apesar de "trancada ontem")
  const plate = sign(0.26, 0.2, {title: '312', sub: 'ARQUIVO', band: 'VELTRA', bandColor: '#2b5fa8'});
  plate.position.set(0.78, 1.58, 0.005);
  const reader = mesh(G.box(0.075, 0.115, 0.03), 0x2b2d35, {outline: 2});
  reader.position.set(0.74, 1.2, 0.015);
  const led = new THREE.Mesh(G.sphere(0.008, 10, 8), flat(0x3ddc6a));
  led.position.set(0.74, 1.235, 0.032);
  const readerPad = new THREE.Mesh(G.box(0.045, 0.045, 0.005), flat(0x4a4e5a));
  readerPad.position.set(0.74, 1.18, 0.031);
  door.add(frame, dark, hinge, plate, reader, led, readerPad);
  g.add(door);

  // geladeira (fundo direito) com avisos de copa
  const FZ = Z0 + 0.645;
  const fridge = mesh(G.box(0.7, 1.75, 0.62), 0xe6e8ea, {outline: 2.5});
  fridge.position.set(1.4, 0.875, Z0 + 0.33);
  const fh = mesh(G.box(0.04, 0.4, 0.04), 0x9aa0aa, {outline: 2});
  fh.position.set(1.12, 1.15, Z0 + 0.66);
  const seam = new THREE.Mesh(G.box(0.7, 0.012, 0.01), flat(0x24232b));
  seam.position.set(1.4, 1.2, FZ);
  const marmita = paper(0.3, 0.2, {title: 'ATENÇÃO', accent: '#e67e22', lines: [{text: 'IDENTIFIQUE', bold: true, size: 0.15}, {text: 'SUA MARMITA', bold: true, size: 0.15}, {text: 'Sexta a geladeira é limpa', size: 0.08}], tilt: 0.03});
  marmita.position.set(1.45, 1.48, FZ);
  const iogurte = postIt(['Quem pegou', 'meu iogurte?'], {color: '#a8e0a0', tilt: -0.12, size: 0.12});
  iogurte.position.set(1.5, 0.95, FZ);
  g.add(fridge, fh, seam, marmita, iogurte);
  [[1.27, 1.6, 0xe74c3c], [1.62, 1.62, 0x3498db], [1.52, 1.03, 0xf1c40f]].forEach(([x, y, c]) => {
    const m = new THREE.Mesh(G.sphere(0.014, 10, 8), toon(c));
    m.position.set(x, y, FZ + 0.008);
    m.scale.z = 0.5;
    g.add(m);
  });

  // janela (parede esquerda)
  const win = new THREE.Group();
  win.position.set(-W / 2 + 0.02, 1.55, -0.9);
  win.rotation.y = Math.PI / 2;
  const wf = mesh(G.box(1.5, 1.0, 0.05), 0xf0ede4, {outline: 2.5});
  const sky = new THREE.Mesh(G.box(1.38, 0.88, 0.055), flat(0x9fc6e6));
  win.add(wf, sky);
  for (let i = 0; i < 9; i++) {
    const slat = new THREE.Mesh(G.box(1.38, 0.035, 0.06), toon(0xe8e4d8));
    slat.position.y = 0.4 - i * 0.1;
    win.add(slat);
  }
  g.add(win);

  // mural de recados: regras da copa (e a regra que importa para a história)
  const BZ = Z0 + 0.035;
  const board = mesh(G.box(1.1, 0.74, 0.03), 0xb98a57, {outline: 2.5});
  board.position.set(-0.82, 1.62, Z0 + 0.02);
  g.add(board);
  const pin = (x, y, c = 0xd63c3c) => {
    const p = new THREE.Mesh(G.sphere(0.011, 10, 8), toon(c));
    p.position.set(x, y, BZ + 0.006);
    g.add(p);
  };
  const aviso = paper(0.33, 0.42, {title: 'AVISO', lines: [
    {text: 'Copa fecha às 20h', size: 0.085},
    {text: 'Último a sair:', size: 0.085},
    {text: 'TRANCAR O', bold: true, size: 0.11, color: '#c0392b'},
    {text: 'ARQUIVO 312', bold: true, size: 0.11, color: '#c0392b'},
  ], tilt: 0.02});
  aviso.position.set(-1.16, 1.6, BZ);
  const limpeza = paper(0.21, 0.27, {title: 'LIMPEZA', accent: '#2b5fa8', lines: [
    {text: 'SEG  Rita', size: 0.1}, {text: 'QUA  Lia', size: 0.1, bold: true}, {text: 'SEX  Marcos', size: 0.1},
  ], tilt: -0.04});
  limpeza.position.set(-0.78, 1.7, BZ);
  const caneca = postIt(['Lave sua', 'caneca!'], {tilt: 0.1, size: 0.13});
  caneca.position.set(-0.47, 1.8, BZ);
  const bolo = postIt(['Bolo sexta', '15h :)'], {color: '#f4a7b9', tilt: -0.08, size: 0.13});
  bolo.position.set(-0.5, 1.47, BZ);
  g.add(aviso, limpeza, caneca, bolo);
  pin(-1.16, 1.815); pin(-0.78, 1.838, 0x3d7bd6); pin(-0.47, 1.86, 0x2fae5a); pin(-0.5, 1.53, 0xf0c419);

  // placa do ambiente + relógio (início da manhã: "chegou cedo")
  const copa = sign(0.62, 0.2, {title: 'COPA', sub: '3º ANDAR', bg: '#2b5fa8', fg: '#ffffff'});
  copa.position.set(-0.82, 2.2, Z0 + 0.01);
  g.add(copa);
  const clock = wallClock({radius: 0.17, time: [7, 52, 10]});
  clock.group.position.set(0.42, 2.15, Z0 + 0.01);
  g.add(clock.group);

  // bancada com armários, cafeteira, copos e micro-ondas (fundo esquerdo)
  const counter = mesh(G.box(1.4, 0.9, 0.6), 0x8f6f53, {outline: 2.5});
  counter.position.set(-1.45, 0.45, Z0 + 0.32);
  const top = mesh(G.box(1.45, 0.05, 0.65), 0xd9d4c8, {outline: 2.5});
  top.position.set(-1.45, 0.92, Z0 + 0.32);
  g.add(counter, top);
  for (const x of [-1.8, -1.1]) {
    const s = new THREE.Mesh(G.box(0.012, 0.78, 0.01), flat(0x5e4734));
    s.position.set(x + 0.0, 0.44, Z0 + 0.625);
    const hdl = mesh(G.box(0.02, 0.12, 0.025), 0xc9ccd2, {outline: 1.5});
    hdl.position.set(x - 0.06, 0.72, Z0 + 0.635);
    const hdl2 = mesh(G.box(0.02, 0.12, 0.025), 0xc9ccd2, {outline: 1.5});
    hdl2.position.set(x + 0.06, 0.72, Z0 + 0.635);
    g.add(s, hdl, hdl2);
  }
  // só o que entra no quadro: cafeteira (parcial) e micro-ondas
  const brewer = mesh(G.box(0.22, 0.34, 0.22), 0x2b2d35, {outline: 2.5});
  brewer.position.set(-1.5, 1.115, Z0 + 0.3);
  const pot = mesh(G.cyl(0.07, 0.075, 0.13, 20), 0x4a2c1c, {outline: 2});
  pot.position.set(-1.5, 1.015, Z0 + 0.43);
  const potLed = new THREE.Mesh(G.sphere(0.009, 10, 8), flat(0xff4a3a));
  potLed.position.set(-1.43, 1.2, Z0 + 0.415);
  const micro = mesh(G.box(0.46, 0.27, 0.34), 0xdfe1e4, {outline: 2.5});
  micro.position.set(-1.05, 1.08, Z0 + 0.27);
  const microWin = new THREE.Mesh(G.box(0.28, 0.17, 0.01), flat(0x2c3038));
  microWin.position.set(-1.1, 1.08, Z0 + 0.445);
  const microPad = new THREE.Mesh(G.box(0.08, 0.17, 0.01), flat(0x9aa0aa));
  microPad.position.set(-0.88, 1.08, Z0 + 0.445);
  g.add(brewer, pot, potLed, micro, microWin, microPad);

  // mesa + cadeiras
  const table = new THREE.Group();
  const tableTop = mesh(G.box(1.25, 0.05, 0.85), 0xd8a868, {outline: 3});
  tableTop.position.y = 0.7;
  tableTop.userData.prop = 'tampo da mesa';
  table.add(tableTop);
  for (const [x, z] of [[-0.56, -0.36], [0.56, -0.36], [-0.56, 0.36], [0.56, 0.36]]) {
    const leg = mesh(G.cyl(0.022, 0.022, 0.68, 12), 0x9aa0aa, {outline: 2});
    leg.position.set(x, 0.34, z);
    table.add(leg);
  }
  table.position.set(0, 0, 0);
  g.add(table);

  const chair = (z, ry) => {
    const c = new THREE.Group();
    const seat = mesh(G.box(0.46, 0.05, 0.44), 0x4e5f86, {outline: 2.5});
    seat.position.y = 0.45;
    const back = mesh(G.box(0.46, 0.42, 0.05), 0x4e5f86, {outline: 2.5});
    back.position.set(0, 0.74, -0.21);
    c.add(seat, back);
    for (const [x, zz] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) {
      const l = mesh(G.cyl(0.016, 0.016, 0.45, 10), 0x9aa0aa, {outline: 2});
      l.position.set(x, 0.225, zz);
      c.add(l);
    }
    c.position.z = z;
    c.rotation.y = ry;
    return c;
  };
  g.add(chair(-0.72, 0));

  // caneca (objeto da cena)
  const mug = new THREE.Group();
  const cup = mesh(G.cyl(0.042, 0.038, 0.1, 20), 0xd9534f, {outline: 2.5});
  cup.position.y = 0.05;
  const ear = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), 0xd9534f, {outline: 2});
  ear.position.set(0.045, 0.05, 0);
  mug.add(cup, ear);
  g.add(mug);

  // mesa: objetos apoiados pelo bounding box real (place)
  const napkinHolder = new THREE.Group();
  const napBase = mesh(G.box(0.13, 0.02, 0.07), 0x9aa0aa, {outline: 2});
  const napkins = mesh(G.box(0.115, 0.09, 0.045), 0xf7f5ef, {outline: 2});
  napkins.position.y = 0.055; // apoiado na base (0.01 + 0.045)
  napkinHolder.add(napBase, napkins);
  const sugar = new THREE.Group();
  const jar = mesh(G.cyl(0.03, 0.03, 0.1, 18), 0xe9eef2, {outline: 2});
  const sugarCap = mesh(G.cyl(0.026, 0.032, 0.035, 18), 0xb8bec8, {outline: 2});
  sugarCap.position.y = 0.0675; // tampa encaixada no topo do pote
  sugar.add(jar, sugarCap);
  g.add(napkinHolder, sugar);
  place(mug, tableTop, {x: 0.04, z: -0.05, name: 'caneca'}); // à frente dela, fora do caminho dos braços
  place(napkinHolder, tableTop, {x: -0.34, z: -0.08, name: 'porta-guardanapo'});
  place(sugar, tableTop, {x: -0.22, z: 0.0, name: 'açucareiro'});
  // bancada e chão
  place(brewer, top, {name: 'cafeteira'});
  place(pot, top, {z: Z0 + 0.49, name: 'jarra de café'});
  place(micro, top, {name: 'micro-ondas'});
  place(counter, floor, {name: 'bancada'});
  place(fridge, floor, {name: 'geladeira'});

  return {
    group: g,
    door: hinge,
    tableTop,
    tableProps: [mug, napkinHolder, sugar],
    update: (t) => clock.update(t),
    pois: {
      door: new THREE.Vector3(W / 2, 1.2, DOOR_Z),
      mug: mug.position.clone(),
      window: win.position.clone(),
    },
  };
}
