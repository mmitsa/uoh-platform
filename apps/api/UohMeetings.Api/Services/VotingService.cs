using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Services;

public sealed class VotingService(AppDbContext db, INotificationService notifications) : IVotingService
{
    public async Task<List<object>> ListByMeetingAsync(Guid meetingId)
    {
        var items = await db.VoteSessions
            .AsNoTracking()
            .Where(v => v.MeetingId == meetingId)
            .OrderByDescending(v => v.CreatedAtUtc)
            .Select(v => new
            {
                v.Id,
                v.MeetingId,
                v.Title,
                v.Status,
                v.OpenedAtUtc,
                v.ClosedAtUtc,
            })
            .ToListAsync();

        return items.Cast<object>().ToList();
    }

    public async Task<VoteSession> CreateAsync(Guid meetingId, string title, List<string> options)
    {
        if (options.Count < 2)
            throw new Exceptions.ValidationException("Options", "At least 2 options are required.");

        var vote = new VoteSession
        {
            MeetingId = meetingId,
            Title = title.Trim(),
            Status = VoteSessionStatus.Draft,
            Options = options
                .Select((label, idx) => new VoteOption
                {
                    Label = label.Trim(),
                    Order = idx + 1,
                })
                .ToList(),
        };

        db.VoteSessions.Add(vote);
        await db.SaveChangesAsync();

        return vote;
    }

    public async Task OpenAsync(Guid id)
    {
        var vote = await db.VoteSessions.FirstOrDefaultAsync(v => v.Id == id);

        if (vote is null)
            throw new NotFoundException(nameof(VoteSession), id);

        if (vote.Status != VoteSessionStatus.Draft)
            throw new Exceptions.ValidationException("Status", "Vote session must be in Draft status to open.");

        vote.Status = VoteSessionStatus.Open;
        vote.OpenedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Notify meeting invitees — fire-and-forget
        try
        {
            var invitees = await db.Set<MeetingInvitee>()
                .AsNoTracking()
                .Where(i => i.MeetingId == vote.MeetingId && i.Email != null)
                .ToListAsync();
            var payloads = invitees.Select(i => new NotificationPayload(
                RecipientObjectId: i.Email!,
                RecipientEmail: i.Email,
                Type: "VoteOpened",
                TitleAr: $"تم فتح التصويت: {vote.Title}",
                TitleEn: $"Voting opened: {vote.Title}",
                EntityType: "VoteSession",
                EntityId: vote.Id,
                ActionUrl: "/votes")).ToList();
            if (payloads.Count > 0)
                await notifications.NotifyManyAsync(payloads);
        }
        catch { /* notification failure must not block the main operation */ }
    }

    public async Task CastBallotAsync(Guid sessionId, Guid selectedOptionId, string voterOid, string? voterDisplayName)
    {
        var vote = await db.VoteSessions
            .AsNoTracking()
            .Include(v => v.Options)
            .FirstOrDefaultAsync(v => v.Id == sessionId);

        if (vote is null)
            throw new NotFoundException(nameof(VoteSession), sessionId);

        if (vote.Status != VoteSessionStatus.Open)
            throw new Exceptions.ValidationException("Status", "Vote session is not open for voting.");

        if (!vote.Options.Any(o => o.Id == selectedOptionId))
            throw new Exceptions.ValidationException("SelectedOptionId", "The selected option does not belong to this vote session.");

        var alreadyVoted = await db.VoteBallots
            .AnyAsync(b => b.VoteSessionId == sessionId && b.VoterObjectId == voterOid);

        if (alreadyVoted)
            throw new ConflictException("You have already cast a ballot in this vote session.");

        db.VoteBallots.Add(new VoteBallot
        {
            VoteSessionId = sessionId,
            VoterObjectId = voterOid,
            VoterDisplayName = voterDisplayName,
            SelectedOptionId = selectedOptionId,
        });

        await db.SaveChangesAsync();
    }

    public async Task CloseAsync(Guid id)
    {
        var vote = await db.VoteSessions.FirstOrDefaultAsync(v => v.Id == id);

        if (vote is null)
            throw new NotFoundException(nameof(VoteSession), id);

        if (vote.Status != VoteSessionStatus.Open)
            throw new Exceptions.ValidationException("Status", "Vote session must be in Open status to close.");

        vote.Status = VoteSessionStatus.Closed;
        vote.ClosedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // Notify meeting invitees — fire-and-forget
        try
        {
            var invitees = await db.Set<MeetingInvitee>()
                .AsNoTracking()
                .Where(i => i.MeetingId == vote.MeetingId && i.Email != null)
                .ToListAsync();
            var payloads = invitees.Select(i => new NotificationPayload(
                RecipientObjectId: i.Email!,
                RecipientEmail: i.Email,
                Type: "VoteClosed",
                TitleAr: $"تم إغلاق التصويت: {vote.Title}",
                TitleEn: $"Voting closed: {vote.Title}",
                EntityType: "VoteSession",
                EntityId: vote.Id,
                ActionUrl: "/votes")).ToList();
            if (payloads.Count > 0)
                await notifications.NotifyManyAsync(payloads);
        }
        catch { /* notification failure must not block the main operation */ }
    }

    public async Task<object> GetResultsAsync(Guid id)
    {
        var vote = await db.VoteSessions
            .AsNoTracking()
            .Include(v => v.Options)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vote is null)
            throw new NotFoundException(nameof(VoteSession), id);

        var counts = await db.VoteBallots
            .AsNoTracking()
            .Where(b => b.VoteSessionId == id)
            .GroupBy(b => b.SelectedOptionId)
            .Select(g => new { OptionId = g.Key, Count = g.Count() })
            .ToListAsync();

        var options = vote.Options
            .OrderBy(o => o.Order)
            .Select(o => new
            {
                o.Id,
                o.Label,
                Count = counts.FirstOrDefault(c => c.OptionId == o.Id)?.Count ?? 0,
            })
            .ToArray();

        return new { vote.Id, vote.Status, Options = options };
    }
}
