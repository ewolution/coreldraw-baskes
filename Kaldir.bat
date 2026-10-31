@echo off
rem Baskes Payi - Windows uninstaller
rem Baskes-Payi.js dosyasini CorelDRAW Scripts klasorlerinden siler.
setlocal
title Baskes Payi - Kaldirma
chcp 65001 >nul
pushd "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\install-windows.ps1" -Uninstall %*
set "RC=%ERRORLEVEL%"
popd

echo.
pause
exit /b %RC%
