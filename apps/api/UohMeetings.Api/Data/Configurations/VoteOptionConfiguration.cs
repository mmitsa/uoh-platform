using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class VoteOptionConfiguration : IEntityTypeConfiguration<VoteOption>
{
    public void Configure(EntityTypeBuilder<VoteOption> b)
    {
        b.ToTable("vote_options");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.VoteSessionId).HasColumnName("vote_session_id");
        b.Property(x => x.Label).HasColumnName("label");
        b.Property(x => x.Order).HasColumnName("order");
        b.HasIndex(x => new { x.VoteSessionId, x.Order }).IsUnique();
    }
}
