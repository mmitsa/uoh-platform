namespace UohMeetings.Api.Integrations;

public sealed record OnlineMeetingRequest(DateTime StartDateTimeUtc, DateTime EndDateTimeUtc, string Subject);
public sealed record OnlineMeetingResult(string JoinUrl, string ProviderMeetingId);

public interface IOnlineMeetingProvider
{
    Task<OnlineMeetingResult> CreateMeetingAsync(OnlineMeetingRequest request, CancellationToken ct);
}

public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct);
}

public interface IPushNotifier
{
    Task SendAsync(string deviceToken, string title, string body, CancellationToken ct);
}

public sealed record CalendarEventRequest(
    DateTime StartDateTimeUtc,
    DateTime EndDateTimeUtc,
    string Subject,
    string? Location,
    string? OnlineJoinUrl,
    IReadOnlyList<string> AttendeeEmails
);

public sealed record CalendarEventResult(string ProviderEventId);

public interface ICalendarProvider
{
    Task<CalendarEventResult> CreateEventAsync(CalendarEventRequest request, CancellationToken ct);
    Task UpdateEventAsync(string providerEventId, CalendarEventRequest request, CancellationToken ct);
    Task CancelEventAsync(string providerEventId, CancellationToken ct);
}

public interface ISmsProvider
{
    Task SendSmsAsync(string phoneNumber, string message, CancellationToken ct = default);
}

