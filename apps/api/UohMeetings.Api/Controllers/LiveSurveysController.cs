using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class LiveSurveysController(ILiveSurveyService liveSvc) : ControllerBase
{
    /// <summary>Create a new live session for a survey.</summary>
    [HttpPost("surveys/{surveyId:guid}/live-sessions")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> CreateSession(Guid surveyId)
    {
        var userOid = User.FindFirst("oid")?.Value
                   ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        var session = await liveSvc.CreateSessionAsync(surveyId, userOid);

        return Ok(new
        {
            session.Id,
            session.JoinCode,
            session.PresenterKey,
            session.Status,
            session.CreatedAtUtc,
        });
    }

    /// <summary>List live sessions for a survey.</summary>
    [HttpGet("surveys/{surveyId:guid}/live-sessions")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> ListSessions(Guid surveyId)
    {
        var sessions = await liveSvc.ListBySurveyAsync(surveyId);
        return Ok(sessions.Select(s => new
        {
            s.Id,
            s.JoinCode,
            s.Status,
            s.ParticipantCount,
            s.CurrentQuestionIndex,
            s.CreatedAtUtc,
            s.StartedAtUtc,
            s.CompletedAtUtc,
        }));
    }

    /// <summary>Look up a session by join code (for participants scanning QR).</summary>
    [HttpGet("live-sessions/join/{joinCode}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByJoinCode(string joinCode)
    {
        var session = await liveSvc.GetByJoinCodeAsync(joinCode);
        if (session is null) return NotFound();

        return Ok(new
        {
            session.Id,
            session.Status,
            session.AcceptingVotes,
            SurveyTitleAr = session.Survey?.TitleAr,
            SurveyTitleEn = session.Survey?.TitleEn,
        });
    }

    /// <summary>Full results for a completed session.</summary>
    [HttpGet("live-sessions/{sessionId:guid}/results")]
    [Authorize(Policy = "Role.CommitteeSecretary")]
    public async Task<IActionResult> GetResults(Guid sessionId)
    {
        var session = await liveSvc.GetSessionAsync(sessionId);
        var results = new List<object>();

        if (session.Survey?.Questions is { } questions)
        {
            foreach (var q in questions)
            {
                var tallies = await liveSvc.GetTalliesAsync(sessionId, q.Id);
                results.Add(new
                {
                    q.Id,
                    q.Order,
                    q.TextAr,
                    q.TextEn,
                    q.OptionsJson,
                    Tallies = tallies,
                });
            }
        }

        return Ok(new
        {
            session.Id,
            session.JoinCode,
            session.Status,
            session.ParticipantCount,
            session.StartedAtUtc,
            session.CompletedAtUtc,
            Questions = results,
        });
    }
}
