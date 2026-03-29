using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class PermissionService(AppDbContext db, ICacheService cache) : IPermissionService
{
    private const string CachePrefix = "permissions:user:";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<HashSet<string>> GetPermissionsForUserAsync(string objectId, CancellationToken ct = default)
    {
        var cacheKey = $"{CachePrefix}{objectId}";
        var cached = await cache.GetAsync<List<string>>(cacheKey);
        if (cached is not null) return new HashSet<string>(cached);

        var user = await db.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ObjectId == objectId, ct);

        if (user is null || !user.IsActive)
            return new HashSet<string>();

        var now = DateTime.UtcNow;
        var permissions = await db.AppUserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == user.Id
                && (ur.ExpiresAtUtc == null || ur.ExpiresAtUtc > now))
            .Join(db.AppRoles.Where(r => r.IsActive), ur => ur.RoleId, r => r.Id, (ur, r) => r)
            .SelectMany(r => r.RolePermissions)
            .Select(rp => rp.Permission!.Key)
            .Distinct()
            .ToListAsync(ct);

        // Check if user has SystemAdmin role — grant wildcard
        var hasAdmin = await db.AppUserRoles
            .AsNoTracking()
            .AnyAsync(ur => ur.UserId == user.Id
                && (ur.ExpiresAtUtc == null || ur.ExpiresAtUtc > now)
                && ur.Role!.Key == "SystemAdmin" && ur.Role.IsActive, ct);

        if (hasAdmin)
            permissions.Add("*");

        await cache.SetAsync(cacheKey, permissions, CacheDuration);
        return new HashSet<string>(permissions);
    }

    public async Task<bool> HasPermissionAsync(string objectId, string permissionKey, CancellationToken ct = default)
    {
        var permissions = await GetPermissionsForUserAsync(objectId, ct);
        if (permissions.Contains("*")) return true;
        return permissions.Contains(permissionKey);
    }

    public async Task<List<UserPermissionSummary>> GetDetailedPermissionsAsync(string objectId, CancellationToken ct = default)
    {
        var user = await db.AppUsers
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ObjectId == objectId, ct);

        if (user is null) return new List<UserPermissionSummary>();

        var now = DateTime.UtcNow;
        var roles = await db.AppUserRoles
            .AsNoTracking()
            .Where(ur => ur.UserId == user.Id && (ur.ExpiresAtUtc == null || ur.ExpiresAtUtc > now))
            .Include(ur => ur.Role!)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .Where(ur => ur.Role!.IsActive)
            .ToListAsync(ct);

        return roles.Select(ur => new UserPermissionSummary(
            ur.Role!.Id,
            ur.Role.Key,
            ur.Role.NameAr,
            ur.Role.NameEn,
            ur.Role.RolePermissions.Select(rp => new PermissionSummaryItem(
                rp.Permission!.Id,
                rp.Permission.Key,
                rp.Permission.NameAr,
                rp.Permission.NameEn,
                rp.Permission.Category,
                rp.Permission.Route
            )).OrderBy(p => p.Key).ToList()
        )).ToList();
    }

    public async Task InvalidateUserPermissionsCacheAsync(string objectId, CancellationToken ct = default)
    {
        await cache.RemoveByPrefixAsync($"{CachePrefix}{objectId}");
    }

    public async Task<List<PermissionGroup>> GetAllPermissionsGroupedAsync(CancellationToken ct = default)
    {
        var cacheKey = "permissions:all:grouped";
        var cached = await cache.GetAsync<List<PermissionGroup>>(cacheKey);
        if (cached is not null) return cached;

        var all = await db.AppPermissions
            .AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Key)
            .ToListAsync(ct);

        var grouped = all
            .GroupBy(p => p.Category)
            .Select(g => new PermissionGroup(
                g.Key,
                g.Select(p => new PermissionSummaryItem(p.Id, p.Key, p.NameAr, p.NameEn, p.Category, p.Route)).ToList()
            ))
            .ToList();

        await cache.SetAsync(cacheKey, grouped, TimeSpan.FromMinutes(10));
        return grouped;
    }
}
