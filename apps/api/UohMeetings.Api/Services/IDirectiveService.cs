using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.DirectivesController;

namespace UohMeetings.Api.Services;

public interface IDirectiveService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, DirectiveStatus? status);
    Task<Directive> GetAsync(Guid id);
    Task<Directive> CreateAsync(CreateDirectiveRequest request);
    Task<Directive> UpdateAsync(Guid id, UpdateDirectiveRequest request);
    Task<DirectiveDecision> AddDecisionAsync(Guid directiveId, CreateDecisionRequest request);
    Task<DirectiveDecision> UpdateDecisionAsync(Guid decisionId, UpdateDecisionRequest request);
    Task<List<object>> GetDecisionsAsync(Guid directiveId);
}
