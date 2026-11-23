import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';

// Formato de série (Pacote 1, aprovado em 19/11/2026): HUD fixo, selo "VOCÊ ESCOLHEU", 0,3 s de preto,
// cartela "PARTE N+1 · VOCÊ DECIDE" com a cena viva em cinza por trás, e overlay de capa com a escolha.
// Uso rápido: <SeriesLayer t={t} serie={SERIE} endAt={END_CARD} hideHud={inClose(t)} /> por cima do canvas,
// e no canvas: style={{filter: endCardFilter(t, END_CARD)}}.
export const FONT = '"Arial Black", "Arial Bold", sans-serif';
export const SANS = 'Arial, "Segoe UI", sans-serif';
export const stroke = (px, c = '#111') => ({WebkitTextStroke: `${px}px ${c}`, paintOrder: 'stroke fill'});
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const ease = (x) => 1 - Math.pow(1 - x, 3);

/*
 * Configuração da série (uma por episódio):
 * {
 *   name: 'Minha Série', part: 4,
 *   place: 'SALA 7', clockStart: '14:52', clockSpeed: 1,   // relógio da história anda com o vídeo
 *   chose: {icon: '🤫', label: 'FICAR EM SILÊNCIO'},        // null na parte 1 (sem selo)
 *   a: {color: '#2e9e5b', icon: '🚪', label: 'SAIR DA SALA'},
 *   b: {color: '#d8343a', icon: '✋', label: 'ESPERAR'},
 * }
 */

// relógio da história: "14:52" + tempo do vídeo × speed
export const storyClock = (start, t, speed = 1) => {
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + Math.floor((t * speed) / 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// HUD fixo no canto superior esquerdo: "LOCAL · HORA" + "Série · Parte N" (some com hidden, ex.: celular em close).
// top 150: abaixo dos 7% de cima, que as abas do TikTok/Reels cobrem (QA, Pacote 6).
export const SeriesHud = ({t, place, clock, series, part, hidden = false, until = Infinity}) => {
  const o = hidden ? 0 : interpolate(t, [0.05, 0.35, until - 0.4, until], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 150, left: 56, opacity: o, fontFamily: SANS, textShadow: '0 2px 6px rgba(0,0,0,0.85)',
      ...stroke(6)}}>
      <div style={{fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: 0.5}}>
        {place} <span style={{opacity: 0.8}}>·</span> {clock}
      </div>
      <div style={{fontSize: 31, fontWeight: 800, color: '#ffd43b', marginTop: 2}}>{series} · Parte {part}</div>
    </div>
  );
};

// Selo "VOCÊ ESCOLHEU" (parte 2+): pílula vermelha no topo, ~0,45 s a 3 s
export const ChoiceBadge = ({t, icon, label, from = 0.45, to = 3.0, color = '#d8343a'}) => {
  const kin = ease(interpolate(t, [from, from + 0.3], [0, 1], clamp));
  const kout = interpolate(t, [to - 0.3, to], [1, 0], clamp);
  const k = Math.min(kin, kout);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 262, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: k}}>
      <div style={{transform: `scale(${0.85 + 0.15 * kin})`, background: color, border: '6px solid #111', borderRadius: 30,
        padding: '10px 40px 16px', boxShadow: '0 10px 0 rgba(0,0,0,0.45)', textAlign: 'center', fontFamily: FONT, color: '#fff'}}>
        <div style={{fontSize: 26, letterSpacing: 4, opacity: 0.92, fontFamily: SANS, fontWeight: 900}}>VOCÊ ESCOLHEU</div>
        <div style={{fontSize: 60, lineHeight: 1.05, display: 'flex', alignItems: 'center', gap: 16, ...stroke(6, '#5a0c10')}}>
          <span style={{fontSize: 50}}>{icon}</span>{label}
        </div>
      </div>
    </div>
  );
};

// 0,3 s de tela preta antes da cartela (cobre [at - dur, at))
export const BlackCut = ({t, at, dur = 0.3}) => (t >= at - dur && t < at ? <AbsoluteFill style={{background: '#000'}} /> : null);

// filtro do canvas a partir da cartela: a cena continua animando, em cinza, escura e levemente desfocada
export const endCardFilter = (t, at) => {
  const k = interpolate(t, [at, at + 0.35], [0, 1], clamp);
  return k > 0 ? `grayscale(${0.85 * k}) brightness(${1 - 0.55 * k}) blur(${5 * k}px)` : 'none';
};

