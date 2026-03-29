using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync(Guid? committeeId, CancellationToken ct);
}

public sealed record DashboardStatsDto(
    int TotalCommittees,
    int ActiveCommittees,
    int TotalMeetings,
    int MeetingsThisMonth,
    int MeetingsLastMonth,
    int PendingTasks,
    int OverdueTasks,
    int ActiveSurveys,
    double MeetingAttendanceRate,
    double TaskCompletionRate,
    IReadOnlyList<UpcomingMeetingDto> UpcomingMeetings,
    IReadOnlyList<RecentActivityDto> RecentActivity,
    IReadOnlyList<MonthlyMeetingDto> MeetingsByMonth,
    IReadOnlyList<StatusBreakdownDto> TaskStatusBreakdown,
    IReadOnlyList<StatusBreakdownDto> CommitteeTypeBreakdown,
    IReadOnlyList<StatusBreakdownDto> TaskPriorityBreakdown,
    IReadOnlyList<AssigneeWorkloadDto> AssigneeWorkload,
    int LiveMeetingsNow,
    int UpcomingMeetingsCount
);

public sealed record UpcomingMeetingDto(Guid Id, string TitleAr, string TitleEn, DateTime StartDateTimeUtc, string Status);
public sealed record RecentActivityDto(DateTime OccurredAtUtc, string? UserDisplayName, string HttpMethod, string Path, int StatusCode);
public sealed record MonthlyMeetingDto(string Month, int Count);
public sealed record StatusBreakdownDto(string Label, int Count);
public sealed record AssigneeWorkloadDto(string DisplayName, int Total, int Completed, int Overdue, double CompletionRate);
public sealed record CalendarEventDto(
    Guid Id, string TitleAr, string TitleEn,
    DateTime StartDateTimeUtc, DateTime EndDateTimeUtc,
    string Status, string Type, string EventKind,
    Guid? CommitteeId, string? CommitteeNameAr, string? CommitteeNameEn,
    string? Location);
