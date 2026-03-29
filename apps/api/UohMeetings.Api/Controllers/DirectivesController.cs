using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/directives")]
[Authorize]
public sealed class DirectivesController(IDirectiveService directiveService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] DirectiveStatus? status = null)
    {
        var (total, items) = await directiveService.ListAsync(page, pageSize, status);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var directive = await directiveService.GetAsync(id);
        return Ok(directive);
    }

    public sealed record CreateDirectiveRequest(
        string TitleAr,
        string TitleEn,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        string? IssuedBy = null,
        string? ReferenceNumber = null);

    [HttpPost]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateDirectiveRequest req)
    {
        var directive = await directiveService.CreateAsync(req);
        return CreatedAtAction(nameof(Get), new { id = directive.Id }, directive);
    }

    public sealed record UpdateDirectiveRequest(
        string? TitleAr = null,
        string? TitleEn = null,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        DirectiveStatus? Status = null);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDirectiveRequest req)
    {
        var directive = await directiveService.UpdateAsync(id, req);
        return Ok(directive);
    }

    // ─── Decisions ───

    [HttpGet("{directiveId:guid}/decisions")]
    public async Task<IActionResult> GetDecisions(Guid directiveId)
    {
        var decisions = await directiveService.GetDecisionsAsync(directiveId);
        return Ok(decisions);
    }

    public sealed record CreateDecisionRequest(
        string TitleAr,
        string TitleEn,
        string? NotesAr = null,
        string? NotesEn = null,
        Guid? CommitteeId = null);

    [HttpPost("{directiveId:guid}/decisions")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> AddDecision(Guid directiveId, [FromBody] CreateDecisionRequest req)
    {
        var decision = await directiveService.AddDecisionAsync(directiveId, req);
        return Created($"/api/v1/directives/{directiveId}/decisions/{decision.Id}", decision);
    }

    public sealed record UpdateDecisionRequest(
        string? TitleAr = null,
        string? TitleEn = null,
        string? NotesAr = null,
        string? NotesEn = null,
        DecisionStatus? Status = null,
        Guid? CommitteeId = null);

    [HttpPatch("decisions/{decisionId:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> UpdateDecision(Guid decisionId, [FromBody] UpdateDecisionRequest req)
    {
        var decision = await directiveService.UpdateDecisionAsync(decisionId, req);
        return Ok(decision);
    }
}
