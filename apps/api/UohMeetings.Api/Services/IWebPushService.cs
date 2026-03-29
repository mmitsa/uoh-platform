namespace UohMeetings.Api.Services;

public interface IWebPushService
{
    Task SubscribeAsync(string userObjectId, string endpoint, string p256dh, string auth, CancellationToken ct = default);
    Task UnsubscribeAsync(string endpoint, CancellationToken ct = default);
    Task SendToUserAsync(string userObjectId, string title, string body, string? url = null, CancellationToken ct = default);
}
