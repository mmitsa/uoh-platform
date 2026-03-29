using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class CommitteeConfiguration : IEntityTypeConfiguration<Committee>
{
    public void Configure(EntityTypeBuilder<Committee> b)
    {
        b.ToTable("committees");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
        b.Property(x => x.NameAr).HasColumnName("name_ar");
        b.Property(x => x.NameEn).HasColumnName("name_en");
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(2000);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(2000);
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();

        // Parent–child hierarchy
        b.Property(x => x.ParentCommitteeId).HasColumnName("parent_committee_id");
        b.HasOne(x => x.ParentCommittee)
            .WithMany(x => x.SubCommittees)
            .HasForeignKey(x => x.ParentCommitteeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Dates (for temporary committees)
        b.Property(x => x.StartDate).HasColumnName("start_date");
        b.Property(x => x.EndDate).HasColumnName("end_date");

        // Governance
        b.Property(x => x.MaxMembers).HasColumnName("max_members");
        b.Property(x => x.ObjectivesAr).HasColumnName("objectives_ar").HasMaxLength(4000);
        b.Property(x => x.ObjectivesEn).HasColumnName("objectives_en").HasMaxLength(4000);

        b.Property(x => x.WorkflowTemplateId).HasColumnName("workflow_template_id");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        b.HasMany(x => x.Members).WithOne(x => x.Committee!).HasForeignKey(x => x.CommitteeId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.Type);
        b.HasIndex(x => x.ParentCommitteeId);
    }
}
