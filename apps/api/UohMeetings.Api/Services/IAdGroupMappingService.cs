using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IAdGroupMappingService
{
    Task<List<AdGroupRoleMapping>> GetAllAsync(CancellationToken ct = default);
    Task<AdGroupRoleMapping> CreateAsync(CreateAdGroupMappingRequest req, string createdByObjectId, CancellationToken ct = default);
    Task<AdGroupRoleMapping> UpdateAsync(Guid id, UpdateAdGroupMappingRequest req, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<(int Total, List<AdSyncLog> Items)> GetSyncHistoryAsync(int page, int pageSize, CancellationToken ct = default);
}

public sealed record CreateAdGroupMappingRequest(
    string AdGroupId,
    string AdGroupDisplayName,
    Guid RoleId,
    int Priority = 0,
    bool IsActive = true);

public sealed record UpdateAdGroupMappingRequest(
    string? AdGroupDisplayName,
    Guid? RoleId,
    int? Priority,
    bool? IsActive);
