// Gancho de abertura (pedido do usuário): repete o momento mais forte (~12,2–17,3 s: relâmpago, trovão, alerta em todos os
// celulares, todos pegam o celular, "Chegou no meu também!") no começo, rebobina rápido com "POUCO ANTES…" e o vídeo começa normal.
// uso: node scripts/gancho.mjs entrada.mp4 saida.mp4 [inicio=12.2] [fim=17.3]
import {execFileSync} from 'node:child_process';
import {fonteFFmpeg} from './sistema.mjs';
const [inp, out, a = '12.2', b = '17.3'] = process.argv.slice(2);
const A = Number(a), B = Number(b), D = B - A, RW = 0.7; // RW = duração do rebobinar
const font = fonteFFmpeg('black'); // Windows ou Mac
const fc = [
  // 1) gancho: o trecho forte, com fade curto de áudio nas bordas
  `[0:v]trim=${A}:${B},setpts=PTS-STARTPTS[gv]`,
  `[0:a]atrim=${A}:${B},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=${(D - 0.12).toFixed(2)}:d=0.12[ga]`,
  // 2) rebobinar: o mesmo trecho de trás para frente, 7x mais rápido, cor lavada + ruído + linhas, texto "POUCO ANTES…"
  `[0:v]trim=${A}:${B},setpts=PTS-STARTPTS,reverse,setpts=PTS/${(D / RW).toFixed(3)},fps=30,` +
    `eq=saturation=0.35:contrast=1.15:brightness=-0.04,noise=alls=28:allf=t,` +
    `drawbox=x=0:y=ih*mod(t*3.1\\,1):w=iw:h=26:color=white@0.25:t=fill,` +
    `drawtext=fontfile='${font}':text='<< POUCO ANTES…':fontsize=74:fontcolor=white:borderw=10:bordercolor=black:x=(w-tw)/2:y=h*0.42[rv]`,
  `[0:a]atrim=${A}:${B},asetpts=PTS-STARTPTS,areverse,atempo=2,atempo=2,atempo=${(D / RW / 4).toFixed(3)},` +
    `highpass=f=400,lowpass=f=5000,volume=0.45,afade=t=in:d=0.05,afade=t=out:st=${(RW - 0.15).toFixed(2)}:d=0.15,apad=whole_dur=${RW}[ra]`,
  // 3) vídeo inteiro
  `[0:v]setpts=PTS-STARTPTS[fv]`, `[0:a]asetpts=PTS-STARTPTS[fa]`,
  `[gv][ga][rv][ra][fv][fa]concat=n=3:v=1:a=1[v][a]`,
].join(';');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', inp, '-filter_complex', fc, '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', out], {stdio: 'inherit'});
console.log(`gancho ${D.toFixed(1)} s + rebobinar ${RW} s + vídeo -> ${out}`);
