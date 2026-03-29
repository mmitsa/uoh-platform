namespace UohMeetings.Api.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Azure AD Object ID (oid claim) — primary link to Entra ID.</summary>
    public string ObjectId { get; set; } = "";

    public string DisplayNameAr { get; set; } = "";
    public string DisplayNameEn { get; set; } = "";
    public string Email { get; set; } = "";

    /// <summary>Employee/university ID, synced from AD extensionAttribute if available.</summary>
    public string? EmployeeId { get; set; }

    public string? JobTitleAr { get; set; }
    public string? JobTitleEn { get; set; }
    public string? Department { get; set; }
    public string? PhoneNumber { get; set; }

    /// <summary>URL of user photo from Graph API.</summary>
    public string? AvatarUrl { get; set; }

    /// <summary>BCrypt hash — null means the user authenticates via Azure AD only.</summary>
    public string? PasswordHash { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>When false, the user logged in but was never explicitly synced from AD by admin.</summary>
    public bool IsSynced { get; set; }

    public DateTime? LastLoginAtUtc { get; set; }
    public DateTime? LastSyncAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public List<AppUserRole> UserRoles { get; set; } = new();
    public UserPreference? Preferences { get; set; }
}
