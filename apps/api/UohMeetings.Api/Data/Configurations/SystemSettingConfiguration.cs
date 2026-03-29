using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SystemSettingConfiguration : IEntityTypeConfiguration<SystemSetting>
{
    public void Configure(EntityTypeBuilder<SystemSetting> b)
    {
        b.ToTable("system_settings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Key).HasColumnName("key").HasMaxLength(256);
        b.Property(x => x.Value).HasColumnName("value").HasMaxLength(4000);
        b.Property(x => x.IsEncrypted).HasColumnName("is_encrypted");
        b.Property(x => x.GroupKey).HasColumnName("group_key").HasMaxLength(100);
        b.Property(x => x.DataType).HasColumnName("data_type").HasMaxLength(50);
        b.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
        b.Property(x => x.UpdatedByObjectId).HasColumnName("updated_by_object_id").HasMaxLength(128);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => x.Key).IsUnique();
        b.HasIndex(x => x.GroupKey);
    }
}
