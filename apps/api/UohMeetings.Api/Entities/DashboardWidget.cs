namespace UohMeetings.Api.Entities;

public sealed class DashboardWidget
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Machine-readable key (e.g. "stat-committees", "chart-meetings-monthly"). Must be unique.</summary>
    public string Key { get; set; } = "";

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>Widget category: Statistics, Chart, Committee, External, Rankings, Custom.</summary>
    public string Category { get; set; } = "";

    /// <summary>Default grid width (1-4 columns).</summary>
    public int DefaultWidth { get; set; } = 1;

    /// <summary>Default grid height (1-3 rows).</summary>
    public int DefaultHeight { get; set; } = 1;

    public int MinWidth { get; set; } = 1;
    public int MinHeight { get; set; } = 1;

    /// <summary>Icon name for the widget.</summary>
    public string? IconName { get; set; }

    /// <summary>System widgets cannot be deleted by admins.</summary>
    public bool IsSystem { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>If set, user must have this permission to see the widget.</summary>
    public string? RequiredPermission { get; set; }

    /// <summary>If set, user must have this role to see the widget.</summary>
    public string? RequiredRole { get; set; }

    /// <summary>Optional JSON Schema describing the widget's configurable settings.</summary>
    public string? ConfigSchema { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
