namespace UohMeetings.Api.Entities;

public sealed class ChatMessageAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatMessageId { get; set; }
    public Guid StoredFileId { get; set; }
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }
}
