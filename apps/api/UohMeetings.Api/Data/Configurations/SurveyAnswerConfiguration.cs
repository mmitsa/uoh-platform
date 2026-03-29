using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SurveyAnswerConfiguration : IEntityTypeConfiguration<SurveyAnswer>
{
    public void Configure(EntityTypeBuilder<SurveyAnswer> b)
    {
        b.ToTable("survey_answers");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.SurveyResponseId).HasColumnName("survey_response_id");
        b.Property(x => x.SurveyQuestionId).HasColumnName("survey_question_id");
        b.Property(x => x.ValueJson).HasColumnName("value_json");
        b.HasIndex(x => new { x.SurveyResponseId, x.SurveyQuestionId }).IsUnique();
    }
}
