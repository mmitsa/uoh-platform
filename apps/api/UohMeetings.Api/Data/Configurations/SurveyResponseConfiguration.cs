using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SurveyResponseConfiguration : IEntityTypeConfiguration<SurveyResponse>
{
    public void Configure(EntityTypeBuilder<SurveyResponse> b)
    {
        b.ToTable("survey_responses");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.SurveyId).HasColumnName("survey_id");
        b.Property(x => x.RespondentObjectId).HasColumnName("respondent_object_id");
        b.Property(x => x.SubmittedAtUtc).HasColumnName("submitted_at_utc");
        b.Property(x => x.EmployeeId).HasColumnName("employee_id");
        b.Property(x => x.RespondentName).HasColumnName("respondent_name");
        b.Property(x => x.RespondentEmail).HasColumnName("respondent_email");
        b.Property(x => x.RespondentPhone).HasColumnName("respondent_phone");
        b.Property(x => x.Department).HasColumnName("department");
        b.Property(x => x.Gender).HasColumnName("gender");
        b.Property(x => x.IsProxySubmission).HasColumnName("is_proxy_submission");
        b.Property(x => x.ProxySubmittedBy).HasColumnName("proxy_submitted_by");
        b.HasMany(x => x.Answers).WithOne().HasForeignKey(x => x.SurveyResponseId);
        b.HasIndex(x => x.SurveyId);
    }
}
