using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class AdGroupMappingService(AppDbContext db) : IAdGroupMappingService
{
    public async Task<List<AdGroupRoleMapping>> GetAllAsync(CancellationToken ct = default)
    {
        return await db.AdGroupRoleMappings
            .Include(m => m.Role)
            .OrderBy(m => m.Priority)
            .ThenBy(m => m.AdGroupDisplayName)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<AdGroupRoleMapping> CreateAsync(CreateAdGroupMappingRequest req, string createdByObjectId, CancellationToken ct = default)
    {
        // Check for duplicate
        var exists = await db.AdGroupRoleMappings
            .AnyAsync(m => m.AdGroupId == req.AdGroupId && m.RoleId == req.RoleId, ct);
        if (exists)
            throw new InvalidOperationException("A mapping for this AD group and role already exists.");

        var mapping = new AdGroupRoleMapping
        {
            AdGroupId = req.AdGroupId,
            AdGroupDisplayName = req.AdGroupDisplayName,
            RoleId = req.RoleId,
            Priority = req.Priority,
            IsActive = req.IsActive,
            CreatedByObjectId = createdByObjectId
        };

        db.AdGroupRoleMappings.Add(mapping);
        await db.SaveChangesAsync(ct);

        // Reload with navigation
        return await db.AdGroupRoleMappings
            .Include(m => m.Role)
            .FirstAsync(m => m.Id == mapping.Id, ct);
    }

    public async Task<AdGroupRoleMapping> UpdateAsync(Guid id, UpdateAdGroupMappingRequest req, CancellationToken ct = default)
    {
        var mapping = await db.AdGroupRoleMappings
            .Include(m => m.Role)
            .FirstOrDefaultAsync(m => m.Id == id, ct)
            ?? throw new KeyNotFoundException("Mapping not found.");

        if (req.AdGroupDisplayName is not null) mapping.AdGroupDisplayName = req.AdGroupDisplayName;
        if (req.RoleId.HasValue) mapping.RoleId = req.RoleId.Value;
        if (req.Priority.HasValue) mapping.Priority = req.Priority.Value;
        if (req.IsActive.HasValue) mapping.IsActive = req.IsActive.Value;
        mapping.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        // Reload role if changed
        if (req.RoleId.HasValue)
        {
            await db.Entry(mapping).Reference(m => m.Role).LoadAsync(ct);
        }

        return mapping;
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var mapping = await db.AdGroupRoleMappings.FirstOrDefaultAsync(m => m.Id == id, ct)
            ?? throw new KeyNotFoundException("Mapping not found.");

        db.AdGroupRoleMappings.Remove(mapping);
        await db.SaveChangesAsync(ct);
    }

    public async Task<(int Total, List<AdSyncLog> Items)> GetSyncHistoryAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.AdSyncLogs.AsNoTracking().OrderByDescending(l => l.StartedAtUtc);
        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (total, items);
    }
}
