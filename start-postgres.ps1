# SSC Transparency — PostgreSQL 16 & Environment Starter Script
# Adds PostgreSQL, PHP, and Python to the current terminal PATH and verifies/starts PostgreSQL 16 on 127.0.0.1:5432.

$ErrorActionPreference = "Continue"
$pgBin = "C:\Users\ADMIN\AppData\Local\Programs\pgsql\bin"
$phpBin = "C:\Users\ADMIN\AppData\Local\Programs\php"
$pyBin = "C:\Users\ADMIN\AppData\Local\Programs\python312\tools"
$pyScripts = "C:\Users\ADMIN\AppData\Local\Programs\python312\tools\Scripts"
$pgData = "C:\Users\ADMIN\AppData\Local\Programs\pgsql\data"
$pgLog = "C:\Users\ADMIN\AppData\Local\Programs\pgsql\postgres.log"

# Ensure tools are available in the current PowerShell session immediately
foreach ($dir in @($pgBin, $phpBin, $pyBin, $pyScripts)) {
    if ((Test-Path $dir) -and ($env:Path -notlike "*$dir*")) {
        $env:Path = "$dir;$env:Path"
    }
}

Write-Host "Checking PostgreSQL on 127.0.0.1:5432..." -ForegroundColor Cyan

& "$pgBin\pg_isready.exe" -h 127.0.0.1 -p 5432 -U ssc_user -d ssc_transparency 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "PostgreSQL 16 (ssc_transparency) is already running on 127.0.0.1:5432!" -ForegroundColor Green
    & "$pgBin\psql.exe" -U ssc_user -h 127.0.0.1 -p 5432 -d ssc_transparency -c "\dt"
    exit 0
}

# Try Docker Compose first if Docker daemon is reachable
docker info > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Starting Docker PostgreSQL container (ssc_postgres)..." -ForegroundColor Cyan
    docker compose up -d postgres
    exit 0
}

# Otherwise start local PostgreSQL 16 server
Write-Host "Starting local PostgreSQL 16.4 server on 127.0.0.1:5432..." -ForegroundColor Cyan
& "$pgBin\pg_ctl.exe" -D $pgData -l $pgLog start
Start-Sleep -Seconds 2
& "$pgBin\psql.exe" -U ssc_user -h 127.0.0.1 -p 5432 -d ssc_transparency -c "\dt"
Write-Host "PostgreSQL 16.4 started on 127.0.0.1:5432 (DB: ssc_transparency, User: ssc_user)." -ForegroundColor Green
