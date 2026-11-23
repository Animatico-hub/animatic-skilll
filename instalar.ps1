# Instalador da AnimaticSkill — Windows
# Como usar: clique com o botão direito neste arquivo > "Executar com o PowerShell"
# (ou abra o PowerShell nesta pasta e rode:  powershell -ExecutionPolicy Bypass -File instalar.ps1)
$ErrorActionPreference = 'Stop'
$destino = Join-Path $env:USERPROFILE '.claude\skills\animatic-skill'
$origem = $PSScriptRoot
Write-Host "`n=== AnimaticSkill: instalação (Windows) ===`n" -ForegroundColor Cyan

function Tem($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Instalar($nome, $idWinget) {
  if (-not (Tem 'winget')) { Write-Host "  Instale o $nome manualmente (o winget não está disponível neste Windows)." -ForegroundColor Yellow; return }
  $r = Read-Host "  $nome não encontrado. Instalar agora? (s/n)"
  if ($r -match '^[sS]') { winget install --id $idWinget -e --accept-source-agreements --accept-package-agreements }
}

# 1) Programas necessários
Write-Host "1) Conferindo programas..."
if (Tem 'node') { Write-Host "  Node.js: ok ($(node --version))" } else { Instalar 'Node.js' 'OpenJS.NodeJS.LTS' }
if (Tem 'ffmpeg') { Write-Host "  FFmpeg: ok" } else { Instalar 'FFmpeg' 'Gyan.FFmpeg' }
$py = @('python', 'py') | Where-Object { (Tem $_) -and ((& $_ --version 2>&1) -match 'Python 3') } | Select-Object -First 1
if ($py) { Write-Host "  Python: ok ($(& $py --version 2>&1))" } else { Instalar 'Python 3' 'Python.Python.3.12'; $py = 'python' }

# 2) Bibliotecas de Python (transcrição das falas)
Write-Host "`n2) Instalando bibliotecas de transcrição (faster-whisper, numpy)..."
try { & $py -m pip install --user --quiet faster-whisper numpy; Write-Host "  ok" }
catch { Write-Host "  Não deu para instalar agora. Depois de reiniciar o computador, rode este instalador de novo." -ForegroundColor Yellow }

# 3) Copiar a skill para a pasta do Claude
Write-Host "`n3) Instalando a skill em $destino"
if ($origem -ne $destino) {
  New-Item -ItemType Directory -Force $destino | Out-Null
  robocopy $origem $destino /E /XD .git node_modules out /NFL /NDL /NJH /NJS /NP | Out-Null
}
Write-Host "  ok"
Write-Host "`nPronto! Abra o Claude Code e escreva, por exemplo:  quero criar uma série de terror na escola" -ForegroundColor Green
Write-Host "Se algum programa foi instalado agora, feche e abra o Claude Code (ou reinicie o computador).`n"
