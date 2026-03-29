namespace UohMeetings.Api.Options;

public sealed class IntegrationOptions
{
    public const string Section = "Integrations";
    public TeamsOptions Teams { get; set; } = new();
    public ZoomOptions Zoom { get; set; } = new();
    public SmtpOptions Smtp { get; set; } = new();
    public FcmOptions Fcm { get; set; } = new();
    public OnlineMeetingOptions OnlineMeeting { get; set; } = new();
}

public sealed class OnlineMeetingOptions
{
    public string DefaultProvider { get; set; } = "teams";
}

public sealed class TeamsOptions
{
    public bool Enabled { get; set; }
    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string OrganizerUpn { get; set; } = string.Empty;
}

public sealed class ZoomOptions
{
    public bool Enabled { get; set; }
    public ZoomS2SOptions S2S { get; set; } = new();
}

public sealed class ZoomS2SOptions
{
    public string AccountId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}

public sealed class SmtpOptions
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public bool UseSsl { get; set; } = true;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = string.Empty;
    public string FromName { get; set; } = "UOH Meetings";
}

public sealed class FcmOptions
{
    public string ProjectId { get; set; } = string.Empty;
    public string ServiceAccountJsonPath { get; set; } = string.Empty;
}
