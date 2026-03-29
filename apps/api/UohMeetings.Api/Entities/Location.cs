using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class Location
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public LocationType Type { get; set; } = LocationType.Building;

    // Physical address
    public string? Building { get; set; }
    public string? Floor { get; set; }
    public string? RoomNumber { get; set; }

    // Geo coordinates
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Optional floor plan / static map image
    public string? MapImageUrl { get; set; }

    // Hierarchy: e.g. Hall inside Building
    public Guid? ParentLocationId { get; set; }
    public Location? ParentLocation { get; set; }
    public List<Location> ChildLocations { get; set; } = new();

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
