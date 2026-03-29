using FluentValidation;
using static UohMeetings.Api.Controllers.SurveysController;

namespace UohMeetings.Api.Validators;

public sealed class CreateSurveyRequestValidator : AbstractValidator<CreateSurveyRequest>
{
    public CreateSurveyRequestValidator()
    {
        RuleFor(x => x.TitleAr).NotEmpty().MaximumLength(500);
        RuleFor(x => x.TitleEn).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Type).NotEmpty().Must(t => new[] { "general", "poll" }.Contains(t))
            .WithMessage("Survey type must be 'general' or 'poll'.");
        RuleFor(x => x.TargetAudience).NotEmpty().Must(t => new[] { "staff", "public" }.Contains(t))
            .WithMessage("Target audience must be 'staff' or 'public'.");
        RuleFor(x => x.EndAtUtc).GreaterThan(x => x.StartAtUtc)
            .WithMessage("End date must be after start date.");
        RuleFor(x => x.Questions).NotNull().Must(q => q.Count >= 1)
            .WithMessage("At least one question is required.");
        RuleForEach(x => x.Questions).SetValidator(new QuestionDtoValidator());
    }
}

public sealed class QuestionDtoValidator : AbstractValidator<QuestionDto>
{
    public QuestionDtoValidator()
    {
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.TextAr).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.TextEn).NotEmpty().MaximumLength(1000);
    }
}

public sealed class SubmitResponseRequestValidator : AbstractValidator<SubmitResponseRequest>
{
    public SubmitResponseRequestValidator()
    {
        RuleFor(x => x.Answers).NotNull().Must(a => a.Count >= 1)
            .WithMessage("At least one answer is required.");
    }
}
