using FluentValidation;
using UohMeetings.Api.Enums;
using static UohMeetings.Api.Controllers.CommitteesController;

namespace UohMeetings.Api.Validators;

public sealed class CreateCommitteeRequestValidator : AbstractValidator<CreateCommitteeRequest>
{
    public CreateCommitteeRequestValidator()
    {
        RuleFor(x => x.Type).IsInEnum().WithMessage("Invalid committee type.");
        RuleFor(x => x.NameAr).NotEmpty().MaximumLength(300).WithMessage("Arabic name is required (max 300 chars).");
        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(300).WithMessage("English name is required (max 300 chars).");
        RuleFor(x => x.DescriptionAr).MaximumLength(2000).When(x => x.DescriptionAr is not null);
        RuleFor(x => x.DescriptionEn).MaximumLength(2000).When(x => x.DescriptionEn is not null);
        RuleFor(x => x.ObjectivesAr).MaximumLength(4000).When(x => x.ObjectivesAr is not null);
        RuleFor(x => x.ObjectivesEn).MaximumLength(4000).When(x => x.ObjectivesEn is not null);
        RuleFor(x => x.MaxMembers).GreaterThan(0).When(x => x.MaxMembers.HasValue)
            .WithMessage("Max members must be greater than 0.");

        // Sub-committees must have a parent
        RuleFor(x => x.ParentCommitteeId).NotNull()
            .When(x => x.Type == CommitteeType.Sub)
            .WithMessage("Sub-committees must specify a parent committee.");

        // Temporary committees should have dates
        RuleFor(x => x.StartDate).NotNull()
            .When(x => x.Type == CommitteeType.Temporary)
            .WithMessage("Temporary committees must have a start date.");

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .When(x => x.EndDate.HasValue && x.StartDate.HasValue)
            .WithMessage("End date must be after start date.");
    }
}

public sealed class UpdateCommitteeRequestValidator : AbstractValidator<UpdateCommitteeRequest>
{
    public UpdateCommitteeRequestValidator()
    {
        RuleFor(x => x.NameAr).MaximumLength(300).When(x => x.NameAr is not null);
        RuleFor(x => x.NameEn).MaximumLength(300).When(x => x.NameEn is not null);
        RuleFor(x => x.DescriptionAr).MaximumLength(2000).When(x => x.DescriptionAr is not null);
        RuleFor(x => x.DescriptionEn).MaximumLength(2000).When(x => x.DescriptionEn is not null);
        RuleFor(x => x.ObjectivesAr).MaximumLength(4000).When(x => x.ObjectivesAr is not null);
        RuleFor(x => x.ObjectivesEn).MaximumLength(4000).When(x => x.ObjectivesEn is not null);
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.MaxMembers).GreaterThan(0).When(x => x.MaxMembers.HasValue);
        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .When(x => x.EndDate.HasValue && x.StartDate.HasValue)
            .WithMessage("End date must be after start date.");
    }
}

public sealed class UpsertMemberRequestValidator : AbstractValidator<UpsertMemberRequest>
{
    public UpsertMemberRequestValidator()
    {
        RuleFor(x => x.UserObjectId).NotEmpty().WithMessage("User object ID is required.");
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200).WithMessage("Display name is required.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Valid email is required.");
        RuleFor(x => x.Role).NotEmpty().Must(r => new[] { "head", "secretary", "member", "observer" }.Contains(r))
            .WithMessage("Role must be head, secretary, member, or observer.");
    }
}
