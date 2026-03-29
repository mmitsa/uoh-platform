using FluentValidation;
using static UohMeetings.Api.Controllers.MeetingsController;

namespace UohMeetings.Api.Validators;

public sealed class CreateMeetingRequestValidator : AbstractValidator<CreateMeetingRequest>
{
    public CreateMeetingRequestValidator()
    {
        RuleFor(x => x.Type).IsInEnum().WithMessage("Invalid meeting type.");
        RuleFor(x => x.TitleAr).NotEmpty().MaximumLength(500).WithMessage("Arabic title is required (max 500 chars).");
        RuleFor(x => x.TitleEn).NotEmpty().MaximumLength(500).WithMessage("English title is required (max 500 chars).");
        RuleFor(x => x.StartDateTimeUtc).NotEmpty().WithMessage("Start date is required.");
        RuleFor(x => x.EndDateTimeUtc).GreaterThan(x => x.StartDateTimeUtc)
            .WithMessage("End date must be after start date.");
    }
}

public sealed class UpsertAgendaItemRequestValidator : AbstractValidator<UpsertAgendaItemRequest>
{
    public UpsertAgendaItemRequestValidator()
    {
        RuleFor(x => x.Order).GreaterThanOrEqualTo(0).WithMessage("Order must be >= 0.");
        RuleFor(x => x.TitleAr).NotEmpty().MaximumLength(500);
        RuleFor(x => x.TitleEn).NotEmpty().MaximumLength(500);
    }
}

public sealed class InviteeDtoValidator : AbstractValidator<InviteeDto>
{
    public InviteeDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Role).IsInEnum().WithMessage("Invalid invitee role.");
    }
}
