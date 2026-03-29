using System.Net.Http.Json;
using Google.Apis.Auth.OAuth2;
using Polly;
using Polly.Retry;

namespace UohMeetings.Api.Integrations;

public sealed class FcmPushNotifier(HttpClient http, IConfiguration config, ILogger<FcmPushNotifier> logger) : IPushNotifier
{
    private readonly AsyncRetryPolicy _retry = Policy
        .Handle<Exception>()
        .WaitAndRetryAsync(3, i => TimeSpan.FromMilliseconds(200 * i));

    public async Task SendAsync(string deviceToken, string title, string body, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Fcm:Enabled");
        if (!enabled)
        {
            logger.LogInformation("FCM disabled; skipping push.");
            return;
        }

        var apiBase = config["Integrations:Fcm:ApiBase"] ?? "https://fcm.googleapis.com";
        var accessToken = await GetAccessTokenAsync(ct);

        http.BaseAddress = new Uri(apiBase);
        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        var projectId = config["Integrations:Fcm:ProjectId"] ?? "-";
        var payload = new
        {
            message = new
            {
                token = deviceToken,
                notification = new { title, body },
            }
        };

        await _retry.ExecuteAsync(async () =>
        {
            var res = await http.PostAsJsonAsync($"/v1/projects/{projectId}/messages:send", payload, ct);
            if (!res.IsSuccessStatusCode)
            {
                var resBody = await res.Content.ReadAsStringAsync(ct);
                logger.LogWarning("FCM push failed: {Status} {Body}", (int)res.StatusCode, resBody);
                throw new InvalidOperationException("FCM push failed.");
            }
        });
    }

    private string? _cachedToken;
    private DateTime _cachedTokenExpiresAtUtc;

    private async Task<string> GetAccessTokenAsync(CancellationToken ct)
    {
        // Preferred: service account JSON (path or inline)
        var jsonPath = config["Integrations:Fcm:ServiceAccountJsonPath"];
        var jsonInline = config["Integrations:Fcm:ServiceAccountJson"];
        if (!string.IsNullOrWhiteSpace(jsonPath) || !string.IsNullOrWhiteSpace(jsonInline))
        {
            if (_cachedToken is not null && DateTime.UtcNow < _cachedTokenExpiresAtUtc.AddMinutes(-2))
                return _cachedToken;

            GoogleCredential cred;
            if (!string.IsNullOrWhiteSpace(jsonPath))
                cred = GoogleCredential.FromFile(jsonPath);
            else
                cred = GoogleCredential.FromJson(jsonInline!);

            var scoped = cred.CreateScoped("https://www.googleapis.com/auth/firebase.messaging");
            var token = await scoped.UnderlyingCredential.GetAccessTokenForRequestAsync(null, ct);
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException("Failed to acquire Google access token.");

            _cachedToken = token;
            _cachedTokenExpiresAtUtc = DateTime.UtcNow.AddMinutes(50);
            return token;
        }

        // Fallback: static bearer (dev only)
        var bearer = config["Integrations:Fcm:BearerToken"];
        if (string.IsNullOrWhiteSpace(bearer))
            throw new InvalidOperationException("FCM credentials are not configured.");
        return bearer;
    }
}

