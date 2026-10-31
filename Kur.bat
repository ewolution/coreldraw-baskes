@echo off
rem Baskes Payi - Windows installer
rem CorelDRAW'nun Scripts klasorune Baskes-Payi.js dosyasini kopyalar.
setlocal
title Baskes Payi - Kurulum
chcp 65001 >nul
pushd "%~dp0"

where powershell.exe >nul 2>nul
if errorlevel 1 (
  echo.
  echo HATA: PowerShell bulunamadi.
  echo Windows PowerShell 5.1 veya uzeri gerekli.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\install-windows.ps1" %*
set "RC=%ERRORLEVEL%"
popd

echo.
pause
exit /b %RC%
