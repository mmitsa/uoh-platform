using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Tests.Integration;

public sealed class CommitteesControllerTests : IClassFixture<TestWebApplicationFactory>, IDisposable
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public CommitteesControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _factory.EnsureDatabaseCreated();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        // Clean up database between tests
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Committees.RemoveRange(db.Committees);
        db.SaveChanges();
    }

    // ────────────────────────────── DTOs for deserialization ──────────────────────────────

    private sealed record CommitteeResponse(
        Guid Id,
        string Type,
        string NameAr,
        string NameEn,
        string Status,
        DateTime CreatedAtUtc);

    private sealed record PagedListResponse(
        int Page,
        int PageSize,
        int Total,
        JsonElement Items);

    private sealed record CreateCommitteeRequest(string Type, string NameAr, string NameEn);

    private sealed record UpsertMemberRequest(
        string UserObjectId,
        string DisplayName,
        string Email,
        string Role,
        bool IsActive);

    // ────────────────────────────── Helper ──────────────────────────────

    private async Task<Committee> SeedCommittee(string nameEn = "Test Committee", CommitteeStatus status = CommitteeStatus.Draft)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var committee = new Committee
        {
            NameAr = "لجنة اختبار",
            NameEn = nameEn,
            Type = CommitteeType.Permanent,
            Status = status,
        };
        db.Committees.Add(committee);
        await db.SaveChangesAsync();
        return committee;
    }

    // ────────────────────────────── GET /api/v1/committees ──────────────────────────────

    [Fact]
    public async Task List_NoCommittees_ReturnsEmptyList()
    {
        var response = await _client.GetAsync("/api/v1/committees");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedListResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(0, body.Total);
    }

    [Fact]
    public async Task List_WithCommittees_ReturnsPagedResult()
    {
        await SeedCommittee("Committee A");
        await SeedCommittee("Committee B");

        var response = await _client.GetAsync("/api/v1/committees");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedListResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(2, body.Total);
        Assert.Equal(1, body.Page);
    }

    [Fact]
    public async Task List_WithPagination_ReturnsCorrectPage()
    {
        for (var i = 0; i < 5; i++)
        {
            await SeedCommittee($"Committee {i}");
        }

        var response = await _client.GetAsync("/api/v1/committees?page=2&pageSize=2");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedListResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(5, body.Total);
        Assert.Equal(2, body.Page);
        Assert.Equal(2, body.PageSize);
    }

    [Fact]
    public async Task List_WithStatusFilter_ReturnsFilteredResults()
    {
        await SeedCommittee("Draft Committee", CommitteeStatus.Draft);
        await SeedCommittee("Active Committee", CommitteeStatus.Active);

        var response = await _client.GetAsync("/api/v1/committees?status=Active");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<PagedListResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(1, body.Total);
    }

    // ────────────────────────────── GET /api/v1/committees/{id} ──────────────────────────────

    [Fact]
    public async Task Get_ExistingCommittee_ReturnsCommittee()
    {
        var committee = await SeedCommittee("Existing Committee");

        var response = await _client.GetAsync($"/api/v1/committees/{committee.Id}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<CommitteeResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal(committee.Id, body.Id);
        Assert.Equal("Existing Committee", body.NameEn);
    }

    [Fact]
    public async Task Get_NonExistingCommittee_ReturnsNotFound()
    {
        var response = await _client.GetAsync($"/api/v1/committees/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ────────────────────────────── POST /api/v1/committees ──────────────────────────────

    [Fact]
    public async Task Create_ValidInput_ReturnsCreated()
    {
        var request = new CreateCommitteeRequest("Permanent", "لجنة جديدة", "New Committee");

        var response = await _client.PostAsJsonAsync("/api/v1/committees", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<CommitteeResponse>(JsonOptions);
        Assert.NotNull(body);
        Assert.Equal("New Committee", body.NameEn);
        Assert.Equal("لجنة جديدة", body.NameAr);
    }

    [Fact]
    public async Task Create_ValidInput_PersistsToDatabase()
    {
        var request = new CreateCommitteeRequest("Temporary", "لجنة", "Persisted Committee");

        var response = await _client.PostAsJsonAsync("/api/v1/committees", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var committees = await db.Committees.ToListAsync();
        Assert.Contains(committees, c => c.NameEn == "Persisted Committee");
    }

    [Fact]
    public async Task Create_EmptyNameAr_ReturnsBadRequest()
    {
        var request = new CreateCommitteeRequest("Permanent", "", "Valid English");

        var response = await _client.PostAsJsonAsync("/api/v1/committees", request, JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_EmptyNameEn_ReturnsBadRequest()
    {
        var request = new CreateCommitteeRequest("Permanent", "Valid Arabic", "");

        var response = await _client.PostAsJsonAsync("/api/v1/committees", request, JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_ReturnsLocationHeader()
    {
        var request = new CreateCommitteeRequest("Permanent", "لجنة", "Committee With Location");

        var response = await _client.PostAsJsonAsync("/api/v1/committees", request, JsonOptions);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/api/v1/committees/", response.Headers.Location.ToString());
    }

    // ────────────────────────────── PUT /api/v1/committees/{id}/members ──────────────────────────────

    [Fact]
    public async Task UpsertMember_NewMember_ReturnsOk()
    {
        var committee = await SeedCommittee("Committee for Members");

        var request = new UpsertMemberRequest("oid-1", "John Doe", "john@example.com", "head", true);

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/committees/{committee.Id}/members", request, JsonOptions);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task UpsertMember_NewMember_PersistsMember()
    {
        var committee = await SeedCommittee("Committee for Member Persistence");

        var request = new UpsertMemberRequest("oid-persist", "Jane Doe", "jane@example.com", "secretary", true);

        await _client.PutAsJsonAsync($"/api/v1/committees/{committee.Id}/members", request, JsonOptions);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.Committees.Include(c => c.Members).FirstAsync(c => c.Id == committee.Id);
        Assert.Single(updated.Members);
        Assert.Equal("oid-persist", updated.Members[0].UserObjectId);
    }

    [Fact]
    public async Task UpsertMember_ExistingMember_UpdatesFields()
    {
        var committee = await SeedCommittee("Committee for Existing Member");

        // Add first member
        var initial = new UpsertMemberRequest("oid-update", "Initial Name", "initial@example.com", "member", true);
        await _client.PutAsJsonAsync($"/api/v1/committees/{committee.Id}/members", initial, JsonOptions);

        // Update same member
        var update = new UpsertMemberRequest("oid-update", "Updated Name", "updated@example.com", "head", false);
        var response = await _client.PutAsJsonAsync(
            $"/api/v1/committees/{committee.Id}/members", update, JsonOptions);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.Committees.Include(c => c.Members).FirstAsync(c => c.Id == committee.Id);
        Assert.Single(updated.Members);
        Assert.Equal("Updated Name", updated.Members[0].DisplayName);
        Assert.Equal("updated@example.com", updated.Members[0].Email);
        Assert.Equal("head", updated.Members[0].Role);
        Assert.False(updated.Members[0].IsActive);
    }

    [Fact]
    public async Task UpsertMember_NonExistingCommittee_ReturnsNotFound()
    {
        var request = new UpsertMemberRequest("oid-1", "John", "john@example.com", "member", true);

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/committees/{Guid.NewGuid()}/members", request, JsonOptions);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpsertMember_EmptyUserObjectId_ReturnsBadRequest()
    {
        var committee = await SeedCommittee("Committee for Empty OID");

        var request = new UpsertMemberRequest("", "Name", "email@test.com", "member", true);

        var response = await _client.PutAsJsonAsync(
            $"/api/v1/committees/{committee.Id}/members", request, JsonOptions);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ────────────────────────────── Full pipeline ──────────────────────────────

    [Fact]
    public async Task FullPipeline_CreateGetListUpdate_WorksEndToEnd()
    {
        // Create
        var createReq = new CreateCommitteeRequest("Permanent", "لجنة كاملة", "Full Pipeline Committee");
        var createResp = await _client.PostAsJsonAsync("/api/v1/committees", createReq, JsonOptions);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);

        var created = await createResp.Content.ReadFromJsonAsync<CommitteeResponse>(JsonOptions);
        Assert.NotNull(created);
        var committeeId = created.Id;

        // Get
        var getResp = await _client.GetAsync($"/api/v1/committees/{committeeId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        // Add member
        var memberReq = new UpsertMemberRequest("pipeline-oid", "Pipeline User", "pipeline@test.com", "head", true);
        var memberResp = await _client.PutAsJsonAsync(
            $"/api/v1/committees/{committeeId}/members", memberReq, JsonOptions);
        Assert.Equal(HttpStatusCode.OK, memberResp.StatusCode);

        // List should include the committee
        var listResp = await _client.GetAsync("/api/v1/committees");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);

        var list = await listResp.Content.ReadFromJsonAsync<PagedListResponse>(JsonOptions);
        Assert.NotNull(list);
        Assert.True(list.Total >= 1);
    }

    // ────────────────────────────── Response format ──────────────────────────────

    [Fact]
    public async Task List_Response_ContainsExpectedFields()
    {
        await SeedCommittee("Fields Test Committee");

        var response = await _client.GetAsync("/api/v1/committees");
        var json = await response.Content.ReadAsStringAsync();

        Assert.Contains("page", json);
        Assert.Contains("pageSize", json);
        Assert.Contains("total", json);
        Assert.Contains("items", json);
    }

    [Fact]
    public async Task Get_Response_ContainsExpectedFields()
    {
        var committee = await SeedCommittee("Detail Fields Test");

        var response = await _client.GetAsync($"/api/v1/committees/{committee.Id}");
        var json = await response.Content.ReadAsStringAsync();

        Assert.Contains("id", json);
        Assert.Contains("nameAr", json);
        Assert.Contains("nameEn", json);
        Assert.Contains("type", json);
        Assert.Contains("status", json);
        Assert.Contains("members", json);
    }
}
