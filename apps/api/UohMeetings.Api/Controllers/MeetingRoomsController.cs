using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/meeting-rooms")]
[Authorize]
public sealed class MeetingRoomsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool activeOnly = true)
    {
        var q = db.MeetingRooms.AsNoTracking();
        if (activeOnly) q = q.Where(r => r.IsActive);

        var rooms = await q
            .OrderBy(r => r.Building).ThenBy(r => r.NameEn)
            .Select(r => new
            {
                r.Id,
                r.NameAr,
                r.NameEn,
                r.Building,
                r.Floor,
                r.Capacity,
                r.HasVideoConference,
                r.HasProjector,
                r.IsActive,
                r.Latitude,
                r.Longitude,
                r.MapUrl,
            })
            .ToListAsync();

        return Ok(rooms);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var room = await db.MeetingRooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        return room is null ? NotFound() : Ok(room);
    }

    public sealed record CreateRoomRequest(
        string NameAr, string NameEn, string? Building, string? Floor,
        int Capacity, bool HasVideoConference, bool HasProjector,
        double? Latitude, double? Longitude, string? MapUrl);

    [HttpPost]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateRoomRequest req)
    {
        var room = new MeetingRoom
        {
            NameAr = req.NameAr.Trim(),
            NameEn = req.NameEn.Trim(),
            Building = req.Building?.Trim(),
            Floor = req.Floor?.Trim(),
            Capacity = Math.Max(1, req.Capacity),
            HasVideoConference = req.HasVideoConference,
            HasProjector = req.HasProjector,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            MapUrl = req.MapUrl?.Trim(),
        };

        db.MeetingRooms.Add(room);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = room.Id }, room);
    }

    public sealed record UpdateRoomRequest(
        string? NameAr, string? NameEn, string? Building, string? Floor,
        int? Capacity, bool? HasVideoConference, bool? HasProjector,
        bool? IsActive, double? Latitude, double? Longitude, string? MapUrl);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoomRequest req)
    {
        var room = await db.MeetingRooms.FirstOrDefaultAsync(r => r.Id == id);
        if (room is null) return NotFound();

        if (req.NameAr is not null) room.NameAr = req.NameAr.Trim();
        if (req.NameEn is not null) room.NameEn = req.NameEn.Trim();
        if (req.Building is not null) room.Building = req.Building.Trim();
        if (req.Floor is not null) room.Floor = req.Floor.Trim();
        if (req.Capacity.HasValue) room.Capacity = Math.Max(1, req.Capacity.Value);
        if (req.HasVideoConference.HasValue) room.HasVideoConference = req.HasVideoConference.Value;
        if (req.HasProjector.HasValue) room.HasProjector = req.HasProjector.Value;
        if (req.IsActive.HasValue) room.IsActive = req.IsActive.Value;
        if (req.Latitude.HasValue) room.Latitude = req.Latitude.Value;
        if (req.Longitude.HasValue) room.Longitude = req.Longitude.Value;
        if (req.MapUrl is not null) room.MapUrl = req.MapUrl.Trim();

        await db.SaveChangesAsync();
        return Ok(room);
    }

    /// <summary>Check room availability for a time range.</summary>
    [HttpGet("{id:guid}/availability")]
    public async Task<IActionResult> CheckAvailability(
        Guid id, [FromQuery] DateTime start, [FromQuery] DateTime end)
    {
        var room = await db.MeetingRooms.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);
        if (room is null) return NotFound();

        var conflicting = await db.Meetings
            .AsNoTracking()
            .Where(m => m.MeetingRoomId == id
                     && m.Status != Enums.MeetingStatus.Cancelled
                     && m.StartDateTimeUtc < end
                     && m.EndDateTimeUtc > start)
            .Select(m => new { m.Id, m.TitleAr, m.TitleEn, m.StartDateTimeUtc, m.EndDateTimeUtc })
            .ToListAsync();

        return Ok(new { available = conflicting.Count == 0, conflicts = conflicting });
    }

    /// <summary>Get all room bookings for a date range, grouped by room.</summary>
    [HttpGet("calendar")]
    public async Task<IActionResult> GetRoomCalendar(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] string? building = null,
        [FromQuery] int? minCapacity = null,
        [FromQuery] bool? hasVideoConference = null)
    {
        var roomQuery = db.MeetingRooms.AsNoTracking().Where(r => r.IsActive);

        if (!string.IsNullOrWhiteSpace(building))
            roomQuery = roomQuery.Where(r => r.Building == building);
        if (minCapacity.HasValue)
            roomQuery = roomQuery.Where(r => r.Capacity >= minCapacity.Value);
        if (hasVideoConference.HasValue)
            roomQuery = roomQuery.Where(r => r.HasVideoConference == hasVideoConference.Value);

        var rooms = await roomQuery
            .OrderBy(r => r.Building).ThenBy(r => r.NameEn)
            .ToListAsync();

        var roomIds = rooms.Select(r => r.Id).ToList();

        var meetings = await db.Meetings.AsNoTracking()
            .Where(m => m.MeetingRoomId.HasValue
                      && roomIds.Contains(m.MeetingRoomId.Value)
                      && m.Status != Enums.MeetingStatus.Cancelled
                      && m.StartDateTimeUtc < to
                      && m.EndDateTimeUtc > from)
            .Select(m => new
            {
                m.Id, m.TitleAr, m.TitleEn,
                m.StartDateTimeUtc, m.EndDateTimeUtc,
                Status = m.Status.ToString(),
                m.MeetingRoomId,
            })
            .ToListAsync();

        var result = rooms.Select(r => new
        {
            room = new
            {
                r.Id, r.NameAr, r.NameEn, r.Building, r.Floor,
                r.Capacity, r.HasVideoConference, r.HasProjector,
            },
            bookings = meetings
                .Where(m => m.MeetingRoomId == r.Id)
                .OrderBy(m => m.StartDateTimeUtc)
                .ToList(),
        });

        return Ok(result);
    }
}
