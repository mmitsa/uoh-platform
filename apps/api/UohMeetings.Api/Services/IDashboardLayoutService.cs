namespace UohMeetings.Api.Services;

public interface IDashboardLayoutService
{
    Task<List<DashboardWidgetDto>> GetAvailableWidgetsAsync(string userObjectId, CancellationToken ct = default);
    Task<UserDashboardLayoutDto> GetUserLayoutAsync(string userObjectId, CancellationToken ct = default);
    Task SaveUserLayoutAsync(string userObjectId, SaveLayoutRequest request, CancellationToken ct = default);
    Task ResetToDefaultAsync(string userObjectId, CancellationToken ct = default);
    Task<bool> IsUserCommitteeMemberAsync(string userObjectId, Guid committeeId, CancellationToken ct = default);
}

public sealed record DashboardWidgetDto(
    string Key,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string Category,
    int DefaultWidth,
    int DefaultHeight,
    int MinWidth,
    int MinHeight,
    string? IconName,
    string? ConfigSchema);

public sealed record UserDashboardLayoutDto(
    string LayoutName,
    string WidgetsJson,
    bool IsDefault);

public sealed record SaveLayoutRequest(string WidgetsJson);

public sealed record WidgetPlacement(
    string WidgetKey,
    int X,
    int Y,
    int W,
    int H,
    string? Config);
