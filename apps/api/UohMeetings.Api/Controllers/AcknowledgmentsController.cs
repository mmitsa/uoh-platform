using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/acknowledgments")]
[Authorize]
public sealed class AcknowledgmentsController(IAcknowledgmentService acknowledgmentService, AppDbContext db) : ControllerBase
{
    private string ObjectId =>
        User.FindFirst("oid")?.Value
        ?? User.FindFirst("http://schemas.microsoft.com/identity/claims/objectidentifier")?.Value
        ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
        ?? "";

    // ─── Admin endpoints ───

    [HttpGet]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (total, items) = await acknowledgmentService.ListTemplatesAsync(page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct = default)
    {
        var template = await acknowledgmentService.GetTemplateAsync(id, ct);
        return Ok(template);
    }

    public sealed record CreateAcknowledgmentRequest(
        string TitleAr,
        string TitleEn,
        string BodyAr,
        string BodyEn,
        AcknowledgmentCategory Category,
        bool IsMandatory,
        bool RequiresRenewal,
        int? RenewalDays,
        string? AppliesToRoles
    );

    [HttpPost]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateAcknowledgmentRequest req, CancellationToken ct = default)
    {
        var template = await acknowledgmentService.CreateTemplateAsync(
            req.TitleAr, req.TitleEn, req.BodyAr, req.BodyEn,
            req.Category, req.IsMandatory,
            req.RequiresRenewal, req.RenewalDays, req.AppliesToRoles, ct);
        return CreatedAtAction(nameof(Get), new { id = template.Id }, template);
    }

    public sealed record UpdateAcknowledgmentRequest(
        string TitleAr,
        string TitleEn,
        string BodyAr,
        string BodyEn,
        AcknowledgmentCategory Category,
        bool IsMandatory,
        bool RequiresRenewal,
        int? RenewalDays,
        string? AppliesToRoles
    );

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcknowledgmentRequest req, CancellationToken ct = default)
    {
        var template = await acknowledgmentService.UpdateTemplateAsync(
            id, req.TitleAr, req.TitleEn, req.BodyAr, req.BodyEn,
            req.Category, req.IsMandatory,
            req.RequiresRenewal, req.RenewalDays, req.AppliesToRoles, ct);
        return Ok(template);
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Publish(Guid id, CancellationToken ct = default)
    {
        var template = await acknowledgmentService.PublishTemplateAsync(id, ct);
        return Ok(template);
    }

    [HttpPost("{id:guid}/archive")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct = default)
    {
        var template = await acknowledgmentService.ArchiveTemplateAsync(id, ct);
        return Ok(template);
    }

    [HttpGet("{id:guid}/signatures")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Signatures(Guid id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var (total, items) = await acknowledgmentService.GetTemplateSignaturesAsync(id, page, pageSize, ct);
        return Ok(new { page, pageSize, total, items });
    }

    // ─── User endpoints ───

    [HttpGet("pending")]
    public async Task<IActionResult> Pending(CancellationToken ct = default)
    {
        var (userId, roles) = await ResolveUserAsync(ct);
        if (userId == Guid.Empty) return Unauthorized();

        var pending = await acknowledgmentService.GetPendingForUserAsync(userId, roles, ct);
        return Ok(pending);
    }

    [HttpPost("{id:guid}/acknowledge")]
    public async Task<IActionResult> Acknowledge(Guid id, CancellationToken ct = default)
    {
        var (userId, _) = await ResolveUserAsync(ct);
        if (userId == Guid.Empty) return Unauthorized();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var ack = await acknowledgmentService.AcknowledgeAsync(userId, id, ip, userAgent, ct);
        return Ok(ack);
    }

    [HttpGet("my-history")]
    public async Task<IActionResult> MyHistory(CancellationToken ct = default)
    {
        var (userId, _) = await ResolveUserAsync(ct);
        if (userId == Guid.Empty) return Unauthorized();

        var history = await acknowledgmentService.GetUserHistoryAsync(userId, ct);
        return Ok(history);
    }

    // ─── Helper ───

    private async Task<(Guid UserId, string[] Roles)> ResolveUserAsync(CancellationToken ct)
    {
        var oid = ObjectId;
        if (string.IsNullOrEmpty(oid))
            return (Guid.Empty, []);

        var user = await db.AppUsers
            .AsNoTracking()
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.ObjectId == oid, ct);

        if (user is null)
            return (Guid.Empty, []);

        var roles = user.UserRoles.Select(ur => ur.Role!.Key).ToArray();
        return (user.Id, roles);
    }
}
