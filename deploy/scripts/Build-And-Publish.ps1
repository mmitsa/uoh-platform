#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Build and publish the API (.NET 8) and Web (React/Vite) applications.
#>

$ErrorActionPreference = "Stop"

# ─────────────────────────────────────────────────────────────────
#  1. Build & Publish .NET API
# ─────────────────────────────────────────────────────────────────
Write-Host "Building .NET API (Release)..." -ForegroundColor Cyan

$apiProject = Join-Path $UOH_REPO_ROOT "apps\api\UohMeetings.Api\UohMeetings.Api.csproj"

# Restore
dotnet restore $apiProject
if ($LASTEXITCODE -ne 0) { Write-Error "dotnet restore failed" }

# Publish to the IIS directory
dotnet publish $apiProject -c Release -o $UOH_API_PUBLISH_PATH --no-restore /p:UseAppHost=false
if ($LASTEXITCODE -ne 0) { Write-Error "dotnet publish failed" }

Write-Host "  API published to: $UOH_API_PUBLISH_PATH" -ForegroundColor Green

# ── Copy web.config for API (IIS reverse proxy config) ──
$apiWebConfig = Join-Path $UOH_REPO_ROOT "apps\api\UohMeetings.Api\web.config"
if (Test-Path $apiWebConfig) {
    Copy-Item $apiWebConfig -Destination $UOH_API_PUBLISH_PATH -Force
    Write-Host "  API web.config copied." -ForegroundColor DarkGray
}

# ── Write appsettings.Production.json with real values ──
Write-Host "  Writing production appsettings..." -ForegroundColor Cyan

$prodSettings = @{
    AzureAd = @{
        Instance  = $AAD_INSTANCE
        TenantId  = $AAD_TENANT_ID
        ClientId  = $AAD_CLIENT_ID_API
        Audience  = $AAD_AUDIENCE
    }
    ConnectionStrings = @{
        Postgres = $PG_CONNECTION_STRING
    }
    Redis = @{
        ConnectionString = $REDIS_CONNECTION
    }
    Cors = @{
        AllowedOrigins = $CORS_ORIGINS
    }
    Integrations = @{
        OnlineMeeting = @{ DefaultProvider = if ($TEAMS_ENABLED) { "teams" } else { "zoom" } }
        Teams = @{
            Enabled      = $TEAMS_ENABLED
            TenantId     = $TEAMS_TENANT_ID
            ClientId     = $TEAMS_CLIENT_ID
            ClientSecret = $TEAMS_CLIENT_SECRET
            OrganizerUpn = $TEAMS_ORGANIZER_UPN
        }
        Zoom = @{
            Enabled = $ZOOM_ENABLED
            S2S = @{
                AccountId    = $ZOOM_ACCOUNT_ID
                ClientId     = $ZOOM_CLIENT_ID
                ClientSecret = $ZOOM_CLIENT_SECRET
            }
        }
        Smtp = @{
            Host     = $SMTP_HOST
            Port     = $SMTP_PORT
            Username = $SMTP_USERNAME
            Password = $SMTP_PASSWORD
            From     = $SMTP_FROM
        }
        Fcm = @{
            Enabled                = $FCM_ENABLED
            ProjectId              = $FCM_PROJECT_ID
            ServiceAccountJsonPath = $FCM_SERVICE_ACCOUNT
        }
    }
    Storage = @{
        DefaultProvider = "minio"
        Minio = @{
            Endpoint  = $MINIO_ENDPOINT
            AccessKey = $MINIO_ACCESS_KEY
            SecretKey = $MINIO_SECRET_KEY
            Secure    = $false
            Bucket    = $MINIO_BUCKET
        }
    }
    Database = @{
        AutoMigrate = $DB_AUTO_MIGRATE
        AutoSeed    = $DB_AUTO_SEED
    }
    Observability = @{
        Otlp = @{ Enabled = $OTLP_ENABLED }
    }
    Logging = @{
        LogLevel = @{
            Default                = "Warning"
            "Microsoft.AspNetCore" = "Warning"
            UohMeetings            = "Information"
        }
    }
} | ConvertTo-Json -Depth 10

$prodSettingsPath = Join-Path $UOH_API_PUBLISH_PATH "appsettings.Production.json"
Set-Content -Path $prodSettingsPath -Value $prodSettings -Encoding UTF8
Write-Host "  appsettings.Production.json written." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  2. Build Web (React + Vite)
# ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Building Web application (React + Vite)..." -ForegroundColor Cyan

Push-Location $UOH_REPO_ROOT
try {
    # Write production .env
    $webEnvPath = Join-Path $UOH_REPO_ROOT "apps\web\.env.production"
    $webEnv = @"
VITE_API_BASE_URL=https://$UOH_API_SUBDOMAIN
VITE_AAD_CLIENT_ID=$AAD_CLIENT_ID_SPA
VITE_AAD_AUTHORITY=https://login.microsoftonline.com/$AAD_TENANT_ID
VITE_AAD_API_SCOPE=$AAD_API_SCOPE
"@
    Set-Content -Path $webEnvPath -Value $webEnv -Encoding UTF8
    Write-Host "  .env.production written." -ForegroundColor DarkGray

    # Install dependencies
    Write-Host "  Running npm install..."
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed" }

    # Build
    Write-Host "  Running npm build..."
    npm --workspace apps/web run build
    if ($LASTEXITCODE -ne 0) { Write-Error "npm build failed" }

    # Copy dist to IIS directory
    $webDist = Join-Path $UOH_REPO_ROOT "apps\web\dist"
    if (Test-Path $UOH_WEB_PUBLISH_PATH) {
        # Clear old files but keep web.config
        Get-ChildItem $UOH_WEB_PUBLISH_PATH -Exclude "web.config" | Remove-Item -Recurse -Force
    }
    Copy-Item -Path "$webDist\*" -Destination $UOH_WEB_PUBLISH_PATH -Recurse -Force

    # Copy web.config for SPA routing
    $webConfigSource = Join-Path $UOH_REPO_ROOT "apps\web\web.config"
    if (Test-Path $webConfigSource) {
        Copy-Item $webConfigSource -Destination $UOH_WEB_PUBLISH_PATH -Force
        Write-Host "  Web web.config copied." -ForegroundColor DarkGray
    }

    Write-Host "  Web published to: $UOH_WEB_PUBLISH_PATH" -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Build and publish complete." -ForegroundColor Green
