using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/change-requests")]
[Authorize]
public sealed class ChangeRequestsController(IChangeRequestService changeRequestService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? committeeId = null,
        [FromQuery] ChangeRequestStatus? status = null)
    {
        var (total, items) = await changeRequestService.ListAsync(page, pageSize, committeeId, status);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var request = await changeRequestService.GetAsync(id);
        return Ok(request);
    }

    public sealed record CreateChangeRequestRequest(
        Guid CommitteeId,
        string RequesterObjectId,
        string RequesterDisplayName,
        string ReasonAr,
        string ReasonEn,
        string? ChangesJson = null);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateChangeRequestRequest req)
    {
        var request = await changeRequestService.CreateAsync(req);
        return CreatedAtAction(nameof(Get), new { id = request.Id }, request);
    }

    public sealed record ReviewChangeRequestRequest(
        bool Approved,
        string ReviewerObjectId,
        string ReviewerDisplayName,
        string? NotesAr = null,
        string? NotesEn = null);

    [HttpPost("{id:guid}/review")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Review(Guid id, [FromBody] ReviewChangeRequestRequest req)
    {
        var request = await changeRequestService.ReviewAsync(id, req);
        return Ok(request);
    }
}
