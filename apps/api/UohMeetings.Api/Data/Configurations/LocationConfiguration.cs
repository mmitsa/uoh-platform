using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class LocationConfiguration : IEntityTypeConfiguration<Location>
{
    public void Configure(EntityTypeBuilder<Location> b)
    {
        b.ToTable("locations");
        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.NameAr).HasColumnName("name_ar").HasMaxLength(300);
        b.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(300);
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(1000);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(1000);
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.Building).HasColumnName("building").HasMaxLength(200);
        b.Property(x => x.Floor).HasColumnName("floor").HasMaxLength(50);
        b.Property(x => x.RoomNumber).HasColumnName("room_number").HasMaxLength(50);
        b.Property(x => x.Latitude).HasColumnName("latitude");
        b.Property(x => x.Longitude).HasColumnName("longitude");
        b.Property(x => x.MapImageUrl).HasColumnName("map_image_url").HasMaxLength(500);
        b.Property(x => x.ParentLocationId).HasColumnName("parent_location_id");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasOne(x => x.ParentLocation)
         .WithMany(x => x.ChildLocations)
         .HasForeignKey(x => x.ParentLocationId)
         .OnDelete(DeleteBehavior.SetNull);

        b.HasIndex(x => x.Type);
        b.HasIndex(x => x.ParentLocationId);
    }
}
