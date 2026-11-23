// Efeitos de voz aprovados (vieram do projeto de séries anteriores do titular) + "submerso" (Pacote 5).
// Uso:  node scripts/voz.mjs <efeito> entrada.mp3 saida.wav
//       node scripts/voz.mjs lote.json        ([{"fx": "porta", "in": "public/voz/03.mp3", "out": "public/voz_fx/03.wav"}, ...])
// Antes do efeito a voz é nivelada (loudnorm −16 LUFS; sussurro −18), como nos episódios publicados.
import {execFileSync} from 'node:child_process';
import {readFileSync, mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

export const VOZ = {
  normal: '',
  sussurro: 'highpass=f=220,lowpass=f=8000,treble=g=3:f=4000,acompressor=threshold=0.1:ratio=3,volume=0.85',
  porta: 'lowpass=f=1500,highpass=f=120,aecho=0.8:0.55:25|60:0.25|0.12,volume=1.1',
  interna: 'highpass=f=160,acompressor=threshold=0.1:ratio=2.5,aecho=0.8:0.7:55:0.18,volume=0.95',
  radio: 'highpass=f=450,lowpass=f=2600,acrusher=bits=8:mode=log:mix=0.35,lowpass=f=1300,aecho=0.8:0.55:30|65:0.3|0.15,volume=0.7',
  distante: 'highpass=f=200,lowpass=f=750,aecho=0.8:0.7:110|230:0.4|0.25,volume=0.45',
  altofalante: 'highpass=f=450,lowpass=f=3800,equalizer=f=1800:t=q:w=1.2:g=7,acompressor=threshold=0.05:ratio=8:attack=2:release=60,acrusher=bits=11:mode=log:mix=0.2,flanger=delay=1.5:depth=1:regen=0:width=40:speed=0.3,aecho=0.8:0.55:70|140:0.3|0.15,loudnorm=I=-14:TP=-1.5:LRA=7',
  // debaixo d'água: corta acima de ~600 Hz (como medido na referência do tsunami) + reflexo curto
  submerso: 'lowpass=f=600,lowpass=f=600,aecho=0.8:0.6:40|90:0.3|0.15,volume=1.6',
};

export function aplicarVoz(fx, entrada, saida) {
  if (!(fx in VOZ)) throw new Error(`efeito "${fx}" não existe: ${Object.keys(VOZ).join(', ')}`);
  const nivel = `loudnorm=I=${fx === 'sussurro' ? -18 : -16}:TP=-1.5:LRA=11`;
  mkdirSync(dirname(saida), {recursive: true});
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', entrada, '-af', [nivel, VOZ[fx]].filter(Boolean).join(','), '-ar', '48000', saida]);
  console.log(`${fx}: ${entrada} -> ${saida}`);
}

const [a, b, c] = process.argv.slice(2);
if (a?.endsWith('.json')) for (const j of JSON.parse(readFileSync(a, 'utf8'))) aplicarVoz(j.fx, j.in, j.out);
else if (a && b && c) aplicarVoz(a, b, c);
else console.log(`uso: node scripts/voz.mjs <${Object.keys(VOZ).join('|')}> entrada saida  |  node scripts/voz.mjs lote.json`);
