namespace UohMeetings.Api.Entities;

public sealed class AppRole
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Machine-readable key (e.g. "SystemAdmin", "DepartmentManager"). Must be unique.</summary>
    public string Key { get; set; } = "";

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>System-seeded roles cannot be deleted by admins.</summary>
    public bool IsSystem { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<AppUserRole> UserRoles { get; set; } = new();
    public List<AppRolePermission> RolePermissions { get; set; } = new();
}
