using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SurveyQuestionConfiguration : IEntityTypeConfiguration<SurveyQuestion>
{
    public void Configure(EntityTypeBuilder<SurveyQuestion> b)
    {
        b.ToTable("survey_questions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.SurveyId).HasColumnName("survey_id");
        b.Property(x => x.Order).HasColumnName("order");
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
        b.Property(x => x.TextAr).HasColumnName("text_ar");
        b.Property(x => x.TextEn).HasColumnName("text_en");
        b.Property(x => x.OptionsJson).HasColumnName("options_json");
        b.Property(x => x.SectionAr).HasColumnName("section_ar");
        b.Property(x => x.SectionEn).HasColumnName("section_en");
        b.Property(x => x.Weight).HasColumnName("weight").HasDefaultValue(1.0);
        b.Property(x => x.Points).HasColumnName("points");
        b.Property(x => x.AllowComment).HasColumnName("allow_comment");
        b.Property(x => x.BranchingRulesJson).HasColumnName("branching_rules_json");
        b.Property(x => x.SliderMin).HasColumnName("slider_min");
        b.Property(x => x.SliderMax).HasColumnName("slider_max");
        b.Property(x => x.ImageUrl).HasColumnName("image_url");
        b.HasIndex(x => new { x.SurveyId, x.Order }).IsUnique();
    }
}
