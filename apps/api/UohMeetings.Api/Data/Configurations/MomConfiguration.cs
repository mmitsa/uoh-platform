using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class MomConfiguration : IEntityTypeConfiguration<Mom>
{
    public void Configure(EntityTypeBuilder<Mom> b)
    {
        b.ToTable("moms");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MeetingId).HasColumnName("meeting_id");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.ApprovedAtUtc).HasColumnName("approved_at_utc");
        b.Property(x => x.WordDocUrl).HasColumnName("word_doc_url");
        b.Property(x => x.PdfDocUrl).HasColumnName("pdf_doc_url");
        b.HasMany(x => x.Attendance).WithOne().HasForeignKey(x => x.MomId);
        b.HasMany(x => x.AgendaMinutes).WithOne().HasForeignKey(x => x.MomId);
        b.HasMany(x => x.Decisions).WithOne().HasForeignKey(x => x.MomId);
        b.HasMany(x => x.Recommendations).WithOne().HasForeignKey(x => x.MomId);
        b.HasIndex(x => x.MeetingId).IsUnique();
    }
}
