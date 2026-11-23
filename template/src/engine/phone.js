// Celular com conversa (Pacote 4, aprovado em 19/11/2026; generalizado de uma série anterior).
// Tela em canvas de alta resolução: cabeçalho com contato e online/visto, mensagens com hora e ✓✓,
// mensagens de alerta (vermelhas), digitando no campo de texto. Tudo é função de t.
import * as THREE from 'three';
import {mesh, G} from './toon.js';

const SANS = 'Arial, "Segoe UI", "Segoe UI Emoji", sans-serif';
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Celular segurado com as duas mãos, (posição aprovada pelo usuário).
 * O corpo fica preso ao olho do protagonista; k = 0 (celular baixo, no colo) .. 1 (close: celular inteiro na tela).
 * No close, a câmera mira em hold.aim e fecha o FOV para ~52 — ou use far: true (mais longe,
 * celular menor, FOV ~58). Legenda a ~75,5% durante o close.
 * update(t, {eye: Vector3, yaw: rad, k, typing}) — typing = polegar tremendo enquanto digita.
 */
// aimUp: quanto o ponto de mira fica acima do centro do celular (m). Padrão da série = -0,011; use ~+0,015 para
// baixar o celular no quadro quando o banner de mensagem no topo for alto (3 linhas), para não cobrir o aparelho.
export function createPhoneHold(phone, {sleeve = 0x5d6475, skin = 0xe2b08a, far = false, aimUp = -0.011} = {}) {
  const body = new THREE.Group();
  body.add(phone.group);
  const up = V(0, 1, 0), a = V(0, 0, 0), b = V(0, 0, 0), d = V(0, 0, 0);
  const makeArm = () => {
    const fore = mesh(new THREE.CylinderGeometry(0.048, 0.05, 1, 20), sleeve, {outline: 3});
    const elbow = mesh(new THREE.SphereGeometry(0.05, 20, 14), sleeve, {outline: 3});
    const hand = mesh(new THREE.SphereGeometry(0.055, 20, 14), skin, {outline: 3});
    hand.scale.set(1, 0.72, 1.15);
    body.add(fore, elbow, hand);
    return (v) => {
      a.set(v[0], v[1], v[2]); b.set(v[3], v[4], v[5]);
      d.subVectors(b, a);
      fore.position.copy(a).lerp(b, 0.5);
      fore.scale.set(1, d.length(), 1);
      fore.quaternion.setFromUnitVectors(up, d.normalize());
      elbow.position.copy(a);
      hand.position.copy(b).addScaledVector(d, 0.04);
      hand.rotation.set(0, Math.atan2(d.x, d.z), 0);
    };
  };
  const armR = makeArm(), armL = makeArm();
  // coordenadas relativas ao olho (x direita, y cima, -z frente), medidas num episódio aprovado
  const dz = far ? -0.08 : 0;
  const LOW = {ph: V(0.06, -0.23, -0.2), r: [0.2, -0.4, 0.0, 0.06, -0.28, -0.21], l: [-0.24, -0.42, -0.02, -0.1, -0.33, -0.29]};
  const CLOSE = {ph: V(0, -0.115, -0.265 + dz), r: [0.2, -0.34, -0.06, 0.045, -0.2, -0.275 + dz], l: [-0.2, -0.34, -0.06, -0.045, -0.195, -0.275 + dz]};
  const lerpA = (p, q, k) => p.map((x, i) => x + (q[i] - x) * k);
  const eyeW = V(0, 0, 0);
  const aim = V(0, 0, 0);
  return {
    group: body,
    aim,
    update(t, {eye, yaw = 0, k = 1, typing = false}) {
      body.position.copy(eye); body.rotation.set(0, yaw, 0);
      const tr = typing ? Math.sin(t * 38) * 0.004 : 0;
      const r = lerpA(LOW.r, CLOSE.r, k); r[4] += tr;
      armR(r); armL(lerpA(LOW.l, CLOSE.l, k));
      phone.group.position.copy(LOW.ph).lerp(CLOSE.ph, k);
      body.updateMatrixWorld(true);
      phone.group.lookAt(eyeW.copy(eye));
      phone.group.getWorldPosition(aim);
      aim.y += aimUp;
      phone.set(t);
    },
  };
}
const rr = (c, x, y, w, h, r) => {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};

/**
 * contact {name, initial?, color}; messages [{at, from: 'them'|'me', text, time, alert?, typeFrom?}]
 * (typeFrom = início da digitação de uma mensagem minha); seenAt = quando o contato sai do "online";
 * clock(t) = hora na barra de status. Retorna {group, stateAt(t), set(t)} — chame set(t) a cada frame.
 */
