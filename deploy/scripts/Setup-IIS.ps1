#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Configure IIS sites, app pools, SSL, and bindings for the UOH Meetings Platform.
#>

$ErrorActionPreference = "Stop"
Import-Module WebAdministration -ErrorAction SilentlyContinue

# ─────────────────────────────────────────────────────────────────
#  1. SSL Certificate
# ─────────────────────────────────────────────────────────────────
Write-Host "Setting up SSL certificate..." -ForegroundColor Cyan

if ([string]::IsNullOrEmpty($SSL_CERT_THUMBPRINT)) {
    # Check for existing cert matching the domain
    $cert = Get-ChildItem "Cert:\$SSL_CERT_LOCATION\$SSL_CERT_STORE" |
        Where-Object { $_.Subject -like "*$UOH_DOMAIN*" -and $_.NotAfter -gt (Get-Date) } |
        Sort-Object NotAfter -Descending | Select-Object -First 1

    if (-not $cert) {
        Write-Host "  No SSL certificate found for $UOH_DOMAIN. Creating self-signed certificate..."
        $cert = New-SelfSignedCertificate `
            -DnsName $UOH_DOMAIN, $UOH_API_SUBDOMAIN, "localhost" `
            -CertStoreLocation "Cert:\$SSL_CERT_LOCATION\$SSL_CERT_STORE" `
            -NotAfter (Get-Date).AddYears(2) `
            -FriendlyName "UOH Meetings Platform"
        Write-Host "  Self-signed certificate created (thumbprint: $($cert.Thumbprint))" -ForegroundColor Yellow
        Write-Host "  WARNING: Replace with a real CA-signed certificate for production!" -ForegroundColor Yellow
    } else {
        Write-Host "  Found existing certificate: $($cert.Subject) (expires: $($cert.NotAfter))" -ForegroundColor Green
    }
    $SSL_CERT_THUMBPRINT = $cert.Thumbprint
} else {
    $cert = Get-ChildItem "Cert:\$SSL_CERT_LOCATION\$SSL_CERT_STORE\$SSL_CERT_THUMBPRINT" -ErrorAction SilentlyContinue
    if (-not $cert) {
        Write-Error "Certificate with thumbprint $SSL_CERT_THUMBPRINT not found."
    }
    Write-Host "  Using certificate: $($cert.Subject)" -ForegroundColor Green
}

# ─────────────────────────────────────────────────────────────────
#  2. App Pool: API
# ─────────────────────────────────────────────────────────────────
Write-Host "Configuring API App Pool..." -ForegroundColor Cyan

