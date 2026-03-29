#Requires -RunAsAdministrator
<#
.SYNOPSIS
    UOH Meetings Platform – Deployment Profile (Windows Server)
.DESCRIPTION
    Central configuration file for the entire deployment pipeline.
    Every other script dot-sources this file to read configuration.
    ── AI / Automation Friendly ──
    An AI agent or DevOps engineer can read this file, understand
    every parameter, and execute Deploy-UohPlatform.ps1 with zero ambiguity.
.NOTES
    Target OS : Windows Server 2019 / 2022
    Platform  : .NET 8  |  React 19 (Vite)  |  React Native (Expo)
    Database  : PostgreSQL 16  |  Cache: Redis 7  |  Storage: MinIO
#>

# ═══════════════════════════════════════════════════════════════════
#  1. GENERAL
# ═══════════════════════════════════════════════════════════════════
$Global:UOH_PLATFORM_NAME     = "UOH Meetings Platform"
$Global:UOH_ENVIRONMENT        = "Production"          # Production | Staging
$Global:UOH_DOMAIN             = "meetings.uoh.edu.sa" # Primary domain
$Global:UOH_API_SUBDOMAIN      = "api.meetings.uoh.edu.sa"
$Global:UOH_REPO_ROOT          = "C:\src\uoh-meetings"  # Where the repo is cloned

# ═══════════════════════════════════════════════════════════════════
#  2. INSTALLATION PATHS (on the Windows Server)
# ═══════════════════════════════════════════════════════════════════
$Global:UOH_API_PUBLISH_PATH   = "C:\inetpub\uoh-api"
$Global:UOH_WEB_PUBLISH_PATH   = "C:\inetpub\uoh-web"
$Global:UOH_LOGS_PATH          = "C:\logs\uoh-meetings"
$Global:UOH_BACKUP_PATH        = "C:\backups\uoh-meetings"
$Global:UOH_TEMP_PATH          = "C:\temp\uoh-deploy"

# ═══════════════════════════════════════════════════════════════════
#  3. IIS CONFIGURATION
# ═══════════════════════════════════════════════════════════════════
# ── API Site ──
$Global:IIS_API_SITE_NAME      = "UOH-API"
$Global:IIS_API_APP_POOL       = "UOH-API-Pool"
$Global:IIS_API_PORT           = 443
$Global:IIS_API_BINDING_HOST   = $UOH_API_SUBDOMAIN
$Global:KESTREL_PORT           = 5000           # Kestrel listens here; IIS proxies to it

# ── Web Site ──
$Global:IIS_WEB_SITE_NAME      = "UOH-Web"
$Global:IIS_WEB_APP_POOL       = "UOH-Web-Pool"
$Global:IIS_WEB_PORT           = 443
$Global:IIS_WEB_BINDING_HOST   = $UOH_DOMAIN

# ── SSL ──
$Global:SSL_CERT_THUMBPRINT    = ""             # Leave empty to auto-create self-signed; set for real cert
$Global:SSL_CERT_STORE         = "My"
$Global:SSL_CERT_LOCATION      = "LocalMachine"

# ═══════════════════════════════════════════════════════════════════
#  4. DATABASE (PostgreSQL 16)
# ═══════════════════════════════════════════════════════════════════
$Global:PG_HOST                = "localhost"
$Global:PG_PORT                = 5432
$Global:PG_DATABASE            = "uoh_meetings"
$Global:PG_USER                = "uoh"
$Global:PG_PASSWORD            = "CHANGE_ME_TO_STRONG_PASSWORD"  # CHANGE THIS!
$Global:PG_INSTALL_PATH        = "C:\Program Files\PostgreSQL\16"
$Global:PG_DATA_PATH           = "C:\PgData\16"

# Connection string (computed)
$Global:PG_CONNECTION_STRING   = "Host=$PG_HOST;Port=$PG_PORT;Database=$PG_DATABASE;Username=$PG_USER;Password=$PG_PASSWORD;Ssl Mode=Prefer;Trust Server Certificate=true"

# Migration flags
$Global:DB_AUTO_MIGRATE        = $true          # true for first deploy, false after
$Global:DB_AUTO_SEED           = $false         # true only for initial seeding

# ═══════════════════════════════════════════════════════════════════
#  5. REDIS CACHE
# ═══════════════════════════════════════════════════════════════════
$Global:REDIS_HOST             = "localhost"
$Global:REDIS_PORT             = 6379
$Global:REDIS_CONNECTION       = "${REDIS_HOST}:${REDIS_PORT},abortConnect=false"
$Global:REDIS_INSTALL_PATH     = "C:\Program Files\Redis"

