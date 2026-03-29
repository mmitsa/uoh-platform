using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class ShareLink
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public ShareableEntityType EntityType { get; set; }
    public Guid EntityId { get; set; }

    /// <summary>
    /// Random URL-safe token (32 chars). Public-facing identifier.
    /// </summary>
    public string Token { get; set; } = "";

    public bool IsActive { get; set; } = true;

    public string CreatedByObjectId { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAtUtc { get; set; }

    public int ScanCount { get; set; }
}
