using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IAcknowledgmentService
{
    Task<(int Total, List<object> Items)> ListTemplatesAsync(int page, int pageSize, CancellationToken ct = default);
    Task<AcknowledgmentTemplate> GetTemplateAsync(Guid id, CancellationToken ct = default);
    Task<AcknowledgmentTemplate> CreateTemplateAsync(
        string titleAr, string titleEn, string bodyAr, string bodyEn,
        Enums.AcknowledgmentCategory category, bool isMandatory,
        bool requiresRenewal, int? renewalDays, string? appliesToRoles,
        CancellationToken ct = default);
    Task<AcknowledgmentTemplate> UpdateTemplateAsync(
        Guid id, string titleAr, string titleEn, string bodyAr, string bodyEn,
        Enums.AcknowledgmentCategory category, bool isMandatory,
        bool requiresRenewal, int? renewalDays, string? appliesToRoles,
        CancellationToken ct = default);
    Task<AcknowledgmentTemplate> PublishTemplateAsync(Guid id, CancellationToken ct = default);
    Task<AcknowledgmentTemplate> ArchiveTemplateAsync(Guid id, CancellationToken ct = default);

    Task<List<object>> GetPendingForUserAsync(Guid userId, string[] userRoles, CancellationToken ct = default);
    Task<UserAcknowledgment> AcknowledgeAsync(Guid userId, Guid templateId, string? ip, string? userAgent, CancellationToken ct = default);
    Task<List<object>> GetUserHistoryAsync(Guid userId, CancellationToken ct = default);
    Task<(int Total, List<object> Items)> GetTemplateSignaturesAsync(Guid templateId, int page, int pageSize, CancellationToken ct = default);
    Task<bool> HasPendingMandatoryAsync(Guid userId, string[] userRoles, CancellationToken ct = default);
}
