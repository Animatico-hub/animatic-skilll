// Master do áudio depois do render (Pacote 5): abafar trechos + volume final −14 LUFS + checagem de buracos.
// Uso: node scripts/master.mjs out/ep.mp4 out/ep_final.mp4 [--abafar 12-16,20.5-26] [--hz 600]
//  --abafar  trechos em que TUDO soa abafado (debaixo d'água, atrás de parede); entra/sai em 0,15 s
//  --hz      corte do abafado (padrão 600 Hz, medido na referência do tsunami)
// No fim, lista buracos de som (> 0,4 s abaixo de −40 dB) — as referências não têm nenhum.
import {spawnSync} from 'node:child_process';
import {writeFileSync, mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const args = process.argv.slice(2);
const [inp, out] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!inp || !out) { console.log('uso: node scripts/master.mjs entrada.mp4 saida.mp4 [--abafar a-b,c-d] [--hz 600]'); process.exit(1); }
const hz = Number(opt('hz', 600));
const trechos = (opt('abafar', '') || '').split(',').filter(Boolean).map((s) => s.split('-').map(Number));
const R = 0.15;
const k = trechos.length
  ? trechos.map(([a, b]) => `min(clip((t-${a - R / 2})/${R},0,1),clip((${b + R / 2}-t)/${R},0,1))`).join('+')
  : '0';
const base = trechos.length
  ? `[0:a]asplit[d][w];[w]lowpass=f=${hz},lowpass=f=${hz},volume='1.4*(${k})':eval=frame[l];` +
    `[d]volume='1-(${k})':eval=frame[s];[s][l]amix=inputs=2:normalize=0[m]`
  : '[0:a]anull[m]';

const ff = (fc, extra) => {
  const dir = mkdtempSync(join(tmpdir(), 'master-'));
  const f = join(dir, 'fc.txt'); writeFileSync(f, fc);
  return spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-y', '-i', inp, '-/filter_complex', f, ...extra], {encoding: 'utf8'});
};
// passo 1: medir
const m = ff(`${base};[m]loudnorm=I=-14:TP=-1.8:LRA=7:print_format=json[o]`, ['-map', '[o]', '-f', 'null', '-']);
const j = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
// passo 2: aplicar (linear)
const ln = `loudnorm=I=-14:TP=-1.8:LRA=7:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true`;
const r = ff(`${base};[m]${ln},aresample=48000[o]`, ['-map', '0:v', '-map', '[o]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out]);
if (r.status !== 0) { console.error(r.stderr); process.exit(1); }
// checagem
const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128,silencedetect=n=-40dB:d=0.4', '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const I = se.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop(), LRA = se.match(/LRA:\s+(-?[\d.]+) LU/g)?.pop();
const holes = [...se.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((x) => `${Number(x[1]).toFixed(1)} s (${Number(x[2]).toFixed(1)} s)`);
console.log(`[master] ${out}: ${I} · ${LRA}${trechos.length ? ` · abafado em ${opt('abafar')}` : ''}`);
console.log(holes.length ? `[master] buracos de som: ${holes.join(', ')} — confira se são intencionais` : '[master] sem buracos de som');
