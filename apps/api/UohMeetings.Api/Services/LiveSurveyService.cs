using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class LiveSurveyService(AppDbContext db) : ILiveSurveyService
{
    private const string JoinCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public async Task<LiveSurveySession> CreateSessionAsync(Guid surveyId, string? createdByOid)
    {
        var survey = await db.Surveys
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == surveyId);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), surveyId);

        if (survey.Status != SurveyStatus.Active)
            throw new ValidationException("Status", "Survey must be active to start a live session.");

        var session = new LiveSurveySession
        {
            SurveyId = surveyId,
            JoinCode = await GenerateUniqueJoinCodeAsync(),
            PresenterKey = Convert.ToHexString(RandomNumberGenerator.GetBytes(8)).ToLowerInvariant(),
            CreatedByObjectId = createdByOid,
        };

        db.LiveSurveySessions.Add(session);
        await db.SaveChangesAsync();
        return session;
    }

    public async Task<LiveSurveySession> GetSessionAsync(Guid sessionId)
    {
        var session = await db.LiveSurveySessions
            .Include(s => s.Survey!)
            .ThenInclude(s => s.Questions.OrderBy(q => q.Order))
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId);

        return session ?? throw new NotFoundException(nameof(LiveSurveySession), sessionId);
    }

    public async Task<LiveSurveySession?> GetByJoinCodeAsync(string joinCode)
    {
        return await db.LiveSurveySessions
            .Include(s => s.Survey!)
            .ThenInclude(s => s.Questions.OrderBy(q => q.Order))
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.JoinCode == joinCode.ToUpperInvariant());
    }

    public async Task<List<LiveSurveySession>> ListBySurveyAsync(Guid surveyId)
    {
        return await db.LiveSurveySessions
            .Where(s => s.SurveyId == surveyId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task AdvanceQuestionAsync(Guid sessionId, string presenterKey, int direction)
    {
        var session = await GetTrackedSessionAsync(sessionId, presenterKey);
        var questionCount = await db.SurveyQuestions.CountAsync(q => q.SurveyId == session.SurveyId);

        var newIndex = session.CurrentQuestionIndex + direction;
        if (newIndex < 0 || newIndex >= questionCount) return;

        session.CurrentQuestionIndex = newIndex;
        session.AcceptingVotes = true;

        if (session.Status == LiveSessionStatus.Created)
        {
            session.Status = LiveSessionStatus.Active;
            session.StartedAtUtc = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
    }

    public async Task SetAcceptingVotesAsync(Guid sessionId, string presenterKey, bool accepting)
    {
        var session = await GetTrackedSessionAsync(sessionId, presenterKey);
        session.AcceptingVotes = accepting;
        await db.SaveChangesAsync();
    }

    public async Task<Dictionary<string, int>> RecordVoteAsync(Guid sessionId, Guid questionId, string valueJson, string fingerprint)
    {
        var session = await db.LiveSurveySessions.FindAsync(sessionId)
                      ?? throw new NotFoundException(nameof(LiveSurveySession), sessionId);

        if (session.Status != LiveSessionStatus.Active || !session.AcceptingVotes)
            throw new ValidationException("Status", "Voting is not currently open.");

        // Check for duplicate vote on this question by this fingerprint
        var alreadyVoted = await db.LiveSessionResponses
            .AnyAsync(r => r.LiveSurveySessionId == sessionId
                        && r.ParticipantFingerprint == fingerprint
                        && r.SurveyResponse!.Answers.Any(a => a.SurveyQuestionId == questionId));

        if (alreadyVoted)
            throw new ConflictException("You have already voted on this question.");

        // Create SurveyResponse + SurveyAnswer
        var response = new SurveyResponse
        {
            SurveyId = session.SurveyId,
            RespondentObjectId = null,
            Answers = new List<SurveyAnswer>
            {
                new() { SurveyQuestionId = questionId, ValueJson = valueJson }
            }
        };
        db.SurveyResponses.Add(response);

        // Link to live session
        db.LiveSessionResponses.Add(new LiveSessionResponse
        {
            LiveSurveySessionId = sessionId,
            SurveyResponseId = response.Id,
            ParticipantFingerprint = fingerprint,
        });

        await db.SaveChangesAsync();

        // Return updated tallies
        return await GetTalliesAsync(sessionId, questionId);
    }

    public async Task<Dictionary<string, int>> GetTalliesAsync(Guid sessionId, Guid questionId)
    {
        var session = await db.LiveSurveySessions.AsNoTracking().FirstOrDefaultAsync(s => s.Id == sessionId)
                      ?? throw new NotFoundException(nameof(LiveSurveySession), sessionId);

        var answers = await db.SurveyAnswers
            .Where(a => a.SurveyQuestionId == questionId
                     && db.LiveSessionResponses.Any(lr =>
                            lr.LiveSurveySessionId == sessionId
                         && lr.SurveyResponseId == a.SurveyResponseId))
            .Select(a => a.ValueJson)
            .ToListAsync();

        var tallies = new Dictionary<string, int>();
        foreach (var json in answers)
        {
            var val = json.Trim('"');
            tallies[val] = tallies.GetValueOrDefault(val) + 1;
        }
        return tallies;
    }

    public async Task EndSessionAsync(Guid sessionId, string presenterKey)
    {
        var session = await GetTrackedSessionAsync(sessionId, presenterKey);
        session.Status = LiveSessionStatus.Completed;
        session.AcceptingVotes = false;
        session.CompletedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();
    }

    public async Task IncrementParticipantCountAsync(Guid sessionId)
    {
        var session = await db.LiveSurveySessions.FindAsync(sessionId);
        if (session is not null)
        {
            session.ParticipantCount++;
            await db.SaveChangesAsync();
        }
    }

    public async Task DecrementParticipantCountAsync(Guid sessionId)
    {
        var session = await db.LiveSurveySessions.FindAsync(sessionId);
        if (session is not null && session.ParticipantCount > 0)
        {
            session.ParticipantCount--;
            await db.SaveChangesAsync();
        }
    }

    private async Task<LiveSurveySession> GetTrackedSessionAsync(Guid sessionId, string presenterKey)
    {
        var session = await db.LiveSurveySessions.FindAsync(sessionId)
                      ?? throw new NotFoundException(nameof(LiveSurveySession), sessionId);

        if (session.PresenterKey != presenterKey)
            throw new ForbiddenException("Invalid presenter key.");

        return session;
    }

    private async Task<string> GenerateUniqueJoinCodeAsync()
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var code = new string(Enumerable.Range(0, 6)
                .Select(_ => JoinCodeChars[RandomNumberGenerator.GetInt32(JoinCodeChars.Length)])
                .ToArray());

            if (!await db.LiveSurveySessions.AnyAsync(s => s.JoinCode == code))
                return code;
        }
        throw new InvalidOperationException("Failed to generate a unique join code after 20 attempts.");
    }
}
