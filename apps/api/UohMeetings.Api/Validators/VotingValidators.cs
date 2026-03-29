using FluentValidation;
using static UohMeetings.Api.Controllers.VotingController;

namespace UohMeetings.Api.Validators;

public sealed class CreateVoteRequestValidator : AbstractValidator<CreateVoteRequest>
{
    public CreateVoteRequestValidator()
    {
        RuleFor(x => x.MeetingId).NotEmpty().WithMessage("Meeting ID is required.");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500).WithMessage("Title is required.");
        RuleFor(x => x.Options).NotNull().Must(o => o.Count >= 2)
            .WithMessage("At least 2 vote options are required.");
        RuleForEach(x => x.Options).NotEmpty().MaximumLength(300);
    }
}

public sealed class CastBallotRequestValidator : AbstractValidator<CastBallotRequest>
{
    public CastBallotRequestValidator()
    {
        RuleFor(x => x.SelectedOptionId).NotEmpty().WithMessage("Selected option is required.");
    }
}
