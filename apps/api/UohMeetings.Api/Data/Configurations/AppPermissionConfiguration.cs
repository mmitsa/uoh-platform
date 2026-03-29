using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AppPermissionConfiguration : IEntityTypeConfiguration<AppPermission>
{
    public void Configure(EntityTypeBuilder<AppPermission> b)
    {
        b.ToTable("app_permissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Key).HasColumnName("key").HasMaxLength(200);
        b.Property(x => x.Category).HasColumnName("category").HasMaxLength(50);
        b.Property(x => x.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        b.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(200);
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(500);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(500);
        b.Property(x => x.Route).HasColumnName("route").HasMaxLength(200);
        b.Property(x => x.SortOrder).HasColumnName("sort_order");
        b.Property(x => x.IsSystem).HasColumnName("is_system");

        b.HasIndex(x => x.Key).IsUnique();
        b.HasIndex(x => x.Category);
    }
}
