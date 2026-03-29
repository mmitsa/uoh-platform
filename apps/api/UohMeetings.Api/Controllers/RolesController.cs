using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/roles")]
[Authorize]
public sealed class RolesController(IRoleManagementService roleService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission.admin.roles.view")]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isActive = null)
    {
        var (total, items) = await roleService.ListRolesAsync(page, pageSize, isActive);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "Permission.admin.roles.view")]
    public async Task<IActionResult> Get(Guid id)
    {
        var role = await roleService.GetRoleAsync(id);
        return Ok(role);
    }

    public sealed record CreateRoleRequest(string Key, string NameAr, string NameEn, string? DescriptionAr = null, string? DescriptionEn = null);

    [HttpPost]
    [Authorize(Policy = "Permission.admin.roles.manage")]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest req)
    {
        var role = await roleService.CreateRoleAsync(req.Key, req.NameAr, req.NameEn, req.DescriptionAr, req.DescriptionEn);
        return CreatedAtAction(nameof(Get), new { id = role.Id }, role);
    }

    public sealed record UpdateRoleRequest(string NameAr, string NameEn, string? DescriptionAr = null, string? DescriptionEn = null);

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission.admin.roles.manage")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest req)
    {
        var role = await roleService.UpdateRoleAsync(id, req.NameAr, req.NameEn, req.DescriptionAr, req.DescriptionEn);
        return Ok(role);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission.admin.roles.manage")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await roleService.DeleteRoleAsync(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/permissions")]
    [Authorize(Policy = "Permission.admin.roles.view")]
    public async Task<IActionResult> GetPermissions(Guid id)
    {
        var permissions = await roleService.GetRolePermissionsAsync(id);
        return Ok(permissions);
    }

    public sealed record SetPermissionsRequest(List<Guid> PermissionIds);

    [HttpPut("{id:guid}/permissions")]
    [Authorize(Policy = "Permission.admin.permissions.assign")]
    public async Task<IActionResult> SetPermissions(Guid id, [FromBody] SetPermissionsRequest req)
    {
        await roleService.SetRolePermissionsAsync(id, req.PermissionIds);
        return Ok();
    }
}
