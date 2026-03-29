using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class MeetingRoomConfiguration : IEntityTypeConfiguration<MeetingRoom>
{
    public void Configure(EntityTypeBuilder<MeetingRoom> b)
    {
        b.ToTable("meeting_rooms");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.NameAr).HasColumnName("name_ar").HasMaxLength(300);
        b.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(300);
        b.Property(x => x.Building).HasColumnName("building").HasMaxLength(200);
        b.Property(x => x.Floor).HasColumnName("floor").HasMaxLength(50);
        b.Property(x => x.Capacity).HasColumnName("capacity");
        b.Property(x => x.HasVideoConference).HasColumnName("has_video_conference");
        b.Property(x => x.HasProjector).HasColumnName("has_projector");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.Latitude).HasColumnName("latitude");
        b.Property(x => x.Longitude).HasColumnName("longitude");
        b.Property(x => x.MapUrl).HasColumnName("map_url").HasMaxLength(500);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
    }
}
