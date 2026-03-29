using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TaskItemStatus
{
    Pending,
    InProgress,
    Completed,
    Overdue,
    Cancelled,
}
