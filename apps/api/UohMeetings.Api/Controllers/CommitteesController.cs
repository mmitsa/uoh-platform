using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/committees")]
[Authorize]
public sealed class CommitteesController(ICommitteeService committeeService, AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] CommitteeStatus? status = null,
        [FromQuery] CommitteeType? type = null,
        [FromQuery] Guid? parentId = null)
    {
        var (total, items) = await committeeService.ListAsync(page, pageSize, status, type, parentId);
        return Ok(new { page, pageSize, total, items });
    }

    [HttpGet("hierarchy")]
    public async Task<IActionResult> Hierarchy()
    {
        var tree = await committeeService.GetHierarchyAsync();
        return Ok(tree);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var committee = await committeeService.GetAsync(id);
        return Ok(committee);
    }

    [HttpGet("{id:guid}/sub-committees")]
    public async Task<IActionResult> SubCommittees(Guid id)
    {
        var subs = await committeeService.GetSubCommitteesAsync(id);
        return Ok(subs);
    }

    public sealed record CreateCommitteeRequest(
        CommitteeType Type,
        string NameAr,
        string NameEn,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        Guid? ParentCommitteeId = null,
        DateOnly? StartDate = null,
        DateOnly? EndDate = null,
        int? MaxMembers = null,
        string? ObjectivesAr = null,
        string? ObjectivesEn = null);

    [HttpPost]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Create([FromBody] CreateCommitteeRequest req)
    {
        var committee = await committeeService.CreateAsync(req);
        return CreatedAtAction(nameof(Get), new { id = committee.Id }, committee);
    }

    public sealed record UpdateCommitteeRequest(
        string? NameAr = null,
        string? NameEn = null,
        string? DescriptionAr = null,
        string? DescriptionEn = null,
        CommitteeStatus? Status = null,
        Guid? ParentCommitteeId = null,
        DateOnly? StartDate = null,
        DateOnly? EndDate = null,
        int? MaxMembers = null,
        string? ObjectivesAr = null,
        string? ObjectivesEn = null);

    [HttpPatch("{id:guid}")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCommitteeRequest req)
    {
        var committee = await committeeService.UpdateAsync(id, req);
        return Ok(committee);
    }

    public sealed record UpsertMemberRequest(string UserObjectId, string DisplayName, string Email, string Role, bool IsActive);

    /// <summary>Get meetings linked to a specific committee.</summary>
    [HttpGet("{id:guid}/meetings")]
    public async Task<IActionResult> GetMeetings(Guid id)
    {
        var committeeExists = await db.Committees.AnyAsync(c => c.Id == id);
        if (!committeeExists) return NotFound();

        var meetings = await db.Meetings
            .AsNoTracking()
            .Where(m => m.CommitteeId == id)
            .OrderByDescending(m => m.StartDateTimeUtc)
            .Select(m => new
            {
                m.Id,
                m.TitleAr,
                m.TitleEn,
                m.StartDateTimeUtc,
                Status = m.Status.ToString(),
            })
            .ToListAsync();

        return Ok(meetings);
    }

    /// <summary>Get tasks linked to a specific committee.</summary>
    [HttpGet("{id:guid}/tasks")]
    public async Task<IActionResult> GetTasks(Guid id)
    {
        var committeeExists = await db.Committees.AnyAsync(c => c.Id == id);
        if (!committeeExists) return NotFound();

        var tasks = await db.RecommendationTasks
            .AsNoTracking()
            .Where(t => t.CommitteeId == id)
            .OrderByDescending(t => t.DueDateUtc)
            .Select(t => new
            {
                t.Id,
                t.TitleAr,
                t.TitleEn,
                t.DueDateUtc,
                Status = t.Status.ToString(),
                Priority = t.Priority.ToString(),
                t.Progress,
            })
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpPut("{id:guid}/members")]
    [Authorize(Policy = "Role.SystemAdmin")]
    public async Task<IActionResult> UpsertMember(Guid id, [FromBody] UpsertMemberRequest req)
    {
        await committeeService.UpsertMemberAsync(id, req.UserObjectId, req.DisplayName, req.Email, req.Role, req.IsActive);
        return Ok();
    }
}
