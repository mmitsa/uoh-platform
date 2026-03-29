using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class UserManagementService(AppDbContext db, ICacheService cache, IPermissionService permissionService) : IUserManagementService
{
    public async Task<(int Total, List<object> Items)> ListUsersAsync(int page, int pageSize, string? search, bool? isActive)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.AppUsers.AsNoTracking();

        if (isActive.HasValue)
            q = q.Where(u => u.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            q = q.Where(u =>
                u.DisplayNameAr.ToLower().Contains(term) ||
                u.DisplayNameEn.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                (u.EmployeeId != null && u.EmployeeId.ToLower().Contains(term)));
        }

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => (object)new
            {
                u.Id,
                u.ObjectId,
                u.DisplayNameAr,
                u.DisplayNameEn,
                u.Email,
                u.EmployeeId,
                u.JobTitleAr,
                u.JobTitleEn,
                u.Department,
                u.PhoneNumber,
                u.IsActive,
                u.IsSynced,
                u.LastLoginAtUtc,
                u.CreatedAtUtc,
                Roles = u.UserRoles
                    .Where(ur => ur.Role!.IsActive)
                    .Select(ur => new { ur.Role!.Id, ur.Role.Key, ur.Role.NameAr, ur.Role.NameEn })
                    .ToList(),
            })
            .ToListAsync();

        return (total, items);
    }

    public async Task<AppUser> GetUserAsync(Guid id)
    {
        var user = await db.AppUsers
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            throw new NotFoundException(nameof(AppUser), id);

        return user;
    }

    public async Task<AppUser> GetOrCreateByObjectIdAsync(string objectId, string displayName, string email)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == objectId);

        if (user is not null)
        {
            user.LastLoginAtUtc = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(user.DisplayNameEn) && !string.IsNullOrWhiteSpace(displayName))
                user.DisplayNameEn = displayName;
            if (string.IsNullOrWhiteSpace(user.Email) && !string.IsNullOrWhiteSpace(email))
                user.Email = email;
            await db.SaveChangesAsync();
            return user;
        }

        user = new AppUser
        {
            ObjectId = objectId,
            DisplayNameAr = displayName,
            DisplayNameEn = displayName,
            Email = email,
            IsActive = true,
            IsSynced = false,
            LastLoginAtUtc = DateTime.UtcNow,
        };

        db.AppUsers.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<AppUser> UpdateUserAsync(Guid id, UpdateUserRequest request)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            throw new NotFoundException(nameof(AppUser), id);

        user.DisplayNameAr = request.DisplayNameAr.Trim();
        user.DisplayNameEn = request.DisplayNameEn.Trim();
        user.Email = request.Email.Trim();
        user.EmployeeId = request.EmployeeId?.Trim();
        user.JobTitleAr = request.JobTitleAr?.Trim();
        user.JobTitleEn = request.JobTitleEn?.Trim();
        user.Department = request.Department?.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("users:");
        return user;
    }

    public async Task ToggleUserActiveAsync(Guid id, bool isActive)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
            throw new NotFoundException(nameof(AppUser), id);

        user.IsActive = isActive;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("users:");
        await permissionService.InvalidateUserPermissionsCacheAsync(user.ObjectId);
    }

    public async Task<List<UserPermissionSummary>> GetUserPermissionsAsync(Guid userId)
    {
        var user = await db.AppUsers.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null)
            throw new NotFoundException(nameof(AppUser), userId);

        return await permissionService.GetDetailedPermissionsAsync(user.ObjectId);
    }

    public async Task AssignRoleAsync(Guid userId, Guid roleId, string? assignedByObjectId, DateTime? expiresAtUtc)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) throw new NotFoundException(nameof(AppUser), userId);

        var role = await db.AppRoles.FirstOrDefaultAsync(r => r.Id == roleId);
        if (role is null) throw new NotFoundException(nameof(AppRole), roleId);

        var exists = await db.AppUserRoles.AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        if (exists) throw new ConflictException("User already has this role.");

        db.AppUserRoles.Add(new AppUserRole
        {
            UserId = userId,
            RoleId = roleId,
            AssignedByObjectId = assignedByObjectId,
            ExpiresAtUtc = expiresAtUtc,
        });
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("users:");
        await permissionService.InvalidateUserPermissionsCacheAsync(user.ObjectId);
    }

    public async Task RemoveRoleAsync(Guid userId, Guid roleId)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is null) throw new NotFoundException(nameof(AppUser), userId);

        var userRole = await db.AppUserRoles.FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
        if (userRole is null) throw new NotFoundException("UserRole", $"{userId}/{roleId}");

        db.AppUserRoles.Remove(userRole);
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("users:");
        await permissionService.InvalidateUserPermissionsCacheAsync(user.ObjectId);
    }
}
