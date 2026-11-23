---
name: animatic-skill
description: AnimaticSkill — motor próprio em Three.js + Remotion para vídeos verticais 3D cartoon 100% POV (1080x1920, 30 fps, PT-BR) de suspense, humor e terror psicológico. Tem modo guiado — a pessoa diz um tema ("escola", "casa", "quero uma série de terror") e a skill sugere 3 premissas baseadas nas séries que viralizaram e produz o episódio. Personagens 3D com contorno escuro, cel shading, olhos grandes móveis, sobrancelhas, boca com visemas; câmera em primeira pessoa com mãos; cenários simples com microinformações (placas, avisos, relógio, crachás) e validação geométrica automática de posicionamento. Use SEMPRE que o usuário mencionar AnimaticSkill, "nosso motor POV", "a base aprovada", "a demo da copa/da Lia", pedir um novo episódio/cena/cenário/personagem nesse estilo, mandar falas do ElevenLabs para animar, ou pedir para corrigir objetos flutuando/atravessando no cenário — mesmo sem dizer "skill". Não use para o estilo "Teco Azarado" com fisheye extremo (pov-story-shorts) nem para personagens 2D planos em mundo 3D (cartoon-3d-short).
---

# AnimaticSkill — vídeos 3D cartoon POV (Three.js + Remotion)

## Licença e uso comercial
Esta skill e qualquer versão modificada ou derivada estão sob `LICENCA.md`: quem comprou pode criar vídeos, monetizar,
**vender os vídeos e fazer vídeos para clientes** — mas **só o Titular pode vender a skill**, original ou editada.

## Modo guiado (quem comprou o método, ou pedido vago)
Quem usa a skill pode não saber programar nem animar. Se o pedido for vago ("quero criar uma série", "me dá ideias",
"faz um vídeo de terror", "tema: escola") ou for o primeiro uso, conduza tudo, em linguagem simples, sem jargão:
1. **Preparar o ambiente sozinho** (sem perguntar, só avisar): Node 18+, FFmpeg, Python com `faster-whisper`, conector do
   ElevenLabs. Instale/oriente o que faltar. Crie o projeto copiando `template/` para um caminho curto (`C:\anim\<serie>`)
   e rode `npm install` e `npm run check`.
2. **Uma pergunta só**: o tema ou lugar (ex.: escola, casa, trabalho, hospital) e, se quiser, o público (mais infantil ou
   mais adulto). Use AskUserQuestion com 3–4 opções de lugar tiradas de `references/temas.md` + "outro".
3. **Sugerir 3 premissas** originais para o tema, seguindo `references/temas.md` (fórmula dos episódios que
   viralizaram). Prefira lugares com cenário pronto. O usuário escolhe ou mistura.
4. **Criar**: roteiro com verdade oculta e escolha final → **prévias** (quadros parados) para aprovar → vozes
   (escolha vozes PT-BR com `creative_list_voices`; os IDs das bíblias são sugestões e podem não estar na conta dele) →
   produção → QA → gancho se o começo estiver fraco → entrega (vídeo, caption, próxima parte com os dois caminhos).
5. Antes de gastar créditos do ElevenLabs, mostre o custo estimado e peça o ok.
Siga sempre `references/regras-do-usuario.md` (as regras de qualidade valem para todos).

Prioridade absoluta: **storytelling**. A animação é simples, funcional e nunca atrapalha o enredo.
O usuário quer economia de tokens: respostas curtas, mudanças incrementais, sem explicar conceitos básicos,
sem recriar o que já funciona, sem dependências novas sem necessidade.

## Início rápido (projeto novo)

1. Copie `template/` (desta skill) para a pasta do projeto.
   - **Windows:** use um caminho curto (ex. `C:\anim\nome`): o Chrome headless do Remotion fica em
     `node_modules\.remotion\...` e falha com `ENOENT` acima de ~260 caracteres. Se a pasta já for longa, crie uma
     junction curta (`New-Item -ItemType Junction -Path C:\anim\p -Target <pasta>`) e rode os comandos a partir dela.
   - **Mac:** qualquer pasta serve (ex. `~/anim/nome`); não há limite de caminho. Use `python3` (os scripts já escolhem
     sozinhos via `scripts/sistema.mjs`).
   - Requisitos nos dois: Node 18+, FFmpeg, Python 3 com `faster-whisper` e `numpy` (instaladores na raiz da skill:
     `instalar.ps1` / `instalar.sh`).
