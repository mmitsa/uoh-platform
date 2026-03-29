using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class Committee
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public CommitteeType Type { get; set; } = CommitteeType.Permanent;
    public string NameAr { get; set; } = "";
    public string NameEn { get; set; } = "";
    public string DescriptionAr { get; set; } = "";
    public string DescriptionEn { get; set; } = "";

    public CommitteeStatus Status { get; set; } = CommitteeStatus.Draft;

    // Parent–child hierarchy (sub-committees belong to a main/council)
    public Guid? ParentCommitteeId { get; set; }
    public Committee? ParentCommittee { get; set; }
    public List<Committee> SubCommittees { get; set; } = new();

    // Temporary committees have a defined lifespan
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }

    // Governance
    public int? MaxMembers { get; set; }
    public string ObjectivesAr { get; set; } = "";
    public string ObjectivesEn { get; set; } = "";

    public Guid? WorkflowTemplateId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<CommitteeMember> Members { get; set; } = new();
}

public sealed class CommitteeMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CommitteeId { get; set; }

    public string UserObjectId { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";

    public string Role { get; set; } = "member"; // head/secretary/member/observer — kept as string for flexibility

    public bool IsActive { get; set; } = true;

    public Committee? Committee { get; set; }
}
