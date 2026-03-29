namespace UohMeetings.Api.Services;

public interface IExternalDataService
{
    Task<List<ExternalDataSourceDto>> GetAllSourcesAsync(CancellationToken ct = default);
    Task<ExternalDataSourceDto> CreateSourceAsync(CreateExternalSourceRequest request, string createdByObjectId, CancellationToken ct = default);
    Task<ExternalDataSourceDto> UpdateSourceAsync(Guid id, UpdateExternalSourceRequest request, CancellationToken ct = default);
    Task DeleteSourceAsync(Guid id, CancellationToken ct = default);
    Task<object?> FetchDataAsync(Guid sourceId, CancellationToken ct = default);
    Task<ExternalTestResult> TestConnectionAsync(TestConnectionRequest request, CancellationToken ct = default);
}

public sealed record ExternalDataSourceDto(
    Guid Id,
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string ApiUrl,
    string HttpMethod,
    string? HeadersJson,
    string? RequestBodyTemplate,
    string ResponseMapping,
    int RefreshIntervalMinutes,
    bool IsActive,
    DateTime? LastFetchAtUtc,
    string? LastFetchStatus);

public sealed record CreateExternalSourceRequest(
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string ApiUrl,
    string HttpMethod,
    string? HeadersJson,
    string? RequestBodyTemplate,
    string ResponseMapping,
    int RefreshIntervalMinutes);

public sealed record UpdateExternalSourceRequest(
    string NameAr,
    string NameEn,
    string? DescriptionAr,
    string? DescriptionEn,
    string ApiUrl,
    string HttpMethod,
    string? HeadersJson,
    string? RequestBodyTemplate,
    string ResponseMapping,
    int RefreshIntervalMinutes,
    bool IsActive);

public sealed record TestConnectionRequest(
    string ApiUrl,
    string HttpMethod,
    string? HeadersJson);

public sealed record ExternalTestResult(bool Success, int? StatusCode, string? ErrorMessage, string? SampleData);
