using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace UohMeetings.Api.Integrations;

public sealed class GraphCalendarProvider(IConfiguration config, ILogger<GraphCalendarProvider> logger) : ICalendarProvider
{
    private GraphServiceClient CreateGraphClient()
    {
        var tenantId = config["Integrations:Teams:TenantId"];
        var clientId = config["Integrations:Teams:ClientId"];
        var clientSecret = config["Integrations:Teams:ClientSecret"];
        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            throw new InvalidOperationException("Graph credentials are not configured.");

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        return new GraphServiceClient(credential, ["https://graph.microsoft.com/.default"]);
    }

    public async Task<CalendarEventResult> CreateEventAsync(CalendarEventRequest request, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Teams:Enabled");
        if (!enabled) throw new InvalidOperationException("Graph/Teams integration is disabled.");

        var organizer = config["Integrations:Teams:OrganizerUpn"];
        if (string.IsNullOrWhiteSpace(organizer))
            throw new InvalidOperationException("Organizer UPN is not configured.");

        var graph = CreateGraphClient();

        try
        {
            var ev = new Event
            {
                Subject = request.Subject,
                Body = new ItemBody
                {
                    ContentType = BodyType.Html,
                    Content = request.OnlineJoinUrl is null
                        ? ""
                        : $"<p>Online meeting: <a href=\"{request.OnlineJoinUrl}\">{request.OnlineJoinUrl}</a></p>",
                },
                Start = new DateTimeTimeZone { DateTime = request.StartDateTimeUtc.ToString("o"), TimeZone = "UTC" },
                End = new DateTimeTimeZone { DateTime = request.EndDateTimeUtc.ToString("o"), TimeZone = "UTC" },
                Location = string.IsNullOrWhiteSpace(request.Location) ? null : new Location { DisplayName = request.Location },
                Attendees = request.AttendeeEmails
                    .Where(e => !string.IsNullOrWhiteSpace(e))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Select(e => new Attendee
                    {
                        Type = AttendeeType.Required,
                        EmailAddress = new EmailAddress { Address = e },
                    })
                    .ToList(),
            };

            var created = await graph.Users[organizer].Calendar.Events.PostAsync(ev, cancellationToken: ct);
            if (string.IsNullOrWhiteSpace(created?.Id))
                throw new InvalidOperationException("Graph did not return event id.");

            return new CalendarEventResult(created.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create Exchange calendar event via Graph.");
            throw;
        }
    }

    public async Task UpdateEventAsync(string providerEventId, CalendarEventRequest request, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Teams:Enabled");
        if (!enabled) throw new InvalidOperationException("Graph/Teams integration is disabled.");

        var organizer = config["Integrations:Teams:OrganizerUpn"];
        if (string.IsNullOrWhiteSpace(organizer))
            throw new InvalidOperationException("Organizer UPN is not configured.");

        var graph = CreateGraphClient();

        try
        {
            var update = new Event
            {
                Subject = request.Subject,
                Body = new ItemBody
                {
                    ContentType = BodyType.Html,
                    Content = request.OnlineJoinUrl is null
                        ? ""
                        : $"<p>Online meeting: <a href=\"{request.OnlineJoinUrl}\">{request.OnlineJoinUrl}</a></p>",
                },
                Start = new DateTimeTimeZone { DateTime = request.StartDateTimeUtc.ToString("o"), TimeZone = "UTC" },
                End = new DateTimeTimeZone { DateTime = request.EndDateTimeUtc.ToString("o"), TimeZone = "UTC" },
                Location = string.IsNullOrWhiteSpace(request.Location) ? null : new Location { DisplayName = request.Location },
                Attendees = request.AttendeeEmails
                    .Where(e => !string.IsNullOrWhiteSpace(e))
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Select(e => new Attendee
                    {
                        Type = AttendeeType.Required,
                        EmailAddress = new EmailAddress { Address = e },
                    })
                    .ToList(),
            };

            await graph.Users[organizer].Calendar.Events[providerEventId].PatchAsync(update, cancellationToken: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update Exchange calendar event via Graph.");
            throw;
        }
    }

    public async Task CancelEventAsync(string providerEventId, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Teams:Enabled");
        if (!enabled) throw new InvalidOperationException("Graph/Teams integration is disabled.");

        var organizer = config["Integrations:Teams:OrganizerUpn"];
        if (string.IsNullOrWhiteSpace(organizer))
            throw new InvalidOperationException("Organizer UPN is not configured.");

        var graph = CreateGraphClient();
        try
        {
            await graph.Users[organizer].Calendar.Events[providerEventId].DeleteAsync(cancellationToken: ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to cancel Exchange calendar event via Graph.");
            throw;
        }
    }
}

