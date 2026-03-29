using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ShareLinkConfiguration : IEntityTypeConfiguration<ShareLink>
{
    public void Configure(EntityTypeBuilder<ShareLink> b)
    {
        b.ToTable("share_links");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.EntityType).HasColumnName("entity_type").HasConversion<string>();
        b.Property(x => x.EntityId).HasColumnName("entity_id");
        b.Property(x => x.Token).HasColumnName("token").HasMaxLength(64);
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedByObjectId).HasColumnName("created_by_object_id");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.ExpiresAtUtc).HasColumnName("expires_at_utc");
        b.Property(x => x.ScanCount).HasColumnName("scan_count");

        b.HasIndex(x => x.Token).IsUnique();
        b.HasIndex(x => new { x.EntityType, x.EntityId });
    }
}
