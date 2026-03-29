using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AdGroupRoleMappingConfiguration : IEntityTypeConfiguration<AdGroupRoleMapping>
{
    public void Configure(EntityTypeBuilder<AdGroupRoleMapping> b)
    {
        b.ToTable("ad_group_role_mappings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.AdGroupId).HasColumnName("ad_group_id").HasMaxLength(128);
        b.Property(x => x.AdGroupDisplayName).HasColumnName("ad_group_display_name").HasMaxLength(500);
        b.Property(x => x.RoleId).HasColumnName("role_id");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.Priority).HasColumnName("priority");
        b.Property(x => x.CreatedByObjectId).HasColumnName("created_by_object_id").HasMaxLength(128);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => new { x.AdGroupId, x.RoleId }).IsUnique();
        b.HasIndex(x => x.IsActive);

        b.HasOne(x => x.Role)
         .WithMany()
         .HasForeignKey(x => x.RoleId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
