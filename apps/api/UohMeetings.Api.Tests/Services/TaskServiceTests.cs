using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Tests.Services;

public sealed class TaskServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly TaskService _sut;

    public TaskServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new TaskService(_db);
    }

    public void Dispose() => _db.Dispose();

    private RecommendationTask CreateSeedTask(
        TaskItemStatus status = TaskItemStatus.Pending,
        string assignedTo = "user-1",
        int progress = 0)
    {
        var task = new RecommendationTask
        {
            MomId = Guid.NewGuid(),
            CommitteeId = Guid.NewGuid(),
            TitleAr = "مهمة",
            TitleEn = "Task",
            AssignedToObjectId = assignedTo,
            DueDateUtc = DateTime.UtcNow.AddDays(7),
            Priority = Priority.Medium,
            Status = status,
            Progress = progress,
        };
        _db.RecommendationTasks.Add(task);
        _db.SaveChanges();
        return task;
    }

    // ────────────────────────────── GetAsync ──────────────────────────────

    [Fact]
    public async Task GetAsync_ExistingId_ReturnsTaskWithSubTasks()
    {
        var task = CreateSeedTask();
        _db.SubTasks.Add(new SubTask
        {
            RecommendationTaskId = task.Id,
            Title = "Sub 1",
            Status = TaskItemStatus.Pending,
        });
        await _db.SaveChangesAsync();

        var result = await _sut.GetAsync(task.Id);

        Assert.Equal(task.Id, result.Id);
        Assert.Single(result.SubTasks);
        Assert.Equal("Sub 1", result.SubTasks[0].Title);
    }

    [Fact]
    public async Task GetAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetAsync(Guid.NewGuid()));
    }

    // ────────────────────────────── ListAsync ──────────────────────────────

    [Fact]
    public async Task ListAsync_NoFilter_ReturnsAllTasks()
    {
        CreateSeedTask(assignedTo: "user-1");
        CreateSeedTask(assignedTo: "user-2");

        var (total, items) = await _sut.ListAsync(1, 20, null, null);

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_WithStatusFilter_ReturnsFilteredTasks()
    {
        CreateSeedTask(status: TaskItemStatus.Pending);
        CreateSeedTask(status: TaskItemStatus.InProgress);
        CreateSeedTask(status: TaskItemStatus.Completed);

        var (total, items) = await _sut.ListAsync(1, 20, TaskItemStatus.Pending, null);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    [Fact]
    public async Task ListAsync_WithAssigneeFilter_ReturnsFilteredTasks()
    {
        CreateSeedTask(assignedTo: "user-1");
        CreateSeedTask(assignedTo: "user-1");
        CreateSeedTask(assignedTo: "user-2");

        var (total, items) = await _sut.ListAsync(1, 20, null, "user-1");

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_WithBothFilters_ReturnsCorrectResult()
    {
        CreateSeedTask(status: TaskItemStatus.Pending, assignedTo: "user-1");
        CreateSeedTask(status: TaskItemStatus.InProgress, assignedTo: "user-1");
        CreateSeedTask(status: TaskItemStatus.Pending, assignedTo: "user-2");

        var (total, items) = await _sut.ListAsync(1, 20, TaskItemStatus.Pending, "user-1");

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    [Fact]
    public async Task ListAsync_Pagination_ReturnsCorrectPage()
    {
        for (var i = 0; i < 5; i++)
        {
            CreateSeedTask(assignedTo: $"user-{i}");
        }

        var (total, items) = await _sut.ListAsync(2, 2, null, null);

        Assert.Equal(5, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_NegativePage_DefaultsToPageOne()
    {
        CreateSeedTask();

        var (total, items) = await _sut.ListAsync(-5, 10, null, null);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    [Fact]
    public async Task ListAsync_PageSizeClamped_RespectsMaxOf100()
    {
        CreateSeedTask();

        var (total, items) = await _sut.ListAsync(1, 999, null, null);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    // ────────────────────────────── UpdateProgressAsync ──────────────────────────────

    [Fact]
    public async Task UpdateProgressAsync_ValidInput_UpdatesStatusAndProgress()
    {
        var task = CreateSeedTask();

        await _sut.UpdateProgressAsync(task.Id, TaskItemStatus.InProgress, 50);

        var updated = await _db.RecommendationTasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal(TaskItemStatus.InProgress, updated.Status);
        Assert.Equal(50, updated.Progress);
    }

    [Fact]
    public async Task UpdateProgressAsync_ProgressOver100_ClampedTo100()
    {
        var task = CreateSeedTask();

        await _sut.UpdateProgressAsync(task.Id, TaskItemStatus.InProgress, 150);

        var updated = await _db.RecommendationTasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal(100, updated.Progress);
    }

    [Fact]
    public async Task UpdateProgressAsync_NegativeProgress_ClampedToZero()
    {
        var task = CreateSeedTask();

        await _sut.UpdateProgressAsync(task.Id, TaskItemStatus.InProgress, -10);

        var updated = await _db.RecommendationTasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal(0, updated.Progress);
    }

    [Fact]
    public async Task UpdateProgressAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.UpdateProgressAsync(Guid.NewGuid(), TaskItemStatus.InProgress, 50));
    }

    [Theory]
    [InlineData(TaskItemStatus.Pending)]
    [InlineData(TaskItemStatus.InProgress)]
    [InlineData(TaskItemStatus.Completed)]
    [InlineData(TaskItemStatus.Overdue)]
    [InlineData(TaskItemStatus.Cancelled)]
    public async Task UpdateProgressAsync_AllStatuses_UpdatesCorrectly(TaskItemStatus newStatus)
    {
        var task = CreateSeedTask();

        await _sut.UpdateProgressAsync(task.Id, newStatus, 75);

        var updated = await _db.RecommendationTasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal(newStatus, updated.Status);
    }

    [Fact]
    public async Task UpdateProgressAsync_CompletedStatus_Sets100Percent()
    {
        var task = CreateSeedTask();

        await _sut.UpdateProgressAsync(task.Id, TaskItemStatus.Completed, 100);

        var updated = await _db.RecommendationTasks.FindAsync(task.Id);
        Assert.NotNull(updated);
        Assert.Equal(TaskItemStatus.Completed, updated.Status);
        Assert.Equal(100, updated.Progress);
    }

    // ────────────────────────────── UpsertSubTasksAsync ──────────────────────────────

    [Fact]
    public async Task UpsertSubTasksAsync_ValidItems_ReplacesSubTasks()
    {
        var task = CreateSeedTask();
        _db.SubTasks.Add(new SubTask
        {
            RecommendationTaskId = task.Id,
            Title = "Old SubTask",
        });
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var newSubTasks = new List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)>
        {
            ("Sub 1", DateTime.UtcNow.AddDays(3), TaskItemStatus.Pending, 0),
            ("Sub 2", DateTime.UtcNow.AddDays(5), TaskItemStatus.InProgress, 50),
        };

        await _sut.UpsertSubTasksAsync(task.Id, newSubTasks);

        _db.ChangeTracker.Clear();
        var updated = await _db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstAsync(t => t.Id == task.Id);
        Assert.Equal(2, updated.SubTasks.Count);
        Assert.Contains(updated.SubTasks, s => s.Title == "Sub 1");
        Assert.Contains(updated.SubTasks, s => s.Title == "Sub 2");
    }

    [Fact]
    public async Task UpsertSubTasksAsync_EmptyList_ClearsSubTasks()
    {
        var task = CreateSeedTask();
        _db.SubTasks.Add(new SubTask
        {
            RecommendationTaskId = task.Id,
            Title = "Existing",
        });
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await _sut.UpsertSubTasksAsync(task.Id, new List<(string, DateTime?, TaskItemStatus, int)>());

        var updated = await _db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstAsync(t => t.Id == task.Id);
        Assert.Empty(updated.SubTasks);
    }

    [Fact]
    public async Task UpsertSubTasksAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.UpsertSubTasksAsync(Guid.NewGuid(),
                new List<(string, DateTime?, TaskItemStatus, int)> { ("Test", null, TaskItemStatus.Pending, 0) }));
    }

    [Fact]
    public async Task UpsertSubTasksAsync_TrimsWhitespace_ReturnsCleanTitles()
    {
        var task = CreateSeedTask();
        _db.ChangeTracker.Clear();

        var subTasks = new List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)>
        {
            ("  Sub 1  ", null, TaskItemStatus.Pending, 0),
        };

        await _sut.UpsertSubTasksAsync(task.Id, subTasks);

        _db.ChangeTracker.Clear();
        var updated = await _db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstAsync(t => t.Id == task.Id);
        Assert.Equal("Sub 1", updated.SubTasks[0].Title);
    }

    [Fact]
    public async Task UpsertSubTasksAsync_NullDueDate_AllowedAndPersisted()
    {
        var task = CreateSeedTask();
        _db.ChangeTracker.Clear();

        var subTasks = new List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)>
        {
            ("Sub No Date", null, TaskItemStatus.Pending, 0),
        };

        await _sut.UpsertSubTasksAsync(task.Id, subTasks);

        _db.ChangeTracker.Clear();
        var updated = await _db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstAsync(t => t.Id == task.Id);
        Assert.Null(updated.SubTasks[0].DueDateUtc);
    }

    [Fact]
    public async Task UpsertSubTasksAsync_WithDueDate_PersistsCorrectly()
    {
        var task = CreateSeedTask();
        _db.ChangeTracker.Clear();
        var dueDate = new DateTime(2026, 6, 15, 12, 0, 0, DateTimeKind.Utc);

        var subTasks = new List<(string Title, DateTime? DueDateUtc, TaskItemStatus Status, int Progress)>
        {
            ("Sub With Date", dueDate, TaskItemStatus.Pending, 0),
        };

        await _sut.UpsertSubTasksAsync(task.Id, subTasks);

        _db.ChangeTracker.Clear();
        var updated = await _db.RecommendationTasks
            .Include(t => t.SubTasks)
            .FirstAsync(t => t.Id == task.Id);
        Assert.Equal(dueDate, updated.SubTasks[0].DueDateUtc);
    }
}
