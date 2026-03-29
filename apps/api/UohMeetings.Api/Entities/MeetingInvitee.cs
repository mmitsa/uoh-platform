using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class MeetingInvitee
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MeetingId { get; set; }

    public string Email { get; set; } = "";
    public string? DisplayName { get; set; }

    public InviteeRole Role { get; set; } = InviteeRole.Required;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
