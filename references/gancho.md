# Gancho: clímax no início ("se" o começo estiver fraco)

Regra do usuário (22/11/2026): **se** o gancho estiver fraco — auditivo ou visual — usar a estratégia de colocar o
clímax/momento mais forte no início para gerar curiosidade, depois voltar e começar o vídeo normalmente.

## Como decidir se está fraco
Olhe os 3 primeiros segundos do vídeo final (folha `qa_semsom.jpg` + medição de volume):
- **Visual fraco**: nenhum evento na tela (só gente sentada/conversando), sem banner/alerta, sem susto, sem movimento forte.
- **Sonoro fraco**: nada acima do diálogo normal nos 3 s (sem trovão, alerta, grito, batida), ou fala banal.
- Se o momento mais forte do vídeo está depois dos ~8 s → gancho fraco → aplicar.
Se o vídeo já abre no clímax/susto, NÃO aplicar (não repetir à toa).
**Parte 2 em diante de uma série: em geral NÃO aplicar.** A parte abre direto na continuação do cliffhanger (selo
"VOCÊ ESCOLHEU" + a ação da escolha, ex.: mão na chave + "Não. Eu não vou abrir."): isso já é um gancho rápido. O usuário
corrigiu isso em 22/11/2026 ("antecipou o clímax sem necessidade"). Na dúvida, entregue SEM gancho e ofereça.

## Como fazer (`scripts/gancho.mjs`)
```
node scripts/gancho.mjs out/ep_final.mp4 out/ep_gancho.mp4 <inicio> <fim>
```
1. Escolha 4–6 s do momento mais forte (exemplo: 12,2–17,3 s = relâmpago, trovão, alerta em todos os celulares,
   todos pegam o celular, "Chegou no meu também!"). Comece ~0,2 s antes do evento visual e termine numa fala que deixa pergunta.
2. O script põe o trecho no início, faz um **rebobinar** de 0,7 s (trecho de trás para frente 7×, cor lavada, ruído,
   linha de VHS, som rebobinando) com o texto **"<< POUCO ANTES…"** (Arial Black; emoji ⏪ não existe na fonte)
   e emenda o vídeo inteiro.
3. Rode o QA de novo (a cartela continua sendo achada pelo preto final).
O vídeo fica ~6 s mais longo — ok para o usuário.
