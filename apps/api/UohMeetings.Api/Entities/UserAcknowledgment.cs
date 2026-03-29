namespace UohMeetings.Api.Entities;

public sealed class UserAcknowledgment
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public Guid TemplateId { get; set; }

    public int TemplateVersion { get; set; }
    public DateTime AcknowledgedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public bool IsActive { get; set; } = true;

    public AppUser? User { get; set; }
    public AcknowledgmentTemplate? Template { get; set; }
}
