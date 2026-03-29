using System.Security.Claims;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Middleware;

public sealed class UserProvisioningMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context, IServiceScopeFactory scopeFactory)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var oid = context.User.FindFirst("oid")?.Value
                ?? context.User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
                ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrEmpty(oid))
            {
                using var scope = scopeFactory.CreateScope();
                var userService = scope.ServiceProvider.GetRequiredService<IUserManagementService>();
                var name = context.User.FindFirst("name")?.Value
                    ?? context.User.FindFirst(ClaimTypes.Name)?.Value ?? "";
                var email = context.User.FindFirst("preferred_username")?.Value
                    ?? context.User.FindFirst(ClaimTypes.Email)?.Value ?? "";

                try
                {
                    await userService.GetOrCreateByObjectIdAsync(oid, name, email);
                }
                catch
                {
                    // Provisioning failure must not block the request
                }
            }
        }

        await next(context);
    }
}
