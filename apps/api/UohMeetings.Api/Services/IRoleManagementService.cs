using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public interface IRoleManagementService
{
    Task<(int Total, List<object> Items)> ListRolesAsync(int page, int pageSize, bool? isActive);
    Task<AppRole> GetRoleAsync(Guid id);
    Task<AppRole> CreateRoleAsync(string key, string nameAr, string nameEn, string? descAr, string? descEn);
    Task<AppRole> UpdateRoleAsync(Guid id, string nameAr, string nameEn, string? descAr, string? descEn);
    Task DeleteRoleAsync(Guid id);
    Task SetRolePermissionsAsync(Guid roleId, List<Guid> permissionIds);
    Task<List<AppPermission>> GetRolePermissionsAsync(Guid roleId);
}
