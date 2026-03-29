using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class LiveSurveySessionConfiguration : IEntityTypeConfiguration<LiveSurveySession>
{
    public void Configure(EntityTypeBuilder<LiveSurveySession> b)
    {
        b.ToTable("live_survey_sessions");
        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.SurveyId).HasColumnName("survey_id");
        b.Property(x => x.JoinCode).HasColumnName("join_code").HasMaxLength(6);
        b.Property(x => x.PresenterKey).HasColumnName("presenter_key").HasMaxLength(32);
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.CurrentQuestionIndex).HasColumnName("current_question_index");
        b.Property(x => x.ParticipantCount).HasColumnName("participant_count");
        b.Property(x => x.AcceptingVotes).HasColumnName("accepting_votes");
        b.Property(x => x.CreatedByObjectId).HasColumnName("created_by_object_id");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.StartedAtUtc).HasColumnName("started_at_utc");
        b.Property(x => x.CompletedAtUtc).HasColumnName("completed_at_utc");

        b.HasIndex(x => x.JoinCode).IsUnique();
        b.HasIndex(x => x.SurveyId);
        b.HasIndex(x => x.Status);

        b.HasMany(x => x.Responses).WithOne(x => x.Session!).HasForeignKey(x => x.LiveSurveySessionId);
    }
}

public sealed class LiveSessionResponseConfiguration : IEntityTypeConfiguration<LiveSessionResponse>
{
    public void Configure(EntityTypeBuilder<LiveSessionResponse> b)
    {
        b.ToTable("live_session_responses");
        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.LiveSurveySessionId).HasColumnName("live_survey_session_id");
        b.Property(x => x.SurveyResponseId).HasColumnName("survey_response_id");
        b.Property(x => x.ParticipantFingerprint).HasColumnName("participant_fingerprint").HasMaxLength(64);
        b.Property(x => x.SubmittedAtUtc).HasColumnName("submitted_at_utc");

        b.HasIndex(x => new { x.LiveSurveySessionId, x.ParticipantFingerprint, x.SurveyResponseId }).IsUnique();
    }
}
