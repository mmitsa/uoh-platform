using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public sealed class UsersController(
    IUserManagementService userService,
    IPermissionService permissionService,
    IAdSyncService adSync) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission.admin.users.view")]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var (total, items) = await userService.ListUsersAsync(page, pageSize, search, isActive);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission.admin.users.view")]
    public async Task<IActionResult> Get(Guid id)
    {
        var user = await userService.GetUserAsync(id);
        return Ok(user);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission.admin.users.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest req)
    {
        var user = await userService.UpdateUserAsync(id, req);
        return Ok(user);
    }

    public sealed record ToggleActiveRequest(bool IsActive);

    [HttpPatch("{id:guid}/active")]
    [Authorize(Policy = "Permission.admin.users.manage")]
    public async Task<IActionResult> ToggleActive(Guid id, [FromBody] ToggleActiveRequest req)
    {
        await userService.ToggleUserActiveAsync(id, req.IsActive);
        return Ok();
    }

    [HttpGet("{id:guid}/permissions")]
    [Authorize(Policy = "Permission.admin.permissions.view")]
    public async Task<IActionResult> GetPermissions(Guid id)
    {
        var permissions = await userService.GetUserPermissionsAsync(id);
        return Ok(permissions);
    }

    public sealed record AssignRoleRequest(Guid RoleId, DateTime? ExpiresAtUtc);

    [HttpPost("{id:guid}/roles")]
    [Authorize(Policy = "Permission.admin.users.manage")]
    public async Task<IActionResult> AssignRole(Guid id, [FromBody] AssignRoleRequest req)
    {
        var adminOid = User.FindFirst("oid")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        await userService.AssignRoleAsync(id, req.RoleId, adminOid, req.ExpiresAtUtc);
        return Ok();
    }

    [HttpDelete("{id:guid}/roles/{roleId:guid}")]
    [Authorize(Policy = "Permission.admin.users.manage")]
    public async Task<IActionResult> RemoveRole(Guid id, Guid roleId)
    {
        await userService.RemoveRoleAsync(id, roleId);
        return Ok();
    }

    public sealed record SyncRequest(string? GroupId);

    [HttpPost("sync")]
    [Authorize(Policy = "Permission.admin.users.sync")]
    public async Task<IActionResult> SyncFromAd([FromBody] SyncRequest? req)
    {
        var result = await adSync.SyncAllAsync(req?.GroupId);
        return Ok(result);
    }

    [HttpGet("ad-search")]
    [Authorize(Policy = "Permission.admin.users.manage")]
    public async Task<IActionResult> SearchAd([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return Ok(Array.Empty<object>());

        var results = await adSync.SearchAdUsersAsync(q);
        return Ok(results);
    }

    [HttpGet("me/permissions")]
    public async Task<IActionResult> MyPermissions()
    {
        var oid = User.FindFirst("oid")?.Value
            ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(oid)) return Unauthorized();

        var perms = await permissionService.GetPermissionsForUserAsync(oid);
        return Ok(new { permissions = perms });
    }
}
