using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace UohMeetings.Api.Services;

public sealed class RedisCacheService(
    IDistributedCache cache,
    IConnectionMultiplexer? redis,
    ILogger<RedisCacheService> logger) : ICacheService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct) where T : class
    {
        try
        {
            var json = await cache.GetStringAsync(key, ct);
            if (json is null) return null;
            return JsonSerializer.Deserialize<T>(json, JsonOpts);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache GET failed for key {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry, CancellationToken ct) where T : class
    {
        try
        {
            var json = JsonSerializer.Serialize(value, JsonOpts);
            var options = new DistributedCacheEntryOptions();
            if (expiry.HasValue) options.AbsoluteExpirationRelativeToNow = expiry;
            await cache.SetStringAsync(key, json, options, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache SET failed for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct)
    {
        try
        {
            await cache.RemoveAsync(key, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache REMOVE failed for key {Key}", key);
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken ct)
    {
        try
        {
            if (redis is null) return;
            var server = redis.GetServers().FirstOrDefault();
            if (server is null) return;

            var keys = server.Keys(pattern: $"UohMeetings:{prefix}*").ToArray();
            if (keys.Length == 0) return;

            var db = redis.GetDatabase();
            await db.KeyDeleteAsync(keys);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache REMOVE_BY_PREFIX failed for prefix {Prefix}", prefix);
        }
    }
}
