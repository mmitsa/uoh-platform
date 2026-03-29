namespace UohMeetings.Api.Entities;

public sealed class AppRolePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoleId { get; set; }
    public Guid PermissionId { get; set; }
    public DateTime GrantedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public AppRole? Role { get; set; }
    public AppPermission? Permission { get; set; }
}
