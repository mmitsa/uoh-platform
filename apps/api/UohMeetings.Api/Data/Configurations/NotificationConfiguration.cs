using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.RecipientObjectId).HasColumnName("recipient_object_id");
        b.Property(x => x.RecipientEmail).HasColumnName("recipient_email");
        b.Property(x => x.Type).HasColumnName("type");
        b.Property(x => x.TitleAr).HasColumnName("title_ar");
        b.Property(x => x.TitleEn).HasColumnName("title_en");
        b.Property(x => x.BodyAr).HasColumnName("body_ar");
        b.Property(x => x.BodyEn).HasColumnName("body_en");
        b.Property(x => x.EntityType).HasColumnName("entity_type");
        b.Property(x => x.EntityId).HasColumnName("entity_id");
        b.Property(x => x.ActionUrl).HasColumnName("action_url");
        b.Property(x => x.IsRead).HasColumnName("is_read");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.ReadAtUtc).HasColumnName("read_at_utc");
        b.HasIndex(x => x.RecipientObjectId);
        b.HasIndex(x => new { x.RecipientObjectId, x.IsRead });
        b.HasIndex(x => x.CreatedAtUtc);
    }
}