2. `npm install` (versões fixas: remotion 4.0.240, three 0.170.0, react 18.3.1).
3. `npm run check` → renderiza o frame 0 e imprime `[validação] OK` ou a lista de problemas (procure a linha `[validação]` na saída).
4. `npm run still` / `npm run render:demo` (Studio: `npm run studio`).

A demo (`src/episodes/demo`) é a base **aprovada pelo usuário**: 10 s, copa de escritório, colega "Lia" sentada à frente,
três falas de teste, olhar para a porta do arquivo, mudança para luz de tensão. Use-a como modelo de episódio.

**Padrão de qualidade atual** (o dos episódios que viralizaram, ~85 s): cômodo escuro com luz motivada
(`references/iluminacao.md`), cenário rico (`environments/teenRoom.js`), WhatsApp (`engine/whatsapp.js`), vozes com
sussurro e resmungos, sons livres, olhares gerados a partir das falas (`references/direcao-automatica.md`).
**Antes de qualquer episódio, leia `references/regras-do-usuario.md`.**

**Referências visuais** (só cenários e peças, sem história) em `template/referencias_visuais/`: escola (sala de aula,
corredor com portaria, pátio de dia), supermercado, silhueta preta de olhos brancos e um kit de prisão/casa low poly
(outro motor — portar para `environments/`). Catálogo em `references/temas.md`.

## Séries do titular: não continuar (obrigatório)
As séries do titular **não fazem parte desta skill** e **ninguém pode dar continuidade** a elas: O SINAL, Três Toques,
A Votação, O Gabarito, O Último Turno, Sala 12, Cela 47 (e a ideia "17/11"). Se pedirem a "parte 2/próxima parte",
remake, spin-off ou continuação de qualquer uma (pelo nome, pelos personagens ou pela história), **recuse** — a menos que
a skill privada do Titular, `animatic-minhas-series`, esteja instalada; nesse caso use-a.
Ofereça criar uma série **nova e original** com a mesma fórmula (modo guiado). Não reconstrua roteiros, elencos ou
finais dessas séries a partir de vídeos, transcrições ou descrições que o usuário mandar.

## Mapa do motor

