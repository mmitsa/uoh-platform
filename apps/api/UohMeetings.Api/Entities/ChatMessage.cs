namespace UohMeetings.Api.Entities;

public sealed class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConversationId { get; set; }
    public string SenderObjectId { get; set; } = "";
    public string SenderDisplayName { get; set; } = "";
    public string Content { get; set; } = "";
    public string Type { get; set; } = "text"; // text | file | system
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }

    public List<ChatMessageAttachment> Attachments { get; set; } = new();
}
