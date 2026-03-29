using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AgendaItemConfiguration : IEntityTypeConfiguration<AgendaItem>
{
    public void Configure(EntityTypeBuilder<AgendaItem> b)
    {
        b.ToTable("agenda_items");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MeetingId).HasColumnName("meeting_id");
        b.Property(x => x.Order).HasColumnName("order");
        b.Property(x => x.TitleAr).HasColumnName("title_ar");
        b.Property(x => x.TitleEn).HasColumnName("title_en");
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar");
        b.Property(x => x.DescriptionEn).HasColumnName("description_en");
        b.Property(x => x.DurationMinutes).HasColumnName("duration_minutes");
        b.Property(x => x.PresenterName).HasColumnName("presenter_name");
        b.HasIndex(x => new { x.MeetingId, x.Order }).IsUnique();
    }
}
