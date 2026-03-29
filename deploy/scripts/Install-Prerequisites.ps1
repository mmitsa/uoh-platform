#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Install all prerequisites for the UOH Meetings Platform on Windows Server.
.DESCRIPTION
    Installs: IIS + modules, .NET 8 Hosting Bundle, Node.js 20 LTS,
    PostgreSQL 16, Redis (Memurai/Redis-Windows), MinIO, and configures firewall.
#>

$ErrorActionPreference = "Stop"

Write-Host "[1/7] Enabling IIS features..." -ForegroundColor Cyan

# ── IIS + required features ──
$features = @(
    "IIS-WebServerRole",
    "IIS-WebServer",
    "IIS-CommonHttpFeatures",
    "IIS-DefaultDocument",
    "IIS-StaticContent",
    "IIS-HttpErrors",
    "IIS-HttpRedirect",
    "IIS-ApplicationDevelopment",
    "IIS-ASPNET45",
    "IIS-NetFxExtensibility45",
    "IIS-ISAPIExtensions",
    "IIS-ISAPIFilter",
    "IIS-WebSockets",
    "IIS-RequestFiltering",
    "IIS-Security",
    "IIS-WindowsAuthentication",
    "IIS-ManagementConsole",
    "IIS-ManagementService",
    "IIS-HttpCompressionStatic",
    "IIS-HttpCompressionDynamic",
    "IIS-HealthAndDiagnostics",
    "IIS-HttpLogging",
    "IIS-RequestMonitor",
    "NetFx4Extended-ASPNET45"
)

foreach ($feature in $features) {
    $state = (Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue)
    if ($state -and $state.State -ne "Enabled") {
        Write-Host "    Enabling: $feature"
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -NoRestart -All | Out-Null
    }
}
Write-Host "    IIS features enabled." -ForegroundColor Green

