using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class ShareLinkService(AppDbContext db) : IShareLinkService
{
    private static string GenerateToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(24);
        return Convert.ToBase64String(bytes)
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');
    }

    public async Task<ShareLinkDto> GetOrCreateAsync(
        ShareableEntityType entityType, Guid entityId,
        string createdByObjectId, DateTime? expiresAtUtc = null)
    {
        var existing = await db.ShareLinks
            .FirstOrDefaultAsync(s => s.EntityType == entityType
                && s.EntityId == entityId && s.IsActive);

        if (existing is not null)
            return ToDto(existing);

        var link = new ShareLink
        {
            EntityType = entityType,
            EntityId = entityId,
            Token = GenerateToken(),
            CreatedByObjectId = createdByObjectId,
            ExpiresAtUtc = expiresAtUtc,
        };

        db.ShareLinks.Add(link);
        await db.SaveChangesAsync();
        return ToDto(link);
    }

    public async Task<ShareLinkDto?> GetByEntityAsync(
        ShareableEntityType entityType, Guid entityId)
    {
        var link = await db.ShareLinks.AsNoTracking()
            .FirstOrDefaultAsync(s => s.EntityType == entityType
                && s.EntityId == entityId && s.IsActive);
        return link is null ? null : ToDto(link);
    }

    public async Task<PublicShareData> ResolveTokenAsync(string token)
    {
        var link = await db.ShareLinks
            .FirstOrDefaultAsync(s => s.Token == token && s.IsActive);

        if (link is null)
            throw new NotFoundException("ShareLink", token);

        if (link.ExpiresAtUtc.HasValue && link.ExpiresAtUtc < DateTime.UtcNow)
            throw new ConflictException("This share link has expired.", "SHARE_LINK_EXPIRED");

        link.ScanCount++;
        await db.SaveChangesAsync();

        object entityData = link.EntityType switch
        {
            ShareableEntityType.Meeting => await GetMeetingPublicData(link.EntityId),
            ShareableEntityType.Committee => await GetCommitteePublicData(link.EntityId),
            ShareableEntityType.Directive => await GetDirectivePublicData(link.EntityId),
            ShareableEntityType.Mom => await GetMomPublicData(link.EntityId),
            ShareableEntityType.Location => await GetLocationPublicData(link.EntityId),
            ShareableEntityType.Attendance => await GetAttendancePublicData(link.EntityId),
            _ => throw new ConflictException("Unsupported entity type.", "INVALID_ENTITY_TYPE"),
        };

        return new PublicShareData(link.EntityType, link.Token, entityData);
    }

    public async Task DeactivateAsync(Guid shareLinkId)
    {
        var link = await db.ShareLinks.FindAsync(shareLinkId)
            ?? throw new NotFoundException("ShareLink", shareLinkId);
        link.IsActive = false;
        await db.SaveChangesAsync();
    }

    // ───── Private entity resolution methods ─────

    private async Task<object> GetMeetingPublicData(Guid id)
    {
        var m = await db.Meetings
            .Include(x => x.AgendaItems)
            .Include(x => x.Committee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Meeting", id);

        return new
        {
            m.TitleAr, m.TitleEn,
            m.DescriptionAr, m.DescriptionEn,
            Type = m.Type.ToString(),
            Status = m.Status.ToString(),
            m.StartDateTimeUtc, m.EndDateTimeUtc,
            m.Location,
            OnlineJoinUrl = (m.Status == MeetingStatus.Scheduled || m.Status == MeetingStatus.InProgress) ? m.OnlineJoinUrl : null,
            CommitteeNameAr = m.Committee?.NameAr,
            CommitteeNameEn = m.Committee?.NameEn,
            Agenda = m.AgendaItems.OrderBy(a => a.Order).Select(a => new
            {
                a.Order, a.TitleAr, a.TitleEn, a.DurationMinutes, a.PresenterName,
            }),
        };
    }

    private async Task<object> GetCommitteePublicData(Guid id)
    {
        var c = await db.Committees
            .Include(x => x.Members.Where(m => m.IsActive))
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Committee", id);

        return new
        {
            c.NameAr, c.NameEn,
            c.DescriptionAr, c.DescriptionEn,
            c.ObjectivesAr, c.ObjectivesEn,
            Type = c.Type.ToString(),
            Status = c.Status.ToString(),
            c.StartDate, c.EndDate,
            Members = c.Members.Select(m => new { m.DisplayName, m.Role }),
        };
    }

    private async Task<object> GetDirectivePublicData(Guid id)
    {
        var d = await db.Directives
            .Include(x => x.Decisions)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Directive", id);

        return new
        {
            d.TitleAr, d.TitleEn,
            d.DescriptionAr, d.DescriptionEn,
            d.IssuedBy, d.ReferenceNumber,
            Status = d.Status.ToString(),
            d.IssueDateUtc,
            Decisions = d.Decisions.Select(dec => new
            {
                dec.TitleAr, dec.TitleEn,
                Status = dec.Status.ToString(),
                dec.NotesAr, dec.NotesEn,
            }),
        };
    }

    private async Task<object> GetMomPublicData(Guid id)
    {
        var m = await db.Moms
            .Include(x => x.Meeting)
            .Include(x => x.Decisions)
            .Include(x => x.Recommendations)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Mom", id);

        return new
        {
            MeetingTitleAr = m.Meeting?.TitleAr,
            MeetingTitleEn = m.Meeting?.TitleEn,
            MeetingDate = m.Meeting?.StartDateTimeUtc,
            Status = m.Status.ToString(),
            m.ApprovedAtUtc,
            m.PdfDocUrl,
            Decisions = m.Decisions.Select(d => new { d.TitleAr, d.TitleEn }),
            Recommendations = m.Recommendations.Select(r => new
            {
                r.TitleAr, r.TitleEn,
                Status = r.Status.ToString(),
                Priority = r.Priority.ToString(),
                r.DueDateUtc, r.Progress,
            }),
        };
    }

    private async Task<object> GetLocationPublicData(Guid id)
    {
        var loc = await db.Locations
            .Include(x => x.ParentLocation)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException("Location", id);

        return new
        {
            loc.NameAr, loc.NameEn,
            loc.DescriptionAr, loc.DescriptionEn,
            Type = loc.Type.ToString(),
            loc.Building, loc.Floor, loc.RoomNumber,
            loc.Latitude, loc.Longitude,
            loc.MapImageUrl,
            ParentLocationNameAr = loc.ParentLocation?.NameAr,
            ParentLocationNameEn = loc.ParentLocation?.NameEn,
        };
    }

    private async Task<object> GetAttendancePublicData(Guid meetingId)
    {
        var m = await db.Meetings
            .Include(x => x.Committee)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == meetingId)
            ?? throw new NotFoundException("Meeting", meetingId);

        return new
        {
            m.Id,
            m.TitleAr, m.TitleEn,
            Status = m.Status.ToString(),
            m.StartDateTimeUtc, m.EndDateTimeUtc,
            m.Location,
            CommitteeNameAr = m.Committee?.NameAr,
            CommitteeNameEn = m.Committee?.NameEn,
        };
    }

    private static ShareLinkDto ToDto(ShareLink link) => new(
        link.Id, link.EntityType, link.EntityId, link.Token,
        link.IsActive, link.CreatedAtUtc, link.ExpiresAtUtc, link.ScanCount
    );
}
