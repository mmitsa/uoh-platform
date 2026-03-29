using System.Text.Json;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class SurveyService(AppDbContext db, INotificationService notifications) : ISurveyService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, SurveyStatus? status)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var q = db.Surveys.AsNoTracking();
        if (status.HasValue) q = q.Where(s => s.Status == status.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(s => s.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new
            {
                s.Id,
                s.TitleAr,
                s.TitleEn,
                s.Type,
                s.TargetAudience,
                s.Status,
                s.StartAtUtc,
                s.EndAtUtc,
            })
            .ToListAsync();

        return (total, items.Cast<object>().ToList());
    }

    public async Task<Survey> GetAsync(Guid id)
    {
        var survey = await db.Surveys
            .AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), id);

        return survey;
    }

    public async Task<Survey> CreateAsync(
        string type,
        string targetAudience,
        string titleAr,
        string titleEn,
        DateTime startAtUtc,
        DateTime endAtUtc,
        bool allowLuckyDraw,
        List<(int Order, SurveyQuestionType Type, string TextAr, string TextEn, List<string>? Options)> questions)
    {
        if (endAtUtc <= startAtUtc)
            throw new Exceptions.ValidationException("EndAtUtc", "EndAtUtc must be after StartAtUtc.");

        if (string.IsNullOrWhiteSpace(titleAr) || string.IsNullOrWhiteSpace(titleEn))
            throw new Exceptions.ValidationException("Title", "TitleAr and TitleEn are required.");

        var survey = new Survey
        {
            Type = type,
            TargetAudience = targetAudience,
            TitleAr = titleAr.Trim(),
            TitleEn = titleEn.Trim(),
            StartAtUtc = startAtUtc,
            EndAtUtc = endAtUtc,
            AllowLuckyDraw = allowLuckyDraw,
            Status = SurveyStatus.Draft,
            Questions = questions
                .OrderBy(q => q.Order)
                .Select(q => new SurveyQuestion
                {
                    Order = q.Order,
                    Type = q.Type,
                    TextAr = q.TextAr.Trim(),
                    TextEn = q.TextEn.Trim(),
                    OptionsJson = q.Options is null ? null : JsonSerializer.Serialize(q.Options),
                })
                .ToList(),
        };

        db.Surveys.Add(survey);
        await db.SaveChangesAsync();

        return survey;
    }

    public async Task ActivateAsync(Guid id)
    {
        var survey = await db.Surveys.FirstOrDefaultAsync(s => s.Id == id);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), id);

        if (survey.Status != SurveyStatus.Draft)
            throw new Exceptions.ValidationException("Status", "Survey must be in Draft status to activate.");

        survey.Status = SurveyStatus.Active;
        await db.SaveChangesAsync();

        // Notify all active committee members — fire-and-forget
        try
        {
            var members = await db.Set<CommitteeMember>()
                .AsNoTracking()
                .Where(cm => cm.IsActive && cm.Email != null)
                .Select(cm => new { cm.UserObjectId, cm.Email })
                .Distinct()
                .ToListAsync();
            var payloads = members.Select(m => new NotificationPayload(
                RecipientObjectId: m.UserObjectId,
                RecipientEmail: m.Email,
                Type: "SurveyActivated",
                TitleAr: $"استبيان جديد: {survey.TitleAr}",
                TitleEn: $"New survey: {survey.TitleEn}",
                EntityType: "Survey",
                EntityId: survey.Id,
                ActionUrl: "/surveys")).ToList();
            if (payloads.Count > 0)
                await notifications.NotifyManyAsync(payloads);
        }
        catch { /* notification failure must not block the main operation */ }
    }

    public async Task CloseAsync(Guid id)
    {
        var survey = await db.Surveys.FirstOrDefaultAsync(s => s.Id == id);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), id);

        if (survey.Status != SurveyStatus.Active)
            throw new Exceptions.ValidationException("Status", "Survey must be in Active status to close.");

        survey.Status = SurveyStatus.Closed;
        await db.SaveChangesAsync();
    }

    public async Task<SurveyResponse> SubmitResponseAsync(
        Guid surveyId,
        string? respondentOid,
        List<(Guid QuestionId, string ValueJson)> answers,
        CancellationToken ct)
    {
        var survey = await db.Surveys
            .AsNoTracking()
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == surveyId, ct);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), surveyId);

        if (survey.Status != SurveyStatus.Active)
            throw new Exceptions.ValidationException("Status", "Survey is not active.");

        if (DateTime.UtcNow < survey.StartAtUtc || DateTime.UtcNow > survey.EndAtUtc)
            throw new Exceptions.ValidationException("SurveyWindow", "Survey is outside the submission window.");

        var validQuestionIds = survey.Questions.Select(q => q.Id).ToHashSet();
        if (answers.Any(a => !validQuestionIds.Contains(a.QuestionId)))
            throw new Exceptions.ValidationException("QuestionId", "One or more question IDs are invalid for this survey.");

        var response = new SurveyResponse
        {
            SurveyId = surveyId,
            RespondentObjectId = respondentOid,
            Answers = answers.Select(a => new SurveyAnswer
            {
                SurveyQuestionId = a.QuestionId,
                ValueJson = a.ValueJson,
            }).ToList(),
        };

        db.SurveyResponses.Add(response);
        await db.SaveChangesAsync(ct);

        return response;
    }

    public async Task<byte[]> ExportExcelAsync(Guid id, CancellationToken ct)
    {
        var survey = await db.Surveys
            .AsNoTracking()
            .Include(s => s.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (survey is null)
            throw new NotFoundException(nameof(Survey), id);

        var responses = await db.SurveyResponses
            .AsNoTracking()
            .Where(r => r.SurveyId == id)
            .Include(r => r.Answers)
            .OrderByDescending(r => r.SubmittedAtUtc)
            .ToListAsync(ct);

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("responses");

        // Header row
        ws.Cell(1, 1).Value = "submittedAtUtc";
        ws.Cell(1, 2).Value = "respondentObjectId";

        for (var i = 0; i < survey.Questions.Count; i++)
        {
            ws.Cell(1, 3 + i).Value = $"Q{i + 1}: {survey.Questions[i].TextEn}";
        }

        // Data rows
        for (var r = 0; r < responses.Count; r++)
        {
            var row = 2 + r;
            ws.Cell(row, 1).Value = responses[r].SubmittedAtUtc.ToString("o");
            ws.Cell(row, 2).Value = responses[r].RespondentObjectId ?? "";

            var answerByQ = responses[r].Answers.ToDictionary(a => a.SurveyQuestionId, a => a.ValueJson);
            for (var i = 0; i < survey.Questions.Count; i++)
            {
                answerByQ.TryGetValue(survey.Questions[i].Id, out var val);
                ws.Cell(row, 3 + i).Value = val ?? "";
            }
        }

        ws.Columns().AdjustToContents();

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }
}
