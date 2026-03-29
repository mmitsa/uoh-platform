using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public sealed class ReportService(AppDbContext db) : IReportService
{
    public async Task<CommitteeActivityReport> GetCommitteeActivityAsync(DateTime from, DateTime to, Guid? committeeId, CancellationToken ct)
    {
        var q = db.Committees.AsNoTracking().AsQueryable();
        if (committeeId.HasValue) q = q.Where(c => c.Id == committeeId.Value);

        var rows = await q.Select(c => new
        {
            c.Id, c.NameAr, c.NameEn,
            MeetingsCount = db.Meetings.Count(m => m.CommitteeId == c.Id && m.StartDateTimeUtc >= from && m.StartDateTimeUtc <= to),
            DecisionsCount = db.Decisions.Count(d =>
                db.Moms.Any(mo => mo.Id == d.MomId &&
                    db.Meetings.Any(m => m.Id == mo.MeetingId && m.CommitteeId == c.Id && m.StartDateTimeUtc >= from && m.StartDateTimeUtc <= to))),
            TasksCompletedCount = db.RecommendationTasks.Count(t => t.Status == TaskItemStatus.Completed &&
                db.Moms.Any(mo => mo.Id == t.MomId &&
                    db.Meetings.Any(m => m.Id == mo.MeetingId && m.CommitteeId == c.Id && m.StartDateTimeUtc >= from && m.StartDateTimeUtc <= to)))
        }).ToListAsync(ct);

        var result = rows.Select(r => new CommitteeActivityRow(r.Id, r.NameAr, r.NameEn, r.MeetingsCount, r.DecisionsCount, r.TasksCompletedCount)).ToList();
        return new CommitteeActivityReport(result, result.Sum(r => r.MeetingsCount), result.Sum(r => r.DecisionsCount), result.Sum(r => r.TasksCompletedCount));
    }

    public async Task<MeetingAttendanceReport> GetMeetingAttendanceAsync(DateTime from, DateTime to, Guid? committeeId, CancellationToken ct)
    {
        var q = db.Meetings.AsNoTracking()
            .Where(m => m.StartDateTimeUtc >= from && m.StartDateTimeUtc <= to);
        if (committeeId.HasValue) q = q.Where(m => m.CommitteeId == committeeId.Value);

        var rows = await q.OrderByDescending(m => m.StartDateTimeUtc)
            .Select(m => new
            {
                m.Id, m.TitleAr, m.TitleEn, m.StartDateTimeUtc,
                Invited = db.MeetingInvitees.Count(i => i.MeetingId == m.Id),
                Present = db.AttendanceRecords.Count(a => a.IsPresent &&
                    db.Moms.Any(mo => mo.MeetingId == m.Id && mo.Id == a.MomId))
            }).ToListAsync(ct);

        var result = rows.Select(r =>
        {
            var rate = r.Invited > 0 ? (double)r.Present / r.Invited * 100 : 0;
            return new AttendanceRow(r.Id, r.TitleAr, r.TitleEn, r.StartDateTimeUtc, r.Invited, r.Present, Math.Round(rate, 1));
        }).ToList();

        var totalInvited = result.Sum(r => r.TotalInvited);
        var totalPresent = result.Sum(r => r.TotalPresent);
        var overallRate = totalInvited > 0 ? (double)totalPresent / totalInvited * 100 : 0;
        return new MeetingAttendanceReport(result, Math.Round(overallRate, 1));
    }

    public async Task<TaskPerformanceReport> GetTaskPerformanceAsync(DateTime from, DateTime to, string? assignedToObjectId, CancellationToken ct)
    {
        // Filter tasks by the meeting date range (via Mom -> Meeting)
        var momIdsInRange = await db.Moms.AsNoTracking()
            .Where(m => db.Meetings.Any(mt => mt.Id == m.MeetingId && mt.StartDateTimeUtc >= from && mt.StartDateTimeUtc <= to))
            .Select(m => m.Id)
            .ToListAsync(ct);

        var q = db.RecommendationTasks.AsNoTracking()
            .Where(t => momIdsInRange.Contains(t.MomId));

        if (!string.IsNullOrWhiteSpace(assignedToObjectId))
            q = q.Where(t => t.AssignedToObjectId == assignedToObjectId);

        var grouped = await q
            .GroupBy(t => new { t.AssignedToObjectId, t.AssignedToDisplayName })
            .Select(g => new
            {
                g.Key.AssignedToDisplayName,
                TotalTasks = g.Count(),
                Completed = g.Count(t => t.Status == TaskItemStatus.Completed),
                Overdue = g.Count(t => t.Status == TaskItemStatus.Overdue),
            })
            .ToListAsync(ct);

        var rows = grouped.Select(g => new TaskPerformanceRow(
            g.AssignedToDisplayName ?? "Unassigned",
            g.TotalTasks, g.Completed, g.Overdue,
            g.TotalTasks > 0 ? Math.Round((double)g.Completed / g.TotalTasks * 100, 1) : 0
        )).ToList();

        var totalTasks = rows.Sum(r => r.TotalTasks);
        var totalCompleted = rows.Sum(r => r.Completed);
        var totalOverdue = rows.Sum(r => r.Overdue);
        var overallRate = totalTasks > 0 ? Math.Round((double)totalCompleted / totalTasks * 100, 1) : 0;

        return new TaskPerformanceReport(rows, overallRate, totalOverdue);
    }

    public async Task<byte[]> ExportExcelAsync(ReportType type, DateTime from, DateTime to, Guid? committeeId, string? assignedToObjectId, CancellationToken ct)
    {
        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet(type.ToString());
        int row = 1;

        switch (type)
        {
            case ReportType.CommitteeActivity:
            {
                var report = await GetCommitteeActivityAsync(from, to, committeeId, ct);
                ws.Cell(row, 1).Value = "Committee (AR)";
                ws.Cell(row, 2).Value = "Committee (EN)";
                ws.Cell(row, 3).Value = "Meetings";
                ws.Cell(row, 4).Value = "Decisions";
                ws.Cell(row, 5).Value = "Tasks Completed";
                row++;
                foreach (var r in report.Rows)
                {
                    ws.Cell(row, 1).Value = r.NameAr;
                    ws.Cell(row, 2).Value = r.NameEn;
                    ws.Cell(row, 3).Value = r.MeetingsCount;
                    ws.Cell(row, 4).Value = r.DecisionsCount;
                    ws.Cell(row, 5).Value = r.TasksCompletedCount;
                    row++;
                }
                break;
            }
            case ReportType.MeetingAttendance:
            {
                var report = await GetMeetingAttendanceAsync(from, to, committeeId, ct);
                ws.Cell(row, 1).Value = "Meeting (AR)";
                ws.Cell(row, 2).Value = "Meeting (EN)";
                ws.Cell(row, 3).Value = "Date";
                ws.Cell(row, 4).Value = "Invited";
                ws.Cell(row, 5).Value = "Present";
                ws.Cell(row, 6).Value = "Attendance %";
                row++;
                foreach (var r in report.Rows)
                {
                    ws.Cell(row, 1).Value = r.TitleAr;
                    ws.Cell(row, 2).Value = r.TitleEn;
                    ws.Cell(row, 3).Value = r.StartDateTimeUtc.ToString("yyyy-MM-dd");
                    ws.Cell(row, 4).Value = r.TotalInvited;
                    ws.Cell(row, 5).Value = r.TotalPresent;
                    ws.Cell(row, 6).Value = r.AttendanceRate;
                    row++;
                }
                break;
            }
            case ReportType.TaskPerformance:
            {
                var report = await GetTaskPerformanceAsync(from, to, assignedToObjectId, ct);
                ws.Cell(row, 1).Value = "Assigned To";
                ws.Cell(row, 2).Value = "Total Tasks";
                ws.Cell(row, 3).Value = "Completed";
                ws.Cell(row, 4).Value = "Overdue";
                ws.Cell(row, 5).Value = "Completion %";
                row++;
                foreach (var r in report.Rows)
                {
                    ws.Cell(row, 1).Value = r.AssignedToDisplayName;
                    ws.Cell(row, 2).Value = r.TotalTasks;
                    ws.Cell(row, 3).Value = r.Completed;
                    ws.Cell(row, 4).Value = r.Overdue;
                    ws.Cell(row, 5).Value = r.CompletionRate;
                    row++;
                }
                break;
            }
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }
}
