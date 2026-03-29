using FluentValidation;
using static UohMeetings.Api.Controllers.TasksController;

namespace UohMeetings.Api.Validators;

public sealed class UpdateTaskProgressRequestValidator : AbstractValidator<UpdateTaskProgressRequest>
{
    public UpdateTaskProgressRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum().WithMessage("Invalid task status.");
        RuleFor(x => x.Progress).InclusiveBetween(0, 100).WithMessage("Progress must be between 0 and 100.");
    }
}

public sealed class UpsertSubTaskRequestValidator : AbstractValidator<UpsertSubTaskRequest>
{
    public UpsertSubTaskRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Status).IsInEnum();
    }
}
