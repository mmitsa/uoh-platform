using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using WebPush;

namespace UohMeetings.Api.Services;

public sealed class WebPushService(
    AppDbContext db,
    IConfiguration config,
    ILogger<WebPushService> logger) : IWebPushService
{
    public async Task SubscribeAsync(string userObjectId, string endpoint, string p256dh, string auth, CancellationToken ct)
    {
        var existing = await db.PushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint, ct);

        if (existing is not null)
        {
            existing.UserObjectId = userObjectId;
            existing.P256dh = p256dh;
            existing.Auth = auth;
        }
        else
        {
            db.PushSubscriptions.Add(new Entities.PushSubscription
            {
                UserObjectId = userObjectId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task UnsubscribeAsync(string endpoint, CancellationToken ct)
    {
        await db.PushSubscriptions
            .Where(s => s.Endpoint == endpoint)
            .ExecuteDeleteAsync(ct);
    }

    public async Task SendToUserAsync(string userObjectId, string title, string body, string? url, CancellationToken ct)
    {
        var subs = await db.PushSubscriptions
            .Where(s => s.UserObjectId == userObjectId)
            .ToListAsync(ct);

        if (subs.Count == 0) return;

        var vapidSubject = config["Integrations:WebPush:VapidSubject"] ?? "";
        var vapidPublicKey = config["Integrations:WebPush:VapidPublicKey"] ?? "";
        var vapidPrivateKey = config["Integrations:WebPush:VapidPrivateKey"] ?? "";

        if (string.IsNullOrWhiteSpace(vapidPublicKey) || string.IsNullOrWhiteSpace(vapidPrivateKey))
        {
            logger.LogWarning("WebPush VAPID keys are not configured — skipping push");
            return;
        }

        var client = new WebPushClient();
        var vapidDetails = new VapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        var payload = JsonSerializer.Serialize(new { title, body, url });

        foreach (var sub in subs)
        {
            try
            {
                var pushSub = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
                await client.SendNotificationAsync(pushSub, payload, vapidDetails);
            }
            catch (WebPushException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Gone)
            {
                db.PushSubscriptions.Remove(sub);
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send WebPush to {Endpoint}", sub.Endpoint);
            }
        }
    }
}
