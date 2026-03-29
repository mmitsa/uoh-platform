using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DirectiveStatus
{
    Draft,
    Active,
    Closed,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum DecisionStatus
{
    Draft,
    PendingApproval,
    Approved,
    Rejected,
    Implemented,
}
