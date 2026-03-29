using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.EvaluationsController;

namespace UohMeetings.Api.Services;

public sealed class EvaluationService(AppDbContext db, ICacheService cache) : IEvaluationService
{
    // ─── Templates ───

    public async Task<(int Total, List<object> Items)> ListTemplatesAsync(int page, int pageSize)
    {
        var q = db.EvaluationTemplates.AsNoTracking().Where(t => t.IsActive);
        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                t.Id, t.NameAr, t.NameEn, t.DescriptionAr, t.DescriptionEn,
                t.MaxScore, CriteriaCount = t.Criteria.Count, t.CreatedAtUtc,
            })
            .ToListAsync();
        return (total, items.Cast<object>().ToList());
    }

    public async Task<EvaluationTemplate> GetTemplateAsync(Guid id)
    {
        return await db.EvaluationTemplates
            .Include(t => t.Criteria.OrderBy(c => c.SortOrder))
            .FirstOrDefaultAsync(t => t.Id == id)
            ?? throw new KeyNotFoundException($"Template {id} not found.");
    }

    public async Task<EvaluationTemplate> CreateTemplateAsync(CreateTemplateRequest request)
    {
        var template = new EvaluationTemplate
        {
            NameAr = request.NameAr.Trim(),
            NameEn = request.NameEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim(),
            DescriptionEn = request.DescriptionEn?.Trim(),
            MaxScore = request.MaxScore ?? 100,
        };

        if (request.Criteria is { Count: > 0 })
        {
            for (var i = 0; i < request.Criteria.Count; i++)
            {
                var c = request.Criteria[i];
                template.Criteria.Add(new EvaluationCriteria
                {
                    LabelAr = c.LabelAr.Trim(),
                    LabelEn = c.LabelEn.Trim(),
                    DescriptionAr = c.DescriptionAr?.Trim(),
                    DescriptionEn = c.DescriptionEn?.Trim(),
                    MaxScore = c.MaxScore ?? 10,
                    Weight = c.Weight ?? 1,
                    SortOrder = i,
                });
            }
        }

        db.EvaluationTemplates.Add(template);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("evaluations:");
        return template;
    }

    public async Task<EvaluationTemplate> UpdateTemplateAsync(Guid id, UpdateTemplateRequest request)
    {
        var template = await db.EvaluationTemplates.FindAsync(id)
            ?? throw new KeyNotFoundException($"Template {id} not found.");

        if (request.NameAr is not null) template.NameAr = request.NameAr.Trim();
        if (request.NameEn is not null) template.NameEn = request.NameEn.Trim();
        if (request.IsActive is not null) template.IsActive = request.IsActive.Value;
        template.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("evaluations:");
        return template;
    }

    // ─── Evaluations ───

    public async Task<(int Total, List<object> Items)> ListEvaluationsAsync(int page, int pageSize, Guid? committeeId)
    {
        var q = db.CommitteeEvaluations.AsNoTracking();
        if (committeeId.HasValue) q = q.Where(e => e.CommitteeId == committeeId.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(e => e.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(e => e.Committee)
            .Include(e => e.Template)
            .Select(e => new
            {
                e.Id, e.CommitteeId,
                CommitteeNameAr = e.Committee != null ? e.Committee.NameAr : "",
                CommitteeNameEn = e.Committee != null ? e.Committee.NameEn : "",
                TemplateNameAr = e.Template != null ? e.Template.NameAr : "",
                TemplateNameEn = e.Template != null ? e.Template.NameEn : "",
                e.EvaluatorDisplayName, e.Status,
                e.PeriodStart, e.PeriodEnd,
                e.ScorePercentage, e.CreatedAtUtc,
            })
            .ToListAsync();
        return (total, items.Cast<object>().ToList());
    }

    public async Task<CommitteeEvaluation> GetEvaluationAsync(Guid id)
    {
        return await db.CommitteeEvaluations
            .Include(e => e.Responses).ThenInclude(r => r.Criteria)
            .Include(e => e.Committee)
            .Include(e => e.Template).ThenInclude(t => t!.Criteria)
            .FirstOrDefaultAsync(e => e.Id == id)
            ?? throw new KeyNotFoundException($"Evaluation {id} not found.");
    }

    public async Task<CommitteeEvaluation> CreateEvaluationAsync(CreateEvaluationRequest request)
    {
        var evaluation = new CommitteeEvaluation
        {
            CommitteeId = request.CommitteeId,
            TemplateId = request.TemplateId,
            EvaluatorObjectId = request.EvaluatorObjectId,
            EvaluatorDisplayName = request.EvaluatorDisplayName,
            PeriodStart = request.PeriodStart,
            PeriodEnd = request.PeriodEnd,
            Status = EvaluationStatus.Draft,
        };

        var template = await db.EvaluationTemplates
            .Include(t => t.Criteria)
            .FirstOrDefaultAsync(t => t.Id == request.TemplateId)
            ?? throw new KeyNotFoundException($"Template {request.TemplateId} not found.");

        evaluation.MaxPossibleScore = template.Criteria.Sum(c => c.MaxScore * c.Weight);

        db.CommitteeEvaluations.Add(evaluation);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("evaluations:");
        return evaluation;
    }

    public async Task<CommitteeEvaluation> SubmitResponsesAsync(Guid evaluationId, SubmitResponsesRequest request)
    {
        var evaluation = await db.CommitteeEvaluations
            .Include(e => e.Responses)
            .Include(e => e.Template).ThenInclude(t => t!.Criteria)
            .FirstOrDefaultAsync(e => e.Id == evaluationId)
            ?? throw new KeyNotFoundException($"Evaluation {evaluationId} not found.");

        // Clear existing responses and add new ones
        evaluation.Responses.Clear();
        foreach (var r in request.Responses)
        {
            evaluation.Responses.Add(new EvaluationResponse
            {
                EvaluationId = evaluationId,
                CriteriaId = r.CriteriaId,
                Score = r.Score,
                Notes = r.Notes?.Trim(),
            });
        }

        // Calculate totals
        var criteriaMap = evaluation.Template!.Criteria.ToDictionary(c => c.Id);
        evaluation.TotalScore = evaluation.Responses
            .Where(r => criteriaMap.ContainsKey(r.CriteriaId))
            .Sum(r => r.Score * criteriaMap[r.CriteriaId].Weight);
        evaluation.MaxPossibleScore = criteriaMap.Values.Sum(c => c.MaxScore * c.Weight);
        evaluation.ScorePercentage = evaluation.MaxPossibleScore > 0
            ? Math.Round(evaluation.TotalScore / evaluation.MaxPossibleScore * 100, 1)
            : 0;

        if (request.OverallNotesAr is not null) evaluation.OverallNotesAr = request.OverallNotesAr.Trim();
        if (request.OverallNotesEn is not null) evaluation.OverallNotesEn = request.OverallNotesEn.Trim();

        evaluation.Status = EvaluationStatus.Completed;
        evaluation.CompletedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("evaluations:");
        return evaluation;
    }
}
