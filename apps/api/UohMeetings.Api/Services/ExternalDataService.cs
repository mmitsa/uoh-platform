using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class ExternalDataService(
    AppDbContext db,
    IHttpClientFactory httpClientFactory,
    ICacheService cache) : IExternalDataService
{
    public async Task<List<ExternalDataSourceDto>> GetAllSourcesAsync(CancellationToken ct = default)
    {
        return await db.ExternalDataSources.AsNoTracking()
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => ToDto(s))
            .ToListAsync(ct);
    }

    public async Task<ExternalDataSourceDto> CreateSourceAsync(
        CreateExternalSourceRequest request,
        string createdByObjectId,
        CancellationToken ct = default)
    {
        var source = new ExternalDataSource
        {
            NameAr = request.NameAr,
            NameEn = request.NameEn,
            DescriptionAr = request.DescriptionAr,
            DescriptionEn = request.DescriptionEn,
            ApiUrl = request.ApiUrl,
            HttpMethod = request.HttpMethod,
            HeadersJson = request.HeadersJson,
            RequestBodyTemplate = request.RequestBodyTemplate,
            ResponseMapping = request.ResponseMapping,
            RefreshIntervalMinutes = request.RefreshIntervalMinutes,
            CreatedByObjectId = createdByObjectId,
        };

        db.ExternalDataSources.Add(source);
        await db.SaveChangesAsync(ct);

        return ToDto(source);
    }

    public async Task<ExternalDataSourceDto> UpdateSourceAsync(
        Guid id,
        UpdateExternalSourceRequest request,
        CancellationToken ct = default)
    {
        var source = await db.ExternalDataSources.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"External data source {id} not found.");

        source.NameAr = request.NameAr;
        source.NameEn = request.NameEn;
        source.DescriptionAr = request.DescriptionAr;
        source.DescriptionEn = request.DescriptionEn;
        source.ApiUrl = request.ApiUrl;
        source.HttpMethod = request.HttpMethod;
        source.HeadersJson = request.HeadersJson;
        source.RequestBodyTemplate = request.RequestBodyTemplate;
        source.ResponseMapping = request.ResponseMapping;
        source.RefreshIntervalMinutes = request.RefreshIntervalMinutes;
        source.IsActive = request.IsActive;
        source.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        // Invalidate cache
        await cache.RemoveAsync($"ext-data:{id}");

        return ToDto(source);
    }

    public async Task DeleteSourceAsync(Guid id, CancellationToken ct = default)
    {
        var source = await db.ExternalDataSources.FindAsync([id], ct)
            ?? throw new KeyNotFoundException($"External data source {id} not found.");

        db.ExternalDataSources.Remove(source);
        await db.SaveChangesAsync(ct);
        await cache.RemoveAsync($"ext-data:{id}");
    }

    public async Task<object?> FetchDataAsync(Guid sourceId, CancellationToken ct = default)
    {
        // Check cache first
        var cacheKey = $"ext-data:{sourceId}";
        var cached = await cache.GetAsync<string>(cacheKey);
        if (cached is not null)
            return JsonSerializer.Deserialize<object>(cached);

        var source = await db.ExternalDataSources.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sourceId && s.IsActive, ct)
            ?? throw new KeyNotFoundException($"External data source {sourceId} not found or inactive.");

        var result = await CallExternalApiAsync(source.ApiUrl, source.HttpMethod, source.HeadersJson, source.RequestBodyTemplate, ct);

        // Update last fetch status
        var entity = await db.ExternalDataSources.FindAsync([sourceId], ct);
        if (entity is not null)
        {
            entity.LastFetchAtUtc = DateTime.UtcNow;
            entity.LastFetchStatus = result is not null ? "Success" : "Empty";
            await db.SaveChangesAsync(ct);
        }

        // Cache for refresh interval
        if (result is not null)
        {
            var json = JsonSerializer.Serialize(result);
            await cache.SetAsync(cacheKey, json, TimeSpan.FromMinutes(source.RefreshIntervalMinutes));
        }

        return result;
    }

    public async Task<ExternalTestResult> TestConnectionAsync(TestConnectionRequest request, CancellationToken ct = default)
    {
        try
        {
            var result = await CallExternalApiAsync(request.ApiUrl, request.HttpMethod, request.HeadersJson, null, ct);
            var sample = result is not null
                ? JsonSerializer.Serialize(result).Length > 500
                    ? JsonSerializer.Serialize(result)[..500] + "..."
                    : JsonSerializer.Serialize(result)
                : null;

            return new ExternalTestResult(true, 200, null, sample);
        }
        catch (HttpRequestException ex)
        {
            return new ExternalTestResult(false, (int?)ex.StatusCode, ex.Message, null);
        }
        catch (Exception ex)
        {
            return new ExternalTestResult(false, null, ex.Message, null);
        }
    }

    private async Task<object?> CallExternalApiAsync(
        string apiUrl,
        string method,
        string? headersJson,
        string? bodyTemplate,
        CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(30);

        var request = new HttpRequestMessage(
            method.Equals("POST", StringComparison.OrdinalIgnoreCase) ? System.Net.Http.HttpMethod.Post : System.Net.Http.HttpMethod.Get,
            apiUrl);

        if (!string.IsNullOrWhiteSpace(headersJson))
        {
            var headers = JsonSerializer.Deserialize<Dictionary<string, string>>(headersJson);
            if (headers is not null)
            {
                foreach (var (key, value) in headers)
                    request.Headers.TryAddWithoutValidation(key, value);
            }
        }

        if (!string.IsNullOrWhiteSpace(bodyTemplate) && method.Equals("POST", StringComparison.OrdinalIgnoreCase))
        {
            request.Content = new StringContent(bodyTemplate, Encoding.UTF8, "application/json");
        }

        var response = await client.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync(ct);
        return string.IsNullOrWhiteSpace(content) ? null : JsonSerializer.Deserialize<object>(content);
    }

    private static ExternalDataSourceDto ToDto(ExternalDataSource s) => new(
        s.Id, s.NameAr, s.NameEn, s.DescriptionAr, s.DescriptionEn,
        s.ApiUrl, s.HttpMethod, s.HeadersJson, s.RequestBodyTemplate,
        s.ResponseMapping, s.RefreshIntervalMinutes, s.IsActive,
        s.LastFetchAtUtc, s.LastFetchStatus);
}
