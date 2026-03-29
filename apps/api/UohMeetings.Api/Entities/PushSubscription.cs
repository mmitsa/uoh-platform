namespace UohMeetings.Api.Entities;

public sealed class PushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserObjectId { get; set; } = "";
    public string Endpoint { get; set; } = "";
    public string P256dh { get; set; } = "";
    public string Auth { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
