using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Middleware;

public sealed class PermissionRequirement(string permission) : IAuthorizationRequirement
{
    public string Permission { get; } = permission;
}

public sealed class PermissionHandler(IServiceScopeFactory scopeFactory) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var objectId = context.User.FindFirst("oid")?.Value
            ?? context.User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(objectId)) return;

        using var scope = scopeFactory.CreateScope();
        var permService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

        if (await permService.HasPermissionAsync(objectId, requirement.Permission))
        {
            context.Succeed(requirement);
        }
    }
}
