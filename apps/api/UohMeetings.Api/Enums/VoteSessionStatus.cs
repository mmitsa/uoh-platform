using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum VoteSessionStatus
{
    Draft,
    Open,
    Closed,
}
