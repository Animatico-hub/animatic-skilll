# Áudio (Pacote 5, aprovado em 19/11/2026)

## O que as referências fazem (medido nos 4 vídeos, não é palpite)
- **Nunca há buraco de som**: nenhum trecho abaixo de −40 dB. Volume quase constante (variação 2,9–4,1 LU).
  Os nossos episódios antigos caíam para −45/−50 dB entre falas (variação 6,8–8,1 LU).
- Trilha/ambiente **baixa ~8 dB quando alguém fala** (−17 → −25 dB) e volta logo depois. Voz fica ~3–4 dB acima do fundo.
- **Debaixo d'água**: quase nada acima de 1 kHz (corte ~600 Hz) durante todo o trecho submerso.
- **Cartela**: grave forte e longo (40–80 Hz) nos últimos 1,5–2,7 s.
- Eles usam música em 3 de 4 vídeos (132–184 BPM). Nós usamos drone (sem música), decisão do usuário.
- O "silêncio total de 0,5 s" do prompt deles **não aparece** nos vídeos: usamos um respiro do fundo (`drops`).
- Volume final igual ao nosso: −14 LUFS.

## Regras
1. `SoundMix` em todo episódio: `bed` padrão ligado (drone.wav, vol 0.45, duck 0.6 ≈ −8 dB nas falas).
2. Nenhum buraco > 0,4 s (o `master` lista). Exceção só se for intencional e curto.
3. `drops: [[t0, t1]]` (~0,5 s) logo antes da fala/revelação mais forte; não mais que 1–2 por episódio.
4. `endAt` = início da cartela → grave_cartela.wav toca em endAt − 1 s e o fundo sai.
5. Abafar (submerso, atrás de parede grossa) no master: `--abafar a-b` (padrão 600 Hz). Voz de quem está submerso: `voz submerso`.
6. Coração (`heart`) baixinho e subindo com a tensão (preferência do público da série).
7. Efeito com causa na cena e no tempo exato do visual (relâmpago → trovão; trinca do vidro → `vidro_trinca`).
   Som longo demais para a cena: corte com `dur` (fade de 0,08 s, sem estalo).

## Sons prontos (`public/sfx`)
| arquivo | uso | origem |
|---|---|---|
| drone.wav | fundo contínuo (loop 16 s) | sintetizado (`scripts/sons.py`) |
| fogo.wav, chuva.wav, agua.wav | loops de 8/8/6 s para fogo, chuva, jatos d'água | sintetizado |
| respira.wav | respiração ofegante (loop 5 s, corrida/medo) | sintetizado |
| bolhas.wav, mergulho.wav | debaixo d'água; impacto ao entrar na água | sintetizado |
| grave_cartela.wav | sobe 1 s + grave longo (toque em endAt − 1 s) | sintetizado |
| alerta.wav | alerta de emergência (sino + vibração 150 Hz, 2,2 s), recriado da referência da cabana | sintetizado |
| vidro_trinca.mp3 | vidro **trincando** (3 s, sem quebrar) — cortar conforme a cena | ElevenLabs, escolhido pelo usuário (versão 1) |
| vidro_quebra.mp3 | vidro **quebrando** + cacos (1 s) | ElevenLabs, escolhido pelo usuário (versão 1) |
| coracao.mp3, trovao.mp3 | coração em loop, trovão | de episódios anteriores |

| livre_chuva.wav | chuva batendo na janela (82 s, loop) — vol ~0,3 sob o diálogo | Wikimedia Commons, domínio público |
| livre_trovao_forte.wav, livre_trovao_longe1/2.wav | trovão perto (estalo ~1,0 s após o início do arquivo) e dois distantes abafados | Commons, domínio público |
| livre_alerta.wav | toque Cell Broadcast empilhado 4× (vários celulares juntos), 5,4 s | Commons, domínio público |
| livre_torcida_tv.wav | lance + gol (~4 s) + murmúrio, já com filtro de TV (mono, 320 Hz–4 kHz, reflexo do quarto) | Freesound CC0 |
| coracao_rapido.wav | coração 1,35× mais rápido, mesmo tom (`atempo`) — depois da ameaça, vol ~0,16–0,27 | derivado de coracao.mp3 |
| tensao_hit.wav, tensao_drone.wav | grave seco no impacto (batida) + drone grave baixinho até o fim | sintetizado |
| batida_porta.mp3, chave_tranca.mp3, passos.mp3, lanterna.wav, vibra.wav, apagao.wav | toque na porta (repetir 3× a cada 0,55 s), chave, passos, clique da lanterna, vibração, queda de energia | ElevenLabs / sintetizado |
| livres_originais/ | arquivos originais baixados + `CREDITOS.txt` (fonte e licença de cada um) | Commons / Freesound |

## Sons livres (regra do usuário, 20/11/2026)
- Preferir sons **reais e livres**: Wikimedia Commons (domínio público/CC0; busca pela API `generator=search&gsrnamespace=6`)
  e Freesound (CC0; download exige login — o usuário entra no navegador do app e o arquivo cai em `Downloads`).
  O Commons limita acessos por script (erro 429): baixe pelo navegador (`…/arquivo.ogg?download`) ou com intervalos longos.
- Confirmar com o usuário nome, fonte e tamanho antes de baixar. Registrar em `CREDITOS.txt`.
- **Ler a descrição**: gravação de estádio com música tocando ao fundo (ex.: "I Feel Good") pode gerar reivindicação — não usar.
- Cortar pelo momento certo com `scripts/picos.mjs` (trovão mais alto, explosão da torcida); exemplo completo de preparo em
  `scripts/exemplos/sons_livres_exemplo.mjs`.
- Níveis que o usuário aprovou (antes do master): ambiente ≥ 10–12 dB abaixo das vozes (vozes ≈ −16 LUFS);
  trovão forte 2–5 dB acima das falas no momento do relâmpago; som vindo de TV/rádio com filtro de aparelho.
- Tensão na ameaça, "bem de leve": `tensao_hit` no impacto, `coracao_rapido` em loop (keys 0,16 → 0,27 até a cartela),
  `tensao_drone` vol ~0,55; o coração normal quase some antes da ameaça para a mudança ser sentida.

Som realista novo (passos, porta, sirene...) que não existe livre: gerar no ElevenLabs (`creative_generate_in_flow`,
`eleven_text_to_sound_v2`, prompt em inglês, "dry recording"). Ele gera clipes curtos (0,5–2 s) e ignora "8 seconds":
para ambiente longo (torcida, multidão), prefira som livre ou sintetize.

## Vozes (regra do usuário)
Um take por personagem com todas as falas + tags (eleven_v4): sussurro detalhado, resmungos, risadas, sustos; resposta
0,1–0,3 s depois da fala anterior. Corte por trechos (`scripts/segmentos.mjs`, limiar −38 dB) começando 0,12 s antes
(sussurro começa baixo) e confira o texto de cada corte com `scripts/transcreve.py` (o Whisper erra sussurro curto;
compare com a transcrição do take inteiro).

## Efeitos de voz (`npm run voz -- <efeito> in out`)
`normal`, `sussurro`, `porta` (atrás da porta), `interna` (pensamento), `radio` (rádio atrás da porta), `distante`,
`altofalante` (corneta/quadro digital), `submerso`. Todos nivelam antes (−16 LUFS; sussurro −18).
