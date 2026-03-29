using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.ChangeRequestsController;

namespace UohMeetings.Api.Services;

public sealed class ChangeRequestService(AppDbContext db, ICacheService cache, INotificationService notifications) : IChangeRequestService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, Guid? committeeId, ChangeRequestStatus? status)
    {
        var q = db.CommitteeChangeRequests.AsNoTracking();
        if (committeeId.HasValue) q = q.Where(r => r.CommitteeId == committeeId.Value);
        if (status.HasValue) q = q.Where(r => r.Status == status.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.Committee)
            .Select(r => new
            {
                r.Id, r.CommitteeId,
                CommitteeNameAr = r.Committee != null ? r.Committee.NameAr : "",
                CommitteeNameEn = r.Committee != null ? r.Committee.NameEn : "",
                r.RequesterDisplayName, r.ReasonAr, r.ReasonEn,
                r.Status, r.CreatedAtUtc, r.ReviewedAtUtc,
            })
            .ToListAsync();
        return (total, items.Cast<object>().ToList());
    }

    public async Task<CommitteeChangeRequest> GetAsync(Guid id)
    {
        return await db.CommitteeChangeRequests
            .Include(r => r.Committee)
            .FirstOrDefaultAsync(r => r.Id == id)
            ?? throw new KeyNotFoundException($"ChangeRequest {id} not found.");
    }

    public async Task<CommitteeChangeRequest> CreateAsync(CreateChangeRequestRequest request)
    {
        var committeeExists = await db.Committees.AnyAsync(c => c.Id == request.CommitteeId);
        if (!committeeExists) throw new KeyNotFoundException($"Committee {request.CommitteeId} not found.");

        var changeRequest = new CommitteeChangeRequest
        {
            CommitteeId = request.CommitteeId,
            RequesterObjectId = request.RequesterObjectId,
            RequesterDisplayName = request.RequesterDisplayName,
            ReasonAr = request.ReasonAr.Trim(),
            ReasonEn = request.ReasonEn.Trim(),
            ChangesJson = request.ChangesJson ?? "{}",
            Status = ChangeRequestStatus.Pending,
        };

        db.CommitteeChangeRequests.Add(changeRequest);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("change-requests:");

        try
        {
            await notifications.NotifyAsync(new NotificationPayload(
                RecipientObjectId: "",
                RecipientEmail: null,
                Type: "CommitteeChangeRequestCreated",
                TitleAr: "طلب تعديل لجنة جديد",
                TitleEn: "New committee change request",
                EntityType: "CommitteeChangeRequest",
                EntityId: changeRequest.Id,
                ActionUrl: "/committees"
            ));
        }
        catch { /* notification failure must not block */ }

        return changeRequest;
    }

    public async Task<CommitteeChangeRequest> ReviewAsync(Guid id, ReviewChangeRequestRequest request)
    {
        var changeRequest = await db.CommitteeChangeRequests.FindAsync(id)
            ?? throw new KeyNotFoundException($"ChangeRequest {id} not found.");

        changeRequest.Status = request.Approved ? ChangeRequestStatus.Approved : ChangeRequestStatus.Rejected;
        changeRequest.ReviewerObjectId = request.ReviewerObjectId;
        changeRequest.ReviewerDisplayName = request.ReviewerDisplayName;
        changeRequest.ReviewNotesAr = request.NotesAr?.Trim();
        changeRequest.ReviewNotesEn = request.NotesEn?.Trim();
        changeRequest.ReviewedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("change-requests:");
        return changeRequest;
    }
}
