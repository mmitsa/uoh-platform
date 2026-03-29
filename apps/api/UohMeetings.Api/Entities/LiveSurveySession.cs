using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class LiveSurveySession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SurveyId { get; set; }

    /// <summary>6-char alphanumeric code (no ambiguous chars I/O/0/1).</summary>
    public string JoinCode { get; set; } = "";

    /// <summary>16-char hex key used to authenticate the presenter.</summary>
    public string PresenterKey { get; set; } = "";

    public LiveSessionStatus Status { get; set; } = LiveSessionStatus.Created;
    public int CurrentQuestionIndex { get; set; } = -1;
    public int ParticipantCount { get; set; }
    public bool AcceptingVotes { get; set; }

    public string? CreatedByObjectId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }

    // Navigation
    public Survey? Survey { get; set; }
    public List<LiveSessionResponse> Responses { get; set; } = new();
}

public sealed class LiveSessionResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LiveSurveySessionId { get; set; }
    public Guid SurveyResponseId { get; set; }

    /// <summary>Fingerprint (UUID stored in client sessionStorage) to prevent double-voting.</summary>
    public string ParticipantFingerprint { get; set; } = "";

    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;

    // Navigation
    public LiveSurveySession? Session { get; set; }
    public SurveyResponse? SurveyResponse { get; set; }
}
