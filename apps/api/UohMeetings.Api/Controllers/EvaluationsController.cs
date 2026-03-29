using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/evaluations")]
[Authorize]
public sealed class EvaluationsController(IEvaluationService evaluationService) : ControllerBase
{
    // ─── Templates ───

    [HttpGet("templates")]
    public async Task<IActionResult> ListTemplates(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var (total, items) = await evaluationService.ListTemplatesAsync(page, pageSize);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("templates/{id:guid}")]
    public async Task<IActionResult> GetTemplate(Guid id)
    {
        var template = await evaluationService.GetTemplateAsync(id);
        return Ok(template);
    }

    public sealed record CriteriaInput(
        string LabelAr,
        string LabelEn,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        int? MaxScore = null,
        int? Weight = null);

    public sealed record CreateTemplateRequest(
        string NameAr,
        string NameEn,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        int? MaxScore = null,
        List<CriteriaInput>? Criteria = null);

    [HttpPost("templates")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest req)
    {
        var template = await evaluationService.CreateTemplateAsync(req);
        return CreatedAtAction(nameof(GetTemplate), new { id = template.Id }, template);
    }

    public sealed record UpdateTemplateRequest(
        string? NameAr = null,
        string? NameEn = null,
        bool? IsActive = null);

    [HttpPatch("templates/{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateTemplateRequest req)
    {
        var template = await evaluationService.UpdateTemplateAsync(id, req);
        return Ok(template);
    }

    // ─── Evaluations ───

    [HttpGet]
    public async Task<IActionResult> ListEvaluations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] Guid? committeeId = null)
    {
        var (total, items) = await evaluationService.ListEvaluationsAsync(page, pageSize, committeeId);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEvaluation(Guid id)
    {
        var evaluation = await evaluationService.GetEvaluationAsync(id);
        return Ok(evaluation);
    }

    public sealed record CreateEvaluationRequest(
        Guid CommitteeId,
        Guid TemplateId,
        string EvaluatorObjectId,
        string EvaluatorDisplayName,
        DateOnly PeriodStart,
        DateOnly PeriodEnd);

    [HttpPost]
    [Authorize(Policy = "Role.CommitteeHead")]
    public async Task<IActionResult> CreateEvaluation([FromBody] CreateEvaluationRequest req)
    {
        var evaluation = await evaluationService.CreateEvaluationAsync(req);
        return CreatedAtAction(nameof(GetEvaluation), new { id = evaluation.Id }, evaluation);
    }

    public sealed record ResponseInput(Guid CriteriaId, int Score, string? Notes = null);

    public sealed record SubmitResponsesRequest(
        List<ResponseInput> Responses,
        string? OverallNotesAr = null,
        string? OverallNotesEn = null);

    [HttpPut("{id:guid}/responses")]
    [Authorize(Policy = "Role.CommitteeHead")]
    public async Task<IActionResult> SubmitResponses(Guid id, [FromBody] SubmitResponsesRequest req)
    {
        var evaluation = await evaluationService.SubmitResponsesAsync(id, req);
        return Ok(evaluation);
    }
}
