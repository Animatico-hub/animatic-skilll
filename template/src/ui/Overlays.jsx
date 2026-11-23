import React from 'react';
import {interpolate} from 'remotion';

// Avisos e mensagens na tela (Pacote 4, aprovado em 19/11/2026), no estilo aprovado.
const SANS = 'Arial, "Segoe UI", "Segoe UI Emoji", sans-serif';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};

/**
 * Alerta de emergência (celular/TV/alto-falante): retângulo vermelho no topo com ⚠.
 * lines: [{text, at?, big?}] — at = quando a linha aparece (sincronize com a voz que lê o alerta).
 */
export const AlertBanner = ({t, at, until = Infinity, label = 'ALERTA DE EMERGÊNCIA', lines}) => {
  const kin = interpolate(t, [at, at + 0.3], [0, 1], clamp);
  const kout = interpolate(t, [until - 0.3, until], [1, 0], clamp);
  const k = Math.min(kin, kout);
  if (k <= 0) return null;
  return (
    <div style={{position: 'absolute', top: 70, left: 44, right: 44, opacity: k, transform: `translateY(${(1 - kin) * -40}px)`,
      background: '#c8262d', border: '5px solid #2a0a0c', borderRadius: 26, padding: '20px 30px 24px',
      boxShadow: '0 12px 30px rgba(0,0,0,0.5)', fontFamily: SANS, color: '#fff'}}>
      <div style={{fontSize: 30, fontWeight: 900, letterSpacing: 2, opacity: 0.95}}>⚠ {label}</div>
      {lines.map((l, i) => (
        <div key={i} style={{opacity: l.at == null || t >= l.at ? 1 : 0, fontWeight: 900,
          fontSize: l.big ? 58 : 44, lineHeight: 1.12, marginTop: i ? 4 : 8}}>{l.text}</div>
      ))}
    </div>
  );
};

/**
 * Banner grande de mensagem (o mesmo da série). msg:
 *  {at, who, initial?, color, status (hora ou 'digitando...'), statusColor?, text, cursor?,
 *   reveal? (padrão true: palavras entram cinza e escurecem uma a uma), perWord?, readFrom?,
 *   warn? (linha vermelha, ex.: 'NÃO ABRE', que acende no fim da leitura), textColor?}
 */
export const MessageBanner = ({t, msg, until = Infinity}) => {
  if (t < msg.at || t >= until) return null;
  const k = interpolate(t, [msg.at, msg.at + 0.25], [0, 1], clamp);
  const words = msg.text.split(' ');
  const reveal = msg.reveal ?? true;
  const per = msg.perWord ?? 0.22;
  const from = msg.readFrom ?? msg.at + 0.35;
  const read = reveal ? Math.floor((t - from) / per) + 1 : words.length;
  const warnK = interpolate(t, [from + words.length * per, from + words.length * per + 0.3], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', top: 60, left: 50, right: 50, padding: '22px 32px', borderRadius: 30,
      background: '#fbfaf5', boxShadow: '0 12px 30px rgba(0,0,0,0.45)', border: '5px solid #111',
      transform: `translateY(${(1 - k) * -20}px)`, opacity: Math.max(0.7, k), fontFamily: SANS}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <div style={{width: 54, height: 54, borderRadius: 27, background: msg.color ?? '#2b6fd6', color: '#fff',
          fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{msg.initial ?? msg.who[0]}</div>
        <div style={{fontWeight: 900, fontSize: 38, color: '#111'}}>{msg.who}</div>
        <div style={{marginLeft: 'auto', fontSize: 30, fontWeight: 700, color: msg.statusColor ?? '#d63a3a'}}>{msg.status}</div>
      </div>
      <div style={{marginTop: 14, fontSize: 50, lineHeight: 1.12, fontWeight: 900}}>
        {words.map((w, i) => <span key={i} style={{color: i < read ? (msg.textColor ?? '#111') : '#b9bcc4'}}>{w} </span>)}
        {msg.cursor && '|'}
      </div>
      {msg.warn && (
        <div style={{marginTop: 6, fontSize: 50, fontWeight: 900, color: '#d63a3a', opacity: reveal ? 0.3 + 0.7 * warnK : 1}}>{msg.warn}</div>
      )}
    </div>
  );
};
