namespace UohMeetings.Api.Services;

public interface ISystemSettingsService
{
    Task<string?> GetAsync(string key, CancellationToken ct = default);
    Task<string?> GetWithFallbackAsync(string key, string? configFallbackPath = null, CancellationToken ct = default);
    Task<Dictionary<string, string?>> GetGroupAsync(string groupKey, CancellationToken ct = default);
    Task SetAsync(string key, string value, bool isEncrypted = false,
        string? dataType = null, string? groupKey = null,
        string? description = null, string? updatedByObjectId = null,
        CancellationToken ct = default);
}
