// Prepara os sons livres baixados (public/raw/livres) (exemplo real de preparo de chuva, trovão, alerta e torcida).
// Fontes e licenças: ver public/raw/livres/CREDITOS.txt. Saída em public/sfx/livre_*.wav (48 kHz).
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const R = 'public/raw/livres', O = 'public/sfx';
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);

// TROVÕES (tempestade.ogg, domínio público): estalo forte (pico 228,3 s) e dois distantes (22,4 s e 138,7 s)
const trovao = (src, a, b, out, extra = '') =>
  ff('-ss', String(a), '-to', String(b), '-i', `${R}/${src}`, '-af',
    `afade=t=in:d=0.05,afade=t=out:st=${(b - a - 1.2).toFixed(2)}:d=1.2${extra}`, '-ar', '48000', '-ac', '2', `${O}/${out}`);
trovao('tempestade.ogg', 226.9, 234.5, 'livre_trovao_forte.wav');                           // estalo chega ~1,0 s depois do início
trovao('tempestade.ogg', 21.0, 27.5, 'livre_trovao_longe1.wav', ',lowpass=f=900');
trovao('tempestade.ogg', 137.3, 143.8, 'livre_trovao_longe2.wav', ',lowpass=f=700');

// CHUVA NA JANELA (domínio público): fundo contínuo do quarto
ff('-i', `${R}/chuva_janela.ogg`, '-af', 'highpass=f=80,afade=t=in:d=0.5', '-ar', '48000', '-ac', '2', `${O}/livre_chuva.wav`);

// ALERTA DE CELULAR (Cell Broadcast, domínio público): 4 celulares quase juntos (o seu e o dos 3 amigos)
ff('-t', '5.4', '-i', `${R}/alerta_celular.oga`, '-filter_complex',
  '[0]asplit=4[a][b][c][d];[b]adelay=90|90,volume=0.7,highpass=f=300[b2];[c]adelay=210|210,volume=0.55,lowpass=f=5000[c2];' +
  '[d]adelay=330|330,volume=0.45,highpass=f=500[d2];[a][b2][c2][d2]amix=inputs=4:normalize=0,volume=0.6,afade=t=out:st=4.9:d=0.5',
  '-ar', '48000', '-ac', '2', `${O}/livre_alerta.wav`);

// TORCIDA NA TV (Freesound CC0), v2 (pedido do usuário: mais curta, mais baixa e soando como TV):
// lance de ataque ("Chance", 22–24,6 s) -> explosão do gol ("Crowd Cheer", só ~4 s, some até 7 s) -> murmúrio baixo do estádio
// (−16 dB) até o apagão. "Alto-falante de TV": mono, faixa estreita (320 Hz–4 kHz), médio realçado, compressão,
// leve saturação e o reflexo do quarto (o som bate na parede e volta).
ff('-ss', '22.0', '-t', '2.9', '-i', `${R}/torcida_chance_189823.wav`,
  '-ss', '1.0', '-t', '6.0', '-i', `${R}/crowd_cheer_397434.wav`,
  '-ss', '0', '-t', '16', '-i', `${R}/torcida_chance_189823.wav`, '-filter_complex',
  '[0]afade=t=out:st=2.2:d=0.6,aresample=48000[lance];' +
  '[1]adelay=1500|1500,volume=0.85,afade=t=out:st=4.0:d=2.6,aresample=48000[gol];' +
  '[2]adelay=6000|6000,volume=0.16,afade=t=in:st=6.0:d=1.5,aresample=48000[amb];' +
  '[lance][gol][amb]amix=inputs=3:normalize=0:duration=longest,pan=mono|c0=0.5*c0+0.5*c1,' +
  'highpass=f=320,lowpass=f=4000,equalizer=f=1700:t=q:w=1.1:g=5,acompressor=threshold=0.08:ratio=4:attack=5:release=80,' +
  'acrusher=bits=12:mode=log:mix=0.15,aecho=0.8:0.55:22|48|95:0.32|0.2|0.1,lowpass=f=3600,atrim=0:21.8',
  '-ac', '2', `${O}/livre_torcida_tv.wav`);

// TENSÃO na batida (pedido do usuário, "bem de leve"): grave seco no TOC (sub 48 Hz caindo) + drone baixo que fica por baixo
// da conversa na porta. Sintetizados.
ff('-f', 'lavfi', '-i', 'sine=f=48:d=2.2:sample_rate=48000', '-f', 'lavfi', '-i', 'sine=f=96:d=2.2:sample_rate=48000', '-filter_complex',
  "[0]volume='0.9*exp(-2.2*t)':eval=frame[a];[1]volume='0.25*exp(-4*t)':eval=frame[b];[a][b]amix=inputs=2:normalize=0,afade=t=out:st=1.8:d=0.4",
  '-ac', '2', `${O}/tensao_hit.wav`);
ff('-f', 'lavfi', '-i', 'sine=f=55:d=40:sample_rate=48000', '-f', 'lavfi', '-i', 'sine=f=82.4:d=40:sample_rate=48000',
  '-f', 'lavfi', '-i', 'anoisesrc=d=40:c=brown:a=0.3:r=48000:s=3', '-filter_complex',
  '[0]volume=0.5[a];[1]volume=0.22,tremolo=f=0.17:d=0.6[b];[2]lowpass=f=180,volume=0.6[c];' +
  '[a][b][c]amix=inputs=3:normalize=0,tremolo=f=0.11:d=0.35,afade=t=in:d=2.5,afade=t=out:st=38:d=2',
  '-ac', '2', `${O}/tensao_drone.wav`);

writeFileSync(`${R}/CREDITOS.txt`, [
  'Sons livres usados (baixados em 20/11/2026)',
  '- Rain against the window.ogg — Wikimedia Commons — domínio público',
  '- Thunderstorm after hot summer day 17 minutes 02 of 04.ogg — Wikimedia Commons — domínio público',
  '- Rain and thunder.ogg — Wikimedia Commons — domínio público',
  '- Cell Broadcast Alert Tone.oga — Wikimedia Commons — domínio público',
  '- "Chance" (189823) por blaukreuz — Freesound — CC0',
  '- "Crowd Cheer" (397434) por FoolBoyMedia — Freesound — CC0',
  '(CC0/domínio público: não exigem crédito; listado para controle.)', ''].join('\n'));
console.log('ok: livre_trovao_forte, livre_trovao_longe1/2, livre_chuva, livre_alerta, livre_torcida_tv');
