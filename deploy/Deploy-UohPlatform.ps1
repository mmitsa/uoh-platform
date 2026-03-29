#Requires -RunAsAdministrator
<#
.SYNOPSIS
    UOH Meetings Platform – Master Deployment Orchestrator (Windows Server)
.DESCRIPTION
    Reads DEPLOYMENT-PROFILE.ps1 and calls sub-scripts in order to deploy the
    entire platform on a Windows Server with IIS, PostgreSQL, Redis, and MinIO.
.PARAMETER SkipPrerequisites
    Skip installing prerequisites (IIS, .NET Hosting Bundle, Node.js, etc.)
.PARAMETER SkipBuild
    Skip building API and Web (use previously built artifacts)
.PARAMETER MigrateOnly
    Only run database migrations then exit
.PARAMETER ValidateOnly
    Only run validation checks then exit
.EXAMPLE
    # Full first-time deployment
    .\Deploy-UohPlatform.ps1

    # Re-deploy code only (skip prerequisites)
    .\Deploy-UohPlatform.ps1 -SkipPrerequisites

    # Only run migrations
    .\Deploy-UohPlatform.ps1 -MigrateOnly
#>
param(
    [switch]$SkipPrerequisites,
    [switch]$SkipBuild,
    [switch]$MigrateOnly,
    [switch]$ValidateOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────
#  Resolve paths
# ─────────────────────────────────────────────────────────────────
$DeployRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ScriptsDir   = Join-Path $DeployRoot "scripts"
$ProfilePath  = Join-Path $DeployRoot "DEPLOYMENT-PROFILE.ps1"

# ─────────────────────────────────────────────────────────────────
#  Load deployment profile
# ─────────────────────────────────────────────────────────────────
if (-not (Test-Path $ProfilePath)) {
    Write-Error "Deployment profile not found at: $ProfilePath"
    exit 1
}
. $ProfilePath

# ─────────────────────────────────────────────────────────────────
#  Banner
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  $UOH_PLATFORM_NAME – Deployment to Windows Server"        -ForegroundColor Cyan
Write-Host "  Environment : $UOH_ENVIRONMENT"                           -ForegroundColor Cyan
Write-Host "  Domain      : $UOH_DOMAIN"                                -ForegroundColor Cyan
Write-Host "  API Domain  : $UOH_API_SUBDOMAIN"                         -ForegroundColor Cyan
Write-Host "  Date        : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────────────────────────
#  Helper: Run a sub-script
# ─────────────────────────────────────────────────────────────────
function Invoke-DeployStep {
    param([string]$ScriptName, [string]$Description)
    $path = Join-Path $ScriptsDir $ScriptName
    if (-not (Test-Path $path)) {
        Write-Warning "Script not found: $path – skipping."
        return
    }
    Write-Host ""
    Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
    Write-Host "  STEP: $Description" -ForegroundColor Yellow
    Write-Host "──────────────────────────────────────────────────────" -ForegroundColor Yellow
    & $path
    if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
        Write-Error "Step failed: $Description (exit code $LASTEXITCODE)"
        exit $LASTEXITCODE
    }
    Write-Host "  [OK] $Description completed." -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────
#  Create required directories
# ─────────────────────────────────────────────────────────────────
$dirs = @($UOH_API_PUBLISH_PATH, $UOH_WEB_PUBLISH_PATH, $UOH_LOGS_PATH, $UOH_BACKUP_PATH, $UOH_TEMP_PATH)
foreach ($d in $dirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  Created: $d" -ForegroundColor DarkGray
    }
}

# ─────────────────────────────────────────────────────────────────
#  Validate-only mode
# ─────────────────────────────────────────────────────────────────
if ($ValidateOnly) {
    Invoke-DeployStep "Validate-Deployment.ps1" "Validating deployment health"
    Write-Host "`nValidation complete." -ForegroundColor Green
    exit 0
}

# ─────────────────────────────────────────────────────────────────
#  Migrate-only mode
# ─────────────────────────────────────────────────────────────────
if ($MigrateOnly) {
    Invoke-DeployStep "Setup-Database.ps1" "Running database migrations"
    Write-Host "`nMigration complete." -ForegroundColor Green
    exit 0
}

# ─────────────────────────────────────────────────────────────────
#  STEP 1: Prerequisites
# ─────────────────────────────────────────────────────────────────
if (-not $SkipPrerequisites) {
    Invoke-DeployStep "Install-Prerequisites.ps1" "Installing prerequisites"
} else {
    Write-Host "  [SKIP] Prerequisites installation skipped." -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────────
#  STEP 2: Database
# ─────────────────────────────────────────────────────────────────
Invoke-DeployStep "Setup-Database.ps1" "Setting up database"

# ─────────────────────────────────────────────────────────────────
#  STEP 3: Build & Publish
# ─────────────────────────────────────────────────────────────────
if (-not $SkipBuild) {
    Invoke-DeployStep "Build-And-Publish.ps1" "Building and publishing applications"
} else {
    Write-Host "  [SKIP] Build step skipped." -ForegroundColor DarkYellow
}

# ─────────────────────────────────────────────────────────────────
#  STEP 4: IIS Setup
# ─────────────────────────────────────────────────────────────────
Invoke-DeployStep "Setup-IIS.ps1" "Configuring IIS sites and bindings"

# ─────────────────────────────────────────────────────────────────
#  STEP 5: Validation
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Waiting 10 seconds for services to start..." -ForegroundColor DarkGray
Start-Sleep -Seconds 10

Invoke-DeployStep "Validate-Deployment.ps1" "Validating deployment"

# ─────────────────────────────────────────────────────────────────
#  Done
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE"                                       -ForegroundColor Green
Write-Host "  Web  : https://$UOH_DOMAIN"                               -ForegroundColor Green
Write-Host "  API  : https://$UOH_API_SUBDOMAIN"                        -ForegroundColor Green
Write-Host "  Health: https://$UOH_API_SUBDOMAIN/health"                -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
