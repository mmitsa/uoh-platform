using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum MeetingType
{
    InPerson,
    Online,
    Hybrid,
}
