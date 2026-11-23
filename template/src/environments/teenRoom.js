// Quarto de jovem. Maior (4,8 × 4,6 m), noite de chuva.
// Fundo (z=-2.6): cama + janela com chuva acima, criado-mudo com a foto do cachorro, escrivaninha com PC no canto direito.
// Parede esquerda (x=-2.4): TV com jogo de futebol num rack com videogame; guarda-roupa perto da frente.
// Parede direita (x=2.4): porta (sem placa), interruptor, mochila no gancho. Fita de LED roxa no teto.
// update(t, {power, flashes, tvGoalAt}) — power 1 = luz ligada (TV, LED, PC), 0 = apagão.
import * as THREE from 'three';
import {mesh, flat, toon, G} from '../engine/toon.js';
import {panel, text} from '../engine/props.js';
import {place} from '../engine/validate.js';
import {createWindowFx} from '../engine/fx.js';

export const ROOM = {x0: -2.4, x1: 2.4, z0: -2.6, z1: 2.0, h: 2.7};
const {x0: X0, x1: X1, z0: Z0, z1: Z1, h: H} = ROOM;
const W = X1 - X0, D = Z1 - Z0;

function planks() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  const cols = ['#9a6a45', '#8f623f', '#a3724c', '#946641'];
  for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(0, i * 32, 256, 32); }
  g.strokeStyle = '#5e3f29'; g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(256, i * 32); g.stroke(); }
  for (let i = 0; i < 8; i++) { const x = (i * 97) % 256; g.beginPath(); g.moveTo(x, i * 32); g.lineTo(x, i * 32 + 32); g.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(W / 1.2, D / 1.2);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// tela da TV: jogo de futebol fictício (TIGRES × LEÕES), redesenhado a cada quadro
function tvScreen() {
  const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const x = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (t, on, goalAt) => {
    if (!on) { x.fillStyle = '#05060a'; x.fillRect(0, 0, 640, 360); tex.needsUpdate = true; return; }
    for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#2f8f3e' : '#37a047'; x.fillRect(i * 64, 0, 64, 360); }
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 4;
    x.strokeRect(20, 30, 600, 310); x.beginPath(); x.moveTo(320, 30); x.lineTo(320, 340); x.stroke();
    x.beginPath(); x.arc(320, 185, 50, 0, Math.PI * 2); x.stroke();
    x.strokeRect(20, 110, 80, 150); x.strokeRect(540, 110, 80, 150);
    x.fillStyle = '#eee'; x.fillRect(612, 150, 10, 70); x.fillRect(18, 150, 10, 70); // traves
    const g = goalAt ?? 1e9;
    const k = Math.min(1, Math.max(0, (t - (g - 1.4)) / 1.4)); // ataque em direção ao gol da direita
    const bx = t < g ? 330 + k * 280 + Math.sin(t * 3) * 8 : 612, by = 185 + Math.sin(t * 2.1) * 30 * (1 - k);
    const team = (col, n, dir, ph) => {
      for (let i = 0; i < n; i++) {
        const px = 120 + i * 85 + Math.sin(t * 1.3 + i + ph) * 25 + dir * k * 80, py = 80 + ((i * 67) % 220) + Math.cos(t * 1.1 + i * 2 + ph) * 18;
        x.fillStyle = '#111'; x.beginPath(); x.ellipse(px, py + 9, 9, 3, 0, 0, Math.PI * 2); x.fill();
        x.fillStyle = col; x.beginPath(); x.arc(px, py, 8, 0, Math.PI * 2); x.fill();
      }
    };
    team('#f0b429', 6, 1, 0); team('#d8343a', 6, 0.6, 2);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, 6, 0, Math.PI * 2); x.fill();
    // placar
    const gol = t >= g;
    x.fillStyle = 'rgba(10,14,30,0.85)'; x.fillRect(16, 8, 270, 34);
    x.font = 'bold 22px Arial'; x.fillStyle = '#fff'; x.textBaseline = 'middle';
    x.fillText(`TIG ${gol ? 1 : 0}  ×  0 LEÕ`, 26, 25);
    x.fillStyle = '#ffd43b'; x.fillText(`${88 + Math.floor((t + 20) / 60)}:${String(Math.floor((t * 7 + 12) % 60)).padStart(2, '0')}`, 210, 25);
    if (gol && t < g + 3) {
      x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 140, 640, 90);
      x.font = 'bold 72px Arial Black, Arial'; x.fillStyle = '#ffd43b'; x.textAlign = 'center';
      x.fillText('GOOOL!', 320, 186); x.textAlign = 'left';
    }
    tex.needsUpdate = true;
  };
  return {tex, draw};
}

