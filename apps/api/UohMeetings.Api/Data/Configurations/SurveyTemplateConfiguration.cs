using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SurveyTemplateConfiguration : IEntityTypeConfiguration<SurveyTemplate>
{
    public void Configure(EntityTypeBuilder<SurveyTemplate> b)
    {
        b.ToTable("survey_templates");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.NameAr).HasColumnName("name_ar");
        b.Property(x => x.NameEn).HasColumnName("name_en");
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar");
        b.Property(x => x.DescriptionEn).HasColumnName("description_en");
        b.Property(x => x.Type).HasColumnName("type");
        b.Property(x => x.TargetAudience).HasColumnName("target_audience");
        b.Property(x => x.CreatedByObjectId).HasColumnName("created_by_object_id");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.HasMany(x => x.Questions).WithOne(x => x.Template!).HasForeignKey(x => x.SurveyTemplateId);
    }
}

public sealed class SurveyTemplateQuestionConfiguration : IEntityTypeConfiguration<SurveyTemplateQuestion>
{
    public void Configure(EntityTypeBuilder<SurveyTemplateQuestion> b)
    {
        b.ToTable("survey_template_questions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.SurveyTemplateId).HasColumnName("survey_template_id");
        b.Property(x => x.Order).HasColumnName("order");
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
        b.Property(x => x.TextAr).HasColumnName("text_ar");
        b.Property(x => x.TextEn).HasColumnName("text_en");
        b.Property(x => x.OptionsJson).HasColumnName("options_json");
        b.HasIndex(x => new { x.SurveyTemplateId, x.Order }).IsUnique();
    }
}
