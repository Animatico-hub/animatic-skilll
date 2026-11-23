// Sala de aula de escola pública brasileira . Câmera sentada na fileira de trás, olhando para -Z.
import * as THREE from 'three';
import {mesh, flat, toon, G} from '../engine/toon.js';
import {sign, paper, postIt, wallClock, panel, text, canvasTexture} from '../engine/props.js';
import {place} from '../engine/validate.js';

const W = 7.2, H = 3.0;
const Z0 = -6.2, Z1 = 2.2; // parede da lousa .. parede do fundo
const D = Z1 - Z0;

export const DESK_TOP = 0.725;
export const COLS = [-2.2, -1.1, 0, 1.1, 2.2];
export const ROWS = [0.55, -0.85, -2.25, -3.6]; // centro das carteiras (z)
export const SEAT_OFFSET = 0.4;                  // aluno senta atrás da carteira (+z)

function floorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#b9b2a2'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#a69e8c';
  for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 256, (i * 53) % 256, 6, 4); // granilite
  g.strokeStyle = '#8f8775'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(W / 0.8, D / 0.8);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const strip = (len, axis) => {
  const s = 0.02;
  return new THREE.Mesh(G.box(axis === 'x' ? len : s, axis === 'y' ? len : s, axis === 'z' ? len : s), flat(0x24232b));
};

/** Carteira escolar (tampo + estrutura metálica) e cadeira separada. Origem no chão, centro do tampo. */
export function makeDesk() {
  const d = new THREE.Group();
  const top = mesh(G.box(0.6, 0.03, 0.45), 0xd9b98a, {outline: 2.5});
  top.position.y = DESK_TOP - 0.015;
  top.userData.prop = 'tampo da carteira';
  const shelf = mesh(G.box(0.54, 0.02, 0.36), 0x6b7280, {outline: 2});
  shelf.position.set(0, DESK_TOP - 0.085, -0.04); // alto o bastante para as coxas de quem senta passarem
  d.add(top, shelf);
  for (const [x, z] of [[-0.27, -0.19], [0.27, -0.19], [-0.27, 0.19], [0.27, 0.19]]) {
    const l = mesh(G.cyl(0.014, 0.014, DESK_TOP - 0.03, 8), 0x3d4250, {outline: 1.5});
    l.position.set(x, (DESK_TOP - 0.03) / 2, z);
    d.add(l);
  }
  d.userData.top = top;
  return d;
}

export function makeChair(color = 0x3f6fb5) {
  const c = new THREE.Group();
  const seat = mesh(G.box(0.42, 0.04, 0.4), color, {outline: 2.5});
  seat.position.y = 0.45;
  const back = mesh(G.box(0.42, 0.26, 0.035), color, {outline: 2.5});
  back.position.set(0, 0.78, 0.19);
  const post = mesh(G.box(0.03, 0.3, 0.02), 0x3d4250, {outline: 1.5});
  post.position.set(0, 0.6, 0.19);
  c.add(seat, back, post);
  for (const [x, z] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) {
    const l = mesh(G.cyl(0.012, 0.012, 0.43, 8), 0x3d4250, {outline: 1.5});
    l.position.set(x, 0.215, z);
    c.add(l);
  }
  return c;
}

/** Bloco amarelo pautado com margem vermelha . */
export const yellowPadDraw = (header) => (c, w, h) => {
  c.fillStyle = '#f7e27c'; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#7fa6c9'; c.lineWidth = Math.max(1, h * 0.006);
  for (let y = h * 0.16; y < h; y += h * 0.075) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = '#d0453a'; c.lineWidth = Math.max(1.5, w * 0.008);
  c.beginPath(); c.moveTo(w * 0.14, 0); c.lineTo(w * 0.14, h); c.stroke();
  if (header) text(c, header, w * 0.55, h * 0.09, {size: h * 0.075, font: 'hand', weight: 'normal', color: '#c0392b', maxW: w * 0.75});
};

/**
 * opts.toques = layout "sala barricada": sem a fileira da frente, porta na parede direita,
 * mesa da professora móvel (barricada), cartaz do protocolo, interruptor e campainha.
 */
