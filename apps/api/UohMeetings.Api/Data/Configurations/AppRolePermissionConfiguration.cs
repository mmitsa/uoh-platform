using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AppRolePermissionConfiguration : IEntityTypeConfiguration<AppRolePermission>
{
    public void Configure(EntityTypeBuilder<AppRolePermission> b)
    {
        b.ToTable("app_role_permissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.RoleId).HasColumnName("role_id");
        b.Property(x => x.PermissionId).HasColumnName("permission_id");
        b.Property(x => x.GrantedAtUtc).HasColumnName("granted_at_utc");

        b.HasOne(x => x.Role).WithMany(r => r.RolePermissions).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Permission).WithMany(p => p.RolePermissions).HasForeignKey(x => x.PermissionId).OnDelete(DeleteBehavior.Cascade);

        b.HasIndex(x => new { x.RoleId, x.PermissionId }).IsUnique();
    }
}
