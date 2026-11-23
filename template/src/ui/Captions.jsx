import React from 'react';

// Legendas no estilo aprovado: blocos curtos (até 3 palavras) que aparecem inteiros,
// nunca antes da palavra ser falada; cor por personagem; itálico para voz abafada/gravada.
const chunks = (line, max = 3) => {
  const out = [];
  for (let i = 0; i < line.words.length; i += max) {
    const ws = line.words.slice(i, i + max);
    out.push({speaker: line.speaker, words: ws, start: ws[0].start});
  }
  out.forEach((c, i) => { c.end = out[i + 1]?.start ?? line.end + 0.35; });
  return out;
};

/**
 * tags: etiqueta acima da legenda para identificar QUEM está falando quando não dá para ver
 * (atrás da porta, alto-falante, celular, rádio). {speaker: 'ATRÁS DA PORTA · VOZ DA BIA'}
 * ou {speaker: {label, icon}} (ícone opcional). Regra do usuário: etiqueta só em falas, nunca em objetos.
 */
export const Captions = ({t, lines, colors = {}, italic = {}, top = '62%', tags = {}}) => {
  const c = lines.flatMap((l) => chunks(l)).find((k) => t >= k.start && t < k.end);
  if (!c) return null;
  const text = c.words.map((w) => w.raw).join(' '); // bloco inteiro aparece de uma vez
  const tag = tags[c.speaker];
  const tg = typeof tag === 'string' ? {label: tag} : tag;
  return (
    <div style={{position: 'absolute', top, left: 60, right: 60, textAlign: 'center'}}>
      {tg && (
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '4px 16px', borderRadius: 10,
          background: colors[c.speaker] ?? '#fff', border: '4px solid #111', fontFamily: '"Arial Black", sans-serif',
          fontSize: 30, color: '#111', letterSpacing: 1}}>{tg.icon && <span style={{fontSize: 28}}>{tg.icon}</span>}{tg.label}</div>
      )}
      {tg && <br />}
      <span style={{
        fontFamily: '"Arial Black", "Arial Bold", sans-serif',
        fontSize: 60,
        lineHeight: 1.1,
        color: colors[c.speaker] ?? '#fff',
        WebkitTextStroke: '11px #111',
        paintOrder: 'stroke fill',
        letterSpacing: -1,
        fontStyle: italic[c.speaker] ? 'italic' : 'normal',
      }}>{text}</span>
    </div>
  );
};
