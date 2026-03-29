using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;

namespace UohMeetings.Api.Integrations;

public sealed class TeamsOnlineMeetingProvider(IConfiguration config, ILogger<TeamsOnlineMeetingProvider> logger) : IOnlineMeetingProvider
{
    public async Task<OnlineMeetingResult> CreateMeetingAsync(OnlineMeetingRequest request, CancellationToken ct)
    {
        var enabled = config.GetValue<bool>("Integrations:Teams:Enabled");
        if (!enabled) throw new InvalidOperationException("Teams integration is disabled.");

        var tenantId = config["Integrations:Teams:TenantId"];
        var clientId = config["Integrations:Teams:ClientId"];
        var clientSecret = config["Integrations:Teams:ClientSecret"];
        var organizer = config["Integrations:Teams:OrganizerUpn"];

        if (string.IsNullOrWhiteSpace(tenantId) || string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            throw new InvalidOperationException("Teams integration credentials are not configured.");

        if (string.IsNullOrWhiteSpace(organizer))
            throw new InvalidOperationException("Teams organizer UPN is not configured.");

        var credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
        var graph = new GraphServiceClient(credential, ["https://graph.microsoft.com/.default"]);

        try
        {
            var onlineMeeting = new OnlineMeeting
            {
                Subject = request.Subject,
                StartDateTime = request.StartDateTimeUtc,
                EndDateTime = request.EndDateTimeUtc,
            };

            var created = await graph.Users[organizer].OnlineMeetings.PostAsync(onlineMeeting, cancellationToken: ct);
            if (created?.JoinWebUrl is null || created.Id is null)
                throw new InvalidOperationException("Graph did not return JoinWebUrl/Id.");

            return new OnlineMeetingResult(created.JoinWebUrl, created.Id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create Teams online meeting via Graph.");
            throw;
        }
    }
}

