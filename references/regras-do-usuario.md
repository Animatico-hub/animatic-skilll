# Regras do usuário (padrão de qualidade do titular — os episódios que viralizaram seguem estas regras)

Valem para TODO episódio novo. Técnica dos olhares automáticos por fala: `references/direcao-automatica.md`.

## 1. Processo
- **Prévias antes de produzir.** Quadros parados dos momentos-chave (`npm run stills -- <Comp> "t1;t2;..."`) + roteiro com tempos.
  O usuário aprova; só então gerar vozes/sons (gasta créditos).
- Mostrar a folha de prévia, não descrever. Dizer honestamente o que não foi conferido (não ouvimos o áudio).

## 2. Roteiro e ritmo
- **Não correr com o enredo.** Duração livre (~80–90 s ok); o template de 45 s é ponto de partida, não teto.
- **Começar com algo normal** que mostre quem são e onde estão (ex.: jogando futebol no videogame com o jogo na TV,
  gol, comemoração, resmungo de quem tomou o gol).
- **Causa antes do efeito**: trovão/relâmpago → alerta → todos pegam o celular → apagão. Nada acontece "do nada".
- Falas que explicam a lógica para o espectador (ex.: alguém nota que a hora não bate, ou que o outro não poderia saber aquilo).
- Perguntas óbvias que o público faria devem ser feitas pelos personagens (ex.: pedir a senha antes de abrir).

## 3. Gancho ("se" o gancho estiver fraco)
Se os primeiros 2–3 s não prendem — **visual** (cena parada, sem evento) ou **sonoro** (sem susto, sem fala forte) —
repetir o momento mais forte/clímax no início e depois voltar. Ver `references/gancho.md` e `scripts/gancho.mjs`.
Não usar quando o começo já é rápido — em especial na Parte 2+ de uma série, que abre direto na continuação do
cliffhanger. Na dúvida, entregar sem gancho e oferecer.

## 4. Iluminação trabalhada (ver `references/iluminacao.md`)
Cômodo escuro; toda luz tem fonte visível na história (janela/lua, relâmpago, TV, LED, tela do celular, lanterna).

## 5. Cenário
- Rico e coerente com quem mora ali (quarto de jovem: TV + videogame, PC, cadeira gamer, prateleira com livros/bonecos,
  bandeira de time, guarda-roupa, tapete, tênis no chão, mochila, fita de LED). Cômodo com espaço (≥ 4,5 × 4,5 m).
- **Nada estranho ou sem função**: sem cartaz esquisito, sem placa colada atrás da porta.
- **Nada ilógico**: ex.: sombra de pés embaixo da porta quando a luz da casa acabou (não há luz para fazer sombra).
- Exemplo pronto: `src/environments/teenRoom.js`.

## 6. Celular
Layout do **WhatsApp** (modo escuro): nome do remetente colorido EM CIMA da mensagem (grupo), hora + ✓✓ azul dentro do
balão, rabinho no primeiro balão, barra com microfone verde. Pesquisar prints reais quando mudar de app.
Componente: `src/engine/whatsapp.js` (`createWhatsPhone`, mesma interface de `createPhone`).

## 7. Vozes (ElevenLabs, outra IA ou a própria voz — pergunte; ver `audio.md` › "Fonte das vozes")
- Um take por personagem com todas as falas (voz consistente), direção em cada fala (no ElevenLabs, tags do eleven_v4).
- **Sussurro detalhado** sempre que a cena pede ([whispering, scared], [urgent whisper], [crying, whispering urgently]);
  depois da ameaça quase tudo é sussurrado. Efeito `sussurro` no corte.
- **Conversa natural**: resposta 0,1–0,3 s depois da fala anterior.
- **Reações**: resmungos, risadas, suspiros, susto ("Aaah, não, mano…" de quem toma gol, "Ai!" no trovão) + gesto visível.
- Cortar com `scripts/segmentos.mjs` (silencedetect) e conferir cada corte com `npm run transcreve -- saida.json arquivos...`.

## 8. Sons (ver `references/audio.md`, seção "Sons livres")
- Sons **reais e livres**: Wikimedia Commons (domínio público) e Freesound (CC0). Não usar gravação com música
  protegida ao fundo (ex.: torcida com "I Feel Good" tocando no estádio).
- Som que sai de aparelho (TV, rádio) **soa como aparelho**: mono, faixa estreita, médio realçado, reflexo do cômodo.
- Ambiente (chuva, torcida) **bem abaixo do diálogo** (≥ 10–12 dB); torcida curta (só o lance + ~4 s de gol).
- **Tensão na ameaça** (batida na porta etc.), bem de leve: grave seco no impacto + coração do protagonista mais rápido
  e um pouco mais forte (mesmo tom, `atempo`) + drone grave baixinho até o fim.
