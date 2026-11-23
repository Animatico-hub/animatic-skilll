// Funções que mudam entre Windows e Mac (e Linux): fontes para o FFmpeg desenhar texto e o comando do Python.
import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const FONTES = {
  // "Arial Black" (títulos, gancho) e "Arial Bold" (números do QA), com alternativas
  black: [
    'C:/Windows/Fonts/ariblk.ttf',
    '/System/Library/Fonts/Supplemental/Arial Black.ttf',
    '/Library/Fonts/Arial Black.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Black.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  ],
  bold: [
    'C:/Windows/Fonts/arialbd.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
    '/Library/Fonts/Arial Bold.ttf',
    '/usr/share/fonts/truetype/msttcorefonts/Arial_Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  ],
};

/** Caminho da fonte já escapado para o filtro drawtext do FFmpeg (use dentro de aspas simples: fontfile='...'). */
export function fonteFFmpeg(tipo = 'black') {
  const f = FONTES[tipo].find((p) => existsSync(p));
  if (!f) throw new Error(`Nenhuma fonte "${tipo}" encontrada. Instale a Arial ou ajuste scripts/sistema.mjs.`);
  return f.replace(/:/g, '\\:'); // "C:/..." -> "C\:/..." (o drawtext trata ":" como separador)
}

/** Comando do Python 3 disponível: "python3" (Mac/Linux), "python" ou "py" (Windows). */
export function python() {
  for (const cmd of ['python3', 'python', 'py']) {
    const r = spawnSync(cmd, ['--version'], {encoding: 'utf8'});
    if (r.status === 0 && /Python 3/.test(`${r.stdout}${r.stderr}`)) return cmd;
  }
  throw new Error('Python 3 não encontrado. Rode o instalador (instalar.ps1 no Windows, instalar.sh no Mac).');
}
