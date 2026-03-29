using System.Security.Claims;
using Azure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using UohMeetings.Api.Data;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/admin/ad-sync")]
[Authorize]
public sealed class AdSyncController(
    IAdGroupMappingService mappingService,
    IAdSyncService adSyncService,
    ISystemSettingsService systemSettings,
    AppDbContext db) : ControllerBase
{
    private string GetOid() =>
        User.FindFirst("oid")?.Value
        ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? throw new UnauthorizedAccessException();

    // ──── Mappings CRUD ────

    [HttpGet("mappings")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> GetMappings(CancellationToken ct)
    {
        var mappings = await mappingService.GetAllAsync(ct);
        return Ok(mappings.Select(m => new
        {
            m.Id,
            m.AdGroupId,
            m.AdGroupDisplayName,
            m.RoleId,
            roleName = m.Role?.NameEn,
            roleNameAr = m.Role?.NameAr,
            m.IsActive,
            m.Priority,
            m.CreatedAtUtc,
            m.UpdatedAtUtc
        }));
    }

    [HttpPost("mappings")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> CreateMapping([FromBody] CreateAdGroupMappingRequest req, CancellationToken ct)
    {
        var mapping = await mappingService.CreateAsync(req, GetOid(), ct);
        return Ok(new
        {
            mapping.Id,
            mapping.AdGroupId,
            mapping.AdGroupDisplayName,
            mapping.RoleId,
            roleName = mapping.Role?.NameEn,
            roleNameAr = mapping.Role?.NameAr,
            mapping.IsActive,
            mapping.Priority,
            mapping.CreatedAtUtc
        });
    }

    [HttpPut("mappings/{id:guid}")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> UpdateMapping(Guid id, [FromBody] UpdateAdGroupMappingRequest req, CancellationToken ct)
    {
        var mapping = await mappingService.UpdateAsync(id, req, ct);
        return Ok(new
        {
            mapping.Id,
            mapping.AdGroupId,
            mapping.AdGroupDisplayName,
            mapping.RoleId,
            roleName = mapping.Role?.NameEn,
            roleNameAr = mapping.Role?.NameAr,
            mapping.IsActive,
            mapping.Priority,
            mapping.UpdatedAtUtc
        });
    }

    [HttpDelete("mappings/{id:guid}")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> DeleteMapping(Guid id, CancellationToken ct)
    {
        await mappingService.DeleteAsync(id, ct);
        return NoContent();
    }

    // ──── Sync Operations ────

    [HttpPost("run")]
    [Authorize(Policy = "Permission.admin.adsync.run")]
    public async Task<IActionResult> RunSync(CancellationToken ct)
    {
        var result = await adSyncService.SyncWithGroupMappingsAsync(GetOid(), ct);
        return Ok(new
        {
            result.Total,
            result.Created,
            result.Updated,
            result.Errors
        });
    }

    [HttpGet("history")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> GetHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (total, items) = await mappingService.GetSyncHistoryAsync(page, pageSize, ct);
        return Ok(new { total, items });
    }

    // ──── AD Group Search ────

    [HttpGet("groups/search")]
    [Authorize(Policy = "Permission.admin.adsync.configure")]
    public async Task<IActionResult> SearchGroups([FromQuery] string q = "", CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q)) return Ok(Array.Empty<object>());
        var groups = await adSyncService.SearchAdGroupsAsync(q, 20, ct);
        return Ok(groups);
    }

    // ──── AD Connection Settings ────

    [HttpGet("settings")]
    [Authorize(Policy = "Permission.admin.adsync.settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var adSettings = await systemSettings.GetGroupAsync("ad", ct);
        var syncSettings = await systemSettings.GetGroupAsync("sync", ct);

        var hasSecret = adSettings.TryGetValue("ad.clientSecret", out var secret)
            && !string.IsNullOrEmpty(secret);

        return Ok(new
        {
            ad = new
            {
                tenantId = adSettings.GetValueOrDefault("ad.tenantId", ""),
                clientId = adSettings.GetValueOrDefault("ad.clientId", ""),
                clientSecret = hasSecret ? "********" : "",
                instance = adSettings.GetValueOrDefault("ad.instance", "https://login.microsoftonline.com/"),
                domain = adSettings.GetValueOrDefault("ad.domain", ""),
                organizerUpn = adSettings.GetValueOrDefault("ad.organizerUpn", ""),
                hasSecret,
            },
            sync = new
            {
                scheduledEnabled = bool.TryParse(
                    syncSettings.GetValueOrDefault("sync.scheduledEnabled", "false"), out var se) && se,
                intervalMinutes = int.TryParse(
                    syncSettings.GetValueOrDefault("sync.intervalMinutes", "360"), out var im) ? im : 360,
                batchSize = int.TryParse(
                    syncSettings.GetValueOrDefault("sync.batchSize", "100"), out var bs) ? bs : 100,
                syncPhotos = !bool.TryParse(
                    syncSettings.GetValueOrDefault("sync.syncPhotos", "true"), out var sp) || sp,
                removeUnmappedRoles = bool.TryParse(
                    syncSettings.GetValueOrDefault("sync.removeUnmappedRoles", "false"), out var ru) && ru,
            },
        });
    }

    public sealed record SaveAdSettingsRequest(
        string? TenantId, string? ClientId, string? ClientSecret,
        string? Instance, string? Domain, string? OrganizerUpn,
        bool ScheduledEnabled = false, int IntervalMinutes = 360,
        int BatchSize = 100, bool SyncPhotos = true, bool RemoveUnmappedRoles = false);

    [HttpPut("settings")]
    [Authorize(Policy = "Permission.admin.adsync.settings")]
    public async Task<IActionResult> SaveSettings([FromBody] SaveAdSettingsRequest req, CancellationToken ct)
    {
        var oid = GetOid();

        await systemSettings.SetAsync("ad.tenantId", req.TenantId ?? "",
            groupKey: "ad", dataType: "string", description: "Azure AD Tenant ID", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("ad.clientId", req.ClientId ?? "",
            groupKey: "ad", dataType: "string", description: "App Registration Client ID", updatedByObjectId: oid, ct: ct);

        // Only update secret if a new value is provided (not the mask)
        if (!string.IsNullOrEmpty(req.ClientSecret) && req.ClientSecret != "********")
        {
            await systemSettings.SetAsync("ad.clientSecret", req.ClientSecret, isEncrypted: true,
                groupKey: "ad", dataType: "string", description: "App Registration Client Secret",
                updatedByObjectId: oid, ct: ct);
        }

        await systemSettings.SetAsync("ad.instance", req.Instance ?? "https://login.microsoftonline.com/",
            groupKey: "ad", dataType: "url", description: "Login instance URL", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("ad.domain", req.Domain ?? "",
            groupKey: "ad", dataType: "string", description: "Organization domain", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("ad.organizerUpn", req.OrganizerUpn ?? "",
            groupKey: "ad", dataType: "string", description: "Calendar organizer UPN", updatedByObjectId: oid, ct: ct);

        await systemSettings.SetAsync("sync.scheduledEnabled", req.ScheduledEnabled.ToString().ToLower(),
            groupKey: "sync", dataType: "bool", description: "Enable scheduled sync", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("sync.intervalMinutes", req.IntervalMinutes.ToString(),
            groupKey: "sync", dataType: "int", description: "Sync interval in minutes", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("sync.batchSize", req.BatchSize.ToString(),
            groupKey: "sync", dataType: "int", description: "Users per sync batch", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("sync.syncPhotos", req.SyncPhotos.ToString().ToLower(),
            groupKey: "sync", dataType: "bool", description: "Sync user photos", updatedByObjectId: oid, ct: ct);
        await systemSettings.SetAsync("sync.removeUnmappedRoles", req.RemoveUnmappedRoles.ToString().ToLower(),
            groupKey: "sync", dataType: "bool", description: "Remove roles not in mappings", updatedByObjectId: oid, ct: ct);

        return Ok(new { success = true });
    }

    public sealed record TestAdConnectionRequest(string? TenantId, string? ClientId, string? ClientSecret);

    [HttpPost("test-connection")]
    [Authorize(Policy = "Permission.admin.adsync.settings")]
    public async Task<IActionResult> TestConnection([FromBody] TestAdConnectionRequest? req, CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(10));

        try
        {
            string? tenantId, clientId, clientSecret;

            if (req is not null && !string.IsNullOrWhiteSpace(req.TenantId)
                && !string.IsNullOrWhiteSpace(req.ClientId)
                && !string.IsNullOrWhiteSpace(req.ClientSecret)
                && req.ClientSecret != "********")
            {
                tenantId = req.TenantId;
                clientId = req.ClientId;
                clientSecret = req.ClientSecret;
            }
            else
            {
                tenantId = await systemSettings.GetWithFallbackAsync("ad.tenantId", "Integrations:Teams:TenantId", cts.Token);
                clientId = await systemSettings.GetWithFallbackAsync("ad.clientId", "Integrations:Teams:ClientId", cts.Token);
                clientSecret = await systemSettings.GetWithFallbackAsync("ad.clientSecret", "Integrations:Teams:ClientSecret", cts.Token);
            }

            if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            {
                return Ok(new { success = false, status = "not_configured", message = "AD credentials are not configured." });
            }

            var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            var graph = new GraphServiceClient(credential, ["https://graph.microsoft.com/.default"]);

            var org = await graph.Organization.GetAsync(r =>
            {
                r.QueryParameters.Select = ["id", "displayName"];
                r.QueryParameters.Top = 1;
            }, cts.Token);

            var orgName = org?.Value?.FirstOrDefault()?.DisplayName;

            return Ok(new
            {
                success = true,
                status = "connected",
                message = $"Successfully connected to {orgName ?? "Azure AD"}.",
                organizationName = orgName,
            });
        }
        catch (OperationCanceledException)
        {
            return Ok(new { success = false, status = "timeout", message = "Connection test timed out after 10 seconds." });
        }
        catch (Exception ex)
        {
            return Ok(new { success = false, status = "error", message = $"Connection failed: {ex.Message}" });
        }
    }

    [HttpGet("connection-status")]
    [Authorize(Policy = "Permission.admin.adsync.settings")]
    public async Task<IActionResult> GetConnectionStatus(CancellationToken ct)
    {
        var tenantId = await systemSettings.GetWithFallbackAsync("ad.tenantId", "Integrations:Teams:TenantId", ct);
        var clientId = await systemSettings.GetWithFallbackAsync("ad.clientId", "Integrations:Teams:ClientId", ct);
        var clientSecret = await systemSettings.GetWithFallbackAsync("ad.clientSecret", "Integrations:Teams:ClientSecret", ct);

        var configured = !string.IsNullOrWhiteSpace(tenantId) && !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret);

        var lastLog = await db.AdSyncLogs
            .AsNoTracking()
            .OrderByDescending(l => l.StartedAtUtc)
            .FirstOrDefaultAsync(ct);

        return Ok(new
        {
            status = configured ? "configured" : "not_configured",
            configured,
            lastSyncStatus = lastLog?.Status,
            lastSyncTime = lastLog?.StartedAtUtc,
        });
    }
}
