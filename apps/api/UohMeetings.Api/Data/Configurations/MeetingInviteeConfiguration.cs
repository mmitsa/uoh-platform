using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class MeetingInviteeConfiguration : IEntityTypeConfiguration<MeetingInvitee>
{
    public void Configure(EntityTypeBuilder<MeetingInvitee> b)
    {
        b.ToTable("meeting_invitees");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.MeetingId).HasColumnName("meeting_id");
        b.Property(x => x.Email).HasColumnName("email");
        b.Property(x => x.DisplayName).HasColumnName("display_name");
        b.Property(x => x.Role).HasColumnName("role").HasConversion<string>();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.HasIndex(x => new { x.MeetingId, x.Email }).IsUnique();
    }
}
