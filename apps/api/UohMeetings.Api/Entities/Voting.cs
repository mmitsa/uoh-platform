using UohMeetings.Api.Enums;

namespace UohMeetings.Api.Entities;

public sealed class VoteSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MeetingId { get; set; }
    public Guid? MomId { get; set; }

    public string Title { get; set; } = "";
    public VoteSessionStatus Status { get; set; } = VoteSessionStatus.Draft;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? OpenedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }

    public List<VoteOption> Options { get; set; } = new();
    public List<VoteBallot> Ballots { get; set; } = new();
}

public sealed class VoteOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VoteSessionId { get; set; }
    public string Label { get; set; } = "";
    public int Order { get; set; }
}

public sealed class VoteBallot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VoteSessionId { get; set; }

    public string VoterObjectId { get; set; } = "";
    public string? VoterDisplayName { get; set; }

    public Guid SelectedOptionId { get; set; }
    public DateTime CastAtUtc { get; set; } = DateTime.UtcNow;
}
