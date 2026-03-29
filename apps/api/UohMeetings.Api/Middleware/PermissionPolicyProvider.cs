using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace UohMeetings.Api.Middleware;

public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    : DefaultAuthorizationPolicyProvider(options)
{
    private const string Prefix = "Permission.";

    public override async Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Delegate to default first (handles "Role.SystemAdmin" etc.)
        var existing = await base.GetPolicyAsync(policyName);
        if (existing is not null) return existing;

        // Dynamically create permission-based policies
        if (policyName.StartsWith(Prefix, StringComparison.Ordinal))
        {
            var permission = policyName[Prefix.Length..];
            return new AuthorizationPolicyBuilder()
                .AddRequirements(new PermissionRequirement(permission))
                .Build();
        }

        return null;
    }
}
