using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/attachments")]
[Authorize]
public sealed class AttachmentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string domain, [FromQuery] Guid entityId, CancellationToken ct)
    {
        var items = await db.Attachments
            .AsNoTracking()
            .Where(a => a.Domain == domain && a.EntityId == entityId)
            .OrderByDescending(a => a.CreatedAtUtc)
            .ToListAsync(ct);
        return Ok(items);
    }

    public sealed record AddAttachmentRequest(string Domain, Guid EntityId, Guid StoredFileId, string Title);

    [HttpPost]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Add([FromBody] AddAttachmentRequest req, CancellationToken ct)
    {
        var attachment = new Attachment
        {
            Domain = req.Domain,
            EntityId = req.EntityId,
            StoredFileId = req.StoredFileId,
            Title = req.Title.Trim(),
        };
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync(ct);
        return Ok(new { attachment.Id });
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var a = await db.Attachments.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (a is null) return NotFound();
        db.Attachments.Remove(a);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}

