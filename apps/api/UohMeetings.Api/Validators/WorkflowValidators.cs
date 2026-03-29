using FluentValidation;
using static UohMeetings.Api.Controllers.WorkflowController;

namespace UohMeetings.Api.Validators;

public sealed class CreateTemplateRequestValidator : AbstractValidator<CreateTemplateRequest>
{
    public CreateTemplateRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200).WithMessage("Template name is required.");
        RuleFor(x => x.Domain).NotEmpty().MaximumLength(100).WithMessage("Domain is required.");
        RuleFor(x => x.Definition).NotNull().WithMessage("Workflow definition is required.");
    }
}

public sealed class StartInstanceRequestValidator : AbstractValidator<StartInstanceRequest>
{
    public StartInstanceRequestValidator()
    {
        RuleFor(x => x.TemplateId).NotEmpty();
        RuleFor(x => x.Domain).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EntityId).NotEmpty();
    }
}

public sealed class ApplyActionRequestValidator : AbstractValidator<ApplyActionRequest>
{
    public ApplyActionRequestValidator()
    {
        RuleFor(x => x.Action).NotEmpty().MaximumLength(100).WithMessage("Action is required.");
    }
}
