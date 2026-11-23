// Demo de 10 s: copa do escritório, colega sentada à frente conversando.
// Falas de TESTE (sem áudio): tempos aproximados por sílaba. Com ElevenLabs, trocar start/end/words pelos timestamps reais.
import * as THREE from 'three';
import {createCharacter} from '../../engine/character.js';
import {createBreakRoom} from '../../environments/breakRoom.js';
import {createPov, createPovArms} from '../../engine/pov.js';
import {createRenderer, createLights} from '../../engine/render.js';
import {track, targetAt, blinkAt, parseLine, mouthAt} from '../../engine/anim.js';
import {validateStatic, validateMotion} from '../../engine/validate.js';

export const LINES = [
  {speaker: 'lia', text: 'Ei. Você chegou cedo hoje.', start: 1.0, end: 2.85},
  {speaker: 'lia', text: 'Alguém deixou aquela porta aberta.', start: 3.7, end: 5.9},
  {speaker: 'lia', text: 'E eu tranquei ontem à noite.', start: 7.35, end: 9.25, intensity: 0.85},
].map(parseLine);

const wordStart = (line, prefix) => line.words.find((w) => w.raw.toLowerCase().startsWith(prefix)).start;

export function createDemoScene(canvas, width, height) {
  const scene = new THREE.Scene();
  const lights = createLights(scene);
  const room = createBreakRoom();
  scene.add(room.group);
  room.door.rotation.y = -0.38; // porta entreaberta

  const lia = createCharacter({hairStyle: 'bob', skin: 0xc68a63, hair: 0x5a2a1c, top: 0x2c8c80, pants: 0x3b4157,
    badge: {name: 'LIA M.', role: 'RH'}});
  lia.root.position.set(0, 0, -0.68);
  scene.add(lia.root);

  const EYE = new THREE.Vector3(0, 1.22, 0.9);
  scene.add(createPovArms({arms: [
    [[0.36, 0.76, 0.85], [0.2, 0.745, 0.2]],
    [[-0.38, 0.76, 0.85], [-0.23, 0.745, 0.22]],
  ]}));

  const pov = createPov({aspect: width / height});
  const renderer = createRenderer(canvas, width, height);

  // ---- direção ----
  const P = room.pois;
  const FACE = new THREE.Vector3(0, 0.98, -0.68);   // câmera enquadra rosto no terço superior
  const doorT = wordStart(LINES[1], 'aquela');      // olhar nasce da fala
  const gaze = [
    {t: 0, target: P.mug},
    {t: 0.45, target: EYE},                          // percebe o protagonista
    {t: doorT - 0.05, target: P.door},              // "aquela porta"
    {t: 6.15, target: EYE},
    {t: 9.4, target: P.door},                       // olhada nervosa no fim
    {t: 9.75, target: EYE},
  ];
  const camKeys = [
    {t: 0, target: FACE},
    {t: doorT + 0.3, target: P.door.clone().setY(1.1), dur: 0.8}, // segue o olhar dela
    {t: 6.05, target: FACE, dur: 0.75},
  ];
  // repouso calculado: ombro a 0.92 m, braço 0.25 m -> cotovelo ~0.78 m; antebraço horizontal
  // com raio da mão (0.051 m) apoiado no tampo (0.725 m)
  const REST_L = [-0.98, 0.05, -0.2, -0.6];
  const REST_R = [-0.98, -0.05, 0.2, -0.6];
  const OPEN_HAND = [-1.0, 0, -0.45, -1.35];
  const POINT = [-0.35, 0.2, 1.15, -0.2];
  const LIFT_L = [-1.1, 0.05, 0.3, -0.9]; // tira a mão da mesa antes de apontar (evita atravessar o tampo)
  const armTrackR = [[0, REST_R], [1.1, REST_R], [1.4, OPEN_HAND], [2.4, [-0.98, 0, -0.4, -1.2]], [2.85, REST_R]];
  const armTrackL = [[0, REST_L], [doorT + 0.05, REST_L], [doorT + 0.2, LIFT_L], [doorT + 0.45, POINT],
    [5.75, POINT], [6.0, LIFT_L], [6.25, REST_L]];
  const blinks = [0.62, 2.95, doorT - 0.2, 6.2, 8.15, 9.62];
  const nod = (t, at, amp = 0.06, w = 0.18) => amp * Math.exp(-(((t - at) / w) ** 2));
  // inclinar o tronco gira os braços junto; compensa para as mãos não afundarem na mesa
  const arm = (v, lean) => ({shoulder: [v[0] - 1.55 * lean, v[1], v[2]], elbow: v[3]});

  const pose = (t) => {
    const m = mouthAt(t, LINES);
    const tension = track(t, [[0, 0], [6.9, 0], [7.9, 1]]);
    const lean = track(t, [[0, 0.06], [0.5, 0], [7.1, 0], [7.8, 0.14], [10, 0.16]]);
    return {
      t,
      sit: 1,
      lean,
      eyesAt: targetAt(t, gaze, 0.12),
      lookAt: targetAt(t - 0.08, gaze, 0.45),
      headFollow: 0.7,
      head: {
        pitch: m.open * 0.03 - nod(t, 1.25) - nod(t, 2.45, 0.04) - nod(t, 8.5, 0.035),
        roll: track(t, [[0, 0], [1.0, 0.07], [2.9, 0.05], [3.5, 0], [7.2, 0], [7.8, -0.05]]),
      },
      blink: blinkAt(t, blinks),
      eyeOpen: track(t, [[0, 1], [doorT - 0.1, 1], [doorT + 0.2, 1.14], [6.4, 1.04], [7.2, 1.04], [7.6, 1.2]]),
      browRaise: track(t, [[0, 0], [0.5, 0.7], [1.3, 0.45], [2.9, 0.3], [3.4, 0], [doorT, 0.4], [6.3, 0.15], [7.2, 0.15], [7.7, 0.75]]),
      browAngle: track(t, [[0, 0], [3.2, 0], [3.7, 0.12], [6.6, 0.18], [7.2, 0.18], [7.7, 0.5]]),
      mouth: m,
      mouthWidth: track(t, [[0, 1], [0.6, 1.15], [2.9, 1.1], [3.4, 0.9], [7.2, 0.85]]),
      armL: arm(track(t, armTrackL), lean),
      armR: arm(track(t, armTrackR), lean),
      tension,
    };
  };

  return {
    /** Validação geométrica (estática + animação da personagem contra a mesa e objetos). */
    validate() {
      const issues = validateStatic(scene, EYE);
      const {armL, armR} = lia.rig;
      issues.push(...validateMotion((t) => lia.apply(pose(t)), {
        to: 10, step: 0.1,
        parts: [['mão esq. Lia', armL.hand], ['mão dir. Lia', armR.hand], ['antebraço esq. Lia', armL.fore], ['antebraço dir. Lia', armR.fore]],
        obstacles: [room.tableTop, ...room.tableProps],
      }));
      return issues;
    },
    render(t) {
      const st = pose(t);
      lia.apply(st);
      room.update(t);
      lights.set('normal', 'tension', st.tension * 0.85);
      const eye = EYE.clone();
      eye.z -= track(t, [[0, 0], [7.4, 0], [9.0, 0.1]]); // protagonista se inclina para ouvir
      pov.update(t, eye, camKeys);
      renderer.render(scene, pov.camera);
    },
    dispose: () => renderer.dispose(),
  };
}
