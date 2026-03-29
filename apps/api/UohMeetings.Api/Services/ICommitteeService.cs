using UohMeetings.Api.Entities;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.CommitteesController;

namespace UohMeetings.Api.Services;

public interface ICommitteeService
{
    Task<(int Total, List<object> Items)> ListAsync(int page, int pageSize, CommitteeStatus? status, CommitteeType? type, Guid? parentId);
    Task<Committee> GetAsync(Guid id);
    Task<List<object>> GetSubCommitteesAsync(Guid parentId);
    Task<Committee> CreateAsync(CreateCommitteeRequest request);
    Task<Committee> UpdateAsync(Guid id, UpdateCommitteeRequest request);
    Task UpsertMemberAsync(Guid committeeId, string userObjectId, string displayName, string email, string role, bool isActive);
    Task<List<object>> GetHierarchyAsync();
}
