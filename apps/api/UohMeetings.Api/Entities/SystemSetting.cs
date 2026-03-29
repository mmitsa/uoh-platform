namespace UohMeetings.Api.Entities;

public sealed class SystemSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
    public bool IsEncrypted { get; set; }
    public string GroupKey { get; set; } = "";
    public string DataType { get; set; } = "string";
    public string? Description { get; set; }
    public string? UpdatedByObjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
