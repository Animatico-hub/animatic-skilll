# Formato de série (Pacote 1 — aprovado pelo usuário em 19/11/2026)

Episódio de série interativa: o público escolhe nos comentários e a parte seguinte continua da opção mais comentada.
Componentes em `src/ui/series/SeriesUI.jsx`; exemplo funcionando em `src/episodes/demo/DemoSerieVideo.jsx`
(composições `DemoSerie` e `DemoCover`).

## Template de 45 s (6 batidas)
| Tempo | Batida | O que acontece |
|---|---|---|
| 0–2 s | Gancho | Começa no meio da ação, fala no 0,0 s. Selo "VOCÊ ESCOLHEU" (parte 2+) e HUD já na tela. |
| 2–12 s | Escolha funciona → falha | A escolha anterior dá certo por alguns segundos e depois quebra. |
| 12–22 s | Pior momento | Preso, escondido, sem saída. As falas param; respiro do fundo de ~0,5 s (`drops`) antes da batida (nunca buraco de som). |
| 22–34 s | Virada | Sai do pior momento, alguém chama seu nome, surge uma nova ameaça e uma saída com uma chance só. |
| 34–40 s | Cliffhanger | Duas autoridades/vozes mandam fazer coisas opostas; nenhuma é obviamente certa. |
| 40–40,3 s | Preto | `BlackCut` (0,3 s). |
| 40,3–45 s | Cartela | `EndCardV2` com a cena viva em cinza por trás (`endCardFilter`); manter **≥ 3 s**. |

Regras de roteiro deste formato:
- Falas de 1–6 palavras, presente, uma ideia por fala; uma fala nova a cada ~1,5–2 s.
- O companheiro é chamado pelo nome pelo menos 2 vezes por parte.
- Um mistério pequeno plantado por parte (ex.: "É mesmo a sua amiga?") que se paga depois.
- A escolha final é explicada em falas (áudio), não só na cartela; opções de 1–3 palavras.
- Teste sem som: as legendas sozinhas contam a história.
- As regras de roteiro do projeto continuam valendo (simples e coerente; um engano, uma pista, uma escolha).

## Tela
- **HUD** (`SeriesHud`), o vídeo todo até a cartela: "LOCAL · HH:MM" em branco + "Série · Parte N" em amarelo,
  canto superior esquerdo, a 150 px do topo (abaixo das abas do TikTok/Reels). O relógio anda com o vídeo (`storyClock(clockStart, t, clockSpeed)`).
  Esconder (`hideHud`) quando um banner/celular em close ocupa o topo.
- **Selo** (`ChoiceBadge`), parte 2+, de 0,45 a 3 s: pílula vermelha "VOCÊ ESCOLHEU" + ícone + opção vencedora.
- **Preto** (`BlackCut`): 0,3 s antes da cartela. As legendas param em `END_CARD - 0.3`.
- **Cartela** (`EndCardV2`): "PARTE N+1 · VOCÊ DECIDE", "O QUE VOCÊ FARIA?", dois botões com ícone e cor por opção,
  "OU", "Comenta abaixo ↓", pulso 1,00–1,03. Entrada suave, sem "pop". Botões com 760 px (x 160–920), fora da coluna
  de curtir/comentar; a fonte diminui sozinha para o texto caber em 1 linha.
- Áreas que a interface da rede social cobre (estimativa): 7% de cima, 20% de baixo e a faixa da direita (x > 86%,
  y 38–80%). Nada importante ali — a folha do QA mostra essas áreas em vermelho.
- Tudo de uma vez: `<SeriesLayer t serie endAt hideHud/>` + `filter: endCardFilter(t, END_CARD)` no canvas.

## Entregáveis por episódio (pasta `entregas/AAAA-MM-DD_parteN/`)
1. `parteN.mp4` (1080×1920, 30 fps).
2. `capa.png` — **só da parte 2 em diante**: cena nova feita para a capa + `CoverOverlay` (série, PARTE N, gancho e faixa "A OU B?").
3. `caption.txt` — modelo em `template/serie/caption.txt`.
4. `next.md` — 6 batidas para **cada** uma das duas opções (modelo em `template/serie/next.md`), escrito junto com o episódio
   para a próxima parte sair poucas horas depois da votação.
5. `qa.txt` + `qa_semsom.jpg` — `npm run qa -- out/parteN_final.mp4 --serie --comp <Comp> --pasta entregas/AAAA-MM-DD_parteN`
   (depois do master). Sem nenhum ERRO; AVISO só se tiver motivo. A cartela das referências dura 1,5–2,1 s; nós mantemos ≥ 3 s.

## QA (Pacote 6 — aprovado em 19/11/2026)
O mesmo teste foi rodado nos 4 vídeos de referência e nos nossos: ninguém tem quadro parado > 2 s; buracos de som só nos
nossos antigos (2 e 29 buracos), que o Pacote 5 resolve. Rode sempre; o QA não substitui assistir ao vídeo.

## Ciclo diário
Ler a opção mais comentada da parte anterior → abrir o ramo dela no `next.md` → roteiro → áudio → render → master → QA → capa → caption → next.md novo.
Uma série dura 4–6 partes; depois, outra premissa com o mesmo elenco recorrente.
