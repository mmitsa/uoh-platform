namespace UohMeetings.Api.Entities;

public sealed class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Domain { get; set; } = "meeting"; // committee/meeting/mom
    public Guid EntityId { get; set; }
    public Guid StoredFileId { get; set; }

    public string Title { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