if (-not (Test-Path "IIS:\AppPools\$IIS_API_APP_POOL")) {
    New-WebAppPool -Name $IIS_API_APP_POOL | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$IIS_API_APP_POOL" -Name "managedRuntimeVersion" -Value ""  # No CLR (out-of-process)
Set-ItemProperty "IIS:\AppPools\$IIS_API_APP_POOL" -Name "startMode" -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$IIS_API_APP_POOL" -Name "processModel.idleTimeout" -Value ([TimeSpan]::FromMinutes(0))
Set-ItemProperty "IIS:\AppPools\$IIS_API_APP_POOL" -Name "recycling.periodicRestart.time" -Value ([TimeSpan]::FromHours(29))
Write-Host "  App Pool '$IIS_API_APP_POOL' configured (No Managed Code, AlwaysRunning)." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  3. App Pool: Web
# ─────────────────────────────────────────────────────────────────
Write-Host "Configuring Web App Pool..." -ForegroundColor Cyan

if (-not (Test-Path "IIS:\AppPools\$IIS_WEB_APP_POOL")) {
    New-WebAppPool -Name $IIS_WEB_APP_POOL | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$IIS_WEB_APP_POOL" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$IIS_WEB_APP_POOL" -Name "startMode" -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$IIS_WEB_APP_POOL" -Name "processModel.idleTimeout" -Value ([TimeSpan]::FromMinutes(0))
Write-Host "  App Pool '$IIS_WEB_APP_POOL' configured." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  4. IIS Site: API
# ─────────────────────────────────────────────────────────────────
Write-Host "Configuring API IIS site..." -ForegroundColor Cyan

# Remove existing site if any
if (Get-Website -Name $IIS_API_SITE_NAME -ErrorAction SilentlyContinue) {
    Remove-Website -Name $IIS_API_SITE_NAME
}

New-Website -Name $IIS_API_SITE_NAME `
    -PhysicalPath $UOH_API_PUBLISH_PATH `
    -ApplicationPool $IIS_API_APP_POOL `
    -Force | Out-Null

# Remove default binding and add HTTPS
Get-WebBinding -Name $IIS_API_SITE_NAME | Remove-WebBinding

# HTTPS binding
New-WebBinding -Name $IIS_API_SITE_NAME -Protocol "https" -Port $IIS_API_PORT -HostHeader $IIS_API_BINDING_HOST -SslFlags 1
$binding = Get-WebBinding -Name $IIS_API_SITE_NAME -Protocol "https"
$binding.AddSslCertificate($SSL_CERT_THUMBPRINT, $SSL_CERT_STORE)

# HTTP redirect binding (optional)
New-WebBinding -Name $IIS_API_SITE_NAME -Protocol "http" -Port 80 -HostHeader $IIS_API_BINDING_HOST

# Set environment variable for ASPNETCORE_ENVIRONMENT
$env:ASPNETCORE_ENVIRONMENT = $UOH_ENVIRONMENT

Write-Host "  API site '$IIS_API_SITE_NAME' created -> https://$IIS_API_BINDING_HOST" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  5. IIS Site: Web (React SPA)
# ─────────────────────────────────────────────────────────────────
Write-Host "Configuring Web IIS site..." -ForegroundColor Cyan

if (Get-Website -Name $IIS_WEB_SITE_NAME -ErrorAction SilentlyContinue) {
    Remove-Website -Name $IIS_WEB_SITE_NAME
}

New-Website -Name $IIS_WEB_SITE_NAME `
    -PhysicalPath $UOH_WEB_PUBLISH_PATH `
    -ApplicationPool $IIS_WEB_APP_POOL `
    -Force | Out-Null

# Remove default binding and add HTTPS
Get-WebBinding -Name $IIS_WEB_SITE_NAME | Remove-WebBinding

# HTTPS binding
New-WebBinding -Name $IIS_WEB_SITE_NAME -Protocol "https" -Port $IIS_WEB_PORT -HostHeader $IIS_WEB_BINDING_HOST -SslFlags 1
$binding = Get-WebBinding -Name $IIS_WEB_SITE_NAME -Protocol "https"
$binding.AddSslCertificate($SSL_CERT_THUMBPRINT, $SSL_CERT_STORE)

# HTTP redirect binding
New-WebBinding -Name $IIS_WEB_SITE_NAME -Protocol "http" -Port 80 -HostHeader $IIS_WEB_BINDING_HOST

Write-Host "  Web site '$IIS_WEB_SITE_NAME' created -> https://$IIS_WEB_BINDING_HOST" -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  6. Enable WebSockets (for SignalR)
# ─────────────────────────────────────────────────────────────────
Write-Host "Ensuring WebSockets are enabled..." -ForegroundColor Cyan
$wsFeature = Get-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets
if ($wsFeature.State -ne "Enabled") {
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebSockets -NoRestart | Out-Null
    Write-Host "  WebSockets feature enabled." -ForegroundColor Green
} else {
    Write-Host "  WebSockets already enabled." -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────────────────────────
#  7. Set folder permissions
# ─────────────────────────────────────────────────────────────────
Write-Host "Setting folder permissions..." -ForegroundColor Cyan

$paths = @($UOH_API_PUBLISH_PATH, $UOH_WEB_PUBLISH_PATH, $UOH_LOGS_PATH)
foreach ($p in $paths) {
    $acl = Get-Acl $p
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
    $acl.AddAccessRule($rule)
    # API needs write access for logs
    if ($p -eq $UOH_API_PUBLISH_PATH -or $p -eq $UOH_LOGS_PATH) {
        $writeRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
        $acl.AddAccessRule($writeRule)
    }
    Set-Acl $p $acl
}
Write-Host "  Folder permissions configured." -ForegroundColor Green

# ─────────────────────────────────────────────────────────────────
#  8. Start sites
# ─────────────────────────────────────────────────────────────────
Write-Host "Starting IIS sites..." -ForegroundColor Cyan
Start-Website -Name $IIS_API_SITE_NAME -ErrorAction SilentlyContinue
Start-Website -Name $IIS_WEB_SITE_NAME -ErrorAction SilentlyContinue
iisreset /restart | Out-Null
Write-Host "  IIS sites started." -ForegroundColor Green

Write-Host ""
Write-Host "IIS configuration complete." -ForegroundColor Green
