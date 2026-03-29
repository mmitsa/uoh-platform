using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LiveSessionStatus
{
    Created,
    Active,
    Paused,
    Completed,
}
