@echo off
echo ========================================
echo   SERVIDOR LOCAL PARA HEALTHY IA
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
cd /d "%~dp0"
python -m http.server 8000
pause

