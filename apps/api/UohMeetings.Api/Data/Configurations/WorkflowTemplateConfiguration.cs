using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class WorkflowTemplateConfiguration : IEntityTypeConfiguration<WorkflowTemplate>
{
    public void Configure(EntityTypeBuilder<WorkflowTemplate> b)
    {
        b.ToTable("workflow_templates");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.Name).HasColumnName("name");
        b.Property(x => x.Domain).HasColumnName("domain");
        b.Property(x => x.DefinitionJson).HasColumnName("definition_json");
        b.Property(x => x.BuilderMetadataJson).HasColumnName("builder_metadata_json");
        b.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        b.HasIndex(x => new { x.Domain, x.Name }).IsUnique();
        b.HasQueryFilter(x => !x.IsDeleted);
    }
}
