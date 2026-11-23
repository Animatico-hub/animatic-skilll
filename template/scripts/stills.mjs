// Prévias: renderiza quadros parados de uma composição e monta uma folha de contato (Windows e Mac).
// uso: npm run stills -- <Composicao> <t1;t2;t3...> [saida.jpg] [colunas=4]
// ex.:  npm run stills -- Sinal1v2 "0.8;7.25;18;43" out/t/previa.jpg
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';

const [comp, tempos, out = 'out/t/previa.jpg', colsArg = '4'] = process.argv.slice(2);
if (!comp || !tempos) { console.log('uso: npm run stills -- <Composicao> "t1;t2;..." [saida.jpg] [colunas]'); process.exit(1); }
const T = tempos.split(/[;,]\s*/).map(Number).filter((x) => !Number.isNaN(x));
const dir = 'out/t/s';
rmSync(dir, {recursive: true, force: true});
mkdirSync(dir, {recursive: true});
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
T.forEach((t, i) => {
  const name = `${dir}/${String(i).padStart(2, '0')}.png`;
  execFileSync(npx, ['remotion', 'still', comp, name, `--frame=${Math.round(t * 30)}`, '--log=error'], {stdio: 'inherit', shell: process.platform === 'win32'});
});
const cols = Number(colsArg), rows = Math.ceil(T.length / cols);
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', `${dir}/%02d.png`, '-vf', `scale=360:640,tile=${cols}x${rows}:padding=6`, '-frames:v', '1', out]);
console.log(`ok ${out}`);