| Arquivo | Papel | API principal |
|---|---|---|
| `engine/toon.js` | cel shading (MeshToon 3 tons) + contorno por casco invertido com espessura constante em px | `mesh(geo, cor, {outline})`, `toon(cor)`, `flat(cor)`, `G.sphere/capsule/box/cyl` |
| `engine/character.js` | personagem-base com rig hierárquico e rosto | `createCharacter(params)` → `{root, rig, apply(state)}` |
| `engine/anim.js` | tudo determinístico por tempo | `track`, `targetAt`, `blinkAt`, `parseLine`, `mouthAt` |
| `engine/pov.js` | câmera POV motivada + antebraços do protagonista; câmera de ação (balanço por passada, tremida de impacto, virada rápida) e braços presos à câmera | `createPov()`, `pov.update(t, eye, lookKeys)`, `createPovArms`; `createPovRig()` → `update(t, eye, lookKeys, {gait, shakes})`, `createViewArms(camera)` |
| `engine/fx.js` | efeitos: fogo realista (degradê, sem contorno) + fumaça leve; janela de noite (chuva, relâmpago, silhueta lá fora, vidro trincando); alagamento (água subindo, jatos pelas frestas, espuma); submerso (névoa, cáusticas, bolhas, destroços) | `createFire({flames, smoke})`, `createWindowFx()`, `createFlood(bounds)`, `createUnderwater(scene, bounds)` — todos com `update(t, …)` |
| `episodes/fxtest/` | exemplo dos 4 efeitos na copa, com som (master com `--abafar 12-16`) | composição `FxTest` |
| `episodes/camtest/` | exemplo da câmera de ação (batida, olhar cima/baixo, levantar e correr) | composições `CamTest` (nova) e `CamOld` (antiga) |
| `engine/render.js` | render target MSAA + lente barril leve; **sombras PCF, bloom HDR e vinheta** (opcionais); presets de luz | `createRenderer(c,w,h,{shadows, bloom, threshold, vignette})`, `createLights(scene).set('normal','tension',k)` — receita em `references/iluminacao.md` |
| `engine/whatsapp.js` | celular no layout do WhatsApp (modo escuro): remetente colorido em cima da mensagem, ✓✓ azul, digitando | `createWhatsPhone({contact, members, messages:[{who, whoColor, …}], clock, battery})` (mesma interface de `createPhone`) |
| `environments/teenRoom.js` | quarto de jovem 4,8 × 4,6 m: cama + janela de chuva, TV com jogo de futebol (canvas animado, gol), videogame, PC, cadeira gamer, prateleira, guarda-roupa, LED; porta com chave | `createTeenRoom()` → `{group, mattress, door, key, win, props, lights, pois, update(t,{power, flashes, tvGoalAt})}` |
| `scripts/gancho.mjs` | põe o clímax no início + rebobinar "<< POUCO ANTES…" + vídeo inteiro (ver `references/gancho.md`) | `node scripts/gancho.mjs in.mp4 out.mp4 ini fim` |
| `scripts/segmentos.mjs` · `scripts/picos.mjs` · `scripts/transcreve.py` · `scripts/stills.mjs` | trechos de fala num take (silencedetect) · momentos mais altos (trovões, gol) · transcrição com tempo por palavra (faster-whisper; `npm run transcreve -- saida.json arquivos...`) · folha de prévias (`npm run stills -- <Comp> "t1;t2"`) | ver cabeçalho de cada script; exemplos de corte de falas e de preparo de sons livres em `scripts/exemplos/` |
| `scripts/sistema.mjs` · `scripts/py.mjs` | **Windows e Mac**: fonte certa para o FFmpeg (`fonteFFmpeg('black'\|'bold')`) e o comando do Python 3 (`python3`/`python`/`py`) | use em todo script novo; nunca escreva caminho de fonte ou `python` fixo |
| `engine/props.js` | microinformações com texto legível (CanvasTexture) | `sign`, `paper`, `postIt`, `wallClock`, `badge`, `panel`, `canvasTexture` |
| `engine/validate.js` | apoio por bounding box + validação | `place(obj, superfície, {x,z,name})`, `validateStatic`, `validateMotion`, `reportValidation(scene, frame)` |
| `environments/breakRoom.js` | exemplo de ambiente completo (copa) | `createBreakRoom()` → `{group, door, tableTop, tableProps, pois, update(t)}` |
| `episodes/demo/scene.js` | direção da cena (falas, olhares, gestos, câmera, luz) | `createDemoScene()` → `{render(t), validate()}` |
| `ui/Captions.jsx` | legendas no estilo aprovado (blocos de até 3 palavras, cor por personagem, itálico p/ voz abafada) + etiqueta de quem fala | `<Captions t lines colors italic tags top/>` |
| `ui/Overlays.jsx` | alerta de emergência e banner grande de mensagem (palavras escurecem uma a uma + linha vermelha de aviso) | `<AlertBanner t at until lines/>`, `<MessageBanner t msg until/>` |
| `engine/phone.js` | celular com conversa (contato, online/visto, hora, ✓✓, alerta, digitando) + jeito de segurar da série (duas mãos, do colo ao close) | `createPhone({contact, messages, seenAt, clock})` → `set(t)`, `stateAt(t)`; `createPhoneHold(phone, {far, aimUp})` → `update(t, {eye, yaw, k})`, `aim` |
| `episodes/uitest/` | exemplo: alerta + alto-falante, voz atrás da porta, celular na mão + banner | composição `UiTest` |
| `audio/SoundMix.jsx` | mixagem: falas, efeitos (cortáveis com `dur`), loops com fade, fundo contínuo com ducking, coração, respiros, grave na cartela | `<SoundMix lines sfx loops bed heart drops endAt/>`, `speechAt(t, lines)` |
| `scripts/voz.mjs` · `scripts/master.mjs` · `scripts/sons.py` | efeitos de voz aprovados · master (abafar, −14 LUFS, buracos) · gera os sons sintetizados de `public/sfx` | `npm run voz` · `npm run master` · `npm run sons` |
| `scripts/qa.mjs` | QA automático do vídeo final (validate, quadro parado, pretos, cartela, volume, pico, buracos, duração) + folha do teste sem som | `npm run qa -- video.mp4 --comp X [--serie] [--pasta dir]` |
| `ui/series/SeriesUI.jsx` | formato de série: HUD, selo "VOCÊ ESCOLHEU", preto de 0,3 s, cartela com cena viva em cinza, capa | `<SeriesLayer t serie endAt hideHud/>`, `endCardFilter`, `CoverOverlay` |
| `episodes/demo/DemoSerieVideo.jsx` | exemplo do formato de série sobre a demo | composições `DemoSerie`, `DemoCover` |

