# Iluminação trabalhada (aprovada pelo titular, 20/11/2026)

O usuário quer cômodos **escuros** e luz **motivada**: cada luz tem uma fonte que existe na história.
Ferramentas no motor (`engine/render.js`): `createRenderer(canvas, w, h, {shadows, bloom, threshold, vignette})`.

## Receita (quarto à noite)
| Fonte | Como | Valores que funcionaram |
|---|---|---|
| Ambiente | `HemisphereLight(0x33426e, 0x07080d)` | 0,38 (sobe com o relâmpago) |
| Lua pela janela | `SpotLight` logo atrás da janela, apontando para o chão do meio do quarto, **com `map` (cookie) desenhando a cruz da janela** e `castShadow` (2048, bias −0,0008) | cor 0x9db4ff, 9, alcance 9, ângulo 0,62, penumbra 0,55, decay 1 |
| Relâmpago | multiplica a lua (+60) e o ambiente (+1,6) por 0,7 s com dupla piscada; `createWindowFx().update(t,{flashes})` clareia o céu | trovão forte 0,15–0,2 s depois (raio perto) ou ~1,2 s (longe) |
| TV (antes do apagão) | `PointLight` na frente da tela, cor do jogo (verde gramado; amarelo no gol) com leve oscilação | 2,2 (+1,2 no gol), alcance 5,5 |
| LED do teto / PC | `PointLight` roxo fraco + materiais emissivos | 2,2 roxo; apagam no apagão |
| Tela do celular na mão | `PointLight` pequeno à frente da tela (0,22 m), FRACO | 0,06–0,2, alcance 0,9, decay 2 (forte demais estoura o braço) |
| Lanterna do celular | `SpotLight` preso à câmera, saindo de baixo/direita, mirando um pouco abaixo do centro; desliga durante o close do celular | 2,2, ângulo 0,55, penumbra 0,65 |

## Regras
- **Sombras**: depois de montar a cena, `scene.traverse` → todo `MeshToonMaterial` com `castShadow`/`receiveShadow`.
  Só a lua projeta sombra (custo).
- **Bloom só no que emite luz**: telas, LEDs e despertador com cor **> 1** (HDR, ex.: `color.setScalar(1.6)`); threshold 1,05.
  O branco dos olhos (MeshBasic 1,0) NÃO pode brilhar — com threshold baixo os personagens ficam com "olho de fantasma".
- Vinheta 0,35 escurece as bordas (cômodo escuro).
- Personagens sempre legíveis: no escuro, rosto iluminado por tela/lua/lanterna — nunca um borrão preto.
- Cena da porta no escuro: a lanterna ilumina a porta (maçaneta e chave visíveis).
- Antes do apagão já é penumbra (TV + LED); depois do apagão sobram lua, relâmpagos, telas e lanterna.
