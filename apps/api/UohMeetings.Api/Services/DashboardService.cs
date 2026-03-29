using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public sealed class DashboardService(AppDbContext db) : IDashboardService
{
    public async Task<DashboardStatsDto> GetStatsAsync(Guid? committeeId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfMonth.AddMonths(-1);
        var next7Days = now.AddDays(7);
        var sixMonthsAgo = now.AddMonths(-6);

        // Scoped queries based on optional committee filter
        var meetingsQ = db.Meetings.AsQueryable();
        var tasksQ = db.RecommendationTasks.AsQueryable();
        if (committeeId.HasValue)
        {
            meetingsQ = meetingsQ.Where(m => m.CommitteeId == committeeId);
            tasksQ = tasksQ.Where(t => t.CommitteeId == committeeId);
        }

        // ALL queries launched in parallel
        var totalCommitteesTask = db.Committees.CountAsync(ct);
        var activeCommitteesTask = db.Committees.CountAsync(c => c.Status == CommitteeStatus.Active, ct);
        var totalMeetingsTask = meetingsQ.CountAsync(ct);
        var meetingsThisMonthTask = meetingsQ.CountAsync(m => m.CreatedAtUtc >= startOfMonth, ct);
        var meetingsLastMonthTask = meetingsQ.CountAsync(m => m.CreatedAtUtc >= startOfLastMonth && m.CreatedAtUtc < startOfMonth, ct);
        var pendingTasksTask = tasksQ.CountAsync(t => t.Status == TaskItemStatus.Pending || t.Status == TaskItemStatus.InProgress, ct);
        var overdueTasksTask = tasksQ.CountAsync(t => t.Status == TaskItemStatus.Overdue, ct);
        var activeSurveysTask = db.Surveys.CountAsync(s => s.Status == SurveyStatus.Active, ct);
        var totalAttendanceTask = db.AttendanceRecords.CountAsync(ct);
        var presentAttendanceTask = db.AttendanceRecords.CountAsync(a => a.IsPresent, ct);
        var totalTasksTask = tasksQ.CountAsync(ct);
        var completedTasksTask = tasksQ.CountAsync(t => t.Status == TaskItemStatus.Completed, ct);

        var upcomingTask = meetingsQ.AsNoTracking()
            .Where(m => m.StartDateTimeUtc >= now && m.StartDateTimeUtc <= next7Days && m.Status == MeetingStatus.Scheduled)
            .OrderBy(m => m.StartDateTimeUtc)
            .Take(10)
            .Select(m => new UpcomingMeetingDto(m.Id, m.TitleAr, m.TitleEn, m.StartDateTimeUtc, m.Status.ToString()))
            .ToListAsync(ct);

        var recentActivityTask = db.AuditLogEntries.AsNoTracking()
            .OrderByDescending(a => a.OccurredAtUtc)
            .Take(10)
            .Select(a => new RecentActivityDto(a.OccurredAtUtc, a.UserDisplayName, a.HttpMethod, a.Path, a.StatusCode))
            .ToListAsync(ct);

        var meetingsByMonthTask = meetingsQ.AsNoTracking()
            .Where(m => m.StartDateTimeUtc >= sixMonthsAgo)
            .GroupBy(m => new { m.StartDateTimeUtc.Year, m.StartDateTimeUtc.Month })
            .Select(g => new MonthlyMeetingDto($"{g.Key.Year}-{g.Key.Month:D2}", g.Count()))
            .OrderBy(x => x.Month)
            .ToListAsync(ct);

        var taskBreakdownTask = tasksQ.AsNoTracking()
            .GroupBy(t => t.Status)
            .Select(g => new StatusBreakdownDto(g.Key.ToString(), g.Count()))
            .ToListAsync(ct);

        var committeeBreakdownTask = db.Committees.AsNoTracking()
            .GroupBy(c => c.Type)
            .Select(g => new StatusBreakdownDto(g.Key.ToString(), g.Count()))
            .ToListAsync(ct);

        // NEW: Priority breakdown
        var priorityBreakdownTask = tasksQ.AsNoTracking()
            .GroupBy(t => t.Priority)
            .Select(g => new StatusBreakdownDto(g.Key.ToString(), g.Count()))
            .ToListAsync(ct);

        // Live meetings + upcoming count
        var liveMeetingsTask = meetingsQ.CountAsync(
            m => m.Status == MeetingStatus.InProgress, ct);
        var upcomingCountTask = meetingsQ.CountAsync(
            m => m.Status == MeetingStatus.Scheduled
              && m.StartDateTimeUtc >= now
              && m.StartDateTimeUtc <= next7Days, ct);

        // NEW: Assignee workload (top 15)
        var assigneeWorkloadTask = tasksQ.AsNoTracking()
            .GroupBy(t => t.AssignedToDisplayName ?? t.AssignedToObjectId)
            .Select(g => new AssigneeWorkloadDto(
                g.Key ?? "—",
                g.Count(),
                g.Count(t => t.Status == TaskItemStatus.Completed),
                g.Count(t => t.Status == TaskItemStatus.Overdue),
                g.Count() > 0 ? Math.Round((double)g.Count(t => t.Status == TaskItemStatus.Completed) / g.Count() * 100, 1) : 0
            ))
            .OrderByDescending(a => a.Total)
            .Take(15)
            .ToListAsync(ct);

        await Task.WhenAll(
            totalCommitteesTask, activeCommitteesTask, totalMeetingsTask,
            meetingsThisMonthTask, meetingsLastMonthTask, pendingTasksTask, overdueTasksTask, activeSurveysTask,
            totalAttendanceTask, presentAttendanceTask, totalTasksTask, completedTasksTask,
            upcomingTask, recentActivityTask, meetingsByMonthTask, taskBreakdownTask, committeeBreakdownTask,
            priorityBreakdownTask, assigneeWorkloadTask,
            liveMeetingsTask, upcomingCountTask);

        var attendanceRate = totalAttendanceTask.Result > 0 ? (double)presentAttendanceTask.Result / totalAttendanceTask.Result * 100 : 0;
        var completionRate = totalTasksTask.Result > 0 ? (double)completedTasksTask.Result / totalTasksTask.Result * 100 : 0;

        return new DashboardStatsDto(
            totalCommitteesTask.Result, activeCommitteesTask.Result,
            totalMeetingsTask.Result, meetingsThisMonthTask.Result, meetingsLastMonthTask.Result,
            pendingTasksTask.Result, overdueTasksTask.Result, activeSurveysTask.Result,
            Math.Round(attendanceRate, 1), Math.Round(completionRate, 1),
            upcomingTask.Result, recentActivityTask.Result, meetingsByMonthTask.Result,
            taskBreakdownTask.Result, committeeBreakdownTask.Result,
            priorityBreakdownTask.Result, assigneeWorkloadTask.Result,
            liveMeetingsTask.Result, upcomingCountTask.Result
        );
    }
}
