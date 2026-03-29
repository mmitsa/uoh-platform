using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.IdentityModel.Tokens;
using OpenTelemetry.Trace;
using UohMeetings.Api.Data;
using UohMeetings.Api.Integrations;
using UohMeetings.Api.Middleware;
using UohMeetings.Api.Hubs;
using UohMeetings.Api.Services;
using StackExchange.Redis;
using UohMeetings.Api.Storage;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// JSON enum serialization as strings
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "UOH Meetings API",
        Version = "v1",
        Description = "API for the University of Hail Meetings & Committees Management Platform"
    });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Bearer token from Microsoft Entra ID",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// CORS
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowedOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("api", limiterOptions =>
    {
        limiterOptions.PermitLimit = 200;
        limiterOptions.Window = TimeSpan.FromMinutes(1);
        limiterOptions.QueueLimit = 0;
    });
});

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("Postgres");
    options.UseNpgsql(cs);
});

// Redis Distributed Cache
var redisCs = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrWhiteSpace(redisCs))
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisCs));
    builder.Services.AddStackExchangeRedisCache(o =>
    {
        o.Configuration = redisCs;
        o.InstanceName = "UohMeetings:";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSingleton<IConnectionMultiplexer>(sp => null!);
}

builder.Services.AddSingleton<ICacheService, RedisCacheService>();

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// Data Protection (for encrypting system settings)
builder.Services.AddDataProtection();

// Services
builder.Services.AddScoped<WorkflowEngine>();
builder.Services.AddScoped<MomExportService>();
builder.Services.AddScoped<DataSeeder>();
builder.Services.AddScoped<ICommitteeService, CommitteeService>();
builder.Services.AddScoped<IMeetingService, MeetingService>();
builder.Services.AddScoped<IMomService, MomService>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IVotingService, VotingService>();
builder.Services.AddScoped<ISurveyService, SurveyService>();
builder.Services.AddScoped<ILiveSurveyService, LiveSurveyService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IDashboardLayoutService, DashboardLayoutService>();
builder.Services.AddScoped<IExternalDataService, ExternalDataService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IDirectiveService, DirectiveService>();
builder.Services.AddScoped<IEvaluationService, EvaluationService>();
builder.Services.AddScoped<IChangeRequestService, ChangeRequestService>();
builder.Services.AddScoped<IAcknowledgmentService, AcknowledgmentService>();

// User Management & Roles
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IRoleManagementService, RoleManagementService>();
builder.Services.AddScoped<IAdSyncService, AdSyncService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IAdGroupMappingService, AdGroupMappingService>();
builder.Services.AddScoped<ISystemSettingsService, SystemSettingsService>();
builder.Services.AddScoped<IShareLinkService, ShareLinkService>();
builder.Services.AddScoped<IWebPushService, WebPushService>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// SignalR
builder.Services.AddSignalR();

// Storage
builder.Services.AddScoped<MinioFileStorage>();
builder.Services.AddScoped<AzureBlobFileStorage>();
builder.Services.AddScoped<IFileStorage>(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var provider = cfg["Storage:DefaultProvider"]?.ToLowerInvariant() ?? "minio";
    return provider switch
    {
        "azure" => sp.GetRequiredService<AzureBlobFileStorage>(),
        _ => sp.GetRequiredService<MinioFileStorage>(),
    };
});

// Audit log background processing
builder.Services.AddSingleton<AuditLogQueue>();
builder.Services.AddHostedService<AuditLogBackgroundWriter>();

// Automatic reminder notifications
builder.Services.AddHostedService<ReminderBackgroundService>();

// Scheduled AD sync
builder.Services.AddHostedService<AdSyncBackgroundService>();

// SLA escalation for workflow engine
builder.Services.AddHostedService<SlaEscalationService>();

// Integrations
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<SmsNotificationProvider>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IPushNotifier, FcmPushNotifier>();
builder.Services.AddScoped<ICalendarProvider, GraphCalendarProvider>();
builder.Services.AddSingleton<ISmsProvider, SmsNotificationProvider>();

// Observability
builder.Services.AddOpenTelemetry()
    .WithTracing(t =>
    {
        t.AddAspNetCoreInstrumentation();
        t.AddHttpClientInstrumentation();
        if (builder.Configuration.GetValue<bool>("Observability:Otlp:Enabled"))
        {
            t.AddOtlpExporter();
        }
    });

