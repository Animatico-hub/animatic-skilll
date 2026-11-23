// Exemplo da UI de mensagens/avisos (Pacote 4) na copa:
// 0–3,6 alerta de emergência + voz do alto-falante (etiqueta na legenda) · 3,6–6,6 voz atrás da porta (etiqueta)
// · 6,6–10,9 celular na mão + notificação que escurece palavra por palavra · 11–12,5 fala da Lia.
// Regra do usuário: etiqueta só nas FALAS (quem está falando); nada de etiqueta em objetos (porta, janela...).
import * as THREE from 'three';
import {createBreakRoom} from '../../environments/breakRoom.js';
import {createRenderer, createLights} from '../../engine/render.js';
import {createPovRig} from '../../engine/pov.js';
import {createCharacter} from '../../engine/character.js';
import {mesh, G} from '../../engine/toon.js';
import {track, parseLine, mouthAt, blinkAt} from '../../engine/anim.js';
import {createPhone, createPhoneHold} from '../../engine/phone.js';
import {validateStatic, validateMotion} from '../../engine/validate.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const LINES = [
  {speaker: 'pa', text: 'Atenção, funcionários:', start: 0.25, end: 1.1},
  {speaker: 'pa', text: 'invasor no prédio.', start: 1.15, end: 2.0},
  {speaker: 'pa', text: 'Não abram a porta.', start: 2.1, end: 3.2},
  {speaker: 'porta', text: 'Sou eu, o Rui!', start: 4.0, end: 4.9},
  {speaker: 'porta', text: 'Me deixa entrar!', start: 5.1, end: 6.3},
  {speaker: 'lia', text: 'O Rui tá aí?', start: 7.6, end: 8.5},
  {speaker: 'lia', text: 'Então quem tá na porta?', start: 11.2, end: 12.6},
].map(parseLine);
export const NOTIF = {at: 8.7, who: 'Rui', initial: 'R', color: '#e06a2c', status: '07:53',
  text: 'tô escondido no arquivo. quem tá batendo??', warn: 'NÃO ABRE', perWord: 0.2};

export function createUiTestScene(canvas, width, height) {
  const scene = new THREE.Scene();
  const lights = createLights(scene);
  const room = createBreakRoom();
  scene.add(room.group);
  room.door.rotation.y = 0;
  const pov = createPovRig({fov: 78, aspect: width / height});
  scene.add(pov.camera);
  const renderer = createRenderer(canvas, width, height);

  const lia = createCharacter({hairStyle: 'bob', skin: 0xc68a63, hair: 0x5a2a1c, top: 0x2c8c80, pants: 0x3b4157, badge: {name: 'LIA M.', role: 'RH'}});
  lia.root.position.set(0, 0, -0.68);
  scene.add(lia.root);

  // celular segurado com as duas mãos (posição aprovada): no colo, sobe para o close e volta
  const phone = createPhone({contact: {name: 'Rui', color: '#e06a2c'}, clock: () => '07:53', messages: [
    {at: 0, from: 'me', text: 'cadê vc??', time: '07:51'},
    {at: 0, from: 'them', text: 'fui pegar o arquivo 312', time: '07:51'},
    {at: 8.7, from: 'them', text: 'tô escondido no arquivo. quem tá batendo??', time: '07:53', alert: true},
  ]});
  const hold = createPhoneHold(phone, {aimUp: 0.016}); // banner de 3 linhas: celular um pouco mais baixo no quadro
  scene.add(hold.group);
  const CLOSE = [6.6, 10.9];
  const kKeys = [[CLOSE[0], 0], [CLOSE[0] + 0.6, 1], [CLOSE[1] - 0.4, 1], [CLOSE[1] + 0.1, 0]];
  const fovKeys = [[CLOSE[0], 78], [CLOSE[0] + 0.7, 52], [CLOSE[1] - 0.4, 52], [CLOSE[1] + 0.2, 78]];

  const FACE = V(0, 0.98, -0.68);
  const DOOR = V(2.3, 1.3, -0.95);
  const look = [
    {t: 0, target: FACE},
    {t: 3.7, target: DOOR, whip: true},                  // batida/voz na porta
    {t: CLOSE[0] - 0.2, target: hold.aim, dur: 0.5},     // mira no celular (alvo vivo)
    {t: CLOSE[1] - 0.3, target: FACE, dur: 0.45},
  ];
  const EYE = V(0, 1.22, 0.9);
  const liaLines = LINES.filter((l) => l.speaker === 'lia');
  const pose = (t) => {
    const at = t > 3.9 && t < 6.6 ? DOOR : EYE;
    return {t, sit: 1, lean: 0, eyesAt: at, lookAt: at, headFollow: 0.7, head: {pitch: 0, roll: 0},
      blink: blinkAt(t, [1.4, 5.2, 9.1, 12.4]), eyeOpen: 1.15, browRaise: 0.7, browAngle: 0.45, mouth: mouthAt(t, liaLines), mouthWidth: 0.9,
      armL: {shoulder: [-0.98, 0.05, -0.2], elbow: -0.6}, armR: {shoulder: [-0.98, -0.05, 0.2], elbow: -0.6}};
  };
  const holdAt = (t) => hold.update(t, {eye: EYE, yaw: 0, k: track(t, kKeys)});

  return {
    /** Validação geométrica: estática + mãos da Lia e celular (com as mãos do POV) contra a mesa e os objetos. */
    validate() {
      const issues = validateStatic(scene, EYE);
      const {armL, armR} = lia.rig;
      issues.push(...validateMotion((t) => { lia.apply(pose(t)); holdAt(t); }, {
        to: 12.6, step: 0.1,
        parts: [['mão esq. Lia', armL.hand], ['mão dir. Lia', armR.hand], ['antebraço esq. Lia', armL.fore],
          ['antebraço dir. Lia', armR.fore], ['celular nas mãos', hold.group]],
        obstacles: [room.tableTop, ...room.tableProps],
      }));
      return issues;
    },
    render(t) {
      lights.set('normal', 'tension', track(t, [[0, 0.2], [3.5, 0.6], [11, 0.8]]));
      room.update(t);
      lia.apply(pose(t));
      holdAt(t);
      pov.camera.fov = track(t, fovKeys);
      pov.camera.updateProjectionMatrix();
      pov.update(t, EYE, look, {shakes: [{t: 3.7, amp: 2.5, dur: 0.3}]});
      renderer.render(scene, pov.camera);
    },
    dispose: () => renderer.dispose(),
  };
}
