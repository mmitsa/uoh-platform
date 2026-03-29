namespace UohMeetings.Api.Entities;

public sealed class AppPermission
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Hierarchical key using dot notation.
    /// Module-level: "committees", "meetings", "admin"
    /// Page-level:   "committees.view", "meetings.view"
    /// Action-level: "committees.create", "meetings.publish"
    /// </summary>
    public string Key { get; set; } = "";

    /// <summary>Grouping category: "Module", "Page", "Action".</summary>
    public string Category { get; set; } = "Page";

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>Optional: the frontend route this permission guards (e.g., "/committees").</summary>
    public string? Route { get; set; }

    /// <summary>Display order within its category for the admin UI.</summary>
    public int SortOrder { get; set; }

    /// <summary>System permissions cannot be deleted.</summary>
    public bool IsSystem { get; set; } = true;

    // Navigation
    public List<AppRolePermission> RolePermissions { get; set; } = new();
}
