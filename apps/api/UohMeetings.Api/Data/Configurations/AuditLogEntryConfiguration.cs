using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AuditLogEntryConfiguration : IEntityTypeConfiguration<AuditLogEntry>
{
    public void Configure(EntityTypeBuilder<AuditLogEntry> b)
    {
        b.ToTable("audit_log_entries");
        b.HasKey(x => x.Id);

        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.OccurredAtUtc).HasColumnName("occurred_at_utc");
        b.Property(x => x.TraceId).HasColumnName("trace_id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id");
        b.Property(x => x.UserDisplayName).HasColumnName("user_display_name");
        b.Property(x => x.UserEmail).HasColumnName("user_email");
        b.Property(x => x.UserRoles).HasColumnName("user_roles");
        b.Property(x => x.IpAddress).HasColumnName("ip_address");
        b.Property(x => x.UserAgent).HasColumnName("user_agent");
        b.Property(x => x.HttpMethod).HasColumnName("http_method");
        b.Property(x => x.Path).HasColumnName("path");
        b.Property(x => x.StatusCode).HasColumnName("status_code");
        b.Property(x => x.DurationMs).HasColumnName("duration_ms");
        b.Property(x => x.Success).HasColumnName("success");
        b.HasIndex(x => x.OccurredAtUtc);
        b.HasIndex(x => x.UserObjectId);
    }
}
