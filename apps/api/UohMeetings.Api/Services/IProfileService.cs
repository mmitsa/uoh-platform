using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IProfileService
{
    Task<ProfileDto> GetProfileAsync(string objectId, CancellationToken ct = default);
    Task<ProfileDto> UpdateProfileAsync(string objectId, UpdateProfileRequest req, CancellationToken ct = default);
    Task<ProfileDto> UpdateAvatarAsync(string objectId, Guid fileId, CancellationToken ct = default);
    Task RemoveAvatarAsync(string objectId, CancellationToken ct = default);
    Task<UserPreference> GetPreferencesAsync(string objectId, CancellationToken ct = default);
    Task<UserPreference> UpdatePreferencesAsync(string objectId, UpdatePreferencesRequest req, CancellationToken ct = default);
}

public sealed record ProfileDto(
    Guid Id,
    string ObjectId,
    string DisplayNameAr,
    string DisplayNameEn,
    string Email,
    string? EmployeeId,
    string? JobTitleAr,
    string? JobTitleEn,
    string? Department,
    string? PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    DateTime? LastLoginAtUtc,
    List<string> Roles);

public sealed record UpdateProfileRequest(
    string? DisplayNameAr,
    string? DisplayNameEn,
    string? JobTitleAr,
    string? JobTitleEn,
    string? Department,
    string? PhoneNumber);

public sealed record UpdatePreferencesRequest(
    string? Language,
    string? Theme,
    bool? NotifyByEmail,
    bool? NotifyByPush,
    bool? NotifyBySms,
    string? EmailDigestFrequency);
