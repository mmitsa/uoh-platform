namespace UohMeetings.Api.Entities;

public sealed class AppUserRole
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }

    /// <summary>Who assigned this role (admin object ID).</summary>
    public string? AssignedByObjectId { get; set; }

    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>Optional expiry for temporary role assignments.</summary>
    public DateTime? ExpiresAtUtc { get; set; }

    // Navigation
    public AppUser? User { get; set; }
    public AppRole? Role { get; set; }
}
