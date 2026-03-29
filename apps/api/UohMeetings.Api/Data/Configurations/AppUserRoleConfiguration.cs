using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AppUserRoleConfiguration : IEntityTypeConfiguration<AppUserRole>
{
    public void Configure(EntityTypeBuilder<AppUserRole> b)
    {
        b.ToTable("app_user_roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.RoleId).HasColumnName("role_id");
        b.Property(x => x.AssignedByObjectId).HasColumnName("assigned_by_object_id").HasMaxLength(128);
        b.Property(x => x.AssignedAtUtc).HasColumnName("assigned_at_utc");
        b.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc");

        b.HasOne(x => x.User).WithMany(u => u.UserRoles).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Role).WithMany(r => r.UserRoles).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => new { x.UserId, x.RoleId }).IsUnique();
    }
}