// Online Meeting provider
builder.Services.AddScoped<TeamsOnlineMeetingProvider>();
builder.Services.AddScoped<ZoomOnlineMeetingProvider>();
builder.Services.AddScoped<IOnlineMeetingProvider>(sp =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var platform = cfg["Integrations:OnlineMeeting:DefaultProvider"]?.ToLowerInvariant();
    return platform switch
    {
        "zoom" => sp.GetRequiredService<ZoomOnlineMeetingProvider>(),
        _ => sp.GetRequiredService<TeamsOnlineMeetingProvider>(),
    };
});

// Authentication & Authorization — dual scheme: Azure AD + local JWT
var jwtSecret = builder.Configuration["Jwt:SecretKey"] ?? "UoH-Dev-SecretKey-2024-MinLength32Chars!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "UohMeetings";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "UohMeetings";

var authBuilder = builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = "MultiAuth";
        options.DefaultChallengeScheme = "MultiAuth";
    })
    .AddJwtBearer("LocalJwt", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(5),
        };
    })
    .AddPolicyScheme("MultiAuth", "Azure AD or Local JWT", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
            if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
            {
                var token = authHeader["Bearer ".Length..].Trim();
                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    if (handler.CanReadToken(token))
                    {
                        var jwt = handler.ReadJwtToken(token);
                        if (jwt.Issuer == jwtIssuer) return "LocalJwt";
                    }
                }
                catch { /* not a valid JWT, fall through to Azure AD */ }
            }
            return "AzureAd";
        };
    });

authBuilder.AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"), jwtBearerScheme: "AzureAd");

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Role.SystemAdmin", p => p.RequireRole("SystemAdmin"));
    options.AddPolicy("Role.CommitteeHead", p => p.RequireRole("CommitteeHead", "SystemAdmin"));
    options.AddPolicy("Role.CommitteeSecretary", p => p.RequireRole("CommitteeSecretary", "SystemAdmin"));
    options.AddPolicy("Role.CommitteeMember", p => p.RequireRole("CommitteeMember", "SystemAdmin"));
    options.AddPolicy("Role.Observer", p => p.RequireRole("Observer", "SystemAdmin"));
});

var app = builder.Build();

// Auto-migrate / seed (guarded)
using (var scope = app.Services.CreateScope())
{
    var cfg = scope.ServiceProvider.GetRequiredService<IConfiguration>();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    var autoMigrate = cfg.GetValue("Database:AutoMigrate", app.Environment.IsDevelopment());
    if (autoMigrate)
    {
        db.Database.Migrate();
    }

    var autoSeed = cfg.GetValue("Database:AutoSeed", app.Environment.IsDevelopment());
    if (autoSeed)
    {
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync(CancellationToken.None);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// HTTPS enforcement in production
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Middleware pipeline (order matters)
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
app.UseRateLimiter();
app.UseCors("AllowedOrigins");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<UserProvisioningMiddleware>();
app.UseMiddleware<AcknowledgmentMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<AuditMiddleware>();

app.MapControllers().RequireRateLimiting("api");

// Health check: database + redis connectivity
app.MapGet("/health", async (AppDbContext db, IConnectionMultiplexer? redis) =>
{
    var checks = new Dictionary<string, string>();
    var healthy = true;

    // Database check
    try
    {
        await db.Database.CanConnectAsync();
        checks["database"] = "ok";
    }
    catch
    {
        checks["database"] = "unreachable";
        healthy = false;
    }

    // Redis check
    try
    {
        if (redis is not null && redis.IsConnected)
            checks["redis"] = "ok";
        else
            checks["redis"] = "not_connected";
    }
    catch
    {
        checks["redis"] = "unreachable";
    }

    var result = new { status = healthy ? "healthy" : "degraded", checks };
    return healthy ? Results.Ok(result) : Results.Json(result, statusCode: 503);
});
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<LiveSurveyHub>("/hubs/live-survey");
app.MapHub<ChatHub>("/hubs/chat");

app.Run();

// Make the auto-generated Program class accessible to the integration test project.
public partial class Program { }