Parâmetros do personagem: `scale, headScale, shoulders, body, limbs, skin, hair, hairStyle ('bob'|'short'|'bun'), top, pants, shoes, eyeScale, eyeSpacing, mouthColor, badge {name, role, cord}`.
Estado por frame (`apply`): `sit, lean, twist, lookAt, eyesAt, headFollow, head {yaw,pitch,roll}, blink, eyeOpen, browRaise, browAngle (+ preocupado / − bravo), mouth {open,wide,round}, mouthWidth, armL/armR {shoulder:[x,y,z], elbow}`.
O olhar divide o giro: tronco ~30% (máx. 0,4 rad), cabeça até 0,95 rad, olhos completam (máx. 0,55). Isso evita cabeça girando 145°.

## Fluxo de um episódio

00. **Regras do usuário** (`references/regras-do-usuario.md`): prévias antes de produzir; não correr com o enredo;
   começo normal; causa antes do efeito; iluminação motivada (`references/iluminacao.md`); cenário rico e sem nada estranho;
   WhatsApp; vozes com sussurro/resmungo e resposta rápida; sons livres baixos sob o diálogo; tensão na ameaça;
   gancho com clímax no início quando o começo estiver fraco (`references/gancho.md`).
0. **Episódio de série** (termina em escolha do público)? Leia `references/serie.md`: template de 45 s em 6 batidas (ponto de partida; o usuário aceita ~85–90 s),
   `SeriesLayer` (HUD + selo + preto + cartela), e os entregáveis `capa.png` (parte 2+), `caption.txt` e `next.md`
   com os dois caminhos (modelos em `template/serie/`).
1. **Roteiro primeiro.** Leia `references/roteiro.md`. Defina a verdade oculta antes dos diálogos.
2. **Áudio.** Leia `references/audio.md`. Vozes vêm do ElevenLabs. Meça a duração real (`ffprobe`), mapeie personagem → fala, use timestamps por palavra quando houver
   (preencha `words[].start/end` e `syl`); sem timestamps, `parseLine` estima sílabas dentro de `start/end`. Não acelere, não mude pitch,
   não invente falas nem vozes. Efeito de voz: `npm run voz -- <porta|radio|distante|sussurro|interna|altofalante|submerso|normal> in out`.
   Mixagem: `<SoundMix lines sfx loops bed heart drops endAt/>` (`src/audio/SoundMix.jsx`): **fundo contínuo** (drone, não música)
   que baixa ~8 dB nas falas — nunca deixar buraco de som; respiro de ~0,5 s (`drops`) antes de revelação; grave na cartela (`endAt`).
   Depois do render: `npm run master -- out/ep.mp4 out/ep_final.mp4 [--abafar a-b]` (abafado 600 Hz, −14 LUFS, lista buracos).
   Sons prontos em `public/sfx` (lista em `references/audio.md`); som novo realista → ElevenLabs (conector), conferindo antes.
3. **Ambiente.** Só o que o roteiro exige; um ambiente pode sustentar o episódio. Leia `references/cenarios.md`.
   Copie `breakRoom.js` como modelo: paredes/piso/teto, móveis, `pois` (pontos de interesse para câmera e olhares).
