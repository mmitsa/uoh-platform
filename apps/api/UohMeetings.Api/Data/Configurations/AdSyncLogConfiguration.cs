using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AdSyncLogConfiguration : IEntityTypeConfiguration<AdSyncLog>
{
    public void Configure(EntityTypeBuilder<AdSyncLog> b)
    {
        b.ToTable("ad_sync_logs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.SyncType).HasColumnName("sync_type").HasMaxLength(50);
        b.Property(x => x.TriggeredByObjectId).HasColumnName("triggered_by_object_id").HasMaxLength(128);
        b.Property(x => x.StartedAtUtc).HasColumnName("started_at_utc");
        b.Property(x => x.CompletedAtUtc).HasColumnName("completed_at_utc");
        b.Property(x => x.Status).HasColumnName("status").HasMaxLength(20);
        b.Property(x => x.TotalProcessed).HasColumnName("total_processed");
        b.Property(x => x.UsersCreated).HasColumnName("users_created");
        b.Property(x => x.UsersUpdated).HasColumnName("users_updated");
        b.Property(x => x.RolesAssigned).HasColumnName("roles_assigned");
        b.Property(x => x.RolesRemoved).HasColumnName("roles_removed");
        b.Property(x => x.PhotosSynced).HasColumnName("photos_synced");
        b.Property(x => x.Errors).HasColumnName("errors");
        b.Property(x => x.ErrorDetailsJson).HasColumnName("error_details_json");
        b.Property(x => x.GroupId).HasColumnName("group_id").HasMaxLength(128);

        b.HasIndex(x => x.StartedAtUtc);
        b.HasIndex(x => x.Status);
    }
}
