using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface INotificationService
{
    Task NotifyAsync(NotificationPayload payload, CancellationToken ct = default);
    Task NotifyManyAsync(IReadOnlyList<NotificationPayload> payloads, CancellationToken ct = default);
    Task<(int Total, List<Notification> Items)> GetUserNotificationsAsync(string userOid, int page, int pageSize, bool? isRead, CancellationToken ct);
    Task<int> GetUnreadCountAsync(string userOid, CancellationToken ct);
    Task MarkAsReadAsync(Guid notificationId, string userOid, CancellationToken ct);
    Task MarkAllAsReadAsync(string userOid, CancellationToken ct);
}

public sealed record NotificationPayload(
    string RecipientObjectId,
    string? RecipientEmail,
    string Type,
    string TitleAr,
    string TitleEn,
    string? BodyAr = null,
    string? BodyEn = null,
    string? EntityType = null,
    Guid? EntityId = null,
    string? ActionUrl = null,
    string? RecipientPhone = null
);
