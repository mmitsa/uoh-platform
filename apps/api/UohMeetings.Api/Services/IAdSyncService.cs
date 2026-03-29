namespace UohMeetings.Api.Services;

public interface IAdSyncService
{
    /// <summary>Syncs a single user from Azure AD by their Object ID.</summary>
    Task<Entities.AppUser> SyncUserAsync(string objectId, CancellationToken ct = default);

    /// <summary>Bulk sync all users from a specific Azure AD group or the entire tenant.</summary>
    Task<AdSyncResult> SyncAllAsync(string? groupId, CancellationToken ct = default);

    /// <summary>Searches Azure AD users (for the "add user" picker in admin UI).</summary>
    Task<List<AdUserInfo>> SearchAdUsersAsync(string query, int top = 20, CancellationToken ct = default);

    /// <summary>Sync users using AD group-to-role mappings, with role assignment and photo sync.</summary>
    Task<AdSyncResult> SyncWithGroupMappingsAsync(string? triggeredByOid = null, CancellationToken ct = default);

    /// <summary>Sync user photo from Graph API to object storage.</summary>
    Task<bool> SyncUserPhotoAsync(string objectId, CancellationToken ct = default);

    /// <summary>Search Azure AD groups for the mapping picker.</summary>
    Task<List<AdGroupInfo>> SearchAdGroupsAsync(string query, int top = 20, CancellationToken ct = default);

    /// <summary>List members of an AD group.</summary>
    Task<List<AdUserInfo>> GetGroupMembersAsync(string groupId, CancellationToken ct = default);
}

public sealed record AdSyncResult(int Total, int Created, int Updated, int Errors);

public sealed record AdUserInfo(
    string ObjectId,
    string DisplayName,
    string Email,
    string? JobTitle,
    string? Department,
    string? EmployeeId);

public sealed record AdGroupInfo(
    string GroupId,
    string DisplayName,
    string? Description,
    int? MemberCount);
