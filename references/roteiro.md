# Roteiro — suspense, humor e terror psicológico em POV

O roteiro é mais importante que a animação. A maior parte do trabalho deve ir para a história.

## Antes dos diálogos: a verdade oculta
Escreva (só para você) o que realmente está acontecendo: quem fez o quê, quando e por quê.
Todo acontecimento precisa ter explicação interna coerente, mesmo que o público não descubra tudo.
Nada de reviravolta aleatória só para surpreender: cada surpresa deve ser "justa" ao rever o vídeo.

## Estrutura (flexível)
1. Situação cotidiana — local reconhecível em 1–2 s (placa, relógio, objetos).
2. Pequena anormalidade — um detalhe fora do lugar.
3. Regra ou ameaça — aviso, mensagem no celular, fala de alguém.
4. Primeiro problema.
5. Informação que contradiz o que parecia verdadeiro.
6. Tentativa de resolver.
7. Nova ameaça ou reviravolta.
8. Decisão difícil para o espectador — duas opções com riscos e consequências diferentes (nenhuma "obviamente certa").

## Como o cenário ajuda a contar
Plante pistas como microinformações: um aviso na parede que define a regra, um LED que contradiz uma fala,
um relógio que fixa o horário, um crachá que identifica quem é quem. O espectador atento deve conseguir
"resolver" com o que estava visível.

## Ritmo
- Falas curtas, uma ideia por fala. Pausas naturais (a boca fecha nas pausas).
- Corte/virada de câmera só quando algo novo precisa ser visto.
- Sem música: o suspense vem de diálogo, acontecimentos e sons ambientes reais, sobre um fundo grave contínuo
  (drone) que nunca deixa o vídeo "mudo" — ver `references/audio.md`.
- Áudio na fala: `{..., file: 'voz_fx/03.wav', audioAt: 3.62}` (audioAt = quando o arquivo começa; start/end = a fala de fato).

## Formato da fala no código
```js
{speaker: 'lia', text: 'Alguém deixou aquela porta aberta.', start: 3.7, end: 5.9, intensity: 1}
```
`parseLine` gera `words[]` com sílabas e tempos; com timestamps reais do ElevenLabs, substitua os tempos por palavra.
Ações (olhar, gesto, câmera) se ancoram em palavras: `wordStart(LINES[1], 'aquela')`.
