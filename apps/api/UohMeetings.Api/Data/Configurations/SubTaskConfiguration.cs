using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using UohMeetings.Api.Entities;

namespace UohMeetings.Api.Data.Configurations;

public sealed class SubTaskConfiguration : IEntityTypeConfiguration<SubTask>
{
    public void Configure(EntityTypeBuilder<SubTask> b)
    {
        b.ToTable("subtasks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.RecommendationTaskId).HasColumnName("recommendation_task_id");
        b.Property(x => x.Title).HasColumnName("title");
        b.Property(x => x.DueDateUtc).HasColumnName("due_date_utc");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.Progress).HasColumnName("progress").HasDefaultValue(0);
    }
}
