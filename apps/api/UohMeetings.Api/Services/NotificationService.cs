using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Hubs;
using UohMeetings.Api.Integrations;

namespace UohMeetings.Api.Services;

public sealed class NotificationService(
    AppDbContext db,
    IHubContext<NotificationHub> hubContext,
    ISmsProvider smsProvider,
    IEmailSender emailSender,
    IWebPushService webPushService,
    ILogger<NotificationService> logger) : INotificationService
{
    public async Task NotifyAsync(NotificationPayload payload, CancellationToken ct)
    {
        var notification = new Notification
        {
            RecipientObjectId = payload.RecipientObjectId,
            RecipientEmail = payload.RecipientEmail,
            Type = payload.Type,
            TitleAr = payload.TitleAr,
            TitleEn = payload.TitleEn,
            BodyAr = payload.BodyAr,
            BodyEn = payload.BodyEn,
            EntityType = payload.EntityType,
            EntityId = payload.EntityId,
            ActionUrl = payload.ActionUrl,
        };

        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);

        try
        {
            await hubContext.Clients
                .Group($"user:{payload.RecipientObjectId}")
                .SendAsync("ReceiveNotification", new
                {
                    notification.Id,
                    notification.Type,
                    notification.TitleAr,
                    notification.TitleEn,
                    notification.BodyAr,
                    notification.BodyEn,
                    notification.EntityType,
                    notification.EntityId,
                    notification.ActionUrl,
                    notification.CreatedAtUtc,
                }, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send SignalR notification to user {UserOid}", payload.RecipientObjectId);
        }

        // Email notification
        if (!string.IsNullOrWhiteSpace(payload.RecipientEmail))
        {
            try
            {
                var subject = !string.IsNullOrWhiteSpace(payload.TitleEn) ? payload.TitleEn : payload.TitleAr;
                var htmlBody = BuildNotificationEmailHtml(payload);
                await emailSender.SendAsync(payload.RecipientEmail, subject, htmlBody, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send email notification to {Email}", payload.RecipientEmail);
            }
        }

        // SMS notification
        if (!string.IsNullOrWhiteSpace(payload.RecipientPhone))
        {
            try
            {
                var smsBody = !string.IsNullOrWhiteSpace(payload.BodyAr) ? payload.BodyAr : payload.TitleAr;
                await smsProvider.SendSmsAsync(payload.RecipientPhone, smsBody, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send SMS notification to {Phone}", payload.RecipientPhone);
            }
        }

        // WebPush notification
        if (!string.IsNullOrWhiteSpace(payload.RecipientObjectId))
        {
            try
            {
                var pushTitle = !string.IsNullOrWhiteSpace(payload.TitleEn) ? payload.TitleEn : payload.TitleAr;
                var pushBody = payload.BodyEn ?? payload.BodyAr ?? "";
                await webPushService.SendToUserAsync(payload.RecipientObjectId, pushTitle, pushBody, payload.ActionUrl, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send WebPush to {UserOid}", payload.RecipientObjectId);
            }
        }
    }

    public async Task NotifyManyAsync(IReadOnlyList<NotificationPayload> payloads, CancellationToken ct)
    {
        var tasks = payloads.Select(p => NotifyAsync(p, ct));
        await Task.WhenAll(tasks);
    }

    public async Task<(int Total, List<Notification> Items)> GetUserNotificationsAsync(
        string userOid, int page, int pageSize, bool? isRead, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var q = db.Notifications.AsNoTracking()
            .Where(n => n.RecipientObjectId == userOid);

        if (isRead.HasValue)
            q = q.Where(n => n.IsRead == isRead.Value);

        var total = await q.CountAsync(ct);
        var items = await q
            .OrderByDescending(n => n.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (total, items);
    }

    public async Task<int> GetUnreadCountAsync(string userOid, CancellationToken ct)
    {
        return await db.Notifications
            .CountAsync(n => n.RecipientObjectId == userOid && !n.IsRead, ct);
    }

    public async Task MarkAsReadAsync(Guid notificationId, string userOid, CancellationToken ct)
    {
        var notification = await db.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.RecipientObjectId == userOid, ct);

        if (notification is null)
            throw new NotFoundException(nameof(Notification), notificationId);

        notification.IsRead = true;
        notification.ReadAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task MarkAllAsReadAsync(string userOid, CancellationToken ct)
    {
        await db.Notifications
            .Where(n => n.RecipientObjectId == userOid && !n.IsRead)
            .ExecuteUpdateAsync(s => s
                .SetProperty(n => n.IsRead, true)
                .SetProperty(n => n.ReadAtUtc, DateTime.UtcNow), ct);
    }

    private static string BuildNotificationEmailHtml(NotificationPayload payload)
    {
        var title = payload.TitleEn ?? payload.TitleAr;
        var body = payload.BodyEn ?? payload.BodyAr ?? "";
        var actionLink = !string.IsNullOrWhiteSpace(payload.ActionUrl)
            ? $"<p style=\"margin-top:16px\"><a href=\"{payload.ActionUrl}\" style=\"background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600\">View Details</a></p>"
            : "";

        return $"""
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1e293b;margin:0 0 12px">{title}</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6">{body}</p>
              {actionLink}
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
              <p style="color:#94a3b8;font-size:12px">UoH Meetings Platform</p>
            </div>
            """;
    }
}
