using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CommitteeStatus
{
    Draft,
    PendingApproval,
    Active,
    Suspended,
    Closed,
}
