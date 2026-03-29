namespace UohMeetings.Api.Options;

public sealed class CorsOptions
{
    public const string Section = "Cors";
    public string[] AllowedOrigins { get; set; } = ["http://localhost:5173", "http://localhost:3000"];
}