const BTN_W = 760;
const Button = ({t, at, color, icon, label, pulsePhase = 0}) => {
  const k = ease(interpolate(t, [at, at + 0.45], [0, 1], clamp)); // entra suave, sem "pop" (pedido do usuário)
  const pulse = 1.015 + 0.015 * Math.sin((t - at) * Math.PI * 1.6 + pulsePhase); // 1,00–1,03
  // 760 px (x 160–920): fora da coluna de botões curtir/comentar à direita (QA, Pacote 6). Sempre 1 linha:
  // a fonte diminui com o tamanho do texto (opções de 1–3 palavras; Arial Black ≈ 0,74 em por letra maiúscula).
  const size = Math.round(Math.min(56, 560 / (label.length * 0.74)));
  return (
    <div style={{opacity: k, width: BTN_W, margin: '0 auto', transform: `translateY(${(1 - k) * 24}px) scale(${k >= 1 ? pulse : 1})`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 24, padding: '28px 30px', borderRadius: 30, background: color,
        border: '6px solid #111', boxShadow: '0 12px 0 rgba(0,0,0,0.45)', fontFamily: FONT, fontSize: size, color: '#fff',
        whiteSpace: 'nowrap', overflow: 'hidden', ...stroke(7)}}>
        <span style={{width: 78, height: 78, flex: 'none', borderRadius: 18, background: 'rgba(0,0,0,0.22)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: 48, WebkitTextStroke: 0}}>{icon}</span>
        {label}
      </div>
    </div>
  );
};

// Cartela final: "PARTE N+1 · VOCÊ DECIDE" + "O QUE VOCÊ FARIA?" + 2 botões com ícone + "Comenta abaixo ↓" (manter ≥ 3 s)
export const EndCardV2 = ({t, at, nextPart, a, b}) => {
  const k = interpolate(t, [at, at + 0.35], [0, 1], clamp);
  if (k <= 0) return null;
  const or = interpolate(t, [at + 1.2, at + 1.5], [0, 1], clamp);
  const cta = interpolate(t, [at + 2.0, at + 2.4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(8,10,16,${0.25 * k})`}}>
      <div style={{opacity: k, fontFamily: SANS, fontWeight: 900, fontSize: 34, letterSpacing: 7, color: '#ffd43b',
        textShadow: '0 2px 6px rgba(0,0,0,0.8)', marginBottom: 14}}>PARTE {nextPart} · VOCÊ DECIDE</div>
      <div style={{opacity: k, fontFamily: FONT, fontSize: 108, lineHeight: 1.02, color: '#fff', textAlign: 'center',
        marginBottom: 54, ...stroke(16)}}>O QUE VOCÊ<br />FARIA?</div>
      <Button t={t} at={at + 0.6} {...a} />
      <div style={{opacity: or, fontFamily: FONT, fontSize: 54, color: '#ffd43b', margin: '28px 0', ...stroke(10)}}>OU</div>
      <Button t={t} at={at + 1.2} pulsePhase={Math.PI} {...b} />
      <div style={{opacity: cta, marginTop: 60, fontFamily: FONT, fontSize: 48, color: '#fff', ...stroke(9)}}>Comenta abaixo ↓</div>
    </AbsoluteFill>
  );
};

// Tudo junto, por cima do canvas. Legendas devem parar em endAt - 0.3 (antes do preto).
export const SeriesLayer = ({t, serie, endAt, hideHud = false}) => (
  <>
    <SeriesHud t={t} place={serie.place} clock={storyClock(serie.clockStart, t, serie.clockSpeed ?? 1)}
      series={serie.name} part={serie.part} hidden={hideHud} until={endAt - 0.3} />
    {serie.chose && <ChoiceBadge t={t} icon={serie.chose.icon} label={serie.chose.label} />}
    <EndCardV2 t={t} at={endAt} nextPart={serie.part + 1} a={serie.a} b={serie.b} />
    <BlackCut t={t} at={endAt} />
  </>
);

// Overlay de capa (parte 2+; a parte 1 não leva capa): nome da série + pílula PARTE N + gancho + faixa "A OU B?".
// Use por cima de um canvas com uma cena nova (não um frame do vídeo). Palavra entre *asteriscos* fica vermelha.
export const CoverOverlay = ({serie, hook, choice}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.65) 100%)'}} />
    <AbsoluteFill style={{background: 'linear-gradient(rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)'}} />
    <div style={{position: 'absolute', top: 260, left: 0, right: 0, textAlign: 'center', fontFamily: FONT}}>
      <div style={{fontSize: 58, color: '#fff', letterSpacing: 4, ...stroke(10)}}>{serie.name.toUpperCase()}</div>
      <div style={{display: 'inline-block', marginTop: 10, padding: '6px 44px 14px', background: '#ffe04a', border: '8px solid #111',
        borderRadius: 26, transform: 'rotate(-3deg)', boxShadow: '0 12px 0 rgba(0,0,0,0.5)'}}>
        <span style={{fontSize: 150, color: '#111', lineHeight: 1}}>PARTE {serie.part}</span>
      </div>
    </div>
    {/* gancho ancorado por baixo: cresce para cima e nunca cobre a faixa da escolha */}
    <div style={{position: 'absolute', left: 40, right: 40, bottom: choice ? 270 : 150, textAlign: 'center', fontFamily: FONT,
      fontSize: 122, lineHeight: 1.02, color: '#fff', ...stroke(20), transform: 'rotate(-2deg)'}}>
      {hook.map((l, i) => (
        <div key={i}>{l.split(/(\*[^*]+\*)/).map((p, j) => p.startsWith('*')
          ? <span key={j} style={{color: '#ff3b30'}}>{p.slice(1, -1)}</span> : <span key={j}>{p}</span>)}</div>
      ))}
    </div>
    {choice && (
      <div style={{position: 'absolute', top: 1690, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{background: '#111', color: '#fff', fontFamily: FONT, fontSize: 56, padding: '12px 34px 16px',
          borderRadius: 14, letterSpacing: 1, boxShadow: '0 8px 0 rgba(0,0,0,0.4)'}}>
          {choice[0]} <span style={{fontFamily: SANS, fontWeight: 900, color: '#ffd43b'}}>OU</span> {choice[1]}?
        </div>
      </div>
    )}
  </AbsoluteFill>
);
