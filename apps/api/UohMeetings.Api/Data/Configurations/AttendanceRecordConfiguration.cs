using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AttendanceRecordConfiguration : IEntityTypeConfiguration<AttendanceRecord>
{
    public void Configure(EntityTypeBuilder<AttendanceRecord> b)
    {
        b.ToTable("mom_attendance");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MomId).HasColumnName("mom_id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id");
        b.Property(x => x.DisplayName).HasColumnName("display_name");
        b.Property(x => x.Email).HasColumnName("email");
        b.Property(x => x.IsPresent).HasColumnName("is_present");
        b.Property(x => x.AbsenceReason).HasColumnName("absence_reason");
        b.Property(x => x.AttendanceStatus).HasColumnName("attendance_status").HasDefaultValue("present");
        b.Property(x => x.CheckedInAtUtc).HasColumnName("checked_in_at_utc");
        b.HasIndex(x => new { x.MomId, x.UserObjectId }).IsUnique();
        b.HasIndex(x => new { x.MomId, x.IsPresent });
    }
}
