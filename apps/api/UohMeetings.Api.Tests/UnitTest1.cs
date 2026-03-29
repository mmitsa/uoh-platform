using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Tests;

public sealed class WorkflowEngineTests
{
    [Fact]
    public async Task ApplyAsync_Transitions_WhenRoleMatches()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();
        var engine = new WorkflowEngine(db);

        var def = new WorkflowEngine.Definition(
            InitialState: "draft",
            Transitions: new[]
            {
                new WorkflowEngine.Transition(Action: "submit", From: "draft", To: "pending", RequiredRole: "CommitteeSecretary"),
                new WorkflowEngine.Transition(Action: "approve", From: "pending", To: "approved", RequiredRole: "CommitteeHead"),
            }
        );

        var template = await engine.CreateTemplateAsync("mom-approval", "mom", def, CancellationToken.None);
        var instance = await engine.StartInstanceAsync(template.Id, "mom", Guid.NewGuid(), CancellationToken.None);

        var secretary = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "CommitteeSecretary"),
            new Claim("oid", "u1"),
        }, "test"));

        var updated = await engine.ApplyAsync(instance.Id, "submit", secretary, CancellationToken.None);
        Assert.Equal("pending", updated.CurrentState);

        var head = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.Role, "CommitteeHead"),
            new Claim("oid", "u2"),
        }, "test"));

        updated = await engine.ApplyAsync(instance.Id, "approve", head, CancellationToken.None);
        Assert.Equal("approved", updated.CurrentState);
        Assert.True(updated.History.Count >= 3);
    }
}