# ═══════════════════════════════════════════════════════════════════
#  6. MINIO (S3-compatible Object Storage)
# ═══════════════════════════════════════════════════════════════════
$Global:MINIO_INSTALL_PATH     = "C:\minio"
$Global:MINIO_DATA_PATH        = "C:\minio\data"
$Global:MINIO_ENDPOINT         = "localhost:9000"
$Global:MINIO_ACCESS_KEY       = "CHANGE_ME_MINIO_ACCESS"       # CHANGE THIS!
$Global:MINIO_SECRET_KEY       = "CHANGE_ME_MINIO_SECRET"       # CHANGE THIS!
$Global:MINIO_BUCKET           = "uoh-meetings"
$Global:MINIO_CONSOLE_PORT     = 9001

# ═══════════════════════════════════════════════════════════════════
#  7. AZURE AD / MICROSOFT ENTRA ID
# ═══════════════════════════════════════════════════════════════════
$Global:AAD_INSTANCE           = "https://login.microsoftonline.com/"
$Global:AAD_TENANT_ID          = "YOUR_TENANT_ID"
$Global:AAD_CLIENT_ID_API      = "YOUR_API_CLIENT_ID"
$Global:AAD_CLIENT_ID_SPA      = "YOUR_SPA_CLIENT_ID"
$Global:AAD_AUDIENCE           = "api://$AAD_CLIENT_ID_API"
$Global:AAD_API_SCOPE          = "api://$AAD_CLIENT_ID_API/.default"

# ═══════════════════════════════════════════════════════════════════
#  8. INTEGRATIONS
# ═══════════════════════════════════════════════════════════════════

# ── Microsoft Teams ──
$Global:TEAMS_ENABLED          = $true
$Global:TEAMS_TENANT_ID        = $AAD_TENANT_ID
$Global:TEAMS_CLIENT_ID        = "YOUR_TEAMS_APP_CLIENT_ID"
$Global:TEAMS_CLIENT_SECRET    = "YOUR_TEAMS_APP_CLIENT_SECRET"
$Global:TEAMS_ORGANIZER_UPN    = "meetings-organizer@uoh.edu.sa"

# ── Zoom (S2S) ──
$Global:ZOOM_ENABLED           = $false
$Global:ZOOM_ACCOUNT_ID        = ""
$Global:ZOOM_CLIENT_ID         = ""
$Global:ZOOM_CLIENT_SECRET     = ""

# ── SMTP (Email) ──
$Global:SMTP_HOST              = "smtp.uoh.edu.sa"
$Global:SMTP_PORT              = 587
$Global:SMTP_USERNAME          = "noreply@uoh.edu.sa"
$Global:SMTP_PASSWORD          = "YOUR_SMTP_PASSWORD"
$Global:SMTP_FROM              = "noreply@uoh.edu.sa"

# ── Firebase Cloud Messaging (Push Notifications) ──
$Global:FCM_ENABLED            = $true
$Global:FCM_PROJECT_ID         = "YOUR_FIREBASE_PROJECT_ID"
$Global:FCM_SERVICE_ACCOUNT    = "C:\secrets\firebase-service-account.json"

# ═══════════════════════════════════════════════════════════════════
#  9. CORS (Allowed Origins)
# ═══════════════════════════════════════════════════════════════════
$Global:CORS_ORIGINS = @(
    "https://$UOH_DOMAIN",
    "https://$UOH_API_SUBDOMAIN"
)

# ═══════════════════════════════════════════════════════════════════
# 10. FIREWALL RULES
# ═══════════════════════════════════════════════════════════════════
$Global:FIREWALL_RULES = @(
    @{ Name = "UOH-HTTP";     Port = 80;    Protocol = "TCP" },
    @{ Name = "UOH-HTTPS";    Port = 443;   Protocol = "TCP" },
    @{ Name = "UOH-Postgres"; Port = $PG_PORT; Protocol = "TCP" }
    # Redis & MinIO should NOT be exposed externally
)

# ═══════════════════════════════════════════════════════════════════
# 11. MOBILE APP (Expo / EAS)
# ═══════════════════════════════════════════════════════════════════
$Global:MOBILE_API_BASE_URL    = "https://$UOH_API_SUBDOMAIN"
$Global:EAS_PROJECT_ID         = "YOUR_EAS_PROJECT_ID"
$Global:APPLE_TEAM_ID          = "YOUR_APPLE_TEAM_ID"
$Global:APP_STORE_CONNECT_ID   = "YOUR_APP_STORE_CONNECT_APP_ID"

# ═══════════════════════════════════════════════════════════════════
# 12. BACKUP SCHEDULE
# ═══════════════════════════════════════════════════════════════════
$Global:BACKUP_DAILY_TIME      = "02:00"        # 2 AM daily
$Global:BACKUP_RETENTION_DAYS  = 30
$Global:BACKUP_WEEKLY_DAY      = "Friday"

# ═══════════════════════════════════════════════════════════════════
# 13. OBSERVABILITY
# ═══════════════════════════════════════════════════════════════════
$Global:OTLP_ENABLED           = $false
$Global:OTLP_ENDPOINT          = "http://localhost:4317"

Write-Host "[PROFILE] UOH Meetings Deployment Profile loaded — Environment: $UOH_ENVIRONMENT" -ForegroundColor Cyan
