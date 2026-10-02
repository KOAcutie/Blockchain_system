# SSC Transparency — Start Complete Backend Stack (PostgreSQL 16 + Python FastAPI + Laravel API)
$ErrorActionPreference = "Stop"

# Ensure portable PHP, PostgreSQL, and Python 3.12 are on PATH
$env:Path = "C:\Users\ADMIN\AppData\Local\Programs\php;C:\Users\ADMIN\AppData\Local\Programs\pgsql\bin;C:\Users\ADMIN\AppData\Local\Programs\python312\tools;C:\Users\ADMIN\AppData\Local\Programs\python312\tools\Scripts;" + $env:Path

# 1. Start PostgreSQL 16 on 127.0.0.1:5432 if not running
& "$PSScriptRoot\start-postgres.ps1"

# 2. Start Python FastAPI Blockchain Service on 127.0.0.1:8001 if not running
$fastApiRunning = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
if (-not $fastApiRunning) {
    Write-Host "Starting Python FastAPI Blockchain Service on http://127.0.0.1:8001 ..." -ForegroundColor Cyan
    Start-Process -FilePath "C:\Users\ADMIN\AppData\Local\Programs\python312\tools\python.exe" `
        -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload" `
        -WorkingDirectory "$PSScriptRoot\blockchain-api" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "Python FastAPI Blockchain Service is already running on 127.0.0.1:8001!" -ForegroundColor Green
}

# 3. Start Laravel Primary Backend API on http://127.0.0.1:8000
Write-Host "Starting Laravel Primary Backend API on http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
php artisan serve --host=127.0.0.1 --port=8000
