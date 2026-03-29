namespace UohMeetings.Api.Entities;

public sealed class UserPreference
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public string Language { get; set; } = "ar";       // ar, en
    public string Theme { get; set; } = "system";       // light, dark, system

    public bool NotifyByEmail { get; set; } = true;
    public bool NotifyByPush { get; set; } = true;
    public bool NotifyBySms { get; set; }

    public string EmailDigestFrequency { get; set; } = "none"; // none, daily, weekly

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppUser? User { get; set; }
}
