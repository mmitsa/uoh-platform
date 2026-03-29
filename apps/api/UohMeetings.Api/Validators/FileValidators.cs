using FluentValidation;
using static UohMeetings.Api.Controllers.FilesController;

namespace UohMeetings.Api.Validators;

public sealed class PresignUploadDtoValidator : AbstractValidator<PresignUploadDto>
{
    public PresignUploadDtoValidator()
    {
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255).WithMessage("File name is required.");
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(100).WithMessage("Content type is required.");
        RuleFor(x => x.SizeBytes).GreaterThan(0).LessThanOrEqualTo(100 * 1024 * 1024)
            .WithMessage("File size must be between 1 byte and 100 MB.");
        RuleFor(x => x.Classification).IsInEnum().WithMessage("Invalid file classification.");
    }
}
