using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class RoleManagementService(AppDbContext db, ICacheService cache, IPermissionService permissionService) : IRoleManagementService
{
    public async Task<(int Total, List<object> Items)> ListRolesAsync(int page, int pageSize, bool? isActive)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.AppRoles.AsNoTracking();

        if (isActive.HasValue)
            q = q.Where(r => r.IsActive == isActive.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderBy(r => r.Key)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => (object)new
            {
                r.Id,
                r.Key,
                r.NameAr,
                r.NameEn,
                r.DescriptionAr,
                r.DescriptionEn,
                r.IsSystem,
                r.IsActive,
                UsersCount = r.UserRoles.Count,
                PermissionsCount = r.RolePermissions.Count,
                r.CreatedAtUtc,
            })
            .ToListAsync();

        return (total, items);
    }

    public async Task<AppRole> GetRoleAsync(Guid id)
    {
        var role = await db.AppRoles
            .AsNoTracking()
            .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role is null)
            throw new NotFoundException(nameof(AppRole), id);

        return role;
    }

    public async Task<AppRole> CreateRoleAsync(string key, string nameAr, string nameEn, string? descAr, string? descEn)
    {
        var exists = await db.AppRoles.AnyAsync(r => r.Key == key);
        if (exists) throw new ConflictException($"Role with key '{key}' already exists.");

        var role = new AppRole
        {
            Key = key.Trim(),
            NameAr = nameAr.Trim(),
            NameEn = nameEn.Trim(),
            DescriptionAr = descAr?.Trim(),
            DescriptionEn = descEn?.Trim(),
            IsSystem = false,
        };

        db.AppRoles.Add(role);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("roles:");
        return role;
    }

    public async Task<AppRole> UpdateRoleAsync(Guid id, string nameAr, string nameEn, string? descAr, string? descEn)
    {
        var role = await db.AppRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) throw new NotFoundException(nameof(AppRole), id);

        role.NameAr = nameAr.Trim();
        role.NameEn = nameEn.Trim();
        role.DescriptionAr = descAr?.Trim();
        role.DescriptionEn = descEn?.Trim();
        role.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("roles:");
        return role;
    }

    public async Task DeleteRoleAsync(Guid id)
    {
        var role = await db.AppRoles.FirstOrDefaultAsync(r => r.Id == id);
        if (role is null) throw new NotFoundException(nameof(AppRole), id);
        if (role.IsSystem) throw new ForbiddenException("System roles cannot be deleted.");

        // Invalidate permissions cache for all affected users
        var affectedUserOids = await db.AppUserRoles
            .Where(ur => ur.RoleId == id)
            .Select(ur => ur.User!.ObjectId)
            .ToListAsync();

        db.AppRoles.Remove(role);
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("roles:");
        foreach (var oid in affectedUserOids)
            await permissionService.InvalidateUserPermissionsCacheAsync(oid);
    }

    public async Task SetRolePermissionsAsync(Guid roleId, List<Guid> permissionIds)
    {
        var role = await db.AppRoles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == roleId);

        if (role is null) throw new NotFoundException(nameof(AppRole), roleId);

        // Remove existing
        db.AppRolePermissions.RemoveRange(role.RolePermissions);

        // Add new
        foreach (var permId in permissionIds.Distinct())
        {
            db.AppRolePermissions.Add(new AppRolePermission
            {
                RoleId = roleId,
                PermissionId = permId,
            });
        }

        role.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Invalidate all affected users' cache
        var affectedUserOids = await db.AppUserRoles
            .Where(ur => ur.RoleId == roleId)
            .Select(ur => ur.User!.ObjectId)
            .ToListAsync();

        await cache.RemoveByPrefixAsync("roles:");
        await cache.RemoveByPrefixAsync("permissions:all:");
        foreach (var oid in affectedUserOids)
            await permissionService.InvalidateUserPermissionsCacheAsync(oid);
    }

    public async Task<List<AppPermission>> GetRolePermissionsAsync(Guid roleId)
    {
        var exists = await db.AppRoles.AnyAsync(r => r.Id == roleId);
        if (!exists) throw new NotFoundException(nameof(AppRole), roleId);

        return await db.AppRolePermissions
            .AsNoTracking()
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.Permission!)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.Key)
            .ToListAsync();
    }
}
