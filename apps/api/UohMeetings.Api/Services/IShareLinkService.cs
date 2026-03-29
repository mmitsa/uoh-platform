using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public interface IShareLinkService
{
    Task<ShareLinkDto> GetOrCreateAsync(ShareableEntityType entityType, Guid entityId, string createdByObjectId, DateTime? expiresAtUtc = null);
    Task<ShareLinkDto?> GetByEntityAsync(ShareableEntityType entityType, Guid entityId);
    Task<PublicShareData> ResolveTokenAsync(string token);
    Task DeactivateAsync(Guid shareLinkId);
}

public sealed record ShareLinkDto(
    Guid Id,
    ShareableEntityType EntityType,
    Guid EntityId,
    string Token,
    bool IsActive,
    DateTime CreatedAtUtc,
    DateTime? ExpiresAtUtc,
    int ScanCount
);

public sealed record PublicShareData(
    ShareableEntityType EntityType,
    string Token,
    object EntityData
);
