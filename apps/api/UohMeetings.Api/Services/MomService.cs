using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class MomService(AppDbContext db, INotificationService notifications) : IMomService
{
    public async Task<Mom> GetByMeetingAsync(Guid meetingId)
    {
        var mom = await db.Moms
            .AsNoTracking()
            .Include(m => m.Attendance)
            .Include(m => m.AgendaMinutes)
            .Include(m => m.Decisions)
            .Include(m => m.Recommendations)
                .ThenInclude(r => r.SubTasks)
            .FirstOrDefaultAsync(m => m.MeetingId == meetingId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), meetingId);

        return mom;
    }

    public async Task<Mom> CreateForMeetingAsync(Guid meetingId)
    {
        var meetingExists = await db.Meetings.AnyAsync(m => m.Id == meetingId);
        if (!meetingExists)
            throw new NotFoundException(nameof(Meeting), meetingId);

        var exists = await db.Moms.AnyAsync(m => m.MeetingId == meetingId);
        if (exists)
            throw new ConflictException("A MOM already exists for this meeting.");

        var mom = new Mom
        {
            MeetingId = meetingId,
            Status = MomStatus.Draft,
        };

        db.Moms.Add(mom);
        await db.SaveChangesAsync();

        return mom;
    }

    public async Task UpsertAttendanceAsync(Guid momId, List<(string UserObjectId, string DisplayName, string Email, bool IsPresent, string? AbsenceReason)> items)
    {
        var mom = await db.Moms
            .Include(m => m.Attendance)
            .FirstOrDefaultAsync(m => m.Id == momId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), momId);

        mom.Attendance.Clear();
        foreach (var a in items)
        {
            mom.Attendance.Add(new AttendanceRecord
            {
                MomId = mom.Id,
                UserObjectId = a.UserObjectId.Trim(),
                DisplayName = a.DisplayName.Trim(),
                Email = a.Email.Trim(),
                IsPresent = a.IsPresent,
                AbsenceReason = a.AbsenceReason?.Trim(),
            });
        }

        await db.SaveChangesAsync();
    }

    public async Task UpsertAgendaMinutesAsync(Guid momId, List<(Guid AgendaItemId, string Notes)> items)
    {
        var mom = await db.Moms
            .Include(m => m.AgendaMinutes)
            .FirstOrDefaultAsync(m => m.Id == momId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), momId);

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
    }

    public async Task UpsertDecisionsAsync(Guid momId, List<(string TitleAr, string TitleEn, string? Notes)> items)
    {
        var mom = await db.Moms
            .Include(m => m.Decisions)
            .FirstOrDefaultAsync(m => m.Id == momId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), momId);

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
    }

    public async Task<Mom> SubmitForApprovalAsync(Guid momId)
    {
        var mom = await db.Moms.FirstOrDefaultAsync(m => m.Id == momId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), momId);

        if (mom.Status != MomStatus.Draft)
            throw new Exceptions.ValidationException("Status", "MOM must be in Draft status to submit for approval.");

        mom.Status = MomStatus.PendingApproval;
        await db.SaveChangesAsync();

        // Notify committee head(s) — fire-and-forget
        try
        {
            var meeting = await db.Meetings.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mom.MeetingId);
            if (meeting?.CommitteeId != null)
            {
                var heads = await db.Set<CommitteeMember>()
                    .AsNoTracking()
                    .Where(cm => cm.CommitteeId == meeting.CommitteeId && cm.Role == "head" && cm.IsActive)
                    .ToListAsync();
                var payloads = heads.Select(h => new NotificationPayload(
                    RecipientObjectId: h.UserObjectId,
                    RecipientEmail: h.Email,
                    Type: "MomSubmitted",
                    TitleAr: "محضر اجتماع بانتظار الاعتماد",
                    TitleEn: "Meeting minutes pending approval",
                    EntityType: "Mom",
                    EntityId: mom.Id,
                    ActionUrl: "/moms")).ToList();
                if (payloads.Count > 0)
                    await notifications.NotifyManyAsync(payloads);
            }
        }
        catch { /* notification failure must not block the main operation */ }

        return mom;
    }

    public async Task<Mom> ApproveAsync(Guid momId)
    {
        var mom = await db.Moms.FirstOrDefaultAsync(m => m.Id == momId);

        if (mom is null)
            throw new NotFoundException(nameof(Mom), momId);

        if (mom.Status != MomStatus.PendingApproval)
            throw new Exceptions.ValidationException("Status", "MOM must be in PendingApproval status to approve.");

        mom.Status = MomStatus.Approved;
        mom.ApprovedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Notify committee secretary(ies) — fire-and-forget
        try
        {
            var meeting = await db.Meetings.AsNoTracking().FirstOrDefaultAsync(m => m.Id == mom.MeetingId);
            if (meeting?.CommitteeId != null)
            {
                var secretaries = await db.Set<CommitteeMember>()
                    .AsNoTracking()
                    .Where(cm => cm.CommitteeId == meeting.CommitteeId && cm.Role == "secretary" && cm.IsActive)
                    .ToListAsync();
                var payloads = secretaries.Select(s => new NotificationPayload(
                    RecipientObjectId: s.UserObjectId,
                    RecipientEmail: s.Email,
                    Type: "MomApproved",
                    TitleAr: "تم اعتماد محضر الاجتماع",
                    TitleEn: "Meeting minutes approved",
                    EntityType: "Mom",
                    EntityId: mom.Id,
                    ActionUrl: "/moms")).ToList();
                if (payloads.Count > 0)
                    await notifications.NotifyManyAsync(payloads);
            }
        }
        catch { /* notification failure must not block the main operation */ }

        return mom;
    }
}
