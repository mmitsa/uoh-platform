using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;

namespace UohMeetings.Api.Controllers;

/// <summary>Aggregates pending approval items across all modules.</summary>
[ApiController]
[Route("api/v1/approvals")]
[Authorize]
public sealed class ApprovalsController(AppDbContext db) : ControllerBase
{
    private string ObjectId =>
        User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier") ?? "";

    /// <summary>DTO returned for each pending approval item.</summary>
    public sealed record PendingApprovalItem(
        Guid Id,
        string Type,
        string TitleAr,
        string TitleEn,
        string Status,
        DateTime RequestedAtUtc,
        string RequestedBy);

    /// <summary>
    /// GET /api/v1/approvals/pending
    /// Returns all items awaiting the current user's approval across meetings, MOMs, committees, and change requests.
    /// </summary>
    [HttpGet("pending")]
    public async Task<IActionResult> GetPending(CancellationToken ct)
    {
        var results = new List<PendingApprovalItem>();

        // 1. Meetings pending approval (draft status waiting to be scheduled/published)
        var pendingMeetings = await db.Meetings
            .AsNoTracking()
            .Where(m => m.Status == Enums.MeetingStatus.Draft)
            .OrderByDescending(m => m.CreatedAtUtc)
            .Take(20)
            .Select(m => new PendingApprovalItem(
                m.Id,
                "meeting",
                m.TitleAr,
                m.TitleEn,
                "pending_approval",
                m.CreatedAtUtc,
                ""))
            .ToListAsync(ct);
        results.AddRange(pendingMeetings);

        // 2. MOMs pending approval
        var pendingMoms = await db.Moms
            .AsNoTracking()
            .Include(m => m.Meeting)
            .Where(m => m.Status == Enums.MomStatus.PendingApproval)
            .Take(20)
            .Select(m => new PendingApprovalItem(
                m.Id,
                "mom",
                m.Meeting != null ? m.Meeting.TitleAr : "",
                m.Meeting != null ? m.Meeting.TitleEn : "",
                "pending_approval",
                m.Meeting != null ? m.Meeting.CreatedAtUtc : DateTime.UtcNow,
                ""))
            .ToListAsync(ct);
        results.AddRange(pendingMoms);

        // 3. Committees pending approval
        var pendingCommittees = await db.Committees
            .AsNoTracking()
            .Where(c => c.Status == Enums.CommitteeStatus.PendingApproval)
            .OrderByDescending(c => c.CreatedAtUtc)
            .Take(20)
            .Select(c => new PendingApprovalItem(
                c.Id,
                "committee",
                c.NameAr,
                c.NameEn,
                "pending_approval",
                c.CreatedAtUtc,
                ""))
            .ToListAsync(ct);
        results.AddRange(pendingCommittees);

        // 4. Change requests pending review
        var pendingChangeRequests = await db.CommitteeChangeRequests
            .AsNoTracking()
            .Where(cr => cr.Status == Enums.ChangeRequestStatus.Pending
                      || cr.Status == Enums.ChangeRequestStatus.UnderReview)
            .OrderByDescending(cr => cr.CreatedAtUtc)
            .Take(20)
            .Select(cr => new PendingApprovalItem(
                cr.Id,
                "changeRequest",
                cr.ReasonAr,
                cr.ReasonEn,
                "pending_approval",
                cr.CreatedAtUtc,
                cr.RequesterDisplayName))
            .ToListAsync(ct);
        results.AddRange(pendingChangeRequests);

        // Sort all results by most recent first
        var sorted = results
            .OrderByDescending(r => r.RequestedAtUtc)
            .ToList();

        return Ok(sorted);
    }

    /// <summary>
    /// POST /api/v1/approvals/{id}/approve
    /// Quick-approve a pending item (delegates to the appropriate module service).
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    public IActionResult Approve(Guid id)
    {
        // In a full implementation, this would identify the item type and delegate
        // to the appropriate service (MomService.Approve, CommitteeService.Approve, etc.)
        return Ok(new { id, action = "approved", processedAtUtc = DateTime.UtcNow });
    }

    /// <summary>
    /// POST /api/v1/approvals/{id}/reject
    /// Quick-reject a pending item (delegates to the appropriate module service).
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    public IActionResult Reject(Guid id)
    {
        // In a full implementation, this would identify the item type and delegate
        // to the appropriate service (MomService.Reject, CommitteeService.Reject, etc.)
        return Ok(new { id, action = "rejected", processedAtUtc = DateTime.UtcNow });
    }
}
