using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/moms")]
[Authorize]
public sealed class MomsController(AppDbContext db, MomExportService exporter, INotificationService notifications, WorkflowEngine workflow) : ControllerBase
{
    private const string MomWorkflowDomain = "mom-approval";
    [HttpGet("by-meeting/{meetingId:guid}")]
    public async Task<IActionResult> GetByMeeting(Guid meetingId)
    {
        var mom = await db.Moms
            .AsNoTracking()
            .Include(m => m.Attendance)
            .Include(m => m.AgendaMinutes)
            .Include(m => m.Decisions)
            .Include(m => m.Recommendations)
            .ThenInclude(r => r.SubTasks)
            .FirstOrDefaultAsync(m => m.MeetingId == meetingId);

        return mom is null ? NotFound() : Ok(mom);
    }

    [HttpPost("by-meeting/{meetingId:guid}")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> CreateForMeeting(Guid meetingId)
    {
        var meetingExists = await db.Meetings.AnyAsync(m => m.Id == meetingId);
        if (!meetingExists) return NotFound(new { code = "MEETING_NOT_FOUND" });

        var exists = await db.Moms.AnyAsync(m => m.MeetingId == meetingId);
        if (exists) return Conflict(new { code = "MOM_ALREADY_EXISTS" });

        var mom = new Mom { MeetingId = meetingId, Status = MomStatus.Draft };
        db.Moms.Add(mom);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetByMeeting), new { meetingId }, mom);
    }

    public sealed record UpsertAttendanceRequest(
        string UserObjectId, string DisplayName, string Email,
        bool IsPresent, string? AttendanceStatus, string? AbsenceReason);

    [HttpPut("{momId:guid}/attendance")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertAttendance(Guid momId, [FromBody] List<UpsertAttendanceRequest> items)
    {
        var mom = await db.Moms.Include(m => m.Attendance).FirstOrDefaultAsync(m => m.Id == momId);
        if (mom is null) return NotFound();

        mom.Attendance.Clear();
        foreach (var a in items)
        {
            var status = a.AttendanceStatus ?? (a.IsPresent ? "present" : "absent");
            mom.Attendance.Add(new AttendanceRecord
            {
                MomId = mom.Id,
                UserObjectId = a.UserObjectId.Trim(),
                DisplayName = a.DisplayName.Trim(),
                Email = a.Email.Trim(),
                IsPresent = a.IsPresent || status is "present" or "late",
                AttendanceStatus = status,
                AbsenceReason = a.AbsenceReason?.Trim(),
                CheckedInAtUtc = (a.IsPresent || status is "present" or "late") ? DateTime.UtcNow : null,
            });
        }

        await db.SaveChangesAsync();
        return Ok();
    }

    public sealed record UpsertAgendaMinuteRequest(Guid AgendaItemId, string Notes);

    [HttpPut("{momId:guid}/agenda-minutes")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertAgendaMinutes(Guid momId, [FromBody] List<UpsertAgendaMinuteRequest> items)
    {
        var mom = await db.Moms.Include(m => m.AgendaMinutes).FirstOrDefaultAsync(m => m.Id == momId);
        if (mom is null) return NotFound();

        mom.AgendaMinutes.Clear();
        foreach (var i in items)
        {
            mom.AgendaMinutes.Add(new AgendaMinute
            {
                MomId = mom.Id,
                AgendaItemId = i.AgendaItemId,
                Notes = i.Notes,
            });
        }

        await db.SaveChangesAsync();
        return Ok();
    }

    public sealed record UpsertDecisionRequest(string TitleAr, string TitleEn, string? Notes);

    [HttpPut("{momId:guid}/decisions")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertDecisions(Guid momId, [FromBody] List<UpsertDecisionRequest> items)
    {
        var mom = await db.Moms.Include(m => m.Decisions).FirstOrDefaultAsync(m => m.Id == momId);
        if (mom is null) return NotFound();

        mom.Decisions.Clear();
        foreach (var d in items)
        {
            mom.Decisions.Add(new Decision
            {
                MomId = mom.Id,
                TitleAr = d.TitleAr.Trim(),
                TitleEn = d.TitleEn.Trim(),
                Notes = d.Notes?.Trim(),
            });
        }

        await db.SaveChangesAsync();
        return Ok();
    }

    public sealed record UpsertRecommendationRequest(
        string TitleAr, string TitleEn,
        string AssignedToObjectId, string? AssignedToDisplayName, string? AssignedToEmail,
        DateTime DueDateUtc, Priority Priority,
        string? Category, string? Beneficiary);

    [HttpPut("{momId:guid}/recommendations")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertRecommendations(Guid momId, [FromBody] List<UpsertRecommendationRequest> items)
    {
        var mom = await db.Moms
            .Include(m => m.Recommendations)
            .Include(m => m.Meeting)
            .FirstOrDefaultAsync(m => m.Id == momId);
        if (mom is null) return NotFound();

        var committeeId = mom.Meeting?.CommitteeId ?? Guid.Empty;

        mom.Recommendations.Clear();
        foreach (var r in items)
        {
            mom.Recommendations.Add(new RecommendationTask
            {
                MomId = mom.Id,
                CommitteeId = committeeId,
                TitleAr = r.TitleAr.Trim(),
                TitleEn = r.TitleEn.Trim(),
                AssignedToObjectId = r.AssignedToObjectId.Trim(),
                AssignedToDisplayName = r.AssignedToDisplayName?.Trim(),
                AssignedToEmail = r.AssignedToEmail?.Trim(),
                DueDateUtc = r.DueDateUtc,
                Priority = r.Priority,
                Category = r.Category?.Trim(),
                Beneficiary = r.Beneficiary?.Trim(),
            });
        }

        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{momId:guid}/submit")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> SubmitForApproval(Guid momId, CancellationToken ct)
    {
        var mom = await db.Moms
            .Include(m => m.Meeting).ThenInclude(mt => mt!.Committee)
            .FirstOrDefaultAsync(m => m.Id == momId, ct);
        if (mom is null) return NotFound();

        if (mom.Status != MomStatus.Draft) return BadRequest(new { code = "INVALID_STATE" });
        mom.Status = MomStatus.PendingApproval;

        // Start workflow instance if a template exists for mom-approval
        try
        {
            var wfTemplate = await db.WorkflowTemplates
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Domain == MomWorkflowDomain && !t.IsDeleted, ct);

            if (wfTemplate is not null)
            {
                // Check no existing active workflow for this MOM
                var existingWf = await db.WorkflowInstances
                    .FirstOrDefaultAsync(i => i.Domain == MomWorkflowDomain && i.EntityId == mom.Id && i.Status == WorkflowStatus.Active, ct);

                if (existingWf is null)
                {
                    var instance = await workflow.StartInstanceAsync(wfTemplate.Id, MomWorkflowDomain, mom.Id, ct);
                    // Apply "submit" action to transition from draft
                    await workflow.ApplyAsync(instance.Id, "submit", User, ct);
                }
            }
        }
        catch { /* workflow engine failure must not block submission */ }

        await db.SaveChangesAsync(ct);

        // Notify committee head
        try
        {
            var committeeId = mom.Meeting?.CommitteeId;
            if (committeeId.HasValue)
            {
                var headMembers = await db.CommitteeMembers
                    .Where(cm => cm.CommitteeId == committeeId && cm.Role == "head")
                    .ToListAsync(ct);
                var payloads = headMembers.Select(h => new NotificationPayload(
                    RecipientObjectId: h.UserObjectId,
                    RecipientEmail: h.Email,
                    Type: "MomSubmitted",
                    TitleAr: $"محضر اجتماع بانتظار الاعتماد: {mom.Meeting?.TitleAr}",
                    TitleEn: $"Meeting minutes pending approval: {mom.Meeting?.TitleEn}",
                    EntityType: "Mom",
                    EntityId: mom.Id,
                    ActionUrl: "/moms")).ToList();
                if (payloads.Count > 0)
                    await notifications.NotifyManyAsync(payloads, ct);
            }
        }
        catch { /* notification failure must not block */ }

        return Ok(new { mom.Id, mom.Status });
    }

    [HttpPost("{momId:guid}/approve")]
    [Authorize(Policy = "Role.CommitteeHead")]
    public async Task<IActionResult> Approve(Guid momId, CancellationToken ct)
    {
        var mom = await db.Moms
            .Include(m => m.Meeting)
            .Include(m => m.Recommendations)
            .FirstOrDefaultAsync(m => m.Id == momId, ct);
        if (mom is null) return NotFound();

        if (mom.Status != MomStatus.PendingApproval) return BadRequest(new { code = "INVALID_STATE" });
        mom.Status = MomStatus.Approved;
        mom.ApprovedAtUtc = DateTime.UtcNow;

        // Advance workflow instance
        try
        {
            var wfInstance = await db.WorkflowInstances
                .FirstOrDefaultAsync(i => i.Domain == MomWorkflowDomain && i.EntityId == mom.Id && i.Status == WorkflowStatus.Active, ct);
            if (wfInstance is not null)
            {
                await workflow.ApplyAsync(wfInstance.Id, "approve", User, ct);
                wfInstance.Status = WorkflowStatus.Completed;
            }
        }
        catch { /* workflow engine failure must not block approval */ }

        await db.SaveChangesAsync(ct);

        // Notify assigned employees about their new tasks
        try
        {
            var payloads = mom.Recommendations
                .Where(r => !string.IsNullOrWhiteSpace(r.AssignedToEmail))
                .Select(r => new NotificationPayload(
                    RecipientObjectId: r.AssignedToObjectId,
                    RecipientEmail: r.AssignedToEmail!,
                    Type: "TaskAssigned",
                    TitleAr: $"تم تكليفك بمهمة: {r.TitleAr}",
                    TitleEn: $"You have been assigned a task: {r.TitleEn}",
                    EntityType: "Task",
                    EntityId: r.Id,
                    ActionUrl: "/tasks")).ToList();
            if (payloads.Count > 0)
                await notifications.NotifyManyAsync(payloads, ct);
        }
        catch { /* notification failure must not block */ }

        return Ok(new { mom.Id, mom.Status, mom.ApprovedAtUtc });
    }

    public sealed record RejectMomRequest(string? Reason);

    [HttpPost("{momId:guid}/reject")]
    [Authorize(Policy = "Role.CommitteeHead")]
    public async Task<IActionResult> Reject(Guid momId, [FromBody] RejectMomRequest req, CancellationToken ct)
    {
        var mom = await db.Moms
            .Include(m => m.Meeting)
            .FirstOrDefaultAsync(m => m.Id == momId, ct);
        if (mom is null) return NotFound();

        if (mom.Status != MomStatus.PendingApproval) return BadRequest(new { code = "INVALID_STATE" });
        mom.Status = MomStatus.Draft; // Return to draft for revision

        // Advance workflow instance
        try
        {
            var wfInstance = await db.WorkflowInstances
                .FirstOrDefaultAsync(i => i.Domain == MomWorkflowDomain && i.EntityId == mom.Id && i.Status == WorkflowStatus.Active, ct);
            if (wfInstance is not null)
                await workflow.ApplyAsync(wfInstance.Id, "reject", User, ct);
        }
        catch { /* workflow engine failure must not block */ }

        await db.SaveChangesAsync(ct);

        // Notify secretary about rejection
        try
        {
            var committeeId = mom.Meeting?.CommitteeId;
            if (committeeId.HasValue)
            {
                var secretaries = await db.CommitteeMembers
                    .Where(cm => cm.CommitteeId == committeeId && cm.Role == "secretary")
                    .ToListAsync(ct);
                var payloads = secretaries.Select(s => new NotificationPayload(
                    RecipientObjectId: s.UserObjectId,
                    RecipientEmail: s.Email,
                    Type: "MomRejected",
                    TitleAr: $"تم رفض المحضر: {mom.Meeting?.TitleAr}" + (req.Reason is not null ? $" - السبب: {req.Reason}" : ""),
                    TitleEn: $"Minutes rejected: {mom.Meeting?.TitleEn}" + (req.Reason is not null ? $" - Reason: {req.Reason}" : ""),
                    EntityType: "Mom",
                    EntityId: mom.Id,
                    ActionUrl: "/moms")).ToList();
                if (payloads.Count > 0)
                    await notifications.NotifyManyAsync(payloads, ct);
            }
        }
        catch { /* notification failure must not block */ }

        return Ok(new { mom.Id, mom.Status });
    }

    /// <summary>Get the workflow history/audit trail for a MOM.</summary>
    [HttpGet("{momId:guid}/workflow")]
    public async Task<IActionResult> GetWorkflowStatus(Guid momId, CancellationToken ct)
    {
        var instance = await db.WorkflowInstances
            .AsNoTracking()
            .Include(i => i.History)
            .FirstOrDefaultAsync(i => i.Domain == MomWorkflowDomain && i.EntityId == momId, ct);

        if (instance is null)
            return Ok(new { hasWorkflow = false });

        return Ok(new
        {
            hasWorkflow = true,
            currentState = instance.CurrentState,
            status = instance.Status.ToString(),
            history = instance.History
                .OrderBy(h => h.OccurredAtUtc)
                .Select(h => new { h.Action, h.FromState, h.ToState, h.ActorDisplayName, h.OccurredAtUtc })
        });
    }

    [HttpPost("{momId:guid}/export")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Export(Guid momId, CancellationToken ct)
    {
        var mom = await db.Moms.FirstOrDefaultAsync(m => m.Id == momId, ct);
        if (mom is null) return NotFound();
        if (mom.Status != MomStatus.Approved) return BadRequest(new { code = "MOM_NOT_APPROVED" });

        var (wordFile, pdfFile) = await exporter.ExportAndStoreAsync(momId, ct);
        return Ok(new
        {
            wordFileId = wordFile.Id,
            pdfFileId = pdfFile.Id,
            wordDownloadUrl = $"/api/v1/files/{wordFile.Id}/download",
            pdfDownloadUrl = $"/api/v1/files/{pdfFile.Id}/download",
        });
    }
}
