// Roda um script Python com o Python 3 do sistema (python3 no Mac, python/py no Windows).
// uso: node scripts/py.mjs scripts/sons.py [args...]
import {spawnSync} from 'node:child_process';
import {python} from './sistema.mjs';
const r = spawnSync(python(), process.argv.slice(2), {stdio: 'inherit'});
process.exit(r.status ?? 1);
