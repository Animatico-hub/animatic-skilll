// Acha os momentos mais altos de um áudio (loudness momentânea do ebur128, janela 0,4 s).
// uso: node scripts/picos.mjs arquivo [quantos=8] [distancia_min_s=8]
import {spawnSync} from 'node:child_process';
const [f, n = '8', gap = '8'] = process.argv.slice(2);
const se = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], {encoding: 'utf8', maxBuffer: 1 << 28}).stderr;
const pts = [...se.matchAll(/t:\s*([\d.]+)\s+TARGET.*?M:\s*(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
const sorted = pts.slice().sort((a, b) => b[1] - a[1]);
const picked = [];
for (const p of sorted) { if (picked.every((q) => Math.abs(q[0] - p[0]) > Number(gap))) picked.push(p); if (picked.length >= Number(n)) break; }
const median = pts.map((p) => p[1]).sort((a, b) => a - b)[Math.floor(pts.length / 2)];
console.log(`${f}: mediana ${median.toFixed(1)} LUFS`);
for (const [t, m] of picked.sort((a, b) => a[0] - b[0])) console.log(`  ${t.toFixed(1)} s  ${m.toFixed(1)} LUFS`);
