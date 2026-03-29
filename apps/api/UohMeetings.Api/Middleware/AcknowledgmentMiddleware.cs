using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Middleware;

public sealed class AcknowledgmentMiddleware(RequestDelegate next)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly HashSet<string> ExcludedPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "/health",
        "/api/v1/acknowledgments/pending",
        "/api/v1/identity",
        "/hubs/",
    };

    public async Task Invoke(HttpContext context, IServiceScopeFactory scopeFactory)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip excluded paths
        if (IsExcluded(path))
        {
            await next(context);
            return;
        }

        // Only check authenticated users
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        // Allow the acknowledge action itself
        if (path.EndsWith("/acknowledge", StringComparison.OrdinalIgnoreCase)
            && context.Request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var oid = context.User.FindFirst("oid")?.Value
            ?? context.User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(oid))
        {
            await next(context);
            return;
        }

        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var acknowledgmentService = scope.ServiceProvider.GetRequiredService<IAcknowledgmentService>();

        var user = await db.AppUsers
            .AsNoTracking()
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.ObjectId == oid);

        if (user is null)
        {
            await next(context);
            return;
        }

        var roles = user.UserRoles.Select(ur => ur.Role!.Key).ToArray();
        var hasPending = await acknowledgmentService.HasPendingMandatoryAsync(user.Id, roles);

        if (hasPending)
        {
            context.Response.StatusCode = 451; // Unavailable For Legal Reasons
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(
                JsonSerializer.Serialize(new { requiresAcknowledgment = true }, JsonOptions));
            return;
        }

        await next(context);
    }

    private static bool IsExcluded(string path)
    {
        foreach (var prefix in ExcludedPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
