using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class StoredFile
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Provider { get; set; } = "minio";
    public string BucketOrContainer { get; set; } = "";
    public string ObjectKey { get; set; } = "";

    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "application/octet-stream";
    public long SizeBytes { get; set; }

    public FileClassification Classification { get; set; } = FileClassification.Internal;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
