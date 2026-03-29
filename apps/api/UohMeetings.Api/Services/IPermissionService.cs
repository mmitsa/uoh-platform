using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IPermissionService
{
    /// <summary>Gets all permission keys for a user by their Entra ID Object ID. Cached in Redis for 5 minutes.</summary>
    Task<HashSet<string>> GetPermissionsForUserAsync(string objectId, CancellationToken ct = default);

    /// <summary>Checks if a user has a specific permission.</summary>
    Task<bool> HasPermissionAsync(string objectId, string permissionKey, CancellationToken ct = default);

    /// <summary>Returns all permissions grouped by role for a user (for the review page).</summary>
    Task<List<UserPermissionSummary>> GetDetailedPermissionsAsync(string objectId, CancellationToken ct = default);

    /// <summary>Invalidates cached permissions for a user (call after role/permission changes).</summary>
    Task InvalidateUserPermissionsCacheAsync(string objectId, CancellationToken ct = default);

    /// <summary>Returns all permissions in the system grouped by category (for admin UI).</summary>
    Task<List<PermissionGroup>> GetAllPermissionsGroupedAsync(CancellationToken ct = default);
}

public sealed record UserPermissionSummary(
    Guid RoleId,
    string RoleKey,
    string RoleNameAr,
    string RoleNameEn,
    List<PermissionSummaryItem> Permissions);

public sealed record PermissionSummaryItem(
    Guid Id,
    string Key,
    string NameAr,
    string NameEn,
    string Category,
    string? Route);

public sealed record PermissionGroup(
    string Category,
    List<PermissionSummaryItem> Permissions);
