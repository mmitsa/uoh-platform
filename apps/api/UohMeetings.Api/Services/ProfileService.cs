using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class ProfileService(AppDbContext db, IConfiguration config) : IProfileService
{
    public async Task<ProfileDto> GetProfileAsync(string objectId, CancellationToken ct = default)
    {
        var user = await db.AppUsers
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        return ToDto(user);
    }

    public async Task<ProfileDto> UpdateProfileAsync(string objectId, UpdateProfileRequest req, CancellationToken ct = default)
    {
        var user = await db.AppUsers
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        if (req.DisplayNameAr is not null) user.DisplayNameAr = req.DisplayNameAr;
        if (req.DisplayNameEn is not null) user.DisplayNameEn = req.DisplayNameEn;
        if (req.JobTitleAr is not null) user.JobTitleAr = req.JobTitleAr;
        if (req.JobTitleEn is not null) user.JobTitleEn = req.JobTitleEn;
        if (req.Department is not null) user.Department = req.Department;
        if (req.PhoneNumber is not null) user.PhoneNumber = req.PhoneNumber;
        user.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task<ProfileDto> UpdateAvatarAsync(string objectId, Guid fileId, CancellationToken ct = default)
    {
        var user = await db.AppUsers
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var file = await db.StoredFiles.AsNoTracking().FirstOrDefaultAsync(f => f.Id == fileId, ct)
            ?? throw new KeyNotFoundException("File not found.");

        // Build URL from stored file
        var bucket = config["Storage:Minio:Bucket"] ?? "uoh-meetings";
        var minioEndpoint = config["Storage:Minio:PublicEndpoint"] ?? config["Storage:Minio:Endpoint"] ?? "";
        user.AvatarUrl = $"{minioEndpoint.TrimEnd('/')}/{bucket}/{file.ObjectKey}";
        user.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return ToDto(user);
    }

    public async Task RemoveAvatarAsync(string objectId, CancellationToken ct = default)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.AvatarUrl = null;
        user.UpdatedAtUtc = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task<UserPreference> GetPreferencesAsync(string objectId, CancellationToken ct = default)
    {
        var user = await db.AppUsers.AsNoTracking().FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var pref = await db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        if (pref is not null) return pref;

        // Lazy-create default preferences
        pref = new UserPreference { UserId = user.Id };
        db.UserPreferences.Add(pref);
        await db.SaveChangesAsync(ct);
        return pref;
    }

    public async Task<UserPreference> UpdatePreferencesAsync(string objectId, UpdatePreferencesRequest req, CancellationToken ct = default)
    {
        var user = await db.AppUsers.AsNoTracking().FirstOrDefaultAsync(u => u.ObjectId == objectId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        var pref = await db.UserPreferences.FirstOrDefaultAsync(p => p.UserId == user.Id, ct);
        if (pref is null)
        {
            pref = new UserPreference { UserId = user.Id };
            db.UserPreferences.Add(pref);
        }

        if (req.Language is not null) pref.Language = req.Language;
        if (req.Theme is not null) pref.Theme = req.Theme;
        if (req.NotifyByEmail.HasValue) pref.NotifyByEmail = req.NotifyByEmail.Value;
        if (req.NotifyByPush.HasValue) pref.NotifyByPush = req.NotifyByPush.Value;
        if (req.NotifyBySms.HasValue) pref.NotifyBySms = req.NotifyBySms.Value;
        if (req.EmailDigestFrequency is not null) pref.EmailDigestFrequency = req.EmailDigestFrequency;
        pref.UpdatedAtUtc = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
        return pref;
    }

    private static ProfileDto ToDto(AppUser user) => new(
        user.Id,
        user.ObjectId,
        user.DisplayNameAr,
        user.DisplayNameEn,
        user.Email,
        user.EmployeeId,
        user.JobTitleAr,
        user.JobTitleEn,
        user.Department,
        user.PhoneNumber,
        user.AvatarUrl,
        user.IsActive,
        user.LastLoginAtUtc,
        user.UserRoles.Select(ur => ur.Role?.NameEn ?? "").Where(r => r != "").ToList()
    );
}
