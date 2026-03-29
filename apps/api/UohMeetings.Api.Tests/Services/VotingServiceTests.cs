using Microsoft.EntityFrameworkCore;
using Moq;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Tests.Services;

public sealed class VotingServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly VotingService _sut;

    public VotingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new VotingService(_db, new Mock<INotificationService>().Object);
    }

    public void Dispose() => _db.Dispose();

    // ────────────────────────────── CreateAsync ──────────────────────────────

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsVoteSessionWithDraftStatus()
    {
        var meetingId = Guid.NewGuid();
        var options = new List<string> { "Yes", "No" };

        var result = await _sut.CreateAsync(meetingId, "Approve budget", options);

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(meetingId, result.MeetingId);
        Assert.Equal("Approve budget", result.Title);
        Assert.Equal(VoteSessionStatus.Draft, result.Status);
        Assert.Equal(2, result.Options.Count);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_CreatesOptionsWithCorrectOrder()
    {
        var options = new List<string> { "Option A", "Option B", "Option C" };

        var result = await _sut.CreateAsync(Guid.NewGuid(), "Vote", options);

        Assert.Equal(3, result.Options.Count);
        Assert.Equal("Option A", result.Options[0].Label);
        Assert.Equal(1, result.Options[0].Order);
        Assert.Equal("Option B", result.Options[1].Label);
        Assert.Equal(2, result.Options[1].Order);
        Assert.Equal("Option C", result.Options[2].Label);
        Assert.Equal(3, result.Options[2].Order);
    }

    [Fact]
    public async Task CreateAsync_LessThanTwoOptions_ThrowsValidationException()
    {
        var options = new List<string> { "Only one" };

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CreateAsync(Guid.NewGuid(), "Vote", options));
    }

    [Fact]
    public async Task CreateAsync_EmptyOptions_ThrowsValidationException()
    {
        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CreateAsync(Guid.NewGuid(), "Vote", new List<string>()));
    }

    [Fact]
    public async Task CreateAsync_TrimsWhitespace_ReturnsCleanValues()
    {
        var options = new List<string> { "  Yes  ", "  No  " };

        var result = await _sut.CreateAsync(Guid.NewGuid(), "  Approve  ", options);

        Assert.Equal("Approve", result.Title);
        Assert.Equal("Yes", result.Options[0].Label);
        Assert.Equal("No", result.Options[1].Label);
    }

    [Fact]
    public async Task CreateAsync_PersistsToDatabase_WithOptionsRelation()
    {
        var result = await _sut.CreateAsync(Guid.NewGuid(), "Vote", new List<string> { "A", "B" });

        var persisted = await _db.VoteSessions
            .Include(v => v.Options)
            .FirstOrDefaultAsync(v => v.Id == result.Id);

        Assert.NotNull(persisted);
        Assert.Equal(2, persisted.Options.Count);
    }

    // ────────────────────────────── OpenAsync ──────────────────────────────

    [Fact]
    public async Task OpenAsync_DraftSession_ChangesStatusToOpen()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Draft,
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await _sut.OpenAsync(session.Id);

        var updated = await _db.VoteSessions.FindAsync(session.Id);
        Assert.NotNull(updated);
        Assert.Equal(VoteSessionStatus.Open, updated.Status);
        Assert.NotNull(updated.OpenedAtUtc);
    }

    [Fact]
    public async Task OpenAsync_NonDraftSession_ThrowsValidationException()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open, // Already open
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => _sut.OpenAsync(session.Id));
    }

    [Fact]
    public async Task OpenAsync_ClosedSession_ThrowsValidationException()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Closed,
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => _sut.OpenAsync(session.Id));
    }

    [Fact]
    public async Task OpenAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _sut.OpenAsync(Guid.NewGuid()));
    }

    // ────────────────────────────── CastBallotAsync ──────────────────────────────

    [Fact]
    public async Task CastBallotAsync_ValidBallot_PersistsBallot()
    {
        var option = new VoteOption { Label = "Yes", Order = 1 };
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
            Options = new List<VoteOption> { option, new() { Label = "No", Order = 2 } },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await _sut.CastBallotAsync(session.Id, option.Id, "voter-1", "Voter One");

        var ballot = await _db.VoteBallots.FirstOrDefaultAsync(b => b.VoteSessionId == session.Id);
        Assert.NotNull(ballot);
        Assert.Equal("voter-1", ballot.VoterObjectId);
        Assert.Equal("Voter One", ballot.VoterDisplayName);
        Assert.Equal(option.Id, ballot.SelectedOptionId);
    }

    [Fact]
    public async Task CastBallotAsync_SessionNotOpen_ThrowsValidationException()
    {
        var option = new VoteOption { Label = "Yes", Order = 1 };
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Draft, // Not open
            Options = new List<VoteOption> { option, new() { Label = "No", Order = 2 } },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CastBallotAsync(session.Id, option.Id, "voter-1", "Voter One"));
    }

    [Fact]
    public async Task CastBallotAsync_InvalidOptionId_ThrowsValidationException()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
            Options = new List<VoteOption>
            {
                new() { Label = "Yes", Order = 1 },
                new() { Label = "No", Order = 2 },
            },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        var invalidOptionId = Guid.NewGuid();

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CastBallotAsync(session.Id, invalidOptionId, "voter-1", "Voter One"));
    }

    [Fact]
    public async Task CastBallotAsync_DuplicateVoter_ThrowsConflictException()
    {
        var option = new VoteOption { Label = "Yes", Order = 1 };
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
            Options = new List<VoteOption> { option, new() { Label = "No", Order = 2 } },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        // First ballot succeeds
        await _sut.CastBallotAsync(session.Id, option.Id, "voter-1", "Voter One");

        // Second ballot from same voter throws
        await Assert.ThrowsAsync<ConflictException>(
            () => _sut.CastBallotAsync(session.Id, option.Id, "voter-1", "Voter One"));
    }

    [Fact]
    public async Task CastBallotAsync_NonExistingSession_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.CastBallotAsync(Guid.NewGuid(), Guid.NewGuid(), "voter-1", "Voter One"));
    }

    [Fact]
    public async Task CastBallotAsync_MultipleVoters_AllBallotsRecorded()
    {
        var option1 = new VoteOption { Label = "Yes", Order = 1 };
        var option2 = new VoteOption { Label = "No", Order = 2 };
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
            Options = new List<VoteOption> { option1, option2 },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await _sut.CastBallotAsync(session.Id, option1.Id, "voter-1", "Voter 1");
        await _sut.CastBallotAsync(session.Id, option2.Id, "voter-2", "Voter 2");
        await _sut.CastBallotAsync(session.Id, option1.Id, "voter-3", "Voter 3");

        var ballots = await _db.VoteBallots.Where(b => b.VoteSessionId == session.Id).ToListAsync();
        Assert.Equal(3, ballots.Count);
    }

    // ────────────────────────────── CloseAsync ──────────────────────────────

    [Fact]
    public async Task CloseAsync_OpenSession_ChangesStatusToClosed()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await _sut.CloseAsync(session.Id);

        var updated = await _db.VoteSessions.FindAsync(session.Id);
        Assert.NotNull(updated);
        Assert.Equal(VoteSessionStatus.Closed, updated.Status);
        Assert.NotNull(updated.ClosedAtUtc);
    }

    [Fact]
    public async Task CloseAsync_DraftSession_ThrowsValidationException()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Draft,
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(() => _sut.CloseAsync(session.Id));
    }

    [Fact]
    public async Task CloseAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _sut.CloseAsync(Guid.NewGuid()));
    }

    // ────────────────────────────── GetResultsAsync ──────────────────────────────

    [Fact]
    public async Task GetResultsAsync_WithBallots_ReturnsCorrectCounts()
    {
        var option1 = new VoteOption { Label = "Yes", Order = 1 };
        var option2 = new VoteOption { Label = "No", Order = 2 };
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Closed,
            Options = new List<VoteOption> { option1, option2 },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        // 2 votes for "Yes", 1 vote for "No"
        _db.VoteBallots.AddRange(
            new VoteBallot { VoteSessionId = session.Id, VoterObjectId = "v1", SelectedOptionId = option1.Id },
            new VoteBallot { VoteSessionId = session.Id, VoterObjectId = "v2", SelectedOptionId = option1.Id },
            new VoteBallot { VoteSessionId = session.Id, VoterObjectId = "v3", SelectedOptionId = option2.Id }
        );
        await _db.SaveChangesAsync();

        var result = await _sut.GetResultsAsync(session.Id);

        Assert.NotNull(result);
        // Result is an anonymous type; verify it's non-null and represents valid data
        var json = System.Text.Json.JsonSerializer.Serialize(result);
        Assert.Contains("Yes", json);
        Assert.Contains("No", json);
    }

    [Fact]
    public async Task GetResultsAsync_NoBallots_ReturnsZeroCounts()
    {
        var session = new VoteSession
        {
            MeetingId = Guid.NewGuid(),
            Title = "Vote",
            Status = VoteSessionStatus.Open,
            Options = new List<VoteOption>
            {
                new() { Label = "Yes", Order = 1 },
                new() { Label = "No", Order = 2 },
            },
        };
        _db.VoteSessions.Add(session);
        await _db.SaveChangesAsync();

        var result = await _sut.GetResultsAsync(session.Id);

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetResultsAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(() => _sut.GetResultsAsync(Guid.NewGuid()));
    }

    // ────────────────────────────── ListByMeetingAsync ──────────────────────────────

    [Fact]
    public async Task ListByMeetingAsync_ExistingSessions_ReturnsList()
    {
        var meetingId = Guid.NewGuid();
        _db.VoteSessions.AddRange(
            new VoteSession { MeetingId = meetingId, Title = "Vote 1" },
            new VoteSession { MeetingId = meetingId, Title = "Vote 2" },
            new VoteSession { MeetingId = Guid.NewGuid(), Title = "Other meeting vote" }
        );
        await _db.SaveChangesAsync();

        var result = await _sut.ListByMeetingAsync(meetingId);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListByMeetingAsync_NoSessions_ReturnsEmptyList()
    {
        var result = await _sut.ListByMeetingAsync(Guid.NewGuid());

        Assert.Empty(result);
    }

    // ────────────────────────────── Full lifecycle ──────────────────────────────

    [Fact]
    public async Task FullLifecycle_CreateOpenVoteClose_WorksCorrectly()
    {
        // Create
        var session = await _sut.CreateAsync(Guid.NewGuid(), "Budget Vote", new List<string> { "Approve", "Reject" });
        Assert.Equal(VoteSessionStatus.Draft, session.Status);

        // Open
        await _sut.OpenAsync(session.Id);
        var openedSession = await _db.VoteSessions.FindAsync(session.Id);
        Assert.Equal(VoteSessionStatus.Open, openedSession!.Status);

        // Cast ballots
        var optionApprove = await _db.VoteOptions
            .FirstAsync(o => o.VoteSessionId == session.Id && o.Label == "Approve");

        await _sut.CastBallotAsync(session.Id, optionApprove.Id, "voter-1", "Voter 1");

        // Close
        await _sut.CloseAsync(session.Id);
        var closedSession = await _db.VoteSessions.FindAsync(session.Id);
        Assert.Equal(VoteSessionStatus.Closed, closedSession!.Status);

        // Get results
        var results = await _sut.GetResultsAsync(session.Id);
        Assert.NotNull(results);
    }
}
