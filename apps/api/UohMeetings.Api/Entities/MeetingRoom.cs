namespace UohMeetings.Api.Entities;

public sealed class MeetingRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? Building { get; set; }
    public string? Floor { get; set; }
    public int Capacity { get; set; }
    public bool HasVideoConference { get; set; }
    public bool HasProjector { get; set; }
    public bool IsActive { get; set; } = true;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public string? MapUrl { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
