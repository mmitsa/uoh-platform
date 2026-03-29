using FluentValidation;
using static UohMeetings.Api.Controllers.MomsController;

namespace UohMeetings.Api.Validators;

public sealed class UpsertAttendanceRequestValidator : AbstractValidator<UpsertAttendanceRequest>
{
    public UpsertAttendanceRequestValidator()
    {
        RuleFor(x => x.UserObjectId).NotEmpty();
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}

public sealed class UpsertAgendaMinuteRequestValidator : AbstractValidator<UpsertAgendaMinuteRequest>
{
    public UpsertAgendaMinuteRequestValidator()
    {
        RuleFor(x => x.AgendaItemId).NotEmpty();
        RuleFor(x => x.Notes).NotNull();
    }
}

public sealed class UpsertDecisionRequestValidator : AbstractValidator<UpsertDecisionRequest>
{
    public UpsertDecisionRequestValidator()
    {
        RuleFor(x => x.TitleAr).NotEmpty().MaximumLength(500);
        RuleFor(x => x.TitleEn).NotEmpty().MaximumLength(500);
    }
}

