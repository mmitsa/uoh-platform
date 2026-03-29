using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class Mom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MeetingId { get; set; }

    public MomStatus Status { get; set; } = MomStatus.Draft;
    public DateTime? ApprovedAtUtc { get; set; }

    public string? WordDocUrl { get; set; }
    public string? PdfDocUrl { get; set; }

    public Meeting? Meeting { get; set; }

    public List<AttendanceRecord> Attendance { get; set; } = new();
    public List<AgendaMinute> AgendaMinutes { get; set; } = new();
    public List<Decision> Decisions { get; set; } = new();
    public List<RecommendationTask> Recommendations { get; set; } = new();
}

public sealed class AttendanceRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MomId { get; set; }

    public string UserObjectId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";

    public bool IsPresent { get; set; }
    public string AttendanceStatus { get; set; } = "present"; // present, absent, excused, late
    public string? AbsenceReason { get; set; }
    public DateTime? CheckedInAtUtc { get; set; }
}

public sealed class AgendaMinute
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MomId { get; set; }
    public Guid AgendaItemId { get; set; }
    public string Notes { get; set; } = "";
}

public sealed class Decision
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MomId { get; set; }
    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";
    public string? Notes { get; set; }
}

public sealed class RecommendationTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MomId { get; set; }
    public Guid CommitteeId { get; set; }

    public string TitleAr { get; set; } = "";
    public string TitleEn { get; set; } = "";

    public string AssignedToObjectId { get; set; } = "";
    public string? AssignedToDisplayName { get; set; }
    public string? AssignedToEmail { get; set; }

    public DateTime DueDateUtc { get; set; }
    public Priority Priority { get; set; } = Priority.Medium;
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;
    public int Progress { get; set; }

    public string? Category { get; set; }
    public string? Beneficiary { get; set; }
    public string? ReceiptNumber { get; set; }
    public string? AttachmentsJson { get; set; }

    public List<SubTask> SubTasks { get; set; } = new();
}

public sealed class SubTask
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecommendationTaskId { get; set; }
    public string Title { get; set; } = "";
    public DateTime? DueDateUtc { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Pending;
    public int Progress { get; set; }
}
