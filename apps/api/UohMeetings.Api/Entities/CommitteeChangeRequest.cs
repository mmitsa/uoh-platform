using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

/// <summary>
/// A formal request to modify a committee (name, members, type, etc.).
/// Follows an approval workflow before changes are applied.
/// </summary>
public sealed class CommitteeChangeRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CommitteeId { get; set; }

    public string RequesterObjectId { get; set; } = "";
    public string RequesterDisplayName { get; set; } = "";

    public string ReasonAr { get; set; } = "";
    public string ReasonEn { get; set; } = "";

    /// <summary>
    /// JSON describing requested changes (field → new value).
    /// </summary>
    public string ChangesJson { get; set; } = "{}";

    public ChangeRequestStatus Status { get; set; } = ChangeRequestStatus.Pending;

    public string? ReviewerObjectId { get; set; }
    public string? ReviewerDisplayName { get; set; }
    public string? ReviewNotesAr { get; set; }
    public string? ReviewNotesEn { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAtUtc { get; set; }

    public Committee? Committee { get; set; }
}
