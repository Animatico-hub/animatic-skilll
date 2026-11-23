# Banco de temas — como sugerir séries novas (modo guiado)

Base: a fórmula dos episódios que viralizaram no canal do titular (as séries dele não vêm na skill e não podem ser continuadas).
Sugira sempre **3 premissas originais** para o tema pedido, cada uma com: título curto, gancho dos 3 primeiros segundos,
regra/aviso do mundo, ameaça, a pista justa, a escolha final (2 opções de 1–3 palavras) e o cenário pronto que vai usar.
Nunca copie uma série existente nem um jogo/filme/série famoso; use só a fórmula.

## A fórmula que funciona
**Lugar cotidiano** (todo mundo conhece) + **algo normal acontecendo** (jogo, prova, fechamento do caixa)
→ **aviso/regra** que chega por um aparelho (alerta no celular, sinal da escola, alto-falante, lousa, rádio)
→ **alguém conhecido do outro lado da porta** pedindo para entrar
→ **um segundo canal contradiz** (mensagem, ligação, rádio: "não sou eu")
→ **uma pista justa** que o público pode pegar ao rever
→ **escolha binária** explicada em fala ("Abre! É ele!" × "Não abre. Espera!").
O medo vem da confiança (quem é quem), não de monstro. Funciona para adulto e para criança.

## Lugares com cenário pronto (use estes primeiro — mais rápido)
| Lugar | Cenário | Onde |
|---|---|---|
| Quarto de jovem à noite | `createTeenRoom()` (TV com jogo, PC, janela de chuva, porta com chave) | `template/src/environments/teenRoom.js` |
| Escritório / copa | `createBreakRoom()` | `template/src/environments/breakRoom.js` |
| Sala de aula | `classroom.js` | `template/referencias_visuais/escola/classroom.js` |
| Corredor de escola / portaria | `createHall()` | `template/referencias_visuais/escola/hall.js` |
| Pátio externo de dia | `yard.js` | `template/referencias_visuais/escola/yard.js` |
| Supermercado fechando | `supermarket.js` + `room.js` | `template/referencias_visuais/supermercado/` |
| Prisão / casa (outro motor) | `PrisonCell`, `CellBlock`, `House`… | `template/referencias_visuais/prisao_lowpoly/components/environments/` (portar) |
Lugar sem cenário pronto: monte um novo seguindo `references/cenarios.md` e as regras de cenário (rico, coerente, sem nada estranho).

## Temas prontos para sugerir (originais — adapte ao pedido)
| Tema | Gancho (0–3 s) | Regra / ameaça | Pista | Escolha |
|---|---|---|---|---|
| Elevador do prédio | o elevador para entre andares e a luz pisca | o interfone avisa "não abram a porta de emergência"; o síndico bate no teto chamando seu nome | o síndico nunca soube seu nome | ABRIR O TETO × ESPERAR |
| Ônibus escolar à noite | o motorista para no meio da estrada e desliga os faróis | rádio da empresa: "não deixem ninguém subir"; a mãe de um aluno bate na porta | ela está de chinelo seco na chuva | ABRIR A PORTA × FICAR QUIETO |
| Acampamento | a lanterna de todos apaga ao mesmo tempo | o monitor: "ninguém sai da barraca até o apito"; o amigo chama de fora | o amigo está dormindo do seu lado | SAIR × FICAR |
| Hospital de madrugada | o monitor de batimentos do paciente ao lado zera | aviso no corredor: "não atenda a campainha do quarto 9"; a campainha toca | o quarto 9 está vazio no quadro | ATENDER × IGNORAR |
| Loja de conveniência 24 h | um cliente compra exatamente o que você ia comprar | a câmera da loja mostra alguém atrás de você; o gerente liga dizendo que está em casa | o gerente está na câmera | OLHAR PARA TRÁS × SAIR CORRENDO |
| Aula online | a câmera de um colega mostra o seu quarto | o professor manda todos desligarem a câmera; seu irmão bate na porta | seu irmão está viajando | ABRIR × DESLIGAR TUDO |
| Condomínio sem luz | o grupo do prédio recebe áudios de vizinhos pedindo socorro | o síndico: "ninguém sai do apartamento"; sua vizinha idosa bate | ela usa o apelido que só sua avó usava | ABRIR × ESPERAR |
| Excursão da escola | o ônibus volta e falta um aluno na contagem | a professora conta de novo e sobra um | o aluno a mais não aparece na foto da turma | CONTAR DE NOVO × AVISAR |
| Jogo online com amigos | o personagem de um amigo fala com a voz da sua mãe | o jogo manda "não abra a porta do quarto" no chat | a mensagem chegou com o jogo fechado | TIRAR O FONE × CONTINUAR |
| Trabalho noturno (portaria) | o monitor mostra você mesmo na câmera da entrada | o rádio do vigia: "ninguém entra depois da meia-noite"; o morador do 302 chega | o 302 está para alugar | ABRIR O PORTÃO × CHAMAR A POLÍCIA |

## Como apresentar as sugestões (modo guiado)
Mostre as 3 premissas em linguagem simples, sem termos técnicos, cada uma em 3–4 linhas: título, o que acontece, por que
prende, como termina (a escolha). Pergunte qual seguir (ou se mistura duas). Depois da escolha: roteiro completo com
verdade oculta → prévias → aprovação → vozes → produção (fluxo do SKILL.md).
