using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SurveyConfiguration : IEntityTypeConfiguration<Survey>
{
    public void Configure(EntityTypeBuilder<Survey> b)
    {
        b.ToTable("surveys");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.CommitteeId).HasColumnName("committee_id");
        b.Property(x => x.RecommendationTaskId).HasColumnName("recommendation_task_id");
        b.Property(x => x.Type).HasColumnName("type");
        b.Property(x => x.TargetAudience).HasColumnName("target_audience");
        b.Property(x => x.TitleAr).HasColumnName("title_ar");
        b.Property(x => x.TitleEn).HasColumnName("title_en");
        b.Property(x => x.StartAtUtc).HasColumnName("start_at_utc");
        b.Property(x => x.EndAtUtc).HasColumnName("end_at_utc");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.AllowLuckyDraw).HasColumnName("allow_lucky_draw");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.IsPublic).HasColumnName("is_public");
        b.Property(x => x.RequireEmployeeId).HasColumnName("require_employee_id");
        b.Property(x => x.CollectPersonalData).HasColumnName("collect_personal_data");
        b.HasMany(x => x.Questions).WithOne(x => x.Survey!).HasForeignKey(x => x.SurveyId);
        b.HasIndex(x => x.Status);
    }
}
