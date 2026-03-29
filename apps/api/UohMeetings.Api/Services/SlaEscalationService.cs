using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

/// <summary>
/// Periodically scans active workflow instances that have exceeded their SLA deadline
/// and sends escalation notifications to the pending actor and the committee head.
/// </summary>
public sealed class SlaEscalationService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<SlaEscalationService> logger) : BackgroundService
{
    /// <summary>
    /// How often the service checks for breached SLAs.
    /// Configurable via <c>Sla:CheckIntervalMinutes</c> (default 15).
    /// </summary>
    private TimeSpan CheckInterval =>
        TimeSpan.FromMinutes(configuration.GetValue("Sla:CheckIntervalMinutes", 15));

    /// <summary>
    /// Minimum hours between repeated escalation notifications for the same instance.
    /// Configurable via <c>Sla:ReEscalationCooldownHours</c> (default 24).
    /// </summary>
    private int ReEscalationCooldownHours =>
        configuration.GetValue("Sla:ReEscalationCooldownHours", 24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("SlaEscalationService started");

        // Small initial delay to let the application fully start
        await Task.Delay(TimeSpan.FromSeconds(45), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndEscalateAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in SLA escalation check cycle");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }

        logger.LogInformation("SlaEscalationService stopped");
    }

    private async Task CheckAndEscalateAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var now = DateTime.UtcNow;
        var cooldown = TimeSpan.FromHours(ReEscalationCooldownHours);

        // Find active workflow instances that:
        //  1. Have an SLA defined
        //  2. Have been sitting in the current state longer than their SLA allows
        //  3. Have not been escalated recently (cooldown window)
        var breachedInstances = await db.WorkflowInstances
            .Include(wi => wi.History)
            .Where(wi => wi.Status == WorkflowStatus.Active
                      && wi.SlaHoursUntilEscalation != null
                      && (wi.LastEscalatedAtUtc == null || wi.LastEscalatedAtUtc < now.Add(-cooldown)))
            .ToListAsync(ct);

        var escalatedCount = 0;

        foreach (var instance in breachedInstances)
        {
            // Determine when the instance entered its current state
            var lastTransition = instance.History
                .Where(h => h.ToState == instance.CurrentState)
                .OrderByDescending(h => h.OccurredAtUtc)
                .FirstOrDefault();

            var stateEnteredAtUtc = lastTransition?.OccurredAtUtc ?? instance.CreatedAtUtc;
            var deadline = stateEnteredAtUtc.AddHours(instance.SlaHoursUntilEscalation!.Value);

            if (now < deadline)
                continue; // SLA not yet breached

            var hoursOverdue = (int)Math.Ceiling((now - deadline).TotalHours);

            logger.LogWarning(
                "SLA breached for WorkflowInstance {InstanceId} (domain={Domain}, state={State}). " +
                "Overdue by {Hours}h. Entered state at {EnteredAt:u}, SLA={SlaHours}h",
                instance.Id, instance.Domain, instance.CurrentState, hoursOverdue,
                stateEnteredAtUtc, instance.SlaHoursUntilEscalation);

            await SendEscalationNotificationsAsync(
                db, notificationService, instance, hoursOverdue, ct);

            // Mark escalation timestamp
            instance.LastEscalatedAtUtc = now;
            escalatedCount++;
        }

        if (escalatedCount > 0)
        {
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Escalated {Count} workflow instances due to SLA breach", escalatedCount);
        }
    }

