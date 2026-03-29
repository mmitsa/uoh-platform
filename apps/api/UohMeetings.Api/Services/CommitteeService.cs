using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using static UohMeetings.Api.Controllers.CommitteesController;

namespace UohMeetings.Api.Services;

public sealed class CommitteeService(AppDbContext db, ICacheService cache, INotificationService notifications) : ICommitteeService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, CommitteeStatus? status, CommitteeType? type, Guid? parentId)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var cacheKey = $"committees:list:p{page}:s{pageSize}:st{status}:t{type}:pid{parentId}";
        var cached = await cache.GetAsync<CachedListResult>(cacheKey);
        if (cached is not null) return (cached.Total, cached.Items);

        var q = db.Committees.AsNoTracking();

        if (status.HasValue)
            q = q.Where(c => c.Status == status.Value);

        if (type.HasValue)
            q = q.Where(c => c.Type == type.Value);

        if (parentId.HasValue)
            q = q.Where(c => c.ParentCommitteeId == parentId.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(c => c.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.Type,
                c.NameAr,
                c.NameEn,
                c.DescriptionAr,
                c.DescriptionEn,
                c.Status,
                c.ParentCommitteeId,
                c.StartDate,
                c.EndDate,
                c.MaxMembers,
                MemberCount = c.Members.Count(m => m.IsActive),
                SubCommitteeCount = c.SubCommittees.Count,
                c.CreatedAtUtc,
            })
            .ToListAsync();

        var result = (total, items.Cast<object>().ToList());
        await cache.SetAsync(cacheKey, new CachedListResult(result.total, result.Item2), TimeSpan.FromMinutes(2));
        return result;
    }

    public async Task<Committee> GetAsync(Guid id)
    {
        var committee = await db.Committees
            .AsNoTracking()
            .Include(c => c.Members)
            .Include(c => c.SubCommittees)
            .Include(c => c.ParentCommittee)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (committee is null)
            throw new NotFoundException(nameof(Committee), id);

        return committee;
    }

    public async Task<List<object>> GetSubCommitteesAsync(Guid parentId)
    {
        var exists = await db.Committees.AnyAsync(c => c.Id == parentId);
        if (!exists)
            throw new NotFoundException(nameof(Committee), parentId);

        return await db.Committees
            .AsNoTracking()
            .Where(c => c.ParentCommitteeId == parentId)
            .OrderBy(c => c.NameAr)
            .Select(c => (object)new
            {
                c.Id,
                c.Type,
                c.NameAr,
                c.NameEn,
                c.Status,
                MemberCount = c.Members.Count(m => m.IsActive),
            })
            .ToListAsync();
    }

    public async Task<Committee> CreateAsync(CreateCommitteeRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NameAr) || string.IsNullOrWhiteSpace(request.NameEn))
            throw new Exceptions.ValidationException("Name", "NameAr and NameEn are required.");

        // Validate parent exists if specified
        if (request.ParentCommitteeId.HasValue)
        {
            var parentExists = await db.Committees.AnyAsync(c => c.Id == request.ParentCommitteeId.Value);
            if (!parentExists)
                throw new NotFoundException("ParentCommittee", request.ParentCommitteeId.Value);
        }

        var committee = new Committee
        {
            Type = request.Type,
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim() ?? "",
            DescriptionEn = request.DescriptionEn?.Trim() ?? "",
            Status = CommitteeStatus.Draft,
            ParentCommitteeId = request.ParentCommitteeId,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MaxMembers = request.MaxMembers,
            ObjectivesAr = request.ObjectivesAr?.Trim() ?? "",
            ObjectivesEn = request.ObjectivesEn?.Trim() ?? "",
        };

        db.Committees.Add(committee);
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("committees:");

        return committee;
    }

    public async Task<Committee> UpdateAsync(Guid id, UpdateCommitteeRequest request)
    {
        var committee = await db.Committees.FirstOrDefaultAsync(c => c.Id == id);
        if (committee is null)
            throw new NotFoundException(nameof(Committee), id);

        if (request.NameAr is not null) committee.NameAr = request.NameAr.Trim();
        if (request.NameEn is not null) committee.NameEn = request.NameEn.Trim();
        if (request.DescriptionAr is not null) committee.DescriptionAr = request.DescriptionAr.Trim();
        if (request.DescriptionEn is not null) committee.DescriptionEn = request.DescriptionEn.Trim();
        if (request.Status.HasValue) committee.Status = request.Status.Value;
        if (request.ParentCommitteeId.HasValue)
        {
            var parentExists = await db.Committees.AnyAsync(c => c.Id == request.ParentCommitteeId.Value);
            if (!parentExists)
                throw new NotFoundException("ParentCommittee", request.ParentCommitteeId.Value);
            committee.ParentCommitteeId = request.ParentCommitteeId;
        }
        if (request.StartDate.HasValue) committee.StartDate = request.StartDate;
        if (request.EndDate.HasValue) committee.EndDate = request.EndDate;
        if (request.MaxMembers.HasValue) committee.MaxMembers = request.MaxMembers;
        if (request.ObjectivesAr is not null) committee.ObjectivesAr = request.ObjectivesAr.Trim();
        if (request.ObjectivesEn is not null) committee.ObjectivesEn = request.ObjectivesEn.Trim();

        committee.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("committees:");

        return committee;
    }

    public async Task UpsertMemberAsync(Guid committeeId, string userObjectId, string displayName, string email, string role, bool isActive)
    {
        if (string.IsNullOrWhiteSpace(userObjectId))
            throw new Exceptions.ValidationException("UserObjectId", "UserObjectId is required.");

        var committee = await db.Committees
            .Include(c => c.Members)
            .FirstOrDefaultAsync(c => c.Id == committeeId);

        if (committee is null)
            throw new NotFoundException(nameof(Committee), committeeId);

        // Enforce max members limit
        if (committee.MaxMembers.HasValue && isActive)
        {
            var activeCount = committee.Members.Count(m => m.IsActive && m.UserObjectId != userObjectId);
            if (activeCount >= committee.MaxMembers.Value)
                throw new Exceptions.ValidationException("MaxMembers", $"Committee has reached its maximum of {committee.MaxMembers.Value} members.");
        }

        var existing = committee.Members.FirstOrDefault(m => m.UserObjectId == userObjectId);
        if (existing is null)
        {
            var member = new CommitteeMember
            {
                CommitteeId = committee.Id,
                UserObjectId = userObjectId.Trim(),
                DisplayName = displayName.Trim(),
                Email = email.Trim(),
                Role = role.Trim(),
                IsActive = isActive,
            };
            db.Set<CommitteeMember>().Add(member);
        }
        else
        {
            existing.DisplayName = displayName.Trim();
            existing.Email = email.Trim();
            existing.Role = role.Trim();
            existing.IsActive = isActive;
        }

        committee.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("committees:");

        // Notify the member — fire-and-forget
        try
        {
            await notifications.NotifyAsync(new NotificationPayload(
                RecipientObjectId: userObjectId,
                RecipientEmail: email,
                Type: "CommitteeMemberAdded",
                TitleAr: $"تمت إضافتك إلى لجنة: {committee.NameAr}",
                TitleEn: $"Added to committee: {committee.NameEn}",
                EntityType: "Committee",
                EntityId: committee.Id,
                ActionUrl: "/committees"));
        }
        catch { /* notification failure must not block the main operation */ }
    }

    public async Task<List<object>> GetHierarchyAsync()
    {
        // Return root-level committees (no parent) with their sub-committees
        var roots = await db.Committees
            .AsNoTracking()
            .Where(c => c.ParentCommitteeId == null)
            .OrderBy(c => c.Type).ThenBy(c => c.NameAr)
            .Select(c => (object)new
            {
                c.Id,
                c.Type,
                c.NameAr,
                c.NameEn,
                c.Status,
                MemberCount = c.Members.Count(m => m.IsActive),
                SubCommittees = c.SubCommittees
                    .OrderBy(s => s.NameAr)
                    .Select(s => new
                    {
                        s.Id,
                        s.Type,
                        s.NameAr,
                        s.NameEn,
                        s.Status,
                        MemberCount = s.Members.Count(m => m.IsActive),
                    }).ToList(),
            })
            .ToListAsync();

        return roots;
    }

    private sealed record CachedListResult(int Total, List<object> Items);
}