export function createClassroom(opts = {}) {
  const T = !!opts.toques;
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D),
    new THREE.MeshToonMaterial({map: floorTexture(), gradientMap: toon(0xffffff).gradientMap}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = (Z0 + Z1) / 2;
  floor.userData.prop = 'piso';
  g.add(floor);

  // paredes: barra inferior verde-escola + parte superior creme
  const lowC = 0x6f9f8a, highC = 0xece4cf;
  const addWall = (w, x, z, ry) => {
    const lo = new THREE.Mesh(new THREE.PlaneGeometry(w, 1.1), toon(lowC)); lo.position.set(x, 0.55, z); lo.rotation.y = ry;
    const hi = new THREE.Mesh(new THREE.PlaneGeometry(w, H - 1.1), toon(highC)); hi.position.set(x, 1.1 + (H - 1.1) / 2, z); hi.rotation.y = ry;
    const rail = new THREE.Mesh(G.box(w, 0.04, 0.02), toon(0x4d7d69)); rail.position.set(x, 1.1, z); rail.rotation.y = ry;
    g.add(lo, hi, rail);
  };
  addWall(W, 0, Z0, 0);
  addWall(D, -W / 2, (Z0 + Z1) / 2, Math.PI / 2);
  addWall(D, W / 2, (Z0 + Z1) / 2, -Math.PI / 2);
  addWall(W, 0, Z1, Math.PI);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), toon(0xdedbd0));
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, H, (Z0 + Z1) / 2);
  g.add(ceil);
  for (const x of [-W / 2, W / 2]) {
    const v = strip(H, 'y'); v.position.set(x + (x < 0 ? 0.012 : -0.012), H / 2, Z0 + 0.012); g.add(v);
    const t = strip(D, 'z'); t.position.set(x, H - 0.012, (Z0 + Z1) / 2); g.add(t);
    const b = strip(D, 'z'); b.position.set(x, 0.012, (Z0 + Z1) / 2); g.add(b);
  }
  const tb = strip(W, 'x'); tb.position.set(0, H - 0.012, Z0 + 0.012); g.add(tb);
  const bb = strip(W, 'x'); bb.position.set(0, 0.012, Z0 + 0.012); g.add(bb);

  // lâmpadas tubulares
  for (const x of [-1.6, 1.6]) for (const z of [-4.2, -1.6, 0.9]) {
    const p = mesh(G.box(0.22, 0.05, 1.25), 0xf6f3e6, {outline: 2.5, material: flat(0xf6f3e6)});
    p.position.set(x, H - 0.04, z);
    g.add(p);
  }

  // ventilador de teto (gira)
  const fan = new THREE.Group();
  fan.position.set(0, H, -2.6);
  const rod = mesh(G.cyl(0.02, 0.02, 0.35, 8), 0x9aa0aa, {outline: 1.5});
  rod.position.y = -0.175;
  const hub = mesh(G.cyl(0.11, 0.09, 0.1, 18), 0xe9e6dc, {outline: 2});
  hub.position.y = -0.38;
  const rotor = new THREE.Group();
  rotor.position.y = -0.4;
  for (let i = 0; i < 3; i++) {
    const b = mesh(G.box(0.62, 0.012, 0.13), 0xe9e6dc, {outline: 2});
    b.position.x = 0.4;
    const arm = new THREE.Group();
    arm.rotation.y = (i / 3) * Math.PI * 2;
    arm.add(b);
    rotor.add(arm);
  }
  fan.add(rod, hub, rotor);
  g.add(fan);

  // ---- parede da lousa (frente, z = Z0) ----
  const FZ = Z0 + 0.012;
  const boardFrame = mesh(G.box(3.4, 1.3, 0.05), 0x9b7a52, {outline: 2.5});
  boardFrame.position.set(-0.5, 1.65, Z0 + 0.025);
  const board = panel(3.25, 1.16, (c, w, h) => {
    c.fillStyle = '#2f5d4a'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 9; i++) c.fillRect(w * (0.05 + i * 0.11), h * 0.2, w * 0.07, h * 0.6); // marcas de apagador
    const chalk = '#f4f1e6';
    text(c, 'RECUPERAÇÃO — QUÍMICA', w * 0.5, h * 0.17, {size: h * 0.15, font: 'hand', weight: 'normal', color: chalk, maxW: w * 0.9});
    text(c, '3º B  ·  14h às 15h', w * 0.5, h * 0.37, {size: h * 0.11, font: 'hand', weight: 'normal', color: chalk, maxW: w * 0.8});
    text(c, 'CELULAR NA MOCHILA!', w * 0.5, h * 0.6, {size: h * 0.16, font: 'hand', weight: 'normal', color: '#ffd84a', maxW: w * 0.9});
    c.strokeStyle = '#ffd84a'; c.lineWidth = h * 0.012;
    c.beginPath(); c.moveTo(w * 0.2, h * 0.7); c.lineTo(w * 0.8, h * 0.7); c.stroke();
    text(c, 'Boa prova :)', w * 0.78, h * 0.86, {size: h * 0.09, font: 'hand', weight: 'normal', color: chalk, maxW: w * 0.4});
  }, {name: 'lousa'});
  board.position.set(-0.5, 1.65, Z0 + 0.052);
  const tray = mesh(G.box(3.3, 0.03, 0.08), 0x9b7a52, {outline: 2});
  tray.position.set(-0.5, 0.985, Z0 + 0.06);
  g.add(boardFrame, board, tray);

  const clock = wallClock({radius: 0.17, time: [14, 32, 0]});
  clock.group.position.set(1.75, 2.5, FZ);
  g.add(clock.group);

  // porta da sala: frente à direita (padrão) ou parede direita (barricada). +Z local = para dentro da sala.
  const DOOR_Z = -2.9;
  const door = new THREE.Group();
  if (T) { door.position.set(W / 2 - 0.01, 0, DOOR_Z); door.rotation.y = -Math.PI / 2; } else door.position.set(2.65, 0, Z0 + 0.01);
  const frame = mesh(G.box(1.0, 2.15, 0.06), 0x55607a, {outline: 2.5});
  frame.position.set(0, 1.075, 0.03);
  const slab = mesh(G.box(0.86, 2.05, 0.05), 0x3f6fb5, {outline: 2.5});
  slab.position.set(0, 1.03, 0.06);
  const glassMat = new THREE.MeshBasicMaterial({color: 0xc9d7e3}); // corredor aceso visto pelo vidro
  const glass = new THREE.Mesh(G.box(0.3, 0.42, 0.055), glassMat);
  glass.position.set(0, 1.55, 0.065);
  // sombra de alguém do outro lado do vidro (opacidade animada pela cena)
  const shadowMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false,
    map: canvasTexture(0.3, 0.42, (c, w, h) => {
      c.fillStyle = '#15161d';
      c.beginPath(); c.ellipse(w * 0.5, h * 0.42, w * 0.2, h * 0.17, 0, 0, Math.PI * 2); c.fill(); // cabeça (capuz)
      c.beginPath(); c.ellipse(w * 0.5, h * 1.02, w * 0.48, h * 0.4, 0, 0, Math.PI * 2); c.fill(); // ombros
    }, 1200)});
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), shadowMat);
  shadow.position.set(0, 1.55, 0.094);
  const handlePivot = new THREE.Group(); // maçaneta gira em torno do eixo da porta
  handlePivot.position.set(0.3, 1.0, 0.1);
  const handle = mesh(G.box(0.12, 0.03, 0.05), 0xc9ccd2, {outline: 2});
  handle.position.x = -0.05;
  const rose = mesh(G.cyl(0.03, 0.03, 0.02, 14), 0xc9ccd2, {outline: 1.5});
  rose.rotation.x = Math.PI / 2;
  handlePivot.add(handle);
  rose.position.set(0.3, 1.0, 0.09);
  door.add(frame, slab, glass, shadow, handlePivot, rose);
  g.add(door);
  const plate = sign(0.42, 0.26, {title: 'SALA 7', sub: '3º ANO B', band: 'ESCOLA ESTADUAL', bandColor: '#2b5fa8'});
  plate.position.set(T ? 2.85 : 1.85, T ? 1.95 : 1.75, FZ);
  g.add(plate);

  let switchPlate = null, bell = null;
  if (T) {
    // interruptor ao lado da porta
    switchPlate = new THREE.Group();
    const sp = mesh(G.box(0.08, 0.12, 0.015), 0xf2efe6, {outline: 1.5});
    const key = mesh(G.box(0.03, 0.05, 0.012), 0xdedad0, {outline: 1});
    key.position.z = 0.012;
    switchPlate.add(sp, key);
    switchPlate.position.set(W / 2 - 0.012, 1.3, DOOR_Z - 0.75);
    switchPlate.rotation.y = -Math.PI / 2;
    g.add(switchPlate);
    // campainha da escola (parede da frente, alto à esquerda)
    bell = new THREE.Group();
    const bBox = mesh(G.box(0.22, 0.16, 0.08), 0xc0392b, {outline: 2});
    const bDome = mesh(G.sphere(0.07, 18, 10), 0xd9d9d9, {outline: 2});
    bDome.position.z = 0.06;
    bDome.scale.z = 0.6;
    bell.add(bBox, bDome);
    bell.position.set(-2.75, 2.55, Z0 + 0.05);
    g.add(bell);
    // cartaz de segurança genérico na parede direita (troque o texto pela regra da SUA história)
    const proto = paper(0.42, 0.56, {title: 'PROTOCOLO', accent: '#c0392b', lines: [
      {text: 'DE SEGURANÇA', bold: true, size: 0.08},
      {text: 'Em caso de alarme:', size: 0.075},
      {text: 'FIQUE NA SALA', bold: true, size: 0.1, color: '#c0392b'},
      {text: 'aguarde instruções', size: 0.065},
    ]});
    proto.position.set(W / 2 - 0.04, 1.55, DOOR_Z + 1.15);
    proto.rotation.y = -Math.PI / 2;
    g.add(proto);
  }

  // ---- mesa da professora ----
  const tDesk = new THREE.Group();
  const tTop = mesh(G.box(1.3, 0.04, 0.65), 0xa7794b, {outline: 2.5});
  tTop.position.y = 0.76;
  tTop.userData.prop = 'mesa da professora';
  const tFront = mesh(G.box(1.26, 0.6, 0.03), 0x8a6239, {outline: 2.5});
  tFront.position.set(0, 0.42, 0.29);
  tDesk.add(tTop, tFront);
  for (const x of [-0.6, 0.6]) {
    const l = mesh(G.box(0.05, 0.74, 0.6), 0x8a6239, {outline: 2});
    l.position.set(x, 0.37, 0);
    tDesk.add(l);
  }
  if (T) tDesk.position.set(1.6, 0, -4.6); else tDesk.position.set(-1.7, 0, -5.1);
  g.add(tDesk);
  tDesk.updateMatrixWorld(true);

  // bloco amarelo da professora (a pista): papel deitado, margem vermelha
  const pad = new THREE.Group();
  const padBody = mesh(G.box(0.22, 0.012, 0.3), 0xf7e27c, {outline: 1.5});
  const padFace = panel(0.21, 0.29, yellowPadDraw('3º B'), {name: 'bloco amarelo'});
  padFace.rotation.x = -Math.PI / 2;
  padFace.position.y = 0.0065;
  pad.add(padBody, padFace);
  pad.rotation.y = 0.25;
  const exams = new THREE.Group();
  const stack = mesh(G.box(0.24, 0.05, 0.32), 0xfbfaf5, {outline: 1.5});
  exams.add(stack);
  const tPhone = mesh(G.box(0.08, 0.012, 0.16), 0x1d1f26, {outline: 1.5});
  tPhone.rotation.y = -0.4;
  const cup = new THREE.Group();
  const cupBody = mesh(G.cyl(0.045, 0.04, 0.11, 16), 0xc0392b, {outline: 2});
  cup.add(cupBody);
  for (const [x, c] of [[-0.012, 0x2b5fa8], [0.015, 0x1b1a22]]) {
    const pen = mesh(G.cyl(0.006, 0.006, 0.14, 6), c, {outline: 1});
    pen.position.set(x, 0.05, 0.01);
    pen.rotation.z = x * 6;
    cup.add(pen);
  }
  // objetos são filhos da mesa (andam junto quando ela vira barricada); x/z em coordenadas da mesa
  tDesk.add(pad, exams, tPhone, cup);
  place(pad, tTop, {x: -0.25, z: 0.12, name: 'bloco amarelo'});
  place(exams, tTop, {x: 0.3, z: -0.05, name: 'pilha de provas'});
  place(tPhone, tTop, {x: 0.08, z: 0.15, name: 'celular da professora'});
  place(cup, tTop, {x: -0.5, z: -0.15, name: 'porta-canetas'});

  // ---- janelas (parede esquerda) ----
  const windows = [];
  for (const z of [-4.3, -1.8, 0.7]) {
    const win = new THREE.Group();
    win.position.set(-W / 2 + 0.02, 1.75, z);
    win.rotation.y = Math.PI / 2;
    const wf = mesh(G.box(1.7, 1.15, 0.05), 0xf0ede4, {outline: 2.5});
    const sky = new THREE.Mesh(G.box(1.58, 1.03, 0.055), new THREE.MeshBasicMaterial({color: 0x9fcbe8}));
    const mull = new THREE.Mesh(G.box(0.03, 1.03, 0.06), toon(0xf0ede4));
    win.add(wf, sky, mull);
    for (let i = 0; i < 3; i++) { // grade
      const bar = new THREE.Mesh(G.box(1.58, 0.02, 0.07), toon(0x5a5f6a));
      bar.position.y = 0.3 - i * 0.3;
      win.add(bar);
    }
    g.add(win);
    windows.push(sky.material);
  }

  // ---- mural (parede direita) ----
  const MZ = T ? 0.25 : -2.2; // mural sai de perto da porta no layout "barricada"
  const mural = mesh(G.box(0.03, 0.9, 1.6), 0xb98a57, {outline: 2.5});
  mural.position.set(W / 2 - 0.02, 1.7, MZ);
  g.add(mural);
  const onRight = (obj, y, z) => { obj.position.set(W / 2 - 0.04, y, z); obj.rotation.y = -Math.PI / 2; g.add(obj); };
  onRight(paper(0.38, 0.5, {title: 'ARRAIÁ', accent: '#e67e22', lines: [
    {text: 'do 3º B', bold: true, size: 0.11}, {text: 'Sáb · 18h · quadra', size: 0.085}, {text: 'quentão e pamonha', size: 0.075}], tilt: 0.03}), 1.72, MZ - 0.45);
  onRight(paper(0.32, 0.4, {title: 'ENEM', accent: '#2b5fa8', lines: [
    {text: 'faltam', size: 0.1}, {text: '18 DIAS', bold: true, size: 0.17, color: '#c0392b'}], tilt: -0.04}), 1.72, MZ + 0.15);
  onRight(postIt(['Grêmio:', 'votação 6ª'], {color: '#a8e0a0', tilt: 0.1, size: 0.14}), 1.9, MZ + 0.58);
  onRight(sign(0.5, 0.16, {title: 'PROIBIDO CELULAR', bg: '#c0392b', fg: '#ffffff'}), 2.35, MZ);

  // ---- carteiras e cadeiras ----
  const desks = [];
  for (const z of (T ? ROWS.slice(0, 3) : ROWS)) for (const x of COLS) {
    const d = makeDesk();
    d.position.set(x, 0, z);
    g.add(d);
    const c = makeChair();
    c.position.set(x, 0, z + SEAT_OFFSET);
    g.add(c);
    desks.push({x, z, desk: d, chair: c});
  }
  const myDesk = desks.find((d) => d.x === 0 && d.z === ROWS[0]);

  // mochilas no chão ao lado de algumas carteiras (a regra: celular na mochila)
  const backpack = (x, z, color) => {
    const b = new THREE.Group();
    const body = mesh(G.box(0.3, 0.38, 0.16), color, {outline: 2});
    const pocket = mesh(G.box(0.22, 0.14, 0.04), new THREE.Color(color).multiplyScalar(0.8).getHex(), {outline: 1.5});
    pocket.position.set(0, -0.06, 0.09);
    b.add(body, pocket);
    b.position.set(x, 0, z);
    g.add(b);
    place(b, floor, {name: 'mochila'});
    return b;
  };
  backpack(-0.45, 0.9, 0x2b5fa8);
  backpack(0.62, -0.45, 0xc0392b);
  backpack(-1.55, -0.5, 0x2fae5a);
  backpack(1.55, -1.85, 0x6c3fa0);

  return {
    group: g,
    floor,
    myDesk,
    desks,
    teacherDeskTop: tTop,
    teacherProps: [pad, exams, tPhone, cup],
    tDesk,
    door: {group: door, handle: handlePivot, glass: glassMat, shadow, shadowMat, z: DOOR_Z},
    switchPlate,
    bell,
    update(t, {storm = 0} = {}) {
      clock.update(t);
      rotor.rotation.y = -t * 7.5;
      for (const m of windows) m.color.setHex(storm > 0.5 ? 0x7f95ad : 0x9fcbe8);
    },
    pois: {
      board: new THREE.Vector3(-0.5, 1.75, Z0),
      clock: new THREE.Vector3(1.75, 2.5, Z0),
      door: new THREE.Vector3(2.65, 1.3, Z0),
      pad: new THREE.Vector3(-1.95, 0.8, -4.98),
      tDesk: new THREE.Vector3(-1.7, 0.85, -5.1),
      mural: new THREE.Vector3(W / 2, 1.8, -2.2),
    },
  };
}
