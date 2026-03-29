using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface ILiveSurveyService
{
    Task<LiveSurveySession> CreateSessionAsync(Guid surveyId, string? createdByOid);
    Task<LiveSurveySession> GetSessionAsync(Guid sessionId);
    Task<LiveSurveySession?> GetByJoinCodeAsync(string joinCode);
    Task<List<LiveSurveySession>> ListBySurveyAsync(Guid surveyId);
    Task AdvanceQuestionAsync(Guid sessionId, string presenterKey, int direction);
    Task SetAcceptingVotesAsync(Guid sessionId, string presenterKey, bool accepting);
    Task<Dictionary<string, int>> RecordVoteAsync(Guid sessionId, Guid questionId, string valueJson, string fingerprint);
    Task<Dictionary<string, int>> GetTalliesAsync(Guid sessionId, Guid questionId);
    Task EndSessionAsync(Guid sessionId, string presenterKey);
    Task IncrementParticipantCountAsync(Guid sessionId);
    Task DecrementParticipantCountAsync(Guid sessionId);
}
