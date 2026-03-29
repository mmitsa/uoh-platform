using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

/// <summary>User notifications management.</summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null,
        CancellationToken ct = default)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var (total, items) = await notificationService.GetUserNotificationsAsync(userOid, page, pageSize, isRead, ct);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        var count = await notificationService.GetUnreadCountAsync(userOid, ct);
        return Ok(new { count });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        await notificationService.MarkAsReadAsync(id, userOid, ct);
        return Ok();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        await notificationService.MarkAllAsReadAsync(userOid, ct);
        return Ok();
    }

    /* ─── WebPush Subscription ─── */

    public sealed record PushSubscriptionRequest(string Endpoint, string P256dh, string Auth);

    [HttpPost("push-subscription")]
    public async Task<IActionResult> SubscribePush(
        [FromBody] PushSubscriptionRequest req,
        [FromServices] IWebPushService webPush,
        CancellationToken ct)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "";
        await webPush.SubscribeAsync(userOid, req.Endpoint, req.P256dh, req.Auth, ct);
        return Ok();
    }

    [HttpDelete("push-subscription")]
    public async Task<IActionResult> UnsubscribePush(
        [FromQuery] string endpoint,
        [FromServices] IWebPushService webPush,
        CancellationToken ct)
    {
        await webPush.UnsubscribeAsync(endpoint, ct);
        return Ok();
    }

    [HttpGet("vapid-public-key")]
    public IActionResult GetVapidPublicKey([FromServices] IConfiguration config)
    {
        var key = config["Integrations:WebPush:VapidPublicKey"] ?? "";
        return Ok(new { publicKey = key });
    }
}
