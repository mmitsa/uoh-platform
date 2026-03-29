using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IMomService
{
    Task<Mom> GetByMeetingAsync(Guid meetingId);
    Task<Mom> CreateForMeetingAsync(Guid meetingId);
    Task UpsertAttendanceAsync(Guid momId, List<(string UserObjectId, string DisplayName, string Email, bool IsPresent, string? AbsenceReason)> items);
    Task UpsertAgendaMinutesAsync(Guid momId, List<(Guid AgendaItemId, string Notes)> items);
    Task UpsertDecisionsAsync(Guid momId, List<(string TitleAr, string TitleEn, string? Notes)> items);
    Task<Mom> SubmitForApprovalAsync(Guid momId);
    Task<Mom> ApproveAsync(Guid momId);
}
