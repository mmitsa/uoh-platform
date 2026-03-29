using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public interface IReportService
{
    Task<CommitteeActivityReport> GetCommitteeActivityAsync(DateTime from, DateTime to, Guid? committeeId, CancellationToken ct);
    Task<MeetingAttendanceReport> GetMeetingAttendanceAsync(DateTime from, DateTime to, Guid? committeeId, CancellationToken ct);
    Task<TaskPerformanceReport> GetTaskPerformanceAsync(DateTime from, DateTime to, string? assignedToObjectId, CancellationToken ct);
    Task<byte[]> ExportExcelAsync(ReportType type, DateTime from, DateTime to, Guid? committeeId, string? assignedToObjectId, CancellationToken ct);
}

public sealed record CommitteeActivityReport(
    IReadOnlyList<CommitteeActivityRow> Rows,
    int TotalMeetings,
    int TotalDecisions,
    int TotalTasksCompleted
);

public sealed record CommitteeActivityRow(
    Guid CommitteeId, string NameAr, string NameEn,
    int MeetingsCount, int DecisionsCount, int TasksCompletedCount
);

public sealed record MeetingAttendanceReport(
    IReadOnlyList<AttendanceRow> Rows,
    double OverallAttendanceRate
);

public sealed record AttendanceRow(
    Guid MeetingId, string TitleAr, string TitleEn,
    DateTime StartDateTimeUtc, int TotalInvited, int TotalPresent, double AttendanceRate
);

public sealed record TaskPerformanceReport(
    IReadOnlyList<TaskPerformanceRow> Rows,
    double OverallCompletionRate,
    int TotalOverdue
);

public sealed record TaskPerformanceRow(
    string AssignedToDisplayName, int TotalTasks, int Completed, int Overdue, double CompletionRate
);
