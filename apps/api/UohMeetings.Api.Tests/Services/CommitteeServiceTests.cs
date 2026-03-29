using Microsoft.EntityFrameworkCore;
using Moq;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Services;
using static UohMeetings.Api.Controllers.CommitteesController;

namespace UohMeetings.Api.Tests.Services;

public sealed class CommitteeServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly CommitteeService _sut;

    public CommitteeServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _sut = new CommitteeService(_db, new Mock<ICacheService>().Object, new Mock<INotificationService>().Object);
    }

    public void Dispose() => _db.Dispose();

    // ────────────────────────────── CreateAsync ──────────────────────────────

    [Fact]
    public async Task CreateAsync_ValidInput_ReturnsCommitteeWithDraftStatus()
    {
        var result = await _sut.CreateAsync(new CreateCommitteeRequest(CommitteeType.Permanent, "لجنة اختبار", "Test Committee"));

        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(CommitteeType.Permanent, result.Type);
        Assert.Equal("لجنة اختبار", result.NameAr);
        Assert.Equal("Test Committee", result.NameEn);
        Assert.Equal(CommitteeStatus.Draft, result.Status);
    }

    [Fact]
    public async Task CreateAsync_ValidInput_PersistsToDatabase()
    {
        var result = await _sut.CreateAsync(new CreateCommitteeRequest(CommitteeType.Temporary, "لجنة مؤقتة", "Temporary Committee"));

        var persisted = await _db.Committees.FindAsync(result.Id);
        Assert.NotNull(persisted);
        Assert.Equal("Temporary Committee", persisted.NameEn);
    }

    [Fact]
    public async Task CreateAsync_TrimsWhitespace_ReturnsCleanNames()
    {
        var result = await _sut.CreateAsync(new CreateCommitteeRequest(CommitteeType.Main, "  اسم عربي  ", "  English Name  "));

        Assert.Equal("اسم عربي", result.NameAr);
        Assert.Equal("English Name", result.NameEn);
    }

    [Theory]
    [InlineData("", "Valid English")]
    [InlineData("   ", "Valid English")]
    [InlineData("Valid Arabic", "")]
    [InlineData("Valid Arabic", "   ")]
    [InlineData("", "")]
    public async Task CreateAsync_EmptyOrWhitespaceName_ThrowsValidationException(string nameAr, string nameEn)
    {
        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.CreateAsync(new CreateCommitteeRequest(CommitteeType.Permanent, nameAr, nameEn)));
    }

    [Theory]
    [InlineData(CommitteeType.Permanent)]
    [InlineData(CommitteeType.Temporary)]
    [InlineData(CommitteeType.Main)]
    [InlineData(CommitteeType.Sub)]
    [InlineData(CommitteeType.Council)]
    [InlineData(CommitteeType.SelfManaged)]
    [InlineData(CommitteeType.CrossFunctional)]
    public async Task CreateAsync_AllTypes_ReturnsCorrectType(CommitteeType type)
    {
        var result = await _sut.CreateAsync(new CreateCommitteeRequest(type, "عربي", "English"));
        Assert.Equal(type, result.Type);
    }

    // ────────────────────────────── GetAsync ──────────────────────────────

    [Fact]
    public async Task GetAsync_ExistingId_ReturnsCommitteeWithMembers()
    {
        var committee = new Committee
        {
            NameAr = "لجنة",
            NameEn = "Committee",
            Type = CommitteeType.Permanent,
            Members = new List<CommitteeMember>
            {
                new() { UserObjectId = "u1", DisplayName = "User 1", Email = "u1@test.com", Role = "head" }
            }
        };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();

        var result = await _sut.GetAsync(committee.Id);

        Assert.Equal(committee.Id, result.Id);
        Assert.Single(result.Members);
        Assert.Equal("u1", result.Members[0].UserObjectId);
    }

    [Fact]
    public async Task GetAsync_NonExistingId_ThrowsNotFoundException()
    {
        var nonExistentId = Guid.NewGuid();

        var ex = await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.GetAsync(nonExistentId));

        Assert.Contains(nonExistentId.ToString(), ex.Message);
    }

    // ────────────────────────────── ListAsync ──────────────────────────────

    [Fact]
    public async Task ListAsync_NoFilter_ReturnsAllCommittees()
    {
        _db.Committees.AddRange(
            new Committee { NameAr = "أ", NameEn = "A", Type = CommitteeType.Permanent, Status = CommitteeStatus.Draft },
            new Committee { NameAr = "ب", NameEn = "B", Type = CommitteeType.Temporary, Status = CommitteeStatus.Active }
        );
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(1, 20, null, null, null);

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_WithStatusFilter_ReturnsFilteredCommittees()
    {
        _db.Committees.AddRange(
            new Committee { NameAr = "أ", NameEn = "A", Status = CommitteeStatus.Draft },
            new Committee { NameAr = "ب", NameEn = "B", Status = CommitteeStatus.Active },
            new Committee { NameAr = "ج", NameEn = "C", Status = CommitteeStatus.Active }
        );
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(1, 20, CommitteeStatus.Active, null, null);

        Assert.Equal(2, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_Pagination_ReturnsCorrectPage()
    {
        for (var i = 0; i < 5; i++)
        {
            _db.Committees.Add(new Committee
            {
                NameAr = $"لجنة {i}",
                NameEn = $"Committee {i}",
                CreatedAtUtc = DateTime.UtcNow.AddMinutes(-i),
            });
        }
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(2, 2, null, null, null);

        Assert.Equal(5, total);
        Assert.Equal(2, items.Count);
    }

    [Fact]
    public async Task ListAsync_PageSizeClamped_RespectsMaxOf100()
    {
        _db.Committees.Add(new Committee { NameAr = "أ", NameEn = "A" });
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(1, 999, null, null, null);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    [Fact]
    public async Task ListAsync_NegativePage_DefaultsToPageOne()
    {
        _db.Committees.Add(new Committee { NameAr = "أ", NameEn = "A" });
        await _db.SaveChangesAsync();

        var (total, items) = await _sut.ListAsync(-1, 20, null, null, null);

        Assert.Equal(1, total);
        Assert.Single(items);
    }

    // ────────────────────────────── UpsertMemberAsync ──────────────────────────────

    [Fact]
    public async Task UpsertMemberAsync_NewMember_AddsMemberToCommittee()
    {
        var committee = new Committee { NameAr = "لجنة", NameEn = "Committee" };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await _sut.UpsertMemberAsync(committee.Id, "oid-1", "John Doe", "john@test.com", "head", true);

        _db.ChangeTracker.Clear();
        var updated = await _db.Committees.Include(c => c.Members).FirstAsync(c => c.Id == committee.Id);
        Assert.Single(updated.Members);
        Assert.Equal("oid-1", updated.Members[0].UserObjectId);
        Assert.Equal("John Doe", updated.Members[0].DisplayName);
        Assert.Equal("john@test.com", updated.Members[0].Email);
        Assert.Equal("head", updated.Members[0].Role);
        Assert.True(updated.Members[0].IsActive);
    }

    [Fact]
    public async Task UpsertMemberAsync_ExistingMember_UpdatesFields()
    {
        var committee = new Committee
        {
            NameAr = "لجنة",
            NameEn = "Committee",
            Members = new List<CommitteeMember>
            {
                new() { UserObjectId = "oid-1", DisplayName = "Old Name", Email = "old@test.com", Role = "member", IsActive = true }
            }
        };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await _sut.UpsertMemberAsync(committee.Id, "oid-1", "New Name", "new@test.com", "head", false);

        _db.ChangeTracker.Clear();
        var updated = await _db.Committees.Include(c => c.Members).FirstAsync(c => c.Id == committee.Id);
        Assert.Single(updated.Members);
        Assert.Equal("New Name", updated.Members[0].DisplayName);
        Assert.Equal("new@test.com", updated.Members[0].Email);
        Assert.Equal("head", updated.Members[0].Role);
        Assert.False(updated.Members[0].IsActive);
    }

    [Fact]
    public async Task UpsertMemberAsync_NonExistingCommittee_ThrowsNotFoundException()
    {
        await Assert.ThrowsAsync<NotFoundException>(
            () => _sut.UpsertMemberAsync(Guid.NewGuid(), "oid-1", "Name", "email@test.com", "member", true));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task UpsertMemberAsync_EmptyUserObjectId_ThrowsValidationException(string userObjectId)
    {
        var committee = new Committee { NameAr = "لجنة", NameEn = "Committee" };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();

        await Assert.ThrowsAsync<ValidationException>(
            () => _sut.UpsertMemberAsync(committee.Id, userObjectId, "Name", "email@test.com", "member", true));
    }

    [Fact]
    public async Task UpsertMemberAsync_NewMember_UpdatesCommitteeTimestamp()
    {
        var committee = new Committee { NameAr = "لجنة", NameEn = "Committee" };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();
        var originalUpdated = committee.UpdatedAtUtc;
        _db.ChangeTracker.Clear();

        await Task.Delay(10); // Ensure time difference
        await _sut.UpsertMemberAsync(committee.Id, "oid-1", "Name", "email@test.com", "member", true);

        _db.ChangeTracker.Clear();
        var updated = await _db.Committees.FirstAsync(c => c.Id == committee.Id);
        Assert.True(updated.UpdatedAtUtc >= originalUpdated);
    }

    [Fact]
    public async Task UpsertMemberAsync_TrimsWhitespace_ReturnsCleanValues()
    {
        var committee = new Committee { NameAr = "لجنة", NameEn = "Committee" };
        _db.Committees.Add(committee);
        await _db.SaveChangesAsync();
        _db.ChangeTracker.Clear();

        await _sut.UpsertMemberAsync(committee.Id, "  oid-1  ", "  John Doe  ", "  john@test.com  ", "  head  ", true);

        _db.ChangeTracker.Clear();
        var updated = await _db.Committees.Include(c => c.Members).FirstAsync(c => c.Id == committee.Id);
        Assert.Equal("oid-1", updated.Members[0].UserObjectId);
        Assert.Equal("John Doe", updated.Members[0].DisplayName);
        Assert.Equal("john@test.com", updated.Members[0].Email);
        Assert.Equal("head", updated.Members[0].Role);
    }
}
