using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Integrations;
using UohMeetings.Api.Services;
using static UohMeetings.Api.Controllers.MeetingsController;

namespace UohMeetings.Api.Tests.Services;

public sealed class MeetingServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly Mock<IOnlineMeetingProvider> _onlineMeetingProvider;
    private readonly Mock<ICalendarProvider> _calendar;
    private readonly IConfiguration _config;
    private readonly MeetingService _sut;

    public MeetingServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();

        _onlineMeetingProvider = new Mock<IOnlineMeetingProvider>();
        _calendar = new Mock<ICalendarProvider>();

        // Default config: all integrations disabled
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integrations:Teams:Enabled"] = "false",
                ["Integrations:Zoom:Enabled"] = "false",
                ["Integrations:OnlineMeeting:DefaultProvider"] = "teams",
            })
            .Build();

        _sut = new MeetingService(_db, _onlineMeetingProvider.Object, _calendar.Object, _config, new Mock<ICacheService>().Object, new Mock<INotificationService>().Object);
    }

    public void Dispose() => _db.Dispose();

    // ────────────────────────────── CreateAsync ──────────────────────────────

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsMeetingWithDraftStatus()
    {
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);

        var result = await _sut.CreateAsync(new CreateMeetingRequest(null, "اجتماع", "Meeting", null, null, MeetingType.InPerson, start, end, "Room A", null, null));

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(MeetingStatus.Draft, result.Status);
        Assert.Equal("اجتماع", result.TitleAr);
        Assert.Equal("Meeting", result.TitleEn);
        Assert.Equal(MeetingType.InPerson, result.Type);
        Assert.Equal("Room A", result.Location);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_PersistsToDatabase()
    {
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);

        var result = await _sut.CreateAsync(new CreateMeetingRequest(null, "اجتماع", "Meeting", null, null, MeetingType.InPerson, start, end, null, null, null));

        var persisted = await _db.Meetings.FindAsync(result.Id);
        Assert.NotNull(persisted);
        Assert.Equal("Meeting", persisted.TitleEn);
    }

    [Fact]
    public async Task CreateAsync_WithCommitteeId_AssociatesCommittee()
    {
        var committeeId = Guid.NewGuid();
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);

        var result = await _sut.CreateAsync(new CreateMeetingRequest(committeeId, "اجتماع", "Meeting", null, null, MeetingType.InPerson, start, end, null, null, null));

        Assert.Equal(committeeId, result.CommitteeId);
    }

    [Fact]
    public async Task CreateAsync_EndBeforeStart_ThrowsValidationException()
    {
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(-1); // End before start

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CreateAsync(new CreateMeetingRequest(null, "اجتماع", "Meeting", null, null, MeetingType.InPerson, start, end, null, null, null)));
    }

    [Fact]
    public async Task CreateAsync_EndEqualsStart_ThrowsValidationException()
    {
        var start = DateTime.UtcNow.AddDays(1);

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CreateAsync(new CreateMeetingRequest(null, "اجتماع", "Meeting", null, null, MeetingType.InPerson, start, start, null, null, null)));
    }

    [Fact]
    public async Task CreateAsync_OnlineType_SetsOnlinePlatform()
    {
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);

        var result = await _sut.CreateAsync(new CreateMeetingRequest(null, "اجتماع", "Meeting", null, null, MeetingType.Online, start, end, null, null, OnlinePlatform.Teams));

        Assert.Equal(OnlinePlatform.Teams, result.OnlinePlatform);
    }

    [Fact]
    public async Task CreateAsync_TrimsWhitespace_ReturnsCleanTitles()
    {
        var start = DateTime.UtcNow.AddDays(1);
        var end = start.AddHours(2);

        var result = await _sut.CreateAsync(new CreateMeetingRequest(null, "  اجتماع  ", "  Meeting  ", null, null, MeetingType.InPerson, start, end, "  Room  ", null, null));

        Assert.Equal("اجتماع", result.TitleAr);
        Assert.Equal("Meeting", result.TitleEn);
        Assert.Equal("Room", result.Location);
    }

    // ────────────────────────────── GetAsync ──────────────────────────────

    [Fact]
    public async Task GetAsync_ExistingId_ReturnsMeetingWithAgendaAndInvitees()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
            AgendaItems = new List<AgendaItem>
            {
                new() { Order = 1, TitleAr = "بند 1", TitleEn = "Item 1" },
                new() { Order = 2, TitleAr = "بند 2", TitleEn = "Item 2" },
            },
            Invitees = new List<MeetingInvitee>
            {
                new() { Email = "user@test.com", DisplayName = "User" },
            }
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var result = await _sut.GetAsync(meeting.Id);

        Assert.Equal(meeting.Id, result.Id);
        Assert.Equal(2, result.AgendaItems.Count);
        Assert.Single(result.Invitees);
    }

    [Fact]
    public async Task GetAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.GetAsync(Guid.NewGuid()));
    }

    // ────────────────────────────── ListAsync ──────────────────────────────

    [Fact]
    public async Task ListAsync_NoFilter_ReturnsAllMeetings()
    {
        _db.Meetings.AddRange(
            new Meeting { TitleAr = "أ", TitleEn = "A", StartDateTimeUtc = DateTime.UtcNow, EndDateTimeUtc = DateTime.UtcNow.AddHours(1) },
            new Meeting { TitleAr = "ب", TitleEn = "B", StartDateTimeUtc = DateTime.UtcNow, EndDateTimeUtc = DateTime.UtcNow.AddHours(1) }
        );
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(1, 20, null);

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_WithCommitteeFilter_ReturnsFilteredMeetings()
    {
        var committeeId = Guid.NewGuid();
        _db.Meetings.AddRange(
            new Meeting { TitleAr = "أ", TitleEn = "A", CommitteeId = committeeId, StartDateTimeUtc = DateTime.UtcNow, EndDateTimeUtc = DateTime.UtcNow.AddHours(1) },
            new Meeting { TitleAr = "ب", TitleEn = "B", CommitteeId = Guid.NewGuid(), StartDateTimeUtc = DateTime.UtcNow, EndDateTimeUtc = DateTime.UtcNow.AddHours(1) }
        );
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(1, 20, committeeId);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    // ────────────────────────────── PublishAsync ──────────────────────────────

    [Fact]
    public async Task PublishAsync_DraftMeeting_ChangesStatusToScheduled()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            Status = MeetingStatus.Draft,
            Type = MeetingType.InPerson,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var result = await _sut.PublishAsync(meeting.Id, CancellationToken.None);

        Assert.Equal(MeetingStatus.Scheduled, result.Status);
    }

    [Fact]
    public async Task PublishAsync_NonDraftMeeting_ThrowsValidationException()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            Status = MeetingStatus.Scheduled, // Not Draft
            Type = MeetingType.InPerson,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.PublishAsync(meeting.Id, CancellationToken.None));
    }

    [Fact]
    public async Task PublishAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.PublishAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task PublishAsync_OnlineMeetingWithTeamsEnabled_CreatesOnlineMeeting()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integrations:Teams:Enabled"] = "true",
                ["Integrations:Zoom:Enabled"] = "false",
                ["Integrations:OnlineMeeting:DefaultProvider"] = "teams",
            })
            .Build();

        _onlineMeetingProvider
            .Setup(x => x.CreateMeetingAsync(It.IsAny<OnlineMeetingRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new OnlineMeetingResult("https://teams.link/join", "meeting-123"));

        _calendar
            .Setup(x => x.CreateEventAsync(It.IsAny<CalendarEventRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CalendarEventResult("event-123"));

        var sut = new MeetingService(_db, _onlineMeetingProvider.Object, _calendar.Object, config, new Mock<ICacheService>().Object, new Mock<INotificationService>().Object);

        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Online Meeting",
            Status = MeetingStatus.Draft,
            Type = MeetingType.Online,
            OnlinePlatform = OnlinePlatform.Teams,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var result = await sut.PublishAsync(meeting.Id, CancellationToken.None);

        Assert.Equal("https://teams.link/join", result.OnlineJoinUrl);
        Assert.Equal("event-123", result.CalendarEventId);
        _onlineMeetingProvider.Verify(
            x => x.CreateMeetingAsync(It.IsAny<OnlineMeetingRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task PublishAsync_InPersonMeeting_DoesNotCreateOnlineMeeting()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "In-Person Meeting",
            Status = MeetingStatus.Draft,
            Type = MeetingType.InPerson,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        await _sut.PublishAsync(meeting.Id, CancellationToken.None);

        _onlineMeetingProvider.Verify(
            x => x.CreateMeetingAsync(It.IsAny<OnlineMeetingRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // ────────────────────────────── CancelAsync ──────────────────────────────

    [Fact]
    public async Task CancelAsync_ScheduledMeeting_ChangesStatusToCancelled()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            Status = MeetingStatus.Scheduled,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var result = await _sut.CancelAsync(meeting.Id, CancellationToken.None);

        Assert.Equal(MeetingStatus.Cancelled, result.Status);
    }

    [Fact]
    public async Task CancelAsync_AlreadyCancelledMeeting_ReturnsWithoutError()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            Status = MeetingStatus.Cancelled,
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        var result = await _sut.CancelAsync(meeting.Id, CancellationToken.None);

        Assert.Equal(MeetingStatus.Cancelled, result.Status);
    }

    [Fact]
    public async Task CancelAsync_NonExistingId_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.CancelAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task CancelAsync_MeetingWithCalendarEvent_CancelsCalendarEvent()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Integrations:Teams:Enabled"] = "true",
            })
            .Build();

        var sut = new MeetingService(_db, _onlineMeetingProvider.Object, _calendar.Object, config, new Mock<ICacheService>().Object, new Mock<INotificationService>().Object);

        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            Status = MeetingStatus.Scheduled,
            CalendarEventId = "event-abc",
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();

        await sut.CancelAsync(meeting.Id, CancellationToken.None);

        _calendar.Verify(x => x.CancelEventAsync("event-abc", It.IsAny<CancellationToken>()), Times.Once);
    }

    // ────────────────────────────── UpsertAgendaAsync ──────────────────────────────

    [Fact]
    public async Task UpsertAgendaAsync_ValidItems_ReplacesAgenda()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
            AgendaItems = new List<AgendaItem>
            {
                new() { Order = 1, TitleAr = "قديم", TitleEn = "Old" }
            }
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var newItems = new List<(int Order, string TitleAr, string TitleEn, string? DescriptionAr, string? DescriptionEn, int? DurationMinutes, string? PresenterName)>
        {
            (1, "بند 1", "Item 1", null, null, null, null),
            (2, "بند 2", "Item 2", null, null, null, null),
        };

        await _sut.UpsertAgendaAsync(meeting.Id, newItems);

        _db.ChangeTracker.Clear();
        var updated = await _db.Meetings.Include(m => m.AgendaItems).FirstAsync(m => m.Id == meeting.Id);
        Assert.Equal(2, updated.AgendaItems.Count);
    }

    [Fact]
    public async Task UpsertAgendaAsync_NonExistingMeeting_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.UpsertAgendaAsync(Guid.NewGuid(), new List<(int, string, string, string?, string?, int?, string?)>()));
    }

    // ────────────────────────────── UpsertInviteesAsync ──────────────────────────────

    [Fact]
    public async Task UpsertInviteesAsync_ValidInvitees_ReplacesInvitees()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var invitees = new List<(string Email, string? DisplayName, InviteeRole Role)>
        {
            ("user1@test.com", "User 1", InviteeRole.Required),
            ("user2@test.com", "User 2", InviteeRole.Optional),
        };

        await _sut.UpsertInviteesAsync(meeting.Id, invitees);

        _db.ChangeTracker.Clear();
        var updated = await _db.Meetings.Include(m => m.Invitees).FirstAsync(m => m.Id == meeting.Id);
        Assert.Equal(2, updated.Invitees.Count);
    }

    [Fact]
    public async Task UpsertInviteesAsync_EmptyEmail_SkipsInvitee()
    {
        var meeting = new Meeting
        {
            TitleAr = "اجتماع",
            TitleEn = "Meeting",
            StartDateTimeUtc = DateTime.UtcNow.AddDays(1),
            EndDateTimeUtc = DateTime.UtcNow.AddDays(1).AddHours(2),
        };
        _db.Meetings.Add(meeting);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        var invitees = new List<(string Email, string? DisplayName, InviteeRole Role)>
        {
            ("", "No Email User", InviteeRole.Required),
            ("user@test.com", "Valid User", InviteeRole.Required),
        };

        await _sut.UpsertInviteesAsync(meeting.Id, invitees);

        _db.ChangeTracker.Clear();
        var updated = await _db.Meetings.Include(m => m.Invitees).FirstAsync(m => m.Id == meeting.Id);
        Assert.Single(updated.Invitees);
        Assert.Equal("user@test.com", updated.Invitees[0].Email);
    }

    [Fact]
    public async Task UpsertInviteesAsync_NonExistingMeeting_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.UpsertInviteesAsync(Guid.NewGuid(), new List<(string, string?, InviteeRole)>()));
    }
}
