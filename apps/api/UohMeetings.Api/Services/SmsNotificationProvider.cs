using System.Net.Http.Headers;
using System.Text;

namespace UohMeetings.Api.Services;

public sealed class SmsNotificationProvider(
    HttpClient http,
    IConfiguration config,
    ILogger<SmsNotificationProvider> logger) : Integrations.ISmsProvider
{
    public async Task SendSmsAsync(string phoneNumber, string message, CancellationToken ct = default)
    {
        var provider = config["Sms:Provider"]?.ToLowerInvariant() ?? "mock";

        switch (provider)
        {
            case "twilio":
                await SendViaTwilioAsync(phoneNumber, message, ct);
                break;

            case "unifonic":
                await SendViaUnifonicAsync(phoneNumber, message, ct);
                break;

            case "mock":
            default:
                logger.LogInformation(
                    "[MockSms] To: {PhoneNumber}, Message: {Message}",
                    phoneNumber,
                    message);
                break;
        }
    }

    private async Task SendViaTwilioAsync(string phoneNumber, string message, CancellationToken ct)
    {
        var accountSid = config["Sms:ApiKey"]
            ?? throw new InvalidOperationException("Sms:ApiKey (Twilio Account SID) is not configured.");
        var authToken = config["Sms:ApiSecret"]
            ?? throw new InvalidOperationException("Sms:ApiSecret (Twilio Auth Token) is not configured.");
        var senderName = config["Sms:SenderName"] ?? "UohMeetings";

        var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";

        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        request.Content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["To"] = phoneNumber,
            ["From"] = senderName,
            ["Body"] = message,
        });

        var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError(
                "Twilio SMS failed: {Status} {Body}",
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException($"Twilio SMS failed with status {(int)response.StatusCode}.");
        }

        logger.LogInformation("Twilio SMS sent to {PhoneNumber}", phoneNumber);
    }

    private async Task SendViaUnifonicAsync(string phoneNumber, string message, CancellationToken ct)
    {
        var apiKey = config["Sms:ApiKey"]
            ?? throw new InvalidOperationException("Sms:ApiKey (Unifonic AppSid) is not configured.");
        var senderName = config["Sms:SenderName"] ?? "UohMeetings";

        var url = "https://el.cloud.unifonic.com/rest/SMS/messages";

        var payload = new Dictionary<string, string>
        {
            ["AppSid"] = apiKey,
            ["Recipient"] = phoneNumber,
            ["Body"] = message,
            ["SenderID"] = senderName,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Content = new FormUrlEncodedContent(payload);

        var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(ct);
            logger.LogError(
                "Unifonic SMS failed: {Status} {Body}",
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException($"Unifonic SMS failed with status {(int)response.StatusCode}.");
        }

        logger.LogInformation("Unifonic SMS sent to {PhoneNumber}", phoneNumber);
    }
}
