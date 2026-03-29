using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class UserPreferenceConfiguration : IEntityTypeConfiguration<UserPreference>
{
    public void Configure(EntityTypeBuilder<UserPreference> b)
    {
        b.ToTable("user_preferences");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.UserId).HasColumnName("user_id");
        b.Property(x => x.Language).HasColumnName("language").HasMaxLength(10);
        b.Property(x => x.Theme).HasColumnName("theme").HasMaxLength(20);
        b.Property(x => x.NotifyByEmail).HasColumnName("notify_by_email");
        b.Property(x => x.NotifyByPush).HasColumnName("notify_by_push");
        b.Property(x => x.NotifyBySms).HasColumnName("notify_by_sms");
        b.Property(x => x.EmailDigestFrequency).HasColumnName("email_digest_frequency").HasMaxLength(20);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => x.UserId).IsUnique();

        b.HasOne(x => x.User)
         .WithOne(u => u.Preferences)
         .HasForeignKey<UserPreference>(x => x.UserId)
         .OnDelete(DeleteBehavior.Cascade);
    }
}
