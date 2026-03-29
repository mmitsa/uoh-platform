using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Hubs;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/public/share")]
public sealed class PublicShareController(IShareLinkService shareLinkService) : ControllerBase
{
    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> Resolve(string token)
    {
        var data = await shareLinkService.ResolveTokenAsync(token);
        return Ok(data);
    }

    public sealed record CheckInRequest(string Email, string? DisplayName);

    [HttpPost("{token}/check-in")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckIn(
        string token,
        [FromBody] CheckInRequest req,
        [FromServices] AppDbContext db,
        [FromServices] IHubContext<NotificationHub> hubContext)
    {
        // 1. Validate share link
        var link = await db.ShareLinks
            .FirstOrDefaultAsync(s => s.Token == token && s.IsActive);

        if (link is null)
            return NotFound(new { code = "SHARE_LINK_NOT_FOUND" });

        if (link.EntityType != ShareableEntityType.Attendance)
            return BadRequest(new { code = "INVALID_LINK_TYPE" });

        if (link.ExpiresAtUtc.HasValue && link.ExpiresAtUtc < DateTime.UtcNow)
            return BadRequest(new { code = "SHARE_LINK_EXPIRED" });

        link.ScanCount++;

        // 2. Get the meeting
        var meetingId = link.EntityId;
        var meeting = await db.Meetings
            .Include(m => m.Committee)
            .FirstOrDefaultAsync(m => m.Id == meetingId);

        if (meeting is null)
            return NotFound(new { code = "MEETING_NOT_FOUND" });

        // 3. Get or create MOM
        var mom = await db.Moms
            .Include(m => m.Attendance)
            .FirstOrDefaultAsync(m => m.MeetingId == meetingId);

        if (mom is null)
        {
            mom = new Mom { MeetingId = meetingId, Status = MomStatus.Draft };
            db.Moms.Add(mom);
            await db.SaveChangesAsync();
        }

        // 4. Check duplicate (by email)
        var emailNorm = req.Email.Trim().ToLowerInvariant();
        var existing = mom.Attendance.FirstOrDefault(
            a => a.Email.Equals(emailNorm, StringComparison.OrdinalIgnoreCase));

        if (existing is not null)
        {
            return Ok(new
            {
                alreadyCheckedIn = true,
                checkedInAt = existing.CheckedInAtUtc,
                meetingTitleAr = meeting.TitleAr,
                meetingTitleEn = meeting.TitleEn,
            });
        }

        // 5. Create attendance record
        var displayName = req.DisplayName?.Trim() ?? req.Email;
        var record = new AttendanceRecord
        {
            MomId = mom.Id,
            UserObjectId = "",
            DisplayName = displayName,
            Email = emailNorm,
            IsPresent = true,
            AttendanceStatus = "present",
            CheckedInAtUtc = DateTime.UtcNow,
        };
        mom.Attendance.Add(record);
        await db.SaveChangesAsync();

        // 6. Notify via SignalR
        try
        {
            await hubContext.Clients
                .Group($"meeting:{meetingId}")
                .SendAsync("AttendanceUpdated", new
                {
                    meetingId,
                    record.DisplayName,
                    record.Email,
                    record.CheckedInAtUtc,
                    totalPresent = mom.Attendance.Count(a => a.IsPresent),
                });
        }
        catch { /* best effort */ }

        return Ok(new
        {
            alreadyCheckedIn = false,
            checkedInAt = record.CheckedInAtUtc,
            meetingTitleAr = meeting.TitleAr,
            meetingTitleEn = meeting.TitleEn,
        });
    }
}
