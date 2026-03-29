using FluentValidation;
using UohMeetings.Api.Services;
using static UohMeetings.Api.Controllers.RolesController;

namespace UohMeetings.Api.Validators;

public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.DisplayNameAr).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DisplayNameEn).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.EmployeeId).MaximumLength(50);
        RuleFor(x => x.JobTitleAr).MaximumLength(200);
        RuleFor(x => x.JobTitleEn).MaximumLength(200);
        RuleFor(x => x.Department).MaximumLength(200);
        RuleFor(x => x.PhoneNumber).MaximumLength(30);
    }
}

public sealed class CreateRoleRequestValidator : AbstractValidator<CreateRoleRequest>
{
    public CreateRoleRequestValidator()
    {
        RuleFor(x => x.Key).NotEmpty().MaximumLength(100)
            .Matches("^[a-zA-Z][a-zA-Z0-9_]*$")
            .WithMessage("Role key must start with a letter and contain only letters, numbers, and underscores.");
        RuleFor(x => x.NameAr).NotEmpty().MaximumLength(200);
        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(200);
    }
}

public sealed class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.NameAr).NotEmpty().MaximumLength(200);
        RuleFor(x => x.NameEn).NotEmpty().MaximumLength(200);
    }
}

public sealed class SetPermissionsRequestValidator : AbstractValidator<SetPermissionsRequest>
{
    public SetPermissionsRequestValidator()
    {
        RuleFor(x => x.PermissionIds).NotNull();
    }
}
