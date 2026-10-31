#Requires -Version 5.1
<#
    Baskes Payi - CorelDRAW Windows kurulum / kaldirma

    Kur.bat ve Kaldir.bat bu betigi cagirir. Elle calistirmak icin:

        powershell -NoProfile -ExecutionPolicy Bypass -File tools\install-windows.ps1

    Secenekler:
        -Uninstall       Betigi kaldirir.
        -DryRun          Hicbir sey yazmadan ne yapilacagini gosterir.
        -AppDataRoot     Corel klasorunu elle belirtir (test icin).
#>
[CmdletBinding()]
param(
    [switch]$Uninstall,
    [switch]$DryRun,
    [string]$AppDataRoot
)

$ErrorActionPreference = 'Stop'

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

$ScriptName = 'Baskes-Payi.js'
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$Source     = Join-Path $RepoRoot $ScriptName

Write-Host ''
Write-Host '==============================================' -ForegroundColor DarkGray
Write-Host $(if ($Uninstall) { '  Baskes Payi - CorelDRAW - Kaldirma' } else { '  Baskes Payi - CorelDRAW - Kurulum' }) -ForegroundColor White
Write-Host '==============================================' -ForegroundColor DarkGray
Write-Host ''

if ($DryRun) {
    Write-Host 'DENEME MODU: hicbir dosya degistirilmeyecek.' -ForegroundColor Yellow
    Write-Host ''
}

if (-not $Uninstall -and -not (Test-Path -LiteralPath $Source)) {
    Write-Host "HATA: '$ScriptName' bulunamadi:" -ForegroundColor Red
    Write-Host "  $Source" -ForegroundColor Red
    Write-Host ''
    exit 1
}

if ([string]::IsNullOrWhiteSpace($AppDataRoot)) {
    $AppDataRoot = Join-Path $env:APPDATA 'Corel'
}

if (-not (Test-Path -LiteralPath $AppDataRoot)) {
    Write-Host 'CorelDRAW klasoru bulunamadi:' -ForegroundColor Red
    Write-Host "  $AppDataRoot" -ForegroundColor Red
    Write-Host ''
    Write-Host "CorelDRAW'i bir kez acip kapatın, sonra yeniden calistirin." -ForegroundColor Yellow
    exit 1
}

$pattern = '^(CorelDRAW Graphics Suite|CorelDRAW Technical Suite|CorelDRAW Essentials)\s+\d{4}$'

$targets = @(
    Get-ChildItem -LiteralPath $AppDataRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match $pattern } |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'Draw') } |
        Sort-Object -Property Name
)

if ($targets.Count -eq 0) {
    Write-Host "CorelDRAW surum klasoru bulunamadi:" -ForegroundColor Red
    Write-Host "  $AppDataRoot" -ForegroundColor Red
    Write-Host ''
    Write-Host "CorelDRAW'i bir kez acip kapatın, sonra yeniden calistirin." -ForegroundColor Yellow
    exit 1
}

$running = @(Get-Process -Name 'CorelDRW' -ErrorAction SilentlyContinue)
if ($running.Count -gt 0 -and -not $Uninstall) {
    Write-Host 'Not: CorelDRAW acik. Dosya kopyalanir, ancak listenin yenilenmesi icin' -ForegroundColor Yellow
    Write-Host "     CorelDRAW'i yeniden baslatin (once acik isinizi kaydedin)." -ForegroundColor Yellow
    Write-Host ''
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$count = 0
$last  = $null

foreach ($target in $targets) {
    $scriptsDir = Join-Path $target.FullName 'Draw\Scripts'
    $dest       = Join-Path $scriptsDir $ScriptName
    $last       = $scriptsDir

    Write-Host $target.Name -ForegroundColor Cyan
    Write-Host "  $scriptsDir"

    if ($Uninstall) {
        if (Test-Path -LiteralPath $dest) {
            if ($DryRun) {
                Write-Host "  silinecek: $ScriptName" -ForegroundColor DarkGray
            } else {
                Remove-Item -LiteralPath $dest -Force
                Write-Host '  silindi' -ForegroundColor Green
                $count++
            }
        } else {
            Write-Host '  bu surumde kurulu degil' -ForegroundColor DarkGray
        }
        continue
    }

    if (-not (Test-Path -LiteralPath $scriptsDir)) {
        if ($DryRun) {
            Write-Host '  (klasor olusturulacak)' -ForegroundColor DarkGray
        } else {
            New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
        }
    }

    if ((Test-Path -LiteralPath $dest) -and -not $DryRun) {
        $backupDir = Join-Path $env:LOCALAPPDATA ("BaskesPayi\backup\{0}\{1}" -f $stamp, $target.Name)
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Copy-Item -LiteralPath $dest -Destination (Join-Path $backupDir $ScriptName) -Force
        Write-Host "  Yedek: $backupDir" -ForegroundColor DarkGray
    }

    if ($DryRun) {
        Write-Host "  kopyalanacak: $ScriptName" -ForegroundColor DarkGray
        $count++
        continue
    }

    Copy-Item -LiteralPath $Source -Destination $dest -Force
    Write-Host '  kuruldu' -ForegroundColor Green
    $count++
}

Write-Host ''

if ($Uninstall) {
    if ($count -eq 0) {
        Write-Host 'Kaldirilacak dosya bulunamadi (zaten kurulu degil).' -ForegroundColor Yellow
    } else {
        Write-Host "Kaldirma tamam: $count surum." -ForegroundColor Green
        Write-Host "CorelDRAW'i yeniden baslatin."
    }
    Write-Host ''
    exit 0
}

Write-Host "Kurulum tamam: $count surum." -ForegroundColor Green
Write-Host ''
Write-Host 'Kullanim:' -ForegroundColor White
Write-Host "  1. CorelDRAW'i yeniden baslatin (once acik isinizi kaydedin)."
Write-Host "  2. Araclar > Komut Dosyalari > Komut Dosyalari (Alt+Shift+F11)"
Write-Host '  3. Solda JavaScript > User Scripts secin.'
Write-Host '  4. Baskes-Payi betigini cift tiklayin.'
Write-Host ''
Write-Host 'Betik listede yoksa Scripts panelindeki Load dugmesiyle su klasoru gosterin:' -ForegroundColor DarkGray
Write-Host "  $last" -ForegroundColor DarkGray
Write-Host ''
exit 0
