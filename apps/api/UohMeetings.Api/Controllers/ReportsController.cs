using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

/// <summary>Analytical reports with export.</summary>
[ApiController]
[Route("api/v1/reports")]
[Authorize]
public sealed class ReportsController(IReportService reportService, AppDbContext db) : ControllerBase
{
    /// <summary>Get KPI summary for a specific committee.</summary>
    [HttpGet("committee-kpis/{committeeId:guid}")]
    public async Task<IActionResult> CommitteeKpis(Guid committeeId, CancellationToken ct = default)
    {
        var committeeExists = await db.Committees.AnyAsync(c => c.Id == committeeId, ct);
        if (!committeeExists) return NotFound();

        var meetingIds = await db.Meetings
            .Where(m => m.CommitteeId == committeeId)
            .Select(m => m.Id)
            .ToListAsync(ct);
        var meetingsCount = meetingIds.Count;

        var momIds = await db.Moms
            .Where(m => meetingIds.Contains(m.MeetingId))
            .Select(m => m.Id)
            .ToListAsync(ct);
        var decisionsCount = await db.Decisions.CountAsync(d => momIds.Contains(d.MomId), ct);

        var tasksCompletedCount = await db.RecommendationTasks
            .CountAsync(t => t.CommitteeId == committeeId && t.Status == TaskItemStatus.Completed, ct);

        var attendanceRecords = await db.AttendanceRecords
            .Where(a => momIds.Contains(a.MomId))
            .ToListAsync(ct);
        var attendanceRate = attendanceRecords.Count > 0
            ? Math.Round(attendanceRecords.Count(a => a.AttendanceStatus == "present") * 100.0 / attendanceRecords.Count, 1)
            : 0;

        return Ok(new
        {
            meetingsCount,
            decisionsCount,
            tasksCompletedCount,
            attendanceRate,
        });
    }

    [HttpGet("committee-activity")]
    public async Task<IActionResult> CommitteeActivity(
        [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] Guid? committeeId = null, CancellationToken ct = default)
    {
        var report = await reportService.GetCommitteeActivityAsync(from, to, committeeId, ct);
        return Ok(report);
    }

    [HttpGet("meeting-attendance")]
    public async Task<IActionResult> MeetingAttendance(
        [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] Guid? committeeId = null, CancellationToken ct = default)
    {
        var report = await reportService.GetMeetingAttendanceAsync(from, to, committeeId, ct);
        return Ok(report);
    }

    [HttpGet("task-performance")]
    public async Task<IActionResult> TaskPerformance(
        [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] string? assignedToObjectId = null, CancellationToken ct = default)
    {
        var report = await reportService.GetTaskPerformanceAsync(from, to, assignedToObjectId, ct);
        return Ok(report);
    }

    [HttpGet("{type}/export/excel")]
    public async Task<IActionResult> ExportExcel(
        ReportType type,
        [FromQuery] DateTime from, [FromQuery] DateTime to,
        [FromQuery] Guid? committeeId = null,
        [FromQuery] string? assignedToObjectId = null,
        CancellationToken ct = default)
    {
        var bytes = await reportService.ExportExcelAsync(type, from, to, committeeId, assignedToObjectId, ct);
        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{type}_{from:yyyyMMdd}_{to:yyyyMMdd}.xlsx");
    }
}
