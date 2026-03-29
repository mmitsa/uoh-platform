using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class AcknowledgmentService(AppDbContext db, ICacheService cache) : IAcknowledgmentService
{
    private const string CachePrefix = "acknowledgments";

    public async Task<(int Total, List<object> Items)> ListTemplatesAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.AcknowledgmentTemplates.AsNoTracking().OrderByDescending(t => t.CreatedAtUtc);
        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => (object)new
            {
                t.Id,
                t.TitleAr,
                t.TitleEn,
                t.Category,
                t.Version,
                t.IsMandatory,
                t.RequiresRenewal,
                t.RenewalDays,
                t.AppliesToRoles,
                t.Status,
                t.CreatedAtUtc,
                t.PublishedAtUtc,
                SignatureCount = t.UserAcknowledgments.Count(ua => ua.IsActive),
            })
            .ToListAsync(ct);

        return (total, items);
    }

    public async Task<AcknowledgmentTemplate> GetTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var template = await db.AcknowledgmentTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id, ct)
            ?? throw new NotFoundException("AcknowledgmentTemplate", id);

        return template;
    }

    public async Task<AcknowledgmentTemplate> CreateTemplateAsync(
        string titleAr, string titleEn, string bodyAr, string bodyEn,
        AcknowledgmentCategory category, bool isMandatory,
        bool requiresRenewal, int? renewalDays, string? appliesToRoles,
        CancellationToken ct = default)
    {
        var template = new AcknowledgmentTemplate
        {
            TitleAr = titleAr,
            TitleEn = titleEn,
            BodyAr = bodyAr,
            BodyEn = bodyEn,
            Category = category,
            IsMandatory = isMandatory,
            RequiresRenewal = requiresRenewal,
            RenewalDays = renewalDays,
            AppliesToRoles = appliesToRoles,
        };

        db.AcknowledgmentTemplates.Add(template);
        await db.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync(CachePrefix, ct);
        return template;
    }

    public async Task<AcknowledgmentTemplate> UpdateTemplateAsync(
        Guid id, string titleAr, string titleEn, string bodyAr, string bodyEn,
        AcknowledgmentCategory category, bool isMandatory,
        bool requiresRenewal, int? renewalDays, string? appliesToRoles,
        CancellationToken ct = default)
    {
        var template = await db.AcknowledgmentTemplates.FindAsync([id], ct)
            ?? throw new NotFoundException("AcknowledgmentTemplate", id);

        var contentChanged = template.BodyAr != bodyAr || template.BodyEn != bodyEn
            || template.TitleAr != titleAr || template.TitleEn != titleEn;

        template.TitleAr = titleAr;
        template.TitleEn = titleEn;
        template.BodyAr = bodyAr;
        template.BodyEn = bodyEn;
        template.Category = category;
        template.IsMandatory = isMandatory;
        template.RequiresRenewal = requiresRenewal;
        template.RenewalDays = renewalDays;
        template.AppliesToRoles = appliesToRoles;
        template.UpdatedAtUtc = DateTime.UtcNow;

        // If content changed and template is active, bump version and invalidate existing signatures
        if (contentChanged && template.Status == AcknowledgmentStatus.Active)
        {
            template.Version++;
            await db.UserAcknowledgments
                .Where(ua => ua.TemplateId == id && ua.IsActive)
                .ExecuteUpdateAsync(s => s.SetProperty(ua => ua.IsActive, false), ct);
        }

        await db.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync(CachePrefix, ct);
        return template;
    }

    public async Task<AcknowledgmentTemplate> PublishTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var template = await db.AcknowledgmentTemplates.FindAsync([id], ct)
            ?? throw new NotFoundException("AcknowledgmentTemplate", id);

        template.Status = AcknowledgmentStatus.Active;
        template.PublishedAtUtc = DateTime.UtcNow;
        template.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync(CachePrefix, ct);
        return template;
    }

    public async Task<AcknowledgmentTemplate> ArchiveTemplateAsync(Guid id, CancellationToken ct = default)
    {
        var template = await db.AcknowledgmentTemplates.FindAsync([id], ct)
            ?? throw new NotFoundException("AcknowledgmentTemplate", id);

        template.Status = AcknowledgmentStatus.Archived;
        template.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync(CachePrefix, ct);
        return template;
    }

    public async Task<List<object>> GetPendingForUserAsync(Guid userId, string[] userRoles, CancellationToken ct = default)
    {
        var activeTemplates = await db.AcknowledgmentTemplates
            .AsNoTracking()
            .Where(t => t.Status == AcknowledgmentStatus.Active)
            .ToListAsync(ct);

        var userAcks = await db.UserAcknowledgments
            .AsNoTracking()
            .Where(ua => ua.UserId == userId && ua.IsActive)
            .ToListAsync(ct);

        var pending = new List<object>();

        foreach (var template in activeTemplates)
        {
            if (!IsTemplateApplicable(template, userRoles))
                continue;

            var ack = userAcks.FirstOrDefault(ua => ua.TemplateId == template.Id);

            // Pending if: never acknowledged, version mismatch, or expired
            var isPending = ack is null
                || ack.TemplateVersion < template.Version
                || (ack.ExpiresAtUtc.HasValue && ack.ExpiresAtUtc.Value <= DateTime.UtcNow);

            if (isPending)
            {
                pending.Add(new
                {
                    template.Id,
                    template.TitleAr,
                    template.TitleEn,
                    template.BodyAr,
                    template.BodyEn,
                    template.Category,
                    template.Version,
                    template.IsMandatory,
                });
            }
        }

        return pending;
    }

    public async Task<UserAcknowledgment> AcknowledgeAsync(Guid userId, Guid templateId, string? ip, string? userAgent, CancellationToken ct = default)
    {
        var template = await db.AcknowledgmentTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == templateId && t.Status == AcknowledgmentStatus.Active, ct)
            ?? throw new NotFoundException("AcknowledgmentTemplate", templateId);

        // Deactivate any previous acknowledgments for this user + template
        await db.UserAcknowledgments
            .Where(ua => ua.UserId == userId && ua.TemplateId == templateId && ua.IsActive)
            .ExecuteUpdateAsync(s => s.SetProperty(ua => ua.IsActive, false), ct);

        var acknowledgment = new UserAcknowledgment
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateVersion = template.Version,
            IpAddress = ip,
            UserAgent = userAgent,
            ExpiresAtUtc = template.RequiresRenewal && template.RenewalDays.HasValue
                ? DateTime.UtcNow.AddDays(template.RenewalDays.Value)
                : null,
        };

        db.UserAcknowledgments.Add(acknowledgment);
        await db.SaveChangesAsync(ct);
        await cache.RemoveByPrefixAsync(CachePrefix, ct);
        return acknowledgment;
    }

    public async Task<List<object>> GetUserHistoryAsync(Guid userId, CancellationToken ct = default)
    {
        var history = await db.UserAcknowledgments
            .AsNoTracking()
            .Where(ua => ua.UserId == userId)
            .OrderByDescending(ua => ua.AcknowledgedAtUtc)
            .Select(ua => (object)new
            {
                ua.Id,
                ua.TemplateId,
                TemplateTitleAr = ua.Template!.TitleAr,
                TemplateTitleEn = ua.Template.TitleEn,
                ua.Template.Category,
                ua.TemplateVersion,
                ua.AcknowledgedAtUtc,
                ua.ExpiresAtUtc,
                ua.IsActive,
            })
            .ToListAsync(ct);

        return history;
    }

    public async Task<(int Total, List<object> Items)> GetTemplateSignaturesAsync(Guid templateId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = db.UserAcknowledgments
            .AsNoTracking()
            .Where(ua => ua.TemplateId == templateId && ua.IsActive)
            .OrderByDescending(ua => ua.AcknowledgedAtUtc);

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ua => (object)new
            {
                ua.Id,
                ua.UserId,
                UserDisplayNameAr = ua.User!.DisplayNameAr,
                UserDisplayNameEn = ua.User.DisplayNameEn,
                UserEmail = ua.User.Email,
                ua.TemplateVersion,
                ua.AcknowledgedAtUtc,
                ua.ExpiresAtUtc,
                ua.IpAddress,
            })
            .ToListAsync(ct);

        return (total, items);
    }

    public async Task<bool> HasPendingMandatoryAsync(Guid userId, string[] userRoles, CancellationToken ct = default)
    {
        var mandatoryTemplates = await db.AcknowledgmentTemplates
            .AsNoTracking()
            .Where(t => t.Status == AcknowledgmentStatus.Active && t.IsMandatory)
            .ToListAsync(ct);

        if (mandatoryTemplates.Count == 0)
            return false;

        var userAcks = await db.UserAcknowledgments
            .AsNoTracking()
            .Where(ua => ua.UserId == userId && ua.IsActive)
            .ToListAsync(ct);

        foreach (var template in mandatoryTemplates)
        {
            if (!IsTemplateApplicable(template, userRoles))
                continue;

            var ack = userAcks.FirstOrDefault(ua => ua.TemplateId == template.Id);
            if (ack is null || ack.TemplateVersion < template.Version
                || (ack.ExpiresAtUtc.HasValue && ack.ExpiresAtUtc.Value <= DateTime.UtcNow))
            {
                return true;
            }
        }

        return false;
    }

    private static bool IsTemplateApplicable(AcknowledgmentTemplate template, string[] userRoles)
    {
        if (string.IsNullOrEmpty(template.AppliesToRoles))
            return true;

        var requiredRoles = template.AppliesToRoles.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return requiredRoles.Any(r => userRoles.Contains(r, StringComparer.OrdinalIgnoreCase));
    }
}
