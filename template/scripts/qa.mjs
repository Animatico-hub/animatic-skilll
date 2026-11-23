// QA automático (Pacote 6, aprovado em 19/11/2026). Rodar depois do master, no vídeo final.
// Uso: npm run qa -- out/ep_final.mp4 [--serie] [--comp Composicao] [--pasta entregas/AAAA-MM-DD_parteN]
//                    [--sheet folha.jpg] [--cartela t]
// Mede: duração (série 40–50 s), quadro parado > 2 s, tela preta fora do lugar, cartela final >= 3 s (achada pelo
// preto de 0,3 s antes dela, ou --cartela t), volume −14 LUFS ±1, pico <= −1 dBTP, buracos de som > 0,4 s e,
// com --comp, se a cena roda validate() sem problemas. Gera a folha do "teste sem som": 1 quadro por segundo
// com as áreas que a interface do TikTok/Reels/Shorts cobre em vermelho (estimativa, não a medida exata de cada app).
// --pasta grava qa.txt e qa_semsom.jpg lá. Sai com código 1 se houver ERRO.
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fonteFFmpeg} from './sistema.mjs';

const args = process.argv.slice(2);
const WITH_VALUE = ['--comp', '--pasta', '--sheet', '--cartela'];
const inp = args.find((a, i) => !a.startsWith('--') && !WITH_VALUE.includes(args[i - 1]));
if (!inp) { console.error('uso: npm run qa -- video.mp4 [--serie] [--comp X] [--pasta dir] [--sheet f.jpg] [--cartela t]'); process.exit(2); }
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const serie = args.includes('--serie');
const pasta = opt('--pasta');
if (pasta) mkdirSync(pasta, {recursive: true});
const sheet = opt('--sheet') ?? (pasta ? join(pasta, 'qa_semsom.jpg') : null);

const ff = (a) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...a], {encoding: 'utf8', maxBuffer: 1 << 26}).stderr;
const probe = (a) => spawnSync('ffprobe', ['-v', 'error', ...a, inp], {encoding: 'utf8'}).stdout.trim();

const dur = Number(probe(['-show_entries', 'format=duration', '-of', 'csv=p=0']));
const hasAudio = probe(['-select_streams', 'a', '-show_entries', 'stream=index', '-of', 'csv=p=0']) !== '';
const V = '[0:v]scale=270:-2,freezedetect=n=0.003:d=2,blackdetect=d=0.15:pix_th=0.12:pic_th=0.95[v]';
const se = ff(['-i', inp, '-filter_complex', hasAudio ? `${V};[0:a]ebur128=peak=true,silencedetect=n=-40dB:d=0.4[a]` : V,
  '-map', '[v]', ...(hasAudio ? ['-map', '[a]'] : []), '-f', 'null', '-']);
const num = (re) => [...se.matchAll(re)].map((m) => m.slice(1).map(Number));
const freezes = num(/freeze_start: ([\d.]+)[\s\S]*?freeze_duration: ([\d.]+)/g);
const blacks = num(/black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)/g);
const holes = num(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g);
const I = Number((se.match(/I:\s+(-?[\d.]+) LUFS/g) || ['I: -70']).pop().match(/-?[\d.]+/)[0]);
const TP = Number((se.match(/Peak:\s+(-?[\d.]+) dBFS/g) || ['Peak: 0']).pop().match(/-?[\d.]+/)[0]);

// cartela = depois do último preto curto nos 12 s finais (o BlackCut de 0,3 s)
const lastBlack = blacks.filter(([a, b]) => a > dur - 12 && b - a < 1.2).pop();
const cartelaAt = opt('--cartela');
const card = cartelaAt != null ? dur - Number(cartelaAt) : lastBlack ? dur - lastBlack[1] : null;

