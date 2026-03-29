namespace UohMeetings.Api.Entities;

public sealed class ChatConversation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Type { get; set; } = "direct"; // direct | group
    public string? NameAr { get; set; }
    public string? NameEn { get; set; }
    public string CreatedByOid { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastMessageAtUtc { get; set; }

    public List<ChatParticipant> Participants { get; set; } = new();
    public List<ChatMessage> Messages { get; set; } = new();
}
