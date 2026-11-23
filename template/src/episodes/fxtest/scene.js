// Exemplo dos efeitos (engine/fx.js) na copa: 0–4 fogo · 4–8 janela de noite · 8–12 alagamento · 12–16 submerso.
import * as THREE from 'three';
import {createBreakRoom} from '../../environments/breakRoom.js';
import {createRenderer, createLights} from '../../engine/render.js';
import {createPovRig} from '../../engine/pov.js';
import {mesh, G} from '../../engine/toon.js';
import {paper} from '../../engine/props.js';
import {track} from '../../engine/anim.js';
import {createFire, createWindowFx, createFlood, createUnderwater} from '../../engine/fx.js';
import {validateStatic} from '../../engine/validate.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const B = {x0: -2.3, x1: 2.3, z0: -2.6, z1: 1.8};

export function createFxTestScene(canvas, width, height) {
  const scene = new THREE.Scene();
  const lights = createLights(scene);
  const room = createBreakRoom();
  scene.add(room.group);
  const pov = createPovRig({fov: 78, aspect: width / height});
  scene.add(pov.camera);
  const renderer = createRenderer(canvas, width, height);

  const fire = createFire({
    flames: [
      {x: -1.3, y: 0, z: -2.0, w: 1.6, h: 2.5, at: 0.0}, {x: -1.25, y: 0, z: -0.3, w: 1.6, h: 2.6, at: 0.2},
      {x: 1.25, y: 0, z: -0.2, w: 1.6, h: 2.6, at: 0.5}, {x: 0.6, y: 0, z: -2.1, w: 1.6, h: 2.4, at: 0.9},
      {x: 0.3, y: 0.725, z: -0.15, w: 0.9, h: 1.5, at: 1.4}, {x: -1.0, y: 0, z: 0.75, w: 1.3, h: 2.4, at: 1.8},
      {x: 1.05, y: 0, z: 0.8, w: 1.3, h: 2.4, at: 2.2}, {x: -0.3, y: 0, z: -1.2, w: 1.4, h: 2.4, at: 2.6},
    ],
    smoke: {y: 2.55, ...B},
  });
  scene.add(fire.group);

  const win = createWindowFx();
  win.group.position.set(-2.3 + 0.07, 1.55, -0.9);
  win.group.rotation.y = Math.PI / 2;
  scene.add(win.group, win.flashLight);

  const flood = createFlood(B);
  scene.add(flood.group);
  const JETS = [
    {p: [2.26, 0.03, -1.25], dir: [-1, 0.1], at: 8.15, r: 0.03}, {p: [2.26, 0.03, -0.95], dir: [-1, 0], at: 8.3, r: 0.03},
    {p: [2.26, 0.03, -0.65], dir: [-1, -0.1], at: 8.45, r: 0.03}, {p: [2.24, 0.55, -0.5], dir: [-1, 0.25], at: 9.0},
    {p: [2.24, 1.1, -0.5], dir: [-1, 0.3], at: 9.8, power: 1.2}, {p: [2.24, 1.65, -0.5], dir: [-1, 0.35], at: 10.7, power: 1.3},
  ];

  const under = createUnderwater(scene, {...B});
  scene.add(under.group);
  // destroços: canecas, cadeira, papéis, lixeira
  const mug = (c) => { const g = new THREE.Group(); g.add(mesh(G.cyl(0.045, 0.04, 0.1, 18), c, {outline: 2})); const h = mesh(new THREE.TorusGeometry(0.03, 0.009, 8, 16), c, {outline: 1.5}); h.position.x = 0.05; g.add(h); return g; };
  const chair = () => { const g = new THREE.Group(); const s = mesh(G.box(0.42, 0.04, 0.42), 0x3f6fb5, {outline: 2.5}); const b = mesh(G.box(0.42, 0.45, 0.04), 0x3f6fb5, {outline: 2.5}); b.position.set(0, 0.24, -0.19);
    g.add(s, b); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, z]) => { const l = mesh(G.box(0.03, 0.42, 0.03), 0x2b2d35, {outline: 2}); l.position.set(x, -0.22, z); g.add(l); }); return g; };
  const bin = () => mesh(G.cyl(0.14, 0.11, 0.36, 18), 0x6d6f73, {outline: 2.5});
  const floaters = [[mug(0xd8343a), [-0.5, 1.5, -0.6]], [mug(0xf2c230), [0.6, 1.9, -1.2]], [chair(), [1.0, 1.1, -1.6]], [bin(), [-1.1, 0.9, -1.5]],
    [paper(0.21, 0.3, {title: 'AVISO'}), [0.2, 2.1, -0.4]], [paper(0.21, 0.3, {title: 'ESCALA'}), [-0.7, 2.3, -1.9]], [mug(0x2f6fe0), [0.9, 1.3, 0.2]]];
  floaters.forEach(([o, p], i) => { o.position.set(...p); under.addFloater(o, i * 1.7 + 0.4); });

  const HAZE = new THREE.FogExp2(0x8a6240, 0); // névoa quente e leve no cômodo pegando fogo
  const segAt = (t) => (t < 4 ? 'fire' : t < 8 ? 'window' : t < 12 ? 'flood' : 'under');
  const CAM = {
    fire: {eye: V(0.1, 1.5, 1.4), look: [{t: 0, target: V(0.0, 1.1, -2.4)}, {t: 2.4, target: V(-0.4, 1.0, -1.6), dur: 0.9}]},
    window: {eye: V(0.2, 1.5, 0.5), look: [{t: 4, target: V(-2.3, 1.45, -0.9)}]},
    flood: {eye: V(0.0, 1.55, 1.2), look: [{t: 8, target: V(2.3, 0.9, -0.95)}, {t: 10.4, target: V(1.4, 0.2, -0.6), dur: 0.9}]},
    under: {eye: V(0.0, 1.35, 1.0), look: [{t: 12, target: V(0.0, 1.3, -1.6)}, {t: 13.2, target: V(0.3, 2.4, -1.2), dur: 1.4}, {t: 14.8, target: V(-0.4, 1.0, -1.6), dur: 1.0}]},
  };
  const SHAKES = [{t: 6.62, amp: 3.5, dur: 0.35}, {t: 10.7, amp: 2, dur: 0.3}];

  return {
    /** Validação geométrica estática (sem personagem aqui): objetos apoiados, interseções, texto virado para a câmera. */
    validate() {
      return Object.values(CAM).flatMap(({eye}) => validateStatic(scene, eye)).filter((x, i, a) => a.indexOf(x) === i);
    },
    render(t) {
      const seg = segAt(t);
      fire.group.visible = seg === 'fire';
      win.group.visible = seg === 'window';
      flood.group.visible = seg === 'flood';
      under.enable(seg === 'under');
      room.door.rotation.y = seg === 'fire' ? -0.38 : 0;
      if (seg === 'fire') { lights.set('darkness'); scene.fog = HAZE; HAZE.density = 0.07 * (fire.amount ?? 0); }
      else if (scene.fog === HAZE) scene.fog = null;
      if (seg === 'fire') {}
      else if (seg === 'window') lights.set('darkness');
      else if (seg === 'flood') lights.set('normal');
      else lights.set('tension');
      room.update(t);
      const c = CAM[seg];
      pov.update(t, c.eye, c.look, {shakes: SHAKES});
      fire.update(t, pov.camera);
      win.update(t, {flashes: [4.9, 6.55], crackAt: 6.62, silhouette: {from: 6.4, x: 0.68}});
      flood.update(t, {level: track(t, [[8.3, 0], [11.9, 0.8]]), jets: seg === 'flood' ? JETS : [], camera: pov.camera});
      under.update(t);
      renderer.render(scene, pov.camera);
    },
    dispose: () => renderer.dispose(),
  };
}
