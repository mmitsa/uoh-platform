using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IVotingService
{
    Task<List<object>> ListByMeetingAsync(Guid meetingId);
    Task<VoteSession> CreateAsync(Guid meetingId, string title, List<string> options);
    Task OpenAsync(Guid id);
    Task CastBallotAsync(Guid sessionId, Guid selectedOptionId, string voterOid, string? voterDisplayName);
    Task CloseAsync(Guid id);
    Task<object> GetResultsAsync(Guid id);
}
