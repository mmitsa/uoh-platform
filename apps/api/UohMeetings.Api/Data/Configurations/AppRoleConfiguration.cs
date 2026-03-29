using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AppRoleConfiguration : IEntityTypeConfiguration<AppRole>
{
    public void Configure(EntityTypeBuilder<AppRole> b)
    {
        b.ToTable("app_roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Key).HasColumnName("key").HasMaxLength(100);
        b.Property(x => x.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        b.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(200);
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(500);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(500);
        b.Property(x => x.IsSystem).HasColumnName("is_system");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => x.Key).IsUnique();
    }
}
