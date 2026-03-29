using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Hubs;

namespace UohMeetings.Api.Services;

public sealed class ChatService(
    AppDbContext db,
    IHubContext<ChatHub> hubContext,
    INotificationService notifications,
    ILogger<ChatService> logger) : IChatService
{
    public async Task<ChatConversation> GetOrCreateDirectAsync(
        string userOid, string userDisplay, string userEmail,
        string targetOid, string targetDisplay, string targetEmail,
        CancellationToken ct)
    {
        // Check if a direct conversation already exists between these two users
        var existing = await db.ChatConversations
            .Include(c => c.Participants)
            .Where(c => c.Type == "direct")
            .Where(c => c.Participants.Any(p => p.UserObjectId == userOid && p.IsActive))
            .Where(c => c.Participants.Any(p => p.UserObjectId == targetOid && p.IsActive))
            .FirstOrDefaultAsync(ct);

        if (existing is not null)
            return existing;

        var conversation = new ChatConversation
        {
            Type = "direct",
            CreatedByOid = userOid,
            Participants =
            {
                new ChatParticipant
                {
                    UserObjectId = userOid,
                    DisplayName = userDisplay,
                    Email = userEmail,
                },
                new ChatParticipant
                {
                    UserObjectId = targetOid,
                    DisplayName = targetDisplay,
                    Email = targetEmail,
                },
            },
        };

        db.ChatConversations.Add(conversation);
        await db.SaveChangesAsync(ct);

        return conversation;
    }

    public async Task<ChatConversation> CreateGroupAsync(
        string creatorOid, string creatorDisplay, string creatorEmail,
        string nameAr, string nameEn,
        List<ChatContactDto> participants,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(nameAr) || string.IsNullOrWhiteSpace(nameEn))
            throw new Exceptions.ValidationException("Name", "Group name is required in both languages.");

        var conversation = new ChatConversation
        {
            Type = "group",
            NameAr = nameAr.Trim(),
            NameEn = nameEn.Trim(),
            CreatedByOid = creatorOid,
        };

        // Add the creator as a participant
        conversation.Participants.Add(new ChatParticipant
        {
            UserObjectId = creatorOid,
            DisplayName = creatorDisplay,
            Email = creatorEmail,
        });

        // Add other participants
        foreach (var p in participants.Where(p => p.UserObjectId != creatorOid))
        {
            conversation.Participants.Add(new ChatParticipant
            {
                UserObjectId = p.UserObjectId,
                DisplayName = p.DisplayName,
                Email = p.Email,
            });
        }

        db.ChatConversations.Add(conversation);
        await db.SaveChangesAsync(ct);

        return conversation;
    }

    public async Task<(int Total, List<object> Items)> GetUserConversationsAsync(
        string userOid, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var q = db.ChatConversations
            .AsNoTracking()
            .Where(c => c.Participants.Any(p => p.UserObjectId == userOid && p.IsActive));

        var total = await q.CountAsync(ct);

        var conversations = await q
            .OrderByDescending(c => c.LastMessageAtUtc ?? c.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.Type,
                c.NameAr,
                c.NameEn,
                c.CreatedAtUtc,
                c.LastMessageAtUtc,
                Participants = c.Participants.Where(p => p.IsActive).Select(p => new
                {
                    p.UserObjectId,
                    p.DisplayName,
                    p.Email,
                }).ToList(),
                UnreadCount = c.Participants
                    .Where(p => p.UserObjectId == userOid)
                    .Select(p => p.UnreadCount)
                    .FirstOrDefault(),
                LastMessage = c.Messages
                    .OrderByDescending(m => m.CreatedAtUtc)
                    .Select(m => new
                    {
                        m.Content,
                        m.SenderDisplayName,
                        m.Type,
                        m.CreatedAtUtc,
                    })
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        return (total, conversations.Cast<object>().ToList());
    }

    public async Task<(int Total, List<ChatMessage> Items)> GetMessagesAsync(
        Guid conversationId, string userOid, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        // Verify user is a participant
        var isParticipant = await db.ChatParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserObjectId == userOid && p.IsActive, ct);

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant of this conversation.");

        var q = db.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted)
            .Include(m => m.Attachments);

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(m => m.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (total, items);
    }

    public async Task<ChatMessage> SendMessageAsync(
        Guid conversationId, string senderOid, string senderDisplay,
        string content, string type, List<Guid>? attachmentFileIds,
        CancellationToken ct)
    {
        // Verify sender is a participant
        var isParticipant = await db.ChatParticipants
            .AnyAsync(p => p.ConversationId == conversationId && p.UserObjectId == senderOid && p.IsActive, ct);

        if (!isParticipant)
            throw new ForbiddenException("You are not a participant of this conversation.");

        var message = new ChatMessage
        {
            ConversationId = conversationId,
            SenderObjectId = senderOid,
            SenderDisplayName = senderDisplay,
            Content = content.Trim(),
            Type = type,
        };

        // Attach files if provided
        if (attachmentFileIds is { Count: > 0 })
        {
            var files = await db.StoredFiles
                .AsNoTracking()
                .Where(f => attachmentFileIds.Contains(f.Id))
                .ToListAsync(ct);

            foreach (var file in files)
            {
                message.Attachments.Add(new ChatMessageAttachment
                {
                    StoredFileId = file.Id,
                    FileName = file.FileName,
                    ContentType = file.ContentType,
                    SizeBytes = file.SizeBytes,
                });
            }
        }

        db.ChatMessages.Add(message);

        // Update conversation's last message timestamp
        await db.ChatConversations
            .Where(c => c.Id == conversationId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.LastMessageAtUtc, DateTime.UtcNow), ct);

        // Increment unread count for all other participants
        await db.ChatParticipants
            .Where(p => p.ConversationId == conversationId && p.UserObjectId != senderOid && p.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.UnreadCount, p => p.UnreadCount + 1), ct);

        await db.SaveChangesAsync(ct);

        // Push real-time message to all participants via SignalR
        var participantOids = await db.ChatParticipants
            .AsNoTracking()
            .Where(p => p.ConversationId == conversationId && p.IsActive)
            .Select(p => p.UserObjectId)
            .ToListAsync(ct);

        var payload = new
        {
            message.Id,
            message.ConversationId,
            message.SenderObjectId,
            message.SenderDisplayName,
            message.Content,
            message.Type,
            message.CreatedAtUtc,
            Attachments = message.Attachments.Select(a => new
            {
                a.Id,
                a.StoredFileId,
                a.FileName,
                a.ContentType,
                a.SizeBytes,
            }),
        };

        foreach (var oid in participantOids)
        {
            try
            {
                await hubContext.Clients.Group($"chat:user:{oid}")
                    .SendAsync("ReceiveMessage", payload, ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to send chat message via SignalR to {UserOid}", oid);
            }
        }

        // Send notification to other participants (fire-and-forget)
        try
        {
            var otherParticipants = await db.ChatParticipants
                .AsNoTracking()
                .Where(p => p.ConversationId == conversationId && p.UserObjectId != senderOid && p.IsActive)
                .Select(p => new { p.UserObjectId, p.Email })
                .ToListAsync(ct);

            var notificationPayloads = otherParticipants.Select(p => new NotificationPayload(
                RecipientObjectId: p.UserObjectId,
                RecipientEmail: p.Email,
                Type: "ChatMessage",
                TitleAr: $"رسالة جديدة من {senderDisplay}",
                TitleEn: $"New message from {senderDisplay}",
                BodyAr: content.Length > 100 ? content[..100] + "..." : content,
                BodyEn: content.Length > 100 ? content[..100] + "..." : content,
                EntityType: "ChatConversation",
                EntityId: conversationId,
                ActionUrl: "/chat")).ToList();

            if (notificationPayloads.Count > 0)
                await notifications.NotifyManyAsync(notificationPayloads, ct);
        }
        catch { /* notification failure must not block the main operation */ }

        return message;
    }

    public async Task MarkAsReadAsync(Guid conversationId, string userOid, CancellationToken ct)
    {
        await db.ChatParticipants
            .Where(p => p.ConversationId == conversationId && p.UserObjectId == userOid)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.LastReadAtUtc, DateTime.UtcNow)
                .SetProperty(p => p.UnreadCount, 0), ct);
    }

    public async Task<int> GetTotalUnreadCountAsync(string userOid, CancellationToken ct)
    {
        return await db.ChatParticipants
            .Where(p => p.UserObjectId == userOid && p.IsActive)
            .SumAsync(p => p.UnreadCount, ct);
    }

    public async Task<(int Total, List<object> Items)> SearchArchiveAsync(
        string userOid, string query, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var userConversationIds = db.ChatParticipants
            .Where(p => p.UserObjectId == userOid && p.IsActive)
            .Select(p => p.ConversationId);

        var q = db.ChatMessages
            .AsNoTracking()
            .Where(m => userConversationIds.Contains(m.ConversationId) && !m.IsDeleted)
            .Where(m => EF.Functions.ILike(m.Content, $"%{query}%"));

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(m => m.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new
            {
                m.Id,
                m.ConversationId,
                m.SenderObjectId,
                m.SenderDisplayName,
                m.Content,
                m.CreatedAtUtc,
            })
            .ToListAsync(ct);

        return (total, items.Cast<object>().ToList());
    }

    public async Task<(int Total, List<object> Items)> GetUserAttachmentsAsync(
        string userOid, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var userConversationIds = db.ChatParticipants
            .Where(p => p.UserObjectId == userOid && p.IsActive)
            .Select(p => p.ConversationId);

        var q = db.ChatMessageAttachments
            .AsNoTracking()
            .Where(a => db.ChatMessages
                .Any(m => m.Id == a.ChatMessageId && userConversationIds.Contains(m.ConversationId) && !m.IsDeleted));

        var total = await q.CountAsync(ct);

        var items = await q
            .OrderByDescending(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                a.Id,
                a.StoredFileId,
                a.FileName,
                a.ContentType,
                a.SizeBytes,
                Message = db.ChatMessages
                    .Where(m => m.Id == a.ChatMessageId)
                    .Select(m => new
                    {
                        m.SenderDisplayName,
                        m.ConversationId,
                        m.CreatedAtUtc,
                    })
                    .FirstOrDefault(),
            })
            .ToListAsync(ct);

        return (total, items.Cast<object>().ToList());
    }

    public async Task<List<ChatContactDto>> GetContactsAsync(string userOid, CancellationToken ct)
    {
        var contacts = await db.Set<CommitteeMember>()
            .AsNoTracking()
            .Where(cm => cm.IsActive && cm.UserObjectId != userOid && cm.Email != null)
            .Select(cm => new { cm.UserObjectId, cm.DisplayName, cm.Email })
            .Distinct()
            .OrderBy(cm => cm.DisplayName)
            .ToListAsync(ct);

        return contacts
            .Select(c => new ChatContactDto(c.UserObjectId, c.DisplayName, c.Email))
            .ToList();
    }
}
