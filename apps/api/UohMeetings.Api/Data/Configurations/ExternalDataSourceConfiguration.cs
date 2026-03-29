using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class ExternalDataSourceConfiguration : IEntityTypeConfiguration<ExternalDataSource>
{
    public void Configure(EntityTypeBuilder<ExternalDataSource> b)
    {
        b.ToTable("external_data_sources");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.NameAr).HasColumnName("name_ar").HasMaxLength(200);
        b.Property(x => x.NameEn).HasColumnName("name_en").HasMaxLength(200);
        b.Property(x => x.DescriptionAr).HasColumnName("description_ar").HasMaxLength(500);
        b.Property(x => x.DescriptionEn).HasColumnName("description_en").HasMaxLength(500);
        b.Property(x => x.ApiUrl).HasColumnName("api_url").HasMaxLength(1000);
        b.Property(x => x.HttpMethod).HasColumnName("http_method").HasMaxLength(10);
        b.Property(x => x.HeadersJson).HasColumnName("headers_json").HasColumnType("text");
        b.Property(x => x.RequestBodyTemplate).HasColumnName("request_body_template").HasColumnType("text");
        b.Property(x => x.ResponseMapping).HasColumnName("response_mapping").HasColumnType("text");
        b.Property(x => x.RefreshIntervalMinutes).HasColumnName("refresh_interval_minutes");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.LastFetchAtUtc).HasColumnName("last_fetch_at_utc");
        b.Property(x => x.LastFetchStatus).HasColumnName("last_fetch_status").HasMaxLength(500);
        b.Property(x => x.CreatedByObjectId).HasColumnName("created_by_object_id").HasMaxLength(200);
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");
    }
}
