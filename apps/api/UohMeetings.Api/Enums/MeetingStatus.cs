using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MeetingStatus
{
    Draft,
    Scheduled,
    InProgress,
    Completed,
    Cancelled,
}
