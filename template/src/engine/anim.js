// Utilitários determinísticos (tudo é função do tempo t, em segundos).
import * as THREE from 'three';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;

/** Trilha de keyframes [[t, valor], ...] com ease in/out entre chaves. Valores numéricos ou arrays. */
export const track = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      const k = ease((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, j) => lerp(a, v1[j], k)) : lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
};

/**
 * Alvos que mudam com transição: [{t, target: Vector3|[x,y,z]}]. dur = tempo da transição.
 * Olhos usam dur curto (sacada), cabeça/câmera usam dur maior.
 */
export const targetAt = (t, keys, dur) => {
  const v = (p) => (p.isVector3 ? p : new THREE.Vector3(...p));
  let out = v(keys[0].target).clone();
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].t) break;
    out.lerp(v(keys[i].target), ease((t - keys[i].t) / (keys[i].dur ?? dur)));
  }
  return out;
};

/** Piscadas: lista de instantes. Retorna 0 (aberto) .. 1 (fechado). */
export const blinkAt = (t, times, len = 0.16) => {
  for (const b of times) {
    const u = (t - b) / len;
    if (u >= 0 && u <= 1) return Math.sin(Math.PI * u) ** 0.6;
  }
  return 0;
};

// ---------- Fala: texto -> sílabas cronometradas -> visemas ----------
const VOWELS = 'aáàâãeéêiíoóôõuú';
const vowelClass = (c) => ('aáàâã'.includes(c) ? 'A' : 'eéê'.includes(c) ? 'E' : 'ií'.includes(c) ? 'I' : 'oóôõ'.includes(c) ? 'O' : 'U');
// abertura, largura, arredondamento por visema
const VISEME = {A: [1, 1, 0], E: [0.65, 1.15, 0], I: [0.4, 1.25, 0], O: [0.8, 0.7, 1], U: [0.5, 0.6, 1]};

/**
 * Converte uma fala {text, start, end} em palavras e sílabas com tempos.
 * Sem áudio, é uma aproximação; com timestamps do ElevenLabs basta preencher words[].
 */
export const parseLine = (line) => {
  const words = line.text.split(/\s+/).filter(Boolean).map((raw) => {
    const clean = raw.toLowerCase().replace(/[^a-záàâãéêíóôõúç]/g, '');
    const syl = [];
    let i = 0;
    while (i < clean.length) {
      let j = i;
      while (j < clean.length && !VOWELS.includes(clean[j])) j++;
      if (j >= clean.length) break;
      const lipClose = /[mbp]/.test(clean.slice(i, j));
      const v = vowelClass(clean[j]);
      while (j < clean.length && VOWELS.includes(clean[j])) j++;
      syl.push({v, lipClose});
      i = j;
    }
    if (!syl.length) syl.push({v: 'E', lipClose: false});
    const pause = /\.\.\.|…/.test(raw) ? 0.35 : /[.!?]$/.test(raw) ? 0.25 : /,$/.test(raw) ? 0.15 : 0.03;
    return {raw, syl, pause};
  });
  const units = words.reduce((s, w) => s + w.syl.length + w.pause / 0.17, 0);
  const unit = (line.end - line.start) / units;
  let t = line.start;
  for (const w of words) {
    w.start = t;
    for (const s of w.syl) { s.start = t; s.end = t + unit; t += unit; }
    w.end = t;
    t += (w.pause / 0.17) * unit;
  }
  return {...line, words};
};

/** Estado da boca no tempo t: {open, wide, round} */
export const mouthAt = (t, lines) => {
  for (const line of lines) {
    if (t < line.start - 0.05 || t > line.end + 0.1) continue;
    for (const w of line.words) {
      if (t < w.start || t > w.end + 0.06) continue;
      for (const s of w.syl) {
        if (t < s.start || t > s.end + 0.06) continue;
        const u = clamp01((t - s.start) / (s.end - s.start));
        const [o, wd, rd] = VISEME[s.v];
        // consoante bilabial fecha a boca no início da sílaba
        const env = s.lipClose ? Math.max(0, Math.sin(Math.PI * clamp01((u - 0.2) / 0.8))) : 0.25 + 0.75 * Math.sin(Math.PI * u);
        return {open: o * env * (line.intensity ?? 1), wide: wd, round: rd};
      }
    }
  }
  return {open: 0, wide: 1, round: 0};
};
