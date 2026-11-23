// Frente da escola de dia (parte 6): pátio, gramado, viaturas da PM no portão, árvores, casas, céu com nuvens.
// Prédio da ESCOLA ESTADUAL atrás de nós (z = +BZ), porta da portaria virada pra -z. A turma fica entre nós e o portão (-z).
import * as THREE from 'three';
import {mesh, toon, flat, G} from '../../engine/toon.js';
import {canvasTexture} from '../../engine/props.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const BZ = 8.0;  // fachada do prédio

function textPlane(w, h, draw, px = 400) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map: canvasTexture(w, h, draw, px)}));
}

function policeCar(lights) {
  const g = new THREE.Group();
  const white = 0xf4f5f7, dark = 0x1b1e26;
  const bodyM = mesh(G.box(1.8, 0.62, 4.3), white, {outline: 3});
  bodyM.position.y = 0.6;
  const cab = mesh(G.box(1.62, 0.55, 2.1), white, {outline: 3});
  cab.position.set(0, 1.18, -0.2);
  const glassM = flat(0x2a3446);
  for (const z of [0.86, -1.26]) { const w = new THREE.Mesh(G.box(1.5, 0.4, 0.04), glassM); w.position.set(0, 1.2, z - 0.2 + (z > 0 ? 0 : 0)); g.add(w); }
  for (const s of [-1, 1]) { const w = new THREE.Mesh(G.box(0.04, 0.38, 1.8), glassM); w.position.set(s * 0.815, 1.2, -0.2); g.add(w); }
  // faixas laterais e texto
  for (const s of [-1, 1]) {
    const band = mesh(G.box(0.02, 0.16, 4.1), 0x2b3a67, {outline: 1});
    band.position.set(s * 0.905, 0.62, 0);
    g.add(band);
    const txt = textPlane(1.9, 0.2, (c, w, h) => {
      c.fillStyle = '#2b3a67'; c.font = `900 ${h * 0.7}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('POLÍCIA MILITAR', w / 2, h / 2);
    });
    txt.position.set(s * 0.912, 0.86, 0.1); txt.rotation.y = s * Math.PI / 2;
    g.add(txt);
  }
  const hood = mesh(G.box(1.6, 0.04, 1.1), dark, {outline: 1.5});
  hood.position.set(0, 0.93, 1.55);
  g.add(bodyM, cab, hood);
  for (const [x, z] of [[-0.86, 1.35], [0.86, 1.35], [-0.86, -1.35], [0.86, -1.35]]) {
    const w = mesh(G.cyl(0.33, 0.33, 0.24, 20), 0x16171b, {outline: 2});
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.33, z);
    g.add(w);
  }
  // giroflex
  const bar = mesh(G.box(1.2, 0.1, 0.3), 0x2a2d35, {outline: 1.5});
  bar.position.set(0, 1.5, -0.2);
  const red = new THREE.MeshBasicMaterial({color: 0xff2a2a}), blue = new THREE.MeshBasicMaterial({color: 0x2a5bff});
  const lr = new THREE.Mesh(G.box(0.5, 0.12, 0.26), red); lr.position.set(-0.32, 1.56, -0.2);
  const lb = new THREE.Mesh(G.box(0.5, 0.12, 0.26), blue); lb.position.set(0.32, 1.56, -0.2);
  g.add(bar, lr, lb);
  lights.push({red, blue, phase: Math.random() * 2});
  return g;
}

function tree(scale = 1) {
  const g = new THREE.Group();
  const trunk = mesh(G.cyl(0.13, 0.17, 1.6, 12), 0x7a5232, {outline: 2});
  trunk.position.y = 0.8;
  g.add(trunk);
  for (const [x, y, z, r] of [[0, 2.3, 0, 1.0], [0.55, 2.0, 0.2, 0.7], [-0.5, 2.1, -0.1, 0.75], [0.1, 2.85, 0.1, 0.7]]) {
    const c = mesh(G.sphere(r, 20, 14), 0x4f9a4a, {outline: 2.5});
    c.position.set(x, y, z);
    g.add(c);
  }
  g.scale.setScalar(scale);
  return g;
}

function house(color, roof, w = 5, d = 4) {
  const g = new THREE.Group();
  const b = mesh(G.box(w, 2.8, d), color, {outline: 2.5});
  b.position.y = 1.4;
  const r = mesh(new THREE.ConeGeometry(Math.hypot(w, d) / 2 * 0.95, 1.5, 4), roof, {outline: 2.5});
  r.rotation.y = Math.PI / 4; r.position.y = 3.55; r.scale.set(1, 1, d / w);
  g.add(b, r);
  return g;
}

export function createYard() {
  const g = new THREE.Group();
  const carLights = [];
  // céu: cúpula com degradê (o renderizador não usa scene.background)
  const skyTex = canvasTexture(1, 4, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#6fb6ea'); gr.addColorStop(0.5, '#a9d6f5'); gr.addColorStop(0.62, '#d8eefc'); gr.addColorStop(1, '#d8eefc');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }, 64);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16), new THREE.MeshBasicMaterial({map: skyTex, side: THREE.BackSide, depthWrite: false}));
  g.add(sky);
  // chão: gramado + pátio de cimento na frente do prédio + rua/estacionamento no portão
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon(0x86c66a));
  grass.rotation.x = -Math.PI / 2;
  g.add(grass);
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(12, 7), toon(0xcfcac0));
  patio.rotation.x = -Math.PI / 2; patio.position.set(0, 0.01, BZ - 3.5);
  g.add(patio);
  const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 7), toon(0x8b8f96));
  street.rotation.x = -Math.PI / 2; street.position.set(0, 0.01, -14);
  g.add(street);
  for (let x = -12; x <= 12; x += 3) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.2), flat(0xf2f2f2));
    l.rotation.x = -Math.PI / 2; l.position.set(x, 0.02, -12.2);
    g.add(l);
  }

  // prédio da escola (fachada voltada pra -z), com marquise e a porta de vidro da portaria
  const school = new THREE.Group();
  school.position.set(0, 0, BZ);
  const wallLo = mesh(G.box(22, 1.1, 0.4), 0x6f9f8a, {outline: 2.5});
  wallLo.position.set(0, 0.55, 0.2);
  const wallHi = mesh(G.box(22, 5.4, 0.4), 0xe9dcb8, {outline: 2.5});
  wallHi.position.set(0, 3.8, 0.2);
  school.add(wallLo, wallHi);
  for (const x of [-8, -5, -2.2, 2.2, 5, 8]) for (const y of [2.4, 4.9]) {
    if (Math.abs(x) < 3 && y < 3) continue;
    const win = mesh(G.box(1.6, 1.1, 0.06), 0x3f6fb5, {outline: 2});
    win.position.set(x, y, -0.02);
    school.add(win);
  }
  const door = new THREE.Group();
  door.position.set(0, 0, -0.02);
  const dFrame = mesh(G.box(2.0, 2.5, 0.08), 0x3a3f4a, {outline: 2.5});
  dFrame.position.y = 1.25;
  const inside = flat(0x1c212c);  // lá dentro está escuro (sem luz)
  for (const x of [-0.46, 0.46]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 2.25), inside); p.position.set(x, 1.17, -0.045); p.rotation.y = Math.PI; door.add(p); }
  door.add(dFrame);
  school.add(door);
  const canopy = mesh(G.box(4.2, 0.18, 1.8), 0x8a5a3a, {outline: 2.5});
  canopy.position.set(0, 3.0, -0.9);
  school.add(canopy);
  for (const x of [-1.95, 1.95]) { const col = mesh(G.cyl(0.07, 0.07, 3.0, 10), 0x5a5f6a, {outline: 1.5}); col.position.set(x, 1.5, -1.7); school.add(col); }
  const plate = textPlane(5.2, 0.9, (c, w, h) => {
    c.fillStyle = '#2b5fa8'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; c.font = `900 ${h * 0.42}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('ESCOLA ESTADUAL', w / 2, h * 0.42);
    c.font = `700 ${h * 0.2}px Arial`; c.fillText('ENSINO FUNDAMENTAL E MÉDIO', w / 2, h * 0.8);
  });
  plate.position.set(0, 3.75, -0.05); plate.rotation.y = Math.PI;
  const port = textPlane(1.4, 0.32, (c, w, h) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2b5fa8'; c.font = `900 ${h * 0.62}px Arial`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('PORTARIA', w / 2, h / 2);
  });
  port.position.set(0, 2.72, -0.06); port.rotation.y = Math.PI;
  school.add(plate, port);
  school.rotation.y = 0;
  g.add(school);
  // sombra da marquise no chão (a figura fica dentro dela)
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), new THREE.MeshBasicMaterial({color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false}));
  shade.rotation.x = -Math.PI / 2; shade.position.set(0, 0.02, BZ - 1.0);
  g.add(shade);

  // grade e portão (atrás das viaturas)
  const fence = new THREE.Group();
  for (let x = -14; x <= 14; x += 0.35) {
    if (Math.abs(x) < 2.6) continue;
    const bar = mesh(G.box(0.04, 1.9, 0.04), 0x2f5d43, {outline: 1});
    bar.position.set(x, 0.95, -10.3);
    fence.add(bar);
  }
  const rail = mesh(G.box(28, 0.06, 0.06), 0x2f5d43, {outline: 1});
  rail.position.set(0, 1.85, -10.3);
  fence.add(rail);
  g.add(fence);

  // viaturas da PM (no portão, giroflex ligado)
  for (const [x, z, ry] of [[-4.2, -13.2, 1.25], [0.8, -14.6, 1.65], [5.6, -13.4, 1.9]]) {
    const car = policeCar(carLights);
    car.position.set(x, 0, z); car.rotation.y = ry;
    g.add(car);
  }
  // árvores e casas do outro lado da rua
  for (const [x, z, s] of [[-9, -6, 1.2], [9.5, -5, 1.3], [-6, -20, 1.4], [3, -22, 1.2], [12, -19, 1.5], [-13, 2, 1.3], [13, 3, 1.2]]) {
    const t = tree(s); t.position.set(x, 0, z); g.add(t);
  }
  for (const [x, z, c, r] of [[-9, -25, 0xf0b8c8, 0xb05a4a], [-2, -26, 0xf3e3a8, 0x9a4a3a], [5, -25, 0xbfd9f0, 0xb05a4a], [12, -26, 0xf5d0b0, 0x8a4a3a]]) {
    const h = house(c, r); h.position.set(x, 0, z); g.add(h);
  }
  // nuvens
  for (const [x, y, z, s] of [[-8, 13, -40, 3], [6, 15, -45, 4], [16, 12, -38, 2.6], [-18, 14, -42, 3.4], [0, 16, 30, 4], [-10, 14, 34, 3], [12, 13, 32, 3.2]]) {
    const cl = new THREE.Mesh(G.sphere(1, 18, 12), flat(0xffffff));
    cl.scale.set(s * 1.8, s * 0.45, s * 0.9); cl.position.set(x, y, z);
    g.add(cl);
  }

  return {
    group: g, carLights, BZ,
    pois: {door: V(0, 1.4, BZ - 0.05), sign: V(0, 3.7, BZ), gate: V(0, 1.2, -12)},
    update(t) {
      for (const L of carLights) {
        const on = Math.floor((t + L.phase) * 3.2) % 2 === 0;
        L.red.color.setHex(on ? 0xff3030 : 0x5a1010);
        L.blue.color.setHex(on ? 0x14205a : 0x3a6bff);
      }
    },
  };
}
