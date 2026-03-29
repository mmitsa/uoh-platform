namespace UohMeetings.Api.Services;

public sealed class AdSyncBackgroundService(
    IServiceScopeFactory scopeFactory,
    ILogger<AdSyncBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AdSyncBackgroundService started");

        // Initial delay to let the app fully start
        await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var systemSettings = scope.ServiceProvider.GetRequiredService<ISystemSettingsService>();

                // Re-check enabled/interval from DB on every cycle (allows dynamic changes from admin UI)
                var enabledStr = await systemSettings.GetWithFallbackAsync(
                    "sync.scheduledEnabled", "AdSync:ScheduledEnabled", stoppingToken);
                var enabled = bool.TryParse(enabledStr, out var e) && e;

                if (!enabled)
                {
                    logger.LogDebug("Scheduled AD sync is disabled — sleeping 5 minutes");
                    await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
                    continue;
                }

                var intervalStr = await systemSettings.GetWithFallbackAsync(
                    "sync.intervalMinutes", "AdSync:ScheduledIntervalMinutes", stoppingToken);
                var intervalMinutes = int.TryParse(intervalStr, out var im) ? im : 360;

                var adSyncService = scope.ServiceProvider.GetRequiredService<IAdSyncService>();

                logger.LogInformation("Scheduled AD sync starting...");
                var result = await adSyncService.SyncWithGroupMappingsAsync(triggeredByOid: null, stoppingToken);
                logger.LogInformation("Scheduled AD sync completed — Total: {Total}, Created: {Created}, Updated: {Updated}, Errors: {Errors}",
                    result.Total, result.Created, result.Updated, result.Errors);

                await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error in scheduled AD sync cycle");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }

        logger.LogInformation("AdSyncBackgroundService stopped");
    }
}
