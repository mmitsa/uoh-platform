using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class WorkflowTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Domain { get; set; } = "";

    public string DefinitionJson { get; set; } = "{}";
    public string? BuilderMetadataJson { get; set; }
    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class WorkflowInstance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TemplateId { get; set; }
    public string Domain { get; set; } = "";

    public Guid EntityId { get; set; }

    public string CurrentState { get; set; } = "draft";
    public WorkflowStatus Status { get; set; } = WorkflowStatus.Active;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    // SLA Escalation
    /// <summary>Maximum hours a step may stay pending before an escalation is triggered.</summary>
    public int? SlaHoursUntilEscalation { get; set; }
    /// <summary>Tracks when the last escalation notification was sent to prevent duplicates.</summary>
    public DateTime? LastEscalatedAtUtc { get; set; }

    public List<WorkflowInstanceHistory> History { get; set; } = new();
}

public sealed class WorkflowInstanceHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InstanceId { get; set; }

    public string FromState { get; set; } = "";
    public string ToState { get; set; } = "";
    public string Action { get; set; } = "";

    public string? ActorObjectId { get; set; }
    public string? ActorDisplayName { get; set; }

    public DateTime OccurredAtUtc { get; set; } = DateTime.UtcNow;
}
