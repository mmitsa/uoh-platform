using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ShareableEntityType
{
    Meeting,
    Committee,
    Directive,
    Mom,
    Location,
    Attendance,
}
