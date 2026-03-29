using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class CommitteeMemberConfiguration : IEntityTypeConfiguration<CommitteeMember>
{
    public void Configure(EntityTypeBuilder<CommitteeMember> b)
    {
        b.ToTable("committee_members");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.CommitteeId).HasColumnName("committee_id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id");
        b.Property(x => x.DisplayName).HasColumnName("display_name");
        b.Property(x => x.Email).HasColumnName("email");
        b.Property(x => x.Role).HasColumnName("role");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.HasIndex(x => new { x.CommitteeId, x.UserObjectId }).IsUnique();
    }
}
