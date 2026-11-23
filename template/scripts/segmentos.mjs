// Lista trechos com som (fala) de um take, pelo silencedetect do FFmpeg.
// uso: node scripts/segmentos.mjs arquivo.mp3 [limiar_dB=-38] [silencio_min=0.18]
import {spawnSync} from 'node:child_process';
const [f, db = '-38', min = '0.18'] = process.argv.slice(2);
const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], {encoding: 'utf8'}).stdout);
const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', `silencedetect=n=${db}dB:d=${min}`, '-f', 'null', '-'], {encoding: 'utf8'}).stderr;
const sil = [...se.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const segs = []; let t = 0;
for (const [a, b] of sil) { if (a > t + 0.05) segs.push([t, a]); t = b; }
if (dur > t + 0.05) segs.push([t, dur]);
console.log(f, segs.map(([a, b], i) => `${i}:${a.toFixed(2)}-${b.toFixed(2)}`).join('  '));
