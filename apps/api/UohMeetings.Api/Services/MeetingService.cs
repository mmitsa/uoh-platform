using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Integrations;
using static UohMeetings.Api.Controllers.MeetingsController;

namespace UohMeetings.Api.Services;

public sealed class MeetingService(
    AppDbContext db,
    IOnlineMeetingProvider onlineMeetingProvider,
    ICalendarProvider calendar,
    IConfiguration config,
    ICacheService cache,
    INotificationService notifications) : IMeetingService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, Guid? committeeId)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var cacheKey = $"meetings:list:p{page}:s{pageSize}:c{committeeId}";
        var cached = await cache.GetAsync<CachedListResult>(cacheKey);
        if (cached is not null) return (cached.Total, cached.Items);

        var q = db.Meetings.AsNoTracking();
        if (committeeId.HasValue) q = q.Where(m => m.CommitteeId == committeeId);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(m => m.StartDateTimeUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.CommitteeId,
                m.TitleAr,
                m.TitleEn,
                m.Type,
                m.StartDateTimeUtc,
                m.EndDateTimeUtc,
                m.Status,
                m.OnlinePlatform,
                hasOnlineLink = m.OnlineJoinUrl != null,
            })
            .ToListAsync();

        var result = (total, items.Cast<object>().ToList());
        await cache.SetAsync(cacheKey, new CachedListResult(result.total, result.Item2), TimeSpan.FromMinutes(2));
        return result;
    }

    public async Task<Meeting> GetAsync(Guid id)
    {
        var meeting = await db.Meetings
            .AsNoTracking()
            .Include(m => m.AgendaItems.OrderBy(a => a.Order))
            .Include(m => m.Invitees)
            .Include(m => m.MeetingRoom)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null)
            throw new NotFoundException(nameof(Meeting), id);

        return meeting;
    }

    public async Task<Meeting> CreateAsync(CreateMeetingRequest req)
    {
        if (req.EndDateTimeUtc <= req.StartDateTimeUtc)
            throw new Exceptions.ValidationException("EndDateTimeUtc", "EndDateTimeUtc must be after StartDateTimeUtc.");

        var meeting = new Meeting
        {
            CommitteeId = req.CommitteeId,
            TitleAr = req.TitleAr.Trim(),
            TitleEn = req.TitleEn.Trim(),
            DescriptionAr = req.DescriptionAr?.Trim() ?? "",
            DescriptionEn = req.DescriptionEn?.Trim() ?? "",
            Type = req.Type,
            StartDateTimeUtc = req.StartDateTimeUtc,
            EndDateTimeUtc = req.EndDateTimeUtc,
            Location = req.Location?.Trim(),
            MeetingRoomId = req.MeetingRoomId,
            OnlinePlatform = req.OnlinePlatform,
            Status = MeetingStatus.Draft,
        };

        db.Meetings.Add(meeting);
        await db.SaveChangesAsync();

        await cache.RemoveByPrefixAsync("meetings:");

        return meeting;
    }

    public async Task UpsertAgendaAsync(Guid meetingId, List<(int Order, string TitleAr, string TitleEn, string? DescriptionAr, string? DescriptionEn, int? DurationMinutes, string? PresenterName)> items)
    {
        var meeting = await db.Meetings
            .Include(m => m.AgendaItems)
            .FirstOrDefaultAsync(m => m.Id == meetingId);

        if (meeting is null)
            throw new NotFoundException(nameof(Meeting), meetingId);

        db.Set<AgendaItem>().RemoveRange(meeting.AgendaItems);
        foreach (var item in items.OrderBy(i => i.Order))
        {
            db.Set<AgendaItem>().Add(new AgendaItem
            {
                MeetingId = meeting.Id,
                Order = item.Order,
                TitleAr = item.TitleAr.Trim(),
                TitleEn = item.TitleEn.Trim(),
                DescriptionAr = item.DescriptionAr?.Trim(),
                DescriptionEn = item.DescriptionEn?.Trim(),
                DurationMinutes = item.DurationMinutes,
                PresenterName = item.PresenterName?.Trim(),
            });
        }

        meeting.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task UpsertInviteesAsync(Guid meetingId, List<(string Email, string? DisplayName, InviteeRole Role)> invitees)
    {
        var meeting = await db.Meetings
            .Include(m => m.Invitees)
            .FirstOrDefaultAsync(m => m.Id == meetingId);

        if (meeting is null)
            throw new NotFoundException(nameof(Meeting), meetingId);

        db.Set<MeetingInvitee>().RemoveRange(meeting.Invitees);
        foreach (var i in invitees)
        {
            if (string.IsNullOrWhiteSpace(i.Email)) continue;
            db.Set<MeetingInvitee>().Add(new MeetingInvitee
            {
                MeetingId = meeting.Id,
                Email = i.Email.Trim(),
                DisplayName = i.DisplayName?.Trim(),
                Role = i.Role,
            });
        }

        meeting.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task<Meeting> PublishAsync(Guid meetingId, CancellationToken ct)
    {
        var meeting = await db.Meetings
            .Include(m => m.Invitees)
            .FirstOrDefaultAsync(m => m.Id == meetingId, ct);

        if (meeting is null)
            throw new NotFoundException(nameof(Meeting), meetingId);

        if (meeting.Status != MeetingStatus.Draft)
            throw new Exceptions.ValidationException("Status", "Meeting must be in Draft status to publish.");

        // Create online meeting if type requires it
        if (meeting.Type is MeetingType.Online or MeetingType.Hybrid)
        {
            var defaultProvider = config["Integrations:OnlineMeeting:DefaultProvider"] ?? "teams";
            var provider = meeting.OnlinePlatform
                ?? (Enum.TryParse<OnlinePlatform>(defaultProvider, true, out var p) ? p : OnlinePlatform.Teams);

            if ((provider == OnlinePlatform.Teams && config.GetValue<bool>("Integrations:Teams:Enabled")) ||
                (provider == OnlinePlatform.Zoom && config.GetValue<bool>("Integrations:Zoom:Enabled")))
            {
                var result = await onlineMeetingProvider.CreateMeetingAsync(
                    new OnlineMeetingRequest(meeting.StartDateTimeUtc, meeting.EndDateTimeUtc, meeting.TitleEn),
                    ct);
                meeting.OnlineJoinUrl = result.JoinUrl;
            }
        }

        // Create or update calendar event
        if (config.GetValue<bool>("Integrations:Teams:Enabled") && string.IsNullOrWhiteSpace(meeting.CalendarEventId))
        {
            var ev = await calendar.CreateEventAsync(new CalendarEventRequest(
                meeting.StartDateTimeUtc,
                meeting.EndDateTimeUtc,
                meeting.TitleEn,
                meeting.Location,
                meeting.OnlineJoinUrl,
                AttendeeEmails: meeting.Invitees.Select(i => i.Email).ToArray()
            ), ct);
            meeting.CalendarEventId = ev.ProviderEventId;
        }
        else if (config.GetValue<bool>("Integrations:Teams:Enabled") && !string.IsNullOrWhiteSpace(meeting.CalendarEventId))
        {
            await calendar.UpdateEventAsync(meeting.CalendarEventId, new CalendarEventRequest(
                meeting.StartDateTimeUtc,
                meeting.EndDateTimeUtc,
                meeting.TitleEn,
                meeting.Location,
                meeting.OnlineJoinUrl,
                AttendeeEmails: meeting.Invitees.Select(i => i.Email).ToArray()
            ), ct);
        }

        meeting.Status = MeetingStatus.Scheduled;
        meeting.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        await cache.RemoveByPrefixAsync("meetings:");

        // Notify invitees + committee members
        try
        {
            await NotifyMeetingParticipantsAsync(meeting,
                "MeetingPublished",
                $"📅 تم نشر اجتماع: {meeting.TitleAr}",
                $"📅 Meeting published: {meeting.TitleEn}",
                $"الاجتماع \"{meeting.TitleAr}\" مجدول بتاريخ {meeting.StartDateTimeUtc:g}.",
                $"Meeting \"{meeting.TitleEn}\" is scheduled for {meeting.StartDateTimeUtc:g}.",
                ct);
        }
        catch { /* notification failure must not block the main operation */ }

        return meeting;
    }

    public async Task<Meeting> CancelAsync(Guid meetingId, CancellationToken ct)
    {
        var meeting = await db.Meetings.Include(m => m.Invitees).FirstOrDefaultAsync(m => m.Id == meetingId, ct);

        if (meeting is null)
            throw new NotFoundException(nameof(Meeting), meetingId);

        if (meeting.Status == MeetingStatus.Cancelled)
            return meeting;

        // Cancel calendar event if one exists
        if (!string.IsNullOrWhiteSpace(meeting.CalendarEventId) && config.GetValue<bool>("Integrations:Teams:Enabled"))
        {
            await calendar.CancelEventAsync(meeting.CalendarEventId, ct);
            meeting.CalendarEventId = null;
        }

        meeting.Status = MeetingStatus.Cancelled;
        meeting.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        await cache.RemoveByPrefixAsync("meetings:");

        // Notify invitees + committee members
        try
        {
            await NotifyMeetingParticipantsAsync(meeting,
                "MeetingCancelled",
                $"❌ تم إلغاء اجتماع: {meeting.TitleAr}",
                $"❌ Meeting cancelled: {meeting.TitleEn}",
                $"تم إلغاء الاجتماع \"{meeting.TitleAr}\".",
                $"Meeting \"{meeting.TitleEn}\" has been cancelled.",
                ct);
        }
        catch { /* notification failure must not block the main operation */ }

        return meeting;
    }

    public async Task<List<CalendarEventDto>> GetCalendarEventsAsync(
        DateTime from, DateTime to, Guid? committeeId, CancellationToken ct)
    {
        var meetingsQ = db.Meetings.AsNoTracking().Include(m => m.Committee).AsQueryable();
        if (committeeId.HasValue)
            meetingsQ = meetingsQ.Where(m => m.CommitteeId == committeeId);

        var meetings = await meetingsQ
            .Where(m => m.StartDateTimeUtc < to && m.EndDateTimeUtc > from)
            .OrderBy(m => m.StartDateTimeUtc)
            .Select(m => new CalendarEventDto(
                m.Id, m.TitleAr, m.TitleEn,
                m.StartDateTimeUtc, m.EndDateTimeUtc,
                m.Status.ToString(), m.Type.ToString(), "meeting",
                m.CommitteeId,
                m.Committee != null ? m.Committee.NameAr : null,
                m.Committee != null ? m.Committee.NameEn : null,
                m.Location))
            .ToListAsync(ct);

        var fromDate = DateOnly.FromDateTime(from);
        var toDate = DateOnly.FromDateTime(to);

        var committeesQ = db.Committees.AsNoTracking()
            .Where(c => c.StartDate.HasValue && c.EndDate.HasValue
                     && c.StartDate!.Value <= toDate && c.EndDate!.Value >= fromDate);

        if (committeeId.HasValue)
            committeesQ = committeesQ.Where(c => c.Id == committeeId);

        var committees = await committeesQ
            .Select(c => new CalendarEventDto(
                c.Id, c.NameAr, c.NameEn,
                c.StartDate!.Value.ToDateTime(TimeOnly.MinValue),
                c.EndDate!.Value.ToDateTime(TimeOnly.MaxValue),
                c.Status.ToString(), c.Type.ToString(), "committee",
                c.Id, c.NameAr, c.NameEn, null))
            .ToListAsync(ct);

        return meetings.Concat(committees).OrderBy(e => e.StartDateTimeUtc).ToList();
    }

    private async Task NotifyMeetingParticipantsAsync(
        Meeting meeting, string type, string titleAr, string titleEn,
        string? bodyAr, string? bodyEn, CancellationToken ct)
    {
        var payloads = new List<NotificationPayload>();
        var notifiedEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Invitees
        foreach (var invitee in meeting.Invitees.Where(i => !string.IsNullOrWhiteSpace(i.Email)))
        {
            notifiedEmails.Add(invitee.Email);
            var user = await db.AppUsers.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == invitee.Email, ct);

            payloads.Add(new NotificationPayload(
                RecipientObjectId: user?.ObjectId ?? invitee.Email,
                RecipientEmail: invitee.Email,
                Type: type,
                TitleAr: titleAr,
                TitleEn: titleEn,
                BodyAr: bodyAr,
                BodyEn: bodyEn,
                EntityType: "Meeting",
                EntityId: meeting.Id,
                ActionUrl: $"/meetings/{meeting.Id}"));
        }

        // 2. Committee members (dedup against invitees)
        if (meeting.CommitteeId.HasValue)
        {
            var members = await db.CommitteeMembers.AsNoTracking()
                .Where(cm => cm.CommitteeId == meeting.CommitteeId && cm.IsActive)
                .ToListAsync(ct);

            foreach (var member in members.Where(m => !notifiedEmails.Contains(m.Email)))
            {
                payloads.Add(new NotificationPayload(
                    RecipientObjectId: member.UserObjectId,
                    RecipientEmail: member.Email,
                    Type: type,
                    TitleAr: titleAr,
                    TitleEn: titleEn,
                    BodyAr: bodyAr,
                    BodyEn: bodyEn,
                    EntityType: "Meeting",
                    EntityId: meeting.Id,
                    ActionUrl: $"/meetings/{meeting.Id}"));
            }
        }

        if (payloads.Count > 0)
            await notifications.NotifyManyAsync(payloads, ct);
    }

    private sealed record CachedListResult(int Total, List<object> Items);
}
