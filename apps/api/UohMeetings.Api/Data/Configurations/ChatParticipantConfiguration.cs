using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ChatParticipantConfiguration : IEntityTypeConfiguration<ChatParticipant>
{
    public void Configure(EntityTypeBuilder<ChatParticipant> b)
    {
        b.ToTable("chat_participants");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ConversationId).HasColumnName("conversation_id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id");
        b.Property(x => x.DisplayName).HasColumnName("display_name");
        b.Property(x => x.Email).HasColumnName("email");
        b.Property(x => x.JoinedAtUtc).HasColumnName("joined_at_utc");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.LastReadAtUtc).HasColumnName("last_read_at_utc");
        b.Property(x => x.UnreadCount).HasColumnName("unread_count");

        b.HasIndex(x => new { x.ConversationId, x.UserObjectId }).IsUnique();
        b.HasIndex(x => x.UserObjectId);

        b.HasOne<ChatConversation>()
            .WithMany(c => c.Participants)
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
