using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class MeetingConfiguration : IEntityTypeConfiguration<Meeting>
{
    public void Configure(EntityTypeBuilder<Meeting> b)
    {
        b.ToTable("meetings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.CommitteeId).HasColumnName("committee_id");
        b.Property(x => x.TitleAr).HasColumnName("title_ar");
        b.Property(x => x.TitleEn).HasColumnName("title_en");
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(4000);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(4000);
        b.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
        b.Property(x => x.StartDateTimeUtc).HasColumnName("start_datetime_utc");
        b.Property(x => x.EndDateTimeUtc).HasColumnName("end_datetime_utc");
        b.Property(x => x.Location).HasColumnName("location");
        b.Property(x => x.MeetingRoomId).HasColumnName("meeting_room_id");
        b.HasOne(x => x.MeetingRoom).WithMany().HasForeignKey(x => x.MeetingRoomId).OnDelete(DeleteBehavior.SetNull);
        b.Property(x => x.OnlinePlatform).HasColumnName("online_platform").HasConversion<string>();
        b.Property(x => x.OnlineJoinUrl).HasColumnName("online_join_url");
        b.Property(x => x.CalendarEventId).HasColumnName("calendar_event_id");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
        b.HasMany(x => x.AgendaItems).WithOne(x => x.Meeting!).HasForeignKey(x => x.MeetingId);
        b.HasMany(x => x.Invitees).WithOne().HasForeignKey(x => x.MeetingId);
        b.HasIndex(x => x.StartDateTimeUtc);
        b.HasIndex(x => x.Status);
        b.HasIndex(x => x.CommitteeId);
    }
}
