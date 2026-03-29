using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using UohMeetings.Api.Exceptions;
using UohMeetings.Api.Middleware;

namespace UohMeetings.Api.Tests.Middleware;

public sealed class GlobalExceptionHandlerTests
{
    private readonly Mock<ILogger<GlobalExceptionHandlerMiddleware>> _logger = new();
    private readonly Mock<IWebHostEnvironment> _env = new();

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public GlobalExceptionHandlerTests()
    {
        _env.Setup(e => e.EnvironmentName).Returns("Production");
    }

    private GlobalExceptionHandlerMiddleware CreateMiddleware(RequestDelegate next)
    {
        return new GlobalExceptionHandlerMiddleware(next, _logger.Object, _env.Object);
    }

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();
        return context;
    }

    private static async Task<ProblemDetails?> ReadProblemDetails(HttpResponse response)
    {
        response.Body.Seek(0, SeekOrigin.Begin);
        return await JsonSerializer.DeserializeAsync<ProblemDetails>(response.Body, JsonOptions);
    }

    // ────────────────────────────── NotFoundException ──────────────────────────────

    [Fact]
    public async Task Invoke_NotFoundException_Returns404()
    {
        var middleware = CreateMiddleware(_ => throw new NotFoundException("Committee", Guid.NewGuid()));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Not Found", problemDetails.Title);
        Assert.Equal(404, problemDetails.Status);
    }

    // ────────────────────────────── ValidationException ──────────────────────────────

    [Fact]
    public async Task Invoke_ValidationException_Returns400()
    {
        var middleware = CreateMiddleware(_ => throw new ValidationException("FieldName", "Field is required."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Validation Error", problemDetails.Title);
        Assert.Equal(400, problemDetails.Status);
    }

    [Fact]
    public async Task Invoke_ValidationExceptionWithMultipleErrors_Returns400()
    {
        var errors = new Dictionary<string, string[]>
        {
            ["Name"] = new[] { "Name is required." },
            ["Email"] = new[] { "Email is invalid.", "Email is too long." },
        };
        var middleware = CreateMiddleware(_ => throw new ValidationException(errors));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);
    }

    // ────────────────────────────── ConflictException ──────────────────────────────

    [Fact]
    public async Task Invoke_ConflictException_Returns409()
    {
        var middleware = CreateMiddleware(_ => throw new ConflictException("Duplicate record found."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.Conflict, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Conflict", problemDetails.Title);
        Assert.Equal(409, problemDetails.Status);
    }

    // ────────────────────────────── ForbiddenException ──────────────────────────────

    [Fact]
    public async Task Invoke_ForbiddenException_Returns403()
    {
        var middleware = CreateMiddleware(_ => throw new ForbiddenException());
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.Forbidden, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Forbidden", problemDetails.Title);
        Assert.Equal(403, problemDetails.Status);
    }

    [Fact]
    public async Task Invoke_ForbiddenExceptionWithMessage_ReturnsCustomMessage()
    {
        var middleware = CreateMiddleware(_ => throw new ForbiddenException("Cannot access this resource."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Cannot access this resource.", problemDetails.Detail);
    }

    // ────────────────────────────── UnauthorizedAccessException ──────────────────────────────

    [Fact]
    public async Task Invoke_UnauthorizedAccessException_Returns401()
    {
        var middleware = CreateMiddleware(_ => throw new UnauthorizedAccessException("Token expired."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.Unauthorized, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Unauthorized", problemDetails.Title);
        Assert.Equal(401, problemDetails.Status);
    }

    // ────────────────────────────── InvalidOperationException ──────────────────────────────

    [Fact]
    public async Task Invoke_InvalidOperationException_Returns400()
    {
        var middleware = CreateMiddleware(_ => throw new InvalidOperationException("Invalid state transition."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.BadRequest, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Bad Request", problemDetails.Title);
        Assert.Equal(400, problemDetails.Status);
    }

    // ────────────────────────────── Unhandled / generic Exception ──────────────────────────────

    [Fact]
    public async Task Invoke_UnhandledException_Returns500()
    {
        var middleware = CreateMiddleware(_ => throw new Exception("Something broke."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("Internal Server Error", problemDetails.Title);
        Assert.Equal(500, problemDetails.Status);
    }

    [Fact]
    public async Task Invoke_UnhandledException_InProduction_HidesDetails()
    {
        _env.Setup(e => e.EnvironmentName).Returns("Production");
        var middleware = CreateMiddleware(_ => throw new Exception("Sensitive database error details."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Equal("An unexpected error occurred.", problemDetails.Detail);
    }

    [Fact]
    public async Task Invoke_UnhandledException_InDevelopment_ShowsDetails()
    {
        _env.Setup(e => e.EnvironmentName).Returns("Development");

        // IWebHostEnvironment.IsDevelopment() is an extension method that checks EnvironmentName
        // We need to use Microsoft.Extensions.Hosting.HostEnvironmentEnvExtensions via EnvironmentName
        var devEnv = new Mock<IWebHostEnvironment>();
        devEnv.Setup(e => e.EnvironmentName).Returns("Development");

        var middleware = new GlobalExceptionHandlerMiddleware(
            _ => throw new Exception("Detailed error info"),
            _logger.Object,
            devEnv.Object);
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        var problemDetails = await ReadProblemDetails(context.Response);
        Assert.NotNull(problemDetails);
        Assert.Contains("Detailed error info", problemDetails.Detail);
    }

    // ────────────────────────────── No exception ──────────────────────────────

    [Fact]
    public async Task Invoke_NoException_PassesThroughSuccessfully()
    {
        var nextCalled = false;
        var middleware = CreateMiddleware(_ =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        });
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.True(nextCalled);
        Assert.Equal(200, context.Response.StatusCode); // Default
    }

    // ────────────────────────────── TraceId ──────────────────────────────

    [Fact]
    public async Task Invoke_Exception_IncludesTraceIdInResponse()
    {
        var middleware = CreateMiddleware(_ => throw new NotFoundException("Item", 1));
        var context = CreateHttpContext();
        context.TraceIdentifier = "trace-abc-123";

        await middleware.Invoke(context);

        context.Response.Body.Seek(0, SeekOrigin.Begin);
        var json = await new StreamReader(context.Response.Body).ReadToEndAsync();
        Assert.Contains("trace-abc-123", json);
    }

    // ────────────────────────────── Content-Type ──────────────────────────────

    [Fact]
    public async Task Invoke_Exception_SetsContentTypeToProblemJson()
    {
        var middleware = CreateMiddleware(_ => throw new ConflictException("Conflict"));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        Assert.Equal("application/problem+json", context.Response.ContentType);
    }

    // ────────────────────────────── Logging ──────────────────────────────

    [Fact]
    public async Task Invoke_ServerError_LogsError()
    {
        var middleware = CreateMiddleware(_ => throw new Exception("Server exploded."));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        _logger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task Invoke_DomainException_LogsWarning()
    {
        var middleware = CreateMiddleware(_ => throw new NotFoundException("Item", 1));
        var context = CreateHttpContext();

        await middleware.Invoke(context);

        _logger.Verify(
            x => x.Log(
                LogLevel.Warning,
                It.IsAny<EventId>(),
                It.IsAny<It.IsAnyType>(),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
