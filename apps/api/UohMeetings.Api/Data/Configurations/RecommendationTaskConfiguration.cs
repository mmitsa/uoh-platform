using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class RecommendationTaskConfiguration : IEntityTypeConfiguration<RecommendationTask>
{
    public void Configure(EntityTypeBuilder<RecommendationTask> b)
    {
        b.ToTable("recommendation_tasks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MomId).HasColumnName("mom_id");
        b.Property(x => x.CommitteeId).HasColumnName("committee_id");
        b.Property(x => x.TitleAr).HasColumnName("title_ar");
        b.Property(x => x.TitleEn).HasColumnName("title_en");
        b.Property(x => x.AssignedToObjectId).HasColumnName("assigned_to_object_id");
        b.Property(x => x.AssignedToDisplayName).HasColumnName("assigned_to_display_name");
        b.Property(x => x.AssignedToEmail).HasColumnName("assigned_to_email");
        b.Property(x => x.DueDateUtc).HasColumnName("due_date_utc");
        b.Property(x => x.Priority).HasColumnName("priority").HasConversion<string>();
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.Progress).HasColumnName("progress");
        b.Property(x => x.Category).HasColumnName("category");
        b.Property(x => x.Beneficiary).HasColumnName("beneficiary");
        b.Property(x => x.ReceiptNumber).HasColumnName("receipt_number");
        b.Property(x => x.AttachmentsJson).HasColumnName("attachments_json");
        b.HasMany(x => x.SubTasks).WithOne().HasForeignKey(x => x.RecommendationTaskId);
        b.HasIndex(x => x.AssignedToObjectId);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => new { x.MomId, x.Status });
    }
}
