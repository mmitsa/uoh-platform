using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum EvaluationStatus
{
    Draft,
    InProgress,
    Completed,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ChangeRequestStatus
{
    Pending,
    UnderReview,
    Approved,
    Rejected,
}