export function createTeenRoom() {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D),
    new THREE.MeshToonMaterial({map: planks(), gradientMap: toon(0xffffff).gradientMap}));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2);
  floor.userData.prop = 'chão';
  g.add(floor);

  const wallC = 0x5d7f9e, ceilC = 0xc9c6bc;
  const wall = (w, h, c) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon(c));
  const addWall = (w, x, z, ry) => {
    const m = wall(w, H, wallC); m.position.set(x, H / 2, z); m.rotation.y = ry;
    const base = new THREE.Mesh(G.box(w, 0.09, 0.02), toon(0xe9e4d6));
    base.position.set(x, 0.045, z); base.rotation.y = ry; base.translateZ(0.01);
    g.add(m, base);
  };
  addWall(W, 0, Z0, 0);
  addWall(D, X0, (Z0 + Z1) / 2, Math.PI / 2);
  addWall(D, X1, (Z0 + Z1) / 2, -Math.PI / 2);
  addWall(W, 0, Z1, Math.PI);
  const ceil = wall(W, D, ceilC);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, (Z0 + Z1) / 2);
  g.add(ceil);

  // fita de LED roxa contornando o teto (acesa até o apagão)
  const ledMat = new THREE.MeshBasicMaterial({color: 0xb26bff});
  for (const [w, x, z, ry] of [[W, 0, Z0 + 0.02, 0], [D, X0 + 0.02, (Z0 + Z1) / 2, Math.PI / 2], [D, X1 - 0.02, (Z0 + Z1) / 2, Math.PI / 2], [W, 0, Z1 - 0.02, 0]]) {
    const s = new THREE.Mesh(G.box(w, 0.02, 0.02), ledMat); s.position.set(x, H - 0.05, z); s.rotation.y = ry; g.add(s);
  }

  // ---- cama ----
  const BX = -1.2, BW = 2.0, BD = 0.95, BZ = Z0 + BD / 2;
  const frame = mesh(G.box(BW, 0.3, BD), 0x4a3426, {outline: 2.5});
  frame.position.set(BX, 0.15, BZ);
  const mattress = mesh(G.box(BW - 0.04, 0.14, BD - 0.04), 0x2f4f86, {outline: 2.5});
  mattress.position.set(BX, 0.37, BZ);
  mattress.userData.prop = 'colchão';
  g.add(frame, mattress);
  const fold = mesh(G.box(0.5, 0.05, BD - 0.06), 0x3a62a8, {outline: 2});
  const pillow = mesh(G.box(0.42, 0.12, 0.6), 0xe8e6de, {outline: 2.5});
  g.add(fold, pillow);
  place(fold, mattress, {x: BX + 0.73, z: BZ, name: 'dobra do cobertor'});
  place(pillow, mattress, {x: BX - BW / 2 + 0.26, z: BZ, name: 'travesseiro'});
  const pad = (c) => {
    const p = new THREE.Group();
    p.add(mesh(G.box(0.15, 0.035, 0.09), c, {outline: 2}));
    const b1 = new THREE.Mesh(G.sphere(0.011, 10, 8), flat(0xe24a4a)); b1.position.set(0.045, 0.02, -0.01);
    const b2 = new THREE.Mesh(G.sphere(0.011, 10, 8), flat(0x4ab0e2)); b2.position.set(0.065, 0.02, 0.012);
    p.add(b1, b2);
    return p;
  };
  const chips = mesh(G.box(0.2, 0.06, 0.26), 0xf0b429, {outline: 2});
  chips.rotation.y = 0.35;
  g.add(chips);
  place(chips, mattress, {x: -1.25, z: BZ - 0.12, name: 'salgadinho'});

  // ---- janela com chuva acima da cama ----
  const win = createWindowFx({w: 1.15, h: 0.78});
  win.group.position.set(BX, 1.68, Z0 + 0.005);
  g.add(win.group);

  // ---- criado-mudo: foto do cachorro, despertador, abajur ----
  const ns = mesh(G.box(0.45, 0.5, 0.4), 0x6b4a35, {outline: 2.5});
  ns.position.set(0.12, 0.25, Z0 + 0.22);
  g.add(ns);
  const photo = new THREE.Group();
  const photoP = panel(0.2, 0.25, (c, w, h) => {
    c.fillStyle = '#3a2618'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f4ecd8'; c.fillRect(w * 0.08, h * 0.07, w * 0.84, h * 0.7);
    c.fillStyle = '#c98a3e'; c.beginPath(); c.ellipse(w * 0.5, h * 0.45, w * 0.22, h * 0.16, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#8e5a26';
    c.beginPath(); c.ellipse(w * 0.3, h * 0.36, w * 0.07, h * 0.12, 0.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(w * 0.7, h * 0.36, w * 0.07, h * 0.12, -0.4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#111';
    for (const px of [0.42, 0.58]) { c.beginPath(); c.arc(w * px, h * 0.42, w * 0.025, 0, Math.PI * 2); c.fill(); }
    c.beginPath(); c.arc(w * 0.5, h * 0.5, w * 0.035, 0, Math.PI * 2); c.fill();
    text(c, 'MEU DOG ♥', w / 2, h * 0.86, {size: h * 0.1, font: 'bold', color: '#f4ecd8', maxW: w * 0.84});
  }, {depth: 0.015, body: 0x3a2618, name: 'foto do cachorro'});
  photoP.rotation.x = -0.18;
  photo.add(photoP);
  const clockBox = mesh(G.box(0.14, 0.07, 0.07), 0x1b1a22, {outline: 2});
  const clockMat = new THREE.MeshBasicMaterial({color: 0xffffff});
  const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.045), clockMat);
  clockFace.position.z = 0.036; clockBox.add(clockFace);
  const lampBase = new THREE.Group();
  const lb = mesh(G.cyl(0.05, 0.06, 0.03, 18), 0x2b2d35, {outline: 2});
  const lstem = mesh(G.cyl(0.01, 0.01, 0.25, 8), 0x2b2d35, {outline: 1.5}); lstem.position.y = 0.14;
  const lshade = mesh(G.cyl(0.07, 0.11, 0.12, 20), 0xe9dfc6, {outline: 2}); lshade.position.y = 0.3;
  lampBase.add(lb, lstem, lshade);
  g.add(photo, clockBox, lampBase);
  place(photo, ns, {x: 0.24, z: Z0 + 0.14, name: 'foto do cachorro'});
  place(clockBox, ns, {x: 0.25, z: Z0 + 0.32, name: 'despertador'});
  place(lampBase, ns, {x: 0.01, z: Z0 + 0.25, name: 'abajur'});
  const digits = (on) => {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 52;
    const x = cv.getContext('2d'); x.fillStyle = '#100'; x.fillRect(0, 0, 128, 52);
    if (on) { x.fillStyle = '#ff4040'; x.font = 'bold 40px "Courier New", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('22:47', 64, 28); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const clockOn = digits(true), clockOff = digits(false);
  clockMat.color.setScalar(1.8); clockMat.map = clockOn;

  // ---- escrivaninha com PC (canto do fundo à direita) ----
  const desk = new THREE.Group();
  const top = mesh(G.box(1.25, 0.04, 0.6), 0x2b2d35, {outline: 2.5}); top.position.y = 0.74;
  top.userData.prop = 'tampo da escrivaninha';
  desk.add(top);
  for (const [x, z] of [[-0.58, -0.26], [0.58, -0.26], [-0.58, 0.26], [0.58, 0.26]]) {
    const l = mesh(G.box(0.04, 0.72, 0.04), 0x1b1a22, {outline: 1.5}); l.position.set(x, 0.36, z); desk.add(l);
  }
  desk.position.set(1.62, 0, Z0 + 0.32);
  g.add(desk);
  const monitor = new THREE.Group();
  const scrMat = new THREE.MeshBasicMaterial({color: 0x1a2a6a});
  const mon = mesh(G.box(0.62, 0.36, 0.03), 0x15161b, {outline: 2}); mon.position.y = 0.3;
  const monScr = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.32), scrMat); monScr.position.set(0, 0.3, 0.016);
  const monFoot = mesh(G.box(0.2, 0.015, 0.14), 0x15161b, {outline: 1.5});
  const monNeck = mesh(G.box(0.04, 0.12, 0.03), 0x15161b, {outline: 1.5}); monNeck.position.set(0, 0.07, -0.03);
  monitor.add(mon, monScr, monFoot, monNeck);
  const kb = mesh(G.box(0.45, 0.025, 0.15), 0x202127, {outline: 1.5});
  const mouse = mesh(G.box(0.06, 0.03, 0.1), 0x202127, {outline: 1.5});
  const tower = new THREE.Group();
  const tw = mesh(G.box(0.22, 0.46, 0.45), 0x15161b, {outline: 2}); tw.position.y = 0.23;
  const rgbMat = new THREE.MeshBasicMaterial({color: 0x29e0ff});
  const rgb = new THREE.Mesh(G.box(0.005, 0.36, 0.34), rgbMat); rgb.position.set(-0.112, 0.25, 0);
  tower.add(tw, rgb);
  g.add(monitor, kb, mouse, tower);
  place(monitor, top, {x: 1.62, z: Z0 + 0.2, name: 'monitor'});
  place(kb, top, {x: 1.58, z: Z0 + 0.46, name: 'teclado'});
  place(mouse, top, {x: 1.95, z: Z0 + 0.46, name: 'mouse'});
  place(tower, floor, {x: 2.1, z: Z0 + 0.95, name: 'gabinete'});
  // cadeira gamer virada para a mesa, com moletom jogado
  const chair = new THREE.Group();
  const seat = mesh(G.box(0.5, 0.08, 0.5), 0x1b1a22, {outline: 2}); seat.position.y = 0.47;
  const back = mesh(G.box(0.5, 0.75, 0.08), 0xc0392b, {outline: 2}); back.position.set(0, 0.88, 0.24);
  const stripe = mesh(G.box(0.16, 0.76, 0.085), 0x1b1a22, {outline: 0}); stripe.position.set(0, 0.88, 0.24);
  const post = mesh(G.cyl(0.03, 0.03, 0.4, 10), 0x2b2d35, {outline: 1.5}); post.position.y = 0.23;
  const star = mesh(G.box(0.55, 0.03, 0.06), 0x2b2d35, {outline: 1.5}); star.position.y = 0.03;
  const star2 = star.clone(); star2.rotation.y = Math.PI / 2;
  const hoodie = mesh(G.box(0.46, 0.22, 0.1), 0x6b7f3a, {outline: 2}); hoodie.position.set(0, 1.18, 0.3); hoodie.rotation.x = 0.2;
  chair.add(seat, back, stripe, post, star, star2, hoodie);
  chair.position.set(1.5, 0, Z0 + 0.95); chair.rotation.y = 0.15;
  g.add(chair);
  // prateleira acima da mesa: livros, bonecos, troféu
  const shelf = mesh(G.box(1.1, 0.03, 0.22), 0x6b4a35, {outline: 2});
  shelf.position.set(1.62, 1.55, Z0 + 0.11);
  shelf.userData.prop = 'prateleira';
  g.add(shelf);
  const books = new THREE.Group();
  [0x2b5fa8, 0xc0392b, 0xf0b429, 0x2e9e5b, 0x7a4fb0, 0xe9e4d6].forEach((col, i) => {
    const b = mesh(G.box(0.045, 0.22 + (i % 3) * 0.02, 0.16), col, {outline: 1.5}); b.position.set(i * 0.05, (0.22 + (i % 3) * 0.02) / 2, 0); books.add(b);
  });
  const fig = (col) => {
    const f = new THREE.Group();
    const bd = mesh(G.capsule(0.03, 0.05), col, {outline: 1.5}); bd.position.y = 0.055;
    const hd = mesh(G.sphere(0.035), 0xe0b08a, {outline: 1.5}); hd.position.y = 0.14;
    f.add(bd, hd); return f;
  };
  const fig1 = fig(0x2b5fa8), fig2 = fig(0xd8343a);
  const trophy = new THREE.Group();
  const cup = mesh(G.cyl(0.05, 0.025, 0.08, 16), 0xe2b23a, {outline: 1.5}); cup.position.y = 0.11;
  const tb = mesh(G.box(0.07, 0.06, 0.07), 0x2b2d35, {outline: 1.5}); tb.position.y = 0.03;
  trophy.add(cup, tb);
  g.add(books, fig1, fig2, trophy);
  place(books, shelf, {x: 1.15, z: Z0 + 0.11, name: 'livros'});
  place(fig1, shelf, {x: 1.62, z: Z0 + 0.11, name: 'boneco azul'});
  place(fig2, shelf, {x: 1.76, z: Z0 + 0.11, name: 'boneco vermelho'});
  place(trophy, shelf, {x: 2.0, z: Z0 + 0.11, name: 'troféu'});
  // bandeira do time (fictício) acima da cama, ao lado da janela? não — na parede da mesa, acima da prateleira
  const flag = panel(0.8, 0.34, (c, w, h) => {
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#111' : '#f0b429'; c.fillRect(0, (i * h) / 5, w, h / 5 + 1); }
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(w * 0.18, h * 0.3, w * 0.64, h * 0.4);
    text(c, 'TIGRES FC', w / 2, h / 2, {size: h * 0.28, font: 'bold', color: '#f0b429', maxW: w * 0.6});
  }, {name: 'bandeira TIGRES FC'});
  flag.position.set(1.62, 2.0, Z0 + 0.012);
  g.add(flag);

  // ---- TV + rack + videogame (parede esquerda) ----
  const TVZ = -0.55;
  const rack = mesh(G.box(0.42, 0.45, 1.5), 0x2b2d35, {outline: 2.5});
  rack.position.set(X0 + 0.22, 0.225, TVZ);
  rack.userData.prop = 'rack';
  g.add(rack);
  const tvFrame = mesh(G.box(0.05, 0.72, 1.24), 0x0d0e12, {outline: 2.5});
  tvFrame.position.set(X0 + 0.06, 1.2, TVZ);
  const scr = tvScreen();
  // telas/LEDs ficam acima de 1,0 (HDR) para só elas acenderem o bloom — o branco dos olhos (1,0) não brilha
  const tvScr = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.665), new THREE.MeshBasicMaterial({map: scr.tex, color: new THREE.Color(1.6, 1.6, 1.6)}));
  tvScr.rotation.y = Math.PI / 2; tvScr.position.set(X0 + 0.09, 1.2, TVZ);
  g.add(tvFrame, tvScr);
  const consoleBox = mesh(G.box(0.3, 0.07, 0.36), 0xf2f2f4, {outline: 2});
  const consoleLed = new THREE.Mesh(G.box(0.005, 0.01, 0.2), new THREE.MeshBasicMaterial({color: 0x3aa0ff}));
  consoleLed.position.set(0.152, 0, 0); consoleBox.add(consoleLed);
  const pad3 = pad(0xe6e6ea); pad3.rotation.y = 1.2;
  const cans = new THREE.Group();
  for (const [x, z, col] of [[0, 0, 0xd8343a], [0.09, 0.05, 0x2e9e5b]]) {
    const cn = mesh(G.cyl(0.033, 0.033, 0.12, 14), col, {outline: 1.5}); cn.position.set(x, 0.06, z); cans.add(cn);
  }
  g.add(consoleBox, pad3, cans);
  place(consoleBox, rack, {x: X0 + 0.24, z: TVZ - 0.4, name: 'videogame'});
  place(pad3, rack, {x: X0 + 0.24, z: TVZ + 0.35, name: 'controle no rack'});
  place(cans, floor, {x: -0.3, z: 0.75, name: 'latinhas'});

  // ---- guarda-roupa (frente esquerda) ----
  const ward = mesh(G.box(0.6, 2.1, 1.3), 0x8a6a4f, {outline: 2.5});
  ward.position.set(X0 + 0.31, 1.05, 1.25);
  const seam = new THREE.Mesh(G.box(0.01, 2.0, 0.012), flat(0x24232b)); seam.position.set(X0 + 0.615, 1.05, 1.25);
  const h1 = mesh(G.box(0.03, 0.18, 0.025), 0xc9ccd2, {outline: 1.5}); h1.position.set(X0 + 0.625, 1.05, 1.18);
  const h2 = h1.clone(); h2.position.z = 1.32;
  g.add(ward, seam, h1, h2);

  // ---- tapete, pufe, tênis, mochila ----
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.0, 40), toon(0x7a4a8a));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-0.4, 0.004, -0.2);
  const rugIn = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.7, 40), toon(0xe0b04a));
  rugIn.rotation.x = -Math.PI / 2; rugIn.position.set(-0.4, 0.006, -0.2);
  g.add(rug, rugIn);
  const pouf = mesh(G.cyl(0.26, 0.28, 0.345, 28), 0xe07b39, {outline: 2.5});
  pouf.position.set(0.25, 0, -1.2);
  g.add(pouf);
  place(pouf, floor, {name: 'pufe'});
  const sneaker = (x, z, ry) => {
    const s = new THREE.Group();
    const sole = mesh(G.box(0.11, 0.03, 0.28), 0xf4f1e8, {outline: 1.5}); sole.position.y = 0.015;
    const up = mesh(G.box(0.1, 0.07, 0.2), 0x2b5fa8, {outline: 1.5}); up.position.set(0, 0.065, -0.03);
    s.add(sole, up); s.rotation.y = ry; s.position.set(x, 0, z); g.add(s); return s;
  };
  sneaker(0.9, -0.35, 0.4); sneaker(1.02, -0.25, 0.1);
  const backpack = mesh(G.box(0.32, 0.42, 0.16), 0x2e6b5a, {outline: 2});
  backpack.position.set(X1 - 0.09, 1.25, -0.75);
  const hook = mesh(G.box(0.04, 0.04, 0.06), 0xc9ccd2, {outline: 1.5}); hook.position.set(X1 - 0.03, 1.5, -0.75);
  g.add(backpack, hook);

  // ---- porta (parede direita), fechadura com chave, sem placa ----
  const DZ = 0.35;
  const door = new THREE.Group();
  door.position.set(X1 - 0.02, 0, DZ);
  door.rotation.y = -Math.PI / 2;
  const jamb = mesh(G.box(1.0, 2.15, 0.06), 0xe9e4d6, {outline: 2.5});
  jamb.position.set(0, 1.075, 0);
  const hinge = new THREE.Group();
  hinge.position.set(-0.42, 0, 0.04);
  const slab = mesh(G.box(0.84, 2.04, 0.045), 0xb08a64, {outline: 2.5});
  slab.position.set(0.42, 1.03, 0);
  for (const y of [0.55, 1.45]) {
    const p = mesh(G.box(0.6, 0.62, 0.01), 0xa27f5b, {outline: 1.5});
    p.position.set(0.42, y, 0.027);
    hinge.add(p);
  }
  const rose = mesh(G.cyl(0.035, 0.035, 0.012, 20), 0xb8bcc4, {outline: 1.5});
  rose.rotation.x = Math.PI / 2; rose.position.set(0.74, 1.0, 0.028);
  const knob = mesh(G.sphere(0.035), 0xc9ccd2, {outline: 2});
  knob.position.set(0.74, 1.0, 0.065);
  const keyhole = new THREE.Mesh(G.box(0.012, 0.03, 0.004), flat(0x1b1a22));
  keyhole.position.set(0.74, 0.9, 0.025);
  const key = new THREE.Group();
  key.position.set(0.74, 0.9, 0.03);
  const kBlade = mesh(G.box(0.012, 0.012, 0.03), 0xd6b23a, {outline: 1.2}); kBlade.position.z = 0.012;
  const kBow = mesh(G.cyl(0.022, 0.022, 0.008, 16), 0xd6b23a, {outline: 1.5});
  kBow.rotation.x = Math.PI / 2; kBow.position.z = 0.032;
  key.add(kBlade, kBow);
  hinge.add(slab, rose, knob, keyhole, key);
  const sw = mesh(G.box(0.08, 0.12, 0.015), 0xf4f1e8, {outline: 1.5});
  sw.position.set(0.62, 1.15, 0.008);
  door.add(jamb, hinge, sw);
  g.add(door);

  return {
    group: g,
    floor,
    mattress,
    door: hinge,
    key,
    win,
    props: [fold, pillow, chips],
    lights: {
      tv: new THREE.Vector3(X0 + 0.5, 1.2, TVZ),
      window: new THREE.Vector3(BX, 1.68, Z0),
      monitor: new THREE.Vector3(1.62, 1.1, Z0 + 0.5),
    },
    update(t, {power = 1, flashes = [], tvGoalAt} = {}) {
      win.update(t, {flashes});
      scr.draw(t, power > 0.5, tvGoalAt);
      ledMat.color.setHex(power > 0.5 ? 0xb26bff : 0x1a1622).multiplyScalar(power > 0.5 ? 2.2 : 1);
      rgbMat.color.setHex(power > 0.5 ? 0x29e0ff : 0x0d0e12).multiplyScalar(power > 0.5 ? 2 : 1);
      scrMat.color.setHex(power > 0.5 ? 0x1a2a6a : 0x07080b);
      consoleLed.material.color.setHex(power > 0.5 ? 0x3aa0ff : 0x0d0e12).multiplyScalar(power > 0.5 ? 2 : 1);
      clockMat.map = power > 0.5 ? clockOn : clockOff;
    },
    pois: {
      tv: new THREE.Vector3(X0 + 0.09, 1.2, TVZ),
      door: new THREE.Vector3(X1, 1.0, DZ),
      knob: new THREE.Vector3(X1 - 0.08, 0.95, DZ + 0.32),
      window: new THREE.Vector3(BX, 1.68, Z0),
      photo: new THREE.Vector3(0.12, 0.62, Z0 + 0.16),
    },
  };
}
