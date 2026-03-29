namespace UohMeetings.Api.Entities;

public sealed class AuditLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;

    public string? TraceId { get; set; }

    public string? UserObjectId { get; set; }
    public string? UserDisplayName { get; set; }
    public string? UserEmail { get; set; }
    public string? UserRoles { get; set; }

    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public string HttpMethod { get; set; } = "GET";
    public string Path { get; set; } = "/";
    public int StatusCode { get; set; }
    public int DurationMs { get; set; }
    public bool Success { get; set; }
}