    /// <summary>
    /// Sends escalation notifications for a single workflow instance:
    ///   1. To the last actor / pending approver (the person who should have acted).
    ///   2. To the committee head as the escalation recipient.
    /// </summary>
    private async Task SendEscalationNotificationsAsync(
        AppDbContext db,
        INotificationService notificationService,
        WorkflowInstance instance,
        int hoursOverdue,
        CancellationToken ct)
    {
        // Identify the last actor — i.e. the person who triggered the most recent transition.
        // The *next* actor (the one who should approve) is not explicitly stored, so we
        // notify the last known actor and the committee head for escalation.
        var lastActorHistory = instance.History
            .Where(h => h.ActorObjectId != null)
            .OrderByDescending(h => h.OccurredAtUtc)
            .FirstOrDefault();

        // --- 1. Notify the pending actor (last actor who moved the workflow) ---
        if (lastActorHistory?.ActorObjectId is not null)
        {
            var actor = await db.AppUsers
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.ObjectId == lastActorHistory.ActorObjectId, ct);

            if (actor is not null)
            {
                await notificationService.NotifyAsync(new NotificationPayload(
                    RecipientObjectId: actor.ObjectId,
                    RecipientEmail: actor.Email,
                    Type: "sla_breach",
                    TitleAr: "تنبيه: تجاوز وقت الاستجابة المحدد",
                    TitleEn: "Alert: SLA Response Time Exceeded",
                    BodyAr: $"سير العمل في الحالة \"{instance.CurrentState}\" تجاوز الوقت المحدد بـ {hoursOverdue} ساعة. يرجى اتخاذ إجراء.",
                    BodyEn: $"The workflow in state \"{instance.CurrentState}\" is overdue by {hoursOverdue} hour(s). Please take action.",
                    EntityType: "WorkflowInstance",
                    EntityId: instance.Id,
                    ActionUrl: $"/workflows/{instance.Id}"
                ), ct);
            }
        }

        // --- 2. Escalate to the committee head ---
        // Resolve the committee via the EntityId on the workflow instance.
        // The workflow's Domain tells us the context; the EntityId links to the entity
        // (which may be the committee itself, or a related entity within a committee).
        var committeeHead = await FindCommitteeHeadAsync(db, instance, ct);

        if (committeeHead is not null)
        {
            // Avoid sending the same person two notifications
            if (lastActorHistory?.ActorObjectId == committeeHead.UserObjectId)
                return;

            await notificationService.NotifyAsync(new NotificationPayload(
                RecipientObjectId: committeeHead.UserObjectId,
                RecipientEmail: committeeHead.Email,
                Type: "sla_escalation",
                TitleAr: "تصعيد: تأخر في سير العمل",
                TitleEn: "Escalation: Workflow SLA Breached",
                BodyAr: $"سير العمل (المعرّف: {instance.Id:N}) في الحالة \"{instance.CurrentState}\" تجاوز الحد الأقصى بـ {hoursOverdue} ساعة ويحتاج إلى تدخل.",
                BodyEn: $"Workflow (ID: {instance.Id:N}) in state \"{instance.CurrentState}\" is overdue by {hoursOverdue} hour(s) and requires attention.",
                EntityType: "WorkflowInstance",
                EntityId: instance.Id,
                ActionUrl: $"/workflows/{instance.Id}"
            ), ct);
        }
        else
        {
            logger.LogWarning(
                "Could not determine committee head for escalation on WorkflowInstance {InstanceId} (EntityId={EntityId})",
                instance.Id, instance.EntityId);
        }
    }

    /// <summary>
    /// Attempts to locate the committee head for the entity linked to the workflow instance.
    /// First checks if <see cref="WorkflowInstance.EntityId"/> is a Committee directly,
    /// then falls back to checking if it belongs to a Meeting or other entity tied to a Committee.
    /// </summary>
    private static async Task<CommitteeMember?> FindCommitteeHeadAsync(
        AppDbContext db, WorkflowInstance instance, CancellationToken ct)
    {
        // Try direct match: EntityId is a Committee ID
        var head = await db.CommitteeMembers
            .AsNoTracking()
            .Where(cm => cm.CommitteeId == instance.EntityId
                      && cm.Role == "head"
                      && cm.IsActive)
            .FirstOrDefaultAsync(ct);

        if (head is not null) return head;

        // Fallback: EntityId might be a Meeting linked to a Committee
        var meeting = await db.Meetings
            .AsNoTracking()
            .Where(m => m.Id == instance.EntityId)
            .Select(m => new { m.CommitteeId })
            .FirstOrDefaultAsync(ct);

        if (meeting?.CommitteeId is not null)
        {
            head = await db.CommitteeMembers
                .AsNoTracking()
                .Where(cm => cm.CommitteeId == meeting.CommitteeId
                          && cm.Role == "head"
                          && cm.IsActive)
                .FirstOrDefaultAsync(ct);
        }

        return head;
    }
}
