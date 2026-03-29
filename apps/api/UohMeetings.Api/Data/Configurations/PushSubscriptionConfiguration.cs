using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
{
    public void Configure(EntityTypeBuilder<PushSubscription> b)
    {
        b.ToTable("push_subscriptions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id").HasMaxLength(256);
        b.Property(x => x.Endpoint).HasColumnName("endpoint").HasMaxLength(2048);
        b.Property(x => x.P256dh).HasColumnName("p256dh").HasMaxLength(512);
        b.Property(x => x.Auth).HasColumnName("auth").HasMaxLength(512);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");

        b.HasIndex(x => x.UserObjectId);
        b.HasIndex(x => x.Endpoint).IsUnique();
    }
}
