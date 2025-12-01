# Servidor Local para Healthy IA
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVIDOR LOCAL PARA HEALTHY IA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando servidor en http://localhost:8000" -ForegroundColor Green
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Yellow
Write-Host ""

# Cambiar al directorio del script
Set-Location $PSScriptRoot

# Iniciar servidor HTTP
python -m http.server 8000

