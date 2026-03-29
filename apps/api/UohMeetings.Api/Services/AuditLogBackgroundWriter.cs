using Microsoft.EntityFrameworkCore;
using UohMeetings.Api.Data;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Services;

public sealed class AuditLogBackgroundWriter(
    AuditLogQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<AuditLogBackgroundWriter> logger) : BackgroundService
{
    private const int MaxBatchSize = 50;
    private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(2);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("AuditLogBackgroundWriter started");

        var batch = new List<AuditLogEntry>(MaxBatchSize);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                batch.Clear();

                // Wait for the first entry (blocks until one is available or cancelled)
                if (await queue.Reader.WaitToReadAsync(stoppingToken))
                {
                    // Drain available entries up to the batch size, with a flush deadline
                    using var flushCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
                    flushCts.CancelAfter(FlushInterval);

                    try
                    {
                        while (batch.Count < MaxBatchSize
                               && await queue.Reader.WaitToReadAsync(flushCts.Token))
                        {
                            while (batch.Count < MaxBatchSize
                                   && queue.Reader.TryRead(out var entry))
                            {
                                batch.Add(entry);
                            }
                        }
                    }
                    catch (OperationCanceledException) when (!stoppingToken.IsCancellationRequested)
                    {
                        // Flush timer expired — that is expected; proceed to write whatever we have
                    }
                }

                if (batch.Count > 0)
                {
                    await FlushBatchAsync(batch, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Graceful shutdown requested — drain remaining entries
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Unexpected error in audit log background writer loop");
                // Brief pause before retrying to avoid tight error loops
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }
        }

        // Drain any remaining entries in the channel before stopping
        batch.Clear();
        while (queue.Reader.TryRead(out var remaining))
        {
            batch.Add(remaining);
        }

        if (batch.Count > 0)
        {
            logger.LogInformation("Flushing {Count} remaining audit log entries before shutdown", batch.Count);
            await FlushBatchAsync(batch, CancellationToken.None);
        }

        logger.LogInformation("AuditLogBackgroundWriter stopped");
    }

    private async Task FlushBatchAsync(List<AuditLogEntry> batch, CancellationToken cancellationToken)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.AuditLogEntries.AddRange(batch);
            await db.SaveChangesAsync(cancellationToken);

            logger.LogDebug("Persisted {Count} audit log entries", batch.Count);
        }
        catch (DbUpdateException ex)
        {
            logger.LogWarning(ex, "Failed to persist batch of {Count} audit log entries", batch.Count);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Unexpected error persisting audit log batch of {Count} entries", batch.Count);
        }
    }
}
