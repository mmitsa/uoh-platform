using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using UohMeetings.Api.Exceptions;

namespace UohMeetings.Api.Middleware;

public sealed class GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger, IWebHostEnvironment env)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var problemDetails = exception switch
        {
            NotFoundException nf => new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Not Found",
                Detail = nf.Message,
                Extensions = { ["code"] = nf.Code },
            },
            Exceptions.ValidationException ve => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation Error",
                Detail = ve.Message,
                Extensions =
                {
                    ["code"] = ve.Code,
                    ["errors"] = ve.Errors,
                },
            },
            ConflictException ce => new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Conflict",
                Detail = ce.Message,
                Extensions = { ["code"] = ce.Code },
            },
            ForbiddenException fe => new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Forbidden",
                Detail = fe.Message,
                Extensions = { ["code"] = fe.Code },
            },
            UnauthorizedAccessException ua => new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Unauthorized",
                Detail = ua.Message,
            },
            InvalidOperationException ioe => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Bad Request",
                Detail = ioe.Message,
                Extensions = { ["code"] = "INVALID_OPERATION" },
            },
            _ => new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Internal Server Error",
                Detail = env.IsDevelopment() ? exception.ToString() : "An unexpected error occurred.",
            },
        };

        problemDetails.Extensions["traceId"] = context.TraceIdentifier;

        if (problemDetails.Status >= 500)
        {
            logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
        }
        else
        {
            logger.LogWarning("Domain exception for {Method} {Path}: {Message}", context.Request.Method, context.Request.Path, exception.Message);
        }

        context.Response.StatusCode = problemDetails.Status ?? 500;
        context.Response.ContentType = "application/problem+json";
        await context.Response.WriteAsync(JsonSerializer.Serialize(problemDetails, JsonOptions));
    }
}
