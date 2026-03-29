using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class StoredFileConfiguration : IEntityTypeConfiguration<StoredFile>
{
    public void Configure(EntityTypeBuilder<StoredFile> b)
    {
        b.ToTable("stored_files");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id").ValueGeneratedNever();
        b.Property(x => x.Provider).HasColumnName("provider");
        b.Property(x => x.BucketOrContainer).HasColumnName("bucket_or_container");
        b.Property(x => x.ObjectKey).HasColumnName("object_key");
        b.Property(x => x.FileName).HasColumnName("file_name");
        b.Property(x => x.ContentType).HasColumnName("content_type");
        b.Property(x => x.SizeBytes).HasColumnName("size_bytes");
        b.Property(x => x.Classification).HasColumnName("classification").HasConversion<string>();
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.HasIndex(x => new { x.Provider, x.BucketOrContainer, x.ObjectKey }).IsUnique();
    }
}
