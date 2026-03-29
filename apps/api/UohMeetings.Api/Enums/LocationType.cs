using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LocationType
{
    Building,
    Hall,
    MeetingRoom,
    Lab,
    Auditorium,
    Department,
    OutdoorArea,
    Gate,
    Library,
    Cafeteria,
    Parking,
    Other,
}
