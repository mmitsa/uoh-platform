using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/meetings")]
[Authorize]
public sealed class MeetingsController(IMeetingService meetingService, AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] Guid? committeeId = null)
    {
        var (total, items) = await meetingService.ListAsync(page, pageSize, committeeId);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var meeting = await meetingService.GetAsync(id);
        return Ok(meeting);
    }

    /// <summary>Get agenda items for a specific meeting.</summary>
    [HttpGet("{id:guid}/agenda")]
    public async Task<IActionResult> GetAgenda(Guid id)
    {
        var meetingExists = await db.Meetings.AnyAsync(m => m.Id == id);
        if (!meetingExists) return NotFound();

        var items = await db.AgendaItems
            .AsNoTracking()
            .Where(a => a.MeetingId == id)
            .OrderBy(a => a.Order)
            .Select(a => new
            {
                a.Id,
                a.MeetingId,
                a.Order,
                a.TitleAr,
                a.TitleEn,
                a.DescriptionAr,
                a.DescriptionEn,
                a.DurationMinutes,
                a.PresenterName,
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> GetCalendarEvents(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] Guid? committeeId = null)
    {
        var events = await meetingService.GetCalendarEventsAsync(from, to, committeeId, HttpContext.RequestAborted);
        return Ok(events);
    }

    public sealed record CreateMeetingRequest(
        Guid? CommitteeId,
        string TitleAr,
        string TitleEn,
        string? DescriptionAr,
        string? DescriptionEn,
        MeetingType Type,
        DateTime StartDateTimeUtc,
        DateTime EndDateTimeUtc,
        string? Location,
        Guid? MeetingRoomId,
        OnlinePlatform? OnlinePlatform
    );

    [HttpPost]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Create([FromBody] CreateMeetingRequest req)
    {
        var meeting = await meetingService.CreateAsync(req);
        return CreatedAtAction(nameof(Get), new { id = meeting.Id }, meeting);
    }

    public sealed record UpsertAgendaItemRequest(
        int Order,
        string TitleAr,
        string TitleEn,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        int? DurationMinutes = null,
        string? PresenterName = null
    );

    [HttpPut("{id:guid}/agenda")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertAgenda(Guid id, [FromBody] List<UpsertAgendaItemRequest> items)
    {
        await meetingService.UpsertAgendaAsync(id, items.Select(i =>
            (i.Order, i.TitleAr, i.TitleEn, i.DescriptionAr, i.DescriptionEn, i.DurationMinutes, i.PresenterName)
        ).ToList());
        return Ok();
    }

    public sealed record UpsertInviteesRequest(List<InviteeDto> Invitees);
    public sealed record InviteeDto(string Email, string? DisplayName, InviteeRole Role);

    [HttpPut("{id:guid}/invitees")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> UpsertInvitees(Guid id, [FromBody] UpsertInviteesRequest req)
    {
        await meetingService.UpsertInviteesAsync(id, req.Invitees.Select(i => (i.Email, i.DisplayName, i.Role)).ToList());
        return Ok();
    }

    /// <summary>Get invitees for a specific meeting.</summary>
    [HttpGet("{id:guid}/invitees")]
    public async Task<IActionResult> GetInvitees(Guid id)
    {
        var meetingExists = await db.Meetings.AnyAsync(m => m.Id == id);
        if (!meetingExists) return NotFound();

        var invitees = await db.MeetingInvitees
            .AsNoTracking()
            .Where(i => i.MeetingId == id)
            .Select(i => new { i.Id, i.Email, i.DisplayName, Role = i.Role.ToString() })
            .ToListAsync();

        return Ok(invitees);
    }

    /// <summary>Send notifications to meeting invitees.</summary>
    [HttpPost("{id:guid}/notify")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Notify(Guid id)
    {
        var meeting = await db.Meetings
            .Include(m => m.Invitees)
            .Include(m => m.Committee)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (meeting is null) return NotFound();

        return Ok(new { sent = meeting.Invitees.Count });
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var meeting = await meetingService.PublishAsync(id, HttpContext.RequestAborted);
        return Ok(new { meeting.Id, meeting.Status });
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var meeting = await meetingService.CancelAsync(id, HttpContext.RequestAborted);
        return Ok(new { meeting.Id, meeting.Status });
    }
}
