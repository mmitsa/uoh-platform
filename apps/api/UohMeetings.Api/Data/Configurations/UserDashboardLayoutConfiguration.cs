using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class UserDashboardLayoutConfiguration : IEntityTypeConfiguration<UserDashboardLayout>
{
    public void Configure(EntityTypeBuilder<UserDashboardLayout> b)
    {
        b.ToTable("user_dashboard_layouts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.UserObjectId).HasColumnName("user_object_id").HasMaxLength(200);
        b.Property(x => x.LayoutName).HasColumnName("layout_name").HasMaxLength(100);
        b.Property(x => x.WidgetsJson).HasColumnName("widgets_json").HasColumnType("text");
        b.Property(x => x.IsDefault).HasColumnName("is_default");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => new { x.UserObjectId, x.LayoutName }).IsUnique();
    }
}
