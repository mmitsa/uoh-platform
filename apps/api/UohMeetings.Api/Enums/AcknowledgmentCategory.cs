using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum AcknowledgmentCategory
{
    Confidentiality,
    DataPrivacy,
    CodeOfConduct,
    AcceptableUse,
    CommitteeCharter,
    IntellectualProperty,
    ConflictOfInterest,
    SecurityPolicy,
    Custom,
}
