namespace UohMeetings.Api.Entities;

public sealed class ChatParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public string UserObjectId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public DateTime? LastReadAtUtc { get; set; }
    public int UnreadCount { get; set; }
}
