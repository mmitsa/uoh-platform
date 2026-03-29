using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class VoteSessionConfiguration : IEntityTypeConfiguration<VoteSession>
{
    public void Configure(EntityTypeBuilder<VoteSession> b)
    {
        b.ToTable("vote_sessions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MeetingId).HasColumnName("meeting_id");
        b.Property(x => x.MomId).HasColumnName("mom_id");
        b.Property(x => x.Title).HasColumnName("title");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.OpenedAtUtc).HasColumnName("opened_at_utc");
        b.Property(x => x.ClosedAtUtc).HasColumnName("closed_at_utc");
        b.HasMany(x => x.Options).WithOne().HasForeignKey(x => x.VoteSessionId);
        b.HasMany(x => x.Ballots).WithOne().HasForeignKey(x => x.VoteSessionId);
        b.HasIndex(x => x.MeetingId);
    }
}
