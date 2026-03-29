using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ChatMessageAttachmentConfiguration : IEntityTypeConfiguration<ChatMessageAttachment>
{
    public void Configure(EntityTypeBuilder<ChatMessageAttachment> b)
    {
        b.ToTable("chat_message_attachments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ChatMessageId).HasColumnName("chat_message_id");
        b.Property(x => x.StoredFileId).HasColumnName("stored_file_id");
        b.Property(x => x.FileName).HasColumnName("file_name");
        b.Property(x => x.ContentType).HasColumnName("content_type");
        b.Property(x => x.SizeBytes).HasColumnName("size_bytes");

        b.HasOne<ChatMessage>()
            .WithMany(m => m.Attachments)
            .HasForeignKey(x => x.ChatMessageId)
            .OnDelete(DeleteBehavior.Cascade);

        b.HasOne<StoredFile>()
            .WithMany()
            .HasForeignKey(x => x.StoredFileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
