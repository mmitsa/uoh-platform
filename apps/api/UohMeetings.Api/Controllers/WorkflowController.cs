using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/workflow")]
[Authorize]
public sealed class WorkflowController(AppDbContext db, WorkflowEngine engine) : ControllerBase
{
    [HttpGet("templates")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> ListTemplates([FromQuery] string? domain = null, CancellationToken ct = default)
    {
        var q = db.WorkflowTemplates.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(domain)) q = q.Where(t => t.Domain == domain);
        var items = await q.OrderByDescending(t => t.CreatedAtUtc).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("templates/{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> GetTemplate(Guid id, CancellationToken ct)
    {
        var template = await db.WorkflowTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
        return template is null ? NotFound() : Ok(template);
    }

    public sealed record CreateTemplateRequest(string Name, string Domain, WorkflowEngine.Definition Definition, string? BuilderMetadataJson = null);

    [HttpPost("templates")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateRequest req, CancellationToken ct)
    {
        var created = await engine.CreateTemplateAsync(req.Name, req.Domain, req.Definition, ct, req.BuilderMetadataJson);
        return Ok(created);
    }

    public sealed record UpdateTemplateRequest(string Name, string Domain, WorkflowEngine.Definition Definition, string? BuilderMetadataJson = null);

    [HttpPut("templates/{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateTemplateRequest req, CancellationToken ct)
    {
        var template = await db.WorkflowTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template is null) return NotFound();

        // Check for active instances
        var hasActive = await db.WorkflowInstances.AnyAsync(i => i.TemplateId == id && i.Status == Enums.WorkflowStatus.Active, ct);
        if (hasActive) return BadRequest(new { error = "TEMPLATE_HAS_ACTIVE_INSTANCES" });

        var json = System.Text.Json.JsonSerializer.Serialize(req.Definition, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
        template.Name = req.Name.Trim();
        template.Domain = req.Domain.Trim();
        template.DefinitionJson = json;
        template.BuilderMetadataJson = req.BuilderMetadataJson;
        template.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return Ok(template);
    }

    [HttpDelete("templates/{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> DeleteTemplate(Guid id, CancellationToken ct)
    {
        var template = await db.WorkflowTemplates.FirstOrDefaultAsync(t => t.Id == id, ct);
        if (template is null) return NotFound();

        var hasActive = await db.WorkflowInstances.AnyAsync(i => i.TemplateId == id && i.Status == Enums.WorkflowStatus.Active, ct);
        if (hasActive) return BadRequest(new { error = "TEMPLATE_HAS_ACTIVE_INSTANCES" });

        template.IsDeleted = true;
        template.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpPost("templates/{id:guid}/duplicate")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> DuplicateTemplate(Guid id, CancellationToken ct)
    {
        var original = await db.WorkflowTemplates.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, ct);
        if (original is null) return NotFound();

        var copy = new WorkflowTemplate
        {
            Name = $"{original.Name} (copy)",
            Domain = original.Domain,
            DefinitionJson = original.DefinitionJson,
            BuilderMetadataJson = original.BuilderMetadataJson,
        };
        db.WorkflowTemplates.Add(copy);
        await db.SaveChangesAsync(ct);
        return Ok(copy);
    }

    public sealed record StartInstanceRequest(Guid TemplateId, string Domain, Guid EntityId);

    [HttpPost("instances")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> StartInstance([FromBody] StartInstanceRequest req, CancellationToken ct)
    {
        var instance = await engine.StartInstanceAsync(req.TemplateId, req.Domain, req.EntityId, ct);
        return Ok(instance);
    }

    [HttpGet("instances/{id:guid}")]
    public async Task<IActionResult> GetInstance(Guid id, CancellationToken ct)
    {
        var instance = await db.WorkflowInstances.AsNoTracking().Include(i => i.History).FirstOrDefaultAsync(i => i.Id == id, ct);
        return instance is null ? NotFound() : Ok(instance);
    }

    public sealed record ApplyActionRequest(string Action);

    [HttpPost("instances/{id:guid}/apply")]
    public async Task<IActionResult> Apply(Guid id, [FromBody] ApplyActionRequest req, CancellationToken ct)
    {
        var updated = await engine.ApplyAsync(id, req.Action, User, ct);
        return Ok(updated);
    }
}
