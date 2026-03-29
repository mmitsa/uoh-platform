using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/share-links")]
[Authorize]
public sealed class ShareLinksController(IShareLinkService shareLinkService) : ControllerBase
{
    public sealed record CreateShareLinkRequest(
        ShareableEntityType EntityType,
        Guid EntityId,
        DateTime? ExpiresAtUtc = null
    );

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateShareLinkRequest req)
    {
        var oid = User.FindFirstValue("oid")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var result = await shareLinkService.GetOrCreateAsync(
            req.EntityType, req.EntityId, oid, req.ExpiresAtUtc);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetByEntity(
        [FromQuery] ShareableEntityType entityType,
        [FromQuery] Guid entityId)
    {
        var result = await shareLinkService.GetByEntityAsync(entityType, entityId);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await shareLinkService.DeactivateAsync(id);
        return Ok();
    }
}
