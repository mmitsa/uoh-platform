using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class SystemSettingsService(
    AppDbContext db,
    IDataProtectionProvider dataProtectionProvider,
    IConfiguration config,
    ILogger<SystemSettingsService> logger) : ISystemSettingsService
{
    private const string ProtectorPurpose = "UohMeetings.SystemSettings.v1";
    private IDataProtector Protector => dataProtectionProvider.CreateProtector(ProtectorPurpose);

    public async Task<string?> GetAsync(string key, CancellationToken ct = default)
    {
        var setting = await db.SystemSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key, ct);
        if (setting is null) return null;
        return setting.IsEncrypted ? Decrypt(setting.Value) : setting.Value;
    }

    public async Task<string?> GetWithFallbackAsync(string key, string? configFallbackPath = null,
        CancellationToken ct = default)
    {
        var dbValue = await GetAsync(key, ct);
        if (!string.IsNullOrEmpty(dbValue)) return dbValue;
        return configFallbackPath is not null ? config[configFallbackPath] : null;
    }

    public async Task<Dictionary<string, string?>> GetGroupAsync(string groupKey, CancellationToken ct = default)
    {
        var settings = await db.SystemSettings.AsNoTracking()
            .Where(s => s.GroupKey == groupKey)
            .ToListAsync(ct);

        var result = new Dictionary<string, string?>();
        foreach (var s in settings)
            result[s.Key] = s.IsEncrypted ? Decrypt(s.Value) : s.Value;
        return result;
    }

    public async Task SetAsync(string key, string value, bool isEncrypted = false,
        string? dataType = null, string? groupKey = null,
        string? description = null, string? updatedByObjectId = null,
        CancellationToken ct = default)
    {
        var existing = await db.SystemSettings.FirstOrDefaultAsync(s => s.Key == key, ct);
        var storedValue = isEncrypted ? Encrypt(value) : value;

        if (existing is not null)
        {
            existing.Value = storedValue;
            existing.IsEncrypted = isEncrypted;
            existing.UpdatedByObjectId = updatedByObjectId;
            existing.UpdatedAtUtc = DateTime.UtcNow;
            if (dataType is not null) existing.DataType = dataType;
            if (groupKey is not null) existing.GroupKey = groupKey;
            if (description is not null) existing.Description = description;
        }
        else
        {
            db.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = storedValue,
                IsEncrypted = isEncrypted,
                GroupKey = groupKey ?? key.Split('.').FirstOrDefault() ?? "",
                DataType = dataType ?? "string",
                Description = description,
                UpdatedByObjectId = updatedByObjectId,
            });
        }

        await db.SaveChangesAsync(ct);
    }

    private string Encrypt(string plainText)
    {
        try { return Protector.Protect(plainText); }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to encrypt setting value");
            throw;
        }
    }

    private string? Decrypt(string cipherText)
    {
        try { return Protector.Unprotect(cipherText); }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to decrypt setting value — returning null");
            return null;
        }
    }
}
