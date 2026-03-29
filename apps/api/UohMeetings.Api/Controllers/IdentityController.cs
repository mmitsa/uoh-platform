using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/identity")]
public sealed class IdentityController : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var claims = User.Claims
            .Select(c => new { c.Type, c.Value })
            .ToArray();

        return Ok(new
        {
            isAuthenticated = User.Identity?.IsAuthenticated == true,
            claims,
        });
    }

    [HttpGet("me/full")]
    [Authorize]
    public async Task<IActionResult> MeFull(
        [FromServices] IPermissionService permissionService)
    {
        var oid = User.FindFirst("oid")?.Value
            ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(oid)) return Unauthorized();

        var permissions = await permissionService.GetPermissionsForUserAsync(oid);

        return Ok(new
        {
            objectId = oid,
            displayName = User.FindFirst("name")?.Value ?? User.FindFirst(ClaimTypes.Name)?.Value,
            email = User.FindFirst("preferred_username")?.Value ?? User.FindFirst(ClaimTypes.Email)?.Value,
            permissions,
        });
    }
}