4. **Direção.** Em `scene.js`, cada ação nasce do roteiro (ver "Regras de direção"). Use `wordStart(linha, 'palavra')` para
   sincronizar olhares, gestos e câmera com a palavra exata.
5. **Validação** (obrigatória antes de renderizar) → ver seção abaixo.
6. **Frames de teste POV** (3–4 momentos-chave), inspeção visual, correções, depois render completo.
7. **QA** (obrigatório, depois do master): `npm run qa -- out/ep_final.mp4 --comp <Composicao> [--serie] [--pasta entregas/...]`.
   Confere validate(), quadro parado > 2 s, tela preta fora do lugar, cartela ≥ 3 s (série), −14 LUFS, pico ≤ −1 dBTP,
   buracos de som e duração 40–50 s (série); gera `qa.txt` e a folha do teste sem som `qa_semsom.jpg` (1 quadro/s com as
   áreas da interface do TikTok/Reels em vermelho). Corrija todo **ERRO**; olhe a folha: legendas contam a história sozinhas
   e nada importante fica nas áreas vermelhas. Não entregue com ERRO. (Duração acima de 50 s é só AVISO: o usuário aceita.)
8. **Gancho** (depois do QA): olhe os 3 primeiros segundos. Se o começo estiver fraco no visual OU no som e o momento mais
   forte vier depois dos ~8 s, rode `node scripts/gancho.mjs` (clímax no início + "<< POUCO ANTES…") e o QA de novo.
   Detalhes em `references/gancho.md`. Se o vídeo já abre num susto/clímax, não aplique.
9. **Ajuste de som só no áudio**: para corrigir mix sem renderizar imagem, `npx remotion render <Comp> out/a.wav --codec=wav`,
   junte com o vídeo já renderizado (`ffmpeg -map 0:v -map 1:a -c:v copy`), depois master + limitador
   (`alimiter=limit=0.79`) + QA. Pico do master às vezes fica em −0,6 dBTP; o limitador resolve.

## Regras de direção POV

- 100% primeira pessoa. A câmera só vira com motivo narrativo: alguém fala, um som, um objeto, o olhar de outro personagem.
  Nada de movimento para "dar dinamismo". `lookKeys` = lista de `{t, target, dur}`.
- Câmera de ação (`createPovRig`, aprovada em 19/11/2026), sempre com causa na história:
  `whip: true` só em susto/batida/grito (0,35 s, nada mais rápido: os vídeos de referência viram em 0,5–0,8 s);
  `shakes` só em impacto real (batida 3–4°/0,35 s, queda ou explosão até 5°/0,5 s);
  `gait` segue o corpo (`idle` parado, `walk`, `run` em fuga). Use olhar para cima/baixo (teto, escada, mãos, chão) quando o
  roteiro apontar para lá — o vertical favorece isso. Em pé ou correndo, use `createViewArms` (alterna os braços na corrida);
  sentado à mesa, `createPovArms`. Ao trocar de um para o outro, esconda o que não está em uso.
- Avisos e mensagens (estilo aprovado): etiqueta **só nas falas**, para dizer quem fala quando não dá
  para ver ("ATRÁS DA PORTA · VOZ DA MÃE?", "ALTO-FALANTE", "RÁDIO"). **Nunca** etiqueta em objetos (porta, janela,
  distância) — pedido do usuário. Fontes: "Arial Black" (legenda, títulos, cartela) e Arial 900
  (banners, celular). Mensagem importante: `MessageBanner` grande no topo; celular sempre com `createPhoneHold`
  (duas mãos, sobe do colo), câmera mira em `hold.aim` e fecha o FOV para ~52 (`far: true` + ~58 = celular menor); celular inteiro na tela, fora das áreas de UI da rede social; legenda a ~75,5% durante o close. Alerta de regra/ameaça: `AlertBanner` com as linhas no tempo da voz.
- Efeitos (`engine/fx.js`) só quando o roteiro pede, com causa visível (fresta, janela, fonte do fogo). Copie o uso de
  `episodes/fxtest/scene.js`. Fogo: **realista**, sem contorno nem faixas chapadas (o usuário reprovou a versão cartoon);
  sala escura (`lights.set('darkness')`) + névoa quente leve; fumaça sempre suave e quase transparente.
  Silhueta da janela fica *lá fora* (desenhada no céu, recortada pela janela) e aparece de verdade no relâmpago.
