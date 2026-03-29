using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AgendaMinuteConfiguration : IEntityTypeConfiguration<AgendaMinute>
{
    public void Configure(EntityTypeBuilder<AgendaMinute> b)
    {
        b.ToTable("agenda_minutes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.MomId).HasColumnName("mom_id");
        b.Property(x => x.AgendaItemId).HasColumnName("agenda_item_id");
        b.Property(x => x.Notes).HasColumnName("notes");
        b.HasIndex(x => new { x.MomId, x.AgendaItemId }).IsUnique();
    }
}
