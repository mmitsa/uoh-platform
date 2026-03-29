using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public interface ITaskService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, TaskItemStatus? status, string? assignedToObjectId);
    Task<RecommendationTask> GetAsync(Guid id);
    Task UpdateProgressAsync(Guid id, TaskItemStatus status, int progress);
    Task UpsertSubTasksAsync(Guid id, List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)> items);
    Task UpdateSubTaskProgressAsync(Guid taskId, Guid subtaskId, TaskItemStatus status, int progress);
}
