using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> b)
    {
        b.ToTable("chat_messages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ConversationId).HasColumnName("conversation_id");
        b.Property(x => x.SenderObjectId).HasColumnName("sender_object_id");
        b.Property(x => x.SenderDisplayName).HasColumnName("sender_display_name");
        b.Property(x => x.Content).HasColumnName("content");
        b.Property(x => x.Type).HasColumnName("type");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.IsDeleted).HasColumnName("is_deleted");

        b.HasIndex(x => new { x.ConversationId, x.CreatedAtUtc });
        b.HasIndex(x => x.SenderObjectId);

        b.HasOne<ChatConversation>()
            .WithMany(c => c.Messages)
            .HasForeignKey(x => x.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
