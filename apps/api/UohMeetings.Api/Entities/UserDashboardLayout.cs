namespace UohMeetings.Api.Entities;

public sealed class UserDashboardLayout
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>User's Azure AD Object ID.</summary>
    public string UserObjectId { get; set; } = "";

    /// <summary>Layout name for supporting multiple layouts per user.</summary>
    public string LayoutName { get; set; } = "main";

    /// <summary>JSON array of widget placements: [{widgetKey, x, y, w, h, config}].</summary>
    public string WidgetsJson { get; set; } = "[]";

    /// <summary>Whether this is the default layout (not customized by user).</summary>
    public bool IsDefault { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
