namespace UohMeetings.Api.Exceptions;

public sealed class ConflictException(string message, string? code = "CONFLICT")
    : DomainException(message, code);
