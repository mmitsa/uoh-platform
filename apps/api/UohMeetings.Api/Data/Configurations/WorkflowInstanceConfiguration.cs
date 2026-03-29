using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class WorkflowInstanceConfiguration : IEntityTypeConfiguration<WorkflowInstance>
{
    public void Configure(EntityTypeBuilder<WorkflowInstance> b)
    {
        b.ToTable("workflow_instances");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.TemplateId).HasColumnName("template_id");
        b.Property(x => x.Domain).HasColumnName("domain");
        b.Property(x => x.EntityId).HasColumnName("entity_id");
        b.Property(x => x.CurrentState).HasColumnName("current_state");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        b.HasMany(x => x.History).WithOne().HasForeignKey(x => x.InstanceId);
        b.HasIndex(x => new { x.Domain, x.EntityId }).IsUnique();
    }
}
