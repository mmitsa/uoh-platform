namespace UohMeetings.Api.Entities;

public sealed class ExternalDataSource
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>The external API URL to fetch data from.</summary>
    public string ApiUrl { get; set; } = "";

    /// <summary>HTTP method: GET or POST.</summary>
    public string HttpMethod { get; set; } = "GET";

    /// <summary>Optional JSON object of HTTP headers.</summary>
    public string? HeadersJson { get; set; }

    /// <summary>Optional request body template for POST requests.</summary>
    public string? RequestBodyTemplate { get; set; }

    /// <summary>JSON mapping of response fields to display fields.</summary>
    public string ResponseMapping { get; set; } = "{}";

    /// <summary>How often to refresh data in minutes.</summary>
    public int RefreshIntervalMinutes { get; set; } = 60;

    public bool IsActive { get; set; } = true;

    public DateTime? LastFetchAtUtc { get; set; }
    public string? LastFetchStatus { get; set; }

    /// <summary>Object ID of the user who created this source.</summary>
    public string CreatedByObjectId { get; set; } = "";

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}
