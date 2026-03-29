namespace UohMeetings.Api.Entities;

public sealed class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RecipientObjectId { get; set; } = "";
    public string? RecipientEmail { get; set; }
    public string Type { get; set; } = "";
    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string? BodyAr { get; set; }
    public string? BodyEn { get; set; }
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string? ActionUrl { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAtUtc { get; set; }
}
