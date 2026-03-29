using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.MeetingsController;

namespace UohMeetings.Api.Services;

public interface IMeetingService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, Guid? committeeId);
    Task<Meeting> GetAsync(Guid id);
    Task<Meeting> CreateAsync(CreateMeetingRequest request);
    Task UpsertAgendaAsync(Guid meetingId, List<(int Order, string TitleAr, string TitleEn, string? DescriptionAr, string? DescriptionEn, int? DurationMinutes, string? PresenterName)> items);
    Task UpsertInviteesAsync(Guid meetingId, List<(string Email, string? DisplayName, InviteeRole Role)> invitees);
    Task<Meeting> PublishAsync(Guid meetingId, CancellationToken ct);
    Task<Meeting> CancelAsync(Guid meetingId, CancellationToken ct);
    Task<List<CalendarEventDto>> GetCalendarEventsAsync(DateTime from, DateTime to, Guid? committeeId, CancellationToken ct);
}
