#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Validate the UOH Meetings Platform deployment health.
.DESCRIPTION
    Checks API health endpoint, Web site, database, Redis, and SignalR hubs.
#>

$ErrorActionPreference = "Continue"
$passed = 0
$failed = 0
$warnings = 0

function Test-Check {
    param([string]$Name, [scriptblock]$Check)
    Write-Host "  Checking: $Name..." -NoNewline
    try {
        $result = & $Check
        if ($result) {
            Write-Host " PASS" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host " FAIL" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host " FAIL ($_)" -ForegroundColor Red
        $script:failed++
    }
}

function Test-Warning {
    param([string]$Name, [scriptblock]$Check)
    Write-Host "  Checking: $Name..." -NoNewline
    try {
        $result = & $Check
        if ($result) {
            Write-Host " OK" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host " WARN" -ForegroundColor Yellow
            $script:warnings++
        }
    } catch {
        Write-Host " WARN ($_)" -ForegroundColor Yellow
        $script:warnings++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  UOH Meetings Platform – Deployment Validation"        -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────
#  1. IIS Sites
# ─────────────────────────────────────────────────────────────────
Write-Host "[IIS]" -ForegroundColor Yellow

Test-Check "API App Pool running" {
    $pool = Get-WebAppPoolState -Name $IIS_API_APP_POOL -ErrorAction SilentlyContinue
    $pool.Value -eq "Started"
}

Test-Check "Web App Pool running" {
    $pool = Get-WebAppPoolState -Name $IIS_WEB_APP_POOL -ErrorAction SilentlyContinue
    $pool.Value -eq "Started"
}

Test-Check "API site exists and started" {
    $site = Get-Website -Name $IIS_API_SITE_NAME -ErrorAction SilentlyContinue
    $site -and $site.State -eq "Started"
}

Test-Check "Web site exists and started" {
    $site = Get-Website -Name $IIS_WEB_SITE_NAME -ErrorAction SilentlyContinue
    $site -and $site.State -eq "Started"
}

# ─────────────────────────────────────────────────────────────────
#  2. API Health
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[API]" -ForegroundColor Yellow

# Try HTTPS first, fall back to HTTP
$apiBaseUrl = "https://$UOH_API_SUBDOMAIN"

Test-Check "API /health endpoint" {
    try {
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/health" -TimeoutSec 10 -SkipCertificateCheck
        $response.status -eq "healthy"
    } catch {
        # Try localhost fallback
        $response = Invoke-RestMethod -Uri "http://localhost:$KESTREL_PORT/health" -TimeoutSec 10
        $response.status -eq "healthy"
    }
}

Test-Check "API database connectivity" {
    try {
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/health" -TimeoutSec 10 -SkipCertificateCheck
        $response.checks.database -eq "ok"
    } catch {
        $response = Invoke-RestMethod -Uri "http://localhost:$KESTREL_PORT/health" -TimeoutSec 10
        $response.checks.database -eq "ok"
    }
}

Test-Warning "API Redis connectivity" {
    try {
        $response = Invoke-RestMethod -Uri "$apiBaseUrl/health" -TimeoutSec 10 -SkipCertificateCheck
        $response.checks.redis -eq "ok"
    } catch {
        $response = Invoke-RestMethod -Uri "http://localhost:$KESTREL_PORT/health" -TimeoutSec 10
        $response.checks.redis -eq "ok"
    }
}

# ─────────────────────────────────────────────────────────────────
#  3. Web Frontend
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[WEB]" -ForegroundColor Yellow

Test-Check "Web site responds" {
    try {
        $response = Invoke-WebRequest -Uri "https://$UOH_DOMAIN" -TimeoutSec 10 -SkipCertificateCheck -UseBasicParsing
        $response.StatusCode -eq 200
    } catch {
        $response = Invoke-WebRequest -Uri "http://localhost:80" -TimeoutSec 10 -UseBasicParsing
        $response.StatusCode -eq 200
    }
}

Test-Check "Web index.html exists" {
    Test-Path (Join-Path $UOH_WEB_PUBLISH_PATH "index.html")
}

Test-Check "Web web.config exists" {
    Test-Path (Join-Path $UOH_WEB_PUBLISH_PATH "web.config")
}

# ─────────────────────────────────────────────────────────────────
#  4. Infrastructure Services
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[INFRASTRUCTURE]" -ForegroundColor Yellow

Test-Check "PostgreSQL service running" {
    $svc = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    $svc -and $svc.Status -eq "Running"
}

Test-Check "PostgreSQL accepting connections" {
    $pgBin = Join-Path $PG_INSTALL_PATH "bin"
    $env:PGPASSWORD = $PG_PASSWORD
    & "$pgBin\pg_isready" -h $PG_HOST -p $PG_PORT 2>$null
    $LASTEXITCODE -eq 0
}

Test-Warning "Redis service running" {
    $svc = Get-Service -Name "*redis*" -ErrorAction SilentlyContinue
    $svc -and $svc.Status -eq "Running"
}

Test-Warning "MinIO accessible" {
    try {
        $response = Invoke-WebRequest -Uri "http://${MINIO_ENDPOINT}/minio/health/live" -TimeoutSec 5 -UseBasicParsing
        $response.StatusCode -eq 200
    } catch { $false }
}

# ─────────────────────────────────────────────────────────────────
#  5. SignalR Hubs
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[SIGNALR]" -ForegroundColor Yellow

$hubs = @("/hubs/notifications", "/hubs/live-survey", "/hubs/chat")
foreach ($hub in $hubs) {
    Test-Check "SignalR hub $hub negotiable" {
        try {
            # SignalR negotiate returns 200 or requires auth (401 means the hub is reachable)
            $response = Invoke-WebRequest -Uri "$apiBaseUrl${hub}/negotiate?negotiateVersion=1" -Method POST -TimeoutSec 10 -SkipCertificateCheck -UseBasicParsing -ErrorAction SilentlyContinue
            $response.StatusCode -eq 200
        } catch {
            # 401 means the endpoint exists but requires auth — that's still a pass
            $_.Exception.Response.StatusCode.Value__ -eq 401
        }
    }
}

# ─────────────────────────────────────────────────────────────────
#  6. Files & Configuration
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[FILES]" -ForegroundColor Yellow

Test-Check "API appsettings.Production.json exists" {
    Test-Path (Join-Path $UOH_API_PUBLISH_PATH "appsettings.Production.json")
}

Test-Check "API web.config exists" {
    Test-Path (Join-Path $UOH_API_PUBLISH_PATH "web.config")
}

Test-Check "API DLL exists" {
    Test-Path (Join-Path $UOH_API_PUBLISH_PATH "UohMeetings.Api.dll")
}

Test-Warning "Backup script exists" {
    Test-Path (Join-Path $UOH_BACKUP_PATH "Run-Backup.ps1")
}

Test-Warning "Backup scheduled task exists" {
    $task = Get-ScheduledTask -TaskName "UOH-Database-Backup" -ErrorAction SilentlyContinue
    $null -ne $task
}

# ─────────────────────────────────────────────────────────────────
#  Summary
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Validation Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Passed   : $passed" -ForegroundColor Green
Write-Host "  Failed   : $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Warnings : $warnings" -ForegroundColor $(if ($warnings -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($failed -gt 0) {
    Write-Host "  DEPLOYMENT HAS ISSUES — fix the failed checks above." -ForegroundColor Red
    exit 1
} elseif ($warnings -gt 0) {
    Write-Host "  DEPLOYMENT OK with warnings." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "  DEPLOYMENT HEALTHY" -ForegroundColor Green
    exit 0
}
