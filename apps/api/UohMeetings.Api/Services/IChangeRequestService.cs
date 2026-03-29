using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.ChangeRequestsController;

namespace UohMeetings.Api.Services;

public interface IChangeRequestService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, Guid? committeeId, ChangeRequestStatus? status);
    Task<CommitteeChangeRequest> GetAsync(Guid id);
    Task<CommitteeChangeRequest> CreateAsync(CreateChangeRequestRequest request);
    Task<CommitteeChangeRequest> ReviewAsync(Guid id, ReviewChangeRequestRequest request);
}
