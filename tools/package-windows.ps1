#Requires -Version 5.1
<#
    Baskes Payi - Windows paketleme

    dist/ altinda iki dosya uretir:
      Coreldraw-Baskes-Kur-<surum>.bat     tek dosya kurulum (kendini acar)
      Coreldraw-Baskes-Windows-<surum>.zip klasor paketi (Kur.bat + betik)

    Kullanim:
        powershell -NoProfile -ExecutionPolicy Bypass -File tools\package-windows.ps1
        powershell ... -File tools\package-windows.ps1 -Version 1.0.1
#>
[CmdletBinding()]
param([string]$Version)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$JsPath   = Join-Path $RepoRoot 'Baskes-Payi.js'
$Dist     = Join-Path $RepoRoot 'dist'

if (-not (Test-Path -LiteralPath $JsPath)) {
    throw "Baskes-Payi.js bulunamadi: $JsPath"
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    $m = Select-String -LiteralPath $JsPath -Pattern 'var\s+SURUM\s*=\s*"([^"]+)"' | Select-Object -First 1
    if ($m) { $Version = $m.Matches[0].Groups[1].Value } else { $Version = '0.0.0' }
}

New-Item -ItemType Directory -Path $Dist -Force | Out-Null

# ----------------------------------------------------------------------
# 1) Tek dosya kurulum (.bat, kendini acar)
# ----------------------------------------------------------------------

$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($JsPath))
$chunks = @()
for ($i = 0; $i -lt $b64.Length; $i += 76) {
    $chunks += $b64.Substring($i, [Math]::Min(76, $b64.Length - $i))
}

$sb = New-Object System.Text.StringBuilder
function Add-Line([string]$s) { [void]$sb.AppendLine($s) }

Add-Line '@echo off'
Add-Line 'setlocal EnableDelayedExpansion'
Add-Line 'chcp 65001 >nul'
Add-Line 'title CorelDRAW - Baskes Payi Kurulum'
Add-Line 'echo.'
Add-Line 'echo  ==========================================='
Add-Line 'echo   CorelDRAW - Baskes Payi (Bleed) Kurulumu'
Add-Line ("echo   v$Version")
Add-Line 'echo  ==========================================='
Add-Line 'echo.'
Add-Line ''
Add-Line 'set "B64=%TEMP%\baskes-payi.b64"'
Add-Line 'set "JS=%TEMP%\Baskes-Payi.js"'
Add-Line 'if exist "%JS%" del "%JS%" >nul 2>&1'
Add-Line ''
Add-Line '> "%B64%" ('
foreach ($c in $chunks) { Add-Line ("echo " + $c) }
Add-Line ')'
Add-Line ''
Add-Line 'certutil -f -decode "%B64%" "%JS%" >nul 2>&1'
Add-Line 'if not exist "%JS%" goto FAIL'
Add-Line ''
Add-Line 'set /a COUNT=0'
Add-Line 'for /d %%V in ("%APPDATA%\Corel\CorelDRAW Graphics Suite*") do ('
Add-Line '  if exist "%%~V\Draw" ('
Add-Line '    if not exist "%%~V\Draw\Scripts" mkdir "%%~V\Draw\Scripts" >nul 2>&1'
Add-Line '    copy /y "%JS%" "%%~V\Draw\Scripts\Baskes-Payi.js" >nul'
Add-Line '    if not errorlevel 1 ('
Add-Line '      echo   OK: %%~nxV'
Add-Line '      set /a COUNT+=1'
Add-Line '    )'
Add-Line '  )'
Add-Line ')'
Add-Line ''
Add-Line 'if "!COUNT!"=="0" goto NOCOREL'
Add-Line 'echo.'
Add-Line 'echo Kurulum tamam: !COUNT! surum.'
Add-Line 'echo.'
Add-Line 'echo  1. CorelDRAW i yeniden baslatin ^(once acik isinizi kaydedin^).'
Add-Line 'echo  2. Araclar ^> Komut Dosyalari ^> Komut Dosyalari  ^(Alt+Shift+F11^)'
Add-Line 'echo  3. JavaScript ^> User Scripts ^> Baskes-Payi'
Add-Line 'echo.'
Add-Line 'goto END'
Add-Line ''
Add-Line ':NOCOREL'
Add-Line 'echo.'
Add-Line 'echo HATA: CorelDRAW klasoru bulunamadi.'
Add-Line 'echo CorelDRAW i bir kez acip kapatip tekrar deneyin.'
Add-Line 'echo.'
Add-Line 'goto END'
Add-Line ''
Add-Line ':FAIL'
Add-Line 'echo.'
Add-Line 'echo HATA: betik cozulemedi ^(certutil^).'
Add-Line 'echo.'
Add-Line ''
Add-Line ':END'
Add-Line 'if exist "%B64%" del "%B64%" >nul 2>&1'
Add-Line 'if exist "%JS%" del "%JS%" >nul 2>&1'
Add-Line 'echo.'
Add-Line 'pause'
Add-Line 'exit /b 0'

$batPath = Join-Path $Dist ("Coreldraw-Baskes-Kur-{0}.bat" -f $Version)
[IO.File]::WriteAllText($batPath, $sb.ToString(), [Text.Encoding]::ASCII)
Write-Host "tek dosya kurulum: $batPath" -ForegroundColor Green

# ----------------------------------------------------------------------
# 2) Klasor paketi (zip)
# ----------------------------------------------------------------------

$stage = Join-Path $Dist 'pkg\Coreldraw-Baskes'
if (Test-Path -LiteralPath (Join-Path $Dist 'pkg')) {
    Remove-Item -LiteralPath (Join-Path $Dist 'pkg') -Recurse -Force
}
New-Item -ItemType Directory -Path (Join-Path $stage 'tools') -Force | Out-Null

$files = @(
    'Baskes-Payi.js',
    'Kur.bat',
    'Kaldir.bat',
    'README.md',
    'README.en.md',
    'tools\install-windows.ps1'
)
foreach ($f in $files) {
    $src = Join-Path $RepoRoot $f
    if (-not (Test-Path -LiteralPath $src)) { throw "eksik dosya: $f" }
    Copy-Item -LiteralPath $src -Destination (Join-Path $stage $f) -Force
}

$zipPath = Join-Path $Dist ("Coreldraw-Baskes-Windows-{0}.zip" -f $Version)
if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
Compress-Archive -LiteralPath $stage -DestinationPath $zipPath -Force
Remove-Item -LiteralPath (Join-Path $Dist 'pkg') -Recurse -Force

Write-Host "zip paketi       : $zipPath" -ForegroundColor Green
Write-Host ''
Write-Host ("Surum: " + $Version)
