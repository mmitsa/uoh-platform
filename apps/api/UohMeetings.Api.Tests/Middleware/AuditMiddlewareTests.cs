using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using UohMeetings.Api.Entities;
using UohMeetings.Api.Middleware;
using UohMeetings.Api.Services;

namespace UohMeetings.Api.Tests.Middleware;

public sealed class AuditMiddlewareTests
{
    private readonly AuditLogQueue _queue = new();
    private readonly Mock<ILogger<AuditMiddleware>> _logger = new();

    private AuditMiddleware CreateMiddleware(RequestDelegate next)
    {
        return new AuditMiddleware(next);
    }

    private static DefaultHttpContext CreateHttpContext(string method = "GET", string path = "/api/v1/committees")
    {
        var context = new DefaultHttpContext();
        context.Request.Method = method;
        context.Request.Path = path;
        context.Response.StatusCode = 200;
        return context;
    }

    private AuditLogEntry? ReadFromQueue()
    {
        return _queue.Reader.TryRead(out var entry) ? entry : null;
    }

    // ────────────────────────────── Basic audit entry ──────────────────────────────

    [Fact]
    public async Task Invoke_StandardRequest_EnqueuesAuditLogEntry()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext("POST", "/api/v1/meetings");

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal("POST", entry.HttpMethod);
        Assert.Equal("/api/v1/meetings", entry.Path);
        Assert.Equal(200, entry.StatusCode);
        Assert.True(entry.Success);
    }

    [Fact]
    public async Task Invoke_StandardRequest_RecordsDuration()
    {
        var middleware = CreateMiddleware(async _ =>
        {
            await Task.Delay(50);
        });
        var context = CreateHttpContext();

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.True(entry.DurationMs >= 0);
    }

    [Fact]
    public async Task Invoke_StandardRequest_RecordsTraceId()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();
        context.TraceIdentifier = "trace-xyz";

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal("trace-xyz", entry.TraceId);
    }

    // ────────────────────────────── Authenticated user ──────────────────────────────

    [Fact]
    public async Task Invoke_AuthenticatedUser_RecordsUserInfo()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();

        var claims = new[]
        {
            new Claim("oid", "user-object-id-123"),
            new Claim("name", "Ahmed Ali"),
            new Claim("preferred_username", "ahmed@example.com"),
            new Claim(ClaimTypes.Role, "CommitteeHead"),
            new Claim(ClaimTypes.Role, "CommitteeMember"),
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal("user-object-id-123", entry.UserObjectId);
        Assert.Equal("Ahmed Ali", entry.UserDisplayName);
        Assert.Equal("ahmed@example.com", entry.UserEmail);
        Assert.Contains("CommitteeHead", entry.UserRoles!);
        Assert.Contains("CommitteeMember", entry.UserRoles!);
    }

    [Fact]
    public async Task Invoke_UnauthenticatedUser_NullUserFields()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();
        // No claims set, user is unauthenticated

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Null(entry.UserObjectId);
        Assert.Null(entry.UserDisplayName);
        Assert.Null(entry.UserEmail);
        Assert.Null(entry.UserRoles);
    }

    // ────────────────────────────── Skip paths ──────────────────────────────

    [Fact]
    public async Task Invoke_SwaggerPath_SkipsAuditLog()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext("GET", "/swagger/index.html");

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.Null(entry);
    }

    [Fact]
    public async Task Invoke_HealthPath_SkipsAuditLog()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext("GET", "/health");

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.Null(entry);
    }

    [Fact]
    public async Task Invoke_SwaggerPathCaseInsensitive_SkipsAuditLog()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext("GET", "/Swagger/v1/swagger.json");

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.Null(entry);
    }

    // ────────────────────────────── Error status codes ──────────────────────────────

    [Fact]
    public async Task Invoke_FailedRequest_RecordsFailure()
    {
        var middleware = CreateMiddleware(ctx =>
        {
            ctx.Response.StatusCode = 500;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext();

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal(500, entry.StatusCode);
        Assert.False(entry.Success);
    }

    [Theory]
    [InlineData(200, true)]
    [InlineData(201, true)]
    [InlineData(204, true)]
    [InlineData(301, true)]
    [InlineData(400, false)]
    [InlineData(401, false)]
    [InlineData(403, false)]
    [InlineData(404, false)]
    [InlineData(500, false)]
    public async Task Invoke_VariousStatusCodes_CorrectSuccessFlag(int statusCode, bool expectedSuccess)
    {
        var middleware = CreateMiddleware(ctx =>
        {
            ctx.Response.StatusCode = statusCode;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext();

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal(expectedSuccess, entry.Success);
    }

    // ────────────────────────────── Exception in next ──────────────────────────────

    [Fact]
    public async Task Invoke_ExceptionInPipeline_StillEnqueuesAuditEntry()
    {
        var middleware = CreateMiddleware(_ => throw new InvalidOperationException("Pipeline error"));
        var context = CreateHttpContext();

        // The middleware uses finally, so it should still enqueue an audit entry
        // but the exception will propagate
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => middleware.Invoke(context, _queue, _logger.Object));

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
    }

    // ────────────────────────────── User-Agent ──────────────────────────────

    [Fact]
    public async Task Invoke_WithUserAgent_RecordsUserAgent()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();
        context.Request.Headers["User-Agent"] = "TestAgent/1.0";

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal("TestAgent/1.0", entry.UserAgent);
    }

    // ────────────────────────────── Calls next delegate ──────────────────────────────

    [Fact]
    public async Task Invoke_Always_CallsNextDelegate()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext();

        await middleware.Invoke(context, _queue, _logger.Object);

        Assert.True(nextCalled);
    }

    [Fact]
    public async Task Invoke_SkippedPath_StillCallsNext()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext("GET", "/health");

        await middleware.Invoke(context, _queue, _logger.Object);

        Assert.True(nextCalled);
    }

    // ────────────────────────────── Authenticated user with fallback claims ──────────────────────────────

    [Fact]
    public async Task Invoke_AuthenticatedUserWithNameIdentifier_FallsBackToNameIdentifier()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);
        var context = CreateHttpContext();

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "fallback-id"),
            new Claim(ClaimTypes.Name, "Fallback Name"),
            new Claim(ClaimTypes.Email, "fallback@example.com"),
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"));

        await middleware.Invoke(context, _queue, _logger.Object);

        var entry = ReadFromQueue();
        Assert.NotNull(entry);
        Assert.Equal("fallback-id", entry.UserObjectId);
        Assert.Equal("Fallback Name", entry.UserDisplayName);
        Assert.Equal("fallback@example.com", entry.UserEmail);
    }

    // ────────────────────────────── Multiple requests ──────────────────────────────

    [Fact]
    public async Task Invoke_MultipleRequests_EnqueuesMultipleEntries()
    {
        var middleware = CreateMiddleware(_ => Task.CompletedTask);

        await middleware.Invoke(CreateHttpContext("GET", "/api/v1/committees"), _queue, _logger.Object);
        await middleware.Invoke(CreateHttpContext("POST", "/api/v1/meetings"), _queue, _logger.Object);

        var entry1 = ReadFromQueue();
        var entry2 = ReadFromQueue();
        Assert.NotNull(entry1);
        Assert.NotNull(entry2);
        Assert.Equal("GET", entry1.HttpMethod);
        Assert.Equal("POST", entry2.HttpMethod);
    }
}
