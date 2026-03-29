using FluentValidation;
using static UohMeetings.Api.Controllers.AttachmentsController;

namespace UohMeetings.Api.Validators;

public sealed class AddAttachmentRequestValidator : AbstractValidator<AddAttachmentRequest>
{
    public AddAttachmentRequestValidator()
    {
        RuleFor(x => x.Domain).NotEmpty().Must(d => new[] { "committee", "meeting", "mom", "task", "survey" }.Contains(d))
            .WithMessage("Domain must be committee, meeting, mom, task, or survey.");
        RuleFor(x => x.EntityId).NotEmpty().WithMessage("Entity ID is required.");
        RuleFor(x => x.StoredFileId).NotEmpty().WithMessage("Stored file ID is required.");
        RuleFor(x => x.Title).NotEmpty().MaximumLength(300).WithMessage("Title is required (max 300 chars).");
    }
}
