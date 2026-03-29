using System.Net.Http.Json;
using System.Text;
using Polly;
using Polly.Retry;

namespace UohMeetings.Api.Integrations;

public sealed class ZoomOnlineMeetingProvider(HttpClient http, IConfiguration config, ILogger<ZoomOnlineMeetingProvider> logger)
    : IOnlineMeetingProvider
{
    private readonly AsyncRetryPolicy _retry = Policy
        .Handle<Exception>()
        .WaitAndRetryAsync(3, i => TimeSpan.FromMilliseconds(200 * i));

    public async Task<OnlineMeetingResult> CreateMeetingAsync(OnlineMeetingRequest request, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Zoom:Enabled");
        if (!enabled) throw new InvalidOperationException("Zoom integration is disabled.");

        var apiBase = config["Integrations:Zoom:ApiBase"] ?? "https://api.zoom.us/v2";
        var token = await GetAccessTokenAsync(ct);

        http.BaseAddress = new Uri(apiBase);
        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // ملاحظة: هذا تنفيذ مبسط (بدون OAuth refresh). في الإنتاج نستخدم OAuth app + refresh.
        return await _retry.ExecuteAsync(async () =>
        {
            var payload = new
            {
                topic = request.Subject,
                type = 2, // scheduled
                start_time = request.StartDateTimeUtc.ToString("o"),
                duration = (int)Math.Max(1, (request.EndDateTimeUtc - request.StartDateTimeUtc).TotalMinutes),
                settings = new { join_before_host = false }
            };

            var res = await http.PostAsJsonAsync("/users/me/meetings", payload, ct);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct);
                logger.LogWarning("Zoom create meeting failed: {Status} {Body}", (int)res.StatusCode, body);
                throw new InvalidOperationException("Zoom meeting creation failed.");
            }

            var json = await res.Content.ReadFromJsonAsync<Dictionary<string, object>>(cancellationToken: ct);
            if (json is null || !json.TryGetValue("join_url", out var joinUrlObj) || joinUrlObj is null)
                throw new InvalidOperationException("Zoom response missing join_url.");

            var joinUrl = joinUrlObj.ToString()!;
            var id = json.TryGetValue("id", out var idObj) ? idObj?.ToString() ?? "" : "";
            return new OnlineMeetingResult(joinUrl, id);
        });
    }

    private string? _cachedToken;
    private DateTime _cachedTokenExpiresAtUtc;

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        // Prefer Server-to-Server OAuth (account_credentials)
        var accountId = config["Integrations:Zoom:S2S:AccountId"];
        var clientId = config["Integrations:Zoom:S2S:ClientId"];
        var clientSecret = config["Integrations:Zoom:S2S:ClientSecret"];

        if (!string.IsNullOrWhiteSpace(accountId) && !string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret))
        {
            if (_cachedToken is not null && DateTime.UtcNow < _cachedTokenExpiresAtUtc.AddMinutes(-2))
                return _cachedToken;

            var tokenUrl = "https://zoom.us/oauth/token";
            using var req = new HttpRequestMessage(HttpMethod.Post, $"{tokenUrl}?grant_type=account_credentials&account_id={Uri.EscapeDataString(accountId)}");
            var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));
            req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Basic", basic);

            using var tokenHttp = new HttpClient();
            var res = await tokenHttp.SendAsync(req, ct);
            var json = await res.Content.ReadFromJsonAsync<Dictionary<string, object>>(cancellationToken: ct);
            if (!res.IsSuccessStatusCode || json is null || !json.TryGetValue("access_token", out var at))
                throw new InvalidOperationException("Zoom OAuth token acquisition failed.");

            _cachedToken = at?.ToString();
            var expiresIn = json.TryGetValue("expires_in", out var ex) && int.TryParse(ex?.ToString(), out var s) ? s : 3600;
            _cachedTokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(expiresIn);
            return _cachedToken ?? throw new InvalidOperationException("Zoom OAuth token missing.");
        }

        // Fallback to static bearer (dev only)
        var bearer = config["Integrations:Zoom:BearerToken"];
        if (string.IsNullOrWhiteSpace(bearer))
            throw new InvalidOperationException("Zoom credentials are not configured.");
        return bearer;
    }
}