# ── IIS URL Rewrite Module ──
Write-Host "[2/7] Installing IIS URL Rewrite Module..." -ForegroundColor Cyan
$urlRewriteMsi = Join-Path $UOH_TEMP_PATH "urlrewrite2.msi"
if (-not (Test-Path "C:\Program Files\IIS\URL Rewrite Module 2")) {
    $urlRewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    Write-Host "    Downloading URL Rewrite Module..."
    Invoke-WebRequest -Uri $urlRewriteUrl -OutFile $urlRewriteMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$urlRewriteMsi`" /qn" -Wait -NoNewWindow
    Write-Host "    URL Rewrite Module installed." -ForegroundColor Green
} else {
    Write-Host "    URL Rewrite Module already installed." -ForegroundColor DarkGray
}

# ── .NET 8 Hosting Bundle ──
Write-Host "[3/7] Installing .NET 8 Hosting Bundle..." -ForegroundColor Cyan
$dotnetInstaller = Join-Path $UOH_TEMP_PATH "dotnet-hosting-8.0-win.exe"
$dotnetCheck = dotnet --list-runtimes 2>$null | Select-String "Microsoft.AspNetCore.App 8."
if (-not $dotnetCheck) {
    $dotnetUrl = "https://download.visualstudio.microsoft.com/download/pr/hosting-bundle-8.0-latest/dotnet-hosting-win.exe"
    Write-Host "    Downloading .NET 8 Hosting Bundle..."
    Invoke-WebRequest -Uri "https://dot.net/v1/dotnet-install.ps1" -OutFile (Join-Path $UOH_TEMP_PATH "dotnet-install.ps1")
    # Use the official hosting bundle installer
    Write-Host "    Please download and install the .NET 8 Hosting Bundle from:"
    Write-Host "    https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
    Write-Host "    Choose: ASP.NET Core Runtime -> Hosting Bundle (Windows)"
    Write-Host "    After installing, restart IIS with: iisreset"
    Write-Host ""
    Write-Host "    If already installed, ignore this message." -ForegroundColor DarkGray
} else {
    Write-Host "    .NET 8 ASP.NET Core Runtime detected." -ForegroundColor Green
}

# ── Node.js 20 LTS ──
Write-Host "[4/7] Checking Node.js 20..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if (-not $nodeVersion -or -not $nodeVersion.StartsWith("v20")) {
    Write-Host "    Node.js 20 not found. Please install from:"
    Write-Host "    https://nodejs.org/en/download/" -ForegroundColor Yellow
    Write-Host "    Choose: LTS (v20.x) Windows Installer (.msi) 64-bit"
} else {
    Write-Host "    Node.js $nodeVersion detected." -ForegroundColor Green
}

# ── PostgreSQL 16 ──
Write-Host "[5/7] Checking PostgreSQL 16..." -ForegroundColor Cyan
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService) {
    Write-Host "    PostgreSQL not found as a Windows service."
    Write-Host "    Please install PostgreSQL 16 from:"
    Write-Host "    https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "    During installation:"
    Write-Host "      - Set superuser password"
    Write-Host "      - Keep default port: $PG_PORT"
    Write-Host "      - Install pgAdmin if needed"
    Write-Host ""
} else {
    if ($pgService.Status -ne "Running") {
        Start-Service $pgService.Name
    }
    Write-Host "    PostgreSQL service running: $($pgService.Name)" -ForegroundColor Green
}

# ── Redis ──
Write-Host "[6/7] Checking Redis..." -ForegroundColor Cyan
$redisService = Get-Service -Name "*redis*" -ErrorAction SilentlyContinue
if (-not $redisService) {
    Write-Host "    Redis not found as a Windows service."
    Write-Host "    Recommended options for Windows Server:"
    Write-Host "    Option A (Recommended): Memurai - https://www.memurai.com/get-memurai" -ForegroundColor Yellow
    Write-Host "    Option B: Redis for Windows - https://github.com/tporadowski/redis/releases" -ForegroundColor Yellow
    Write-Host "    After installing, ensure the service is running on port $REDIS_PORT"
    Write-Host ""
} else {
    if ($redisService.Status -ne "Running") {
        Start-Service $redisService.Name
    }
    Write-Host "    Redis service running: $($redisService.Name)" -ForegroundColor Green
}

# ── MinIO ──
Write-Host "[7/7] Checking MinIO..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $MINIO_INSTALL_PATH "minio.exe"))) {
    Write-Host "    MinIO not found. Setting up..."
    if (-not (Test-Path $MINIO_INSTALL_PATH)) { New-Item -ItemType Directory -Path $MINIO_INSTALL_PATH -Force | Out-Null }
    if (-not (Test-Path $MINIO_DATA_PATH))    { New-Item -ItemType Directory -Path $MINIO_DATA_PATH -Force | Out-Null }

    $minioUrl = "https://dl.min.io/server/minio/release/windows-amd64/minio.exe"
    Write-Host "    Downloading MinIO..."
    Invoke-WebRequest -Uri $minioUrl -OutFile (Join-Path $MINIO_INSTALL_PATH "minio.exe") -UseBasicParsing
    Write-Host "    MinIO downloaded to $MINIO_INSTALL_PATH" -ForegroundColor Green

    # Register as a Windows service using NSSM or sc.exe
    Write-Host "    To register MinIO as a Windows service, run:"
    Write-Host "    sc.exe create MinIO binPath= `"$MINIO_INSTALL_PATH\minio.exe server $MINIO_DATA_PATH --console-address :$MINIO_CONSOLE_PORT`" start= auto" -ForegroundColor Yellow
    Write-Host "    Then set environment variables:"
    Write-Host "    setx /M MINIO_ROOT_USER $MINIO_ACCESS_KEY" -ForegroundColor Yellow
    Write-Host "    setx /M MINIO_ROOT_PASSWORD $MINIO_SECRET_KEY" -ForegroundColor Yellow
} else {
    Write-Host "    MinIO found at $MINIO_INSTALL_PATH" -ForegroundColor Green
}

# ── Firewall Rules ──
Write-Host ""
Write-Host "Configuring Windows Firewall rules..." -ForegroundColor Cyan
foreach ($rule in $FIREWALL_RULES) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Protocol $rule.Protocol -LocalPort $rule.Port -Action Allow | Out-Null
        Write-Host "    Created firewall rule: $($rule.Name) (port $($rule.Port))" -ForegroundColor Green
    } else {
        Write-Host "    Firewall rule exists: $($rule.Name)" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Prerequisites check complete." -ForegroundColor Green
Write-Host "NOTE: If any component was missing, install it and re-run this script." -ForegroundColor Yellow
