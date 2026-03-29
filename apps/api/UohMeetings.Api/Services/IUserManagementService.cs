using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IUserManagementService
{
    Task<(int Total, List<object> Items)> ListUsersAsync(int page, int pageSize, string? search, bool? isActive);
    Task<AppUser> GetUserAsync(Guid id);
    Task<AppUser> GetOrCreateByObjectIdAsync(string objectId, string displayName, string email);
    Task<AppUser> UpdateUserAsync(Guid id, UpdateUserRequest request);
    Task ToggleUserActiveAsync(Guid id, bool isActive);
    Task<List<UserPermissionSummary>> GetUserPermissionsAsync(Guid userId);
    Task AssignRoleAsync(Guid userId, Guid roleId, string? assignedByObjectId, DateTime? expiresAtUtc);
    Task RemoveRoleAsync(Guid userId, Guid roleId);
}

public sealed record UpdateUserRequest(
    string DisplayNameAr,
    string DisplayNameEn,
    string Email,
    string? EmployeeId,
    string? JobTitleAr,
    string? JobTitleEn,
    string? Department,
    string? PhoneNumber);
