#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Set up PostgreSQL database, run EF Core migrations, and configure backups.
#>

$ErrorActionPreference = "Stop"
$pgBin = Join-Path $PG_INSTALL_PATH "bin"

# ─────────────────────────────────────────────────────────────────
#  1. Verify PostgreSQL is running
# ─────────────────────────────────────────────────────────────────
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Cyan
$env:PGPASSWORD = $PG_PASSWORD

$pgReady = & "$pgBin\pg_isready" -h $PG_HOST -p $PG_PORT 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "PostgreSQL is not running on ${PG_HOST}:${PG_PORT}. Please start the service."
}
Write-Host "  PostgreSQL is ready." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  2. Create database and user if they don't exist
# ─────────────────────────────────────────────────────────────────
Write-Host "Ensuring database and user exist..." -ForegroundColor Cyan

# Check if user exists
$userExists = & "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$PG_USER'" 2>$null
if ($userExists -ne "1") {
    Write-Host "  Creating user: $PG_USER"
    & "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -c "CREATE USER $PG_USER WITH PASSWORD '$PG_PASSWORD';"
    & "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -c "ALTER USER $PG_USER CREATEDB;"
} else {
    Write-Host "  User $PG_USER already exists." -ForegroundColor DarkGray
}

# Check if database exists
$dbExists = & "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$PG_DATABASE'" 2>$null
if ($dbExists -ne "1") {
    Write-Host "  Creating database: $PG_DATABASE"
    & "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -c "CREATE DATABASE $PG_DATABASE OWNER $PG_USER ENCODING 'UTF8';"
} else {
    Write-Host "  Database $PG_DATABASE already exists." -ForegroundColor DarkGray
}

# Grant privileges
& "$pgBin\psql" -h $PG_HOST -p $PG_PORT -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $PG_DATABASE TO $PG_USER;" 2>$null

Write-Host "  Database setup complete." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  3. Run EF Core Migrations
# ─────────────────────────────────────────────────────────────────
Write-Host "Running EF Core migrations..." -ForegroundColor Cyan

$apiProjectPath = Join-Path $UOH_REPO_ROOT "apps\api\UohMeetings.Api"

# Set connection string as environment variable for migrations
$env:ConnectionStrings__Postgres = $PG_CONNECTION_STRING

Push-Location $apiProjectPath
try {
    # Check if dotnet-ef tool is installed
    $efCheck = dotnet tool list -g 2>$null | Select-String "dotnet-ef"
    if (-not $efCheck) {
        Write-Host "  Installing dotnet-ef tool..."
        dotnet tool install --global dotnet-ef
    }

    Write-Host "  Applying migrations to $PG_DATABASE..."
    dotnet ef database update --project "$apiProjectPath\UohMeetings.Api.csproj" --no-build 2>$null
    if ($LASTEXITCODE -ne 0) {
        # If --no-build fails, try with build
        Write-Host "  Building and applying migrations..."
        dotnet ef database update --project "$apiProjectPath\UohMeetings.Api.csproj"
    }
    Write-Host "  Migrations applied successfully." -ForegroundColor Green
} finally {
    Pop-Location
    Remove-Item Env:\ConnectionStrings__Postgres -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# ─────────────────────────────────────────────────────────────────
#  4. Setup scheduled backup (Windows Task Scheduler)
# ─────────────────────────────────────────────────────────────────
Write-Host "Configuring scheduled database backup..." -ForegroundColor Cyan

$backupScript = @"
`$env:PGPASSWORD = "$PG_PASSWORD"
`$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
`$backupFile = "$UOH_BACKUP_PATH\uoh_meetings_`$timestamp.dump"
& "$pgBin\pg_dump" -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DATABASE -Fc -f `$backupFile
# Remove backups older than $BACKUP_RETENTION_DAYS days
Get-ChildItem "$UOH_BACKUP_PATH\*.dump" | Where-Object { `$_.LastWriteTime -lt (Get-Date).AddDays(-$BACKUP_RETENTION_DAYS) } | Remove-Item -Force
"@

$backupScriptPath = Join-Path $UOH_BACKUP_PATH "Run-Backup.ps1"
Set-Content -Path $backupScriptPath -Value $backupScript -Encoding UTF8

# Create scheduled task
$taskName = "UOH-Database-Backup"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $existingTask) {
    $action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScriptPath`""
    $trigger = New-ScheduledTaskTrigger -Daily -At $BACKUP_DAILY_TIME
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Description "Daily backup of UOH Meetings PostgreSQL database" | Out-Null
    Write-Host "  Scheduled task created: $taskName (daily at $BACKUP_DAILY_TIME)" -ForegroundColor Green
} else {
    Write-Host "  Scheduled task already exists: $taskName" -ForegroundColor DarkGray
}

Write-Host "  Database setup and backup configuration complete." -ForegroundColor Green
