namespace UohMeetings.Api.Entities;

public sealed class AdSyncLog
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string SyncType { get; set; } = "manual"; // manual, scheduled, group_mapping
    public string? TriggeredByObjectId { get; set; }

    public DateTime StartedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAtUtc { get; set; }

    public string Status { get; set; } = "running"; // running, completed, failed

    public int TotalProcessed { get; set; }
    public int UsersCreated { get; set; }
    public int UsersUpdated { get; set; }
    public int RolesAssigned { get; set; }
    public int RolesRemoved { get; set; }
    public int PhotosSynced { get; set; }
    public int Errors { get; set; }

    public string? ErrorDetailsJson { get; set; }
    public string? GroupId { get; set; }
}
