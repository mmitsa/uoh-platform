using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class DashboardLayoutService(
    AppDbContext db,
    IPermissionService permissionService) : IDashboardLayoutService
{
    private static readonly Dictionary<string, string[]> DefaultLayouts = new()
    {
        ["SystemAdmin"] = [
            "stat-committees", "stat-meetings", "stat-tasks", "stat-surveys",
            "stat-live-meetings", "stat-upcoming-count",
            "chart-meetings-monthly", "chart-task-status", "chart-committee-types",
            "chart-task-priority", "assignee-workload",
            "upcoming-meetings", "recent-activity", "attendance-rate", "completion-rate",
            "university-rankings", "task-overview"
        ],
        ["CommitteeHead"] = [
            "stat-committees", "stat-meetings", "stat-live-meetings", "stat-upcoming-count",
            "upcoming-meetings", "chart-meetings-monthly",
            "attendance-rate", "recent-activity",
            "chart-task-priority", "assignee-workload"
        ],
        ["CommitteeSecretary"] = [
            "stat-meetings", "stat-tasks", "stat-live-meetings", "stat-upcoming-count",
            "upcoming-meetings", "task-overview", "recent-activity",
            "chart-task-priority", "assignee-workload"
        ],
        ["CommitteeMember"] = [
            "upcoming-meetings", "stat-tasks",
            "recent-activity", "attendance-rate",
            "chart-task-priority"
        ],
        ["Observer"] = [
            "stat-committees", "stat-meetings",
            "chart-committee-types", "upcoming-meetings"
        ],
    };

    public async Task<List<DashboardWidgetDto>> GetAvailableWidgetsAsync(string userObjectId, CancellationToken ct = default)
    {
        var userPermissions = await permissionService.GetPermissionsForUserAsync(userObjectId, ct);

        var widgets = await db.DashboardWidgets.AsNoTracking()
            .Where(w => w.IsActive)
            .OrderBy(w => w.Category)
            .ThenBy(w => w.NameEn)
            .ToListAsync(ct);

        // Filter by permission/role
        var result = new List<DashboardWidgetDto>();
        foreach (var w in widgets)
        {
            if (w.RequiredPermission is not null && !userPermissions.Contains(w.RequiredPermission))
                continue;

            result.Add(new DashboardWidgetDto(
                w.Key, w.NameAr, w.NameEn, w.DescriptionAr, w.DescriptionEn,
                w.Category, w.DefaultWidth, w.DefaultHeight, w.MinWidth, w.MinHeight,
                w.IconName, w.ConfigSchema));
        }

        return result;
    }

    public async Task<UserDashboardLayoutDto> GetUserLayoutAsync(string userObjectId, CancellationToken ct = default)
    {
        var layout = await db.UserDashboardLayouts.AsNoTracking()
            .FirstOrDefaultAsync(l => l.UserObjectId == userObjectId && l.LayoutName == "main", ct);

        if (layout is not null)
            return new UserDashboardLayoutDto(layout.LayoutName, layout.WidgetsJson, layout.IsDefault);

        // No saved layout — generate default based on the user's primary role
        var userRole = await GetPrimaryRoleAsync(userObjectId, ct);
        var defaultWidgetKeys = DefaultLayouts.GetValueOrDefault(userRole) ?? DefaultLayouts["Observer"];

        var allWidgets = await db.DashboardWidgets.AsNoTracking()
            .Where(w => w.IsActive)
            .ToListAsync(ct);

        var placements = BuildDefaultPlacements(allWidgets, defaultWidgetKeys);
        var json = JsonSerializer.Serialize(placements);

        return new UserDashboardLayoutDto("main", json, true);
    }

    public async Task SaveUserLayoutAsync(string userObjectId, SaveLayoutRequest request, CancellationToken ct = default)
    {
        var layout = await db.UserDashboardLayouts
            .FirstOrDefaultAsync(l => l.UserObjectId == userObjectId && l.LayoutName == "main", ct);

        if (layout is null)
        {
            layout = new UserDashboardLayout
            {
                UserObjectId = userObjectId,
                LayoutName = "main",
                WidgetsJson = request.WidgetsJson,
                IsDefault = false,
            };
            db.UserDashboardLayouts.Add(layout);
        }
        else
        {
            layout.WidgetsJson = request.WidgetsJson;
            layout.IsDefault = false;
            layout.UpdatedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    public async Task ResetToDefaultAsync(string userObjectId, CancellationToken ct = default)
    {
        var layout = await db.UserDashboardLayouts
            .FirstOrDefaultAsync(l => l.UserObjectId == userObjectId && l.LayoutName == "main", ct);

        if (layout is not null)
        {
            db.UserDashboardLayouts.Remove(layout);
            await db.SaveChangesAsync(ct);
        }
    }

    public async Task<bool> IsUserCommitteeMemberAsync(string userObjectId, Guid committeeId, CancellationToken ct = default)
    {
        // System admins can view any committee
        var isAdmin = await db.AppUserRoles.AsNoTracking()
            .AnyAsync(ur => ur.User!.ObjectId == userObjectId && ur.Role!.Key == "SystemAdmin", ct);
        if (isAdmin) return true;

        return await db.CommitteeMembers.AsNoTracking()
            .AnyAsync(cm => cm.UserObjectId == userObjectId && cm.CommitteeId == committeeId, ct);
    }

    private async Task<string> GetPrimaryRoleAsync(string userObjectId, CancellationToken ct)
    {
        var roleKey = await db.AppUserRoles.AsNoTracking()
            .Where(ur => ur.User!.ObjectId == userObjectId)
            .OrderBy(ur => ur.AssignedAtUtc)
            .Select(ur => ur.Role!.Key)
            .FirstOrDefaultAsync(ct);

        return roleKey ?? "Observer";
    }

    private static List<WidgetPlacement> BuildDefaultPlacements(
        List<DashboardWidget> allWidgets,
        string[] widgetKeys)
    {
        var placements = new List<WidgetPlacement>();
        int x = 0, y = 0;
        foreach (var key in widgetKeys)
        {
            var w = allWidgets.Find(ww => ww.Key == key);
            if (w is null) continue;

            if (x + w.DefaultWidth > 4)
            {
                x = 0;
                y++;
            }

            placements.Add(new WidgetPlacement(key, x, y, w.DefaultWidth, w.DefaultHeight, null));
            x += w.DefaultWidth;
        }
        return placements;
    }
}
