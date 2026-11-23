#!/bin/bash
# Instalador da AnimaticSkill — Mac
# Como usar: abra o Terminal, arraste este arquivo para a janela e aperte Enter
# (ou rode:  bash instalar.sh)
set -e
DESTINO="$HOME/.claude/skills/animatic-skill"
ORIGEM="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "=== AnimaticSkill: instalação (Mac) ==="
echo ""

tem() { command -v "$1" >/dev/null 2>&1; }

# 0) Homebrew (instala os programas no Mac)
if ! tem brew; then
  read -r -p "O Homebrew não está instalado (ele instala os programas). Instalar agora? (s/n) " R
  if [[ "$R" =~ ^[sS] ]]; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || /usr/local/bin/brew shellenv)"
  fi
fi

# 1) Programas necessários
echo "1) Conferindo programas..."
for P in node ffmpeg python3; do
  if tem "$P"; then echo "  $P: ok"; else
    PKG="$P"; [ "$P" = "python3" ] && PKG="python"
    read -r -p "  $P não encontrado. Instalar agora com o Homebrew? (s/n) " R
    if [[ "$R" =~ ^[sS] ]]; then brew install "$PKG"; fi
  fi
done

# 2) Bibliotecas de Python (transcrição das falas)
echo ""
echo "2) Instalando bibliotecas de transcrição (faster-whisper, numpy)..."
python3 -m pip install --user --quiet faster-whisper numpy || python3 -m pip install --user --quiet --break-system-packages faster-whisper numpy || echo "  Não deu agora; rode este instalador de novo depois."

# 3) Copiar a skill para a pasta do Claude
echo ""
echo "3) Instalando a skill em $DESTINO"
if [ "$ORIGEM" != "$DESTINO" ]; then
  mkdir -p "$DESTINO"
  rsync -a --exclude .git --exclude node_modules --exclude out "$ORIGEM/" "$DESTINO/"
fi
echo "  ok"
echo ""
echo "Pronto! Abra o Claude Code e escreva, por exemplo:  quero criar uma série de terror na escola"
echo ""