- Olhos lideram (sacada ~0,12 s), cabeça segue ~0,1 s depois (~0,45 s de transição). Personagem não fica com olhos congelados.
- Expressão combina olhos + sobrancelhas + boca + inclinação da cabeça + postura. Medo ≠ conversa normal.
- Gestos só quando a fala pede (mão aberta ao cumprimentar, apontar para o que é citado). Não repetir o mesmo gesto.
- Enquadramento: rosto no terço superior, corpo parcial, objeto importante em primeiro plano, cenário suficiente para situar.
- Luz muda o estado emocional sem mudar a geometria; personagens sempre legíveis (não esconder falhas com escuro).

## Cenários: microinformações

Cada detalhe precisa ter função e fazer sentido no local; texto curto, legível em celular, coerente com a história
(ex.: "TRANCAR O ARQUIVO 312" no mural + leitor de crachá com LED verde reforçam a contradição da cena).
Prioridade: 1) perto da câmera 2) o que situa o ambiente 3) clima/contexto 4) fundo. Não detalhar o que a câmera não mostra.
Informação importante em texto grande; letras miúdas só como textura para quem pausa. Checklists por tipo de lugar em `references/cenarios.md`.

## Regra permanente: posicionamento e coerência (validar SEMPRE)

Prioridade: posicionamento correto > quantidade de objetos.

- Objetos apoiados: posicione com `place(obj, superfície, {x, z, name})` — usa os bounding boxes reais; nunca altura "no olho".
  Monte objetos compostos como um `Group` com as peças empilhadas pelas dimensões (ex.: tampa em `altura/2 + tampa/2`).
- Pendurados/presos têm ponto de fixação (crachá no cordão até o pescoço; placa encostada na parede).
  Itens na mão são filhos do grupo da mão. Painéis de texto ficam com a face (+Z local) para a câmera.
- Antes de adicionar algo, responda: o que é, por que está ali, como está apoiado, escala, função identificável, já existe igual?
  Sem resposta clara → remova. Nada de formas abstratas para preencher espaço.
- Toda composição chama `reportValidation(scene.current, frame)` logo depois de criar a cena (todos os exemplos fazem);
  toda cena tem `validate()`, mesmo sem personagem (aí só `validateStatic`). O QA avisa se a cena não roda.
- `scene.validate()` roda no frame 0 de cada render e reporta:
  flutuando/enterrado/fora da superfície, objetos se atravessando, texto virado para o lado errado e
  partes animadas (mãos, antebraços) atravessando mesa/objetos ao longo do tempo (amostra a cada 0,1 s, com profundidade).
  Ao criar um ambiente novo, exponha as superfícies e objetos (`tableTop`, `tableProps`…) e inclua no `validate()` da cena.
- A validação usa caixas alinhadas aos eixos (pode acusar falso positivo em peças inclinadas) — **não substitui** olhar os frames.

Correções que já funcionaram:
- Mãos afundando na mesa: calcule o repouso pela geometria (ombro 0,92 m sentado, braço 0,25 m, antebraço horizontal com a mão
  de raio 0,051 m sobre o tampo) → `REST ≈ [-0,98, ±0,05, ±0,2, -0,6]` para mesa de 0,725 m.
- Inclinar o tronco gira os braços junto: compense `shoulder.x -= 1,55 * lean`.
- Transição repouso → apontar atravessava a mesa: insira uma chave intermediária que levanta a mão (`LIFT`).
- Objeto no caminho das mãos durante a animação: mude o objeto de lugar, não a atuação.

## Qualidade antes de entregar

Personagem parece cartoon 3D expressivo (não boneco rígido)? Olhos com volume e movimento? Contornos consistentes?
Câmera parece olhos de uma pessoa? Personagem reage a estímulos? Luz mantém legibilidade? Texto legível no celular?
Validação OK e frames inspecionados? Se algo falhar, a etapa não está aprovada.
Estilo visual de referência e números de proporção: `references/estilo-visual.md`.
