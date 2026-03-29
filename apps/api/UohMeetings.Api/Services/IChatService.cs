using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IChatService
{
    Task<ChatConversation> GetOrCreateDirectAsync(
        string userOid, string userDisplay, string userEmail,
        string targetOid, string targetDisplay, string targetEmail,
        CancellationToken ct = default);

    Task<ChatConversation> CreateGroupAsync(
        string creatorOid, string creatorDisplay, string creatorEmail,
        string nameAr, string nameEn,
        List<ChatContactDto> participants,
        CancellationToken ct = default);

    Task<(int Total, List<object> Items)> GetUserConversationsAsync(
        string userOid, int page, int pageSize, CancellationToken ct = default);

    Task<(int Total, List<ChatMessage> Items)> GetMessagesAsync(
        Guid conversationId, string userOid, int page, int pageSize, CancellationToken ct = default);

    Task<ChatMessage> SendMessageAsync(
        Guid conversationId, string senderOid, string senderDisplay,
        string content, string type, List<Guid>? attachmentFileIds = null,
        CancellationToken ct = default);

    Task MarkAsReadAsync(Guid conversationId, string userOid, CancellationToken ct = default);

    Task<int> GetTotalUnreadCountAsync(string userOid, CancellationToken ct = default);

    Task<(int Total, List<object> Items)> SearchArchiveAsync(
        string userOid, string query, int page, int pageSize, CancellationToken ct = default);

    Task<(int Total, List<object> Items)> GetUserAttachmentsAsync(
        string userOid, int page, int pageSize, CancellationToken ct = default);

    Task<List<ChatContactDto>> GetContactsAsync(string userOid, CancellationToken ct = default);
}

public sealed record ChatContactDto(string UserObjectId, string DisplayName, string Email);
