using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1/votes")]
[Authorize]
public sealed class VotingController(AppDbContext db) : ControllerBase
{
    [HttpGet("by-meeting/{meetingId:guid}")]
    public async Task<IActionResult> ListByMeeting(Guid meetingId)
    {
        var items = await db.VoteSessions
            .AsNoTracking()
            .Where(v => v.MeetingId == meetingId)
            .OrderByDescending(v => v.CreatedAtUtc)
            .Select(v => new { v.Id, v.MeetingId, v.Title, v.Status, v.OpenedAtUtc, v.ClosedAtUtc })
            .ToListAsync();

        return Ok(items);
    }

    public sealed record CreateVoteRequest(Guid MeetingId, string Title, List<string> Options);

    [HttpPost]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Create([FromBody] CreateVoteRequest req)
    {
        if (req.Options.Count < 2) return BadRequest(new { code = "VALIDATION_ERROR", message = "At least 2 options." });

        var vote = new VoteSession
        {
            MeetingId = req.MeetingId,
            Title = req.Title.Trim(),
            Status = VoteSessionStatus.Draft,
            Options = req.Options.Select((label, idx) => new VoteOption { Label = label.Trim(), Order = idx + 1 }).ToList(),
        };

        db.VoteSessions.Add(vote);
        await db.SaveChangesAsync();
        return Ok(new { vote.Id });
    }

    [HttpPost("{id:guid}/open")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Open(Guid id)
    {
        var vote = await db.VoteSessions.FirstOrDefaultAsync(v => v.Id == id);
        if (vote is null) return NotFound();
        if (vote.Status != VoteSessionStatus.Draft) return BadRequest(new { code = "INVALID_STATE" });

        vote.Status = VoteSessionStatus.Open;
        vote.OpenedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok();
    }

    public sealed record CastBallotRequest(Guid SelectedOptionId);

    [HttpPost("{id:guid}/cast")]
    public async Task<IActionResult> Cast(Guid id, [FromBody] CastBallotRequest req)
    {
        var vote = await db.VoteSessions
            .AsNoTracking()
            .Include(v => v.Options)
            .FirstOrDefaultAsync(v => v.Id == id);
        if (vote is null) return NotFound();
        if (vote.Status != VoteSessionStatus.Open) return BadRequest(new { code = "VOTE_NOT_OPEN" });

        if (!vote.Options.Any(o => o.Id == req.SelectedOptionId))
            return BadRequest(new { code = "INVALID_OPTION" });

        var voterOid = User.FindFirstValue("oid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(voterOid)) return Unauthorized();

        var already = await db.VoteBallots.AnyAsync(b => b.VoteSessionId == id && b.VoterObjectId == voterOid);
        if (already) return Conflict(new { code = "ALREADY_VOTED" });

        db.VoteBallots.Add(new VoteBallot
        {
            VoteSessionId = id,
            VoterObjectId = voterOid,
            VoterDisplayName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name),
            SelectedOptionId = req.SelectedOptionId,
        });

        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id:guid}/close")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> Close(Guid id)
    {
        var vote = await db.VoteSessions.FirstOrDefaultAsync(v => v.Id == id);
        if (vote is null) return NotFound();
        if (vote.Status != VoteSessionStatus.Open) return BadRequest(new { code = "INVALID_STATE" });

        vote.Status = VoteSessionStatus.Closed;
        vote.ClosedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("{id:guid}/results")]
    public async Task<IActionResult> Results(Guid id)
    {
        var vote = await db.VoteSessions.AsNoTracking().Include(v => v.Options).FirstOrDefaultAsync(v => v.Id == id);
        if (vote is null) return NotFound();

        var counts = await db.VoteBallots
            .AsNoTracking()
            .Where(b => b.VoteSessionId == id)
            .GroupBy(b => b.SelectedOptionId)
            .Select(g => new { optionId = g.Key, count = g.Count() })
            .ToListAsync();

        var result = vote.Options
            .OrderBy(o => o.Order)
            .Select(o => new
            {
                o.Id,
                o.Label,
                count = counts.FirstOrDefault(c => c.optionId == o.Id)?.count ?? 0,
            })
            .ToArray();

        return Ok(new { vote.Id, vote.Status, options = result });
    }
}