export function createPhone({contact, messages, seenAt = Infinity, clock = () => '00:00', seenLabel = 'visto por último'}) {
  const W = 0.074, H = 0.152;
  const g = new THREE.Group();
  g.add(mesh(G.box(W, H, 0.009), 0x1d1f26, {outline: 2}));
  const cw = 980, ch = Math.round(cw * (H * 0.93) / (W * 0.92));
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const c = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, H * 0.93), new THREE.MeshBasicMaterial({map: tex}));
  face.position.z = 0.0047;
  g.add(face);
  const txt = (s, x, y, size, color, {align = 'left', weight = 'normal'} = {}) => {
    c.font = `${weight} ${size}px ${SANS}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y);
  };
  const wrap = (s, maxW) => {
    const out = []; let line = '';
    for (const w of s.split(' ')) { const tt = line ? `${line} ${w}` : w; if (c.measureText(tt).width > maxW && line) { out.push(line); line = w; } else line = tt; }
    out.push(line); return out;
  };
  const draw = (t, shown, typed, online) => {
    const w = cw, h = ch, u = w / 100;
    c.fillStyle = '#0f1419'; c.fillRect(0, 0, w, h);
    txt(clock(t), 6 * u, 4 * u, 4.6 * u, '#e8eaed', {weight: 'bold'});
    c.fillStyle = '#e8eaed'; c.fillRect(w - 13 * u, 2.6 * u, 7 * u, 3 * u);
    c.fillStyle = '#1c2530'; c.fillRect(0, 8 * u, w, 15 * u);
    c.fillStyle = contact.color; c.beginPath(); c.arc(14 * u, 15.5 * u, 5.5 * u, 0, Math.PI * 2); c.fill();
    txt(contact.initial ?? contact.name[0], 14 * u, 15.7 * u, 5 * u, '#fff', {align: 'center', weight: 'bold'});
    txt(contact.name, 24 * u, 13.2 * u, 6.2 * u, '#fff', {weight: 'bold'});
    txt(online ? 'online' : seenLabel, 24 * u, 19 * u, 3.8 * u, online ? '#5fd38d' : '#8b96a0');
    c.fillStyle = '#1c2530'; c.fillRect(0, h - 12 * u, w, 12 * u);
    rr(c, 4 * u, h - 10 * u, w - 8 * u, 8 * u, 4 * u); c.fillStyle = '#2a3440'; c.fill();
    if (typed) { c.font = `${4.8 * u}px ${SANS}`; let s = typed; while (c.measureText(s).width > w - 20 * u) s = s.slice(1); txt(`${s}|`, 9 * u, h - 6 * u, 4.8 * u, '#e8eaed'); }
    else txt('Mensagem', 9 * u, h - 6 * u, 4.4 * u, '#7d8790');
    let y = h - 15 * u;
    for (let i = shown.length - 1; i >= 0; i--) {
      const m = shown[i]; const fs = 6.4 * u, lh = 8 * u; const me = m.from === 'me';
      c.font = `${m.alert ? 'bold ' : ''}${fs}px ${SANS}`;
      const lines = wrap(m.text, 66 * u);
      const bh = 5 * u + lines.length * lh + 5.5 * u;
      const bw = Math.min(86 * u, Math.max(...lines.map((l) => c.measureText(l).width)) + 14 * u);
      y -= bh; if (y < 24 * u) break;
      const x = me ? w - 4 * u - bw : 4 * u;
      rr(c, x, y, bw, bh, 3 * u);
      c.fillStyle = me ? (m.alert ? '#c0392b' : '#2b6fd6') : m.alert ? '#3a1c22' : '#1f2c34'; c.fill();
      if (m.alert && !me) { c.strokeStyle = '#ff5a5a'; c.lineWidth = 0.8 * u; c.stroke(); }
      let ty = y + 5 * u + lh / 2;
      for (const l of lines) { txt(l, x + 4 * u, ty, fs, m.alert && !me ? '#ffd2d2' : '#ffffff', {weight: m.alert ? 'bold' : 'normal'}); ty += lh; }
      txt((m.time ?? '') + (me ? '  ✓✓' : ''), x + bw - 3 * u, y + bh - 3.2 * u, 3.6 * u, '#c9d1d8', {align: 'right'});
      y -= 2.6 * u;
    }
  };
  let cur = '';
  const stateAt = (t) => {
    const shown = messages.filter((m) => t >= m.at);
    const typing = messages.find((m) => m.typeFrom != null && t >= m.typeFrom && t < m.at);
    const typed = typing ? typing.text.slice(0, Math.max(1, Math.round(typing.text.length * (t - typing.typeFrom) / (typing.at - typing.typeFrom)))) : '';
    return {shown, last: shown[shown.length - 1], typing, typed, online: t < seenAt};
  };
  return {
    group: g,
    stateAt,
    set(t) {
      const s = stateAt(t);
      const k = `${s.shown.length}|${s.typed}|${s.online}|${clock(t)}`;
      if (k !== cur) { draw(t, s.shown, s.typed, s.online); tex.needsUpdate = true; cur = k; }
    },
  };
}