// validate() da cena: renderiza o frame 0 e lê a linha "[validação] ..." do log
let valid = null;
const comp = opt('--comp');
if (comp) {
  const r = spawnSync(`npx remotion still ${comp} out/qa_frame0.png --frame=0 --scale=0.25 --log=verbose`,
    {encoding: 'utf8', shell: true, maxBuffer: 1 << 26});
  const lines = ((r.stdout || '') + (r.stderr || '')).split(/\r?\n/).filter((l) => /\[valida/.test(l) && !l.includes('CONSOLE'));
  valid = lines.length ? lines[lines.length - 1].replace(/^.*?\[valida\S*\]/, '').trim() || 'OK' : '';
}

const out = [];
const line = (tag, txt) => out.push(`${tag.padEnd(5)} ${txt}`);
const ok = (cond, txt) => line(cond ? 'OK' : 'ERRO', txt);
const warn = (cond, txt) => line(cond ? 'OK' : 'AVISO', txt);
const list = (xs, f, max = 8) => xs.slice(0, max).map(f).join(', ') + (xs.length > max ? ` +${xs.length - max}` : '');

if (valid !== null) {
  if (valid === '' || /^AVISO/.test(valid)) line('AVISO', 'posicionamento/braços: a cena não roda validate()');
  else ok(/^OK/.test(valid), `posicionamento/braços (validate): ${valid}`);
}
if (serie) warn(dur >= 38 && dur <= 52, `duração ${dur.toFixed(1)} s (série: 40–50 s)`);
else line('---', `duração ${dur.toFixed(1)} s`);
ok(!freezes.length, `quadro parado > 2 s: ${freezes.length ? list(freezes, ([a, d]) => `${a.toFixed(1)} s (${d.toFixed(1)} s)`) : 'nenhum'}`);
const otherBlacks = blacks.filter((b) => b !== lastBlack && b[2] > 0.5);
warn(!otherBlacks.length, `tela preta > 0,5 s fora da cartela: ${otherBlacks.length ? list(otherBlacks, ([a, , d]) => `${a.toFixed(1)} s (${d.toFixed(1)} s)`) : 'nenhuma'}`);
if (serie) ok(card != null && card >= 3, `cartela final: ${card != null ? `${card.toFixed(1)} s` : 'não achei o preto antes dela (use --cartela t)'} (mín. 3 s)`);
if (!hasAudio) line('ERRO', 'vídeo sem áudio');
else {
  ok(Math.abs(I + 14) <= 1, `volume ${I.toFixed(1)} LUFS (alvo −14 ±1)${I < -60 ? ' — vídeo mudo' : ''}`);
  if (I >= -60) warn(TP <= -1, `pico ${TP.toFixed(1)} dBTP (máx. −1)`);
  ok(!holes.length, `buracos de som > 0,4 s: ${holes.length ? list(holes, ([a, d]) => `${a.toFixed(1)} s (${d.toFixed(1)})`) : 'nenhum'}`);
}

if (sheet) {
  const step = dur <= 60 ? 1 : 2;
  const cols = 8, rows = Math.ceil((Math.floor(dur / step) + 1) / cols);
  const zones = [
    'drawbox=x=0:y=0:w=iw:h=ih*0.07:color=red@0.28:t=fill',                  // topo: abas / status
    'drawbox=x=0:y=ih*0.80:w=iw:h=ih*0.20:color=red@0.28:t=fill',            // legenda do post / @usuário
    'drawbox=x=iw*0.86:y=ih*0.38:w=iw*0.14:h=ih*0.42:color=red@0.28:t=fill', // botões curtir/comentar
  ].join(',');
  ff(['-y', '-i', inp, '-vf',
    `fps=1/${step},scale=216:384,${zones},drawtext=fontfile='${fonteFFmpeg('bold')}':text='%{eif\\:t\\:d} s':x=6:y=h-26:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.6,tile=${cols}x${rows}:padding=4:color=black`,
    '-frames:v', '1', sheet]);
  line('---', `teste sem som: ${sheet} (leia só as legendas; nada importante nas áreas vermelhas)`);
}

const report = [`[qa] ${inp}`, ...out.map((l) => `  ${l}`)].join('\n');
console.log(report);
if (pasta) writeFileSync(join(pasta, 'qa.txt'), report + '\n', 'utf8');
process.exit(out.some((l) => l.startsWith('ERRO')) ? 1 : 0);
