using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.DirectivesController;

namespace UohMeetings.Api.Services;

public sealed class DirectiveService(AppDbContext db, ICacheService cache) : IDirectiveService
{
    public async Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, DirectiveStatus? status)
    {
        var q = db.Directives.AsNoTracking();
        if (status.HasValue) q = q.Where(d => d.Status == status.Value);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(d => d.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new
            {
                d.Id, d.TitleAr, d.TitleEn, d.DescriptionAr, d.DescriptionEn,
                d.IssuedBy, d.ReferenceNumber, d.Status,
                d.IssueDateUtc, d.CreatedAtUtc,
                DecisionCount = d.Decisions.Count,
            })
            .ToListAsync();

        return (total, items.Cast<object>().ToList());
    }

    public async Task<Directive> GetAsync(Guid id)
    {
        return await db.Directives
            .Include(d => d.Decisions).ThenInclude(dec => dec.Committee)
            .FirstOrDefaultAsync(d => d.Id == id)
            ?? throw new KeyNotFoundException($"Directive {id} not found.");
    }

    public async Task<Directive> CreateAsync(CreateDirectiveRequest request)
    {
        var directive = new Directive
        {
            TitleAr = request.TitleAr.Trim(),
            TitleEn = request.TitleEn.Trim(),
            DescriptionAr = request.DescriptionAr?.Trim() ?? "",
            DescriptionEn = request.DescriptionEn?.Trim() ?? "",
            IssuedBy = request.IssuedBy?.Trim() ?? "",
            ReferenceNumber = request.ReferenceNumber?.Trim(),
            Status = DirectiveStatus.Draft,
        };

        db.Directives.Add(directive);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("directives:");
        return directive;
    }

    public async Task<Directive> UpdateAsync(Guid id, UpdateDirectiveRequest request)
    {
        var directive = await db.Directives.FindAsync(id)
            ?? throw new KeyNotFoundException($"Directive {id} not found.");

        if (request.TitleAr is not null) directive.TitleAr = request.TitleAr.Trim();
        if (request.TitleEn is not null) directive.TitleEn = request.TitleEn.Trim();
        if (request.DescriptionAr is not null) directive.DescriptionAr = request.DescriptionAr.Trim();
        if (request.DescriptionEn is not null) directive.DescriptionEn = request.DescriptionEn.Trim();
        if (request.Status is not null) directive.Status = request.Status.Value;
        directive.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("directives:");
        return directive;
    }

    public async Task<DirectiveDecision> AddDecisionAsync(Guid directiveId, CreateDecisionRequest request)
    {
        var exists = await db.Directives.AnyAsync(d => d.Id == directiveId);
        if (!exists) throw new KeyNotFoundException($"Directive {directiveId} not found.");

        var decision = new DirectiveDecision
        {
            DirectiveId = directiveId,
            TitleAr = request.TitleAr.Trim(),
            TitleEn = request.TitleEn.Trim(),
            NotesAr = request.NotesAr?.Trim(),
            NotesEn = request.NotesEn?.Trim(),
            CommitteeId = request.CommitteeId,
            Status = DecisionStatus.Draft,
        };

        db.DirectiveDecisions.Add(decision);
        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("directives:");
        return decision;
    }

    public async Task<DirectiveDecision> UpdateDecisionAsync(Guid decisionId, UpdateDecisionRequest request)
    {
        var decision = await db.DirectiveDecisions.FindAsync(decisionId)
            ?? throw new KeyNotFoundException($"Decision {decisionId} not found.");

        if (request.TitleAr is not null) decision.TitleAr = request.TitleAr.Trim();
        if (request.TitleEn is not null) decision.TitleEn = request.TitleEn.Trim();
        if (request.NotesAr is not null) decision.NotesAr = request.NotesAr.Trim();
        if (request.NotesEn is not null) decision.NotesEn = request.NotesEn.Trim();
        if (request.Status is not null) decision.Status = request.Status.Value;
        if (request.CommitteeId is not null) decision.CommitteeId = request.CommitteeId;
        decision.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveByPrefixAsync("directives:");
        return decision;
    }

    public async Task<List<object>> GetDecisionsAsync(Guid directiveId)
    {
        return await db.DirectiveDecisions.AsNoTracking()
            .Where(d => d.DirectiveId == directiveId)
            .Include(d => d.Committee)
            .OrderBy(d => d.CreatedAtUtc)
            .Select(d => (object)new
            {
                d.Id, d.TitleAr, d.TitleEn, d.NotesAr, d.NotesEn, d.Status,
                d.CommitteeId, CommitteeNameAr = d.Committee != null ? d.Committee.NameAr : null,
                CommitteeNameEn = d.Committee != null ? d.Committee.NameEn : null,
                d.CreatedAtUtc,
            })
            .ToListAsync();
    }
}
