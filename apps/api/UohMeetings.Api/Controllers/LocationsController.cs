using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/locations")]
[Authorize]
public sealed class LocationsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] bool activeOnly = true,
        [FromQuery] LocationType? type = null,
        [FromQuery] Guid? parentId = null)
    {
        var q = db.Locations.AsNoTracking();
        if (activeOnly) q = q.Where(l => l.IsActive);
        if (type.HasValue) q = q.Where(l => l.Type == type.Value);
        if (parentId.HasValue) q = q.Where(l => l.ParentLocationId == parentId.Value);

        var locations = await q
            .OrderBy(l => l.Type).ThenBy(l => l.NameEn)
            .Select(l => new
            {
                l.Id, l.NameAr, l.NameEn,
                l.DescriptionAr, l.DescriptionEn,
                Type = l.Type.ToString(),
                l.Building, l.Floor, l.RoomNumber,
                l.Latitude, l.Longitude, l.MapImageUrl,
                l.ParentLocationId, l.IsActive,
            })
            .ToListAsync();

        return Ok(locations);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var loc = await db.Locations.AsNoTracking()
            .Include(l => l.ChildLocations.Where(c => c.IsActive))
            .FirstOrDefaultAsync(l => l.Id == id);

        if (loc is null) return NotFound();

        return Ok(new
        {
            loc.Id, loc.NameAr, loc.NameEn,
            loc.DescriptionAr, loc.DescriptionEn,
            Type = loc.Type.ToString(),
            loc.Building, loc.Floor, loc.RoomNumber,
            loc.Latitude, loc.Longitude, loc.MapImageUrl,
            loc.ParentLocationId, loc.IsActive,
            loc.CreatedAtUtc, loc.UpdatedAtUtc,
            ChildLocations = loc.ChildLocations.Select(c => new
            {
                c.Id, c.NameAr, c.NameEn,
                Type = c.Type.ToString(),
            }),
        });
    }

    public sealed record CreateLocationRequest(
        string NameAr, string NameEn,
        string? DescriptionAr, string? DescriptionEn,
        LocationType Type,
        string? Building, string? Floor, string? RoomNumber,
        double? Latitude, double? Longitude,
        string? MapImageUrl,
        Guid? ParentLocationId);

    [HttpPost]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateLocationRequest req)
    {
        var location = new Location
        {
            NameAr = req.NameAr.Trim(),
            NameEn = req.NameEn.Trim(),
            DescriptionAr = req.DescriptionAr?.Trim(),
            DescriptionEn = req.DescriptionEn?.Trim(),
            Type = req.Type,
            Building = req.Building?.Trim(),
            Floor = req.Floor?.Trim(),
            RoomNumber = req.RoomNumber?.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            MapImageUrl = req.MapImageUrl?.Trim(),
            ParentLocationId = req.ParentLocationId,
        };

        db.Locations.Add(location);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = location.Id }, location);
    }

    public sealed record UpdateLocationRequest(
        string? NameAr, string? NameEn,
        string? DescriptionAr, string? DescriptionEn,
        LocationType? Type,
        string? Building, string? Floor, string? RoomNumber,
        double? Latitude, double? Longitude,
        string? MapImageUrl,
        Guid? ParentLocationId,
        bool? IsActive);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLocationRequest req)
    {
        var loc = await db.Locations.FirstOrDefaultAsync(l => l.Id == id);
        if (loc is null) return NotFound();

        if (req.NameAr is not null) loc.NameAr = req.NameAr.Trim();
        if (req.NameEn is not null) loc.NameEn = req.NameEn.Trim();
        if (req.DescriptionAr is not null) loc.DescriptionAr = req.DescriptionAr.Trim();
        if (req.DescriptionEn is not null) loc.DescriptionEn = req.DescriptionEn.Trim();
        if (req.Type.HasValue) loc.Type = req.Type.Value;
        if (req.Building is not null) loc.Building = req.Building.Trim();
        if (req.Floor is not null) loc.Floor = req.Floor.Trim();
        if (req.RoomNumber is not null) loc.RoomNumber = req.RoomNumber.Trim();
        if (req.Latitude.HasValue) loc.Latitude = req.Latitude.Value;
        if (req.Longitude.HasValue) loc.Longitude = req.Longitude.Value;
        if (req.MapImageUrl is not null) loc.MapImageUrl = req.MapImageUrl.Trim();
        if (req.ParentLocationId.HasValue) loc.ParentLocationId = req.ParentLocationId.Value;
        if (req.IsActive.HasValue) loc.IsActive = req.IsActive.Value;
        loc.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(loc);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var loc = await db.Locations.FirstOrDefaultAsync(l => l.Id == id);
        if (loc is null) return NotFound();

        loc.IsActive = false;
        loc.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok();
    }
}
