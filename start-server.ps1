# PowerShell 版: 必要に応じて Set-ExecutionPolicy が必要
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Structure Material Planner - Server"   -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Get-Command npm -ErrorAction SilentlyContinue) {
    if (-not (Test-Path "node_modules\vite")) {
        Write-Host "[npm] node_modules が無いのでインストールします ..." -ForegroundColor Yellow
        npm install
    }
    Write-Host "[npm] Vite を起動: http://localhost:3000/" -ForegroundColor Green
    npm run dev
    return
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "[python] http.server を起動: http://localhost:8000/" -ForegroundColor Green
    Start-Process "http://localhost:8000/"
    python -m http.server 8000
    return
}

Write-Host "npm も python も見つかりません" -ForegroundColor Red
Write-Host "  - Node.js : https://nodejs.org/"
Write-Host "  - Python  : https://www.python.org/downloads/"
Read-Host "Press Enter to exit"
