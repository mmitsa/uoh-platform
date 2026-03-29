using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class AcknowledgmentTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string BodyAr { get; set; } = "";
    public string BodyEn { get; set; } = "";

    public AcknowledgmentCategory Category { get; set; } = AcknowledgmentCategory.Custom;
    public int Version { get; set; } = 1;
    public bool IsMandatory { get; set; }

    public bool RequiresRenewal { get; set; }
    public int? RenewalDays { get; set; }

    /// <summary>Comma-separated roles this template applies to. Null = all users.</summary>
    public string? AppliesToRoles { get; set; }

    public AcknowledgmentStatus Status { get; set; } = AcknowledgmentStatus.Draft;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? PublishedAtUtc { get; set; }

    public List<UserAcknowledgment> UserAcknowledgments { get; set; } = new();
}
