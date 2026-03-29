using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class Meeting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? CommitteeId { get; set; }

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string DescriptionAr { get; set; } = "";
    public string DescriptionEn { get; set; } = "";

    public MeetingType Type { get; set; } = MeetingType.InPerson;
    public DateTime StartDateTimeUtc { get; set; }
    public DateTime EndDateTimeUtc { get; set; }

    public string? Location { get; set; }
    public Guid? MeetingRoomId { get; set; }
    public OnlinePlatform? OnlinePlatform { get; set; }
    public string? OnlineJoinUrl { get; set; }
    public string? CalendarEventId { get; set; }

    public MeetingStatus Status { get; set; } = MeetingStatus.Draft;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Committee? Committee { get; set; }
    public MeetingRoom? MeetingRoom { get; set; }
    public List<AgendaItem> AgendaItems { get; set; } = new();
    public List<MeetingInvitee> Invitees { get; set; } = new();
}

public sealed class AgendaItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MeetingId { get; set; }

    public int Order { get; set; }
    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }
    public int? DurationMinutes { get; set; }
    public string? PresenterName { get; set; }

    public Meeting? Meeting { get; set; }
}
