using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class TaskService(AppDbContext db) : ITaskService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, TaskItemStatus? status, string? assignedToObjectId)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.RecommendationTasks.AsNoTracking();
        if (status.HasValue) q = q.Where(t => t.Status == status.Value);
        if (!string.IsNullOrWhiteSpace(assignedToObjectId)) q = q.Where(t => t.AssignedToObjectId == assignedToObjectId);

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
                t.DueDateUtc,
                t.Priority,
                t.Status,
                t.Progress,
            })
            .ToListAsync();

        return (total, items.Cast<object>().ToList());
    }

    public async Task<RecommendationTask> GetAsync(Guid id)
    {
        var task = await db.RecommendationTasks
            .AsNoTracking()
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null)
            throw new NotFoundException(nameof(RecommendationTask), id);

        return task;
    }

    public async Task UpdateProgressAsync(Guid id, TaskItemStatus status, int progress)
    {
        var task = await db.RecommendationTasks.FirstOrDefaultAsync(t => t.Id == id);

        if (task is null)
            throw new NotFoundException(nameof(RecommendationTask), id);

        task.Status = status;
        task.Progress = Math.Clamp(progress, 0, 100);
        await db.SaveChangesAsync();
    }

    public async Task UpsertSubTasksAsync(Guid id, List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)> items)
    {
        var task = await db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (task is null)
            throw new NotFoundException(nameof(RecommendationTask), id);

        db.Set<SubTask>().RemoveRange(task.SubTasks);
        foreach (var s in items)
        {
            db.Set<SubTask>().Add(new SubTask
            {
                RecommendationTaskId = task.Id,
                Title = s.Title.Trim(),
                DueDateUtc = s.DueDateUtc,
                Status = s.Status,
                Progress = Math.Clamp(s.Progress, 0, 100),
            });
        }

        // Auto-calculate parent progress from subtasks
        if (items.Count > 0)
        {
            task.Progress = (int)Math.Round(items.Average(s => Math.Clamp(s.Progress, 0, 100)));
        }

        await db.SaveChangesAsync();
    }

    public async Task UpdateSubTaskProgressAsync(Guid taskId, Guid subtaskId, TaskItemStatus status, int progress)
    {
        var task = await db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task is null)
            throw new NotFoundException(nameof(RecommendationTask), taskId);

        var subtask = task.SubTasks.FirstOrDefault(s => s.Id == subtaskId)
            ?? throw new NotFoundException(nameof(SubTask), subtaskId);

        subtask.Status = status;
        subtask.Progress = Math.Clamp(progress, 0, 100);

        // Auto-calculate parent progress
        task.Progress = (int)Math.Round(task.SubTasks.Average(st => st.Progress));

        if (task.SubTasks.All(st => st.Status == TaskItemStatus.Completed))
        {
            task.Status = TaskItemStatus.Completed;
            task.Progress = 100;
        }
        else if (task.SubTasks.Any(st => st.Status is TaskItemStatus.InProgress or TaskItemStatus.Completed))
        {
            task.Status = TaskItemStatus.InProgress;
        }

        await db.SaveChangesAsync();
    }
}
