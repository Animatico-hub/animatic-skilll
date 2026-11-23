// Mixagem do episódio (Pacote 5, aprovado em 19/11/2026). Regras medidas nas referências (references/audio.md):
// - o som NUNCA cai em buraco: fundo contínuo (drone, não música) que baixa ~8 dB embaixo das falas e volta depois;
// - "respiro" (drops): o fundo some por ~0,5 s antes de uma revelação — não é silêncio total;
// - cartela: sobe + grave forte (grave_cartela.wav em endAt − 1 s) e o fundo sai;
// - abafar (debaixo d'água, atrás de parede) é feito no master: scripts/master.mjs --abafar a-b;
// - volume final −14 LUFS também no master.
import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const lerpKeys = (t, keys) => {
  if (!keys?.length) return 1;
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) { const [t0, v0] = keys[i - 1]; return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1)); }
  }
  return keys[keys.length - 1][1];
};
/** 0..1: quanto alguém está falando em t (sobe 0,15 s antes, solta 0,4 s depois) */
export const speechAt = (t, lines) => {
  let g = 0;
  for (const l of lines) g = Math.max(g, Math.min(clamp01((t - l.start + 0.15) / 0.15), clamp01((l.end + 0.4 - t) / 0.4)));
  return g;
};
const dropAt = (t, drops) => {
  let g = 1;
  for (const [a, b] of drops) g = Math.min(g, 1 - Math.min(clamp01((t - a + 0.2) / 0.2), clamp01((b + 0.15 - t) / 0.15)));
  return g;
};
const edges = (t, from, until, fin, fout) =>
  Math.min(fin > 0 ? clamp01((t - from) / fin) : 1, fout > 0 ? clamp01((until - t) / fout) : 1);

/**
 * lines  falas [{file, audioAt?, start, end}] (as mesmas de Captions; sem file = só conta para o ducking)
 * sfx    [{file, at, vol=1, dur?, fade=0.08}] — dur corta o som (com fade curto, sem estalo)
 * loops  [{file, from, until, vol=1, fadeIn=0.3, fadeOut=0.3, keys?}] — fogo, chuva, água, respiração; keys = [[t, ganho]]
 * bed    {file='sfx/drone.wav', vol=0.45, duck=0.6, from=0} — fundo contínuo; bed={null} desliga
 * heart  [[t, vol]] — coração em loop seguindo a tensão
 * drops  [[t0, t1]] — respiros (fundo some)
 * endAt  início da cartela: grave_cartela em endAt − 1 s; fundo sai em 0,4 s
 */
export const SoundMix = ({lines = [], sfx = [], loops = [], bed = {}, heart, drops = [], endAt}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const total = durationInFrames / fps;
  const F = (s) => Math.max(0, Math.round(s * fps));
  const B = bed && {file: 'sfx/drone.wav', vol: 0.45, duck: 0.6, from: 0, ...bed};
  const bedEnd = endAt != null ? endAt + 0.4 : total;
  return (
    <>
      {B && (
        <Sequence from={F(B.from)} durationInFrames={F(bedEnd - B.from)} layout="none">
          <Audio src={staticFile(B.file)} loop volume={(f) => {
            const t = B.from + f / fps;
            return B.vol * (1 - B.duck * speechAt(t, lines)) * dropAt(t, drops) * edges(t, B.from, bedEnd, 1.0, 0.4);
          }} />
        </Sequence>
      )}
      {heart && (
        <Audio src={staticFile('sfx/coracao.mp3')} loop volume={(f) => clamp01(lerpKeys(f / fps, heart))} />
      )}
      {loops.map((l, i) => (
        <Sequence key={`loop${i}`} from={F(l.from)} durationInFrames={F(l.until - l.from)} layout="none">
          <Audio src={staticFile(l.file)} loop volume={(f) => {
            const t = l.from + f / fps;
            return clamp01((l.vol ?? 1) * lerpKeys(t, l.keys) * edges(t, l.from, l.until, l.fadeIn ?? 0.3, l.fadeOut ?? 0.3));
          }} />
        </Sequence>
      ))}
      {lines.filter((l) => l.file).map((l, i) => (
        <Sequence key={`fala${i}`} from={F(l.audioAt ?? l.start)} layout="none">
          <Audio src={staticFile(l.file)} />
        </Sequence>
      ))}
      {sfx.map((s, i) => (
        <Sequence key={`sfx${i}`} from={F(s.at)} durationInFrames={s.dur ? F(s.dur) : undefined} layout="none">
          <Audio src={staticFile(s.file)} volume={(f) => {
            const v = s.vol ?? 1;
            return s.dur ? v * clamp01((s.dur - f / fps) / (s.fade ?? 0.08)) : v;
          }} />
        </Sequence>
      ))}
      {endAt != null && (
        <Sequence from={F(endAt - 1)} layout="none">
          <Audio src={staticFile('sfx/grave_cartela.wav')} volume={0.9} />
        </Sequence>
      )}
    </>
  );
};
