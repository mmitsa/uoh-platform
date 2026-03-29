using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Services;

public interface ISurveyService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, SurveyStatus? status);
    Task<Survey> GetAsync(Guid id);
    Task<Survey> CreateAsync(
        string type,
        string targetAudience,
        string titleAr,
        string titleEn,
        DateTime startAtUtc,
        DateTime endAtUtc,
        bool allowLuckyDraw,
        List<(int Order, SurveyQuestionType Type, string TextAr, string TextEn, List<string>? Options)> questions);
    Task ActivateAsync(Guid id);
    Task CloseAsync(Guid id);
    Task<SurveyResponse> SubmitResponseAsync(
        Guid surveyId,
        string? respondentOid,
        List<(Guid QuestionId, string ValueJson)> answers,
        CancellationToken ct);
    Task<byte[]> ExportExcelAsync(Guid id, CancellationToken ct);
}
