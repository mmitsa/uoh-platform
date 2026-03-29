using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ChatConversationConfiguration : IEntityTypeConfiguration<ChatConversation>
{
    public void Configure(EntityTypeBuilder<ChatConversation> b)
    {
        b.ToTable("chat_conversations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.Type).HasColumnName("type");
        b.Property(x => x.NameAr).HasColumnName("name_ar");
        b.Property(x => x.NameEn).HasColumnName("name_en");
        b.Property(x => x.CreatedByOid).HasColumnName("created_by_oid");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.LastMessageAtUtc).HasColumnName("last_message_at_utc");

        b.HasIndex(x => x.CreatedByOid);
        b.HasIndex(x => x.LastMessageAtUtc);
    }
}
