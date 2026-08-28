Write-Host "AutoDirector AI local setup" -ForegroundColor Cyan
if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) { Write-Host "Install Ollama: https://ollama.com/download" -ForegroundColor Yellow; exit 1 }
ollama pull qwen2.5:7b
Set-Location server
npm install
Write-Host "Start ComfyUI on port 8188 and install Piper + FFmpeg, then run: npm start" -ForegroundColor Green
