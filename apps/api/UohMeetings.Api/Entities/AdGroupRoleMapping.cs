namespace UohMeetings.Api.Entities;

public sealed class AdGroupRoleMapping
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Azure AD group Object ID.</summary>
    public string AdGroupId { get; set; } = "";

    public string AdGroupDisplayName { get; set; } = "";

    public Guid RoleId { get; set; }

    public bool IsActive { get; set; } = true;
    public int Priority { get; set; }

    public string? CreatedByObjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppRole? Role { get; set; }
}
