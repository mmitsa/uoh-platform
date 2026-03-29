using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class VoteBallotConfiguration : IEntityTypeConfiguration<VoteBallot>
{
    public void Configure(EntityTypeBuilder<VoteBallot> b)
    {
        b.ToTable("vote_ballots");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.VoteSessionId).HasColumnName("vote_session_id");
        b.Property(x => x.VoterObjectId).HasColumnName("voter_object_id");
        b.Property(x => x.VoterDisplayName).HasColumnName("voter_display_name");
        b.Property(x => x.SelectedOptionId).HasColumnName("selected_option_id");
        b.Property(x => x.CastAtUtc).HasColumnName("cast_at_utc");
        b.HasIndex(x => new { x.VoteSessionId, x.VoterObjectId }).IsUnique();
    }
}
