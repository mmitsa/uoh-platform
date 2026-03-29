using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/tasks")]
[Authorize]
public sealed class TasksController(AppDbContext db) : ControllerBase
{
    private string ObjectId => User.FindFirstValue("http://schemas.microsoft.com/identity/claims/objectidentifier") ?? "";

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] TaskItemStatus? status = null,
        [FromQuery] string? assignedToObjectId = null,
        [FromQuery] Guid? committeeId = null,
        [FromQuery] Priority? priority = null,
        [FromQuery] string? scope = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.RecommendationTasks.AsNoTracking();

        // Role-based scoping: "mine" returns only tasks assigned to the current user
        if (string.Equals(scope, "mine", StringComparison.OrdinalIgnoreCase))
            q = q.Where(t => t.AssignedToObjectId == ObjectId);

        if (status.HasValue) q = q.Where(t => t.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(assignedToObjectId)) q = q.Where(t => t.AssignedToObjectId == assignedToObjectId);
        if (committeeId.HasValue) q = q.Where(t => t.CommitteeId == committeeId.Value);
        if (priority.HasValue) q = q.Where(t => t.Priority == priority.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderBy(t => t.DueDateUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id,
                t.TitleAr,
                t.TitleEn,
                t.AssignedToObjectId,
                t.AssignedToDisplayName,
                t.AssignedToEmail,
                t.DueDateUtc,
                t.Priority,
                t.Status,
                t.Progress,
                t.Category,
                t.Beneficiary,
                t.CommitteeId,
                SubTaskCount = t.SubTasks.Count,
            })
            .ToListAsync();

        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var task = await db.RecommendationTasks
            .AsNoTracking()
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == id);
        return task is null ? NotFound() : Ok(task);
    }

    /// <summary>Get tasks assigned to the current user.</summary>
    [HttpGet("my")]
    public async Task<IActionResult> MyTasks([FromQuery] TaskItemStatus? status = null, CancellationToken ct = default)
    {
        var q = db.RecommendationTasks.AsNoTracking()
            .Where(t => t.AssignedToObjectId == ObjectId);

        if (status.HasValue) q = q.Where(t => t.Status == status.Value);

        var items = await q
            .OrderBy(t => t.DueDateUtc)
            .Select(t => new
            {
                t.Id, t.TitleAr, t.TitleEn, t.DueDateUtc, t.Priority, t.Status, t.Progress,
                t.Category, t.Beneficiary, SubTaskCount = t.SubTasks.Count,
            })
            .ToListAsync(ct);

        return Ok(items);
    }

    public sealed record UpdateTaskProgressRequest(TaskItemStatus Status, int Progress);

    [HttpPut("{id:guid}/progress")]
    public async Task<IActionResult> UpdateProgress(Guid id, [FromBody] UpdateTaskProgressRequest req)
    {
        var task = await db.RecommendationTasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        task.Status = req.Status;
        task.Progress = Math.Clamp(req.Progress, 0, 100);
        await db.SaveChangesAsync();
        return Ok();
    }

    public sealed record UpsertSubTaskRequest(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress = 0);

    [HttpPut("{id:guid}/subtasks")]
    public async Task<IActionResult> UpsertSubtasks(Guid id, [FromBody] List<UpsertSubTaskRequest> items)
    {
        var task = await db.RecommendationTasks.Include(t => t.SubTasks).FirstOrDefaultAsync(t => t.Id == id);
        if (task is null) return NotFound();

        task.SubTasks.Clear();
        foreach (var s in items)
        {
            task.SubTasks.Add(new SubTask
            {
                RecommendationTaskId = task.Id,
                Title = s.Title.Trim(),
                DueDateUtc = s.DueDateUtc,
                Status = s.Status,
                Progress = Math.Clamp(s.Progress, 0, 100),
            });
        }

        // Auto-calculate parent task progress from subtasks
        if (task.SubTasks.Count > 0)
        {
            task.Progress = (int)Math.Round(task.SubTasks.Average(st => st.Progress));
            // Auto-update status based on subtask completion
            if (task.SubTasks.All(st => st.Status == TaskItemStatus.Completed))
                task.Status = TaskItemStatus.Completed;
            else if (task.SubTasks.Any(st => st.Status == TaskItemStatus.InProgress || st.Status == TaskItemStatus.Completed))
                task.Status = TaskItemStatus.InProgress;
        }

        await db.SaveChangesAsync();
        return Ok(new { task.Progress, task.Status });
    }

    public sealed record UpdateSubTaskProgressRequest(TaskItemStatus Status, int Progress);

    /// <summary>Update progress of a single subtask and auto-recalculate parent task progress.</summary>
    [HttpPut("{taskId:guid}/subtasks/{subtaskId:guid}/progress")]
    public async Task<IActionResult> UpdateSubtaskProgress(Guid taskId, Guid subtaskId, [FromBody] UpdateSubTaskProgressRequest req)
    {
        var task = await db.RecommendationTasks.Include(t => t.SubTasks).FirstOrDefaultAsync(t => t.Id == taskId);
        if (task is null) return NotFound();

        var subtask = task.SubTasks.FirstOrDefault(s => s.Id == subtaskId);
        if (subtask is null) return NotFound();

        subtask.Status = req.Status;
        subtask.Progress = Math.Clamp(req.Progress, 0, 100);

        // Auto-calculate parent progress
        task.Progress = (int)Math.Round(task.SubTasks.Average(st => st.Progress));

        // Auto-update parent status
        if (task.SubTasks.All(st => st.Status == TaskItemStatus.Completed))
        {
            task.Status = TaskItemStatus.Completed;
            task.Progress = 100;
        }
        else if (task.SubTasks.Any(st => st.Status == TaskItemStatus.InProgress || st.Status == TaskItemStatus.Completed))
        {
            task.Status = TaskItemStatus.InProgress;
        }

        await db.SaveChangesAsync();
        return Ok(new { TaskProgress = task.Progress, task.Status, SubtaskProgress = subtask.Progress, SubtaskStatus = subtask.Status });
    }

    /// <summary>Aggregated dashboard statistics for recommendation tasks.</summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(
        [FromQuery] Guid? committeeId = null,
        CancellationToken ct = default)
    {
        var q = db.RecommendationTasks.AsNoTracking();
        if (committeeId.HasValue)
            q = q.Where(t => t.CommitteeId == committeeId.Value);

        var all = await q.ToListAsync(ct);
        var now = DateTime.UtcNow;

        var statusBreakdown = new
        {
            pending = all.Count(t => t.Status == TaskItemStatus.Pending),
            inProgress = all.Count(t => t.Status == TaskItemStatus.InProgress),
            completed = all.Count(t => t.Status == TaskItemStatus.Completed),
            overdue = all.Count(t => t.Status == TaskItemStatus.Overdue
                || (t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled && t.DueDateUtc < now)),
        };

        var priorityBreakdown = new
        {
            low = all.Count(t => t.Priority == Priority.Low),
            medium = all.Count(t => t.Priority == Priority.Medium),
            high = all.Count(t => t.Priority == Priority.High),
            critical = all.Count(t => t.Priority == Priority.Critical),
        };

        var thirtyDaysAgo = now.AddDays(-30).Date;
        var completionTrend = Enumerable.Range(0, 30).Select(i =>
        {
            var date = thirtyDaysAgo.AddDays(i);
            return new
            {
                date = date.ToString("yyyy-MM-dd"),
                completedCount = all.Count(t => t.Status == TaskItemStatus.Completed && t.DueDateUtc.Date <= date),
            };
        }).ToList();

        var overdueByAssignee = all
            .Where(t => t.Status == TaskItemStatus.Overdue
                || (t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled && t.DueDateUtc < now))
            .GroupBy(t => t.AssignedToDisplayName ?? t.AssignedToObjectId)
            .Select(g => new { name = g.Key, count = g.Count() })
            .OrderByDescending(g => g.count)
            .Take(10)
            .ToList();

        var upcomingDeadlines = all
            .Where(t => t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled
                && t.DueDateUtc >= now && t.DueDateUtc <= now.AddDays(14))
            .OrderBy(t => t.DueDateUtc)
            .Take(10)
            .Select(t => new
            {
                t.Id,
                t.TitleAr, t.TitleEn,
                dueDate = t.DueDateUtc,
                t.Progress,
                assignee = t.AssignedToDisplayName,
                priority = t.Priority.ToString(),
            })
            .ToList();

        var averageProgress = all.Count > 0 ? (int)Math.Round(all.Average(t => (double)t.Progress)) : 0;

        return Ok(new
        {
            totalTasks = all.Count,
            averageProgress,
            statusBreakdown,
            priorityBreakdown,
            completionTrend,
            overdueByAssignee,
            upcomingDeadlines,
        });
    }
}

