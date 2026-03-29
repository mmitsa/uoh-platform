using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace UohMeetings.Api.Hubs;

[Authorize]
public sealed class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userOid))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userOid}");
        }

        // Also join an email-based group so notification routing by email works
        var email = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? Context.User?.FindFirst("email")?.Value
                 ?? Context.User?.FindFirst("preferred_username")?.Value;
        if (!string.IsNullOrWhiteSpace(email))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{email}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userOid))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userOid}");
        }

        var email = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                 ?? Context.User?.FindFirst("email")?.Value
                 ?? Context.User?.FindFirst("preferred_username")?.Value;
        if (!string.IsNullOrWhiteSpace(email))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{email}");
        }

        await base.OnDisconnectedAsync(exception);
    }
}
