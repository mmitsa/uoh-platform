using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class WorkflowInstanceHistoryConfiguration : IEntityTypeConfiguration<WorkflowInstanceHistory>
{
    public void Configure(EntityTypeBuilder<WorkflowInstanceHistory> b)
    {
        b.ToTable("workflow_instance_history");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.InstanceId).HasColumnName("instance_id");
        b.Property(x => x.FromState).HasColumnName("from_state");
        b.Property(x => x.ToState).HasColumnName("to_state");
        b.Property(x => x.Action).HasColumnName("action");
        b.Property(x => x.ActorObjectId).HasColumnName("actor_object_id");
        b.Property(x => x.ActorDisplayName).HasColumnName("actor_display_name");
        b.Property(x => x.OccurredAtUtc).HasColumnName("occurred_at_utc");
        b.HasIndex(x => x.InstanceId);
    }
}
