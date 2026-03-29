using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> b)
    {
        b.ToTable("app_users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.ObjectId).HasColumnName("object_id").HasMaxLength(128);
        b.Property(x => x.DisplayNameAr).HasColumnName("display_name_ar").HasMaxLength(200);
        b.Property(x => x.DisplayNameEn).HasColumnName("display_name_en").HasMaxLength(200);
        b.Property(x => x.Email).HasColumnName("email").HasMaxLength(320);
        b.Property(x => x.EmployeeId).HasColumnName("employee_id").HasMaxLength(50);
        b.Property(x => x.JobTitleAr).HasColumnName("job_title_ar").HasMaxLength(200);
        b.Property(x => x.JobTitleEn).HasColumnName("job_title_en").HasMaxLength(200);
        b.Property(x => x.Department).HasColumnName("department").HasMaxLength(200);
        b.Property(x => x.PhoneNumber).HasColumnName("phone_number").HasMaxLength(30);
        b.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(2000);
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.IsSynced).HasColumnName("is_synced");
        b.Property(x => x.LastLoginAtUtc).HasColumnName("last_login_at_utc");
        b.Property(x => x.LastSyncAtUtc).HasColumnName("last_sync_at_utc");
        b.Property(x => x.CreatedAtUtc).HasColumnName("created_at_utc");
        b.Property(x => x.UpdatedAtUtc).HasColumnName("updated_at_utc");

        b.HasIndex(x => x.ObjectId).IsUnique();
        b.HasIndex(x => x.Email);
        b.HasIndex(x => x.IsActive);
    }
}
