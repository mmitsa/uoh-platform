using System.Text.Json.Serialization;

namespace UohMeetings.Api.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SurveyQuestionType
{
    Single,
    Multi,
    Rating,
    Text,
    Slider,
    Image,
    YesNo,
}
