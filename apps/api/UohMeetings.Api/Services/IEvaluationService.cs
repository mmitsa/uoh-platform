using UohMeetings.Api.Entities;
using static UohMeetings.Api.Controllers.EvaluationsController;

namespace UohMeetings.Api.Services;

public interface IEvaluationService
{
    // Templates
    Task<(int Total, List<object> Items)> ListTemplatesAsync(int page, int pageSize);
    Task<EvaluationTemplate> GetTemplateAsync(Guid id);
    Task<EvaluationTemplate> CreateTemplateAsync(CreateTemplateRequest request);
    Task<EvaluationTemplate> UpdateTemplateAsync(Guid id, UpdateTemplateRequest request);

    // Evaluations
    Task<(int Total, List<object> Items)> ListEvaluationsAsync(int page, int pageSize, Guid? committeeId);
    Task<CommitteeEvaluation> GetEvaluationAsync(Guid id);
    Task<CommitteeEvaluation> CreateEvaluationAsync(CreateEvaluationRequest request);
    Task<CommitteeEvaluation> SubmitResponsesAsync(Guid evaluationId, SubmitResponsesRequest request);
}
