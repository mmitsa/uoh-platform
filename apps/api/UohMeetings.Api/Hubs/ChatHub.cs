using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Hubs;

[Authorize]
public sealed class ChatHub(IServiceScopeFactory scopeFactory) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userOid))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"chat:user:{userOid}");
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userOid))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"chat:user:{userOid}");
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(Guid conversationId, string content, string type, List<Guid>? attachmentFileIds)
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var displayName = Context.User?.FindFirst("name")?.Value
                       ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                       ?? "Unknown";

        if (string.IsNullOrWhiteSpace(userOid)) return;

        using var scope = scopeFactory.CreateScope();
        var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();

        await chatService.SendMessageAsync(conversationId, userOid, displayName, content, type, attachmentFileIds);
    }

    public async Task MarkAsRead(Guid conversationId)
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userOid)) return;

        using var scope = scopeFactory.CreateScope();
        var chatService = scope.ServiceProvider.GetRequiredService<IChatService>();

        await chatService.MarkAsReadAsync(conversationId, userOid);

        // Broadcast read receipt to conversation participants
        // (The service already handles the DB update; here we notify via hub)
        await Clients.Group($"chat:user:{userOid}").SendAsync("MessageRead", new { conversationId, userOid });
    }

    public async Task StartTyping(Guid conversationId)
    {
        var userOid = Context.User?.FindFirst("oid")?.Value
                   ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var displayName = Context.User?.FindFirst("name")?.Value
                       ?? Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
                       ?? "Unknown";

        if (string.IsNullOrWhiteSpace(userOid)) return;

        // Get all participant OIDs from the conversation to broadcast typing
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();

        var participantOids = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions
            .ToListAsync(
                db.ChatParticipants
                    .Where(p => p.ConversationId == conversationId && p.IsActive && p.UserObjectId != userOid)
                    .Select(p => p.UserObjectId));

        foreach (var oid in participantOids)
        {
            await Clients.Group($"chat:user:{oid}")
                .SendAsync("UserTyping", new { conversationId, userOid, displayName });
        }
    }
}
