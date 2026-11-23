# Cenários — simples, específicos e coerentes

Pergunte sempre: que lugar é? o que obrigatoriamente existe nele? o que o torna crível? o que ajuda a contar a história?
o que a câmera realmente vai mostrar? Detalhe só o que aparece; nada de objetos inúteis nem espaços vazios demais.

## Peças prontas (`engine/props.js`)
- `sign(w, h, {title, sub, band, bandColor, bg, fg})` — placa institucional (sala, setor, número, aviso).
- `paper(w, h, {title, lines:[{text, size, bold, color}], accent, tilt})` — folha impressa (aviso, escala, regra).
- `postIt(['linha 1','linha 2'], {color, tilt, size})` — recado manuscrito.
- `wallClock({radius, time:[h,m,s]})` → `{group, update(t)}` — relógio com marcações, números e ponteiros que andam.
- `badge({company, name, role, color, w, h})` — crachá (também como acessório do personagem: `badge: {name, role}`).
- `panel(w, h, draw)` / `canvasTexture` — qualquer superfície com texto/desenho próprio.
Painéis colados em parede ficam 1–3 cm à frente dela; a face (+Z local) aponta para dentro da sala.
Texto: nomes curtos, PT-BR, nada de placa vazia ou genérica. Use um nome fictício de empresa/prédio consistente no episódio.

## Checklists por lugar (escolha só o que a câmera vê)
- **Escola:** nome/número da sala, relógio, quadro com matéria e horário, provas/folhas, mural, armários, cartazes, lixeira, avisos.
- **Hospital:** placas de setor, recepção, "SILÊNCIO", cadeiras em fileira, portas identificadas, luz fria, maca/equipamentos simples, dispenser de álcool.
- **Portaria:** nome do prédio, livro de registro, monitores de câmera, interfone, aviso a visitantes, quadro de chaves, balcão, cadeira.
- **Casa:** porta com fechadura, tapete, interruptores, quadros/retratos, objetos pessoais, luminária, calendário, mesa, sinais de que alguém mora ali.
- **Supermercado:** placas de corredor, etiquetas de preço, promoções, cestas, caixas, freezer, prateleiras com produtos.
- **Prisão:** número da cela, sinalização de corredor, grades, cama, pia, vaso, luz fria, marcas de uso, placas institucionais.
- **Escritório/copa (exemplo pronto):** placa "COPA · 3º ANDAR", relógio, mural com regras, micro-ondas, cafeteira, geladeira com avisos, porta identificada com leitor de crachá.

## Iluminação por clima
`normal` (neutra/quente, tudo legível) · `tension` (mais fria, menos intensa) · `darkness` (escura, personagens ainda legíveis).
Emergência: use a mesma base e adicione uma fonte localizada (azul/vermelha) só se a cena pedir.

## Performance
Reutilize materiais e geometrias (`G.*` e caches de `toon`/`flat`), texturas de canvas pequenas, poucas luzes, sem sombras projetadas
salvo necessidade, `InstancedMesh` para repetição grande (cadeiras de auditório, prateleiras cheias).
