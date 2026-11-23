# Direção automática: câmera e olhares gerados a partir das falas

Em episódios longos (~80 s, 30+ falas), escrever cada olhar à mão quebra quando o tempo das vozes muda.
Gere a câmera e os olhares a partir da lista de falas + alguns eventos fixos.

## Câmera POV: segue quem fala, menos nas janelas "presas"
```js
// HOLDS = trechos em que a câmera fica presa num alvo (jogo na TV, relâmpago, tranca, celular em close, final)
const HOLDS = [[0, 2.3, TV], [T.flash + 0.05, T.flash + 1.1, WINDOW], [C1[0] - 0.15, C1[1] - 0.25, hold.aim], [T.knock, 47.0, DOOR]];
const inHold = (t) => HOLDS.some(([a, b]) => t >= a && t < b);
const camTarget = (l) => (l.speaker === 'porta' ? DOOR : l.speaker === 'voce' ? null : FACE[l.speaker]);
const look = [];
for (const [a, b, tg] of HOLDS) {
  look.push({t: a, target: tg, dur: 0.5, whip: a === T.knock});          // whip só no susto
  const cur = LINES.find((l) => l.start <= b && l.end >= b && camTarget(l)) ?? LINES.find((l) => l.start - 0.2 >= b && camTarget(l));
  look.push({t: b, target: cur ? camTarget(cur) : GROUP, dur: 0.55});    // ao sair, vai para quem está falando
}
for (const l of LINES) { const tg = camTarget(l), t0 = l.start - 0.2; if (tg && !inHold(t0)) look.push({t: t0, target: tg, dur: 0.45}); }
look.sort((a, b) => a.t - b.t);
```

## Olhares dos personagens: quem escuta olha quem fala (0,15 s de reação)
```js
const TO = {l02: 'bruno', l03: 'tv'};   // para quem cada fala é dirigida, pelo id da fala (padrão: 'you' = câmera)
const BASE = {ana: [[0, 'tv'], [T.flash + 0.15, 'window'], [T.alert + 0.3, 'phone'], [T.knock + 0.15, 'door']]};
for (const name of Object.keys(BASE)) {
  const keys = BASE[name].slice();
  for (const l of LINES) {
    if (l.speaker === name) keys.push([l.start - 0.1, TO[l.id] ?? 'you']);
    else keys.push([l.start + 0.15, l.speaker === 'porta' ? 'door' : l.speaker === 'voce' ? 'you' : l.speaker]);
  }
  PLANS[name] = keys.sort((a, b) => a[0] - b[0]);
}
// a cada quadro: targetAt(t, PLANS[name].map(([tt, k]) => ({t: tt, target: alvo(k)})), 0.12) para os olhos e 0.45 para a cabeça
```

## Reações com gesto (resmungo, comemoração, riso)
Uma janela por fala (`[[start-0,1, 0], [start, 1], [end, 1], [end+0,4, 0]]`) dirige: braços para cima na comemoração,
cabeça para trás + "não" com a cabeça no resmungo (`head.yaw = k * 0.22 * sin(t*7)`), olhos semicerrados e boca aberta
no riso. Susto (`jolt`) na batida/trovão: inclina para trás, sobrancelhas sobem, olhos arregalam.
