using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using UohMeetings.Api.Data;
using UohMeetings.Api.Integrations;
using UohMeetings.Api.Services;
using UohMeetings.Api.Storage;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;

namespace UohMeetings.Api.Tests.Integration;

/// <summary>
/// Custom WebApplicationFactory that replaces Postgres with an InMemory database,
/// disables external integrations, and bypasses JWT authentication for testing.
/// </summary>
public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        // Disable auto-migrate and auto-seed since InMemory DB doesn't support Migrate()
        builder.UseSetting("Database:AutoMigrate", "false");
        builder.UseSetting("Database:AutoSeed", "false");

        // Clear Redis connection string so in-memory cache is used in tests
        builder.UseSetting("Redis:ConnectionString", "");

        builder.ConfigureServices(services =>
        {
            // ── Replace database with InMemory ──
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.RemoveAll(typeof(AppDbContext));

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_dbName);
            });

            // ── Replace authentication with a test scheme ──
            services.RemoveAll(typeof(IConfigureOptions<AuthenticationOptions>));
            services.RemoveAll(typeof(IConfigureOptions<JwtBearerOptions>));

            services.AddAuthentication("Test")
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });

            services.AddAuthorization(options =>
            {
                // Re-register policies to work with any authenticated user for testing
                options.AddPolicy("Role.SystemAdmin", p => p.RequireAuthenticatedUser());
                options.AddPolicy("Role.CommitteeHead", p => p.RequireAuthenticatedUser());
                options.AddPolicy("Role.CommitteeSecretary", p => p.RequireAuthenticatedUser());
                options.AddPolicy("Role.CommitteeMember", p => p.RequireAuthenticatedUser());
                options.AddPolicy("Role.Observer", p => p.RequireAuthenticatedUser());
            });

            // ── Replace cache with no-op mock to avoid cross-test interference ──
            services.RemoveAll(typeof(ICacheService));
            services.AddSingleton<ICacheService>(new Mock<ICacheService>().Object);

            // ── Replace external services with mocks ──
            services.RemoveAll(typeof(IOnlineMeetingProvider));
            services.RemoveAll(typeof(ICalendarProvider));
            services.RemoveAll(typeof(IEmailSender));
            services.RemoveAll(typeof(IPushNotifier));
            services.RemoveAll(typeof(IFileStorage));

            var mockOnline = new Mock<IOnlineMeetingProvider>();
            mockOnline
                .Setup(x => x.CreateMeetingAsync(It.IsAny<OnlineMeetingRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new OnlineMeetingResult("https://test.link/join", "test-meeting-id"));

            var mockCalendar = new Mock<ICalendarProvider>();
            mockCalendar
                .Setup(x => x.CreateEventAsync(It.IsAny<CalendarEventRequest>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new CalendarEventResult("test-event-id"));

            var mockEmail = new Mock<IEmailSender>();
            var mockPush = new Mock<IPushNotifier>();
            var mockStorage = new Mock<IFileStorage>();

            services.AddSingleton(mockOnline.Object);
            services.AddSingleton(mockCalendar.Object);
            services.AddSingleton(mockEmail.Object);
            services.AddSingleton(mockPush.Object);
            services.AddSingleton(mockStorage.Object);
        });
    }

    /// <summary>
    /// Ensures the InMemory database is created and available for testing.
    /// </summary>
    public void EnsureDatabaseCreated()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
    }
}

/// <summary>
/// Authentication handler that auto-authenticates every request with a test identity.
/// Claims simulate a SystemAdmin user for maximum access during testing.
/// </summary>
public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-user-id"),
            new Claim("oid", "test-object-id"),
            new Claim("name", "Test User"),
            new Claim("preferred_username", "test@example.com"),
            new Claim(ClaimTypes.Role, "SystemAdmin"),
            new Claim(ClaimTypes.Role, "CommitteeHead"),
            new Claim(ClaimTypes.Role, "CommitteeSecretary"),
            new Claim(ClaimTypes.Role, "CommitteeMember"),
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
