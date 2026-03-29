using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/permissions")]
[Authorize]
public sealed class PermissionsController(IPermissionService permissionService) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "Permission.admin.permissions.view")]
    public async Task<IActionResult> ListAll()
    {
        var grouped = await permissionService.GetAllPermissionsGroupedAsync();
        return Ok(grouped);
    }
}
