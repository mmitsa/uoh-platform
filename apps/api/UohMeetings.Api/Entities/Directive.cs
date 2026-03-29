using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

/// <summary>
/// Organizational directive / policy that drives decisions and committee actions.
/// </summary>
public sealed class Directive
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string DescriptionAr { get; set; } = "";
    public string DescriptionEn { get; set; } = "";

    public string IssuedBy { get; set; } = "";
    public string? ReferenceNumber { get; set; }

    public DirectiveStatus Status { get; set; } = DirectiveStatus.Draft;

    public DateTime IssueDateUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<DirectiveDecision> Decisions { get; set; } = new();
}

/// <summary>
/// A decision made based on a directive, can be linked to one or more committees.
/// </summary>
public sealed class DirectiveDecision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DirectiveId { get; set; }

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string? NotesAr { get; set; }
    public string? NotesEn { get; set; }

    public DecisionStatus Status { get; set; } = DecisionStatus.Draft;

    /// <summary>
    /// Committee linked to carry out this decision.
    /// </summary>
    public Guid? CommitteeId { get; set; }
    public Committee? Committee { get; set; }

    public Guid? WorkflowInstanceId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Directive? Directive { get; set; }
}
