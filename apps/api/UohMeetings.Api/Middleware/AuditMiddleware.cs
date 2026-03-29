using System.Diagnostics;
using System.Security.Claims;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Middleware;

public sealed class AuditMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context, AuditLogQueue queue, ILogger<AuditMiddleware> logger)
    {
        var path = context.Request.Path.Value ?? "/";

        if (path.StartsWith("/swagger", StringComparison.OrdinalIgnoreCase) || path.Equals("/health", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();

            var user = context.User;
            var isAuthenticated = user.Identity?.IsAuthenticated == true;

            var entry = new AuditLogEntry
            {
                TraceId = context.TraceIdentifier,
                HttpMethod = context.Request.Method,
                Path = path,
                StatusCode = context.Response.StatusCode,
                DurationMs = (int)Math.Min(int.MaxValue, sw.ElapsedMilliseconds),
                Success = context.Response.StatusCode is >= 200 and < 400,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers.UserAgent.ToString(),
                UserObjectId = isAuthenticated ? user.FindFirstValue("oid") ?? user.FindFirstValue(ClaimTypes.NameIdentifier) : null,
                UserDisplayName = isAuthenticated ? user.FindFirstValue("name") ?? user.FindFirstValue(ClaimTypes.Name) : null,
                UserEmail = isAuthenticated ? user.FindFirstValue("preferred_username") ?? user.FindFirstValue(ClaimTypes.Email) : null,
                UserRoles = isAuthenticated ? string.Join(",", user.FindAll(ClaimTypes.Role).Select(r => r.Value).Distinct()) : null,
            };

            if (!queue.Writer.TryWrite(entry))
            {
                logger.LogWarning("Audit log queue rejected entry for {Method} {Path}", entry.HttpMethod, entry.Path);
            }
        }
    }
}
