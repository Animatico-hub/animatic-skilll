// Celular no layout do WhatsApp (modo escuro), mesma interface de createPhone ({group, stateAt, set}) para usar com
// createPhoneHold. Cabeçalho com voltar/foto/nome/membros e ícones, papel de parede com rabiscos, balões com "rabinho",
// NOME DO REMETENTE colorido em cima do texto (grupo), hora + ✓✓ azul dentro do balão, barra de digitação com microfone.
// A tela também ilumina o rosto: screen (Mesh) é exposta para o brilho/luz do celular.
// messages: [{at, from: 'them'|'me', who?, whoColor?, text, time, alert?, typeFrom?}]
import * as THREE from 'three';
import {mesh, G} from './toon.js';

const SANS = 'Arial, "Segoe UI", "Segoe UI Emoji", sans-serif';
const rr = (c, x, y, w, h, r) => {
  c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};

export function createWhatsPhone({contact, messages, clock = () => '00:00', members = 'online', battery = 0.62}) {
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
  const u = cw / 100;
  const font = (s, wgt = 'normal') => `${wgt} ${s}px ${SANS}`;
  const txt = (s, x, y, size, color, {align = 'left', weight = 'normal'} = {}) => {
    c.font = font(size, weight); c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y);
  };
  const wrap = (s, maxW) => {
    const out = []; let line = '';
    for (const w of s.split(' ')) { const tt = line ? `${line} ${w}` : w; if (c.measureText(tt).width > maxW && line) { out.push(line); line = w; } else line = tt; }
    out.push(line); return out;
  };
  // papel de parede com rabiscos discretos (determinístico)
  const wall = document.createElement('canvas'); wall.width = cw; wall.height = ch;
  {
    const x = wall.getContext('2d');
    x.fillStyle = '#0b141a'; x.fillRect(0, 0, cw, ch);
    x.strokeStyle = 'rgba(255,255,255,0.05)'; x.lineWidth = 0.5 * u;
    for (let i = 0; i < 90; i++) {
      const px = ((i * 37) % 100) * u, py = ((i * 53) % 200) * u, r = (1.6 + (i % 4)) * u;
      x.beginPath();
      if (i % 3 === 0) x.arc(px, py, r, 0, Math.PI * 2);
      else if (i % 3 === 1) { x.moveTo(px - r, py); x.lineTo(px + r, py - r); x.lineTo(px + r, py + r); x.closePath(); }
      else x.rect(px - r / 2, py - r / 2, r, r);
      x.stroke();
    }
  }
  const draw = (t, shown, typed) => {
    const w = cw, h = ch;
    c.drawImage(wall, 0, 0);
    // barra de status + cabeçalho
    c.fillStyle = '#1f2c34'; c.fillRect(0, 0, w, 25 * u);
    txt(clock(t), 6 * u, 4 * u, 4.2 * u, '#e9edef', {weight: 'bold'});
    c.strokeStyle = '#e9edef'; c.lineWidth = 0.5 * u; c.strokeRect(w - 14 * u, 2.4 * u, 8 * u, 3.4 * u);
    c.fillStyle = battery < 0.2 ? '#f15c6d' : '#e9edef'; c.fillRect(w - 13.3 * u, 3 * u, 6.6 * u * battery, 2.2 * u);
    txt('‹', 2.5 * u, 15.2 * u, 10 * u, '#e9edef');
    c.fillStyle = contact.color; c.beginPath(); c.arc(14.5 * u, 15.5 * u, 5.4 * u, 0, Math.PI * 2); c.fill();
    txt(contact.initial ?? contact.name[0], 14.5 * u, 15.7 * u, 5 * u, '#fff', {align: 'center', weight: 'bold'});
    c.font = font(5.6 * u, 'bold'); let nm = contact.name; while (c.measureText(nm).width > 46 * u) nm = nm.slice(0, -1);
    txt(nm, 23 * u, 13 * u, 5.6 * u, '#e9edef', {weight: 'bold'});
    c.font = font(3.6 * u); let mb = members; while (c.measureText(mb).width > 46 * u) mb = mb.slice(0, -1);
    txt(mb, 23 * u, 18.8 * u, 3.6 * u, '#8696a0');
    c.strokeStyle = '#e9edef'; c.lineWidth = 0.6 * u;
    rr(c, 73 * u, 13.2 * u, 6 * u, 4.6 * u, 0.8 * u); c.stroke();
    c.beginPath(); c.moveTo(79 * u, 15.5 * u); c.lineTo(81.5 * u, 13.8 * u); c.lineTo(81.5 * u, 17.2 * u); c.closePath(); c.stroke();
    c.beginPath(); c.arc(88.5 * u, 15.5 * u, 2.6 * u, Math.PI * 0.6, Math.PI * 1.9); c.stroke();
    c.fillStyle = '#e9edef';
    for (const dy of [-2, 0, 2]) { c.beginPath(); c.arc(96 * u, (15.5 + dy) * u, 0.55 * u, 0, Math.PI * 2); c.fill(); }
    // barra de digitação + microfone/enviar
    const by = h - 11 * u;
    rr(c, 3 * u, by, 79 * u, 8.4 * u, 4.2 * u); c.fillStyle = '#1f2c34'; c.fill();
    txt('☺', 7.5 * u, by + 4.3 * u, 4.8 * u, '#8696a0');
    if (typed) { c.font = font(4.4 * u); let s = typed; while (c.measureText(s).width > 52 * u) s = s.slice(1); txt(`${s}|`, 13 * u, by + 4.3 * u, 4.4 * u, '#e9edef'); }
    else txt('Mensagem', 13 * u, by + 4.3 * u, 4.2 * u, '#8696a0');
    c.fillStyle = '#00a884'; c.beginPath(); c.arc(91 * u, by + 4.2 * u, 4.6 * u, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#fff';
    if (typed) { c.beginPath(); c.moveTo(89 * u, by + 2 * u); c.lineTo(94 * u, by + 4.2 * u); c.lineTo(89 * u, by + 6.4 * u); c.closePath(); c.fill(); }
    else { rr(c, 89.9 * u, by + 1.6 * u, 2.2 * u, 3.6 * u, 1.1 * u); c.fill(); c.fillRect(90.8 * u, by + 5.4 * u, 0.4 * u, 1.4 * u); }
    // mensagens (de baixo para cima)
    let y = by - 3 * u;
    for (let i = shown.length - 1; i >= 0; i--) {
      const m = shown[i]; const me = m.from === 'me';
      const fs = 4.9 * u, lh = 6.2 * u, wgt = m.alert ? 'bold' : 'normal';
      c.font = font(fs, wgt);
      const lines = wrap(m.text, 62 * u);
      const lastW = c.measureText(lines[lines.length - 1]).width;
      const maxLine = Math.max(...lines.map((l) => c.measureText(l).width));
      const nameH = !me && m.who ? 5.6 * u : 0;
      c.font = font(4 * u, 'bold'); const nameW = m.who && !me ? c.measureText(m.who).width : 0;
      c.font = font(3.3 * u); const tw = c.measureText(m.time ?? '').width + (me ? 6 * u : 0);
      const extra = lastW + tw + 4 * u > 64 * u ? 4.5 * u : 0; // hora desce para baixo quando não cabe na última linha
      const bw = Math.min(80 * u, Math.max(nameW, maxLine, extra ? 0 : lastW + tw + 3 * u) + 7 * u);
      const bh = 3 * u + nameH + lines.length * lh + 1.5 * u + extra;
      y -= bh; if (y < 28 * u) break;
      const x = me ? w - 5 * u - bw : 5 * u;
      c.fillStyle = me ? '#005c4b' : m.alert ? '#4a1f26' : '#202c33';
      rr(c, x, y, bw, bh, 2.2 * u); c.fill();
      const prev = shown[i - 1];
      if (!prev || prev.from !== m.from || prev.who !== m.who) { // rabinho no primeiro balão da sequência
        c.beginPath();
        if (me) { c.moveTo(x + bw - 2 * u, y); c.lineTo(x + bw + 2.4 * u, y); c.lineTo(x + bw, y + 3 * u); }
        else { c.moveTo(x + 2 * u, y); c.lineTo(x - 2.4 * u, y); c.lineTo(x, y + 3 * u); }
        c.closePath(); c.fill();
      }
      if (m.alert && !me) { rr(c, x, y, bw, bh, 2.2 * u); c.strokeStyle = '#f15c6d'; c.lineWidth = 0.6 * u; c.stroke(); }
      if (nameH) txt(m.who, x + 3.5 * u, y + 5.2 * u, 4 * u, m.whoColor ?? '#53bdeb', {weight: 'bold'});
      let ty = y + 3 * u + nameH + lh / 2 - 0.4 * u;
      for (const l of lines) { txt(l, x + 3.5 * u, ty, fs, m.alert && !me ? '#ffd7dc' : '#e9edef', {weight: wgt}); ty += lh; }
      const tx = x + bw - 2.5 * u, tyy = y + bh - 2.6 * u;
      if (me) {
        c.strokeStyle = '#53bdeb'; c.lineWidth = 0.5 * u;
        for (const dx of [0, 1.3]) { c.beginPath(); c.moveTo(tx - 4.2 * u + dx * u, tyy); c.lineTo(tx - 3.3 * u + dx * u, tyy + 0.9 * u); c.lineTo(tx - 1.6 * u + dx * u, tyy - 1 * u); c.stroke(); }
        txt(m.time ?? '', tx - 5.6 * u, tyy, 3.3 * u, '#9fc9be', {align: 'right'});
      } else txt(m.time ?? '', tx, tyy, 3.3 * u, '#8696a0', {align: 'right'});
      y -= 1.4 * u;
    }
  };
  let cur = '';
  const stateAt = (t) => {
    const shown = messages.filter((m) => t >= m.at);
    const typing = messages.find((m) => m.typeFrom != null && t >= m.typeFrom && t < m.at);
    const typed = typing ? typing.text.slice(0, Math.max(1, Math.round(typing.text.length * (t - typing.typeFrom) / (typing.at - typing.typeFrom)))) : '';
    return {shown, last: shown[shown.length - 1], typing, typed, online: true};
  };
  return {
    group: g,
    screen: face,
    stateAt,
    set(t) {
      const s = stateAt(t);
      const k = `${s.shown.length}|${s.typed}|${clock(t)}`;
      if (k !== cur) { draw(t, s.shown, s.typed); tex.needsUpdate = true; cur = k; }
    },
  };
}
