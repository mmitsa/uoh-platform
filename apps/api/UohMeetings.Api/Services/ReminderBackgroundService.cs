using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

/// <summary>
/// Periodically checks for upcoming meetings and overdue/approaching-deadline tasks,
/// then sends reminder notifications via <see cref="INotificationService"/>.
/// </summary>
public sealed class ReminderBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<ReminderBackgroundService> logger) : BackgroundService
{
    // Check every 15 minutes
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(15);

    // Thresholds for task reminders (hours before due date)
    private static readonly int[] TaskReminderHours = [24, 48];

    // Thresholds for meeting reminders (hours before start)
    private static readonly int[] MeetingReminderHours = [1, 24];

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ReminderBackgroundService started");

        // Small initial delay to let the application fully start
        await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndSendRemindersAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in reminder check cycle");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }

        logger.LogInformation("ReminderBackgroundService stopped");
    }

    private async Task CheckAndSendRemindersAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var now = DateTime.UtcNow;

        await CheckOverdueTasksAsync(db, notificationService, now, ct);
        await CheckUpcomingTaskDeadlinesAsync(db, notificationService, now, ct);
        await CheckUpcomingMeetingsAsync(db, notificationService, now, ct);
    }

    /// <summary>Notify assignees of tasks that have passed their due date without completion.</summary>
    private async Task CheckOverdueTasksAsync(
        AppDbContext db, INotificationService notificationService, DateTime now, CancellationToken ct)
    {
        var overdueTasks = await db.RecommendationTasks
            .AsNoTracking()
            .Where(t => t.DueDateUtc < now
                     && t.Status != TaskItemStatus.Completed
                     && t.Status != TaskItemStatus.Cancelled)
            .ToListAsync(ct);

        foreach (var task in overdueTasks)
        {
            // Avoid spamming: only send one overdue notification per task per day.
            // We check if a notification with this entityId + type was already sent today.
            var alreadySentToday = await db.Notifications
                .AnyAsync(n => n.EntityId == task.Id
                            && n.Type == "task_overdue"
                            && n.CreatedAtUtc.Date == now.Date, ct);

            if (alreadySentToday) continue;

            await notificationService.NotifyAsync(new NotificationPayload(
                RecipientObjectId: task.AssignedToObjectId,
                RecipientEmail: task.AssignedToEmail,
                Type: "task_overdue",
                TitleAr: $"⚠️ المهمة متأخرة: {task.TitleAr}",
                TitleEn: $"⚠️ Task Overdue: {task.TitleEn}",
                BodyAr: $"المهمة \"{task.TitleAr}\" تجاوزت تاريخ الاستحقاق. يرجى تحديث الحالة.",
                BodyEn: $"Task \"{task.TitleEn}\" has passed its due date. Please update the status.",
                EntityType: "RecommendationTask",
                EntityId: task.Id,
                ActionUrl: $"/tasks?id={task.Id}"
            ), ct);
        }

        if (overdueTasks.Count > 0)
            logger.LogInformation("Sent overdue reminders for {Count} tasks", overdueTasks.Count);
    }

    /// <summary>Notify assignees of tasks approaching their due date.</summary>
    private async Task CheckUpcomingTaskDeadlinesAsync(
        AppDbContext db, INotificationService notificationService, DateTime now, CancellationToken ct)
    {
        foreach (var hours in TaskReminderHours)
        {
            var windowStart = now;
            var windowEnd = now.AddHours(hours);

            var upcomingTasks = await db.RecommendationTasks
                .AsNoTracking()
                .Where(t => t.DueDateUtc > windowStart
                         && t.DueDateUtc <= windowEnd
                         && t.Status != TaskItemStatus.Completed
                         && t.Status != TaskItemStatus.Cancelled)
                .ToListAsync(ct);

            foreach (var task in upcomingTasks)
            {
                var notificationType = $"task_reminder_{hours}h";

                var alreadySent = await db.Notifications
                    .AnyAsync(n => n.EntityId == task.Id
                                && n.Type == notificationType, ct);

                if (alreadySent) continue;

                var hoursLeft = (int)Math.Ceiling((task.DueDateUtc - now).TotalHours);
                var timeLabel = hoursLeft <= 1 ? "ساعة" : hoursLeft <= 10 ? $"{hoursLeft} ساعات" : $"{hoursLeft} ساعة";
                var timeLabelEn = hoursLeft == 1 ? "1 hour" : $"{hoursLeft} hours";

                await notificationService.NotifyAsync(new NotificationPayload(
                    RecipientObjectId: task.AssignedToObjectId,
                    RecipientEmail: task.AssignedToEmail,
                    Type: notificationType,
                    TitleAr: $"⏰ تذكير: {task.TitleAr}",
                    TitleEn: $"⏰ Reminder: {task.TitleEn}",
                    BodyAr: $"المهمة \"{task.TitleAr}\" مستحقة خلال {timeLabel}.",
                    BodyEn: $"Task \"{task.TitleEn}\" is due in {timeLabelEn}.",
                    EntityType: "RecommendationTask",
                    EntityId: task.Id,
                    ActionUrl: $"/tasks?id={task.Id}"
                ), ct);
            }
        }
    }

    /// <summary>Notify invitees of upcoming meetings.</summary>
    private async Task CheckUpcomingMeetingsAsync(
        AppDbContext db, INotificationService notificationService, DateTime now, CancellationToken ct)
    {
        foreach (var hours in MeetingReminderHours)
        {
            var windowStart = now;
            var windowEnd = now.AddHours(hours);

            var upcomingMeetings = await db.Meetings
                .AsNoTracking()
                .Include(m => m.Invitees)
                .Where(m => m.StartDateTimeUtc > windowStart
                         && m.StartDateTimeUtc <= windowEnd
                         && m.Status != MeetingStatus.Cancelled)
                .ToListAsync(ct);

            foreach (var meeting in upcomingMeetings)
            {
                var notificationType = $"meeting_reminder_{hours}h";

                foreach (var invitee in meeting.Invitees)
                {
                    // Resolve user ObjectId from email via AppUser table
                    var user = await db.AppUsers
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.Email == invitee.Email, ct);

                    var recipientOid = user?.ObjectId ?? invitee.Email;

                    var alreadySent = await db.Notifications
                        .AnyAsync(n => n.EntityId == meeting.Id
                                    && n.Type == notificationType
                                    && n.RecipientObjectId == recipientOid, ct);

                    if (alreadySent) continue;

                    var hoursLeft = (int)Math.Ceiling((meeting.StartDateTimeUtc - now).TotalHours);
                    string timeAr, timeEn;
                    if (hoursLeft <= 1)
                    {
                        timeAr = "أقل من ساعة";
                        timeEn = "less than 1 hour";
                    }
                    else
                    {
                        timeAr = hoursLeft <= 10 ? $"{hoursLeft} ساعات" : $"{hoursLeft} ساعة";
                        timeEn = $"{hoursLeft} hours";
                    }

                    await notificationService.NotifyAsync(new NotificationPayload(
                        RecipientObjectId: recipientOid,
                        RecipientEmail: invitee.Email,
                        Type: notificationType,
                        TitleAr: $"📅 تذكير باجتماع: {meeting.TitleAr}",
                        TitleEn: $"📅 Meeting Reminder: {meeting.TitleEn}",
                        BodyAr: $"الاجتماع \"{meeting.TitleAr}\" سيبدأ خلال {timeAr}.",
                        BodyEn: $"Meeting \"{meeting.TitleEn}\" starts in {timeEn}.",
                        EntityType: "Meeting",
                        EntityId: meeting.Id,
                        ActionUrl: $"/meetings/{meeting.Id}"
                    ), ct);
                }

                // Also notify committee members (dedup against invitees)
                if (meeting.CommitteeId.HasValue)
                {
                    var inviteeEmails = meeting.Invitees.Select(i => i.Email).ToHashSet(StringComparer.OrdinalIgnoreCase);
                    var members = await db.CommitteeMembers.AsNoTracking()
                        .Where(cm => cm.CommitteeId == meeting.CommitteeId && cm.IsActive)
                        .ToListAsync(ct);

                    var hoursLeft2 = (int)Math.Ceiling((meeting.StartDateTimeUtc - now).TotalHours);
                    string timeAr2, timeEn2;
                    if (hoursLeft2 <= 1) { timeAr2 = "أقل من ساعة"; timeEn2 = "less than 1 hour"; }
                    else { timeAr2 = hoursLeft2 <= 10 ? $"{hoursLeft2} ساعات" : $"{hoursLeft2} ساعة"; timeEn2 = $"{hoursLeft2} hours"; }

                    foreach (var member in members.Where(m => !inviteeEmails.Contains(m.Email)))
                    {
                        var alreadySentMember = await db.Notifications
                            .AnyAsync(n => n.EntityId == meeting.Id
                                        && n.Type == notificationType
                                        && n.RecipientObjectId == member.UserObjectId, ct);
                        if (alreadySentMember) continue;

                        await notificationService.NotifyAsync(new NotificationPayload(
                            RecipientObjectId: member.UserObjectId,
                            RecipientEmail: member.Email,
                            Type: notificationType,
                            TitleAr: $"📅 تذكير باجتماع: {meeting.TitleAr}",
                            TitleEn: $"📅 Meeting Reminder: {meeting.TitleEn}",
                            BodyAr: $"الاجتماع \"{meeting.TitleAr}\" سيبدأ خلال {timeAr2}.",
                            BodyEn: $"Meeting \"{meeting.TitleEn}\" starts in {timeEn2}.",
                            EntityType: "Meeting",
                            EntityId: meeting.Id,
                            ActionUrl: $"/meetings/{meeting.Id}"
                        ), ct);
                    }
                }
            }
        }
    }
}
