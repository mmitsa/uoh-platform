using MailKit.Net.Smtp;
using MimeKit;

namespace UohMeetings.Api.Integrations;

public sealed class SmtpEmailSender(IConfiguration config, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct)
    {
        var host = config["Integrations:Smtp:Host"];
        var port = config.GetValue("Integrations:Smtp:Port", 587);
        var user = config["Integrations:Smtp:Username"];
        var pass = config["Integrations:Smtp:Password"];
        var from = config["Integrations:Smtp:From"] ?? user;

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            throw new InvalidOperationException("SMTP is not configured.");

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(from));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.StartTls, ct);
            if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
            {
                await client.AuthenticateAsync(user, pass, ct);
            }

            await client.SendAsync(message, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send SMTP email to {To}", toEmail);
            throw;
        }
        finally
        {
            await client.DisconnectAsync(true, ct);
        }
    }
}

