using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum CommitteeType
{
    Permanent,
    Temporary,
    Main,
    Sub,
    Council,
    SelfManaged,
    CrossFunctional,
}
