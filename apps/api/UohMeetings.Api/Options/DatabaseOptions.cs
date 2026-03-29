namespace UohMeetings.Api.Options;

public sealed class DatabaseOptions
{
    public const string Section = "Database";
    public bool AutoMigrate { get; set; }
    public bool AutoSeed { get; set; }
}
