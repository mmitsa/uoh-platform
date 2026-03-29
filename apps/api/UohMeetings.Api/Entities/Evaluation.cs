using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

/// <summary>
/// A reusable evaluation template with configurable criteria.
/// </summary>
public sealed class EvaluationTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    /// <summary>Maximum score across all criteria.</summary>
    public int MaxScore { get; set; } = 100;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<EvaluationCriteria> Criteria { get; set; } = new();
}

/// <summary>
/// A single criterion within an evaluation template (e.g., "Attendance Rate", "Decision Quality").
/// </summary>
public sealed class EvaluationCriteria
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }

    public string LabelAr { get; set; } = "";
    public string LabelEn { get; set; } = "";
    public string? DescriptionAr { get; set; }
    public string? DescriptionEn { get; set; }

    public int MaxScore { get; set; } = 10;
    public int Weight { get; set; } = 1;
    public int SortOrder { get; set; }

    public EvaluationTemplate? Template { get; set; }
}

/// <summary>
/// An evaluation of a specific committee using a template.
/// </summary>
public sealed class CommitteeEvaluation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CommitteeId { get; set; }
    public Guid TemplateId { get; set; }

    public string EvaluatorObjectId { get; set; } = "";
    public string EvaluatorDisplayName { get; set; } = "";

    public EvaluationStatus Status { get; set; } = EvaluationStatus.Draft;

    /// <summary>Period being evaluated.</summary>
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    public string? OverallNotesAr { get; set; }
    public string? OverallNotesEn { get; set; }

    /// <summary>Auto-calculated weighted score.</summary>
    public double TotalScore { get; set; }
    public double MaxPossibleScore { get; set; }
    public double ScorePercentage { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime CompletedAtUtc { get; set; }

    public Committee? Committee { get; set; }
    public EvaluationTemplate? Template { get; set; }
    public List<EvaluationResponse> Responses { get; set; } = new();
}

/// <summary>
/// Score given to a single criterion in an evaluation.
/// </summary>
public sealed class EvaluationResponse
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EvaluationId { get; set; }
    public Guid CriteriaId { get; set; }

    public int Score { get; set; }
    public string? Notes { get; set; }

    public CommitteeEvaluation? Evaluation { get; set; }
    public EvaluationCriteria? Criteria { get; set; }
}
