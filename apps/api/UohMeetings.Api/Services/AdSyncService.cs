using System.Text.Json;
using Azure.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Graph;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Storage;

namespace UohMeetings.Api.Services;

public sealed class AdSyncService(
    AppDbContext db,
    IConfiguration config,
    ILogger<AdSyncService> logger,
    IFileStorage storage,
    ISystemSettingsService systemSettings) : IAdSyncService
{
    private async Task<GraphServiceClient> CreateGraphClientAsync(CancellationToken ct = default)
    {
        var tenantId = await systemSettings.GetWithFallbackAsync("ad.tenantId", "Integrations:Teams:TenantId", ct);
        var clientId = await systemSettings.GetWithFallbackAsync("ad.clientId", "Integrations:Teams:ClientId", ct);
        var clientSecret = await systemSettings.GetWithFallbackAsync("ad.clientSecret", "Integrations:Teams:ClientSecret", ct);

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            throw new InvalidOperationException("Graph credentials are not configured. Configure AD settings via the admin panel or appsettings.json.");

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        return new GraphServiceClient(credential, ["https://graph.microsoft.com/.default"]);
    }

    public async Task<AppUser> SyncUserAsync(string objectId, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);
        var adUser = await graph.Users[objectId].GetAsync(r =>
        {
            r.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName", "jobTitle", "department", "employeeId", "mobilePhone"];
        }, ct);

        if (adUser is null)
            throw new InvalidOperationException($"User {objectId} not found in Azure AD.");

        var existing = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == objectId, ct);
        if (existing is null)
        {
            existing = new AppUser { ObjectId = objectId };
            db.AppUsers.Add(existing);
        }

        existing.DisplayNameEn = adUser.DisplayName ?? "";
        existing.DisplayNameAr = adUser.DisplayName ?? "";
        existing.Email = adUser.Mail ?? adUser.UserPrincipalName ?? "";
        existing.JobTitleEn = adUser.JobTitle;
        existing.Department = adUser.Department;
        existing.EmployeeId = adUser.EmployeeId;
        existing.PhoneNumber = adUser.MobilePhone;
        existing.IsSynced = true;
        existing.LastSyncAtUtc = DateTime.UtcNow;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return existing;
    }

    public async Task<AdSyncResult> SyncAllAsync(string? groupId, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);
        int total = 0, created = 0, updated = 0, errors = 0;

        var batchSizeStr = await systemSettings.GetWithFallbackAsync("sync.batchSize", "AdSync:SyncBatchSize", ct);
        var batchSize = int.TryParse(batchSizeStr, out var bs) ? bs : 100;

        try
        {
            Microsoft.Graph.Models.UserCollectionResponse? usersPage;

            if (!string.IsNullOrWhiteSpace(groupId))
            {
                var membersPage = await graph.Groups[groupId].Members.GetAsync(r =>
                {
                    r.QueryParameters.Top = batchSize;
                }, ct);

                if (membersPage?.Value is not null)
                {
                    foreach (var member in membersPage.Value.OfType<Microsoft.Graph.Models.User>())
                    {
                        total++;
                        try
                        {
                            var wasCreated = await UpsertUserAsync(member, ct);
                            if (wasCreated) created++; else updated++;
                        }
                        catch (Exception ex)
                        {
                            errors++;
                            logger.LogWarning(ex, "Failed to sync group member {ObjectId}", member.Id);
                        }
                    }
                }
            }
            else
            {
                usersPage = await graph.Users.GetAsync(r =>
                {
                    r.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName", "jobTitle", "department", "employeeId", "mobilePhone", "accountEnabled"];
                    r.QueryParameters.Top = batchSize;
                    r.QueryParameters.Filter = "accountEnabled eq true";
                }, ct);

                while (usersPage?.Value is not null)
                {
                    foreach (var adUser in usersPage.Value)
                    {
                        total++;
                        try
                        {
                            var wasCreated = await UpsertUserAsync(adUser, ct);
                            if (wasCreated) created++; else updated++;
                        }
                        catch (Exception ex)
                        {
                            errors++;
                            logger.LogWarning(ex, "Failed to sync user {ObjectId}", adUser.Id);
                        }
                    }

                    if (usersPage.OdataNextLink is not null)
                    {
                        usersPage = await graph.Users
                            .WithUrl(usersPage.OdataNextLink)
                            .GetAsync(cancellationToken: ct);
                    }
                    else
                    {
                        break;
                    }
                }
            }

            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "AD sync failed.");
            throw;
        }

        return new AdSyncResult(total, created, updated, errors);
    }

    public async Task<AdSyncResult> SyncWithGroupMappingsAsync(string? triggeredByOid = null, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);

        var syncPhotosStr = await systemSettings.GetWithFallbackAsync("sync.syncPhotos", "AdSync:SyncPhotos", ct);
        var syncPhotos = !bool.TryParse(syncPhotosStr, out var sp) || sp; // default true

        var removeUnmappedStr = await systemSettings.GetWithFallbackAsync("sync.removeUnmappedRoles", "AdSync:RemoveUnmappedRoles", ct);
        var removeUnmappedRoles = bool.TryParse(removeUnmappedStr, out var ru) && ru; // default false

        var log = new AdSyncLog
        {
            SyncType = triggeredByOid is not null ? "manual" : "scheduled",
            TriggeredByObjectId = triggeredByOid,
        };
        db.AdSyncLogs.Add(log);
        await db.SaveChangesAsync(ct);

        int total = 0, created = 0, updated = 0, rolesAssigned = 0, rolesRemoved = 0, photosSynced = 0, errors = 0;
        var errorDetails = new List<string>();

        try
        {
            var mappings = await db.AdGroupRoleMappings
                .Where(m => m.IsActive)
                .OrderBy(m => m.Priority)
                .AsNoTracking()
                .ToListAsync(ct);

            if (mappings.Count == 0)
            {
                log.Status = "completed";
                log.CompletedAtUtc = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
                return new AdSyncResult(0, 0, 0, 0);
            }

            // Track which user gets which roles from AD groups
            var userRolesToAssign = new Dictionary<string, HashSet<Guid>>();

            foreach (var mapping in mappings)
            {
                try
                {
                    var membersPage = await graph.Groups[mapping.AdGroupId].Members.GetAsync(r =>
                    {
                        r.QueryParameters.Top = 999;
                    }, ct);

                    while (membersPage?.Value is not null)
                    {
                        foreach (var member in membersPage.Value.OfType<Microsoft.Graph.Models.User>())
                        {
                            if (string.IsNullOrWhiteSpace(member.Id)) continue;

                            total++;
                            try
                            {
                                var wasCreated = await UpsertUserAsync(member, ct);
                                if (wasCreated) created++; else updated++;

                                if (!userRolesToAssign.ContainsKey(member.Id))
                                    userRolesToAssign[member.Id] = new HashSet<Guid>();
                                userRolesToAssign[member.Id].Add(mapping.RoleId);
                            }
                            catch (Exception ex)
                            {
                                errors++;
                                errorDetails.Add($"User {member.Id}: {ex.Message}");
                                logger.LogWarning(ex, "Failed to sync member {ObjectId} from group {GroupId}", member.Id, mapping.AdGroupId);
                            }
                        }

                        if (membersPage.OdataNextLink is not null)
                        {
                            membersPage = await graph.Groups[mapping.AdGroupId].Members
                                .WithUrl(membersPage.OdataNextLink)
                                .GetAsync(cancellationToken: ct);
                        }
                        else break;
                    }
                }
                catch (Exception ex)
                {
                    errors++;
                    errorDetails.Add($"Group {mapping.AdGroupId}: {ex.Message}");
                    logger.LogWarning(ex, "Failed to fetch members for group {GroupId}", mapping.AdGroupId);
                }
            }

            await db.SaveChangesAsync(ct);

            // Assign roles
            var mappedRoleIds = mappings.Select(m => m.RoleId).Distinct().ToHashSet();

            foreach (var (objectId, roleIds) in userRolesToAssign)
            {
                var user = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == objectId, ct);
                if (user is null) continue;

                var existingRoleIds = await db.AppUserRoles
                    .Where(ur => ur.UserId == user.Id)
                    .Select(ur => ur.RoleId)
                    .ToListAsync(ct);

                foreach (var roleId in roleIds)
                {
                    if (!existingRoleIds.Contains(roleId))
                    {
                        db.AppUserRoles.Add(new AppUserRole { UserId = user.Id, RoleId = roleId });
                        rolesAssigned++;
                    }
                }

                if (removeUnmappedRoles)
                {
                    foreach (var existingRoleId in existingRoleIds)
                    {
                        if (mappedRoleIds.Contains(existingRoleId) && !roleIds.Contains(existingRoleId))
                        {
                            var toRemove = await db.AppUserRoles
                                .FirstOrDefaultAsync(ur => ur.UserId == user.Id && ur.RoleId == existingRoleId, ct);
                            if (toRemove is not null)
                            {
                                db.AppUserRoles.Remove(toRemove);
                                rolesRemoved++;
                            }
                        }
                    }
                }

                if (syncPhotos)
                {
                    try
                    {
                        var synced = await SyncUserPhotoAsync(objectId, ct);
                        if (synced) photosSynced++;
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to sync photo for {ObjectId}", objectId);
                    }
                }
            }

            await db.SaveChangesAsync(ct);
            log.Status = "completed";
        }
        catch (Exception ex)
        {
            log.Status = "failed";
            errorDetails.Add($"Fatal: {ex.Message}");
            logger.LogError(ex, "Group mapping sync failed.");
        }

        log.CompletedAtUtc = DateTime.UtcNow;
        log.TotalProcessed = total;
        log.UsersCreated = created;
        log.UsersUpdated = updated;
        log.RolesAssigned = rolesAssigned;
        log.RolesRemoved = rolesRemoved;
        log.PhotosSynced = photosSynced;
        log.Errors = errors;
        if (errorDetails.Count > 0)
            log.ErrorDetailsJson = JsonSerializer.Serialize(errorDetails);

        await db.SaveChangesAsync(ct);
        return new AdSyncResult(total, created, updated, errors);
    }

    public async Task<bool> SyncUserPhotoAsync(string objectId, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);

        try
        {
            var photoStream = await graph.Users[objectId].Photo.Content.GetAsync(cancellationToken: ct);
            if (photoStream is null) return false;

            using var ms = new MemoryStream();
            await photoStream.CopyToAsync(ms, ct);
            var bytes = ms.ToArray();
            if (bytes.Length == 0) return false;

            var bucket = config["Storage:Minio:Bucket"] ?? "uoh-meetings";
            var container = config["Storage:AzureBlob:Container"] ?? "uoh-meetings";
            var bucketOrContainer = storage.Provider == "azure" ? container : bucket;
            var objectKey = $"avatars/{objectId}.jpg";

            await storage.UploadAsync(bucketOrContainer, objectKey, "image/jpeg", bytes, ct);

            var minioEndpoint = config["Storage:Minio:PublicEndpoint"] ?? config["Storage:Minio:Endpoint"] ?? "";
            var avatarUrl = $"{minioEndpoint.TrimEnd('/')}/{bucketOrContainer}/{objectKey}";

            var user = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == objectId, ct);
            if (user is not null)
            {
                user.AvatarUrl = avatarUrl;
                user.UpdatedAtUtc = DateTime.UtcNow;
            }

            return true;
        }
        catch (Microsoft.Graph.Models.ODataErrors.ODataError ex) when (ex.ResponseStatusCode == 404)
        {
            return false;
        }
    }

    public async Task<List<AdGroupInfo>> SearchAdGroupsAsync(string query, int top = 20, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);
        var result = new List<AdGroupInfo>();

        var groupsPage = await graph.Groups.GetAsync(r =>
        {
            r.QueryParameters.Select = ["id", "displayName", "description"];
            r.QueryParameters.Top = top;
            r.QueryParameters.Filter = $"startswith(displayName,'{EscapeOData(query)}')";
        }, ct);

        if (groupsPage?.Value is not null)
        {
            result.AddRange(groupsPage.Value.Select(g => new AdGroupInfo(
                g.Id ?? "",
                g.DisplayName ?? "",
                g.Description,
                null
            )));
        }

        return result;
    }

    public async Task<List<AdUserInfo>> GetGroupMembersAsync(string groupId, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);
        var result = new List<AdUserInfo>();

        var membersPage = await graph.Groups[groupId].Members.GetAsync(r =>
        {
            r.QueryParameters.Top = 999;
        }, ct);

        if (membersPage?.Value is not null)
        {
            result.AddRange(membersPage.Value.OfType<Microsoft.Graph.Models.User>().Select(u => new AdUserInfo(
                u.Id ?? "",
                u.DisplayName ?? "",
                u.Mail ?? u.UserPrincipalName ?? "",
                u.JobTitle,
                u.Department,
                u.EmployeeId
            )));
        }

        return result;
    }

    public async Task<List<AdUserInfo>> SearchAdUsersAsync(string query, int top = 20, CancellationToken ct = default)
    {
        var graph = await CreateGraphClientAsync(ct);
        var result = new List<AdUserInfo>();

        var usersPage = await graph.Users.GetAsync(r =>
        {
            r.QueryParameters.Select = ["id", "displayName", "mail", "userPrincipalName", "jobTitle", "department", "employeeId"];
            r.QueryParameters.Top = top;
            r.QueryParameters.Filter = $"startswith(displayName,'{EscapeOData(query)}') or startswith(mail,'{EscapeOData(query)}')";
        }, ct);

        if (usersPage?.Value is not null)
        {
            result.AddRange(usersPage.Value.Select(u => new AdUserInfo(
                u.Id ?? "",
                u.DisplayName ?? "",
                u.Mail ?? u.UserPrincipalName ?? "",
                u.JobTitle,
                u.Department,
                u.EmployeeId
            )));
        }

        return result;
    }

    private async Task<bool> UpsertUserAsync(Microsoft.Graph.Models.User adUser, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(adUser.Id)) return false;

        var existing = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == adUser.Id, ct);
        var wasCreated = existing is null;

        if (existing is null)
        {
            existing = new AppUser { ObjectId = adUser.Id };
            db.AppUsers.Add(existing);
        }

        existing.DisplayNameEn = adUser.DisplayName ?? existing.DisplayNameEn;
        existing.DisplayNameAr = adUser.DisplayName ?? existing.DisplayNameAr;
        existing.Email = adUser.Mail ?? adUser.UserPrincipalName ?? existing.Email;
        existing.JobTitleEn = adUser.JobTitle ?? existing.JobTitleEn;
        existing.Department = adUser.Department ?? existing.Department;
        existing.EmployeeId = adUser.EmployeeId ?? existing.EmployeeId;
        existing.PhoneNumber = adUser.MobilePhone ?? existing.PhoneNumber;
        existing.IsSynced = true;
        existing.LastSyncAtUtc = DateTime.UtcNow;
        existing.UpdatedAtUtc = DateTime.UtcNow;

        return wasCreated;
    }

    private static string EscapeOData(string value)
    {
        return value.Replace("'", "''");
    }
}
